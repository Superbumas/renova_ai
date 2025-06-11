import React from 'react';

const TransformationModeSelector = ({ selectedMode, onModeChange }) => {
  const modes = [
    {
      id: 'repair',
      name: 'Repair Mode',
      description: 'Preserve structure & layout. Only update colors, materials & finishes.',
      icon: '🔧',
      strength: '0.3',
      features: ['✓ Keeps original layout', '✓ Preserves walls & windows', '✓ Surface-level changes', '✓ Perfect for rentals']
    },
    {
      id: 'wild',
      name: 'Wild Mode', 
      description: 'Complete creative freedom. Dramatic transformations & layout changes allowed.',
      icon: '🎨',
      strength: '0.9',
      features: ['🚀 Layout changes allowed', '🚀 Dramatic transformations', '🚀 Creative freedom', '🚀 Magazine-worthy results']
    }
  ];

  return (
    <div className="space-y-3">
      {/* Mode Selection */}
      <div className="grid grid-cols-1 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-[1.02]
                       ${selectedMode === mode.id
                         ? mode.id === 'repair' 
                           ? 'border-green-400 bg-green-500/20 text-white shadow-lg'
                           : 'border-orange-400 bg-orange-500/20 text-white shadow-lg'
                         : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10'
                       }`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{mode.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold text-base">{mode.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold
                                  ${selectedMode === mode.id 
                                    ? mode.id === 'repair' 
                                      ? 'bg-green-400 text-white' 
                                      : 'bg-orange-400 text-white'
                                    : 'bg-white/20 text-white/70'
                                  }`}>
                    {mode.strength}
                  </span>
                </div>
                <p className="text-sm opacity-90 mb-2">{mode.description}</p>
                
                {/* Features List */}
                <div className="grid grid-cols-2 gap-1">
                  {mode.features.map((feature, index) => (
                    <div key={index} className="text-xs opacity-80">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Selected Indicator */}
            {selectedMode === mode.id && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className={`flex items-center space-x-2 ${mode.id === 'repair' ? 'text-green-300' : 'text-orange-300'}`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Selected</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Current Selection Summary */}
      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Current:</p>
            <p className="text-white/70 text-xs">
              {selectedMode === 'repair' 
                ? 'Structure preservation' 
                : 'Creative freedom'
              }
            </p>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg capitalize ${selectedMode === 'repair' ? 'text-green-400' : 'text-orange-400'}`}>
              {selectedMode}
            </p>
            <p className="text-white/60 text-xs">
              Strength: {selectedMode === 'repair' ? '0.3' : '0.9'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformationModeSelector; 