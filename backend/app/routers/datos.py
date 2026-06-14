from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DatosRequest, DatosResponse
from app.services.agent import run_agent

router = APIRouter(prefix="/datos", tags=["datos (AI)"])


@router.post("", response_model=DatosResponse, summary="Consulta en lenguaje natural (agente IA)")
def post_datos(body: DatosRequest, db: Session = Depends(get_db)):
    """Recibe una pregunta en lenguaje natural y devuelve una respuesta del agente IA.

    El agente traduce la pregunta a SQL (text-to-SQL constreñido) sobre una
    whitelist de tablas y ejecuta la consulta de solo lectura.

    Si no hay `GROQ_API_KEY` configurada, responde en modo fallback con datos
    agregados de la base, sin llamar al LLM.
    """
    return run_agent(body.consulta, body.filtros or {}, db)
