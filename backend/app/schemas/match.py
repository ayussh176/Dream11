from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.delivery import DeliverySummaryResponse


class MatchSummaryResponse(BaseModel):
    id: str
    match_name: str
    tournament: str
    venue: str
    match_date: str
    team_a: str
    team_b: str
    batting_team: str
    bowling_team: str
    current_innings: int
    match_status: str
    total_overs: int
    target_runs: Optional[int] = None
    is_demo: bool = True
    total_deliveries_tracked: int = 0

    model_config = ConfigDict(from_attributes=True)


class MatchDetailResponse(MatchSummaryResponse):
    deliveries: List[DeliverySummaryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class MatchContextResponse(BaseModel):
    match_id: str
    match_name: str
    tournament: str
    venue: str
    current_innings: int
    batting_team: str
    bowling_team: str
    current_over: int
    total_runs_scored: int
    total_wickets_lost: int
    target_runs: Optional[int] = None
    runs_needed: Optional[int] = None
    balls_remaining: Optional[int] = None
    required_run_rate: Optional[float] = None
    current_run_rate: float
    current_batter: Optional[str] = None
    current_bowler: Optional[str] = None
    last_completed_delivery_id: Optional[str] = None
    is_demo_dataset: bool = True
    notice: str = Field(
        default="This is an illustrative tactical scenario designed for DugoutAI demonstration.",
        description="Demo disclaimer",
    )

    model_config = ConfigDict(from_attributes=True)
