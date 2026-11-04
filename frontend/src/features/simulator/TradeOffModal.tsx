import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Compass,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ExplainTradeOffResponse } from '../../types/simulator';

interface TradeOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: ExplainTradeOffResponse | null;
  isLoading: boolean;
}

export const TradeOffModal: React.FC<TradeOffModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Strategic Trade-Off Critique"
      maxWidth="lg"
    >
      <div className="space-y-5">
        {isLoading ? (
          <div className="py-12">
            <LoadingState message="Synthesizing tactical trade-offs and spatial geometry..." />
          </div>
        ) : !analysis ? (
          <div className="py-8 text-center text-cricket-slate">
            <p>No trade-off analysis available. Please run a simulation first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-2 border-b border-cricket-dark-border/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cricket-accent" />
                <span className="text-sm font-semibold text-white">
                  Fielding Strategy Evaluation
                </span>
              </div>
              <Badge variant={analysis.is_ai_generated ? 'lime' : 'neutral'} size="sm">
                {analysis.is_ai_generated ? 'Gemini Grounded' : 'Deterministic Analysis'}
              </Badge>
            </div>

            {/* Strategic Summary */}
            <div className="p-3.5 rounded-lg bg-cricket-dark-subtle/80 border border-cricket-dark-border/60">
              <h4 className="text-xs font-semibold text-cricket-lime uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cricket-lime" />
                Strategic Summary
              </h4>
              <p className="text-sm text-gray-200 leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Improvements & Trade-offs in 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Tactical Improvements */}
              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Gained Coverage & Benefits
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {analysis.improvements && analysis.improvements.length > 0 ? (
                    analysis.improvements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-cricket-slate">No significant gains in this corridor.</li>
                  )}
                </ul>
              </div>

              {/* Vulnerabilities & Trade-offs */}
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-2">
                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Exposed Corridors & Risks
                </h4>
                <ul className="space-y-1.5 text-xs text-gray-300">
                  {analysis.trade_offs && analysis.trade_offs.length > 0 ? (
                    analysis.trade_offs.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-cricket-slate">No adjacent regions severely compromised.</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Situational Context */}
            {analysis.situational_use_case && (
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-xs space-y-1">
                <span className="font-semibold text-blue-400 uppercase tracking-wider text-[10px] block">
                  Optimal Match Situation
                </span>
                <p className="text-gray-300 leading-relaxed">
                  {analysis.situational_use_case}
                </p>
              </div>
            )}

            {/* Epistemological Disclaimer */}
            <div className="p-2.5 rounded bg-cricket-dark-base border border-cricket-dark-border/40 text-[11px] text-cricket-slate flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-cricket-accent shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {analysis.disclaimer ||
                  'Analysis is derived strictly from calculated geometric spatial reachability metrics and match data. Does not claim certainty of batter stroke selection or guarantee boundary prevention.'}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
