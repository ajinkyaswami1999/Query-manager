import React, { forwardRef } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
  leftIcon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelClassName, error, helperText, showPasswordToggle = false, leftIcon: LeftIcon, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className={`block text-xs font-semibold uppercase tracking-wider ${labelClassName ?? 'text-slate-700'}`}>
            {label}
          </label>
        )}
        <div className="relative group">
          {LeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`block w-full ${LeftIcon ? 'pl-10' : 'px-3.5'} ${showPasswordToggle ? 'pr-10' : 'px-3.5'} py-2.5 text-sm bg-white border border-slate-300 rounded-xl shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all duration-150 ${error ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-500/20' : 'hover:border-slate-400'} ${className}`}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
