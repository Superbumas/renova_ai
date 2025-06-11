import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const BlueprintPlan = ({ imageUrl, roomType, measurements }) => {
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [architecturalData, setArchitecturalData] = useState(null);

  const generateBlueprint = async () => {
    if (!imageUrl) {
      setError('No image URL provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateBlueprint({
        image_url: imageUrl,
        room_type: roomType || 'kitchen',
        measurements: measurements || []
      });

      if (response.success) {
        setBlueprint(response.blueprint_svg);
        setArchitecturalData(response.architectural_data);
      } else {
        setError('Failed to generate blueprint');
      }
    } catch (err) {
      console.error('Blueprint generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate blueprint');
    } finally {
      setLoading(false);
    }
  };

  const downloadBlueprint = () => {
    if (!blueprint) return;

    const blob = new Blob([blueprint], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${roomType || 'kitchen'}-blueprint.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsPNG = () => {
    if (!blueprint) return;

    // Create a temporary canvas to convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([blueprint], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${roomType || 'kitchen'}-blueprint.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  useEffect(() => {
    if (imageUrl) {
      generateBlueprint();
    }
  }, [imageUrl, roomType, measurements]);

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <h4 className="text-gray-800 font-medium mb-3 flex items-center space-x-2">
        <span>📋</span>
        <span>Architectural Blueprint</span>
      </h4>
      
      {loading && (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            <span>Generating architectural blueprint...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={generateBlueprint}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors hover-lift"
          >
            Try Again
          </button>
        </div>
      )}

      {blueprint && (
        <div className="space-y-4">
          {/* Blueprint Display */}
          <div className="bg-white rounded-xl p-4 overflow-auto border border-gray-200 shadow-sm">
            <div 
              className="w-full max-w-none"
              dangerouslySetInnerHTML={{ __html: blueprint }}
            />
          </div>

          {/* Download Actions */}
          <div className="flex space-x-2">
            <button
              onClick={downloadBlueprint}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors flex items-center space-x-2 hover-lift shadow-soft"
            >
              <span>📥</span>
              <span>Download SVG</span>
            </button>
            <button
              onClick={downloadAsPNG}
              className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors flex items-center space-x-2 hover-lift shadow-soft"
            >
              <span>🖼️</span>
              <span>Download PNG</span>
            </button>
            <button
              onClick={generateBlueprint}
              className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 transition-colors flex items-center space-x-2 hover-lift shadow-soft"
            >
              <span>🔄</span>
              <span>Regenerate</span>
            </button>
          </div>

          {/* Architectural Data Summary */}
          {architecturalData && (
            <div className="grid md:grid-cols-3 gap-4">
              {/* Room Dimensions */}
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <h5 className="text-gray-800 font-medium mb-2 flex items-center space-x-1">
                  <span>📏</span>
                  <span>Room Dimensions</span>
                </h5>
                <div className="space-y-1 text-sm text-gray-600">
                  {architecturalData.room_dimensions && (
                    <>
                      <div className="flex justify-between">
                        <span>Length:</span>
                        <span className="font-mono text-gray-800">{architecturalData.room_dimensions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Width:</span>
                        <span className="font-mono text-gray-800">{architecturalData.room_dimensions.width}</span>
                      </div>
                      {architecturalData.room_dimensions.ceiling_height && (
                        <div className="flex justify-between">
                          <span>Ceiling Height:</span>
                          <span className="font-mono text-gray-800">{architecturalData.room_dimensions.ceiling_height}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Elevation Views */}
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <h5 className="text-gray-800 font-medium mb-2 flex items-center space-x-1">
                  <span>🏗️</span>
                  <span>Elevation Views</span>
                </h5>
                <div className="space-y-1 text-sm text-gray-600">
                  {architecturalData.elevation_views ? (
                    <>
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span className="font-mono text-gray-800">{architecturalData.elevation_views.length}</span>
                      </div>
                      {architecturalData.elevation_views.map((view, index) => (
                        <div key={index} className="text-xs">
                          <div className="text-gray-800 font-medium">{view.view_name}</div>
                          <div className="text-gray-500">
                            Elements: {view.elements ? view.elements.length : 0}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-gray-500">No elevation data</div>
                  )}
                </div>
              </div>

              {/* Plan View Items */}
              <div className="bg-white rounded-xl p-3 border border-gray-200">
                <h5 className="text-gray-800 font-medium mb-2 flex items-center space-x-1">
                  <span>🪑</span>
                  <span>Plan View Items</span>
                </h5>
                <div className="space-y-1 text-sm text-gray-600">
                  {architecturalData.plan_view_items ? (
                    <>
                      <div className="flex justify-between">
                        <span>Items:</span>
                        <span className="font-mono text-gray-800">{architecturalData.plan_view_items.length}</span>
                      </div>
                      <div className="max-h-20 overflow-y-auto space-y-1">
                        {architecturalData.plan_view_items.map((item, index) => (
                          <div key={index} className="text-xs">
                            <span className="text-gray-800 font-medium">{item.type}</span>
                            {item.dimensions && (
                              <span className="text-gray-500 ml-2">({item.dimensions})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500">No plan items</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Blueprint Features */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h5 className="text-blue-800 font-medium mb-2 flex items-center space-x-2">
              <span>📐</span>
              <span>Blueprint Features</span>
            </h5>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span className="text-blue-700">Accurate scale measurements</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span className="text-blue-700">Professional CAD-style layout</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span className="text-blue-700">Furniture placement guide</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span className="text-blue-700">Construction-ready details</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlueprintPlan; 