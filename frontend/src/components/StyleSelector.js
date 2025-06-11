import React from 'react';
import { useTranslation } from 'react-i18next';

const StyleSelector = ({ selectedStyle, onStyleChange }) => {
  const { t } = useTranslation();
  
  // Mapping for style IDs to their display names in English
  const styleMap = {
    'modern': 'Modern',
    'minimalist': 'Minimalist',
    'rustic': 'Rustic',
    'industrial': 'Industrial',
    'scandinavian': 'Scandinavian',
    'bohemian': 'Bohemian',
    'traditional': 'Traditional',
    'contemporary': 'Contemporary'
  };
  
  const styles = [
    { id: 'modern', emoji: '🔲' },
    { id: 'minimalist', emoji: '⚪' },
    { id: 'rustic', emoji: '🪵' },
    { id: 'industrial', emoji: '⚙️' },
    { id: 'scandinavian', emoji: '❄️' },
    { id: 'bohemian', emoji: '🌺' },
    { id: 'traditional', emoji: '🏛️' },
    { id: 'contemporary', emoji: '✨' }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {styles.map((style) => {
        // Get the display name from our mapping
        const displayName = styleMap[style.id];
        
        return (
          <button
            key={style.id}
            onClick={() => onStyleChange(displayName)}
            className={`p-3 rounded-lg border text-left transition-all duration-200
                     ${selectedStyle === displayName
                       ? 'border-blue-400 bg-blue-500/20 text-white'
                       : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10'
                     }`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{style.emoji}</span>
              <span className="font-medium text-sm">{t(`styles.${style.id}.name`)}</span>
            </div>
            <p className="text-xs opacity-70 leading-tight">{t(`styles.${style.id}.description`)}</p>
          </button>
        );
      })}
    </div>
  );
};

export default StyleSelector; 