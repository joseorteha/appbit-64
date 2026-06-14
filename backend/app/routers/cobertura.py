from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.cobertura import Cobertura
from app.schemas import CoberturaOut

router = APIRouter(prefix="/cobertura", tags=["cobertura"])


@router.get("", response_model=list[CoberturaOut], summary="Cobertura de red por cluster (dato REAL)")
def get_cobertura(db: Session = Depends(get_db)):
    """Cobertura de red por cluster, agregada de tensor_mobilidade.csv (16.8M eventos).

    `pct_3g` (WCDMA) alto = dominancia de red vieja = mayor exclusión digital.
    Ordenado de mayor a menor exclusión. Vacío hasta correr `etl.py --mobilidade`.
    """
    registros = db.execute(
        select(Cobertura).order_by(Cobertura.pct_3g.desc())
    ).scalars().all()
    return [CoberturaOut.model_validate(r) for r in registros]
