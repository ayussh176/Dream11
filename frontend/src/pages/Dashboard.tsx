import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar,
  Sparkles,
  ShieldAlert,
  Radio,
  Clock,
  ArrowRight,
  MapPin,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { cricketService } from '../services/cricketService';
import { liveService } from '../services/liveService';
import { useTactical } from '../context/TacticalContext';
import {
  MatchContext,
  DeliverySummary,
  FieldComparison,
} from '../types/cricket';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { activeMatchId, setActiveMatchId, setActiveDeliveryId } = useTactical();

  const [matchContext, setMatchContext] = useState<MatchContext | null>(null);
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);
  const [recentChanges, setRecentChanges] = useState<FieldComparison | null>(null);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch available live in-play matches
      try {
        const liveList = await liveService.getActiveLiveMatches();
        setLiveMatches(liveList);
      } catch (e) {
        console.warn('Could not load live matches feed', e);
      }

      // 2. Fetch context and deliveries for the currently active/default match
      const targetMatchId = activeMatchId || 'demo-t20-m01';
      setActiveMatchId(targetMatchId);

      const [context, dels] = await Promise.all([
        cricketService.getMatchContext(targetMatchId),
        cricketService.getMatchDeliveries(targetMatchId),
      ]);

      setMatchContext(context);
      setDeliveries(dels);

      // 3. Fetch recent field changes between the last two distinct deliveries if available
      if (dels.length >= 2) {
        try {
          const comp = await cricketService.compareFields(targetMatchId, dels[2].id, dels[3].id);
          setRecentChanges(comp);
        } catch {
          // Non-critical fallback
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err.message || 'Unable to connect to DugoutAI backend.');
    } finally {
      setIsLoading(false);
    }
  }, [activeMatchId, setActiveMatchId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLaunchRadar = (deliveryId?: string) => {
    if (deliveryId) {
      setActiveDeliveryId(deliveryId);
    }
    navigate('/radar');
  };

  const handleLaunchExplainer = (deliveryId?: string) => {
    if (deliveryId) {
      setActiveDeliveryId(deliveryId);
      navigate(`/explainer?matchId=${activeMatchId}&deliveryId=${deliveryId}`);
    } else {
      navigate('/explainer');
    }
  };

  const handleLaunchSimulator = (deliveryId?: string) => {
    if (deliveryId) {
      setActiveDeliveryId(deliveryId);
      navigate(`/simulator?matchId=${activeMatchId}&deliveryId=${deliveryId}`);
    } else {
      navigate('/simulator');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState
          message="Loading Match Command Center..."
          subtext="Synchronizing tactical telemetry, field tracking, and live match feeds"
        />
      </div>
    );
  }

  if (error || !matchContext) {
    return (
      <div className="py-24">
        <ErrorState
          title="Command Center Unavailable"
          message={error || 'No active match data found. Please ensure the backend is running.'}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  const modules = [
    {
      title: 'Live Arena & Predictor',
      tagline: 'Real-Time In-Game Telemetry',
      desc: 'Connect to live play-by-play. Predict scoring corridors, boundary gaps, and dismissal traps based on live coordinates.',
      icon: Radio,
      accentColor: 'text-red-400',
      buttonVariant: 'primary' as const,
      onClick: () => navigate(`/live?matchId=${matchContext.match_id}`),
    },
    {
      title: 'Tactical Radar',
      tagline: '2D Field Geometry & Movement',
      desc: 'Inspect all 9 fielders with standardized terminology, ball-by-ball movement vectors, and fielder profiles.',
      icon: Radar,
      accentColor: 'text-brand-lime',
      buttonVariant: 'outline' as const,
      onClick: () => handleLaunchRadar(matchContext.last_completed_delivery_id || deliveries[0]?.id),
    },
    {
      title: 'AI Tactical Explainer',
      tagline: 'Grounded Captaincy Intelligence',
      desc: 'Ask Gemini why fielders are positioned in specific sectors, evaluate bowling plans, and inspect tactical intent.',
      icon: Sparkles,
      accentColor: 'text-brand-blue',
      buttonVariant: 'outline' as const,
      onClick: () => handleLaunchExplainer(matchContext.last_completed_delivery_id || deliveries[0]?.id),
    },
    {
      title: 'Shadow Captain',
      tagline: 'Geometric Coverage Sandbox',
      desc: 'Drag and reposition fielders, simulate hypothetical shot corridors with Shapely geometry, and evaluate trade-offs.',
      icon: ShieldAlert,
      accentColor: 'text-amber-400',
      buttonVariant: 'secondary' as const,
      onClick: () => handleLaunchSimulator(matchContext.last_completed_delivery_id || deliveries[0]?.id),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Tactical Command Center"
        subtitle="Deconstruct captaincy decisions, evaluate spatial geometry, and test defensive configurations."
        badge={
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-lime/[0.12] text-brand-lime border border-brand-lime/20 text-xs font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
            Active Telemetry
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Radar className="w-4 h-4" />}
              onClick={() => handleLaunchRadar()}
            >
              Launch Radar
            </Button>
          </div>
        }
      />

      {/* 2. Live In-Play Matches Hub */}
      {liveMatches.length > 0 && (
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold tracking-tight text-content-primary font-display uppercase">
                  In-Play Cricket Feeds
                </h3>
                <p className="text-xs text-content-muted">
                  Concurrent live matches streaming. Select any game to inspect field coordinates and real-time xR.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-content-secondary px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              {liveMatches.length} Matches In-Progress
            </span>
          </div>

          {/* Grid of Concurrent Live Matches */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveMatches.slice(0, 6).map((lm) => {
              const isSelected = activeMatchId === lm.id || activeMatchId === lm.external_id;

              return (
                <div
                  key={lm.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isSelected
                      ? 'bg-white/[0.06] border-brand-lime/40 shadow-sm'
                      : 'bg-white/[0.02] border-surface-border hover:border-white/[0.12] hover:bg-white/[0.04]'
                  }`}
                  onClick={() => {
                    navigate(`/live?matchId=${lm.external_id || lm.id}`);
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {lm.status || 'LIVE'}
                      </span>
                      <span className="text-[10px] font-mono text-content-muted">
                        {lm.series ? lm.series.slice(0, 24) : 'RapidAPI'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-content-primary group-hover:text-brand-lime transition-colors line-clamp-1 font-display">
                      {lm.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-[11px]">
                    <span className="text-content-muted text-[11px]">
                      Predict field & xR
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      rightIcon={<ArrowRight className="w-3 h-3" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/live?matchId=${lm.external_id || lm.id}`);
                      }}
                    >
                      Track Live
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Featured Match Hero Card */}
      <Card variant="glass" className="relative overflow-hidden p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-surface-border/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="lime" dot size="sm">
                Featured Match
              </Badge>
              <Badge variant="blue" size="sm">
                {matchContext.tournament}
              </Badge>
              <span className="text-xs text-content-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-content-secondary" />
                {matchContext.venue}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-content-primary font-display">
              {matchContext.match_name}
            </h2>

            <p className="text-xs text-content-secondary italic max-w-xl">
              {matchContext.notice}
            </p>
          </div>

          {/* Module Launch Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-brand-blue" />}
              onClick={() => handleLaunchExplainer()}
            >
              Ask AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
              onClick={() => handleLaunchSimulator()}
            >
              Test Field
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Radar className="w-3.5 h-3.5" />}
              onClick={() => handleLaunchRadar()}
            >
              Open Radar
            </Button>
          </div>
        </div>

        {/* Match Situation & Scorecard Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted block mb-1">
              Current Score
            </span>
            <div className="text-2xl font-extrabold font-mono text-content-primary">
              {matchContext.total_runs_scored}/{matchContext.total_wickets_lost}
            </div>
            <span className="text-xs text-content-secondary">
              Over {matchContext.current_over} ({matchContext.batting_team})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted block mb-1">
              Target Equation
            </span>
            <div className="text-2xl font-extrabold font-mono text-amber-400">
              {matchContext.runs_needed} <span className="text-xs font-normal text-content-muted">runs</span>
            </div>
            <span className="text-xs text-content-secondary">
              Needed from {matchContext.balls_remaining} balls
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted block mb-1">
              Run Rate Metrics
            </span>
            <div className="text-2xl font-extrabold font-mono text-brand-lime">
              {matchContext.required_run_rate?.toFixed(1) || '19.0'}
            </div>
            <span className="text-xs text-content-secondary">
              Req. RR (Current {matchContext.current_run_rate.toFixed(1)})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <span className="text-[10px] font-mono uppercase tracking-wider text-content-muted block mb-1">
              Active Duel
            </span>
            <div className="text-sm font-bold text-content-primary truncate font-display">
              {matchContext.current_bowler || 'A. Nair'}
            </div>
            <span className="text-xs text-content-secondary truncate block">
              to {matchContext.current_batter || 'V. Roy'}
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Core Modules Launch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.title}
              variant="interactive"
              className="group p-5 flex flex-col justify-between"
              onClick={m.onClick}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-surface-border flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className={`w-4 h-4 ${m.accentColor}`} />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-content-muted group-hover:translate-x-1 group-hover:text-content-primary transition-all" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-content-primary group-hover:text-brand-lime transition-colors font-display">
                    {m.title}
                  </h3>
                  <span className="text-[11px] font-mono text-content-muted block mb-1">
                    {m.tagline}
                  </span>
                  <p className="text-xs text-content-secondary leading-relaxed line-clamp-2">
                    {m.desc}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-surface-border/50">
                <Button variant={m.buttonVariant} size="sm" className="w-full">
                  Launch {m.title.split(' ')[0]}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 5. Recent Deliveries Timeline & Field Changes Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent Delivery Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-3 border-b border-surface-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-lime" />
                  <CardTitle className="text-base text-content-primary font-display">
                    Over 19 Delivery Sequence
                  </CardTitle>
                </div>
                <span className="text-[11px] font-mono text-content-muted">
                  {deliveries.length} Deliveries
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-2.5">
              {deliveries.map((del) => (
                <div
                  key={del.id}
                  onClick={() => handleLaunchRadar(del.id)}
                  className="p-3 rounded-xl bg-white/[0.02] border border-surface-border hover:border-brand-lime/40 transition-all cursor-pointer group flex items-start gap-3"
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-surface border border-surface-border flex flex-col items-center justify-center font-mono">
                    <span className="font-bold text-xs text-brand-lime">
                      {del.over_number}.{del.ball_number}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      {del.runs}r
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-content-primary group-hover:text-brand-lime transition-colors">
                        {del.field_configuration_name || 'Standard Field'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {del.wickets > 0 && (
                          <Badge variant="critical" size="sm" className="text-[10px] py-0">
                            WICKET
                          </Badge>
                        )}
                        {del.runs >= 4 && (
                          <Badge variant="lime" size="sm" className="text-[10px] py-0">
                            {del.runs === 4 ? 'FOUR' : 'SIX'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-content-secondary line-clamp-1">
                      {del.commentary}
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-content-muted group-hover:translate-x-1 group-hover:text-brand-lime transition-all shrink-0 mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 cols): Recent Field Changes & Tactics */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="glass-panel">
            <CardHeader className="pb-3 border-b border-surface-border/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-blue" />
                  <CardTitle className="text-base text-content-primary font-display">
                    Recent Field Adjustments
                  </CardTitle>
                </div>
                <Badge variant="blue" size="sm">
                  Delta Tracking
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-3.5">
              {recentChanges ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-surface-border text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono text-[11px] text-content-muted">
                      <span>Ball 18.3 → 18.4</span>
                      <span className="text-amber-400 font-semibold">
                        {recentChanges.total_shifted_fielders} Fielders Shifted
                      </span>
                    </div>
                    <p className="text-content-secondary leading-relaxed">
                      {recentChanges.tactical_summary}
                    </p>
                  </div>

                  {recentChanges.movement_differences.map((diff) => (
                    <div
                      key={diff.player_id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-surface-border text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-content-primary block font-display">
                          {diff.player_name}
                        </span>
                        <span className="text-[11px] text-content-muted">
                          {diff.from_position} → <strong className="text-brand-lime font-medium">{diff.to_position}</strong>
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-content-secondary px-2 py-0.5 rounded bg-white/[0.04]">
                        {(diff.displacement_normalized * 75).toFixed(0)}m shift
                      </span>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleLaunchRadar('del-19-04')}
                    leftIcon={<Radar className="w-3.5 h-3.5 text-brand-lime" />}
                  >
                    View Shift Vectors on Ground
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center text-content-muted text-xs">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Comparing fielding adjustments between deliveries...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
