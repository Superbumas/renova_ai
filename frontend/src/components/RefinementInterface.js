import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/apiService';

const RefinementInterface = ({ 
  currentResult, 
  originalSettings, 
  onRefinementStarted, 
  onRefinementCompleted,
  onError 
}) => {
  const { t } = useTranslation();
  const [refinementRequest, setRefinementRequest] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Predefined suggestion prompts
  const suggestions = [
    {
      text: "Make the walls a different color",
      icon: "🎨",
      prompt: "Change the wall color to a warmer, more inviting tone"
    },
    {
      text: "Add more lighting",
      icon: "💡",
      prompt: "Add more ambient lighting and pendant lights to brighten the space"
    },
    {
      text: "Change the countertops",
      icon: "🪨",
      prompt: "Replace the countertops with a different material and color"
    },
    {
      text: "Update the backsplash",
      icon: "🔳",
      prompt: "Change the backsplash to a more modern, eye-catching design"
    },
    {
      text: "Modify cabinet style",
      icon: "🪑",
      prompt: "Update the cabinet doors to a different style and finish"
    },
    {
      text: "Add plants/decor",
      icon: "🌿",
      prompt: "Add some plants and decorative elements to make the space more lively"
    }
  ];

  const handleRefinementSubmit = async () => {
    if (!refinementRequest.trim()) return;

    setIsRefining(true);
    setShowSuggestions(false);
    
    // Create history item with unique ID
    const historyItemId = Date.now();
    const newHistoryItem = {
      id: historyItemId,
      request: refinementRequest,
      timestamp: new Date(),
      status: 'processing'
    };
    
    setRefinementHistory(prev => [...prev, newHistoryItem]);
    
    if (onRefinementStarted) {
      onRefinementStarted(refinementRequest);
    }

    try {
      // Start refinement
      const response = await apiService.refineDesign({
        base_image_url: currentResult.output_url || currentResult.result_url,
        refinement_request: refinementRequest,
        original_style: originalSettings.style || 'Modern',
        room_type: originalSettings.roomType || 'kitchen',
        ai_intensity: Math.min(0.2, (originalSettings.aiIntensity || 0.5) * 0.4), // Much lower intensity for custom refinements
        measurements: originalSettings.measurements || [],
        high_quality: originalSettings.highQuality || false
      });

      const jobId = response.job_id;

      // Clear input
      setRefinementRequest('');

      // Poll for results
      const pollResults = async (pollCount = 0) => {
        try {
          // Add timeout after 3 minutes (90 polls)
          if (pollCount > 90) {
            setRefinementHistory(prev => 
              prev.map(item => 
                item.id === historyItemId 
                  ? { ...item, status: 'failed', error: 'Refinement timeout - please try again' }
                  : item
              )
            );
            
            setIsRefining(false);
            
            if (onError) {
              onError('Refinement timed out after 3 minutes. This may be due to high server load. Please try again.');
            }
            return;
          }
          
          const resultResponse = await apiService.getResults(jobId);
          
          if (resultResponse.status === 'completed') {
            // Update history
            setRefinementHistory(prev => 
              prev.map(item => 
                item.id === historyItemId 
                  ? { ...item, status: 'completed', result: resultResponse }
                  : item
              )
            );
            
            setIsRefining(false);
            
            if (onRefinementCompleted) {
              onRefinementCompleted(resultResponse);
            }
          } else if (resultResponse.status === 'failed') {
            setRefinementHistory(prev => 
              prev.map(item => 
                item.id === historyItemId 
                  ? { ...item, status: 'failed', error: resultResponse.error }
                  : item
              )
            );
            
            setIsRefining(false);
            
            if (onError) {
              onError(resultResponse.error || 'Refinement failed');
            }
          } else {
            // Still processing, check again in 2 seconds
            setTimeout(() => pollResults(pollCount + 1), 2000);
          }
        } catch (err) {
          setRefinementHistory(prev => 
            prev.map(item => 
              item.id === historyItemId 
                ? { ...item, status: 'failed', error: err.message }
                : item
            )
          );
          
          setIsRefining(false);
          
          if (onError) {
            onError('Error checking refinement results: ' + err.message);
          }
        }
      };

      setTimeout(pollResults, 2000);

    } catch (err) {
      setRefinementHistory(prev => 
        prev.map(item => 
          item.id === historyItemId 
            ? { ...item, status: 'failed', error: err.message }
            : item
        )
      );
      
      setIsRefining(false);
      
      if (onError) {
        onError('Error starting refinement: ' + err.message);
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setRefinementRequest(suggestion.prompt);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && refinementRequest.trim()) {
      e.preventDefault();
      handleRefinementSubmit();
    }
  };

  return (
    <div className="card-modern rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">💬</span>
        <h3 className="text-xl font-semibold text-gray-800">
          Request Changes
        </h3>
      </div>

      <p className="text-gray-600 text-sm mb-6">
        Describe specific changes you'd like to see. Be clear and detailed for best results.
      </p>

      {/* Quick Suggestions */}
      {showSuggestions && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Popular Suggestions:
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.text}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isRefining}
                className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all text-left text-sm hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-base">{suggestion.icon}</span>
                <span className="font-medium">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Refinement Input */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={refinementRequest}
            onChange={(e) => setRefinementRequest(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the changes you want to make... For example: 'Change the wall color to warm white' or 'Add pendant lights above the island'"
            disabled={isRefining}
            className="w-full p-4 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            rows={4}
          />
          
          {/* Character count */}
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {refinementRequest.length}/500
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              💡 Tip: Be specific for better results
            </span>
          </div>
          
          <button
            onClick={handleRefinementSubmit}
            disabled={!refinementRequest.trim() || isRefining}
            className={`px-6 py-3 rounded-xl font-medium transition-all hover-lift ${
              !refinementRequest.trim() || isRefining
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-soft'
            }`}
          >
            {isRefining ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </span>
            ) : (
              'Apply Changes'
            )}
          </button>
        </div>

        {/* Pro tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 text-lg">💡</span>
            <div>
              <h5 className="font-medium text-blue-800 mb-1">Pro Tips:</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Be specific: "Change cabinets to white shaker style" works better than "update cabinets"</li>
                <li>• Mention colors, materials, and styles you prefer</li>
                <li>• One change at a time produces better results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Refinement History */}
      {refinementHistory.length > 0 && (
        <div className="mt-8 space-y-4">
          <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
            Refinement History
          </h4>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {refinementHistory.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border ${
                  item.status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : item.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      "{item.request}"
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status === 'processing' && (
                      <span className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing</span>
                      </span>
                    )}
                    {item.status === 'completed' && '✓ Complete'}
                    {item.status === 'failed' && '✗ Failed'}
                  </div>
                </div>
                
                {item.status === 'failed' && item.error && (
                  <p className="text-xs text-red-600 mt-2">
                    Error: {item.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RefinementInterface; 