import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const MeasurementTool = ({ imageUrl, onMeasurementsChange }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [measurements, setMeasurements] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [showDimensionModal, setShowDimensionModal] = useState(false);
  const [tempDimension, setTempDimension] = useState({ value: '', unit: 'm', type: 'wall' });

  const drawMeasurements = useCallback((ctx) => {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';

    measurements.forEach((measurement, index) => {
      const { start, end, dimension, type } = measurement;
      
      // Draw line
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      // Draw endpoint circles
      ctx.beginPath();
      ctx.arc(start.x, start.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(end.x, end.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw dimension label
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const text = `${dimension.value}${dimension.unit}`;
      
      // Background for text
      const textMetrics = ctx.measureText(text);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(midX - textMetrics.width/2 - 4, midY - 10, textMetrics.width + 8, 20);
      
      // Text
      ctx.fillStyle = '#fff';
      ctx.fillText(text, midX - textMetrics.width/2, midY + 4);

      // Type indicator
      ctx.fillStyle = type === 'wall' ? '#10b981' : '#3b82f6';
      ctx.fillRect(midX - 15, midY - 25, 30, 12);
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.fillText(type.toUpperCase(), midX - 12, midY - 16);
      ctx.font = '14px Arial';
    });
  }, [measurements]);

  useEffect(() => {
    if (onMeasurementsChange) {
      onMeasurementsChange(measurements);
    }
  }, [measurements, onMeasurementsChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Draw existing measurements
      drawMeasurements(ctx);
    };
    img.src = imageUrl;
  }, [imageUrl, drawMeasurements]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    if (showDimensionModal) return;
    
    const pos = getMousePos(e);
    setIsDrawing(true);
    setCurrentLine({ start: pos, end: pos });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || showDimensionModal) return;
    
    const pos = getMousePos(e);
    setCurrentLine(prev => ({ ...prev, end: pos }));
    
    // Redraw canvas with current line
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (img) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawMeasurements(ctx);
      
      // Draw current line
      if (currentLine) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(currentLine.start.x, currentLine.start.y);
        ctx.lineTo(currentLine.end.x, currentLine.end.y);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing || showDimensionModal) return;
    
    setIsDrawing(false);
    
    // Calculate line length
    const length = Math.sqrt(
      Math.pow(currentLine.end.x - currentLine.start.x, 2) +
      Math.pow(currentLine.end.y - currentLine.start.y, 2)
    );
    
    // Only add measurement if line is long enough
    if (length > 20) {
      setSelectedMeasurement(currentLine);
      setShowDimensionModal(true);
    }
    
    setCurrentLine(null);
  };

  const saveMeasurement = () => {
    if (!selectedMeasurement || !tempDimension.value) return;
    
    const newMeasurement = {
      id: Date.now(),
      start: selectedMeasurement.start,
      end: selectedMeasurement.end,
      dimension: { ...tempDimension },
      type: tempDimension.type
    };
    
    setMeasurements(prev => [...prev, newMeasurement]);
    setShowDimensionModal(false);
    setSelectedMeasurement(null);
    setTempDimension({ value: '', unit: 'm', type: 'wall' });
  };

  const deleteMeasurement = (id) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  };

  const clearAllMeasurements = () => {
    setMeasurements([]);
  };

  if (!imageUrl) {
    return (
      <div className="bg-gray-100 rounded-xl p-8 border border-gray-200 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </div>
        <p className="text-gray-600 text-lg">{t('measurements.uploadFirst')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">{t('measurements.title')}</h3>
        <div className="flex space-x-2">
          <button
            onClick={clearAllMeasurements}
            className="bg-red-100 text-red-700 px-4 py-2 rounded-xl hover:bg-red-200 transition-colors hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={measurements.length === 0}
          >
            {t('measurements.clearAll')}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="mb-4">
          <p className="text-gray-700 text-sm mb-2">
            {t('measurements.instructions')}
          </p>
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-gray-600">{t('measurements.wallType')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">{t('measurements.furnitureType')}</span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-96 border-2 border-gray-300 rounded-xl cursor-crosshair bg-white shadow-sm"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          />
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Reference"
            className="hidden"
            onLoad={(e) => {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              canvas.width = e.target.width;
              canvas.height = e.target.height;
              ctx.drawImage(e.target, 0, 0);
            }}
          />
        </div>

        {measurements.length > 0 && (
          <div className="mt-4">
            <h4 className="text-gray-800 font-medium mb-2">{t('measurements.measurementCount')} ({measurements.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {measurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded ${
                      measurement.type === 'wall' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-gray-800 text-sm font-medium">
                      {measurement.dimension.value}{measurement.dimension.unit} ({measurement.type})
                    </span>
                  </div>
                  <button
                    onClick={() => deleteMeasurement(measurement.id)}
                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dimension Input Modal */}
      {showDimensionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t('measurements.addDimension')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">{t('measurements.measurementType')}</label>
                <select
                  value={tempDimension.type}
                  onChange={(e) => setTempDimension(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                >
                  <option value="wall">{t('measurements.measurementTypes.wall')}</option>
                  <option value="furniture">{t('measurements.measurementTypes.furniture')}</option>
                  <option value="ceiling">{t('measurements.measurementTypes.ceiling')}</option>
                  <option value="counter">{t('measurements.measurementTypes.counter')}</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-gray-700 text-sm font-medium mb-2">{t('measurements.dimension')}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempDimension.value}
                    onChange={(e) => setTempDimension(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    placeholder={t('measurements.enterSize')}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">{t('measurements.unit')}</label>
                  <select
                    value={tempDimension.unit}
                    onChange={(e) => setTempDimension(prev => ({ ...prev, unit: e.target.value }))}
                    className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="m">m</option>
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                    <option value="in">in</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDimensionModal(false);
                  setSelectedMeasurement(null);
                  setTempDimension({ value: '', unit: 'm', type: 'wall' });
                }}
                className="flex-1 btn-secondary py-2 rounded-xl hover-lift transition-colors"
              >
                {t('measurements.cancel')}
              </button>
              <button
                onClick={saveMeasurement}
                disabled={!tempDimension.value}
                className="flex-1 bg-purple-500 text-white py-2 rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover-lift"
              >
                {t('measurements.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementTool; 