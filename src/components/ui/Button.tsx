import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, type = 'button', ...props }, ref) => {
    const variants = {
      primary: 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800',
      secondary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950',
      outline: 'border-2 border-slate-200 text-slate-900 hover:border-slate-900 hover:bg-slate-50',
      ghost: 'text-slate-700 hover:bg-slate-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin rtl:ml-2 rtl:mr-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
