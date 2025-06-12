import React, { useState, useEffect } from 'react';
import ComparisonSlider from './ComparisonSlider';

const ResultDisplay = ({ result, originalImage, onReset, measurements, roomType }) => {
  const [currentRenderIndex, setCurrentRenderIndex] = useState(0);
  const [processedRenders, setProcessedRenders] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    // Debug: log the full result object to check structure
    console.log('Result data in ResultDisplay:', result);
    console.log('ID fields present:', {
      id: !!result.id,
      job_id: !!result.job_id
    });
    console.log('Model fields:', {
      model: result.model,
      model_selection: result.model_selection,
      model_version: result.model_version, 
      model_name: result.model_name
    });
    
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
    <div className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main Container - Full Width */}
      <div className="relative z-10 w-full mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="max-w-full mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Design Complete
                  </h1>
                  <div className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full">
                    <span className="text-white text-sm font-semibold">Premium</span>
                  </div>
                </div>
                <p className="text-slate-600 text-lg">
                  Your {result.style} kitchen transformation is ready • {processedRenders.length} variation{processedRenders.length > 1 ? 's' : ''} generated
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={shareResult}
                className="px-6 py-3 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-300 flex items-center space-x-2 group shadow-md"
              >
                <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="font-medium text-slate-700">Share</span>
              </button>
              
              <button
                onClick={downloadImage}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="font-semibold">Download HD</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Full Width Layout */}
        <div className="w-full mx-auto grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Panel - Image Display (Takes 3 columns) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Image Controls */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Your Transformation</h2>
                <div className="flex items-center bg-white/70 rounded-xl p-1 backdrop-blur-sm shadow-sm">
                  <button
                    onClick={() => setCompareMode(false)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                      !compareMode 
                        ? 'bg-white text-slate-800 shadow-md' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Result
                  </button>
                  <button
                    onClick={() => setCompareMode(true)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                      compareMode 
                        ? 'bg-white text-slate-800 shadow-md' 
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Compare
                  </button>
                </div>
              </div>

              {/* Main Image Display */}
              <div className="relative group">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl">
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
                        className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-white/50 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white shadow-md"
                      >
                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Variation Selector */}
                {hasMultipleRenders && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        Variation {currentRenderIndex + 1} of {processedRenders.length}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentRenderIndex(prev => prev === 0 ? processedRenders.length - 1 : prev - 1)}
                          className="glass-effect p-2 rounded-lg border border-white/20 hover:bg-white/30 transition-all"
                        >
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentRenderIndex(prev => prev === processedRenders.length - 1 ? 0 : prev + 1)}
                          className="glass-effect p-2 rounded-lg border border-white/20 hover:bg-white/30 transition-all"
                        >
                          <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {processedRenders.map((renderUrl, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentRenderIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                            currentRenderIndex === index 
                              ? 'ring-3 ring-blue-500 ring-offset-2 shadow-lg' 
                              : 'opacity-70 hover:opacity-100 hover:shadow-md'
                          }`}
                        >
                          <img 
                            src={renderUrl} 
                            alt={`Variation ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                          {currentRenderIndex === index && (
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Original Image Comparison */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Original Kitchen</h3>
              <div className="aspect-[16/10] rounded-xl overflow-hidden shadow-lg">
                <img 
                  src={originalImage} 
                  alt="Original Kitchen" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Information (Takes 2 columns) */}
          <div className="xl:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="flex border-b border-slate-200">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'prompt', label: 'AI Prompt', icon: '🤖' },
                  { id: 'technical', label: 'Technical', icon: '⚙️' },
                  { id: 'insights', label: 'Insights', icon: '💡' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-4 text-sm font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-white/80 text-slate-800 border-b-2 border-blue-500'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">Design Overview</h3>
                      
                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-blue-600 text-sm font-medium mb-1">Style Applied</p>
                          <p className="text-xl font-bold text-blue-900">{result.style}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                          <p className="text-emerald-600 text-sm font-medium mb-1">Variations</p>
                          <p className="text-xl font-bold text-emerald-900">{processedRenders.length}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                          <p className="text-purple-600 text-sm font-medium mb-1">Room Type</p>
                          <p className="text-xl font-bold text-purple-900 capitalize">{roomType || 'Kitchen'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                          <p className="text-amber-600 text-sm font-medium mb-1">Quality</p>
                          <p className="text-xl font-bold text-amber-900">Premium</p>
                        </div>
                      </div>

                      {/* Design Features */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-slate-800">Key Features</h4>
                        <div className="grid gap-3">
                          {[
                            { feature: 'Smart Layout Optimization', status: 'Applied' },
                            { feature: 'Color Harmony Analysis', status: 'Enhanced' },
                            { feature: 'Lighting Adjustment', status: 'Optimized' },
                            { feature: 'Material Consistency', status: 'Refined' },
                            { feature: 'Space Utilization', status: 'Maximized' }
                          ].map((item, index) => (
                                                         <div key={index} className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-white/30">
                               <span className="text-slate-700 font-medium">{item.feature}</span>
                               <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                 {item.status}
                               </span>
                             </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Prompt Tab */}
                {activeTab === 'prompt' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">AI Generation Details</h3>
                      
                      {promptText && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </span>
                              Primary Prompt
                            </h4>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
                              <p className="text-slate-700 leading-relaxed relative z-10 font-mono text-sm whitespace-pre-wrap">
                                {promptText}
                              </p>
                              <button
                                onClick={() => navigator.clipboard.writeText(promptText)}
                                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors z-10"
                                title="Copy prompt"
                              >
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {negativePromptText && (
                            <div>
                              <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                                <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                  </svg>
                                </span>
                                Negative Prompt
                              </h4>
                              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-100 to-transparent rounded-full -mr-16 -mt-16 opacity-50"></div>
                                <p className="text-red-700 leading-relaxed relative z-10 font-mono text-sm whitespace-pre-wrap">
                                  {negativePromptText}
                                </p>
                                <button
                                  onClick={() => navigator.clipboard.writeText(negativePromptText)}
                                  className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors z-10"
                                  title="Copy negative prompt"
                                >
                                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {!promptText && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-slate-500">No prompt information available for this design.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Technical Tab */}
                {activeTab === 'technical' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">Technical Details</h3>
                      
                      <div className="space-y-4">
                        {/* Generation Info */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">Generation Information</h4>
                          <div className="grid gap-3">
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                              <span className="text-slate-600 font-medium">Job ID</span>
                              <span className="font-mono text-slate-800 bg-slate-200 px-2 py-1 rounded text-sm overflow-auto max-w-[200px] truncate">
                                {result.id || result.job_id || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                              <span className="text-slate-600 font-medium">Status</span>
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                                {result.status || 'completed'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                              <span className="text-slate-600 font-medium">Generated</span>
                              <span className="text-slate-800 font-medium">
                                {result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                              <span className="text-slate-600 font-medium">Processing Mode</span>
                              <span className="text-slate-800 font-medium capitalize">
                                {result.mode || 'Redesign'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* AI Model Info */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4">AI Model Details</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                              <span className="text-blue-700 font-medium">Model ID</span>
                              <span className="text-blue-900 font-mono bg-blue-100 px-2 py-1 rounded text-sm">
                                {result.model?.id || result.model_selection || 'adirik'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                              <span className="text-blue-700 font-medium">Model Name</span>
                              <span className="text-blue-900 font-semibold">
                                {result.model?.name || result.model_name || 'Adirik Interior Design'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                              <span className="text-blue-700 font-medium">Version</span>
                              <span className="text-blue-900 font-mono text-sm truncate max-w-[200px]" title={result.model_version}>
                                {result.model_version || 'Standard'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                              <span className="text-blue-700 font-medium">Prediction ID</span>
                              <span className="text-blue-900 font-mono text-xs truncate max-w-[200px]" title={result.prediction_id}>
                                {result.prediction_id ? result.prediction_id.substring(0, 15) + '...' : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                              <span className="text-blue-700 font-medium">Cost per Generation</span>
                              <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-semibold">
                                {result.model?.cost_per_generation || result.model_cost || '$0.05'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                          <h4 className="text-lg font-semibold text-emerald-900 mb-4">Performance Metrics</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-700 mb-1">98%</div>
                              <div className="text-emerald-600 text-sm">Quality Score</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-700 mb-1">4K</div>
                              <div className="text-emerald-600 text-sm">Resolution</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-700 mb-1">45s</div>
                              <div className="text-emerald-600 text-sm">Generation Time</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-emerald-700 mb-1">100%</div>
                              <div className="text-emerald-600 text-sm">Structure Preserved</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">Design Insights</h3>
                      
                      <div className="space-y-6">
                        {/* Style Analysis */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                          <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4" />
                              </svg>
                            </span>
                            Style Analysis
                          </h4>
                          <div className="space-y-3">
                            <p className="text-purple-700 leading-relaxed">
                              Your {result.style.toLowerCase()} design emphasizes clean lines, sophisticated materials, and optimal space utilization. 
                              The transformation maintains the original layout while enhancing the visual appeal through strategic color choices and modern fixtures.
                            </p>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div className="bg-white/60 p-3 rounded-lg">
                                <div className="text-purple-600 text-sm font-medium">Color Harmony</div>
                                <div className="text-purple-900 font-bold">Excellent</div>
                              </div>
                              <div className="bg-white/60 p-3 rounded-lg">
                                <div className="text-purple-600 text-sm font-medium">Layout Flow</div>
                                <div className="text-purple-900 font-bold">Optimized</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Implementation Tips */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                          <h4 className="text-lg font-semibold text-amber-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </span>
                            Implementation Tips
                          </h4>
                          <div className="space-y-4">
                            {[
                              {
                                title: "Lighting Strategy",
                                tip: "Install under-cabinet LED strips and pendant lights to achieve the layered lighting shown in your design.",
                                priority: "High"
                              },
                              {
                                title: "Material Selection",
                                tip: "Use quartz countertops and matte finish cabinets for a modern, durable aesthetic.",
                                priority: "Medium"
                              },
                              {
                                title: "Color Implementation", 
                                tip: "Start with neutral base colors and add accent colors through accessories and backsplash.",
                                priority: "Medium"
                              }
                            ].map((tip, index) => (
                              <div key={index} className="bg-white/60 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-amber-900">{tip.title}</h5>
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    tip.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {tip.priority}
                                  </span>
                                </div>
                                <p className="text-amber-800 text-sm">{tip.tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4">Recommended Next Steps</h4>
                          <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">1</span>
                              </div>
                              <div>
                                <h5 className="font-semibold text-blue-900">Get Professional Quotes</h5>
                                <p className="text-blue-700 text-sm">Share this design with contractors for accurate implementation costs.</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">2</span>
                              </div>
                              <div>
                                <h5 className="font-semibold text-blue-900">Create Material List</h5>
                                <p className="text-blue-700 text-sm">Generate a detailed shopping list based on your design specifications.</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">3</span>
                              </div>
                              <div>
                                <h5 className="font-semibold text-blue-900">Schedule Consultation</h5>
                                <p className="text-blue-700 text-sm">Book a session with our design experts for implementation guidance.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid gap-3">
                <button className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Schedule Consultation</span>
                </button>
                
                <button className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-semibold">Get Material List</span>
                </button>
                
                <button 
                  onClick={onReset}
                  className="w-full p-4 bg-white/80 border border-slate-200 text-slate-700 rounded-xl hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="font-semibold">Create New Design</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={toggleFullscreen}
            className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-white hover:bg-white/30 transition-all z-10 shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={currentRenderUrl} 
            alt="Design Result - Fullscreen" 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay; 