import React from 'react';
import { useTranslation } from 'react-i18next';

const ModeSelector = ({ selectedMode, onModeChange }) => {
  const { t } = useTranslation();
  
  const modes = [
    {
      id: 'redesign',
      icon: '🎨'
    },
    {
      id: 'design',
      icon: '🏠'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover-lift
                     ${selectedMode === mode.id
                       ? 'border-blue-500 bg-blue-50 text-gray-800 shadow-soft scale-[1.02]'
                       : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-gray-800'
                     }`}
        >
          <div className="flex items-start space-x-3">
            <div className="text-2xl">{mode.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">{t(`modes.${mode.id}.name`)}</h4>
              <p className="text-sm opacity-80 mt-1">{t(`modes.${mode.id}.description`)}</p>
            </div>
            {selectedMode === mode.id && (
              <div className="text-blue-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default ModeSelector; 