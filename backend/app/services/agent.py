"""Agente IA: text-to-SQL constreñido sobre la base de datos.

Diseño robusto en dos modos:

1. **Modo LLM** (si hay GROQ_API_KEY y langchain instalado): traduce la
   pregunta en lenguaje natural a SQL usando Llama-3 vía Groq, sobre una
   whitelist de tablas y en solo lectura.

2. **Modo fallback** (sin API key o sin langchain): responde consultando
   directamente la tabla `indicadores` por la vertical detectada en la
   pregunta. Permite demostrar el endpoint sin depender del LLM.
"""
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.config import settings
from app.models.indicadores import Indicador
from app.models.concentracion import Concentracion
from app.schemas import DatosResponse, DatoItem

# El agente SOLO puede leer estas tablas. Nunca DROP/UPDATE/DELETE/INSERT.
TABLAS_PERMITIDAS = ["antenas", "concentracion", "flujos", "indicadores", "demograficos"]

# Detección de vertical por palabras clave (usado en modo fallback)
KEYWORDS = {
    "salud_mental": ["salud", "mental", "conectividad", "exclusion", "exclusión", "apoyo", "remoto"],
    "empleabilidad": ["empleo", "laboral", "trabajo", "empleabilidad", "mano de obra", "ocupa"],
    "formaciones": ["joven", "jóvenes", "formaci", "formación", "tech", "curso", "educa", "capacita"],
}

FUENTES = ["Vísent CDRView v2", "datos sintéticos etiquetados"]

# Guía de dominio inyectada en cada consulta para que el LLM genere SQL correcto
# (los nombres de columna están en portugués, igual que el dataset Vísent).
GUIA_DOMINIO = """
Eres el analista de datos del panel App BiT 64, que detecta zonas de exclusión
digital en Florianópolis (Brasil) para gestores públicos.

Usa SOLO estas tablas y columnas REALES (no inventes nombres):
- cobertura (dato REAL agregado de 16.8M eventos): cluster, pct_3g, pct_4g, pct_5g,
  drop_pct_medio, congestionamento_medio, total_sessoes, download_gb.
  IMPORTANTE: pct_3g = proporción de tráfico en red vieja WCDMA/3G. MAYOR pct_3g
  = PEOR cobertura = MAYOR exclusión digital. Para "peor cobertura/más exclusión"
  ordena por pct_3g DESC.
- indicadores: cluster, vertical ('salud_mental'|'empleabilidad'|'formaciones'),
  metrica, valor, es_sintetico, fuente.
- concentracion: cluster, ecgi, periodo ('MADRUGADA'|'MANHA'|'TARDE'|'NOITE'),
  day_date, n_usuarios, congestionamento_medio, drop_pct_medio.
- demograficos: cluster, income_cluster ('A'|'B'|'C'|'D'), age_group, n_usuarios, pct_flagship.
- flujos: cluster_origem, cluster_destino, n_usuarios, dist_km, periodo_predominante.
- antenas: ecgi, cluster, municipio, lat, lon.

Reglas: responde SIEMPRE en español, claro y breve. Si la pregunta es sobre
cobertura/exclusión digital, consulta la tabla 'cobertura'. Cita los valores.
Pregunta del usuario:
""".strip()

_agent_cache = None


def _readonly_uri() -> str:
    """Devuelve una URI de solo-lectura para que el agente NUNCA pueda escribir.

    SQLite: usa el modo URI `?mode=ro` (bloqueo a nivel de driver — cualquier
    INSERT/UPDATE/DELETE/DROP falla aunque el LLM lo intente).
    PostgreSQL: en producción usa un usuario de BD con permisos solo de SELECT.
    """
    import os
    url = settings.database_url
    if settings.is_sqlite:
        path = url.split("sqlite:///")[-1]
        abs_path = os.path.abspath(path).replace("\\", "/")
        return f"sqlite:///file:{abs_path}?mode=ro&uri=true"
    return url  # Postgres: controlar permisos con un rol readonly


def _detectar_vertical(consulta: str, filtros: dict) -> str:
    if filtros.get("vertical") in KEYWORDS:
        return filtros["vertical"]
    q = consulta.lower()
    for vertical, kws in KEYWORDS.items():
        if any(kw in q for kw in kws):
            return vertical
    return "salud_mental"  # default


