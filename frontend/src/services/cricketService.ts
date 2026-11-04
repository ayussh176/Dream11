import apiClient from './apiClient';
import {
  MatchSummary,
  MatchContext,
  DeliverySummary,
  FieldConfiguration,
  FieldComparison,
  PlayerProfile,
  PlayerStats,
} from '../types/cricket';

export const cricketService = {
  async getMatches(): Promise<MatchSummary[]> {
    const res = await apiClient.get<MatchSummary[]>('/matches');
    return res.data;
  },

  async getMatchContext(matchId: string): Promise<MatchContext> {
    const res = await apiClient.get<MatchContext>(`/matches/${matchId}/context`);
    return res.data;
  },

  async getMatchDeliveries(matchId: string): Promise<DeliverySummary[]> {
    const res = await apiClient.get<DeliverySummary[]>(`/matches/${matchId}/deliveries`);
    return res.data;
  },

  async getDeliveryField(matchId: string, deliveryId: string): Promise<FieldConfiguration> {
    const res = await apiClient.get<FieldConfiguration>(`/matches/${matchId}/field/${deliveryId}`);
    return res.data;
  },

  async compareFields(
    matchId: string,
    deliveryAId: string,
    deliveryBId: string
  ): Promise<FieldComparison> {
    const res = await apiClient.get<FieldComparison>(`/matches/${matchId}/field/compare`, {
      params: {
        delivery_a_id: deliveryAId,
        delivery_b_id: deliveryBId,
      },
    });
    return res.data;
  },

  async getPlayer(playerId: string): Promise<PlayerProfile> {
    const res = await apiClient.get<PlayerProfile>(`/players/${playerId}`);
    return res.data;
  },

  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const res = await apiClient.get<PlayerStats>(`/players/${playerId}/stats`);
    return res.data;
  },
};

export default cricketService;

