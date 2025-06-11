import React from 'react';
import { useTranslation } from 'react-i18next';

const ModelSelector = ({ selectedModel, onModelChange }) => {
  const { t } = useTranslation();

  const models = [
    {
      id: 'adirik',
      name: 'Adirik Interior Design',
      description: t('modelSelector.adirikDesc', 'Default model with good quality and affordable cost.'),
      cost: '$0.05 per generation',
      strengths: ['Balance of realism and style', 'Fast generation', 'Wide style range', 'Architectural accuracy', 'Cost-effective']
    },
    {
      id: 'erayyavuz',
      name: 'Erayyavuz Interior AI',
      description: t('modelSelector.erayyavuzDesc', 'Premium model with photorealistic quality.'),
      cost: '$0.25 per generation',
      strengths: ['Highly photorealistic', 'Better lighting', 'Superior material quality', 'Professional results', 'Luxury details']
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {models.map((model) => (
          <div
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 ${
              selectedModel === model.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md transform scale-[1.02]'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-4 h-4 rounded-full mr-2 ${
                    selectedModel === model.id ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}
                ></div>
                <h4 className="font-medium text-gray-900">{model.name}</h4>
              </div>
              <span className={`text-sm font-medium ${model.id === 'erayyavuz' ? 'text-amber-600' : 'text-emerald-600'}`}>
                {model.cost}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-2 mb-3">{model.description}</p>
            
            <div className="space-y-1.5">
              {model.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-center text-xs text-gray-700">
                  <span className="text-emerald-500 mr-1.5">✓</span>
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector; 