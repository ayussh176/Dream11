from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.match_service import MatchService
from app.services.field_service import FieldService
from app.schemas.match import MatchSummaryResponse, MatchDetailResponse, MatchContextResponse
from app.schemas.delivery import DeliverySummaryResponse
from app.schemas.field import FieldConfigurationResponse, FieldComparisonResponse

router = APIRouter(prefix="/matches", tags=["Matches & Field"])


@router.get(
    "",
    response_model=List[MatchSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List all matches",
    description="Retrieve all available cricket matches with tournament, teams, and tracking metadata.",
)
def get_matches(db: Session = Depends(get_db)):
    return MatchService.get_all_matches(db)


@router.get(
    "/{match_id}",
    response_model=MatchDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get match details",
    description="Retrieve comprehensive match metadata including all delivery summaries.",
)
def get_match_detail(match_id: str, db: Session = Depends(get_db)):
    return MatchService.get_match_by_id(db, match_id)


@router.get(
    "/{match_id}/context",
    response_model=MatchContextResponse,
    status_code=status.HTTP_200_OK,
    summary="Get active match context",
    description="Retrieve live situational telemetry (scores, overs, current run rate, required run rate, and current duel).",
)
def get_match_context(match_id: str, db: Session = Depends(get_db)):
    return MatchService.get_match_context(db, match_id)


@router.get(
    "/{match_id}/deliveries",
    response_model=List[DeliverySummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List match deliveries",
    description="Retrieve all tracked ball-by-ball records for the specified match in sequence.",
)
def get_match_deliveries(match_id: str, db: Session = Depends(get_db)):
    return MatchService.get_match_deliveries(db, match_id)


@router.get(
    "/{match_id}/field/compare",
    response_model=FieldComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare two field configurations",
    description="Compare fielder positions and movement differences between two deliveries in the same match.",
)
def compare_fields(
    match_id: str,
    delivery_a_id: str = Query(..., description="First delivery ID to compare"),
    delivery_b_id: str = Query(..., description="Second delivery ID to compare"),
    db: Session = Depends(get_db),
):
    return FieldService.compare_fields(db, match_id, delivery_a_id, delivery_b_id)


@router.get(
    "/{match_id}/field/{delivery_id}",
    response_model=FieldConfigurationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get delivery field configuration",
    description="Retrieve the exact 9-fielder configuration (+ wicketkeeper) with normalized physical coordinates for a specific delivery.",
)
def get_delivery_field(match_id: str, delivery_id: str, db: Session = Depends(get_db)):
    return FieldService.get_field_by_delivery(db, match_id, delivery_id)

