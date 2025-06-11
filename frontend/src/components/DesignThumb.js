import React from 'react';

const DesignThumb = ({ imageUrl, index, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 select-none
                ${isActive 
                  ? 'ring-2 ring-blue-500 shadow-lg transform scale-105' 
                  : 'opacity-70 hover:opacity-100 hover:shadow'
                }`}
    >
      <div className="w-24 h-24 md:w-28 md:h-28">
        <img 
          src={imageUrl} 
          alt={`Design ${index + 1}`} 
          className="w-full h-full object-cover"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      
      {isActive && (
        <div className="absolute bottom-1 right-1 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
          ✓
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
        <span className="text-white text-xs font-medium">
          #{index + 1}
        </span>
      </div>
    </div>
  );
};

export default DesignThumb; 