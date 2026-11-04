import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radar,
  Sparkles,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Match overview & command center',
      isLive: false,
    },
    {
      to: '/live',
      label: 'Live Arena',
      icon: Radio,
      description: 'Real-time telemetry & prediction',
      isLive: true,
    },
    {
      to: '/radar',
      label: 'Tactical Radar',
      icon: Radar,
      description: 'Spatial field geometry & duels',
      isLive: false,
    },
    {
      to: '/explainer',
      label: 'AI Explainer',
      icon: Sparkles,
      description: 'Contextual field reasoning',
      isLive: false,
    },
    {
      to: '/simulator',
      label: 'Shadow Captain',
      icon: ShieldAlert,
      description: 'Geometry & coverage sandbox',
      isLive: false,
    },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-surface/80 backdrop-blur-xl border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-surface-border/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-lime text-midnight font-black text-sm tracking-tighter shadow-glow-lime">
            D
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base tracking-tight text-content-primary">
                Dugout<span className="text-brand-lime">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/[0.04] text-content-muted border border-white/[0.06]">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-content-muted leading-none mt-0.5">
              Cricket Tactical Companion
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-content-muted/80">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                  isActive
                    ? 'bg-white/[0.06] text-content-primary font-semibold border border-white/[0.08] shadow-sm'
                    : 'text-content-secondary hover:text-content-primary hover:bg-white/[0.03]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-brand-lime/15 text-brand-lime'
                          : 'text-content-muted group-hover:text-content-primary'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="leading-snug truncate">{item.label}</div>
                      <div className="text-[11px] text-content-muted font-normal truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {item.isLive && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-surface-border/70">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-content-secondary font-medium">Grounded Engine</span>
            <span className="text-[11px] font-mono text-tactical-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tactical-success" />
              Active
            </span>
          </div>
          <p className="text-[10px] text-content-muted leading-relaxed">
            Voronoi spatial coverage & Gemini contextual reasoning
          </p>
        </div>
      </div>
    </aside>
  );
};
