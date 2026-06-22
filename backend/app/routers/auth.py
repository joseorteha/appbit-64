from datetime import datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleAuthRequest(BaseModel):
    credential: str  # access_token or id_token from Google OAuth


async def _get_google_user(credential: str) -> dict:
    """Verify credential via Google's userinfo endpoint (works with access_token)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {credential}"},
        )
    if resp.status_code != 200:
        # Fallback: try tokeninfo for ID tokens
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp2 = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
            )
        if resp2.status_code != 200:
            raise HTTPException(status_code=401, detail="Token de Google inválido")
        return resp2.json()
    return resp.json()


def _create_jwt(user: User) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.jwt_expiry_days)
    payload = {"sub": str(user.id), "email": user.email, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


@router.post("/google", summary="Autenticar con Google")
async def auth_google(body: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Recibe el access_token de Google (OAuth implicit flow),
    crea o actualiza el usuario en BD, y devuelve un JWT propio.
    """
    google_data = await _get_google_user(body.credential)

    email = google_data.get("email")
    name  = google_data.get("name") or google_data.get("email", "Usuario")
    pic   = google_data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="Email no disponible en el token de Google")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=name, picture_url=pic)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.name        = name
        user.picture_url = pic
        db.commit()

    return {
        "access_token": _create_jwt(user),
        "token_type":   "bearer",
        "user": {
            "email":   user.email,
            "name":    user.name,
            "picture": user.picture_url or "",
            "role":    user.role,
        },
    }
