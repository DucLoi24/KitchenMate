import { forwardRef, useState } from 'react';
import { Eye, EyeSlash } from 'react-bootstrap-icons';
import InputField from './InputField';

const PasswordField = forwardRef(({ label, error, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-slate-800">
          {label}
        </label>
      )}
      <div className="relative">
        <InputField
          ref={ref}
          type={visible ? 'text' : 'password'}
          error={undefined}
          className="pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {visible ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
});

PasswordField.displayName = 'PasswordField';
export default PasswordField;