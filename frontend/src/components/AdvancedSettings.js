import React from 'react';
import { useTranslation } from 'react-i18next';
import ModelSelector from './ModelSelector';

const AdvancedSettings = ({ 
  numRenders, 
  onNumRendersChange, 
  highQuality, 
  onHighQualityChange, 
  privateRender, 
  onPrivateRenderChange,
  advancedMode,
  onAdvancedModeChange,
  selectedModel,
  onModelChange
}) => {
  const { t } = useTranslation();
  
  const renderOptions = [
    { value: 1, label: t('advanced.oneRender'), description: t('advanced.singleResult') },
    { value: 2, label: t('advanced.twoRenders'), description: t('advanced.compareOptions') },
    { value: 3, label: t('advanced.threeRenders'), description: t('advanced.multipleVariations') },
    { value: 4, label: t('advanced.fourRenders'), description: t('advanced.maximumVariety') }
  ];

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-gray-700 font-medium">{t('advanced.processingMode')}</h4>
          <p className="text-gray-500 text-xs">{t('advanced.processingModeDesc')}</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onAdvancedModeChange(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-lift
                       ${!advancedMode 
                         ? 'bg-blue-500 text-white shadow-soft' 
                         : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            ⚡ {t('advanced.fastMode')}
          </button>
          <button
            onClick={() => onAdvancedModeChange(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all hover-lift
                       ${advancedMode 
                         ? 'bg-blue-500 text-white shadow-soft' 
                         : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            🎯 {t('advanced.advancedMode')}
          </button>
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <h4 className="text-gray-700 font-medium mb-3">{t('advanced.modelSelection', 'Model Selection')}</h4>
        <ModelSelector 
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      </div>

      {/* Number of Renders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-gray-700 font-medium">{t('advanced.numRenders')}</h4>
          <span className="text-blue-600 font-bold">{numRenders}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {renderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onNumRendersChange(option.value)}
              className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover-lift
                         ${numRenders === option.value
                           ? 'border-blue-500 bg-blue-50 text-gray-800 shadow-soft scale-[1.02]'
                           : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                         }`}
            >
              <h5 className="font-semibold text-sm">{option.label}</h5>
              <p className="text-xs opacity-80 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quality Settings */}
      <div>
        <h4 className="text-gray-700 font-medium mb-3">{t('advanced.qualitySettings')}</h4>
        
        <div className="space-y-3">
          {/* High Quality Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">🎨</span>
              </div>
              <div>
                <h5 className="text-gray-800 font-medium text-sm">{t('advanced.highQuality')}</h5>
                <p className="text-gray-600 text-xs">{t('advanced.highQualityDesc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={highQuality}
                onChange={(e) => onHighQualityChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 shadow-inner"></div>
            </label>
          </div>

          {/* Private Render Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-emerald-600 text-sm">🔒</span>
              </div>
              <div>
                <h5 className="text-gray-800 font-medium text-sm">{t('advanced.privateRender')}</h5>
                <p className="text-gray-600 text-xs">{t('advanced.privateRenderDesc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privateRender}
                onChange={(e) => onPrivateRenderChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Mode Info */}
      {advancedMode && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="text-blue-500 mt-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-blue-800 text-sm font-medium">{t('advanced.advancedModeActive')}</p>
              <p className="text-blue-600 text-xs mt-1">
                {t('advanced.advancedModeInfo')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Summary */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h5 className="text-gray-800 font-medium text-sm mb-3">{t('advanced.currentSettings')}</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">{t('advanced.mode')}:</span>
            <span className="text-gray-800 font-medium">{advancedMode ? t('advanced.advanced') : t('advanced.fast')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('advanced.model')}:</span>
            <span className="text-gray-800 font-medium">{selectedModel === 'erayyavuz' ? 'Premium' : 'Standard'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('advanced.renders')}:</span>
            <span className="text-gray-800 font-medium">{numRenders}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('advanced.quality')}:</span>
            <span className="text-gray-800 font-medium">{highQuality ? t('advanced.high') : t('advanced.standard')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t('advanced.privacy')}:</span>
            <span className="text-gray-800 font-medium">{privateRender ? t('advanced.private') : t('advanced.public')}</span>
          </div>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center space-x-3">
          <span className="text-purple-600 text-lg">⏱️</span>
          <div>
            <p className="text-purple-800 text-sm font-medium">
              {t('advanced.estimatedTime')}: {t('advanced.estimatedTimeMinutes', { time: advancedMode ? '2-3' : '1-2' })}
            </p>
            {numRenders > 1 && (
              <p className="text-purple-600 text-xs mt-1">
                {t('advanced.rendersWillBeGenerated', { count: numRenders })}
              </p>
            )}
            {selectedModel === 'erayyavuz' && (
              <p className="text-amber-600 text-xs mt-1">
                Premium model will cost $0.25 per render.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings; 