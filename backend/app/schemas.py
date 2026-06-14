"""Schemas Pydantic para request/response.

Definen el contrato de la API y alimentan la documentación de Swagger (/docs).
"""
from datetime import date
from pydantic import BaseModel, ConfigDict, Field


# ─────────────────────────── Mapa ───────────────────────────
class AntenaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ecgi: str
    cluster: str
    municipio: str | None = None
    lat: float
    lon: float


class MapaOut(BaseModel):
    antenas: list[AntenaOut]
    clusters: list[str]
    total_antenas: int


# ─────────────────────────── Verticales ───────────────────────────
class IndicadorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cluster: str
    metrica: str
    valor: float
    periodo: str | None = None
    fuente: str | None = None
    es_sintetico: bool


# ─────────────────────────── Flujos ───────────────────────────
class PontoFluxo(BaseModel):
    lat: float
    lon: float
    cluster: str | None = None


class FlujoOut(BaseModel):
    origem: PontoFluxo
    destino: PontoFluxo
    n_usuarios: int
    dist_km: float | None = None
    periodo_predominante: str | None = None


# ─────────────────────────── Concentración ───────────────────────────
class ConcentracionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ecgi: str | None = None
    cluster: str | None = None
    municipio: str | None = None
    lat: float | None = None
    lon: float | None = None
    day_date: date | None = None
    periodo: str | None = None
    n_usuarios: int | None = None
    congestionamento_medio: float | None = None
    drop_pct_medio: float | None = None


# ─────────────────────────── Datos (AI Query) ───────────────────────────
class DatosRequest(BaseModel):
    consulta: str = Field(..., min_length=1, examples=[
        "¿Dónde falta conectividad para programas de salud mental?"
    ])
    filtros: dict[str, str] | None = Field(
        default=None,
        examples=[{"vertical": "salud_mental", "periodo": "MANHA"}],
    )


class DatoItem(BaseModel):
    cluster: str
    valor: float
    metrica: str
    fuente: str


class DatosResponse(BaseModel):
    respuesta_ia: str
    datos: list[DatoItem]
    fuentes: list[str]
    sql_generado: str | None = None


# ─────────────────────────── Cobertura ───────────────────────────
class CoberturaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    cluster: str
    total_sessoes: int | None = None
    pct_3g: float | None = None
    pct_4g: float | None = None
    pct_5g: float | None = None
    drop_pct_medio: float | None = None
    congestionamento_medio: float | None = None
    download_gb: float | None = None


# ─────────────────────────── Health ───────────────────────────
class HealthOut(BaseModel):
    status: str
    database: str
    agente_ia: str
    tablas: dict[str, int]
