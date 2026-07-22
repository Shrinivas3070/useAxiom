import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-gray-900 tracking-wide">{label}</label>
        )}
        <input
          ref={ref}
          type={type}
          className={`px-4 py-3 bg-gray-100 border-2 ${
            error
              ? 'border-red-500 bg-white'
              : 'border-transparent focus:border-blue-500 focus:bg-white'
          } rounded-md text-gray-900 placeholder-gray-400 text-base focus:outline-none transition-all duration-200 shadow-none ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-500 font-bold">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-semibold text-gray-900 tracking-wide">{label}</label>
        )}
        <textarea
          ref={ref}
          className={`px-4 py-3 bg-gray-100 border-2 ${
            error
              ? 'border-red-500 bg-white'
              : 'border-transparent focus:border-blue-500 focus:bg-white'
          } rounded-md text-gray-900 placeholder-gray-400 text-base focus:outline-none transition-all duration-200 resize-none min-h-[100px] shadow-none ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-red-500 font-bold">{error}</span>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
