import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'glass' | 'subtle';
  isGlowLime?: boolean;
  isGlowBlue?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', isGlowLime, isGlowBlue, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-200';

    const variants = {
      default: 'bg-surface/90 border border-surface-border shadow-sm',
      elevated: 'bg-surface-elevated/95 border border-surface-border shadow-surface-elevation',
      interactive:
        'bg-surface/80 border border-surface-border hover:border-white/[0.14] hover:bg-surface-elevated/80 cursor-pointer shadow-sm hover:shadow-glass-sm',
      glass: 'glass-panel',
      subtle: 'glass-subtle',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          isGlowLime && 'hover:border-brand-lime/30 hover:shadow-glow-lime',
          isGlowBlue && 'hover:border-brand-blue/30 hover:shadow-glow-blue',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 border-b border-surface-border/70 flex items-center justify-between', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-base font-semibold text-content-primary tracking-tight font-display', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-xs text-content-secondary mt-1', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 pt-0 flex items-center', className)} {...props} />
);
