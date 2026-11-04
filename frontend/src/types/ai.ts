export interface TacticalExplanation {
  summary: string;
  possible_reasons: string[];
  protected_regions: string[];
  potentially_exposed_regions: string[];
  supporting_evidence: string[];
  assumptions: string[];
  limitations: string[];
  confidence_label: string;
  is_ai_generated: boolean;
  model_used?: string | null;
  delivery_id?: string | null;
  configuration_name?: string | null;
  query?: string | null;
}

export interface ExplainFieldRequest {
  match_id: string;
  delivery_id: string;
  fielder_id?: string | null;
}

export interface ExplainChangeRequest {
  match_id: string;
  delivery_id: string;
  previous_delivery_id?: string | null;
}

export interface AskQuestionRequest {
  match_id: string;
  delivery_id: string;
  question: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text?: string;
  explanation?: TacticalExplanation;
}

