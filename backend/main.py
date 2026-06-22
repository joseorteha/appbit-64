from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.config import settings
from app.database import create_tables, get_db
from app.models.antenas import Antena
from app.models.concentracion import Concentracion
from app.models.flujos import Flujo
from app.models.indicadores import Indicador
from app.models.demograficos import Demografico
from app.models.cobertura import Cobertura
from app.routers import mapa, verticales, datos, flujos, concentracion, cobertura, demograficos, auth
from app.schemas import HealthOut
from app.services.agent import agente_disponible


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea las tablas al arrancar (idempotente)
    create_tables()
    yield


app = FastAPI(
    title="App BiT 64 — API",
    description=(
        "Panel de Datos Públicos (B2G) que cruza movilidad urbana con indicadores "
        "sociales para detectar zonas de exclusión digital en Florianópolis.\n\n"
        "Dataset: **Vísent CDRView** · Hackathon No Country App BiT"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(mapa.router)
app.include_router(verticales.router)
app.include_router(datos.router)
app.include_router(flujos.router)
app.include_router(concentracion.router)
app.include_router(cobertura.router)
app.include_router(demograficos.router)
app.include_router(auth.router)


@app.get("/health", response_model=HealthOut, tags=["health"], summary="Estado del servicio")
def health(db: Session = Depends(get_db)):
    """Verifica conexión a la base de datos y reporta el conteo de cada tabla."""
    tablas = {}
    try:
        tablas = {
            "antenas": db.execute(select(func.count()).select_from(Antena)).scalar() or 0,
            "concentracion": db.execute(select(func.count()).select_from(Concentracion)).scalar() or 0,
            "flujos": db.execute(select(func.count()).select_from(Flujo)).scalar() or 0,
            "indicadores": db.execute(select(func.count()).select_from(Indicador)).scalar() or 0,
            "demograficos": db.execute(select(func.count()).select_from(Demografico)).scalar() or 0,
            "cobertura": db.execute(select(func.count()).select_from(Cobertura)).scalar() or 0,
        }
        db_status = "sqlite" if settings.is_sqlite else "postgresql"
    except Exception as e:
        db_status = f"error: {e}"

    return HealthOut(
        status="ok",
        database=db_status,
        agente_ia=agente_disponible(),
        tablas=tablas,
    )


@app.get("/", tags=["health"], summary="Raíz")
def root():
    return {"app": "App BiT 64", "docs": "/docs", "health": "/health"}
