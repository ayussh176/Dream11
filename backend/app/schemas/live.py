from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FielderPositionInput(BaseModel):
    player_id: str
    player_name: str
    fielding_position: str
    x: float
    y: float
    is_wicketkeeper: bool = False


class VulnerableCorridor(BaseModel):
    zone_name: str
    start_angle_deg: float
    end_angle_deg: float
    gap_width_meters: float
    boundary_risk: str  # Low, Moderate, High, Critical
    explanation: str
    sector_coords: List[List[float]] = []  # Polygon coordinates for SVG visual rendering


class DismissalRisk(BaseModel):
    mode: str  # e.g., "Caught Deep Boundary", "Edged Behind", "Bowled/LBW"
    probability: float  # 0.0 to 1.0
    field_trap_description: str


class RealtimeFieldPrediction(BaseModel):
    match_id: str
    delivery_id: Optional[str] = None
    over_number: int
    ball_number: int
    batter_name: str
    bowler_name: str
    
    # Quantitative probabilities based on real-time field placement
    dot_probability: float = Field(..., description="Probability of 0 runs (0.0 to 1.0)")
    single_probability: float = Field(..., description="Probability of 1-2 runs (0.0 to 1.0)")
    boundary_four_probability: float = Field(..., description="Probability of 4 runs (0.0 to 1.0)")
    maximum_six_probability: float = Field(..., description="Probability of 6 runs (0.0 to 1.0)")
    wicket_probability: float = Field(..., description="Probability of a wicket on this ball (0.0 to 1.0)")
    expected_runs: float = Field(..., description="Mathematical Expected Runs (xR) on upcoming ball")
    
    # Tactical gap & shot predictions
    field_balance: str  # e.g. "6-3 Off-side Bias (Ring Packed)"
    offside_fielders: int
    legside_fielders: int
    boundary_riders: int
    inner_ring_fielders: int
    
    vulnerable_corridors: List[VulnerableCorridor]
    predicted_shot_type: str
    predicted_shot_angle_deg: float
    predicted_shot_target: List[float]  # [x, y] coordinates
    
    # Dismissal mechanism prediction
    dismissal_risks: List[DismissalRisk]
    primary_trap: str
    
    # AI broadcast explanation
    ai_broadcast_insight: str
    timestamp: str


class LiveMatchState(BaseModel):
    match_id: str
    match_name: str
    tournament: str
    venue: str
    batting_team: str
    bowling_team: str
    current_innings: int
    current_over: int
    current_ball: int
    score: int
    wickets: int
    target: Optional[int] = None
    required_rate: Optional[float] = None
    current_rate: float
    
    # Active players
    striker: Dict[str, Any]
    non_striker: Dict[str, Any]
    bowler: Dict[str, Any]
    
    # Active delivery
    current_delivery_id: str
    last_delivery_result: Optional[Dict[str, Any]] = None
    fielders: List[Dict[str, Any]]
    
    # Status
    is_live_stream_active: bool
    stream_tick_seconds: int = 5
    prediction: Optional[RealtimeFieldPrediction] = None


class LiveDeliveryIngestRequest(BaseModel):
    match_id: str
    over_number: int
    ball_number: int
    batter_name: str
    bowler_name: str
    runs: int = 0
    wickets: int = 0
    extras: int = 0
    delivery_type: str = "legal"
    speed_kph: Optional[float] = None
    commentary: str
    fielders: List[FielderPositionInput]

