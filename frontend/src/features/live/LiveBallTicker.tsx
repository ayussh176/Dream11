import React from 'react';
import { LiveMatchState } from '../../types/live';
import { Card } from '../../components/common/Card';
import { Gauge, User, Shield } from 'lucide-react';

interface LiveBallTickerProps {
  state: LiveMatchState;
}

export const LiveBallTicker: React.FC<LiveBallTickerProps> = ({ state }) => {
  const result = state.last_delivery_result;
  const striker = state.striker;
  const bowler = state.bowler;

  return (
    <Card className="p-4 bg-surface/70 border border-surface-border">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Duel Participants */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Striker */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/10 text-brand-blue border border-brand-blue/20 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-content-muted font-medium uppercase tracking-wider">
                Striker
              </div>
              <div className="text-xs font-bold text-content-primary">
                {striker.name}
              </div>
              <div className="text-[11px] font-mono text-content-secondary">
                {striker.runs}* ({striker.balls}b) • SR {striker.strike_rate || 140.0}
              </div>
            </div>
          </div>

          <span className="text-content-muted font-mono text-xs">vs</span>

          {/* Bowler */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-content-muted font-medium uppercase tracking-wider">
                Bowler
              </div>
              <div className="text-xs font-bold text-content-primary">
                {bowler.name}
              </div>
              <div className="text-[11px] font-mono text-content-secondary">
                {bowler.wickets}/{bowler.runs_conceded} ({bowler.overs || '0.0'} ov)
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Last Delivery commentary & speed */}
        {result && (
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-surface-border/50">
            {result.speed_kph > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-surface-border text-xs font-mono text-content-secondary">
                <Gauge className="w-3.5 h-3.5 text-brand-blue" />
                <span>{result.speed_kph} km/h</span>
              </div>
            )}

            <div
              className={`px-3 py-1 rounded-lg font-mono font-bold text-xs tracking-wide ${
                result.wickets > 0
                  ? 'bg-red-500 text-white shadow-sm'
                  : result.runs === 4
                  ? 'bg-brand-lime text-midnight'
                  : result.runs === 6
                  ? 'bg-amber-400 text-midnight'
                  : 'bg-white/[0.06] text-content-primary border border-surface-border'
              }`}
            >
              {result.wickets > 0
                ? 'WICKET'
                : result.runs === 4
                ? 'FOUR'
                : result.runs === 6
                ? 'SIX'
                : `${result.runs} RUNS`}
            </div>

            {result.commentary && (
              <p className="text-xs text-content-secondary italic max-w-md line-clamp-1">
                "{result.commentary}"
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
