from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# SQLite necesita check_same_thread=False para usarse con FastAPI (múltiples threads).
connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    # Import explícito para registrar todos los modelos en Base.metadata
    from app.models import (  # noqa: F401
        antenas, concentracion, flujos, indicadores, demograficos, cobertura,
    )
    Base.metadata.create_all(bind=engine)
