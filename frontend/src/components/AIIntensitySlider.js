import React from 'react';
import { useTranslation } from 'react-i18next';

const AIIntensitySlider = ({ intensity, onIntensityChange }) => {
  const { t } = useTranslation();

  const getIntensityLabel = (value) => {
    if (value <= 0.35) return t('aiIntensity.low');
    if (value <= 0.65) return t('aiIntensity.recommended');
    return t('aiIntensity.high');
  };

  const getIntensityColor = (value) => {
    if (value <= 0.35) return 'text-emerald-600';
    if (value <= 0.65) return 'text-blue-600';
    return 'text-purple-600';
  };

  const getIntensityBg = (value) => {
    if (value <= 0.35) return 'bg-emerald-50 border-emerald-200';
    if (value <= 0.65) return 'bg-blue-50 border-blue-200';
    return 'bg-purple-50 border-purple-200';
  };

  const getSliderColor = (value) => {
    if (value <= 0.35) return 'emerald';
    if (value <= 0.65) return 'blue';
    return 'purple';
  };

  const getDescription = (value) => {
    if (value <= 0.35) return t('aiIntensity.lowDesc');
    if (value <= 0.65) return t('aiIntensity.recommendedDesc');
    return t('aiIntensity.highDesc');
  };

  return (
    <div className="space-y-4">
      {/* Intensity Display */}
      <div className={`p-4 rounded-xl border ${getIntensityBg(intensity)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-medium">{t('aiIntensity.title')}</span>
          <span className={`font-bold text-lg ${getIntensityColor(intensity)}`}>
            {getIntensityLabel(intensity)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{intensity.toFixed(1)}</span>
          <span className={`${getIntensityColor(intensity)} font-medium`}>
            {Math.round(intensity * 100)}%
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={intensity}
            onChange={(e) => onIntensityChange(parseFloat(e.target.value))}
            className={`w-full h-3 rounded-lg cursor-pointer slider-${getSliderColor(intensity)}`}
            style={{
              background: `linear-gradient(to right, 
                ${intensity <= 0.35 ? '#10b981' : intensity <= 0.65 ? '#3b82f6' : '#8b5cf6'} 0%, 
                ${intensity <= 0.35 ? '#10b981' : intensity <= 0.65 ? '#3b82f6' : '#8b5cf6'} ${intensity * 100}%, 
                #e5e7eb ${intensity * 100}%, 
                #e5e7eb 100%)`
            }}
          />
          
          {/* Slider track markers */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0.1</span>
            <span>0.3</span>
            <span>0.5</span>
            <span>0.7</span>
            <span>0.9</span>
          </div>
        </div>

        {/* Quick selection buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onIntensityChange(0.25)}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all hover-lift text-center min-h-[2.5rem] flex items-center justify-center
                       ${intensity <= 0.35 
                         ? 'bg-emerald-500 text-white shadow-soft' 
                         : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            <span className="leading-tight">{t('aiIntensity.low')}</span>
          </button>
          <button
            onClick={() => onIntensityChange(0.5)}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all hover-lift text-center min-h-[2.5rem] flex items-center justify-center
                       ${intensity > 0.35 && intensity <= 0.65 
                         ? 'bg-blue-500 text-white shadow-soft' 
                         : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
          >
            <span className="leading-tight">{t('aiIntensity.recommended')}</span>
          </button>
          <button
            onClick={() => onIntensityChange(0.8)}
            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all hover-lift text-center min-h-[2.5rem] flex items-center justify-center
                       ${intensity > 0.65 
                         ? 'bg-purple-500 text-white shadow-soft' 
                         : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
          >
            <span className="leading-tight">{t('aiIntensity.high')}</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
        <p className="text-gray-600 text-sm">
          {getDescription(intensity)}
        </p>
      </div>
    </div>
  );
};

export default AIIntensitySlider; 