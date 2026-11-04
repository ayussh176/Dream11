import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { LiveMatchState, LiveFielder } from '../types/live';
import { liveService } from '../services/liveService';
import { LiveGroundSVG } from '../features/live/LiveGroundSVG';
import { PredictionMetricsCard } from '../features/live/PredictionMetricsCard';
import { TacticalVulnerabilityPanel } from '../features/live/TacticalVulnerabilityPanel';
import { GeminiBroadcastInsight } from '../features/live/GeminiBroadcastInsight';
import { LiveControlBar } from '../features/live/LiveControlBar';
import { LiveBallTicker } from '../features/live/LiveBallTicker';
import { FielderInfoDrawer } from '../features/radar/FielderInfoDrawer';
import { Eye, Target } from 'lucide-react';

export const LiveArenaPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const matchId = searchParams.get('matchId') || 'demo-t20-m01';

  const [liveState, setLiveState] = useState<LiveMatchState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SVG display toggles
  const [showVulnerabilityArc, setShowVulnerabilityArc] = useState<boolean>(true);
  const [showPredictedShot, setShowPredictedShot] = useState<boolean>(true);

  // Selected fielder for drawer inspection
  const [selectedFielder, setSelectedFielder] = useState<LiveFielder | null>(null);
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // Load available live matches list on mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const list = await liveService.getActiveLiveMatches();
        setAvailableMatches(list);
      } catch (e) {
        console.warn('Failed to load active live matches list', e);
      }
    };
    fetchMatches();
  }, []);

  // Switch to selected live match
  const handleSelectMatch = (selectedId: string) => {
    setSearchParams({ matchId: selectedId });
  };

  // Load initial live state
  const loadInitialState = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let data: LiveMatchState;
      if (matchId && matchId !== 'demo-t20-m01') {
        const extId = matchId.replace('cricbuzz-', '').replace('live-', '');
        data = await liveService.connectExternalMatch(extId);
      } else {
        data = await liveService.getLiveState('demo-t20-m01');
      }
      setLiveState(data);
    } catch (err: any) {
      console.error('Failed to load live match state', err);
      try {
        const fallback = await liveService.getLiveState('demo-t20-m01');
        setLiveState(fallback);
      } catch {
        setErrorMessage(
          err?.error?.message || 'Could not connect to live cricket telemetry engine.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  // Connect WebSocket for real-time live events
  useEffect(() => {
    const ws = liveService.connectWebSocket(
      matchId,
      (updatedState) => {
        setLiveState(updatedState);
      },
      (err) => {
        console.warn('WebSocket connection note:', err);
      }
    );
    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [matchId]);

  const handleAdvance = async () => {
    setIsAdvancing(true);
    try {
      const updated = await liveService.advanceNextBall(matchId);
      setLiveState(updated);
    } catch (err) {
      console.error('Failed to advance live delivery', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleTogglePlay = async () => {
    if (!liveState) return;
    try {
      if (liveState.is_live_stream_active) {
        await liveService.pauseAutoPlay(matchId);
        setLiveState((prev) => (prev ? { ...prev, is_live_stream_active: false } : null));
      } else {
        await liveService.startAutoPlay(matchId, 6);
        setLiveState((prev) => (prev ? { ...prev, is_live_stream_active: true } : null));
      }
    } catch (err) {
      console.error('Failed to toggle auto play', err);
    }
  };

  const handleReset = async () => {
    setIsAdvancing(true);
    try {
      const resetState = await liveService.resetStream(matchId);
      setLiveState(resetState);
    } catch (err) {
      console.error('Failed to reset stream', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleIngestDelivery = async (payload: any) => {
    setIsAdvancing(true);
    try {
      const updated = await liveService.ingestExternalDelivery(payload);
      setLiveState(updated);
    } catch (err) {
      console.error('Failed to ingest external delivery', err);
    } finally {
      setIsAdvancing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState
          message="Synchronizing Live Telemetry..."
          subtext="Streaming real-time coordinates, ball events, and predictive ground models"
        />
      </div>
    );
  }

  if (errorMessage || !liveState) {
    return (
      <div className="py-24">
        <ErrorState
          title="Telemetry Feed Disconnected"
          message={errorMessage || 'Live match stream is currently offline.'}
          onRetry={loadInitialState}
        />
      </div>
    );
  }

  const prediction = liveState.prediction;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Live Arena & Field Predictor"
        subtitle="Connected to live match play-by-play. Geometric spatial modeling evaluates next-ball scoring corridors and dismissal traps."
        badge={
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE TELEMETRY
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showVulnerabilityArc ? 'glass' : 'outline'}
              size="sm"
              leftIcon={<Eye className="w-3.5 h-3.5 text-amber-400" />}
              onClick={() => setShowVulnerabilityArc(!showVulnerabilityArc)}
            >
              Vulnerability Arcs
            </Button>
            <Button
              variant={showPredictedShot ? 'glass' : 'outline'}
              size="sm"
              leftIcon={<Target className="w-3.5 h-3.5 text-brand-lime" />}
              onClick={() => setShowPredictedShot(!showPredictedShot)}
            >
              Shot Trajectory
            </Button>
          </div>
        }
      />

      {/* Live Stream Controller & Scoreboard */}
      <LiveControlBar
        state={liveState}
        onAdvance={handleAdvance}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        onIngestDelivery={handleIngestDelivery}
        isLoading={isAdvancing}
        availableMatches={availableMatches}
        onSelectMatch={handleSelectMatch}
      />

      {/* Live Ball-by-Ball Ticker */}
      <LiveBallTicker state={liveState} />

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Live Cricket Ground */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-lime" />
              <h3 className="text-sm font-bold text-content-primary font-display">
                Field Geometry (Over {liveState.current_over}.{liveState.current_ball})
              </h3>
            </div>
            <span className="text-xs text-content-muted hidden sm:inline">
              Select any fielder to inspect spatial coordinates
            </span>
          </div>

          {/* SVG Canvas */}
          <LiveGroundSVG
            fielders={liveState.fielders}
            vulnerableCorridors={prediction?.vulnerable_corridors}
            predictedShotTarget={prediction?.predicted_shot_target}
            predictedShotType={prediction?.predicted_shot_type}
            selectedFielderId={selectedFielder?.id}
            onSelectFielder={(f) => setSelectedFielder(f)}
            showVulnerabilityArc={showVulnerabilityArc}
            showPredictedShot={showPredictedShot}
          />

          {/* Ground Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-[11px] text-content-muted border-t border-surface-border/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>Fielder</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Keeper</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-sm bg-rose-500/60 border border-rose-500" />
              <span>Boundary Gap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-brand-lime" />
              <span>Predicted Vector</span>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Field Placement Prediction Engine */}
        <div className="lg:col-span-5 space-y-6">
          {prediction && <PredictionMetricsCard prediction={prediction} />}
        </div>
      </div>

      {/* AI Broadcast Insight & Tactical Vulnerabilities */}
      {prediction && (
        <div className="space-y-6">
          <GeminiBroadcastInsight
            insight={prediction.ai_broadcast_insight}
            batterName={liveState.striker.name}
            bowlerName={liveState.bowler.name}
          />

          <TacticalVulnerabilityPanel
            corridors={prediction.vulnerable_corridors}
            dismissalRisks={prediction.dismissal_risks}
            primaryTrap={prediction.primary_trap}
          />
        </div>
      )}

      {/* Selected Fielder Modal / Drawer */}
      {selectedFielder && (
        <FielderInfoDrawer
          fielder={{
            id: selectedFielder.id,
            player_id: selectedFielder.player_id || selectedFielder.id,
            player_name: selectedFielder.player_name,
            fielding_position: selectedFielder.fielding_position,
            x: selectedFielder.x,
            y: selectedFielder.y,
            is_wicketkeeper: selectedFielder.is_wicketkeeper,
            delivery_id: liveState.current_delivery_id,
            has_moved: selectedFielder.has_moved || false,
          }}
          onClose={() => setSelectedFielder(null)}
        />
      )}
    </div>
  );
};
