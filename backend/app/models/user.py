from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    email       = Column(String, unique=True, nullable=False, index=True)
    name        = Column(String)
    picture_url = Column(String)
    role        = Column(String, default="viewer")  # viewer | analyst | admin
    created_at  = Column(DateTime, default=datetime.utcnow)
