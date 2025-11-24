import React from 'react';

interface InputGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  className?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, name, value, onChange, placeholder = '', type = 'text', icon, className }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                {icon}
            </div>
        )}
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input-field ${icon ? 'pl-10' : ''} ${className || ''}`}
        />
      </div>
    </div>
  );
};

export default InputGroup;