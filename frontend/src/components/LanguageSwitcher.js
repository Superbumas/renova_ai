import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex space-x-2">
      <button 
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 rounded text-xs ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('lt')}
        className={`px-2 py-1 rounded text-xs ${i18n.language === 'lt' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
      >
        LT
      </button>
    </div>
  );
};

export default LanguageSwitcher; 