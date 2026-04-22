import { forwardRef, useState } from 'react';
import { PiEye, PiEyeSlash } from 'react-icons/pi';
import InputField from './InputField';

const PasswordField = forwardRef(({ label, error, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-[--color-text-primary]">
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary] transition-colors"
        >
          {visible ? <PiEyeSlash size={18} /> : <PiEye size={18} />}
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