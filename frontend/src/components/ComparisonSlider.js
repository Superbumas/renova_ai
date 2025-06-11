import React, { useState, useEffect } from 'react';
import './ComparisonSlider.css';

const ComparisonSlider = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showHint, setShowHint] = useState(true);
  
  // Hide the hint after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Simple range input handler
  const handleSliderChange = (e) => {
    setSliderPosition(parseInt(e.target.value, 10));
    setShowHint(false); // Hide hint when user interacts with slider
  };
  
  // Custom styles for the slider to ensure better touch support
  const sliderStyles = {
    WebkitAppearance: 'none',
    appearance: 'none',
    width: '100%',
    height: '24px',
    borderRadius: '12px',
    background: 'rgba(226, 232, 240, 0.6)',
    outline: 'none',
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* After image (background) */}
      <img 
        src={afterImage} 
        alt="After"
        className="absolute inset-0 w-full h-full object-cover"
        draggable="false"
      />
      
      {/* Before image (overlay) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img 
          src={beforeImage} 
          alt="Before"
          className="w-full h-full object-cover"
          draggable="false"
        />
      </div>
      
      {/* Slider line and handle */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 shadow-2xl pointer-events-none rounded-full"
          style={{ left: `${sliderPosition}%`, marginLeft: '-2px' }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 glass-effect rounded-full shadow-2xl flex items-center justify-center border-2 border-white/40">
            <div className="text-slate-700 text-xs font-bold select-none bg-white/80 px-2 py-1 rounded-full">
              {sliderPosition}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Usage hint message */}
      {showHint && (
        <div className="absolute top-1/3 left-0 right-0 flex justify-center">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm animate-fade-in-out max-w-xs text-center">
            Use the slider below to compare before and after images
          </div>
        </div>
      )}
      
      {/* Range slider for controlling the comparison - enhanced version */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center px-6 z-10">
        <div className="w-full max-w-md glass-effect rounded-2xl px-6 py-4 shadow-xl border border-white/30">
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={sliderPosition} 
            onChange={handleSliderChange}
            style={sliderStyles}
            aria-label="Comparison slider"
            className="slider-input"
          />
          
          {/* Slider position labels */}
          <div className="flex justify-between mt-2 text-xs text-slate-700 font-medium">
            <span>Before</span>
            <span>After</span>
          </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 glass-effect text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold border border-white/30 shadow-lg">
        Original
      </div>
      <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg">
        Redesigned
      </div>
    </div>
  );
};

export default ComparisonSlider; 