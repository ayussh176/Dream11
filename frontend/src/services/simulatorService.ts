import apiClient from './apiClient';
import {
  EvaluateSimulationRequest,
  EvaluateSimulationResponse,
  ExplainTradeOffRequest,
  ExplainTradeOffResponse,
} from '../types/simulator';

export const simulatorService = {
  async evaluateSimulation(req: EvaluateSimulationRequest): Promise<EvaluateSimulationResponse> {
    const res = await apiClient.post<EvaluateSimulationResponse>('/simulator/evaluate', req);
    return res.data;
  },

  async explainTradeOffs(req: ExplainTradeOffRequest): Promise<ExplainTradeOffResponse> {
    const res = await apiClient.post<ExplainTradeOffResponse>('/simulator/explain-tradeoffs', req);
    return res.data;
  },
};

export default simulatorService;

