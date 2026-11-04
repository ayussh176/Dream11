export interface SimulationAssumptions {
  reaction_time_sec: number;
  fielder_speed_mps: number;
  ball_speed_mps: number;
  grid_spacing_m: number;
}

export interface FielderPositionInput {
  id: string;
  player_id: string;
  player_name?: string | null;
  fielding_position: string;
  x: number;
  y: number;
  is_wicketkeeper: boolean;
}

export interface EvaluateSimulationRequest {
  match_id: string;
  delivery_id: string;
  scenario: string;
  original_fielders: FielderPositionInput[];
  custom_fielders: FielderPositionInput[];
  assumptions?: SimulationAssumptions;
}

export interface ZoneComparisonItem {
  zone_key: string;
  zone_name: string;
  is_primary_target: boolean;
  original_coverage_pct: number;
  custom_coverage_pct: number;
  difference_pct: number;
}

export interface CoveragePoint {
  x: number;
  y: number;
}

export interface EvaluateSimulationResponse {
  scenario_key: string;
  scenario_name: string;
  description: string;
  model_type: string;
  original_coverage_pct: number;
  custom_coverage_pct: number;
  coverage_difference_pct: number;
  covered_points: CoveragePoint[];
  exposed_points: CoveragePoint[];
  original_covered_points: CoveragePoint[];
  original_exposed_points: CoveragePoint[];
  trajectory_points: CoveragePoint[];
  zone_comparisons: ZoneComparisonItem[];
  total_points_evaluated: number;
  assumptions: Record<string, any>;
  limitations: string[];
}

export interface ExplainTradeOffRequest {
  match_id: string;
  delivery_id: string;
  simulation_result: EvaluateSimulationResponse;
}

export interface ExplainTradeOffResponse {
  summary: string;
  improvements: string[];
  trade_offs: string[];
  situational_use_case: string;
  disclaimer: string;
  is_ai_generated: boolean;
}

export type SimulationViewMode = 'custom' | 'original' | 'difference';
