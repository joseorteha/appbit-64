from sqlalchemy import String, Integer, Float, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Flujo(Base):
    """Flujos entre pares de antenas consecutivas (tensor_fluxo_vias.csv).

    Nombres de columna en portugués, idénticos al dataset Vísent (la traducción
    a español se hace en el frontend, no en la BD).
    """
    __tablename__ = "flujos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ecgi_origem: Mapped[str | None] = mapped_column(String(20), index=True)
    lat_origem: Mapped[float | None] = mapped_column(Float)
    lon_origem: Mapped[float | None] = mapped_column(Float)
    cluster_origem: Mapped[str | None] = mapped_column(String(50), index=True)
    municipio_origem: Mapped[str | None] = mapped_column(String(60))
    ecgi_destino: Mapped[str | None] = mapped_column(String(20))
    lat_destino: Mapped[float | None] = mapped_column(Float)
    lon_destino: Mapped[float | None] = mapped_column(Float)
    cluster_destino: Mapped[str | None] = mapped_column(String(50))
    municipio_destino: Mapped[str | None] = mapped_column(String(60))
    n_usuarios: Mapped[int | None] = mapped_column(Integer, index=True)
    n_transicoes: Mapped[int | None] = mapped_column(Integer)
    dist_km: Mapped[float | None] = mapped_column(Float)
    periodo_predominante: Mapped[str | None] = mapped_column(String(12))
    pct_do_cluster_origem: Mapped[float | None] = mapped_column(Float)


Index("ix_flujos_clusters", Flujo.cluster_origem, Flujo.cluster_destino)
