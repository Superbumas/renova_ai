import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import ArchitecturalPlan from './ArchitecturalPlan';

const FurniturePlan = ({ 
  result, 
  measurements, 
  roomType,
  currentImageUrl 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPlan, setShowPlan] = useState(false);
  const [viewMode, setViewMode] = useState('architectural'); // 'architectural' or 'photo'

  // Use currentImageUrl if provided, otherwise fall back to result.result_url
  const imageToAnalyze = currentImageUrl || (result?.result_url);

  const analyzeFurniture = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.analyzeFurniture({
        image_url: imageToAnalyze,
        room_type: roomType || 'kitchen',
        measurements: measurements
      });
      
      setAnalysis(response.analysis);
      setShowPlan(true);
    } catch (err) {
      console.error('Error analyzing furniture:', err);
      setError('Failed to analyze furniture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'seating': '🪑',
      'storage': '🗄️',
      'lighting': '💡',
      'appliance': '🔌',
      'surface': '📋',
      'decor': '🎨',
      'cabinet': '🗃️',
      'countertop': '⬜',
      'island': '🏝️',
      'default': '📦'
    };
    return icons[category.toLowerCase()] || icons.default;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-700 bg-red-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-green-700 bg-green-100';
      default: return 'text-blue-700 bg-blue-100';
    }
  };

  if (!result?.result_url) {
    return null;
  }

  return (
    <div className="card-modern rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Furniture Plan</h3>
          <p className="text-gray-600 text-sm">Professional architectural layout and shopping guide</p>
        </div>
        
        {!showPlan && (
          <button
            onClick={analyzeFurniture}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center space-x-2 hover-lift shadow-soft"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🏗️</span>
                <span>Generate Plan</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {showPlan && analysis && (
        <div className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-gray-600 text-sm">View:</span>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('architectural')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  viewMode === 'architectural' 
                    ? 'bg-purple-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📐 Architectural Plan
              </button>
              <button
                onClick={() => setViewMode('photo')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  viewMode === 'photo' 
                    ? 'bg-purple-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📷 Photo Reference
              </button>
            </div>
          </div>

          {/* Architectural Floor Plan */}
          {viewMode === 'architectural' && (
            <ArchitecturalPlan 
              analysis={analysis}
              measurements={measurements}
              roomType={roomType}
            />
          )}

          {/* Photo Reference View */}
          {viewMode === 'photo' && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-gray-800 font-medium mb-3 flex items-center space-x-2">
                <span>📷</span>
                <span>Photo Reference</span>
                <span className="text-xs text-gray-500">(For visual reference only)</span>
              </h4>
              
              <div className="relative">
                <img 
                  src={imageToAnalyze} 
                  alt="Design Reference"
                  className="w-full h-64 object-cover rounded-xl shadow-sm"
                />
                
                {/* Note about accuracy */}
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 p-2 rounded-lg text-xs max-w-48 border border-yellow-200">
                  <strong>Note:</strong> Use architectural plan for accurate measurements and placement
                </div>
              </div>
            </div>
          )}

          {/* Furniture List */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Identified Furniture */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-gray-800 font-medium mb-3 flex items-center space-x-2">
                <span>📋</span>
                <span>Furniture Identified ({analysis.furniture_items?.length || 0})</span>
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysis.furniture_items?.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-2">
                      <span>{getCategoryIcon(item.category)}</span>
                      <span className="text-gray-800 text-sm">{item.name}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{item.estimated_size}</span>
                  </div>
                )) || <p className="text-gray-500 text-sm">No furniture identified</p>}
              </div>
            </div>

            {/* Shopping List */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-gray-800 font-medium mb-3 flex items-center space-x-2">
                <span>🛒</span>
                <span>Shopping List</span>
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysis.shopping_list?.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)}`}>
                        {item.priority || 'medium'}
                      </span>
                      <span className="text-gray-800 text-sm">{item.item}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{item.estimated_cost}</span>
                  </div>
                )) || <p className="text-gray-500 text-sm">No shopping items available</p>}
              </div>
            </div>
          </div>

          {/* Room Analysis Summary */}
          {analysis.room_analysis && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-blue-800 font-medium mb-3 flex items-center space-x-2">
                <span>🔍</span>
                <span>Room Analysis</span>
              </h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h5 className="text-blue-700 font-medium text-sm mb-2">Layout Style</h5>
                  <p className="text-blue-600 text-sm">{analysis.room_analysis.layout_style || 'Not specified'}</p>
                </div>
                <div>
                  <h5 className="text-blue-700 font-medium text-sm mb-2">Color Scheme</h5>
                  <p className="text-blue-600 text-sm">{analysis.room_analysis.color_scheme || 'Not specified'}</p>
                </div>
                <div>
                  <h5 className="text-blue-700 font-medium text-sm mb-2">Key Features</h5>
                  <p className="text-blue-600 text-sm">{analysis.room_analysis.key_features || 'Not specified'}</p>
                </div>
              </div>
              
              {analysis.room_analysis.recommendations && (
                <div className="mt-4">
                  <h5 className="text-blue-700 font-medium text-sm mb-2">Recommendations</h5>
                  <div className="space-y-1">
                    {analysis.room_analysis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 text-xs mt-1">•</span>
                        <span className="text-blue-600 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cost Estimation */}
          {analysis.cost_estimation && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="text-green-800 font-medium mb-3 flex items-center space-x-2">
                <span>💰</span>
                <span>Cost Estimation</span>
              </h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-green-700 font-bold text-lg">{analysis.cost_estimation.total_low || 'N/A'}</div>
                  <div className="text-green-600 text-sm">Budget Option</div>
                </div>
                <div className="text-center">
                  <div className="text-green-700 font-bold text-lg">{analysis.cost_estimation.total_mid || 'N/A'}</div>
                  <div className="text-green-600 text-sm">Mid-Range</div>
                </div>
                <div className="text-center">
                  <div className="text-green-700 font-bold text-lg">{analysis.cost_estimation.total_high || 'N/A'}</div>
                  <div className="text-green-600 text-sm">Premium</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FurniturePlan; 