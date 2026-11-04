import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Info,
} from 'lucide-react';
import { TacticalExplanation } from '../../types/ai';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export interface TacticalExplanationCardProps {
  explanation: TacticalExplanation;
  userQuery?: string;
}

export const TacticalExplanationCard: React.FC<TacticalExplanationCardProps> = ({
  explanation,
  userQuery,
}) => {
  return (
    <Card variant="glass" className="space-y-5 p-5 md:p-6 border-brand-blue/30 shadow-surface-elevation">
      {/* 1. Card Top Bar: Query, Model & Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-surface-border gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center font-bold text-xs shadow-glow-blue">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-content-primary">
              {userQuery || explanation.configuration_name || 'Tactical Analysis'}
            </h4>
            <span className="text-[11px] text-content-muted">
              {explanation.configuration_name ? `Field Setup: ${explanation.configuration_name}` : 'Cricket Tactical AI'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={explanation.is_ai_generated ? 'blue' : 'lime'} size="sm">
            <Cpu className="w-3 h-3 mr-1" />
            {explanation.is_ai_generated ? 'Gemini 2.0 Flash' : 'Grounded Engine'}
          </Badge>
          <Badge variant="neutral" size="sm">
            {explanation.confidence_label}
          </Badge>
        </div>
      </div>

      {/* 2. Tactical Summary */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-brand-lime font-semibold block">
          Tactical Summary
        </span>
        <p className="text-sm md:text-base text-content-primary leading-relaxed font-normal">
          {explanation.summary}
        </p>
      </div>

      {/* 3. Possible Tactical Reasons */}
      {explanation.possible_reasons && explanation.possible_reasons.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-content-secondary font-semibold flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-brand-blue" />
            Possible Tactical Reasons
          </span>
          <div className="grid grid-cols-1 gap-2">
            {explanation.possible_reasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border flex items-start gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-content-secondary leading-relaxed">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Protected vs Exposed Regions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Protected Regions */}
        <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-brand-lime/20 space-y-2">
          <span className="text-xs font-semibold text-brand-lime flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-lime" />
            Protected Scoring Areas
          </span>
          {explanation.protected_regions.length === 0 ? (
            <p className="text-xs text-content-muted italic">No specific boundary sectors reinforced.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {explanation.protected_regions.map((region, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-brand-lime/10 border border-brand-lime/30 text-[11px] font-medium text-brand-lime"
                >
                  ✓ {region}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Exposed Regions */}
        <div className="p-3.5 rounded-xl bg-surface-elevated/80 border border-amber-500/20 space-y-2">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Potentially Exposed Corridors
          </span>
          {explanation.potentially_exposed_regions.length === 0 ? (
            <p className="text-xs text-content-muted italic">No glaring coverage gaps identified.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {explanation.potentially_exposed_regions.map((region, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-medium text-amber-300"
                >
                  ! {region}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Supporting Evidence (Empirical Match Facts) */}
      {explanation.supporting_evidence && explanation.supporting_evidence.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface/90 border border-surface-border space-y-2">
          <span className="text-xs font-semibold text-tactical-success flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-tactical-success" />
            Supporting Empirical Evidence
          </span>
          <ul className="space-y-1 text-xs text-content-secondary">
            {explanation.supporting_evidence.map((ev, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-brand-lime font-bold">•</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Epistemic Assumptions & Limitations Banner */}
      <div className="p-3.5 rounded-xl bg-midnight/60 border border-surface-border text-xs text-content-muted space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 text-content-secondary font-semibold">
          <Info className="w-3.5 h-3.5 text-brand-blue" />
          <span>Epistemological Guardrail Notice</span>
        </div>
        {explanation.limitations && explanation.limitations.length > 0 ? (
          <p className="italic">{explanation.limitations[0]}</p>
        ) : (
          <p className="italic">
            The available match telemetry does not record the captain's explicit verbal instructions. Tactical explanations model cricket orthodoxy rather than mind-reading.
          </p>
        )}
      </div>
    </Card>
  );
};
