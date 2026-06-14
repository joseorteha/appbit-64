from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.indicadores import Indicador
from app.schemas import IndicadorOut

router = APIRouter(prefix="/verticales", tags=["verticales"])

VERTICALES_VALIDAS = {"salud_mental", "empleabilidad", "formaciones"}


@router.get(
    "/{vertical}",
    response_model=list[IndicadorOut],
    summary="Indicadores de una vertical",
)
def get_vertical(
    vertical: str,
    cluster: str | None = Query(None, description="Filtrar por un cluster específico"),
    db: Session = Depends(get_db),
):
    """Indicadores sociales de una vertical del MVP.

    Verticales válidas: `salud_mental`, `empleabilidad`, `formaciones`.
    """
    if vertical not in VERTICALES_VALIDAS:
        raise HTTPException(
            status_code=404,
            detail=f"Vertical '{vertical}' no existe. Válidas: {sorted(VERTICALES_VALIDAS)}",
        )

    query = select(Indicador).where(Indicador.vertical == vertical)
    if cluster:
        query = query.where(Indicador.cluster == cluster)

    indicadores = db.execute(query).scalars().all()
    return [IndicadorOut.model_validate(i) for i in indicadores]
