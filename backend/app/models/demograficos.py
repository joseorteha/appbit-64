from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Demografico(Base):
    __tablename__ = "demograficos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cluster: Mapped[str] = mapped_column(String(50))
    income_cluster: Mapped[str | None] = mapped_column(String(1))  # A/B/C/D
    age_group: Mapped[str | None] = mapped_column(String(5))       # 18-24/25-34/etc
    n_usuarios: Mapped[int | None] = mapped_column(Integer)
    pct_flagship: Mapped[float | None] = mapped_column(Float)
