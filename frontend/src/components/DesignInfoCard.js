import React from 'react';

const DesignInfoCard = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  );
};

// Sub-component for info item pairs (label/value)
export const InfoItem = ({ label, value, valueColor = 'text-gray-900' }) => {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
};

// Sub-component for grid of details
export const DetailGrid = ({ details }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {details.map((detail, index) => (
        <div key={index} className="space-y-1">
          <p className="text-sm text-gray-500">{detail.label}</p>
          <p className={`font-medium ${detail.color || 'text-blue-700'}`}>
            {detail.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DesignInfoCard; 