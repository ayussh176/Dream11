export type MatchFormat = 'T20' | 'ODI' | 'TEST';

export interface MatchSummary {
  id: string;
  match_name: string;
  tournament: string;
  venue: string;
  match_date: string;
  team_a: string;
  team_b: string;
  batting_team: string;
  bowling_team: string;
  current_innings: number;
  match_status: string;
  total_overs: number;
  target_runs?: number | null;
  is_demo: boolean;
  total_deliveries_tracked: number;
}

export interface MatchContext {
  match_id: string;
  match_name: string;
  tournament: string;
  venue: string;
  current_innings: number;
  batting_team: string;
  bowling_team: string;
  current_over: number;
  total_runs_scored: number;
  total_wickets_lost: number;
  target_runs?: number | null;
  runs_needed?: number | null;
  balls_remaining?: number | null;
  required_run_rate?: number | null;
  current_run_rate: number;
  current_batter?: string | null;
  current_bowler?: string | null;
  last_completed_delivery_id?: string | null;
  is_demo_dataset: boolean;
  notice: string;
}

export interface DeliverySummary {
  id: string;
  match_id: string;
  innings: number;
  over_number: number;
  ball_number: number;
  batter_id: string;
  bowler_id: string;
  batter_name?: string | null;
  bowler_name?: string | null;
  runs: number;
  wickets: number;
  extras: number;
  delivery_type: string;
  commentary: string;
  timestamp: string;
  speed_kph?: number | null;
  line?: string | null;
  length?: string | null;
  shot_type?: string | null;
  field_configuration_name?: string | null;
}

export interface Fielder {
  id: string;
  player_id: string;
  player_name?: string | null;
  fielding_position: string;
  x: number; // Normalized -1.0 to 1.0 (+X is off-side, -X is leg-side)
  y: number; // Normalized (+Y is boundary, -Y is behind batter)
  is_wicketkeeper: boolean;
  delivery_id: string;
  has_moved: boolean;
  prev_x?: number | null;
  prev_y?: number | null;
  prev_position?: string | null;
}

export interface FieldConfiguration {
  id: string;
  match_id: string;
  delivery_id: string;
  configuration_name: string;
  total_fielders_count: number;
  has_wicketkeeper: boolean;
  fielders: Fielder[];
  wicketkeeper?: Fielder | null;
}

export interface FieldMovementDifference {
  player_id: string;
  player_name: string;
  from_position: string;
  to_position: string;
  from_coord: { x: number; y: number };
  to_coord: { x: number; y: number };
  displacement_normalized: number;
  description: string;
}

export interface FieldComparison {
  match_id: string;
  delivery_a_id: string;
  delivery_b_id: string;
  configuration_a_name: string;
  configuration_b_name: string;
  field_a: FieldConfiguration;
  field_b: FieldConfiguration;
  total_shifted_fielders: number;
  movement_differences: FieldMovementDifference[];
  tactical_summary: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  team: string;
  role: string;
  batting_style: string;
  bowling_style: string;
  image_url?: string | null;
  fielding_position_specialty?: string | null;
}

export interface PlayerStats {
  player_id: string;
  name: string;
  team: string;
  role: string;
  matches_played: number;
  runs_scored: number;
  wickets_taken: number;
  catches: number;
  strike_rate: number;
  economy_rate: number;
  fielding_position_specialty?: string | null;
  is_demo_data: boolean;
}
