import React from 'react';
import { RealtimeFieldPrediction } from '../../types/live';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { TrendingUp, ShieldAlert, Target, Crosshair } from 'lucide-react';

interface PredictionMetricsCardProps {
  prediction: RealtimeFieldPrediction;
}

export const PredictionMetricsCard: React.FC<PredictionMetricsCardProps> = ({ prediction }) => {
  const xr = prediction.expected_runs;
  const xrColor =
    xr > 1.8 ? 'text-rose-400' : xr > 1.3 ? 'text-amber-400' : 'text-emerald-400';
  const xrStatus =
    xr > 1.8 ? 'High Boundary Risk' : xr > 1.3 ? 'Balanced Scoring' : 'Run Choke Trap';

  return (
    <Card className="p-5 glass-panel space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-lime/10 text-brand-lime border border-brand-lime/20 flex items-center justify-center">
            <Crosshair className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-primary font-display tracking-tight">
              Real-Time Field Placement Prediction
            </h3>
            <p className="text-xs text-content-muted">
              Spatial geometry & probabilistic outcome distribution
            </p>
          </div>
        </div>
        <Badge variant="lime" size="sm" dot>
          Live Model
        </Badge>
      </div>

      {/* Top Telemetry KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Expected Runs */}
        <div className="p-4 rounded-xl bg-midnight/60 border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-content-muted mb-1">
            <span>Expected Runs (xR)</span>
            <TrendingUp className="w-3.5 h-3.5 text-content-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${xrColor}`}>
              {xr.toFixed(2)}
            </span>
            <span className="text-xs text-content-muted">runs/ball</span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-content-secondary flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                xr > 1.8 ? 'bg-rose-400' : xr > 1.3 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            {xrStatus}
          </div>
        </div>

        {/* Wicket Threat Meter */}
        <div className="p-4 rounded-xl bg-midnight/60 border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-content-muted mb-1">
            <span>Wicket Threat</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-amber-400">
              {(prediction.wicket_probability * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-content-muted">dismissal risk</span>
          </div>
          <div className="mt-2 text-[11px] font-medium text-amber-300/80 truncate">
            {prediction.primary_trap.slice(0, 32)}...
          </div>
        </div>
      </div>

      {/* Field Balance Configuration Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.02] border border-surface-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-content-muted">Layout:</span>
          <span className="font-semibold text-content-primary">
            {prediction.field_balance}
          </span>
        </div>
        <div className="flex items-center gap-2 text-content-secondary text-[11px] font-mono">
          <span>{prediction.boundary_riders} Boundary</span>
          <span>•</span>
          <span>{prediction.inner_ring_fielders} Ring</span>
        </div>
      </div>

      {/* Outcome Probability Bars */}
      <div className="space-y-2.5">
        <div className="flex justify-between items-center text-xs font-semibold text-content-primary">
          <span>Predicted Shot Outcomes</span>
          <span className="font-mono text-content-muted text-[11px]">Normalized 100%</span>
        </div>

        {/* Multi-segmented distribution bar */}
        <div className="h-3 w-full rounded-full bg-midnight/90 overflow-hidden flex border border-surface-border/60">
          <div
            style={{ width: `${prediction.dot_probability * 100}%` }}
            className="bg-emerald-500 hover:opacity-90 transition-all"
            title={`Dot: ${(prediction.dot_probability * 100).toFixed(1)}%`}
          />
          <div
            style={{ width: `${prediction.single_probability * 100}%` }}
            className="bg-sky-400 hover:opacity-90 transition-all"
            title={`1-2 Runs: ${(prediction.single_probability * 100).toFixed(1)}%`}
          />
          <div
            style={{ width: `${prediction.boundary_four_probability * 100}%` }}
            className="bg-amber-400 hover:opacity-90 transition-all"
            title={`Four: ${(prediction.boundary_four_probability * 100).toFixed(1)}%`}
          />
          <div
            style={{ width: `${prediction.maximum_six_probability * 100}%` }}
            className="bg-rose-500 hover:opacity-90 transition-all"
            title={`Six: ${(prediction.maximum_six_probability * 100).toFixed(1)}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="block text-content-muted text-[10px]">Dot (0)</span>
            <span className="font-bold font-mono text-emerald-400">
              {(prediction.dot_probability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="block text-content-muted text-[10px]">Single (1-2)</span>
            <span className="font-bold font-mono text-sky-400">
              {(prediction.single_probability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="block text-content-muted text-[10px]">Four (4)</span>
            <span className="font-bold font-mono text-amber-400">
              {(prediction.boundary_four_probability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="block text-content-muted text-[10px]">Six (6)</span>
            <span className="font-bold font-mono text-rose-400">
              {(prediction.maximum_six_probability * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Predicted Shot Callout */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-brand-lime/20 flex items-start gap-3">
        <Target className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="text-[10px] font-bold text-brand-lime uppercase tracking-wider">
            Predicted Batter Trajectory
          </div>
          <div className="text-sm font-semibold text-content-primary">
            {prediction.predicted_shot_type}
          </div>
          <div className="text-xs text-content-muted">
            Targeting angle {prediction.predicted_shot_angle_deg.toFixed(1)}° into uncovered boundary arc.
          </div>
        </div>
      </div>
    </Card>
  );
};
