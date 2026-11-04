import React, { useEffect, useState } from 'react';
import { X, User, Target, MoveRight, Loader2 } from 'lucide-react';
import { Fielder, PlayerProfile, PlayerStats } from '../../types/cricket';
import { cricketService } from '../../services/cricketService';
import { Badge } from '../../components/common/Badge';

export interface FielderInfoDrawerProps {
  fielder: Fielder | null;
  onClose: () => void;
}

export const FielderInfoDrawer: React.FC<FielderInfoDrawerProps> = ({ fielder, onClose }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!fielder) {
      setProfile(null);
      setStats(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const loadPlayerData = async () => {
      try {
        const [profData, statsData] = await Promise.all([
          cricketService.getPlayer(fielder.player_id),
          cricketService.getPlayerStats(fielder.player_id),
        ]);
        if (isMounted) {
          setProfile(profData);
          setStats(statsData);
        }
      } catch (err) {
        console.error('Failed to load fielder profile', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPlayerData();
    return () => {
      isMounted = false;
    };
  }, [fielder]);

  if (!fielder) return null;

  return (
    <div className="rounded-2xl bg-surface border border-surface-border p-5 shadow-surface-elevation space-y-4 animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-brand-lime/30 flex items-center justify-center text-brand-lime font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary">
              {profile?.name || fielder.player_name || 'Fielder'}
            </h3>
            <p className="text-xs text-content-secondary">{profile?.team || 'Fielding Team'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-surface-elevated transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-content-muted gap-2 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-brand-lime" />
          <span>Fetching verified player telemetry...</span>
        </div>
      ) : (
        <>
          {/* Tactical Position & Shift Status */}
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-secondary flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-brand-lime" /> Assigned Position:
              </span>
              <Badge variant={fielder.is_wicketkeeper ? 'neutral' : 'lime'} size="sm">
                {fielder.fielding_position}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span>Normalized Coordinates:</span>
              <span className="font-mono text-content-primary">
                ({fielder.x.toFixed(2)}, {fielder.y.toFixed(2)})
              </span>
            </div>

            {fielder.has_moved && fielder.prev_position && (
              <div className="mt-2 pt-2 border-t border-surface-border/60 flex items-center justify-between text-xs">
                <span className="text-tactical-warning flex items-center gap-1">
                  <MoveRight className="w-3.5 h-3.5" /> Shifted on this delivery:
                </span>
                <span className="text-content-secondary font-mono text-[11px]">
                  from {fielder.prev_position}
                </span>
              </div>
            )}
          </div>

          {/* Player Profile Details */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-surface-border">
              <span className="text-[10px] text-content-muted uppercase font-mono block">Role</span>
              <span className="font-medium text-content-primary">{profile?.role || 'All-Rounder'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-surface-border">
              <span className="text-[10px] text-content-muted uppercase font-mono block">Fielding Specialty</span>
              <span className="font-medium text-brand-blue truncate block">
                {profile?.fielding_position_specialty || fielder.fielding_position}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-surface-border">
              <span className="text-[10px] text-content-muted uppercase font-mono block">Batting Hand</span>
              <span className="font-medium text-content-primary">{profile?.batting_style || 'Right-hand bat'}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-elevated/60 border border-surface-border">
              <span className="text-[10px] text-content-muted uppercase font-mono block">Bowling Style</span>
              <span className="font-medium text-content-primary truncate block">
                {profile?.bowling_style || 'Right-arm medium'}
              </span>
            </div>
          </div>

          {/* Verified Match & Career Stats */}
          {stats && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase text-content-muted flex items-center justify-between">
                <span>Verified Match Records</span>
                <span className="text-[9px] text-brand-lime">Demo Verified</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-surface-elevated/80 border border-surface-border">
                  <div className="text-sm font-bold text-content-primary font-mono">{stats.catches}</div>
                  <div className="text-[10px] text-content-muted mt-0.5">Catches</div>
                </div>

                <div className="p-2 rounded-lg bg-surface-elevated/80 border border-surface-border">
                  <div className="text-sm font-bold text-content-primary font-mono">{stats.wickets_taken}</div>
                  <div className="text-[10px] text-content-muted mt-0.5">Wickets</div>
                </div>

                <div className="p-2 rounded-lg bg-surface-elevated/80 border border-surface-border">
                  <div className="text-sm font-bold text-brand-lime font-mono">
                    {stats.economy_rate > 0 ? stats.economy_rate.toFixed(2) : '-'}
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">Econ Rate</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
