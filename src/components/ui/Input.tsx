import React, { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelClassName, error, showPasswordToggle = false, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="space-y-1.5">
        {label && (
          <label className={`block text-sm font-semibold ${labelClassName ?? 'text-gray-700'}`}>
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            type={inputType}
            className={`block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 group-hover:shadow-md ${error ? 'border-red-400 focus:ring-red-500' : ''} ${className}`}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
