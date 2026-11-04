export interface VulnerableCorridor {
  zone_name: string;
  start_angle_deg: float;
  end_angle_deg: float;
  gap_width_meters: number;
  boundary_risk: 'Low' | 'Moderate' | 'High' | 'Critical';
  explanation: string;
  sector_coords?: [number, number][];
}

export interface DismissalRisk {
  mode: string;
  probability: number;
  field_trap_description: string;
}

export interface RealtimeFieldPrediction {
  match_id: string;
  delivery_id?: string;
  over_number: number;
  ball_number: number;
  batter_name: string;
  bowler_name: string;
  dot_probability: number;
  single_probability: number;
  boundary_four_probability: number;
  maximum_six_probability: number;
  wicket_probability: number;
  expected_runs: number;
  field_balance: string;
  offside_fielders: number;
  legside_fielders: number;
  boundary_riders: number;
  inner_ring_fielders: number;
  vulnerable_corridors: VulnerableCorridor[];
  predicted_shot_type: string;
  predicted_shot_angle_deg: number;
  predicted_shot_target: [number, number];
  dismissal_risks: DismissalRisk[];
  primary_trap: string;
  ai_broadcast_insight: string;
  timestamp: string;
}

export interface LivePlayerStats {
  id?: string;
  name: string;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  strike_rate?: number;
  overs?: string;
  runs_conceded?: number;
  wickets?: number;
  economy_rate?: number;
}

export interface LiveFielder {
  id: string;
  player_id?: string;
  player_name: string;
  fielding_position: string;
  x: number;
  y: number;
  is_wicketkeeper: boolean;
  has_moved?: boolean;
}

export interface LastDeliveryResult {
  runs: number;
  wickets: number;
  extras: number;
  commentary: string;
  speed_kph: number;
  shot_type: string;
}

export interface LiveMatchState {
  match_id: string;
  match_name: string;
  tournament: string;
  venue: string;
  batting_team: string;
  bowling_team: string;
  current_innings: number;
  current_over: number;
  current_ball: number;
  score: number;
  wickets: number;
  target?: number;
  required_rate?: number;
  current_rate: number;
  striker: LivePlayerStats;
  non_striker: LivePlayerStats;
  bowler: LivePlayerStats;
  current_delivery_id: string;
  last_delivery_result?: LastDeliveryResult;
  fielders: LiveFielder[];
  is_live_stream_active: boolean;
  stream_tick_seconds: number;
  prediction?: RealtimeFieldPrediction;
}

type float = number;

