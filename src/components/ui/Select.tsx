import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id: propId, name, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const finalName = name || propId;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 mr-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          name={finalName}
          className={cn(
            "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl",
            "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "text-slate-900 text-sm",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={errorId}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
