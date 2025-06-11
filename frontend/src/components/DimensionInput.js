import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const DimensionInput = ({ onDimensionsChange, initialDimensions = null }) => {
  const { t } = useTranslation();
  
  const [dimensions, setDimensions] = useState({
    width: initialDimensions?.width || '',
    length: initialDimensions?.length || '',
    height: initialDimensions?.height || 2.7,
    unit: initialDimensions?.unit || 'm'
  });
  
  const [layoutPreview, setLayoutPreview] = useState('');
  const [spatialWarnings, setSpatialWarnings] = useState([]);
  const [layoutType, setLayoutType] = useState('');
  const [efficiency, setEfficiency] = useState(null);

  // Layout thresholds (in meters)
  const LAYOUT_THRESHOLDS = {
    galley_max_width: 3.0,
    island_min_width: 3.7,
    u_shape_min_width: 3.0,
    l_shape_min_width: 2.4
  };

  const convertToMeters = (value, unit) => {
    const conversions = {
      'm': 1,
      'cm': 0.01,
      'ft': 0.3048,
      'in': 0.0254
    };
    return parseFloat(value) * (conversions[unit] || 1);
  };

  const analyzeLayout = (width, length) => {
    const widthM = convertToMeters(width, dimensions.unit);
    const lengthM = convertToMeters(length, dimensions.unit);
    
    if (!widthM || !lengthM) return;

    let layout = '';
    let warnings = [];
    let efficiencyScore = 0;

    // Determine layout type
    if (widthM <= LAYOUT_THRESHOLDS.galley_max_width) {
      layout = 'Galley Kitchen';
      efficiencyScore = widthM <= 2.5 ? 0.9 : 0.8;
      if (widthM < 2.4) {
        warnings.push('Very narrow space - single wall layout recommended');
      }
    } else if (widthM < LAYOUT_THRESHOLDS.l_shape_min_width) {
      layout = 'Single Wall';
      efficiencyScore = 0.6;
    } else if (widthM < LAYOUT_THRESHOLDS.u_shape_min_width) {
      layout = 'L-Shaped';
      efficiencyScore = 0.75;
    } else if (widthM < LAYOUT_THRESHOLDS.island_min_width) {
      layout = 'U-Shaped';
      efficiencyScore = 0.85;
      warnings.push('Close to island threshold - consider U-shape or small peninsula');
    } else {
      layout = 'Island Kitchen';
      efficiencyScore = 0.95;
    }

    // Additional warnings
    const area = widthM * lengthM;
    if (area < 6) {
      warnings.push('Very compact kitchen - prioritize essential appliances');
    }
    if (widthM < 3.0) {
      warnings.push('❌ Kitchen island NOT possible - insufficient width');
    } else if (widthM >= 3.7) {
      warnings.push('✅ Kitchen island possible - adequate space');
    }

    setLayoutType(layout);
    setSpatialWarnings(warnings);
    setEfficiency(efficiencyScore);
    
    return {
      layout_type: layout.toLowerCase().replace(' ', '_'),
      width: widthM,
      length: lengthM,
      height: convertToMeters(dimensions.height, dimensions.unit),
      area: area,
      efficiency: efficiencyScore,
      warnings: warnings
    };
  };

  const generateLayoutPreview = (width, length) => {
    const widthM = convertToMeters(width, dimensions.unit);
    const lengthM = convertToMeters(length, dimensions.unit);
    
    if (!widthM || !lengthM) return '';

    // Simple ASCII layout preview
    let preview = '';
    
    if (widthM <= 3.0) {
      // Galley layout
      preview = `
┌─────────────────────┐ ${lengthM.toFixed(1)}m
│ ████████████████████ │
│ ░░░░░░░░░░░░░░░░░░░░ │ 
│ ████████████████████ │
└─────────────────────┘
     ${widthM.toFixed(1)}m
      
████ Counters/Cabinets
░░░░ Walkway Space`;
    } else if (widthM >= 3.7) {
      // Island layout
      preview = `
┌─────────────────────┐ ${lengthM.toFixed(1)}m
│ ████████████████████ │
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░ ██████ ░░░░░░░ │
│ ░░░░░ ██████ ░░░░░░░ │ 
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ████░░░░░░░░░░░░████ │
└─────────────────────┘
     ${widthM.toFixed(1)}m
      
████ Counters    ░░░░ Open Space
██████ Island`;
    } else {
      // L-shaped layout
      preview = `
┌─────────────────────┐ ${lengthM.toFixed(1)}m
│ ████████████████████ │
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░ │
│ ████░░░░░░░░░░░░░░░░ │
└─────────────────────┘
     ${widthM.toFixed(1)}m
      
████ Counters/Cabinets
░░░░ Open Space`;
    }
    
    return preview;
  };

  useEffect(() => {
    if (dimensions.width && dimensions.length) {
      const analysisResult = analyzeLayout(dimensions.width, dimensions.length);
      const preview = generateLayoutPreview(dimensions.width, dimensions.length);
      setLayoutPreview(preview);
      
      if (onDimensionsChange && analysisResult) {
        onDimensionsChange(analysisResult);
      }
    }
  }, [dimensions, onDimensionsChange]);

  const handleDimensionChange = (field, value) => {
    setDimensions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getEfficiencyColor = (score) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyLabel = (score) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Good';
    return 'Challenging';
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Room Dimensions</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width *
              </label>
              <input
                type="number"
                step="0.1"
                min="1.8"
                value={dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="3.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length *
              </label>
              <input
                type="number"
                step="0.1"
                min="2.0"
                value={dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="4.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (Optional)
              </label>
              <input
                type="number"
                step="0.1"
                min="2.0"
                max="4.0"
                value={dimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2.7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={dimensions.unit}
                onChange={(e) => handleDimensionChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="m">Meters (m)</option>
                <option value="ft">Feet (ft)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="in">Inches (in)</option>
              </select>
            </div>
          </div>

          {/* Layout Analysis */}
          {layoutType && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Layout Analysis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Recommended Layout:</span>
                  <span className="font-semibold text-blue-600">{layoutType}</span>
                </div>
                {efficiency !== null && (
                  <div className="flex justify-between">
                    <span>Efficiency Score:</span>
                    <span className={`font-semibold ${getEfficiencyColor(efficiency)}`}>
                      {(efficiency * 100).toFixed(0)}% ({getEfficiencyLabel(efficiency)})
                    </span>
                  </div>
                )}
                {dimensions.width && dimensions.length && (
                  <div className="flex justify-between">
                    <span>Total Area:</span>
                    <span className="font-semibold">
                      {(convertToMeters(dimensions.width, dimensions.unit) * 
                        convertToMeters(dimensions.length, dimensions.unit)).toFixed(1)} m²
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Warnings */}
          {spatialWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Space Considerations</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {spatialWarnings.map((warning, index) => (
                  <li key={index} className="flex items-start space-x-1">
                    <span>•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-800">Layout Preview</h4>
          
          {layoutPreview ? (
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto">
              <pre>{layoutPreview}</pre>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v10H7V7zm2 2v6h6V9H9z"/>
              </svg>
              <p className="text-gray-500">Enter dimensions to see layout preview</p>
            </div>
          )}

          {/* Quick Dimension Presets */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Quick Presets</h5>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                onClick={() => setDimensions({...dimensions, width: '2.5', length: '4.0'})}
                className="text-left p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Small Galley: 2.5m × 4.0m
              </button>
              <button
                onClick={() => setDimensions({...dimensions, width: '3.5', length: '4.5'})}
                className="text-left p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Medium L-Shape: 3.5m × 4.5m
              </button>
              <button
                onClick={() => setDimensions({...dimensions, width: '4.0', length: '5.0'})}
                className="text-left p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Large Island: 4.0m × 5.0m
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>💡 <strong>Tip:</strong> Provide accurate measurements for the best AI-generated results. 
        Kitchen islands require minimum 3.7m width for proper circulation.</p>
      </div>
    </div>
  );
};

export default DimensionInput; 