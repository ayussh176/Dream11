from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PlayerBase(BaseModel):
    id: str
    name: str
    team: str
    role: str
    batting_style: str
    bowling_style: str
    image_url: Optional[str] = None


class PlayerResponse(PlayerBase):
    fielding_position_specialty: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PlayerStatsResponse(BaseModel):
    player_id: str
    name: str
    team: str
    role: str
    matches_played: int
    runs_scored: int
    wickets_taken: int
    catches: int
    strike_rate: float
    economy_rate: float
    fielding_position_specialty: Optional[str] = None
    is_demo_data: bool = Field(default=True, description="Explicit flag indicating demonstration statistics")
    model_config = ConfigDict(from_attributes=True)
