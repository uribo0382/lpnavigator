import React, { forwardRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      fullWidth = false,
      helperText,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm placeholder-gray-400 transition duration-200 ease-in-out hover:bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:text-sm';
    const errorStyles = error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : '';
    const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
    const widthStyles = fullWidth ? 'w-full' : '';

    const combinedStyles = [
      baseStyles,
      errorStyles,
      disabledStyles,
      widthStyles,
      className,
    ].join(' ');

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={combinedStyles}
          style={{ caretColor: 'var(--color-gray-800)' }}
          disabled={disabled}
          {...props}
        />
        {(error || helperText) && (
          <p className={`mt-1 text-sm ${error ? 'text-error-500' : 'text-gray-500'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;