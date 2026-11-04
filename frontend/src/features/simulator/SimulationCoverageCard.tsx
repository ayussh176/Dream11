import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EvaluateSimulationResponse } from '../../types/simulator';

interface SimulationCoverageCardProps {
  result: EvaluateSimulationResponse | null;
  isStale: boolean;
  onExplainTradeOffs?: () => void;
  isExplaining?: boolean;
}

export const SimulationCoverageCard: React.FC<SimulationCoverageCardProps> = ({
  result,
  isStale,
  onExplainTradeOffs,
  isExplaining = false,
}) => {
  if (!result) {
    return (
      <Card className="border-cricket-dark-border bg-cricket-dark-card/90">
        <CardContent className="p-8 text-center text-cricket-slate space-y-3">
          <Layers className="w-10 h-10 text-cricket-slate/50 mx-auto" />
          <p className="text-sm font-medium text-cricket-gray">
            No Simulation Run Yet
          </p>
          <p className="text-xs text-cricket-slate max-w-sm mx-auto">
            Drag any of the 9 fielders on the ground or change the shot corridor scenario, then click <strong>Run Simulation</strong> to compute spatial reachability.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositiveDelta = result.coverage_difference_pct > 0;
  const isNeutralDelta = Math.abs(result.coverage_difference_pct) < 0.1;

  return (
    <Card className="border-cricket-dark-border bg-cricket-dark-card/90 space-y-4">
      <CardHeader className="pb-3 border-b border-cricket-dark-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cricket-lime" />
            <CardTitle className="text-base text-white">
              Deterministic Coverage Analysis
            </CardTitle>
          </div>
          <Badge variant="neutral" size="sm">
            {result.total_points_evaluated} Points Sampled
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Stale State Banner */}
        {isStale && (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Field modified:</strong> Results shown below are based on the previous field layout. Click <strong>Run Simulation</strong> to re-evaluate.
            </span>
          </div>
        )}

        {/* Top-Level Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Original Coverage */}
          <div className="p-3.5 rounded-lg bg-cricket-dark-subtle/70 border border-cricket-dark-border/60">
            <span className="text-[11px] font-medium text-cricket-slate uppercase tracking-wider block mb-1">
              Actual Field
            </span>
            <div className="text-2xl font-bold font-mono text-white">
              {result.original_coverage_pct.toFixed(1)}%
            </div>
            <span className="text-[10px] text-cricket-slate">Corridor coverage</span>
          </div>

          {/* Custom Coverage */}
          <div className="p-3.5 rounded-lg bg-cricket-dark-subtle/70 border border-cricket-dark-border/60">
            <span className="text-[11px] font-medium text-cricket-slate uppercase tracking-wider block mb-1">
              Custom Field
            </span>
            <div className="text-2xl font-bold font-mono text-cricket-lime">
              {result.custom_coverage_pct.toFixed(1)}%
            </div>
            <span className="text-[10px] text-cricket-slate">Repositioned field</span>
          </div>

          {/* Delta Difference */}
          <div
            className={`p-3.5 rounded-lg border ${
              isNeutralDelta
                ? 'bg-slate-800/40 border-slate-700/60'
                : isPositiveDelta
                ? 'bg-emerald-950/30 border-emerald-500/30'
                : 'bg-rose-950/30 border-rose-500/30'
            }`}
          >
            <span className="text-[11px] font-medium text-cricket-slate uppercase tracking-wider block mb-1">
              Net Coverage Delta
            </span>
            <div
              className={`text-2xl font-bold font-mono flex items-center gap-1 ${
                isNeutralDelta
                  ? 'text-slate-300'
                  : isPositiveDelta
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {isPositiveDelta ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : isNeutralDelta ? null : (
                <TrendingDown className="w-5 h-5 text-rose-400" />
              )}
              {isPositiveDelta ? `+${result.coverage_difference_pct.toFixed(1)}%` : `${result.coverage_difference_pct.toFixed(1)}%`}
            </div>
            <span className="text-[10px] text-cricket-slate">
              {isPositiveDelta ? 'Coverage gain' : isNeutralDelta ? 'Neutral impact' : 'Coverage reduction'}
            </span>
          </div>
        </div>

        {/* Zone Breakdown Table / Bars */}
        {result.zone_comparisons && result.zone_comparisons.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-cricket-slate">
              <span className="font-semibold text-cricket-gray uppercase tracking-wider text-[11px]">
                Regional Spatial Trade-offs
              </span>
              <span>Original vs Custom</span>
            </div>

            <div className="space-y-2">
              {result.zone_comparisons.map((zone) => {
                const diff = zone.difference_pct;
                const isPos = diff > 0;
                const isZero = Math.abs(diff) < 0.1;

                return (
                  <div
                    key={zone.zone_key}
                    className="p-2.5 rounded-lg bg-cricket-dark-subtle/50 border border-cricket-dark-border/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{zone.zone_name}</span>
                        {zone.is_primary_target && (
                          <Badge variant="success" size="sm" className="text-[10px] py-0 px-1.5">
                            Target Corridor
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-cricket-slate">{zone.original_coverage_pct.toFixed(0)}%</span>
                        <span className="text-cricket-slate">→</span>
                        <span className="text-white font-bold">{zone.custom_coverage_pct.toFixed(0)}%</span>
                        <span
                          className={`text-[11px] font-semibold ml-1 ${
                            isZero
                              ? 'text-slate-400'
                              : isPos
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          ({isPos ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`})
                        </span>
                      </div>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="relative h-2 w-full bg-cricket-dark-base rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 left-0 bg-cricket-slate/40 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, zone.original_coverage_pct))}%` }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${
                          zone.is_primary_target
                            ? 'bg-cricket-lime'
                            : isPos
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, zone.custom_coverage_pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explain Strategy Button */}
        {onExplainTradeOffs && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full border-cricket-accent/50 text-cricket-accent hover:bg-cricket-accent/10"
              onClick={onExplainTradeOffs}
              isLoading={isExplaining}
              leftIcon={<Sparkles className="w-4 h-4 text-cricket-accent" />}
            >
              Analyze Strategic Trade-Offs with AI
            </Button>
          </div>
        )}

        {/* Model Limitations Footnote */}
        <div className="pt-2 border-t border-cricket-dark-border/40">
          <div className="flex items-start gap-1.5 text-[11px] text-cricket-slate leading-relaxed">
            <Info className="w-3.5 h-3.5 text-cricket-slate shrink-0 mt-0.5" />
            <span>
              <strong>Methodology:</strong> Spatial coverage represents Euclidean polygon intersection reachability. Assumes flat outfield, constant initial ball velocity, and straight trajectories without aerial bounce.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
