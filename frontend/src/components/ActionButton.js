import React from 'react';

const ActionButton = ({ 
  onClick, 
  children, 
  icon, 
  variant = 'primary', 
  disabled = false,
  className = ''
}) => {
  // Define styles based on variant
  const getVariantStyles = () => {
    switch(variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'secondary':
        return 'bg-indigo-600 hover:bg-indigo-700 text-white';
      case 'neutral':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center px-4 py-3 rounded-lg shadow-sm transition-all
        ${getVariantStyles()}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default ActionButton; 