from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.player import PlayerResponse


class DeliverySummaryResponse(BaseModel):
    id: str
    match_id: str
    innings: int
    over_number: int
    ball_number: int
    batter_id: str
    bowler_id: str
    batter_name: Optional[str] = None
    bowler_name: Optional[str] = None
    runs: int
    wickets: int
    extras: int
    delivery_type: str
    commentary: str
    timestamp: datetime
    speed_kph: Optional[float] = None
    line: Optional[str] = None
    length: Optional[str] = None
    shot_type: Optional[str] = None
    field_configuration_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DeliveryDetailResponse(DeliverySummaryResponse):
    batter: Optional[PlayerResponse] = None
    bowler: Optional[PlayerResponse] = None

    model_config = ConfigDict(from_attributes=True)
