import React, { useEffect, useState } from 'react';
import { Menu, ShieldCheck, HelpCircle } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { healthService } from '../../services/healthService';
import { HealthCheckResponse } from '../../types/api';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await healthService.getHealth();
        if (mounted) {
          setHealth(res);
          setIsHealthy(res.status === 'healthy');
        }
      } catch {
        if (mounted) {
          setIsHealthy(false);
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-midnight/75 backdrop-blur-xl border-b border-surface-border px-4 md:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-content-secondary hover:text-content-primary hover:bg-white/[0.04] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-3">
          <span className="text-xs font-medium text-content-secondary tracking-wide">
            Dugout Tactical Operations
          </span>
          <span className="text-surface-border text-xs">•</span>
          <span className="text-xs text-content-muted hidden lg:inline">
            Understand the field. Challenge the captain.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend Connectivity Indicator */}
        <Tooltip
          content={
            isHealthy
              ? `Backend Connected (v${health?.version || '0.1.0'} - PostgreSQL Neon)`
              : 'Backend Disconnected: Check server on port 8000'
          }
          position="bottom"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-surface-border text-xs cursor-default hover:bg-white/[0.05] transition-colors">
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? 'bg-tactical-success' : isHealthy === false ? 'bg-tactical-critical' : 'bg-tactical-warning'
              }`}
            />
            <span className="text-content-secondary">
              {isHealthy ? 'Telemetry Online' : isHealthy === false ? 'Offline' : 'Connecting...'}
            </span>
          </div>
        </Tooltip>

        {/* Epistemic Guardrail Notice Pill */}
        <Tooltip
          content="Grounded in real geometry, RapidAPI feeds, and physical boundary constraints."
          position="bottom"
        >
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-surface-border text-xs text-content-secondary cursor-default hover:text-content-primary transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
            <span>Grounded Guardrails</span>
          </div>
        </Tooltip>

        {/* Help Info Button */}
        <Tooltip
          content="Coordinates are normalized [-1.0, 1.0] from batter's crease with boundary radius at 1.0."
          position="bottom"
        >
          <button
            className="p-2 rounded-full text-content-muted hover:text-content-primary hover:bg-white/[0.04] transition-colors"
            aria-label="Tactical ground guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </header>
  );
};
