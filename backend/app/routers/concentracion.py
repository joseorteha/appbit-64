from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.concentracion import Concentracion
from app.schemas import ConcentracionOut

router = APIRouter(prefix="/concentracion", tags=["concentracion"])

PERIODOS = {"MADRUGADA", "MANHA", "TARDE", "NOITE"}


@router.get("", response_model=list[ConcentracionOut], summary="Datos de concentración (heatmap)")
def get_concentracion(
    periodo: str | None = Query(None, description="MADRUGADA | MANHA | TARDE | NOITE"),
    cluster: str | None = Query(None, description="Filtrar por cluster"),
    limit: int = Query(2000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """Concentración por antena/período para alimentar el mapa de calor."""
    if periodo and periodo.upper() not in PERIODOS:
        raise HTTPException(
            status_code=400,
            detail=f"periodo inválido. Válidos: {sorted(PERIODOS)}",
        )

    query = select(Concentracion).where(Concentracion.lat.is_not(None))
    if periodo:
        query = query.where(Concentracion.periodo == periodo.upper())
    if cluster:
        query = query.where(Concentracion.cluster == cluster)
    query = query.limit(limit)

    registros = db.execute(query).scalars().all()
    return [ConcentracionOut.model_validate(r) for r in registros]
