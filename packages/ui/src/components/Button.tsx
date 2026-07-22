import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer tracking-wide';

    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-none border-0',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-105 shadow-none border-0',
      outline:
        'bg-transparent text-gray-900 border-4 border-gray-900 hover:bg-gray-900 hover:text-white shadow-none',
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-none border-0',
      danger: 'bg-red-500 text-white hover:bg-red-600 hover:scale-105 shadow-none border-0',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm gap-1.5 h-10',
      md: 'px-6 py-3 text-base gap-2 h-14',
      lg: 'px-8 py-4 text-lg gap-2.5 h-16',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
