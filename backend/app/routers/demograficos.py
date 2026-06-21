from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.demograficos import Demografico
from app.schemas import DemograficoOut

router = APIRouter(prefix="/demograficos", tags=["demograficos"])


@router.get("", response_model=list[DemograficoOut], summary="Distribución demográfica por cluster")
def get_demograficos(
    age_group: str | None = Query(None, description="18-24 | 25-34 | 35-44 | 45-54 | 55+"),
    cluster: str | None = Query(None, description="Filtrar por cluster"),
    limit: int = Query(500, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """Datos demográficos de suscriptores por cluster (edad, ingresos, flagship)."""
    query = select(Demografico)
    if age_group:
        query = query.where(Demografico.age_group == age_group)
    if cluster:
        query = query.where(Demografico.cluster == cluster)
    rows = db.execute(query.limit(limit)).scalars().all()
    return [DemograficoOut.model_validate(r) for r in rows]
