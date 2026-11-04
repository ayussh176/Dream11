import React from 'react';
import { cn } from '../../utils/cn';
import { Layers } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface/40 border border-surface-border',
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-surface-elevated border border-surface-border text-content-secondary mb-4">
        {icon || <Layers className="w-6 h-6 text-content-muted" />}
      </div>
      <h4 className="text-base font-semibold text-content-primary">{title}</h4>
      <p className="text-xs text-content-secondary mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

