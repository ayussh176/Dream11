import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-midnight disabled:opacity-40 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-brand-lime text-midnight font-semibold hover:bg-brand-lime-hover shadow-sm hover:shadow-glow-lime focus:ring-brand-lime active:scale-[0.98]',
      secondary:
        'bg-surface-elevated text-content-primary hover:bg-surface-hover border border-surface-border focus:ring-white/20 active:scale-[0.98]',
      outline:
        'bg-white/[0.02] text-content-primary border border-surface-border hover:bg-white/[0.05] hover:border-white/[0.14] focus:ring-brand-blue active:scale-[0.98]',
      ghost:
        'bg-transparent text-content-secondary hover:text-content-primary hover:bg-white/[0.04] focus:ring-surface-border',
      danger:
        'bg-tactical-critical/10 text-tactical-critical border border-tactical-critical/20 hover:bg-tactical-critical/20 focus:ring-tactical-critical active:scale-[0.98]',
      glass:
        'bg-white/[0.05] text-content-primary border border-white/[0.1] hover:bg-white/[0.1] backdrop-blur-md active:scale-[0.98]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 font-medium',
      md: 'text-sm px-4 py-2 gap-2 font-medium',
      lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
