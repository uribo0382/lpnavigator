import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  dropdownPosition?: 'auto' | 'top' | 'bottom';
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  fullWidth = false,
  helperText,
  options,
  onChange,
  className = '',
  disabled,
  value,
  dropdownPosition = 'auto'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseStyles = 'block w-full relative rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm text-left transition duration-200 ease-in-out hover:bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 sm:text-sm';
  const errorStyles = error ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : '';
  const disabledStyles = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const widthStyles = fullWidth ? 'w-full' : '';
  const combinedStyles = [baseStyles, errorStyles, disabledStyles, widthStyles, className].join(' ');

  const selectedLabel = options.find(opt => opt.value === value)?.label || '選択してください';

  const getDropdownPosition = () => {
    if (!containerRef.current) return {};
    
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const bottomSpace = viewportHeight - rect.bottom;
    const dropdownHeight = Math.min(options.length * 36, 250); // 各オプションの高さを約36pxと仮定、最大高さ制限
    
    // 表示方向の強制指定がある場合
    if (dropdownPosition === 'top') {
      return {
        width: containerRef.current.offsetWidth + 'px',
        left: '0',
        bottom: '100%',
        marginBottom: '2px',
        maxHeight: '250px',
        overflow: 'auto'
      };
    } else if (dropdownPosition === 'bottom') {
      return {
        width: containerRef.current.offsetWidth + 'px',
        left: '0',
        top: '100%',
        marginTop: '2px',
        maxHeight: '250px',
        overflow: 'auto'
      };
    }
    
    // auto: 下部のスペースが不足している場合は上部に表示
    if (bottomSpace < dropdownHeight && rect.top > dropdownHeight) {
      return {
        width: containerRef.current.offsetWidth + 'px',
        left: '0',
        bottom: '100%',
        marginBottom: '2px',
        maxHeight: '250px',
        overflow: 'auto'
      };
    }
    
    // デフォルトは下部に表示
    return {
      width: containerRef.current.offsetWidth + 'px',
      left: '0',
      top: '100%',
      marginTop: '2px',
      maxHeight: '250px',
      overflow: 'auto'
    };
  };

  return (
    <div ref={containerRef} className={`${fullWidth ? 'w-full' : ''} relative`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          className={combinedStyles}
          disabled={disabled}
          onClick={() => setIsOpen(prev => !prev)}
        >
          {selectedLabel}
        </button>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={18} className="text-gray-500" />
        </div>
        {isOpen && (
          <ul className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-xl" style={getDropdownPosition()}>
            {options.map(opt => (
              <li
                key={opt.value}
                className="px-3 py-2 hover:bg-primary-50 cursor-pointer text-gray-700"
                onClick={() => { onChange?.(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-error-500' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

Select.displayName = 'Select';

export default Select;