import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange }) => {
  return (
    <button
      type="button"
      className={`${
        enabled ? 'bg-gray-800' : 'bg-gray-200'
      } relative inline-flex items-center h-7 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        className={`${
          enabled ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-5 h-5 transform bg-white rounded-full transition-transform`}
      />
    </button>
  );
};

export default ToggleSwitch;