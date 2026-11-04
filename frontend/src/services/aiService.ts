import apiClient from './apiClient';
import {
  ExplainFieldRequest,
  ExplainChangeRequest,
  AskQuestionRequest,
  TacticalExplanation,
} from '../types/ai';

export const aiService = {
  async explainField(
    matchId: string,
    deliveryId: string,
    fielderId?: string | null
  ): Promise<TacticalExplanation> {
    const payload: ExplainFieldRequest = {
      match_id: matchId,
      delivery_id: deliveryId,
      fielder_id: fielderId,
    };
    const res = await apiClient.post<TacticalExplanation>('/ai/explain-field', payload);
    return res.data;
  },

  async explainChange(
    matchId: string,
    deliveryId: string,
    previousDeliveryId?: string | null
  ): Promise<TacticalExplanation> {
    const payload: ExplainChangeRequest = {
      match_id: matchId,
      delivery_id: deliveryId,
      previous_delivery_id: previousDeliveryId,
    };
    const res = await apiClient.post<TacticalExplanation>('/ai/explain-change', payload);
    return res.data;
  },

  async askQuestion(
    matchId: string,
    deliveryId: string,
    question: string
  ): Promise<TacticalExplanation> {
    const payload: AskQuestionRequest = {
      match_id: matchId,
      delivery_id: deliveryId,
      question,
    };
    const res = await apiClient.post<TacticalExplanation>('/ai/ask', payload);
    return res.data;
  },
};

export default aiService;

