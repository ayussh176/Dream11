from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.player_service import PlayerService
from app.schemas.player import PlayerResponse, PlayerStatsResponse

router = APIRouter(prefix="/players", tags=["Players"])


@router.get(
    "/{player_id}",
    response_model=PlayerResponse,
    status_code=status.HTTP_200_OK,
    summary="Get player profile",
    description="Retrieve player details, team, role, batting hand, and bowling style.",
)
def get_player(player_id: str, db: Session = Depends(get_db)):
    return PlayerService.get_player_by_id(db, player_id)


@router.get(
    "/{player_id}/stats",
    response_model=PlayerStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get player tactical statistics",
    description="Retrieve statistical benchmarks (runs, wickets, catches, strike rate, economy rate). Clearly marked as demonstration data.",
)
def get_player_stats(player_id: str, db: Session = Depends(get_db)):
    return PlayerService.get_player_stats(db, player_id)

