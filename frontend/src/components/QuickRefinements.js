import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/apiService';

const QuickRefinements = ({ 
  currentResult, 
  originalSettings, 
  onRefinementCompleted,
  onError 
}) => {
  const { t } = useTranslation();
  const [activeRefinement, setActiveRefinement] = useState(null);

  const quickRefinements = [
    {
      id: 'warmer-colors',
      title: 'Warmer Colors',
      icon: '🌅',
      description: 'Make the color palette warmer',
      prompt: 'Gently adjust the color palette to slightly warmer tones, keeping the same layout and design'
    },
    {
      id: 'cooler-colors', 
      title: 'Cooler Colors',
      icon: '🧊',
      description: 'Make the color palette cooler',
      prompt: 'Subtly shift the color palette to cooler tones while maintaining the same design and layout'
    },
    {
      id: 'more-lighting',
      title: 'Brighter Space',
      icon: '💡',
      description: 'Add more lighting',
      prompt: 'Brighten the lighting slightly and add subtle illumination without changing the layout'
    },
    {
      id: 'darker-mood',
      title: 'Cozy & Dark',
      icon: '🌙',
      description: 'Create a cozy, darker mood',
      prompt: 'Create a slightly cozier atmosphere with warmer, more intimate lighting while keeping the same design'
    },
    {
      id: 'modern-update',
      title: 'More Modern',
      icon: '🔮',
      description: 'Make it more contemporary',
      prompt: 'Subtly modernize the finishes and materials while preserving the layout and overall design'
    },
    {
      id: 'traditional-style',
      title: 'More Traditional',
      icon: '🏛️',
      description: 'Add traditional elements',
      prompt: 'Add subtle traditional design touches and warmer materials while keeping the same layout'
    }
  ];

  const handleQuickRefinement = async (refinement) => {
    setActiveRefinement(refinement.id);
    
    try {
      const response = await apiService.refineDesign({
        base_image_url: currentResult.output_url || currentResult.result_url,
        refinement_request: refinement.prompt,
        original_style: originalSettings.style || 'Modern',
        room_type: originalSettings.roomType || 'kitchen',
        ai_intensity: Math.min(0.2, (originalSettings.aiIntensity || 0.5) * 0.4), // Much lower intensity
        measurements: originalSettings.measurements || [],
        high_quality: originalSettings.highQuality || false
      });

      const jobId = response.job_id;

      // Poll for results
      const pollResults = async () => {
        try {
          const resultResponse = await apiService.getResults(jobId);
          
          if (resultResponse.status === 'completed') {
            setActiveRefinement(null);
            if (onRefinementCompleted) {
              onRefinementCompleted(resultResponse);
            }
          } else if (resultResponse.status === 'failed') {
            setActiveRefinement(null);
            if (onError) {
              onError(resultResponse.error || 'Refinement failed');
            }
          } else {
            // Still processing, check again in 2 seconds
            setTimeout(pollResults, 2000);
          }
        } catch (err) {
          setActiveRefinement(null);
          if (onError) {
            onError('Error checking refinement results: ' + err.message);
          }
        }
      };

      setTimeout(pollResults, 2000);

    } catch (err) {
      setActiveRefinement(null);
      if (onError) {
        onError('Error starting quick refinement: ' + err.message);
      }
    }
  };

  return (
    <div className="card-modern rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-2xl">⚡</span>
        <h3 className="text-xl font-semibold text-gray-800">
          Quick Adjustments
        </h3>
      </div>
      
      <p className="text-gray-600 text-sm mb-6">
        Make instant style adjustments with one click
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickRefinements.map((refinement) => (
          <button
            key={refinement.id}
            onClick={() => handleQuickRefinement(refinement)}
            disabled={activeRefinement !== null}
            className={`
              relative group p-4 rounded-xl border transition-all duration-200 hover-lift
              ${activeRefinement === refinement.id 
                ? 'bg-purple-100 border-purple-300 text-purple-700' 
                : 'bg-gray-50 border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700 hover:text-purple-700'
              }
              ${activeRefinement && activeRefinement !== refinement.id 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <span className="text-2xl">{refinement.icon}</span>
              <span className="text-sm font-medium text-center">
                {refinement.title}
              </span>
              <span className="text-xs text-center opacity-80">
                {refinement.description}
              </span>
            </div>
            
            {activeRefinement === refinement.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-100 rounded-xl">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {activeRefinement && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-purple-700 text-sm text-center">
            ✨ Applying your refinement... This may take 30-60 seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickRefinements; 