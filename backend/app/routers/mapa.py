from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.antenas import Antena
from app.schemas import MapaOut, AntenaOut

router = APIRouter(prefix="/mapa", tags=["mapa"])


@router.get("", response_model=MapaOut, summary="Antenas y clusters para el mapa")
def get_mapa(db: Session = Depends(get_db)):
    """Devuelve las antenas con lat/lon y la lista de clusters únicos.

    Lo usa el frontend para pintar los marcadores en el mapa de Mapbox + DeckGL.
    """
    antenas = db.execute(select(Antena)).scalars().all()
    clusters = sorted({a.cluster for a in antenas if a.cluster})

    return MapaOut(
        antenas=[AntenaOut.model_validate(a) for a in antenas],
        clusters=clusters,
        total_antenas=len(antenas),
    )
