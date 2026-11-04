from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class FielderResponse(BaseModel):
    id: str
    player_id: str
    player_name: Optional[str] = None
    fielding_position: str
    x: float = Field(..., description="Normalized off-side (+X) or leg-side (-X) coordinate relative to batter (0,0)")
    y: float = Field(..., description="Normalized coordinate toward boundary (+Y) or behind batter (-Y)")
    is_wicketkeeper: bool
    delivery_id: str
    has_moved: bool = False
    prev_x: Optional[float] = None
    prev_y: Optional[float] = None
    prev_position: Optional[str] = None

    @field_validator("x", "y")
    @classmethod
    def validate_coordinate_range(cls, v: float) -> float:
        if v < -1.2 or v > 1.2:
            raise ValueError(f"Fielder coordinate {v} lies outside playable field boundary limits [-1.2, 1.2].")
        return v

    model_config = ConfigDict(from_attributes=True)


class FieldConfigurationResponse(BaseModel):
    id: str
    match_id: str
    delivery_id: str
    configuration_name: str
    total_fielders_count: int = Field(..., description="Total fielders excluding keeper (must be exactly 9)")
    has_wicketkeeper: bool
    fielders: List[FielderResponse]
    wicketkeeper: Optional[FielderResponse] = None

    model_config = ConfigDict(from_attributes=True)


class FieldMovementDifference(BaseModel):
    player_id: str
    player_name: str
    from_position: str
    to_position: str
    from_coord: dict
    to_coord: dict
    displacement_normalized: float
    description: str


class FieldComparisonResponse(BaseModel):
    match_id: str
    delivery_a_id: str
    delivery_b_id: str
    configuration_a_name: str
    configuration_b_name: str
    field_a: FieldConfigurationResponse
    field_b: FieldConfigurationResponse
    total_shifted_fielders: int
    movement_differences: List[FieldMovementDifference]
    tactical_summary: str
