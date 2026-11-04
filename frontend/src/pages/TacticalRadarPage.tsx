import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Compass,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { CricketGroundSVG } from '../components/cricket/CricketGroundSVG';
import { DeliverySelector } from '../features/radar/DeliverySelector';
import { FielderInfoDrawer } from '../features/radar/FielderInfoDrawer';
import { FieldComparisonPanel } from '../features/radar/FieldComparisonPanel';
import { cricketService } from '../services/cricketService';
import { useTactical } from '../context/TacticalContext';
import { useToast } from '../context/ToastContext';
import {
  MatchContext,
  DeliverySummary,
  FieldConfiguration,
  FieldComparison,
  Fielder,
} from '../types/cricket';

export const TacticalRadarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeMatchId, setActiveMatchId, activeDeliveryId, setActiveDeliveryId } = useTactical();
  const { toast } = useToast();

  const queryMatchId = searchParams.get('matchId') || activeMatchId;
  const queryDeliveryId = searchParams.get('deliveryId') || activeDeliveryId;

  // State
  const [matchContext, setMatchContext] = useState<MatchContext | null>(null);
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);
  const [currentDelivery, setCurrentDelivery] = useState<DeliverySummary | null>(null);
  const [fieldConfig, setFieldConfig] = useState<FieldConfiguration | null>(null);
  const [comparison, setComparison] = useState<FieldComparison | null>(null);
  const [selectedFielder, setSelectedFielder] = useState<Fielder | null>(null);

  // UI Toggles
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);

  // Loading & Error States
  const [isLoadingMatch, setIsLoadingMatch] = useState<boolean>(true);
  const [isLoadingField, setIsLoadingField] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial Load: Fetch Match Context & Deliveries List
  const loadMatchData = useCallback(async () => {
    setIsLoadingMatch(true);
    setErrorMessage(null);
    try {
      const currentTargetMatch = queryMatchId || 'demo-t20-m01';
      setActiveMatchId(currentTargetMatch);

      const [contextData, deliveriesData] = await Promise.all([
        cricketService.getMatchContext(currentTargetMatch),
        cricketService.getMatchDeliveries(currentTargetMatch),
      ]);
      setMatchContext(contextData);
      setDeliveries(deliveriesData);

      // Default to the query delivery or the active delivery or the first available
      const initialDelivery =
        deliveriesData.find((d) => d.id === queryDeliveryId) ||
        deliveriesData.find((d) => d.id === activeDeliveryId) ||
        deliveriesData[0];

      if (initialDelivery) {
        setActiveDeliveryId(initialDelivery.id);
        setCurrentDelivery(initialDelivery);
      }
    } catch (err: any) {
      console.error('Failed to load match telemetry', err);
      setErrorMessage(
        err?.error?.message || 'Unable to connect to DugoutAI backend. Verify FastAPI is running.'
      );
    } finally {
      setIsLoadingMatch(false);
    }
  }, [queryMatchId, queryDeliveryId, activeDeliveryId, setActiveMatchId, setActiveDeliveryId]);

  useEffect(() => {
    loadMatchData();
  }, [loadMatchData]);

  // 2. Load Field Configuration and Delta Comparison for Active Delivery
  const loadDeliveryField = useCallback(
    async (delId: string) => {
      setIsLoadingField(true);
      try {
        const fieldData = await cricketService.getDeliveryField(activeMatchId, delId);
        setFieldConfig(fieldData);

        // Find current delivery in deliveries list
        const deliv = deliveries.find((d) => d.id === delId);
        if (deliv) setCurrentDelivery(deliv);

        // Compute comparison against previous ball if available
        const currentIdx = deliveries.findIndex((d) => d.id === delId);
        if (currentIdx > 0) {
          const prevDelivId = deliveries[currentIdx - 1].id;
          const compData = await cricketService.compareFields(
            activeMatchId,
            prevDelivId,
            delId
          );
          setComparison(compData);
        } else {
          setComparison(null);
        }
      } catch (err: any) {
        console.error('Failed to load field configuration', err);
        setErrorMessage(err?.error?.message || 'Failed to retrieve field geometry for this ball.');
      } finally {
        setIsLoadingField(false);
      }
    },
    [activeMatchId, deliveries]
  );

  useEffect(() => {
    if (activeDeliveryId && deliveries.length > 0) {
      loadDeliveryField(activeDeliveryId);
    }
  }, [activeDeliveryId, deliveries, loadDeliveryField]);

  // Handle Delivery Selection
  const handleSelectDelivery = (deliveryId: string) => {
    setActiveDeliveryId(deliveryId);
    setSelectedFielder(null); // Reset fielder drawer on ball switch
    const d = deliveries.find((del) => del.id === deliveryId);
    if (d) {
      toast.info(`Inspecting field setup for Over ${d.over_number}.${d.ball_number}`);
    }
  };

  // Navigate to AI Explainer
  const handleExplainField = () => {
    navigate(`/explainer?matchId=${activeMatchId}&deliveryId=${activeDeliveryId}`);
  };

  if (isLoadingMatch) {
    return (
      <div className="py-20">
        <LoadingState
          message="Synchronizing Tactical Ground Telemetry..."
          subtext="Fetching normalized pitch coordinates and fielder configurations from DugoutAI backend"
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="py-20">
        <ErrorState
          title="Telemetry Connection Failed"
          message={errorMessage}
          onRetry={loadMatchData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP SECTION: Match Status, Scoreboard & Active Duel */}
      <Card variant="glass" className="relative overflow-hidden p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Match Identity & Situation */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="lime" dot size="sm">
                Tactical Radar
              </Badge>
              <Badge variant="neutral" size="sm">
                {matchContext?.tournament || 'T20 Tournament'}
              </Badge>
              <span className="text-xs text-content-muted hidden sm:inline">
                {matchContext?.venue}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-content-primary font-display">
              {matchContext?.match_name || 'Apex Titans vs Coastal Mavericks'}
            </h2>

            <div className="text-xs text-content-secondary flex items-center gap-2">
              <span className="font-semibold text-brand-lime">Match Situation:</span>
              <span>
                {matchContext?.batting_team} require {matchContext?.runs_needed ?? 19} runs from{' '}
                {matchContext?.balls_remaining ?? 6} balls (Target: {matchContext?.target_runs ?? 172})
              </span>
            </div>
          </div>

          {/* Active Scoreboard & Duel Box */}
          <div className="flex flex-wrap items-center gap-4 border-t lg:border-t-0 lg:border-l border-surface-border pt-3 lg:pt-0 lg:pl-6">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-surface-border min-w-[130px]">
              <div className="text-[10px] font-mono uppercase text-content-muted">Current Duel</div>
              <div className="text-xs font-bold text-content-primary truncate mt-0.5 font-display">
                {currentDelivery?.bowler_name || 'A. Nair'} (RF)
              </div>
              <div className="text-[11px] text-content-secondary truncate">
                vs {currentDelivery?.batter_name || 'V. Roy'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-surface-border min-w-[110px]">
              <div className="text-[10px] font-mono uppercase text-content-muted">Target Metrics</div>
              <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                RRR: {matchContext?.required_run_rate?.toFixed(2) ?? '19.00'}
              </div>
              <div className="text-[11px] text-content-secondary font-mono">
                CRR: {matchContext?.current_run_rate?.toFixed(2) ?? '3.00'}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="md"
                leftIcon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
                onClick={() => navigate(`/simulator?matchId=${activeMatchId}&deliveryId=${activeDeliveryId}`)}
                className="w-full sm:w-auto"
              >
                Simulate Field
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleExplainField}
                className="w-full sm:w-auto"
              >
                Explain Field
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. DELIVERY SELECTOR (Timeline & Ball Navigation) */}
      <DeliverySelector
        deliveries={deliveries}
        currentDeliveryId={activeDeliveryId}
        onSelectDelivery={handleSelectDelivery}
        isLoading={isLoadingField}
      />

      {/* 3. MAIN SECTION: 2D Interactive Ground & Tactical Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Large Interactive Cricket Ground */}
        <div className="lg:col-span-8 space-y-4">
          <Card variant="glass" className="relative p-4 md:p-6 flex flex-col items-center">
            {/* Ground Header Controls Bar */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-content-primary">
                    {fieldConfig?.configuration_name || 'Field Placement'}
                  </span>
                  <Badge variant="blue" size="sm">
                    {fieldConfig?.total_fielders_count || 9} Fielders Tracked
                  </Badge>
                </div>
                <p className="text-[11px] text-content-muted mt-0.5">
                  Normalized coordinates · Positive X Off-side · Batter at center (0, 0)
                </p>
              </div>

              {/* View Display Toggles */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowZones(!showZones)}
                  className={`text-xs py-1 px-2.5 ${showZones ? 'border-brand-blue text-brand-blue' : 'text-content-secondary'}`}
                >
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  Zones {showZones ? 'On' : 'Off'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  disabled={!comparison}
                  className={`text-xs py-1 px-2.5 ${showComparison ? 'border-amber-500 text-amber-400' : 'text-content-secondary'}`}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Movement {showComparison ? 'Active' : 'Off'}
                </Button>
              </div>
            </div>

            {/* SVG Cricket Ground Container */}
            <div className="w-full flex items-center justify-center py-4">
              <CricketGroundSVG
                field={fieldConfig}
                selectedFielderId={selectedFielder?.id || null}
                onSelectFielder={(f) => setSelectedFielder(f)}
                comparison={comparison}
                showComparison={showComparison}
                showZones={showZones}
              />
            </div>

            {/* Delivery Commentary Strip at Bottom of Ground */}
            {currentDelivery && (
              <div className="w-full p-3 rounded-xl bg-surface-elevated/80 border border-surface-border flex items-start gap-3 mt-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center font-mono font-bold text-xs text-brand-lime">
                  {currentDelivery.over_number}.{currentDelivery.ball_number}
                </div>
                <div className="text-xs leading-relaxed text-content-secondary flex-1">
                  <span className="font-semibold text-content-primary">Delivery Telemetry: </span>
                  {currentDelivery.commentary}
                  {currentDelivery.speed_kph && (
                    <span className="ml-2 font-mono text-[11px] text-brand-blue">
                      [{currentDelivery.speed_kph} km/h · {currentDelivery.length} · {currentDelivery.line}]
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): Fielder Info Drawer & Field Movement Comparison */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Fielder Drawer (Opens on clicking any fielder) */}
          {selectedFielder ? (
            <FielderInfoDrawer
              fielder={selectedFielder}
              onClose={() => setSelectedFielder(null)}
            />
          ) : (
            <Card variant="elevated" className="p-4 text-center">
              <div className="flex flex-col items-center justify-center py-6 text-content-muted space-y-2">
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-content-secondary border border-surface-border">
                  <Compass className="w-5 h-5 text-brand-blue" />
                </div>
                <h4 className="text-sm font-semibold text-content-primary">Select Any Fielder</h4>
                <p className="text-xs text-content-secondary max-w-xs">
                  Click on any player marker on the ground to inspect their tactical role, coordinates, and verified match statistics.
                </p>
              </div>
            </Card>
          )}

          {/* Field Movement Comparison Panel */}
          <FieldComparisonPanel
            comparison={comparison}
            isActive={showComparison}
            onToggleActive={() => setShowComparison(!showComparison)}
            isLoading={isLoadingField}
          />

          {/* Quick Handoff Action Cards */}
          <Card variant="interactive" onClick={handleExplainField} className="p-4 border-brand-blue/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content-primary">AI Tactical Explainer</h4>
                  <p className="text-[11px] text-content-secondary">
                    Analyze why this field was deployed for Ball {currentDelivery?.over_number}.{currentDelivery?.ball_number}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-brand-blue" />
            </div>
          </Card>

          <Card
            variant="interactive"
            onClick={() => navigate('/simulator')}
            className="p-4 border-tactical-warning/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-tactical-warning/20 text-tactical-warning flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-content-primary">Shadow Captain Sandbox</h4>
                  <p className="text-[11px] text-content-secondary">
                    Drag fielders and test boundary coverage with Shapely simulation
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-tactical-warning" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
