import { forwardRef } from 'react';

const InputField = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-800">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`px-3 py-2 rounded-lg border text-slate-800
          bg-white transition-colors
          focus:outline-none focus:ring-2 focus:ring-orange-500/50
          ${error ? 'border-red-500' : 'border-slate-200'}
          ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';
export default InputField;