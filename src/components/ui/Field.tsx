import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, forwardRef } from 'react';

const fieldBase =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }>(
  ({ label, hint, className = '', id, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</label>}
      <input ref={ref} id={id} className={`${fieldBase} ${className}`} {...rest} />
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }>(
  ({ label, className = '', id, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</label>}
      <textarea ref={ref} id={id} className={`${fieldBase} resize-none ${className}`} {...rest} />
    </div>
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label?: string }>(
  ({ label, className = '', id, children, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{label}</label>}
      <select ref={ref} id={id} className={`${fieldBase} cursor-pointer ${className}`} {...rest}>
        {children}
      </select>
    </div>
  )
);
Select.displayName = 'Select';
