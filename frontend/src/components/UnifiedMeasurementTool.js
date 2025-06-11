import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DimensionInput from './DimensionInput';
import MeasurementTool from './MeasurementTool';

const UnifiedMeasurementTool = ({ 
  imageUrl, 
  onMeasurementsChange, 
  onDimensionsChange,
  roomDimensions,
  measurements 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dimensions'); // 'dimensions' or 'detailed'
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Create a summary message of current measurements
  const getSummary = () => {
    const parts = [];
    
    if (roomDimensions && roomDimensions.width && roomDimensions.length) {
      parts.push(`${roomDimensions.width} × ${roomDimensions.length} ${roomDimensions.unit}`);
    }
    
    if (measurements && measurements.length > 0) {
      parts.push(`${measurements.length} ${t('measurements.detailedMeasurements', 'detailed measurements')}`);
    }
    
    return parts.join(' · ') || t('measurements.noMeasurementsYet', 'No measurements set');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header with collapse/expand button */}
      <div className="p-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="font-semibold text-gray-800">
            {t('measurements.title', 'Room Measurements')}
          </h3>
        </div>
        
        {/* Collapse/Expand Button */}
        <div className="flex items-center">
          {isCollapsed && (
            <span className="text-sm text-gray-500 mr-3">{getSummary()}</span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Content (only shown when not collapsed) */}
      {!isCollapsed && (
        <div className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveTab('dimensions')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dimensions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4m-4 0l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span>{t('measurements.quickDimensions', 'Quick Dimensions')}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'detailed'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21l3-3 9-9a2.83 2.83 0 00-4-4L6 14l-3 3v4h4z" />
                </svg>
                <span>{t('measurements.detailedMeasurements', 'Detailed Measurements')}</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'dimensions' && (
              <div>
                {/* Quick Dimensions Tab */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {t('measurements.roomDimensions', 'Room Dimensions')}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('measurements.quickDimensionsDesc', 'Enter your room dimensions for instant layout analysis and space-aware design generation.')}
                  </p>
                </div>
                <DimensionInput
                  onDimensionsChange={onDimensionsChange}
                  roomDimensions={roomDimensions}
                />
                
                {/* Benefits of Quick Dimensions */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {t('measurements.quickBenefits', 'Why Use Quick Dimensions?')}
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t('measurements.benefit1', 'Instant layout analysis (galley, L-shape, island)')}</li>
                    <li>• {t('measurements.benefit2', 'Prevents impossible designs (islands in narrow kitchens)')}</li>
                    <li>• {t('measurements.benefit3', 'Real-time space efficiency scoring')}</li>
                    <li>• {t('measurements.benefit4', 'Professional layout recommendations')}</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'detailed' && (
              <div>
                {/* Detailed Measurements Tab */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {t('measurements.detailedTitle', 'Detailed Measurements')}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('measurements.detailedDesc', 'Click and drag on your image to measure specific walls, furniture, and features for precise design control.')}
                  </p>
                </div>
                <MeasurementTool
                  imageUrl={imageUrl}
                  onMeasurementsChange={onMeasurementsChange}
                />
                
                {/* When to Use Detailed Measurements */}
                <div className="mt-6 bg-amber-50 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">
                    {t('measurements.detailedBenefits', 'When to Use Detailed Measurements?')}
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• {t('measurements.detailedBenefit1', 'Precise measurements of existing features')}</li>
                    <li>• {t('measurements.detailedBenefit2', 'Custom furniture sizing and placement')}</li>
                    <li>• {t('measurements.detailedBenefit3', 'Complex room shapes and angles')}</li>
                    <li>• {t('measurements.detailedBenefit4', 'Professional architectural accuracy')}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Summary Information */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>
                {roomDimensions && roomDimensions.width && roomDimensions.length && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    Room: {roomDimensions.width} × {roomDimensions.length} {roomDimensions.unit}
                  </span>
                )}
              </div>
              <div>
                {measurements && measurements.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {measurements.length} {t('measurements.detailedMeasurements', 'detailed measurements')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedMeasurementTool; 