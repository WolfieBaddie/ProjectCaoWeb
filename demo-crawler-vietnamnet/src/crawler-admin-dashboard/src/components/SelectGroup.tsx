import React from 'react';

interface SelectGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

const SelectGroup: React.FC<SelectGroupProps> = ({ label, name, value, onChange, children }) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-2">
        {label}
      </label>
      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="input-field appearance-none"
      >
        {children}
      </select>
    </div>
  );
};

export default SelectGroup;