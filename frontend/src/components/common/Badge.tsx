import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'lime' | 'blue' | 'success' | 'warning' | 'critical' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full border select-none transition-colors';

  const variants = {
    lime: 'bg-brand-lime/[0.12] text-brand-lime border-brand-lime/20',
    blue: 'bg-brand-blue/[0.12] text-brand-blue border-brand-blue/20',
    success: 'bg-tactical-success/10 text-tactical-success border-tactical-success/20',
    warning: 'bg-tactical-warning/10 text-tactical-warning border-tactical-warning/20',
    critical: 'bg-tactical-critical/10 text-tactical-critical border-tactical-critical/20',
    neutral: 'bg-white/[0.04] text-content-secondary border-white/[0.08]',
  };

  const dotColors = {
    lime: 'bg-brand-lime',
    blue: 'bg-brand-blue',
    success: 'bg-tactical-success',
    warning: 'bg-tactical-warning',
    critical: 'bg-tactical-critical',
    neutral: 'bg-content-muted',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5 font-mono font-medium',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 font-sans',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
