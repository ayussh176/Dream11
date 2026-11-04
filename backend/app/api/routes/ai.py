from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.ai_service import AIService
from app.schemas.ai import (
    ExplainFieldRequest,
    ExplainChangeRequest,
    AskQuestionRequest,
    TacticalExplanationResponse,
)

router = APIRouter(prefix="/ai", tags=["AI Tactical Explainer"])


@router.post(
    "/explain-field",
    response_model=TacticalExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain active field placement",
    description="Analyzes the tactical rationale behind the field placement on the specified delivery, identifying protected areas and exposed corridors.",
)
def explain_field(req: ExplainFieldRequest, db: Session = Depends(get_db)):
    return AIService.explain_field(db, req)


@router.post(
    "/explain-change",
    response_model=TacticalExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain field movement between deliveries",
    description="Explains why the captain adjusted fielder positions compared with the previous delivery, detailing strategic trade-offs.",
)
def explain_change(req: ExplainChangeRequest, db: Session = Depends(get_db)):
    return AIService.explain_change(db, req)


@router.post(
    "/ask",
    response_model=TacticalExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask tactical question with grounded context",
    description="Answers natural language user questions regarding cricket field settings, match-up tactics, and captaincy decisions using Gemini.",
)
def ask_question(req: AskQuestionRequest, db: Session = Depends(get_db)):
    return AIService.ask_question(db, req)

