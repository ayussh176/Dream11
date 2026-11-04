import React from 'react';
import { cn } from '../../utils/cn';
import { Radar } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  subtext?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Calculating tactical field geometry...',
  subtext = 'Processing ball tracking and coordinate kinematics',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface/50 border border-surface-border',
        className
      )}
    >
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-brand-lime/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-brand-blue/30 animate-pulse" />
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-surface-elevated border border-brand-lime/40 text-brand-lime shadow-glow-lime">
          <Radar className="w-6 h-6 animate-spin text-brand-lime" style={{ animationDuration: '3s' }} />
        </div>
      </div>
      <h4 className="text-sm font-semibold text-content-primary">{message}</h4>
      {subtext && <p className="text-xs text-content-secondary mt-1 max-w-sm">{subtext}</p>}
    </div>
  );
};

