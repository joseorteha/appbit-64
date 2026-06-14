from sqlalchemy import String, Integer, BigInteger, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Cobertura(Base):
    """Cobertura de red por cluster, agregada desde tensor_mobilidade.csv (2.7 GB).

    Métrica clave: pct_3g (WCDMA). Donde la red vieja domina hay exclusión
    digital — la gente no puede usar servicios remotos modernos.
    Producido por el ETL incremental (etl/etl.py --mobilidade), NO por seed.py.
    """
    __tablename__ = "cobertura"

    cluster: Mapped[str] = mapped_column(String(50), primary_key=True)
    total_sessoes: Mapped[int | None] = mapped_column(BigInteger)
    total_eventos: Mapped[int | None] = mapped_column(BigInteger)
    pct_3g: Mapped[float | None] = mapped_column(Float)  # WCDMA — proxy de exclusión digital
    pct_4g: Mapped[float | None] = mapped_column(Float)  # LTE
    pct_5g: Mapped[float | None] = mapped_column(Float)  # NR
    drop_pct_medio: Mapped[float | None] = mapped_column(Float)
    congestionamento_medio: Mapped[float | None] = mapped_column(Float)
    download_gb: Mapped[float | None] = mapped_column(Float)
