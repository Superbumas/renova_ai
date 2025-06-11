import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const EnhancedStyleSelector = ({ selectedStyle, onStyleChange, inspirationImage, onInspirationImageChange }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('styles');

  const predefinedStyles = [
    { id: 'modern', name: t('styles.modern.name'), description: t('styles.modern.description') },
    { id: 'traditional', name: t('styles.traditional.name'), description: t('styles.traditional.description') },
    { id: 'contemporary', name: t('styles.contemporary.name'), description: t('styles.contemporary.description') },
    { id: 'farmhouse', name: t('styles.farmhouse.name'), description: t('styles.farmhouse.description') },
    { id: 'industrial', name: t('styles.industrial.name'), description: t('styles.industrial.description') },
    { id: 'scandinavian', name: t('styles.scandinavian.name'), description: t('styles.scandinavian.description') },
    { id: 'mediterranean', name: t('styles.mediterranean.name'), description: t('styles.mediterranean.description') },
    { id: 'minimalist', name: t('styles.minimalist.name'), description: t('styles.minimalist.description') },
    { id: 'bohemian', name: t('styles.bohemian.name'), description: t('styles.bohemian.description') },
    { id: 'luxury', name: t('styles.luxury.name'), description: t('styles.luxury.description') }
  ];

  const colorPalettes = [
    { id: 'recommended', name: t('styles.colors.recommended'), colors: ['#f3f4f6', '#6b7280', '#374151'] },
    { id: 'natural-greens', name: t('styles.colors.naturalGreens'), colors: ['#065f46', '#10b981', '#6ee7b7'] },
    { id: 'deep-blues', name: t('styles.colors.deepBlues'), colors: ['#1e3a8a', '#3b82f6', '#93c5fd'] },
    { id: 'desert-tones', name: t('styles.colors.desertTones'), colors: ['#92400e', '#f59e0b', '#fbbf24'] },
    { id: 'minimalist-mono', name: t('styles.colors.minimalistMono'), colors: ['#000000', '#6b7280', '#ffffff'] },
    { id: 'earthy-neutrals', name: t('styles.colors.earthyNeutrals'), colors: ['#78716c', '#a8a29e', '#f5f5f4'] },
    { id: 'bold-accents', name: t('styles.colors.boldAccents'), colors: ['#dc2626', '#7c3aed', '#059669'] }
  ];

  const handlePinterestUrlChange = (e) => {
    const url = e.target.value;
    onInspirationImageChange(url);
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('styles')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all hover-lift
                     ${activeTab === 'styles' 
                       ? 'bg-white text-gray-900 shadow-soft' 
                       : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          {t('styles.tabs.styles')}
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all hover-lift
                     ${activeTab === 'colors' 
                       ? 'bg-white text-gray-900 shadow-soft' 
                       : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          {t('styles.tabs.colors')}
        </button>
        <button
          onClick={() => setActiveTab('inspiration')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all hover-lift
                     ${activeTab === 'inspiration' 
                       ? 'bg-white text-gray-900 shadow-soft' 
                       : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          {t('styles.tabs.inspiration')}
        </button>
      </div>

      {/* Styles Tab */}
      {activeTab === 'styles' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {predefinedStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => onStyleChange(style.name)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 hover-lift
                           ${selectedStyle === style.name
                             ? 'border-blue-500 bg-blue-50 text-gray-800 shadow-soft scale-[1.02]'
                             : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                           }`}
              >
                <h4 className="font-semibold text-sm">{style.name}</h4>
                <p className="text-xs opacity-80 mt-1">{style.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {colorPalettes.map((palette) => (
              <button
                key={palette.id}
                onClick={() => onStyleChange(`${selectedStyle} with ${palette.name} color palette`)}
                className="p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-left hover-lift"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    {palette.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-800">{palette.name}</h4>
                    {palette.id === 'recommended' && (
                      <span className="text-xs text-blue-600">✓ {t('styles.colors.recommendedLabel')}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inspiration Tab */}
      {activeTab === 'inspiration' && (
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              {t('styles.pinterestUrl')}
            </label>
            <input
              type="url"
              value={inspirationImage || ''}
              onChange={handlePinterestUrlChange}
              placeholder={t('styles.pinterestPlaceholder')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {inspirationImage && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="text-purple-800 text-sm font-medium mb-3 flex items-center space-x-2">
                <span>🎨</span>
                <span>{t('styles.inspirationTitle')}</span>
              </h4>
              <div className="flex items-center space-x-3">
                <img 
                  src={inspirationImage} 
                  alt="Inspiration" 
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0 shadow-soft"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-purple-600 text-xs">
                    {t('styles.inspirationDesc')}
                  </p>
                  <button
                    onClick={() => onInspirationImageChange(null)}
                    className="text-red-500 text-xs hover:text-red-600 mt-1 font-medium"
                  >
                    {t('styles.removeInspiration')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 mt-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-blue-800 text-xs font-medium">{t('styles.proTip')}</p>
                <p className="text-blue-600 text-xs mt-1">
                  {t('styles.proTipDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Selection Summary */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-800 font-medium text-sm">{t('styles.current')}:</p>
            <p className="text-gray-600 text-xs">
              {inspirationImage ? t('preview.customInspiration') : selectedStyle}
            </p>
          </div>
          <div className="text-right">
            {inspirationImage && (
              <span className="text-purple-600 text-xs font-medium">{t('styles.inspirationActive')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStyleSelector; 