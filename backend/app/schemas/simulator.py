from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


class SimulationAssumptions(BaseModel):
    reaction_time_sec: float = Field(default=0.40, ge=0.1, le=1.5, description="Fielder perception & reaction delay in seconds")
    fielder_speed_mps: float = Field(default=6.0, ge=1.0, le=12.0, description="Fielder average sprint speed in meters per second")
    ball_speed_mps: float = Field(default=28.0, ge=5.0, le=55.0, description="Initial ground ball speed off bat in meters per second")
    grid_spacing_m: float = Field(default=2.5, ge=1.0, le=8.0, description="Sampling grid spacing in physical meters")

    @field_validator("reaction_time_sec", "fielder_speed_mps", "ball_speed_mps", "grid_spacing_m")
    @classmethod
    def validate_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Simulation assumptions parameters must be positive numbers.")
        return v


class FielderPositionInput(BaseModel):
    id: str
    player_id: str
    player_name: Optional[str] = None
    fielding_position: str
    x: float = Field(..., ge=-1.2, le=1.2, description="Normalized X coordinate relative to batter (0,0)")
    y: float = Field(..., ge=-1.2, le=1.2, description="Normalized Y coordinate relative to batter (0,0)")
    is_wicketkeeper: bool = False

    @field_validator("x", "y")
    @classmethod
    def validate_boundary(cls, v: float) -> float:
        if not (-1.2 <= v <= 1.2):
            raise ValueError(f"Fielder coordinate {v} exceeds playable ground boundary [-1.2, 1.2].")
        return v


class EvaluateSimulationRequest(BaseModel):
    match_id: str = Field(..., description="Match ID")
    delivery_id: str = Field(..., description="Delivery ID reference")
    scenario: str = Field(..., description="Scenario key: 'cover', 'extra_cover', 'mid_off', 'midwicket'")
    original_fielders: List[FielderPositionInput] = Field(..., description="Baseline 9 fielders + keeper")
    custom_fielders: List[FielderPositionInput] = Field(..., description="Customized 9 fielders + keeper")
    assumptions: Optional[SimulationAssumptions] = Field(default_factory=SimulationAssumptions)

    @field_validator("scenario")
    @classmethod
    def validate_scenario(cls, v: str) -> str:
        valid_scenarios = ["cover", "extra_cover", "mid_off", "midwicket"]
        if v not in valid_scenarios:
            raise ValueError(f"Invalid scenario '{v}'. Allowed scenarios: {valid_scenarios}")
        return v

    @field_validator("custom_fielders", "original_fielders")
    @classmethod
    def validate_fielder_count(cls, fielders: List[FielderPositionInput]) -> List[FielderPositionInput]:
        non_keepers = [f for f in fielders if not f.is_wicketkeeper]
        if len(non_keepers) != 9:
            raise ValueError(f"Field configuration must contain exactly nine fielders excluding the wicketkeeper (found {len(non_keepers)}).")
        return fielders


class ZoneComparisonItem(BaseModel):
    zone_key: str
    zone_name: str
    is_primary_target: bool
    original_coverage_pct: float
    custom_coverage_pct: float
    difference_pct: float


class EvaluateSimulationResponse(BaseModel):
    scenario_key: str
    scenario_name: str
    description: str
    model_type: str = "GEOMETRY_BASED_ESTIMATE"
    original_coverage_pct: float
    custom_coverage_pct: float
    coverage_difference_pct: float
    covered_points: List[Dict[str, float]]
    exposed_points: List[Dict[str, float]]
    original_covered_points: List[Dict[str, float]]
    original_exposed_points: List[Dict[str, float]]
    trajectory_points: List[Dict[str, float]]
    zone_comparisons: List[ZoneComparisonItem]
    total_points_evaluated: int
    assumptions: Dict[str, Any]
    limitations: List[str]

    model_config = ConfigDict(from_attributes=True)


class ExplainTradeOffRequest(BaseModel):
    match_id: str
    delivery_id: str
    simulation_result: EvaluateSimulationResponse


class ExplainTradeOffResponse(BaseModel):
    summary: str
    improvements: List[str]
    trade_offs: List[str]
    situational_use_case: str
    disclaimer: str = Field(
        default="This is a hypothetical geometry-based estimate, not a real-world predictive outcome.",
        description="Non-predictive disclaimer"
    )
    is_ai_generated: bool = True

