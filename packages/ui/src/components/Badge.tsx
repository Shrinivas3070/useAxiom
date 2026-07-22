import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'proposed' | 'pending' | 'progress' | 'blocked' | 'completed' | 'error';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-colors duration-200 border-0 shadow-none';

    const variants = {
      default: 'bg-gray-200 text-gray-900',
      proposed: 'bg-blue-600 text-white',
      pending: 'bg-amber-500 text-white',
      progress: 'bg-purple-600 text-white',
      blocked: 'bg-red-600 text-white',
      completed: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white',
    };

    return (
      <span ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
