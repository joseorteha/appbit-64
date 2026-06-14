# Backend — App BiT 64

API FastAPI que sirve los datos de movilidad e indicadores sociales para el panel B2G.

## Stack
- **FastAPI** + **SQLAlchemy 2.0** (sync)
- **SQLite** en local (cero setup) · **PostgreSQL** en producción (Railway)
- **Agente IA** opcional: LangChain + Groq (Llama-3), con fallback sin API key

## Arranque rápido (local, SQLite)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows (PowerShell: .venv\Scripts\Activate.ps1)
# source .venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
copy .env.example .env            # cp en macOS/Linux

python seed.py                    # carga los CSVs pequeños a la BD
uvicorn main:app --reload
```

Abre **http://localhost:8000/docs** → Swagger UI para probar todos los endpoints.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado + conteo de filas por tabla |
| GET | `/mapa` | Antenas + clusters para el mapa |
| GET | `/verticales/{vertical}` | Indicadores (`salud_mental`/`empleabilidad`/`formaciones`) |
| GET | `/flujos` | Flujos origen-destino (filtro `min_usuarios`, `limit`) |
| GET | `/concentracion` | Heatmap por `periodo`/`cluster` |
| POST | `/datos` | Consulta en lenguaje natural (agente IA) |

## Agente IA (opcional)

Por defecto el endpoint `/datos` funciona en **modo fallback** (consulta directa a la
tabla `indicadores`). Para activar el LLM:

```bash
pip install -r requirements-ai.txt
# y en .env:  GROQ_API_KEY=tu_key   (https://console.groq.com)
```

El agente usa text-to-SQL constreñido: whitelist de 5 tablas, solo lectura.

## Base de datos

| Tabla | Origen |
|-------|--------|
| `antenas` | `antenas_flp.csv` (132 ERBs reales) |
| `concentracion` | `tensor_concentracao.csv` |
| `flujos` | `tensor_fluxo_vias.csv` |
| `demograficos` | `assinantes.csv` (agregado por cluster) |
| `indicadores` | Generados por `seed.py` (reales + sintéticos etiquetados) |

## Producción (Railway)

Define `DATABASE_URL` (PostgreSQL) y `GROQ_API_KEY` como variables de entorno.
El `Dockerfile` ya está listo. Corre `python seed.py` una vez tras el deploy
(o el ETL completo con los archivos pesados).
