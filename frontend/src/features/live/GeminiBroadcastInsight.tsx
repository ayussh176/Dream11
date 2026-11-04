import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Sparkles } from 'lucide-react';

interface GeminiBroadcastInsightProps {
  insight: string;
  batterName: string;
  bowlerName: string;
}

export const GeminiBroadcastInsight: React.FC<GeminiBroadcastInsightProps> = ({
  insight,
  batterName,
  bowlerName,
}) => {
  return (
    <Card className="p-5 glass-panel border border-white/[0.08] shadow-glass-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-blue/10 border border-brand-blue/20 text-brand-blue flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-content-primary font-display">
                Tactical Analyst Commentary
              </h4>
              <Badge variant="blue" size="sm">
                Gemini Broadcast Intelligence
              </Badge>
            </div>
            <p className="text-[11px] text-content-muted mt-0.5">
              Live duel analysis: {bowlerName} to {batterName}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-content-muted uppercase tracking-wider hidden sm:inline">
          Live Reasoning
        </span>
      </div>

      {/* Broadcast Commentary Text */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-content-primary leading-relaxed font-sans">
        <span className="text-brand-lime font-bold font-mono mr-1.5 text-base">“</span>
        {insight}
        <span className="text-brand-lime font-bold font-mono ml-1.5 text-base">”</span>
      </div>
    </Card>
  );
};
