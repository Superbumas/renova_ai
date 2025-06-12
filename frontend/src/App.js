import React, { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ModeSelector from './components/ModeSelector';
import AIIntensitySlider from './components/AIIntensitySlider';
import EnhancedStyleSelector from './components/EnhancedStyleSelector';
import AdvancedSettings from './components/AdvancedSettings';
import RoomTypeSelector from './components/RoomTypeSelector';
import ResultDisplay from './components/ResultDisplay';
import LandingPage from './components/LandingPage';
import UnifiedMeasurementTool from './components/UnifiedMeasurementTool';
import FurnitureBlueprintGenerator from './components/FurnitureBlueprintGenerator';
import LanguageSwitcher from './components/LanguageSwitcher';
import RefinementInterface from './components/RefinementInterface';
import QuickRefinements from './components/QuickRefinements';
import ModelSelector from './components/ModelSelector';
import apiService from './services/apiService';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'main', 'furniture-blueprint'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedMode, setSelectedMode] = useState('redesign');
  const [aiIntensity, setAiIntensity] = useState(0.5);
  const [selectedStyle, setSelectedStyle] = useState('Modern');
  const [inspirationImage, setInspirationImage] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState('kitchen');
  const [measurements, setMeasurements] = useState([]);
  const [roomDimensions, setRoomDimensions] = useState(null);
  
  const [numRenders, setNumRenders] = useState(1);
  const [highQuality, setHighQuality] = useState(false);
  const [privateRender, setPrivateRender] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState('adirik');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [refinementHistory, setRefinementHistory] = useState([]);

  const handleGetStarted = () => {
    setCurrentPage('main');
  };

  const handleGoToFurnitureBlueprint = () => {
    setCurrentPage('furniture-blueprint');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
    // Reset app state
    setUploadedImage(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setMeasurements([]);
    setRoomDimensions(null);
    setInspirationImage(null);
    setAiIntensity(0.5);
    setNumRenders(1);
    setHighQuality(false);
    setPrivateRender(false);
    setAdvancedMode(false);
    setRefinementHistory([]);
  };

  const handleImageUpload = (imageData) => {
    setUploadedImage(imageData);
    setResult(null);
    setError(null);
    setMeasurements([]); // Clear measurements when new image is uploaded
  };

  const handleMeasurementsChange = (newMeasurements) => {
    setMeasurements(newMeasurements);
  };

  const handleDimensionsChange = (dimensionData) => {
    setRoomDimensions(dimensionData);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Start generation with measurements, dimensions and inspiration
      const response = await apiService.generateDesign({
        image: uploadedImage,
        mode: selectedMode,
        aiIntensity: aiIntensity,
        style: selectedStyle,
        inspirationImage: inspirationImage,
        roomType: selectedMode === 'design' ? selectedRoomType : undefined,
        measurements: measurements,
        roomDimensions: roomDimensions,
        numRenders: numRenders,
        highQuality: highQuality,
        privateRender: privateRender,
        advancedMode: advancedMode,
        modelType: selectedModel
      });

      const jobId = response.job_id;

      // Poll for results
      const pollResults = async () => {
        try {
          const resultResponse = await apiService.getResults(jobId);
          
          // Enhanced debug logging
          console.log('Result response full object:', resultResponse);
          console.log('Job ID:', resultResponse.id || resultResponse.job_id);
          console.log('Model data:', resultResponse.model);
          console.log('Model version:', resultResponse.model_version);
          console.log('Prediction ID:', resultResponse.prediction_id);
          console.log('all_renders present:', !!resultResponse.all_renders);
          console.log('all_renders length:', resultResponse.all_renders ? resultResponse.all_renders.length : 0);
          
          if (resultResponse.status === 'completed') {
            setResult(resultResponse);
            setIsProcessing(false);
          } else if (resultResponse.status === 'failed') {
            setError(resultResponse.error || 'Generation failed');
            setIsProcessing(false);
          } else {
            // Still processing, check again in 2 seconds
            setTimeout(pollResults, 2000);
          }
        } catch (err) {
          setError('Error checking results: ' + err.message);
          setIsProcessing(false);
        }
      };

      // Start polling
      setTimeout(pollResults, 2000);

    } catch (err) {
      setError('Error starting generation: ' + err.message);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setMeasurements([]);
    setRoomDimensions(null);
    setInspirationImage(null);
    setAiIntensity(0.5);
    setNumRenders(1);
    setHighQuality(false);
    setPrivateRender(false);
    setAdvancedMode(false);
    setRefinementHistory([]);
  };

  const handleRefinementStarted = (request) => {
    console.log('Refinement started:', request);
  };

  const handleRefinementCompleted = (newResult) => {
    // Update the current result with the refined version
    setResult(newResult);
    
    // Add to refinement history
    setRefinementHistory(prev => [...prev, {
      timestamp: new Date(),
      result: newResult
    }]);
  };

  const handleRefinementError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <>
      <LanguageSwitcher />
      {currentPage === 'landing' ? (
        <LandingPage 
          onGetStarted={handleGetStarted} 
          onGoToFurnitureBlueprint={handleGoToFurnitureBlueprint}
        />
      ) : currentPage === 'main' ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4 py-6">
            {/* Modern Header */}
            <div className="flex justify-between items-center mb-8">
              <button 
                onClick={handleBackToLanding}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                  <span className="text-lg">←</span>
                </div>
                <span className="font-medium">{t('common.backToHome')}</span>
              </button>
              
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                  {t('app.studio')}
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">{t('app.professionalDesign')}</p>
                
                {/* Navigation Tabs */}
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <button
                    onClick={() => setCurrentPage('main')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover-lift ${
                      currentPage === 'main'
                        ? 'bg-blue-500 text-white shadow-soft'
                        : 'card-modern text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🏠 {t('common.kitchenDesign')}
                  </button>
                  <button
                    onClick={handleGoToFurnitureBlueprint}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover-lift ${
                      currentPage === 'furniture-blueprint'
                        ? 'bg-blue-500 text-white shadow-soft'
                        : 'card-modern text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🔧 {t('common.furnitureBlueprint')}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-soft">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
              {!result && !isProcessing && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left Column - Controls */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Upload Section */}
                    <div className="card-modern rounded-2xl p-6 fade-in-up">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-soft">
                          <span className="text-white text-sm font-bold">1</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {t('app.uploadSpace')}
                        </h2>
                      </div>
                      <ImageUpload onImageUpload={handleImageUpload} />
                    </div>

                    {/* Unified Measurement Tool */}
                    <div className="card-modern rounded-2xl p-6 fade-in-up">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-soft">
                          <span className="text-white text-sm font-bold">2</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">
                          {t('app.measurements', 'Room Measurements')}
                        </h2>
                      </div>
                      <UnifiedMeasurementTool 
                        imageUrl={uploadedImage}
                        onMeasurementsChange={handleMeasurementsChange}
                        onDimensionsChange={handleDimensionsChange}
                        roomDimensions={roomDimensions}
                        measurements={measurements}
                      />
                    </div>

                    {/* Mode & AI Intensity Selection */}
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="card-modern rounded-2xl p-5 fade-in-up">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-soft">
                            <span className="text-white text-sm font-bold">3</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {t('app.designMode')}
                          </h3>
                        </div>
                        <ModeSelector 
                          selectedMode={selectedMode}
                          onModeChange={setSelectedMode}
                        />
                      </div>

                      <div className="card-modern rounded-2xl p-5 fade-in-up">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-soft">
                            <span className="text-white text-sm font-bold">4</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {t('app.aiIntensity')}
                          </h3>
                        </div>
                        <AIIntensitySlider 
                          intensity={aiIntensity}
                          onIntensityChange={setAiIntensity}
                        />
                      </div>
                    </div>

                    {/* Style & Inspiration Selection */}
                    <div className="card-modern rounded-2xl p-6 fade-in-up">
                                              <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-soft">
                            <span className="text-white text-sm font-bold">5</span>
                          </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {t('app.styleInspiration')}
                        </h3>
                      </div>
                      <EnhancedStyleSelector 
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                        inspirationImage={inspirationImage}
                        onInspirationImageChange={setInspirationImage}
                      />
                    </div>

                    {/* Room Type Selector - Only show in design mode */}
                    {selectedMode === 'design' && (
                      <div className="card-modern rounded-2xl p-6 slide-in-right">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-soft">
                            <span className="text-white text-sm font-bold">6</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {t('app.roomType')}
                          </h3>
                        </div>
                        <RoomTypeSelector 
                          selectedRoomType={selectedRoomType}
                          onRoomTypeChange={setSelectedRoomType}
                        />
                      </div>
                    )}



                    {/* Advanced Settings */}
                    <div className="card-modern rounded-2xl p-6 fade-in-up">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-soft">
                          <span className="text-white text-sm font-bold">
                            8
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {t('app.advancedSettings')}
                        </h3>
                      </div>
                      <AdvancedSettings 
                        numRenders={numRenders}
                        onNumRendersChange={setNumRenders}
                        highQuality={highQuality}
                        onHighQualityChange={setHighQuality}
                        privateRender={privateRender}
                        onPrivateRenderChange={setPrivateRender}
                        advancedMode={advancedMode}
                        onAdvancedModeChange={setAdvancedMode}
                        selectedModel={selectedModel}
                        onModelChange={setSelectedModel}
                      />
                    </div>

                    {/* Generate Button */}
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleGenerate}
                        disabled={!uploadedImage || isProcessing}
                        className={`px-8 py-4 rounded-xl text-white font-bold text-lg transition-all duration-300 ${
                          !uploadedImage || isProcessing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 hover:shadow-xl shadow-soft hover-lift'
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('app.generatingText')}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                            {t('app.generateDesign')}
                          </span>
                        )}
                      </button>
                      {!uploadedImage && (
                        <p className="text-red-500 text-sm mt-2">{t('errors.uploadFirst')}</p>
                      )}
                      {uploadedImage && !isProcessing && (
                        <p className="text-emerald-600 text-sm mt-2">{t('app.readyTransform')}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div className="space-y-6">
                    <div className="card-modern rounded-2xl p-6 sticky top-8 fade-in-up">
                      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                        <span>👀</span>
                        <span>{t('preview.title')}</span>
                      </h3>
                      {uploadedImage ? (
                        <div className="space-y-4">
                          <div className="relative group">
                            <img 
                              src={uploadedImage} 
                              alt="Uploaded"
                              className="w-full h-64 object-cover rounded-xl shadow-soft"
                            />
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-soft">
                              {t('preview.ready')}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{t('preview.mode')}:</span>
                              <span className="text-gray-800 font-semibold capitalize">{selectedMode}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{t('preview.aiIntensity')}:</span>
                              <span className="text-gray-800 font-semibold">{aiIntensity.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{t('preview.style')}:</span>
                              <span className="text-gray-800 font-semibold">
                                {inspirationImage ? t('preview.customInspiration') : selectedStyle}
                              </span>
                            </div>
                            {inspirationImage && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">{t('preview.inspiration')}:</span>
                                <span className="text-purple-600 font-semibold">{t('preview.pinterestImage')}</span>
                              </div>
                            )}
                            {selectedMode === 'design' && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">{t('preview.room')}:</span>
                                <span className="text-gray-800 font-semibold capitalize">
                                  {selectedRoomType.replace('-', ' ')}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{t('preview.renders')}:</span>
                              <span className="text-gray-800 font-semibold">{numRenders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{t('preview.quality')}:</span>
                              <span className="text-gray-800 font-semibold">{highQuality ? t('preview.high') : t('preview.standard')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">{t('preview.model', 'Model')}:</span>
                              <span className="text-gray-800 font-semibold">
                                {selectedModel === 'erayyavuz' ? 'Erayyavuz Interior AI' : 'Adirik Interior Design'}
                              </span>
                            </div>
                            {measurements.length > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 text-sm">{t('preview.measurements')}:</span>
                                <span className="text-green-600 font-semibold">{measurements.length} {t('preview.added')}</span>
                              </div>
                            )}
                          </div>

                          {/* AI Intensity Info */}
                          <div className={`rounded-xl p-3 border ${
                            aiIntensity <= 0.35 ? 'bg-green-50 border-green-200' :
                            aiIntensity <= 0.65 ? 'bg-blue-50 border-blue-200' :
                            'bg-purple-50 border-purple-200'
                          }`}>
                            <h4 className={`text-sm font-medium mb-2 flex items-center space-x-2 ${
                              aiIntensity <= 0.35 ? 'text-green-700' :
                              aiIntensity <= 0.65 ? 'text-blue-700' :
                              'text-purple-700'
                            }`}>
                              <span>{aiIntensity <= 0.35 ? '🔧' : aiIntensity <= 0.65 ? '⚖️' : '🎨'}</span>
                              <span>
                                {aiIntensity <= 0.35 ? t('aiIntensity.lowIntensity') : 
                                 aiIntensity <= 0.65 ? t('aiIntensity.balancedIntensity') : 
                                 t('aiIntensity.highIntensity')}
                              </span>
                            </h4>
                            <p className={`text-xs ${
                              aiIntensity <= 0.35 ? 'text-green-600' :
                              aiIntensity <= 0.65 ? 'text-blue-600' :
                              'text-purple-600'
                            }`}>
                              {aiIntensity <= 0.35 ? t('aiIntensity.minimalChanges') :
                               aiIntensity <= 0.65 ? t('aiIntensity.balancedTransformation') :
                               t('aiIntensity.dramaticChanges')}
                            </p>
                          </div>

                          {/* Inspiration Image Preview */}
                          {inspirationImage && (
                            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                              <h4 className="text-purple-700 text-sm font-medium mb-2 flex items-center space-x-2">
                                <span>🎨</span>
                                <span>Inspiration Active</span>
                              </h4>
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={inspirationImage} 
                                  alt="Inspiration" 
                                  className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-purple-600 text-xs">
                                    AI will analyze this image for style, colors, and design elements
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Advanced Settings Summary */}
                          {(advancedMode || highQuality || privateRender || numRenders > 1) && (
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                              <h4 className="text-blue-700 text-sm font-medium mb-2 flex items-center space-x-2">
                                <span>⚙️</span>
                                <span>{t('advanced.advancedSettingsTitle')}</span>
                              </h4>
                              <div className="space-y-1 text-xs">
                                {advancedMode && (
                                  <p className="text-blue-600">🎯 {t('advanced.advancedProcessingMode')}</p>
                                )}
                                {highQuality && (
                                  <p className="text-blue-600">🎨 {t('advanced.highQualityRendering')}</p>
                                )}
                                {privateRender && (
                                  <p className="text-blue-600">🔒 {t('advanced.privateRenderActive')}</p>
                                )}
                                {numRenders > 1 && (
                                  <p className="text-blue-600">📊 {t('advanced.rendersWillBeGeneratedPreview', { count: numRenders })}</p>
                                )}
                                {selectedModel === 'erayyavuz' && (
                                  <p className="text-amber-600">⭐ Premium model selected ($0.25/render)</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Measurements Summary */}
                          {measurements.length > 0 && (
                            <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                              <h4 className="text-green-700 text-sm font-medium mb-2 flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                </svg>
                                <span>{t('advanced.measurementsActive')}</span>
                              </h4>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {measurements.map((measurement, index) => (
                                  <div key={measurement.id} className="text-xs text-green-600 flex justify-between">
                                    <span className="capitalize">{measurement.type}:</span>
                                    <span>{measurement.dimension.value}{measurement.dimension.unit}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-green-500 text-xs mt-2">
                                ✓ {t('advanced.realisticProportions')}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-4xl mb-4">📷</div>
                          <p className="text-gray-600 text-center">
                            {t('preview.uploadText')}
                          </p>
                          <p className="text-gray-500 text-sm text-center mt-2">
                            {t('preview.supportedText')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Processing State - UPDATED with modern light design */}
              {isProcessing && (
                <div className="max-w-2xl mx-auto">
                  <div className="card-modern rounded-3xl p-12 text-center shadow-2xl">
                    <div className="relative mb-8">
                      <div className="w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">🎨</span>
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      {t('app.crafting')}
                    </h3>
                    <p className="text-gray-600 text-lg mb-6">
                      {t('app.aiAnalyzing')}
                    </p>
                    
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span className="text-gray-700">{t('app.analyzing')}</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs">⚡</span>
                          </div>
                          <span className="text-gray-700">{t('app.generating')}</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">○</span>
                          </div>
                          <span className="text-gray-500">{t('app.finalizing')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-purple-600 text-sm">
                      {t('app.estimatedTime')}
                    </p>
                  </div>
                </div>
              )}

              {/* Results - UPDATED with modern light design */}
              {result && (
                <div className="max-w-6xl mx-auto">
                  <div className="card-modern rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        🎉 {t('app.designReady')}
                      </h2>
                      <p className="text-gray-600">
                        {t('app.transformedSpace')}
                      </p>
                    </div>
                    
                    <ResultDisplay 
                      result={result}
                      originalImage={uploadedImage}
                      onReset={handleReset}
                      measurements={measurements}
                      roomType={selectedRoomType}
                    />
                    
                    {/* Quick Refinements */}
                    <div className="mt-8">
                      <QuickRefinements
                        currentResult={result}
                        originalSettings={{
                          style: selectedStyle,
                          roomType: selectedRoomType,
                          aiIntensity: aiIntensity,
                          measurements: measurements,
                          highQuality: highQuality
                        }}
                        onRefinementCompleted={handleRefinementCompleted}
                        onError={handleRefinementError}
                      />
                    </div>
                    
                    {/* Refinement Interface */}
                    <div className="mt-6">
                      <RefinementInterface
                        currentResult={result}
                        originalSettings={{
                          style: selectedStyle,
                          roomType: selectedRoomType,
                          aiIntensity: aiIntensity,
                          measurements: measurements,
                          highQuality: highQuality
                        }}
                        onRefinementStarted={handleRefinementStarted}
                        onRefinementCompleted={handleRefinementCompleted}
                        onError={handleRefinementError}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error State - UPDATED with modern light design */}
              {error && (
                <div className="max-w-2xl mx-auto">
                  <div className="card-modern rounded-3xl p-8 border-l-4 border-red-500 shadow-2xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-red-500 text-2xl">⚠️</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {t('errors.oops')}
                      </h3>
                      <p className="text-red-600 mb-6 text-lg">
                        {error}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                          onClick={handleReset}
                          className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all font-semibold hover-lift"
                        >
                          {t('app.tryAgain')}
                        </button>
                        <button
                          onClick={handleBackToLanding}
                          className="btn-secondary px-6 py-3 rounded-xl font-semibold hover-lift"
                        >
                          {t('app.backToHome')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modern Footer */}
            <div className="text-center mt-16 pb-8">
              <div className="max-w-md mx-auto card-modern rounded-xl p-6">
                <p className="text-gray-500 text-sm mb-3">
                  {t('app.poweredBy')}
                </p>
                <div className="flex justify-center space-x-6 text-xs text-gray-400">
                  <span>• ControlNet</span>
                  <span>• Stable Diffusion</span>
                  <span>• GPT-4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentPage === 'furniture-blueprint' ? (
        <FurnitureBlueprintGenerator onBackToMain={() => setCurrentPage('main')} />
      ) : null}
    </>
  );
}

export default App; 