import React, { useState, useRef, useEffect } from 'react';

const ArchitecturalPlan = ({ analysis, measurements, roomType }) => {
  const canvasRef = useRef(null);
  const [planGenerated, setPlanGenerated] = useState(false);

  // Convert measurements to a standardized scale
  const getScaleFromMeasurements = () => {
    if (!measurements || measurements.length === 0) {
      return { width: 3.7, height: 3.0, unit: 'm' }; // Default kitchen size in metric
    }

    const wallMeasurements = measurements.filter(m => m.type === 'wall');
    if (wallMeasurements.length === 0) {
      return { width: 3.7, height: 3.0, unit: 'm' };
    }

    // Convert all to meters for consistency
    const convertToMeters = (value, unit) => {
      switch (unit) {
        case 'cm': return value / 100;
        case 'ft': return value * 0.3048;
        case 'in': return value * 0.0254;
        default: return value; // assume meters
      }
    };

    const dimensions = wallMeasurements.map(m => 
      convertToMeters(parseFloat(m.dimension.value), m.dimension.unit)
    );

    return {
      width: Math.max(...dimensions),
      height: dimensions.length > 1 ? Math.min(...dimensions) : Math.max(...dimensions) * 0.8,
      unit: 'm'
    };
  };

  const generateFloorPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width: roomWidth, height: roomHeight } = getScaleFromMeasurements();
    
    // Canvas dimensions
    const canvasWidth = 600;
    const canvasHeight = 400;
    const margin = 60;
    
    // Calculate scale to fit room in canvas
    const availableWidth = canvasWidth - (margin * 2);
    const availableHeight = canvasHeight - (margin * 2);
    const scale = Math.min(availableWidth / roomWidth, availableHeight / roomHeight);
    
    // Room dimensions on canvas
    const roomCanvasWidth = roomWidth * scale;
    const roomCanvasHeight = roomHeight * scale;
    
    // Center the room
    const startX = (canvasWidth - roomCanvasWidth) / 2;
    const startY = (canvasHeight - roomCanvasHeight) / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw room outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, roomCanvasWidth, roomCanvasHeight);

    // Draw dimension lines and labels
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000000';

    // Width dimension (bottom)
    const dimY = startY + roomCanvasHeight + 20;
    ctx.beginPath();
    ctx.moveTo(startX, dimY);
    ctx.lineTo(startX + roomCanvasWidth, dimY);
    ctx.stroke();
    
    // Width dimension arrows
    ctx.beginPath();
    ctx.moveTo(startX, dimY - 5);
    ctx.lineTo(startX, dimY + 5);
    ctx.moveTo(startX + roomCanvasWidth, dimY - 5);
    ctx.lineTo(startX + roomCanvasWidth, dimY + 5);
    ctx.stroke();
    
    // Width label
    const widthText = `${roomWidth.toFixed(1)}'`;
    const widthTextWidth = ctx.measureText(widthText).width;
    ctx.fillText(widthText, startX + (roomCanvasWidth - widthTextWidth) / 2, dimY + 15);

    // Height dimension (right)
    const dimX = startX + roomCanvasWidth + 20;
    ctx.beginPath();
    ctx.moveTo(dimX, startY);
    ctx.lineTo(dimX, startY + roomCanvasHeight);
    ctx.stroke();
    
    // Height dimension arrows
    ctx.beginPath();
    ctx.moveTo(dimX - 5, startY);
    ctx.lineTo(dimX + 5, startY);
    ctx.moveTo(dimX - 5, startY + roomCanvasHeight);
    ctx.lineTo(dimX + 5, startY + roomCanvasHeight);
    ctx.stroke();
    
    // Height label (rotated)
    ctx.save();
    ctx.translate(dimX + 15, startY + roomCanvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    const heightText = `${roomHeight.toFixed(1)}'`;
    const heightTextWidth = ctx.measureText(heightText).width;
    ctx.fillText(heightText, -heightTextWidth / 2, 0);
    ctx.restore();

    // Draw furniture based on analysis
    if (analysis && analysis.furniture_items) {
      drawFurniture(ctx, analysis.furniture_items, startX, startY, roomCanvasWidth, roomCanvasHeight, scale);
    }

    // Add title and scale
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('FLOOR PLAN', 20, 30);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Scale: 1" = ${(1/scale).toFixed(1)}'`, 20, 50);
    
    // Add room type
    ctx.fillText(`Room Type: ${roomType.replace('-', ' ').toUpperCase()}`, 20, canvasHeight - 20);

    setPlanGenerated(true);
  };

  const drawFurniture = (ctx, furnitureItems, roomX, roomY, roomWidth, roomHeight, scale) => {
    ctx.strokeStyle = '#8B5CF6';
    ctx.fillStyle = '#8B5CF6';
    ctx.lineWidth = 2;
    ctx.font = '10px Arial';

    furnitureItems.forEach((item, index) => {
      // Calculate furniture position and size based on category
      const furniture = getFurnitureLayout(item, roomWidth, roomHeight, scale);
      
      if (furniture) {
        const x = roomX + furniture.x;
        const y = roomY + furniture.y;
        
        // Draw furniture shape
        if (furniture.shape === 'rectangle') {
          ctx.strokeRect(x, y, furniture.width, furniture.height);
          ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
          ctx.fillRect(x, y, furniture.width, furniture.height);
        } else if (furniture.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(x + furniture.width/2, y + furniture.height/2, furniture.width/2, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
          ctx.fill();
        }
        
        // Add furniture label
        ctx.fillStyle = '#000000';
        const labelX = x + furniture.width/2;
        const labelY = y + furniture.height/2;
        const textWidth = ctx.measureText(item.name).width;
        ctx.fillText(item.name, labelX - textWidth/2, labelY);
        
        // Add number marker
        ctx.fillStyle = '#8B5CF6';
        ctx.beginPath();
        ctx.arc(x + furniture.width - 8, y + 8, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText((index + 1).toString(), x + furniture.width - 11, y + 12);
        ctx.font = '10px Arial';
      }
    });
  };

  const getFurnitureLayout = (item, roomWidth, roomHeight, scale) => {
    const category = item.category.toLowerCase();
    const size = item.estimated_size;
    
    // Standard furniture dimensions in feet, scaled to canvas
    const dimensions = {
      'island': { width: 4 * scale, height: 2 * scale, shape: 'rectangle', x: roomWidth * 0.4, y: roomHeight * 0.4 },
      'cabinet': { width: 2 * scale, height: 0.5 * scale, shape: 'rectangle', x: 10, y: 10 },
      'countertop': { width: roomWidth * 0.8, height: 0.5 * scale, shape: 'rectangle', x: roomWidth * 0.1, y: 10 },
      'refrigerator': { width: 2.5 * scale, height: 2 * scale, shape: 'rectangle', x: roomWidth - 2.5 * scale - 10, y: 10 },
      'stove': { width: 2.5 * scale, height: 2 * scale, shape: 'rectangle', x: roomWidth * 0.3, y: 10 },
      'sink': { width: 2 * scale, height: 1.5 * scale, shape: 'rectangle', x: roomWidth * 0.6, y: 10 },
      'dishwasher': { width: 2 * scale, height: 2 * scale, shape: 'rectangle', x: roomWidth * 0.7, y: 10 },
      'dining table': { width: 3 * scale, height: 5 * scale, shape: 'rectangle', x: roomWidth * 0.1, y: roomHeight * 0.6 },
      'seating': { width: 1.5 * scale, height: 1.5 * scale, shape: 'rectangle', x: roomWidth * 0.2, y: roomHeight * 0.7 },
      'lighting': { width: 0.5 * scale, height: 0.5 * scale, shape: 'circle', x: roomWidth * 0.5, y: roomHeight * 0.3 }
    };

    // Find matching furniture type
    for (const [key, layout] of Object.entries(dimensions)) {
      if (category.includes(key) || item.name.toLowerCase().includes(key)) {
        return layout;
      }
    }

    // Default furniture
    return { width: 2 * scale, height: 2 * scale, shape: 'rectangle', x: roomWidth * 0.5, y: roomHeight * 0.5 };
  };

  const downloadPlan = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `floor-plan-${roomType}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    if (analysis && analysis.furniture_items) {
      generateFloorPlan();
    }
  }, [analysis, measurements]);

  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-white/10 rounded-lg p-4">
      <h4 className="text-white font-medium mb-3 flex items-center space-x-2">
        <span>📐</span>
        <span>Architectural Floor Plan</span>
      </h4>
      
      <div className="bg-white rounded-lg p-4 mb-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full border border-gray-300"
        />
      </div>

      {/* Furniture Legend */}
      {planGenerated && analysis.furniture_items && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded p-3">
            <h5 className="text-white font-medium mb-2">Furniture Legend</h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {analysis.furniture_items.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-white">{item.name}</span>
                  <span className="text-white/60">({item.estimated_size})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded p-3">
            <h5 className="text-white font-medium mb-2">Dimensions</h5>
            <div className="space-y-1 text-sm text-white/80">
              {measurements && measurements.length > 0 ? (
                measurements.map((m, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="capitalize">{m.type}:</span>
                    <span>{m.dimension.value}{m.dimension.unit}</span>
                  </div>
                ))
              ) : (
                <div className="text-white/60">No measurements provided</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={downloadPlan}
          disabled={!planGenerated}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center space-x-2"
        >
          <span>📥</span>
          <span>Download Plan</span>
        </button>
        
        <button
          onClick={generateFloorPlan}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  );
};

export default ArchitecturalPlan; 