def _fallback(consulta: str, filtros: dict, db: Session) -> DatosResponse:
    vertical = _detectar_vertical(consulta, filtros)

    query = (
        select(Indicador)
        .where(Indicador.vertical == vertical)
        .order_by(Indicador.valor.desc())
        .limit(5)
    )
    top = db.execute(query).scalars().all()

    datos = [
        DatoItem(cluster=i.cluster, valor=i.valor, metrica=i.metrica, fuente=i.fuente or "sintético")
        for i in top
    ]

    if datos:
        nombres = ", ".join(d.cluster.replace("_", " ") for d in datos[:3])
        metrica = datos[0].metrica.replace("_", " ")
        respuesta = (
            f"Para la vertical '{vertical.replace('_', ' ')}', los clusters con mayor "
            f"{metrica} son: {nombres}. "
            f"El valor más alto es {datos[0].valor} en {datos[0].cluster.replace('_', ' ')}. "
            "Estas zonas son candidatas prioritarias para intervención pública."
        )
    else:
        respuesta = (
            "No hay indicadores cargados todavía. Ejecuta el seed/ETL para poblar "
            "la base de datos antes de consultar."
        )

    return DatosResponse(
        respuesta_ia=respuesta,
        datos=datos,
        fuentes=FUENTES,
        sql_generado=None,
    )


def _llm_agent(consulta: str, filtros: dict) -> DatosResponse | None:
    """Intenta usar el agente LangChain. Devuelve None si no está disponible."""
    global _agent_cache
    try:
        from langchain_groq import ChatGroq
        from langchain_community.utilities import SQLDatabase
        from langchain_community.agent_toolkits import create_sql_agent
    except ImportError:
        return None

    try:
        if _agent_cache is None:
            sql_db = SQLDatabase.from_uri(
                _readonly_uri(),
                include_tables=TABLAS_PERMITIDAS,
                sample_rows_in_table_info=2,
            )
            llm = ChatGroq(
                model=settings.groq_model,
                api_key=settings.groq_api_key,
                temperature=0,
            )
            _agent_cache = create_sql_agent(
                llm=llm,
                db=sql_db,
                verbose=False,
                agent_type="tool-calling",
                agent_executor_kwargs={"return_intermediate_steps": True},
            )

        contexto = f"{GUIA_DOMINIO}\n{consulta}"
        if filtros:
            contexto += f"\n\nFiltros activos: {filtros}"

        resultado = _agent_cache.invoke({"input": contexto})

        # Capturar el último SQL ejecutado (transparencia para el usuario)
        sql_generado = None
        for action, _obs in resultado.get("intermediate_steps", []):
            if getattr(action, "tool", "") == "sql_db_query":
                ti = action.tool_input
                sql_generado = ti.get("query") if isinstance(ti, dict) else str(ti)

        datos_llm: list = []
        for _action, obs in resultado.get("intermediate_steps", []):
            if isinstance(obs, str) and obs.strip().startswith("["):
                try:
                    import ast
                    parsed = ast.literal_eval(obs.strip())
                    if isinstance(parsed, list):
                        for row in parsed:
                            if isinstance(row, (list, tuple)) and len(row) >= 2:
                                datos_llm.append({
                                    "cluster": str(row[0]),
                                    "valor": float(row[1] or 0),
                                    "metrica": "llm_result",
                                    "fuente": "Vísent CDRView",
                                })
                            elif isinstance(row, dict) and "cluster" in row:
                                datos_llm.append({
                                    "cluster": row["cluster"],
                                    "valor": float(row.get("valor", row.get("n_usuarios", 0)) or 0),
                                    "metrica": "llm_result",
                                    "fuente": "Vísent CDRView",
                                })
                except Exception:
                    pass

        return DatosResponse(
            respuesta_ia=resultado.get("output", "Sin respuesta del agente."),
            datos=datos_llm,
            fuentes=FUENTES,
            sql_generado=sql_generado,
        )
    except Exception as e:
        # Reset cache so the next request re-initializes (e.g. after fixing GROQ_MODEL env var)
        _agent_cache = None
        import logging
        logging.getLogger(__name__).error("[agent] LLM error: %s", e)
        # Return None so run_agent falls back to the keyword-based response
        return None


def run_agent(consulta: str, filtros: dict, db: Session) -> DatosResponse:
    # Sin API key → modo fallback directo (no intenta cargar langchain)
    if settings.groq_api_key:
        respuesta = _llm_agent(consulta, filtros)
        if respuesta is not None:
            return respuesta
    return _fallback(consulta, filtros, db)


def agente_disponible() -> str:
    if not settings.groq_api_key:
        return "fallback (sin GROQ_API_KEY)"
    try:
        import langchain_groq  # noqa: F401
        return f"LLM activo ({settings.groq_model})"
    except ImportError:
        return "fallback (langchain no instalado)"
