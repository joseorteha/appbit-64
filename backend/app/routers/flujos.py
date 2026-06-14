from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.models.flujos import Flujo
from app.schemas import FlujoOut, PontoFluxo

router = APIRouter(prefix="/flujos", tags=["flujos"])


@router.get("", response_model=list[FlujoOut], summary="Flujos origem-destino")
def get_flujos(
    min_usuarios: int = Query(100, ge=0, description="Filtrar flujos con al menos N usuarios"),
    limit: int = Query(500, ge=1, le=5000, description="Máximo de flujos a devolver"),
    db: Session = Depends(get_db),
):
    """Pares de antenas con flujo de usuarios, para dibujar líneas en el mapa.

    Ordenado de mayor a menor volumen de usuarios.
    """
    query = (
        select(Flujo)
        .where(Flujo.n_usuarios >= min_usuarios)
        .where(Flujo.lat_origem.is_not(None))
        .where(Flujo.lat_destino.is_not(None))
        .order_by(Flujo.n_usuarios.desc())
        .limit(limit)
    )
    flujos = db.execute(query).scalars().all()

    return [
        FlujoOut(
            origem=PontoFluxo(lat=f.lat_origem, lon=f.lon_origem, cluster=f.cluster_origem),
            destino=PontoFluxo(lat=f.lat_destino, lon=f.lon_destino, cluster=f.cluster_destino),
            n_usuarios=f.n_usuarios or 0,
            dist_km=f.dist_km,
            periodo_predominante=f.periodo_predominante,
        )
        for f in flujos
    ]
