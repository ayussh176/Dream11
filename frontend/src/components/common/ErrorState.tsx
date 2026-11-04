import React from 'react';
import { cn } from '../../utils/cn';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Tactical Feed Interrupted',
  message = 'Unable to fetch field telemetry or AI analysis. Check your backend status.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-tactical-critical/5 border border-tactical-critical/20',
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-tactical-critical/15 text-tactical-critical mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-content-primary">{title}</h4>
      <p className="text-xs text-content-secondary mt-1.5 max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5 border-tactical-critical/40 hover:bg-tactical-critical/10 text-content-primary"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={onRetry}
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
};

