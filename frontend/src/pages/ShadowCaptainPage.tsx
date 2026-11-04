import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  RotateCcw,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import {
  DraggableCricketGroundSVG,
  ScenarioSelector,
  AssumptionsPanel,
  DEFAULT_ASSUMPTIONS,
  SimulationCoverageCard,
  TradeOffModal,
} from '../features/simulator';
import { cricketService } from '../services/cricketService';
import { simulatorService } from '../services/simulatorService';
import { useTactical } from '../context/TacticalContext';
import { useToast } from '../context/ToastContext';
import { Fielder, DeliverySummary } from '../types/cricket';
import {
  SimulationAssumptions,
  EvaluateSimulationResponse,
  ExplainTradeOffResponse,
  SimulationViewMode,
  FielderPositionInput,
} from '../types/simulator';

export const ShadowCaptainPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeMatchId, activeDeliveryId, setActiveDeliveryId } = useTactical();
  const { toast } = useToast();

  const matchId = searchParams.get('matchId') || activeMatchId || 'demo-t20-m01';
  const queryDeliveryId = searchParams.get('deliveryId') || activeDeliveryId;

  // State
  const [deliveries, setDeliveries] = useState<DeliverySummary[]>([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('');
  const [originalFielders, setOriginalFielders] = useState<Fielder[]>([]);
  const [customFielders, setCustomFielders] = useState<Fielder[]>([]);
  const [wicketkeeper, setWicketkeeper] = useState<Fielder | null>(null);

  const [selectedScenario, setSelectedScenario] = useState<string>('cover');
  const [assumptions, setAssumptions] = useState<SimulationAssumptions>(DEFAULT_ASSUMPTIONS);
  const [viewMode, setViewMode] = useState<SimulationViewMode>('custom');

  const [simulationResult, setSimulationResult] = useState<EvaluateSimulationResponse | null>(null);
  const [tradeOffAnalysis, setTradeOffAnalysis] = useState<ExplainTradeOffResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [isTradeOffModalOpen, setIsTradeOffModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [hasChanged, setHasChanged] = useState<boolean>(false);
  const [isStale, setIsStale] = useState<boolean>(false);

  // Load deliveries on mount
  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        setIsLoading(true);
        const dels = await cricketService.getMatchDeliveries(matchId);
        setDeliveries(dels);
        if (dels.length > 0) {
          const target = dels.find((d) => d.id === queryDeliveryId) ||
            dels.find((d) => d.ball_number === 4) ||
            dels[0];
          setSelectedDeliveryId(target.id);
          setActiveDeliveryId(target.id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load match deliveries.');
      } finally {
        setIsLoading(false);
      }
    };
    loadDeliveries();
  }, [matchId, queryDeliveryId, setActiveDeliveryId]);

  // Load field configuration whenever selectedDeliveryId changes
  useEffect(() => {
    if (!selectedDeliveryId) return;

    const loadField = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const config = await cricketService.getDeliveryField(matchId, selectedDeliveryId);
        const fieldersList = config.fielders || [];
        setOriginalFielders(fieldersList);
        // Deep clone for custom editable fielders
        setCustomFielders(fieldersList.map((f) => ({ ...f })));
        setWicketkeeper(config.wicketkeeper || null);

        // Reset simulation states on delivery change
        setSimulationResult(null);
        setTradeOffAnalysis(null);
        setHasChanged(false);
        setIsStale(false);
        setViewMode('custom');
      } catch (err: any) {
        setError(err.message || 'Failed to load field configuration.');
      } finally {
        setIsLoading(false);
      }
    };

    loadField();
  }, [matchId, selectedDeliveryId]);

  // Handler for moving a fielder on the SVG ground
  const handleFielderMove = useCallback((id: string, newX: number, newY: number) => {
    setCustomFielders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, x: newX, y: newY, has_moved: true } : f))
    );
    setHasChanged(true);
    setIsStale(true);
  }, []);

  // Reset to original field
  const handleResetField = () => {
    setCustomFielders(originalFielders.map((f) => ({ ...f })));
    setHasChanged(false);
    setIsStale(false);
    setSimulationResult(null);
    setTradeOffAnalysis(null);
    setViewMode('custom');
    toast.info('Restored match captain’s original field placements.');
  };

  // Convert fielder objects to backend input schema
  const toFielderInputs = (list: Fielder[]): FielderPositionInput[] => {
    return list.map((f) => ({
      id: f.id,
      player_id: f.player_id,
      player_name: f.player_name,
      fielding_position: f.fielding_position,
      x: f.x,
      y: f.y,
      is_wicketkeeper: f.is_wicketkeeper,
    }));
  };

  // Run simulation
  const handleRunSimulation = async () => {
    if (!selectedDeliveryId) return;

    try {
      setIsSimulating(true);
      setError(null);

      const requestPayload = {
        match_id: matchId,
        delivery_id: selectedDeliveryId,
        scenario: selectedScenario,
        original_fielders: toFielderInputs(originalFielders),
        custom_fielders: toFielderInputs(customFielders),
        assumptions: assumptions,
      };

      const result = await simulatorService.evaluateSimulation(requestPayload);
      setSimulationResult(result);
      setIsStale(false);
      // Clear previous AI critique since simulation data changed
      setTradeOffAnalysis(null);
      const deltaSign = result.coverage_difference_pct > 0 ? '+' : '';
      toast.success(
        `Simulation evaluated: ${result.custom_coverage_pct.toFixed(1)}% coverage (${deltaSign}${result.coverage_difference_pct.toFixed(1)}% vs actual field).`
      );
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Simulation execution failed.';
      setError(msg);
      toast.error(msg, 'Simulation Failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Explain strategic trade-offs using Gemini
  const handleExplainTradeOffs = async () => {
    if (!simulationResult) return;

    try {
      setIsExplaining(true);
      setIsTradeOffModalOpen(true);
      setError(null);

      const response = await simulatorService.explainTradeOffs({
        match_id: matchId,
        delivery_id: selectedDeliveryId,
        simulation_result: simulationResult,
      });

      setTradeOffAnalysis(response);
      toast.info('Tactical Trade-Off Analysis generated.', 'Gemini Grounded');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to explain trade-offs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsExplaining(false);
    }
  };

  // When scenario changes, mark stale if simulation was already run
  const handleSelectScenario = (key: string) => {
    setSelectedScenario(key);
    if (simulationResult) {
      setIsStale(true);
    }
  };

  // When assumptions change, mark stale if simulation was already run
  const handleAssumptionsChange = (updated: SimulationAssumptions) => {
    setAssumptions(updated);
    if (simulationResult) {
      setIsStale(true);
    }
  };

  const currentDelivery = deliveries.find((d) => d.id === selectedDeliveryId);

  // Delivery Navigation helpers
  const currentIndex = deliveries.findIndex((d) => d.id === selectedDeliveryId);
  const handlePrevDelivery = () => {
    if (currentIndex > 0) {
      setSelectedDeliveryId(deliveries[currentIndex - 1].id);
    }
  };
  const handleNextDelivery = () => {
    if (currentIndex < deliveries.length - 1) {
      setSelectedDeliveryId(deliveries[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Shadow Captain"
        subtitle="Reposition fielders in the sandbox, simulate hypothetical shot corridors, and evaluate spatial interception trade-offs."
        badge={<Badge variant="warning" dot size="sm">Coverage Sandbox</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetField}
              disabled={!hasChanged || isSimulating}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset to Actual
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunSimulation}
              isLoading={isSimulating}
              disabled={isLoading}
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Run Simulation
            </Button>
          </div>
        }
      />

      {error && (
        <ErrorState
          title="Simulation Notice"
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {/* Delivery Scrubber Bar */}
      <Card variant="glass">
        <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevDelivery}
                disabled={currentIndex <= 0 || isLoading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextDelivery}
                disabled={currentIndex >= deliveries.length - 1 || isLoading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-cricket-slate">
                Match Delivery:
              </span>
              <div className="flex items-center gap-1.5">
                {deliveries.map((del) => {
                  const isSelected = del.id === selectedDeliveryId;
                  return (
                    <button
                      key={del.id}
                      onClick={() => setSelectedDeliveryId(del.id)}
                      className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all ${
                        isSelected
                          ? 'bg-cricket-lime text-cricket-dark font-bold shadow-sm'
                          : 'bg-cricket-dark-subtle text-cricket-slate hover:text-white hover:bg-cricket-dark-border'
                      }`}
                    >
                      {del.over_number}.{del.ball_number}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {currentDelivery && (
            <div className="flex items-center gap-3 text-xs text-cricket-slate">
              <span>Batter: <strong className="text-white">{currentDelivery.batter_name || currentDelivery.batter_id}</strong></span>
              <span>•</span>
              <span>Bowler: <strong className="text-white">{currentDelivery.bowler_name || currentDelivery.bowler_id}</strong></span>
              <span>•</span>
              <Badge variant="neutral" size="sm">
                {currentDelivery.field_configuration_name || 'Standard Field'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Cricket Ground SVG (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card variant="glass">
            <CardContent className="p-4 space-y-4">
              {/* Ground View Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border/60">
                <div className="flex items-center gap-1.5 text-xs text-content-secondary">
                  <span className="font-semibold text-content-primary uppercase tracking-wider text-[11px]">
                    Display Mode:
                  </span>
                  <div className="inline-flex rounded-xl bg-midnight/80 p-1 border border-surface-border">
                    <button
                      type="button"
                      onClick={() => setViewMode('custom')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        viewMode === 'custom'
                          ? 'bg-brand-lime text-midnight font-bold shadow-sm'
                          : 'text-content-secondary hover:text-content-primary'
                      }`}
                    >
                      Custom Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('original')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        viewMode === 'original'
                          ? 'bg-brand-lime text-midnight font-bold shadow-sm'
                          : 'text-content-secondary hover:text-content-primary'
                      }`}
                    >
                      Match Original
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('difference')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                        viewMode === 'difference'
                          ? 'bg-brand-lime text-midnight font-bold shadow-sm'
                          : 'text-content-secondary hover:text-content-primary'
                      }`}
                    >
                      Compare Shift
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hasChanged && (
                    <Badge variant="warning" size="sm" className="text-[10px]">
                      Field Altered
                    </Badge>
                  )}
                  {simulationResult && (
                    <Badge variant="success" size="sm" className="text-[10px]">
                      Simulated
                    </Badge>
                  )}
                </div>
              </div>

              {/* Drag Instruction Banner */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cricket-dark-subtle/60 border border-cricket-dark-border/40 text-xs text-cricket-slate">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cricket-lime" />
                  <span>
                    Drag any of the <strong>9 numbered fielders</strong> to test alternative angles & depths.
                  </span>
                </div>
                {hasChanged && (
                  <button
                    onClick={handleResetField}
                    className="text-cricket-accent hover:underline text-[11px] font-medium"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* The Draggable SVG Ground */}
              {isLoading ? (
                <div className="py-24">
                  <LoadingState message="Loading match field configuration..." />
                </div>
              ) : (
                <DraggableCricketGroundSVG
                  customFielders={customFielders}
                  originalFielders={originalFielders}
                  wicketkeeper={wicketkeeper}
                  simulationResult={simulationResult}
                  viewMode={viewMode}
                  onFielderMove={handleFielderMove}
                  className="w-full"
                />
              )}

              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2 text-xs text-cricket-slate border-t border-cricket-dark-border/40">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300" />
                  <span>Covered Grid Points (Arrival time ≤ Ball travel time)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 border border-rose-300" />
                  <span>Exposed Gap Points</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-400" />
                  <span>Hypothetical Shot Corridor</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Scenario Selector, Coverage Card & Assumptions (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Shot Scenario Selector */}
          <ScenarioSelector
            selectedScenario={selectedScenario}
            onSelectScenario={handleSelectScenario}
            disabled={isSimulating}
          />

          {/* Simulation Coverage & Trade-off Card */}
          <SimulationCoverageCard
            result={simulationResult}
            isStale={isStale}
            onExplainTradeOffs={simulationResult ? handleExplainTradeOffs : undefined}
            isExplaining={isExplaining}
          />

          {/* Physics Assumptions Panel */}
          <AssumptionsPanel
            assumptions={assumptions}
            onChange={handleAssumptionsChange}
            disabled={isSimulating}
          />
        </div>
      </div>

      {/* AI Trade-Off Critique Modal */}
      <TradeOffModal
        isOpen={isTradeOffModalOpen}
        onClose={() => setIsTradeOffModalOpen(false)}
        analysis={tradeOffAnalysis}
        isLoading={isExplaining}
      />
    </div>
  );
};
