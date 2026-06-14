from datetime import date
from sqlalchemy import String, Integer, BigInteger, Float, Date, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Concentracion(Base):
    """Concentración por antena, día y período (tensor_concentracao.csv)."""
    __tablename__ = "concentracion"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ecgi: Mapped[str | None] = mapped_column(String(20), ForeignKey("antenas.ecgi"), index=True)
    cluster: Mapped[str | None] = mapped_column(String(50), index=True)
    municipio: Mapped[str | None] = mapped_column(String(60))
    day_date: Mapped[date | None] = mapped_column(Date)
    periodo: Mapped[str | None] = mapped_column(String(12), index=True)  # MADRUGADA/MANHA/TARDE/NOITE
    n_usuarios: Mapped[int | None] = mapped_column(Integer)
    n_sessoes: Mapped[int | None] = mapped_column(Integer)
    download_bytes: Mapped[int | None] = mapped_column(BigInteger)
    upload_bytes: Mapped[int | None] = mapped_column(BigInteger)
    dur_media_s: Mapped[int | None] = mapped_column(Integer)
    drop_pct_medio: Mapped[float | None] = mapped_column(Float)
    congestionamento_medio: Mapped[float | None] = mapped_column(Float)
    chamadas_total: Mapped[int | None] = mapped_column(Integer)
    mensagens_total: Mapped[int | None] = mapped_column(Integer)
    lat: Mapped[float | None] = mapped_column(Float)
    lon: Mapped[float | None] = mapped_column(Float)


Index("ix_concentracion_cluster_periodo", Concentracion.cluster, Concentracion.periodo)
