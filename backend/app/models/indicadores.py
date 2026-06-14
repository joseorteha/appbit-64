from sqlalchemy import String, Float, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Indicador(Base):
    __tablename__ = "indicadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cluster: Mapped[str] = mapped_column(String(50))
    vertical: Mapped[str] = mapped_column(String(30))  # salud_mental | empleabilidad | formaciones
    metrica: Mapped[str] = mapped_column(String(60))
    valor: Mapped[float] = mapped_column(Float)
    periodo: Mapped[str | None] = mapped_column(String(20))
    fuente: Mapped[str | None] = mapped_column(String(100))
    es_sintetico: Mapped[bool] = mapped_column(Boolean, default=True)
