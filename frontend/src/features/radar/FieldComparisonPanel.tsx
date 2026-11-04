import React from 'react';
import { MoveRight, Eye, EyeOff, Shuffle } from 'lucide-react';
import { FieldComparison } from '../../types/cricket';

export interface FieldComparisonPanelProps {
  comparison: FieldComparison | null;
  isActive: boolean;
  onToggleActive: () => void;
  isLoading?: boolean;
}

export const FieldComparisonPanel: React.FC<FieldComparisonPanelProps> = ({
  comparison,
  isActive,
  onToggleActive,
  isLoading = false,
}) => {
  return (
    <div className="rounded-2xl bg-surface border border-surface-border p-4 space-y-4">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-brand-lime" />
          <h4 className="text-sm font-semibold text-content-primary">
            Field Movement Comparison
          </h4>
        </div>

        <button
          onClick={onToggleActive}
          disabled={isLoading || !comparison}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isActive
              ? 'bg-brand-lime text-midnight font-bold shadow-glow-lime'
              : 'bg-surface-elevated text-content-secondary border border-surface-border hover:text-content-primary'
          }`}
        >
          {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{isActive ? 'Overlay Active' : 'Show Overlay'}</span>
        </button>
      </div>

      {/* Visual Legend */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated border border-surface-border text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-brand-lime border border-midnight" />
          <span className="text-content-primary">Current Spot</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full border-2 border-dashed border-amber-500" />
          <span className="text-amber-400">Previous Spot</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-500" />
          <span className="text-content-muted">Shift Vector</span>
        </div>
      </div>

      {comparison && (
        <div className="space-y-3">
          {/* Tactical Summary */}
          <div className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border text-xs text-content-secondary leading-relaxed">
            <span className="font-semibold text-content-primary block mb-1">
              Configuration Delta:
            </span>
            {comparison.tactical_summary}
          </div>

          {/* Changed Fielders List */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            <div className="text-[10px] font-mono uppercase text-content-muted flex justify-between">
              <span>Shifted Fielders ({comparison.total_shifted_fielders})</span>
              <span>Displacement</span>
            </div>

            {comparison.movement_differences.length === 0 ? (
              <div className="py-3 text-center text-xs text-content-muted italic">
                No field movements between these deliveries. Field configuration was maintained.
              </div>
            ) : (
              comparison.movement_differences.map((diff) => (
                <div
                  key={diff.player_id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/50 border border-surface-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <MoveRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-content-primary">{diff.player_name}</div>
                      <div className="text-[10px] text-content-muted">
                        {diff.from_position} → <span className="text-brand-lime">{diff.to_position}</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-amber-400 font-medium">
                    Δ {diff.displacement_normalized.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
