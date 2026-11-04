import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, Compass } from 'lucide-react';
import { MatchContext, DeliverySummary, FieldConfiguration } from '../../types/cricket';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export interface MatchContextPanelProps {
  context: MatchContext | null;
  delivery: DeliverySummary | null;
  fieldConfig: FieldConfiguration | null;
  matchId: string;
  deliveryId: string;
}

export const MatchContextPanel: React.FC<MatchContextPanelProps> = ({
  context,
  delivery,
  fieldConfig,
  matchId,
  deliveryId,
}) => {
  const navigate = useNavigate();

  return (
    <Card variant="elevated" className="space-y-4 p-4 md:p-5">
      <CardHeader className="p-0 pb-3 border-b border-surface-border">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-brand-lime" />
            <CardTitle className="text-sm font-semibold">Active Match Context</CardTitle>
          </div>
          <Badge variant="lime" size="sm">
            Ball {delivery ? `${delivery.over_number}.${delivery.ball_number}` : '19.1'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 space-y-3.5 text-xs">
        {/* Match Identity */}
        <div>
          <span className="text-[10px] uppercase font-mono text-content-muted block">Match Fixture</span>
          <span className="font-semibold text-content-primary block mt-0.5">
            {context?.match_name || 'Apex Titans vs Coastal Mavericks'}
          </span>
          <span className="text-[11px] text-content-secondary">{context?.venue}</span>
        </div>

        {/* Current Duel */}
        <div className="p-3 rounded-xl bg-surface border border-surface-border space-y-1.5">
          <div className="text-[10px] uppercase font-mono text-content-muted">Active Duel</div>
          <div className="flex justify-between items-center">
            <span className="text-content-secondary">Bowler:</span>
            <span className="font-semibold text-content-primary">
              {delivery?.bowler_name || 'A. Nair'} (RF)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-content-secondary">Batter:</span>
            <span className="font-semibold text-content-primary">
              {delivery?.batter_name || 'V. Roy'}
            </span>
          </div>
          {delivery?.speed_kph && (
            <div className="flex justify-between items-center pt-1 border-t border-surface-border/60">
              <span className="text-content-secondary">Delivery:</span>
              <span className="font-mono text-brand-blue font-medium">
                {delivery.speed_kph} km/h · {delivery.length}
              </span>
            </div>
          )}
        </div>

        {/* Score & Situation */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-lg bg-surface border border-surface-border">
            <div className="text-[10px] text-content-muted uppercase font-mono">Target Needed</div>
            <div className="text-sm font-bold text-tactical-warning font-mono mt-0.5">
              {context?.runs_needed ?? 19} off {context?.balls_remaining ?? 6}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-surface border border-surface-border">
            <div className="text-[10px] text-content-muted uppercase font-mono">Required Rate</div>
            <div className="text-sm font-bold text-brand-lime font-mono mt-0.5">
              {context?.required_run_rate?.toFixed(2) ?? '19.00'} rpo
            </div>
          </div>
        </div>

        {/* Field Setting Name */}
        <div className="p-2.5 rounded-lg bg-surface border border-surface-border">
          <div className="text-[10px] text-content-muted uppercase font-mono">Active Field Setting</div>
          <div className="text-xs font-semibold text-brand-lime mt-0.5">
            {fieldConfig?.configuration_name || delivery?.field_configuration_name || 'Off-Side Death Lock (6-3)'}
          </div>
          <div className="text-[10px] text-content-secondary mt-0.5">
            {fieldConfig?.total_fielders_count || 9} outfielders + 1 wicketkeeper
          </div>
        </div>

        {/* Link back to Tactical Radar */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          leftIcon={<Radar className="w-3.5 h-3.5 text-brand-lime" />}
          onClick={() => navigate(`/radar?matchId=${matchId}&deliveryId=${deliveryId}`)}
        >
          View Field on Tactical Radar
        </Button>
      </CardContent>
    </Card>
  );
};
