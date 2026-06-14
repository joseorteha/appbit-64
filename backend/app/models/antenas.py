from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Antena(Base):
    __tablename__ = "antenas"

    ecgi: Mapped[str] = mapped_column(String(20), primary_key=True)
    cluster: Mapped[str] = mapped_column(String(50))
    municipio: Mapped[str | None] = mapped_column(String(60))
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
