import apiClient from './apiClient';
import { LiveMatchState, RealtimeFieldPrediction } from '../types/live';

export const liveService = {
  /**
   * Get list of currently active real live cricket matches from live feed
   */
  async getActiveLiveMatches(): Promise<any[]> {
    const res = await apiClient.get<any[]>('/live/external/matches');
    return res.data;
  },

  /**
   * Connect DugoutAI directly to a live cricket match
   */
  async connectExternalMatch(externalId: string): Promise<LiveMatchState> {
    const res = await apiClient.post<LiveMatchState>(`/live/external/connect/${externalId}`);
    return res.data;
  },

  /**
   * Get full live match state with telemetry and current field placement prediction
   */
  async getLiveState(matchId: string = 'demo-t20-m01'): Promise<LiveMatchState> {
    const res = await apiClient.get<LiveMatchState>(`/live/${matchId}/state`);
    return res.data;
  },

  /**
   * Advance to the next live delivery in stream
   */
  async advanceNextBall(matchId: string = 'demo-t20-m01'): Promise<LiveMatchState> {
    const res = await apiClient.post<LiveMatchState>(`/live/${matchId}/next-ball`);
    return res.data;
  },

  /**
   * Start live auto-play streaming
   */
  async startAutoPlay(matchId: string = 'demo-t20-m01', tickSeconds: number = 5): Promise<any> {
    const res = await apiClient.post(`/live/${matchId}/play?tick_seconds=${tickSeconds}`);
    return res.data;
  },

  /**
   * Pause live auto-play streaming
   */
  async pauseAutoPlay(matchId: string = 'demo-t20-m01'): Promise<any> {
    const res = await apiClient.post(`/live/${matchId}/pause`);
    return res.data;
  },

  /**
   * Reset live match stream back to ball 1
   */
  async resetStream(matchId: string = 'demo-t20-m01'): Promise<LiveMatchState> {
    const res = await apiClient.post<LiveMatchState>(`/live/${matchId}/reset`);
    return res.data;
  },

  /**
   * Compute real-time predictions for custom field layout
   */
  async predictCustomField(matchId: string, payload: any): Promise<RealtimeFieldPrediction> {
    const res = await apiClient.post<RealtimeFieldPrediction>(`/live/${matchId}/custom-predict`, payload);
    return res.data;
  },

  /**
   * Ingest external cricket delivery from webhook/live API
   */
  async ingestExternalDelivery(payload: any): Promise<LiveMatchState> {
    const res = await apiClient.post<LiveMatchState>(`/live/ingest`, payload);
    return res.data;
  },

  /**
   * Open WebSocket for real-time live telemetry stream
   */
  connectWebSocket(
    matchId: string = 'demo-t20-m01',
    onStateUpdate: (state: LiveMatchState) => void,
    onError?: (err: any) => void
  ): WebSocket {
    let wsUrl = '';
    const customApi = import.meta.env.VITE_API_URL;
    if (customApi && customApi.startsWith('http')) {
      try {
        const parsed = new URL(customApi);
        const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${parsed.host}/api/live/ws/${matchId}`;
      } catch {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}/api/live/ws/${matchId}`;
      }
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? '127.0.0.1:8000' : window.location.host;
      wsUrl = `${protocol}//${host}/api/live/ws/${matchId}`;
    }

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'STATE_UPDATE' && msg.data) {
          onStateUpdate(msg.data);
        }
      } catch (e) {
        console.warn('Failed to parse WS live message', e);
      }
    };

    ws.onerror = (err) => {
      console.warn('Live WebSocket note (HTTP fallback active):', err);
      if (onError) onError(err);
    };

    return ws;
  },
};
