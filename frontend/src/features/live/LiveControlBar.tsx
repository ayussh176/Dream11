import React, { useState } from 'react';
import { LiveMatchState } from '../../types/live';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  ChevronDown,
} from 'lucide-react';

interface LiveControlBarProps {
  state: LiveMatchState;
  onAdvance: () => void;
  onTogglePlay: () => void;
  onReset: () => void;
  onIngestDelivery: (payload: any) => Promise<void>;
  isLoading: boolean;
  availableMatches?: any[];
  onSelectMatch?: (matchId: string) => void;
}

export const LiveControlBar: React.FC<LiveControlBarProps> = ({
  state,
  onAdvance,
  onTogglePlay,
  onReset,
  onIngestDelivery,
  isLoading,
  availableMatches = [],
  onSelectMatch,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ingestCommentary, setIngestCommentary] = useState(
    'Wide outside off-stump, carved hard between backward point and deep cover for FOUR.'
  );
  const [ingestRuns, setIngestRuns] = useState(4);
  const [ingestWickets, setIngestWickets] = useState(0);

  const handleSimulateExternal = async () => {
    const payload = {
      match_id: state.match_id,
      over_number: state.current_over,
      ball_number: state.current_ball + 1,
      batter_name: state.striker.name,
      bowler_name: state.bowler.name,
      runs: ingestRuns,
      wickets: ingestWickets,
      extras: 0,
      delivery_type: 'legal',
      speed_kph: 143.5,
      commentary: ingestCommentary,
      fielders: state.fielders.map((f) => ({
        player_id: f.player_id || f.id,
        player_name: f.player_name,
        fielding_position: f.fielding_position,
        x: f.x,
        y: f.y,
        is_wicketkeeper: f.is_wicketkeeper,
      })),
    };

    await onIngestDelivery(payload);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="p-4 rounded-2xl glass-panel flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Left: Match Context & Scores */}
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          {/* Live Indicator */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              IN-PLAY
            </span>
          </div>

          {/* Match Switcher Dropdown */}
          {availableMatches.length > 0 && onSelectMatch && (
            <div className="relative">
              <select
                aria-label="Select Live Match"
                value={state.match_id.replace('live-', '').replace('cricbuzz-', '')}
                onChange={(e) => onSelectMatch(e.target.value)}
                className="appearance-none bg-surface/90 border border-surface-border text-xs font-semibold rounded-xl pl-3 pr-8 py-2 text-content-primary focus:border-brand-lime outline-none max-w-[260px] md:max-w-[320px] truncate cursor-pointer shadow-sm hover:border-white/[0.14] transition-colors"
              >
                {availableMatches.map((m) => (
                  <option key={m.id} value={m.external_id || m.id}>
                    {m.status?.toLowerCase().includes('live') || m.status?.toLowerCase().includes('progress') ? '● ' : '○ '}
                    {m.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-content-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {/* Score & Batting Team */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-bold text-content-primary tracking-tight">
              {state.batting_team}
            </span>
            <span className="text-2xl font-extrabold font-mono tracking-tight text-brand-lime">
              {state.score}/{state.wickets}
            </span>
            <span className="text-xs font-mono text-content-muted">
              ({state.current_over}.{state.current_ball} {state.current_over <= 20 && !state.tournament?.toLowerCase().includes('trophy') ? '/ 20 ov' : 'ov'})
            </span>
          </div>

          {/* Equation Strip */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-content-secondary">
            {state.target && (
              <span className="text-content-muted">
                Target: <strong className="text-content-primary">{state.target}</strong>
              </span>
            )}
            {state.required_rate && (
              <Badge variant="warning" size="sm">
                Req: {state.required_rate.toFixed(1)}
              </Badge>
            )}
            <Badge variant="neutral" size="sm">
              CRR: {state.current_rate.toFixed(1)}
            </Badge>
          </div>
        </div>

        {/* Right: Controller Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Auto-Play Toggle */}
          <Button
            variant={state.is_live_stream_active ? 'primary' : 'outline'}
            size="sm"
            onClick={onTogglePlay}
            disabled={isLoading}
            leftIcon={
              state.is_live_stream_active ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )
            }
          >
            {state.is_live_stream_active ? 'Pause Stream' : 'Live Stream'}
          </Button>

          {/* Step Next Ball */}
          <Button
            variant="outline"
            size="sm"
            onClick={onAdvance}
            disabled={isLoading || state.is_live_stream_active}
            leftIcon={<SkipForward className="w-3.5 h-3.5 text-brand-blue" />}
          >
            Next Ball
          </Button>

          {/* Reset */}
          <button
            onClick={onReset}
            disabled={isLoading}
            title="Reset match stream"
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-white/[0.04] transition-colors disabled:opacity-40"
            aria-label="Reset match stream"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Modal Trigger */}
          <Button
            variant="glass"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
          >
            Simulate
          </Button>
        </div>
      </div>

      {/* External Live Ingest Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Simulate In-Game Delivery Feed"
        description="Inject custom delivery results to test dynamic field reconfiguration and risk recalculation."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-content-secondary font-medium mb-1.5">
              Select Outcome
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Dot (0)', runs: 0, w: 0 },
                { label: 'Single (1)', runs: 1, w: 0 },
                { label: 'Boundary (4)', runs: 4, w: 0 },
                { label: 'Wicket (W)', runs: 0, w: 1 },
              ].map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setIngestRuns(opt.runs);
                    setIngestWickets(opt.w);
                  }}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                    ingestRuns === opt.runs && ingestWickets === opt.w
                      ? 'border-brand-lime bg-brand-lime/10 text-brand-lime'
                      : 'border-surface-border bg-surface text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-content-secondary font-medium mb-1.5">
              Ball Commentary
            </label>
            <textarea
              value={ingestCommentary}
              onChange={(e) => setIngestCommentary(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-midnight/80 border border-surface-border p-3 text-content-primary focus:border-brand-lime outline-none transition-colors"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-content-muted leading-relaxed">
            <span className="font-semibold text-content-secondary block mb-1">
              Live Ingest API:
            </span>
            External telemetry services push JSON packets to <code className="text-brand-lime font-mono">POST /api/live/ingest</code>.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border/60">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSimulateExternal}>
              Ingest & Predict
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
