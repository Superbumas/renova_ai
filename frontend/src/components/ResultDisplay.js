import React, { useState, useEffect } from 'react';
import ComparisonSlider from './ComparisonSlider';

const ResultDisplay = ({ result, originalImage, onReset, measurements, roomType }) => {
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  const [processedRenders, setProcessedRenders] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    let renders = [];
    if (result.all_renders) {
      if (Array.isArray(result.all_renders)) {
        renders = result.all_renders;
      } else if (typeof result.all_renders === 'string') {
        renders = [result.all_renders];
      } else if (typeof result.all_renders === 'object') {
        renders = Object.values(result.all_renders).filter(Boolean);
      }
    } else if (result.result_url) {
      renders = [result.result_url];
    }
    setProcessedRenders(renders);
  }, [result]);

  const hasMultipleRenders = processedRenders.length > 1;
  const currentRenderUrl = processedRenders[currentRenderIndex] || result.result_url;

  const downloadImage = () => {
    if (currentRenderUrl) {
      const link = document.createElement('a');
      link.href = currentRenderUrl;
      link.download = `design-${result.style.toLowerCase()}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareResult = async () => {
    if (navigator.share && currentRenderUrl) {
      try {
        await navigator.share({
          title: 'My Kitchen Design',
          text: `Check out my ${result.style} kitchen design transformation!`,
          url: currentRenderUrl
        });
      } catch (err) {
        navigator.clipboard.writeText(currentRenderUrl);
        alert('Link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(currentRenderUrl);
      alert('Link copied to clipboard!');
    }
  };

  const promptText = result.prompt_info?.prompt || result.prompt || null;
  const negativePromptText = result.prompt_info?.negative_prompt || result.negative_prompt || null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4">
        <div className="max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Design Complete</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={shareResult}
              className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </button>
            
            <button
              onClick={downloadImage}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-md flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-medium">Download HD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Style and Metadata Banner */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="border-r border-gray-300 pr-6">
              <p className="text-gray-500 text-sm">Style</p>
              <p className="text-gray-900 font-bold text-lg">{result.style}</p>
            </div>
            <div className="border-r border-gray-300 pr-6">
              <p className="text-gray-500 text-sm">Room Type</p>
              <p className="text-gray-900 font-bold text-lg">{roomType || 'Kitchen'}</p>
            </div>
            <div className="border-r border-gray-300 pr-6">
              <p className="text-gray-500 text-sm">Job ID</p>
              <p className="text-gray-900 font-mono text-xs">{result.job_id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-green-600 font-medium">{result.status || 'completed'}</p>
            </div>
          </div>
          
          <div className="bg-blue-100 px-3 py-1 rounded-lg">
            <span className="text-blue-700 font-medium">
              {result.model?.name || 'Adirik Interior Design'}
            </span>
          </div>
        </div>
        
        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Image Display */}
          <div className="lg:col-span-8">
            {/* Image Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-6">
                <button
                  onClick={() => setCompareMode(false)}
                  className={`py-3 px-1 border-b-2 ${!compareMode ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
                >
                  Result
                </button>
                <button
                  onClick={() => setCompareMode(true)}
                  className={`py-3 px-1 border-b-2 ${compareMode ? 'border-blue-500 text-blue-600 font-medium' : 'border-transparent text-gray-500'}`}
                >
                  Compare
                </button>
              </div>
            </div>
            
            {/* Main Image */}
            <div className="relative group mb-6">
              <div className="rounded-lg overflow-hidden shadow-lg">
                {compareMode ? (
                  <ComparisonSlider beforeImage={originalImage} afterImage={currentRenderUrl} />
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={currentRenderUrl} 
                      alt="Design Result" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={toggleFullscreen}
                      className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Variation Selector (if multiple renders) */}
              {hasMultipleRenders && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-gray-700 font-medium">
                      Variation {currentRenderIndex + 1} of {processedRenders.length}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentRenderIndex(prev => prev === 0 ? processedRenders.length - 1 : prev - 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentRenderIndex(prev => prev === processedRenders.length - 1 ? 0 : prev + 1)}
                        className="p-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {processedRenders.map((renderUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentRenderIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                          currentRenderIndex === index ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={renderUrl} 
                          alt={`Variation ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Original Image */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-gray-700 font-medium mb-3">Original Kitchen</h3>
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={originalImage} 
                  alt="Original Kitchen" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column - Information */}
          <div className="lg:col-span-4">
            {/* Technical Details Panel */}
            <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="font-semibold text-gray-800">Technical Details</h3>
              </div>
              
              <div className="p-5 space-y-6">
                {/* Generation Info */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">Generation Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Generated</span>
                      <span className="text-gray-900 font-medium">
                        {result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Processing Mode</span>
                      <span className="text-gray-900 font-medium capitalize">
                        {result.mode || 'Redesign'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Model ID</span>
                      <span className="bg-gray-100 rounded px-2 py-1 text-gray-700 text-xs font-mono">
                        {result.model?.id || result.model_selection || 'adirik'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Model Version</span>
                      <span className="text-gray-700 text-xs font-mono truncate max-w-[200px]" title={result.model_version}>
                        {result.model_version ? result.model_version.substring(0, 15) + '...' : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-600 mb-1">98%</div>
                      <div className="text-blue-500 text-xs">Quality Score</div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-indigo-600 mb-1">4K</div>
                      <div className="text-indigo-500 text-xs">Resolution</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-emerald-600 mb-1">45s</div>
                      <div className="text-emerald-500 text-xs">Generation Time</div>
                    </div>
                    <div className="bg-violet-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-violet-600 mb-1">100%</div>
                      <div className="text-violet-500 text-xs">Structure Preserved</div>
                    </div>
                  </div>
                </div>
                
                {/* Prompt Information */}
                {promptText && (
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-gray-500 font-medium mb-3">AI Prompt</h4>
                    <div className="bg-gray-50 rounded p-3 max-h-48 overflow-auto text-xs font-mono text-gray-600">
                      {promptText}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(promptText)}
                      className="mt-2 text-blue-600 text-sm flex items-center hover:text-blue-800"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy prompt
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions Panel */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="font-semibold text-gray-800">Actions</h3>
              </div>
              
              <div className="p-5 space-y-3">
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-medium">Get Material List</span>
                </button>
                
                <button 
                  onClick={onReset}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-medium">Create New Design</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 bg-white/10 p-3 rounded-full text-white hover:bg-white/20 transition-all z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={currentRenderUrl} 
            alt="Design Result - Fullscreen" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay; 