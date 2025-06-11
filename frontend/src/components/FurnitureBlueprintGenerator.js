import React, { useState } from 'react';
import apiService from '../services/apiService';

const FurnitureBlueprintGenerator = ({ onBackToMain }) => {
  const [formData, setFormData] = useState({
    description: '',
    furniture_type: 'cabinet',
    dimensions: {
      width: '',
      depth: '',
      height: ''
    },
    material: 'oak',
    style: 'modern',
    compliance_requirements: []
  });

  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('plan_view');

  const furnitureTypes = [
    { value: 'cabinet', label: '🗄️ Cabinet' },
    { value: 'bookshelf', label: '📚 Bookshelf' },
    { value: 'desk', label: '🖥️ Desk' },
    { value: 'dining_table', label: '🪑 Dining Table' },
    { value: 'coffee_table', label: '☕ Coffee Table' },
    { value: 'nightstand', label: '🛏️ Nightstand' },
    { value: 'dresser', label: '👔 Dresser' },
    { value: 'entertainment_center', label: '📺 Entertainment Center' },
    { value: 'kitchen_island', label: '🏝️ Kitchen Island' },
    { value: 'wardrobe', label: '👗 Wardrobe' }
  ];

  const materials = [
    { value: 'oak', label: 'Oak' },
    { value: 'maple', label: 'Maple' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'walnut', label: 'Walnut' },
    { value: 'pine', label: 'Pine' },
    { value: 'plywood', label: 'Plywood' },
    { value: 'mdf', label: 'MDF' },
    { value: 'melamine', label: 'Melamine' }
  ];

  const styles = [
    { value: 'modern', label: 'Modern' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'rustic', label: 'Rustic' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'scandinavian', label: 'Scandinavian' },
    { value: 'farmhouse', label: 'Farmhouse' },
    { value: 'mid-century', label: 'Mid-Century' },
    { value: 'minimalist', label: 'Minimalist' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const generateBlueprint = async () => {
    if (!formData.description && (!formData.dimensions.width || !formData.dimensions.depth || !formData.dimensions.height)) {
      setError('Please provide either a description or complete dimensions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        ...formData,
        dimensions: {
          width: formData.dimensions.width ? `${formData.dimensions.width}cm` : '',
          depth: formData.dimensions.depth ? `${formData.dimensions.depth}cm` : '',
          height: formData.dimensions.height ? `${formData.dimensions.height}cm` : ''
        }
      };

      const response = await apiService.generateFurnitureBlueprint(requestData);

      if (response.success) {
        setBlueprint(response);
      } else {
        setError('Failed to generate furniture blueprint');
      }
    } catch (err) {
      console.error('Furniture blueprint error:', err);
      setError(err.response?.data?.error || 'Failed to generate furniture blueprint');
    } finally {
      setLoading(false);
    }
  };

  const downloadSVG = (viewType) => {
    if (!blueprint?.technical_drawings?.[viewType]) return;

    const svgContent = blueprint.technical_drawings[viewType];
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${blueprint.furniture_specification?.project_info?.name || 'furniture'}-${viewType}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          {onBackToMain && (
            <button 
              onClick={onBackToMain}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-all">
                <span className="text-lg">←</span>
              </div>
              <span className="font-medium">Back to Kitchen Design</span>
            </button>
          )}
          
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gradient mb-4">
              🔧 AI Furniture Blueprint Generator
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Create professional furniture blueprints with CAD precision. Generate technical drawings, 
              assembly instructions, and cut lists powered by AI.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              Inspired by <a href="https://www.blueprints-ai.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Blueprints AI</a>
            </div>
          </div>
          
          <div className="w-20"></div> {/* Spacer for balance */}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="card-modern rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Design Specifications</h2>
            
            {/* Description */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Furniture Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Modern oak bookshelf, 180cm tall, 5 adjustable shelves, with backing"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                rows={3}
              />
            </div>

            {/* Furniture Type */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Furniture Type
              </label>
              <select
                name="furniture_type"
                value={formData.furniture_type}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              >
                {furnitureTypes.map(type => (
                  <option key={type.value} value={type.value} className="bg-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimensions */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Dimensions (cm)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleInputChange}
                    placeholder="Width"
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  />
                  <div className="text-xs text-white/60 mt-1">Width</div>
                </div>
                <div>
                  <input
                    type="number"
                    name="dimensions.depth"
                    value={formData.dimensions.depth}
                    onChange={handleInputChange}
                    placeholder="Depth"
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  />
                  <div className="text-xs text-white/60 mt-1">Depth</div>
                </div>
                <div>
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleInputChange}
                    placeholder="Height"
                    className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
                  />
                  <div className="text-xs text-white/60 mt-1">Height</div>
                </div>
              </div>
            </div>

            {/* Material */}
            <div className="mb-6">
              <label className="block text-white/90 font-medium mb-2">
                Material
              </label>
              <select
                name="material"
                value={formData.material}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
              >
                {materials.map(material => (
                  <option key={material.value} value={material.value} className="bg-slate-800">
                    {material.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Style */}
            <div className="mb-6">
              <label className="block text-white/90 font-medium mb-2">
                Style
              </label>
              <select
                name="style"
                value={formData.style}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50"
              >
                {styles.map(style => (
                  <option key={style.value} value={style.value} className="bg-slate-800">
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateBlueprint}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Blueprint...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>Generate Professional Blueprint</span>
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Blueprint Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Technical Drawings</h2>
              {blueprint && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadSVG(activeView)}
                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                  >
                    📥 Download SVG
                  </button>
                </div>
              )}
            </div>

            {blueprint ? (
              <div>
                {/* View Tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { key: 'plan_view_svg', label: '📐 Plan View' },
                    { key: 'elevation_svg', label: '📏 Elevation' },
                    { key: 'section_svg', label: '🔍 Section' },
                    { key: 'detail_svg', label: '🔧 Details' }
                  ].map(view => (
                    <button
                      key={view.key}
                      onClick={() => setActiveView(view.key)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        activeView === view.key
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>

                {/* Drawing Display */}
                <div className="bg-white rounded-lg p-4 min-h-[400px] overflow-auto">
                  {blueprint.technical_drawings?.[activeView] ? (
                    <div dangerouslySetInnerHTML={{ __html: blueprint.technical_drawings[activeView] }} />
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📐</div>
                        <div>Technical drawing not available</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Info */}
                {blueprint.furniture_specification?.project_info && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-white/70">Project</div>
                      <div className="text-white font-medium">
                        {blueprint.furniture_specification.project_info.name}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-white/70">Difficulty</div>
                      <div className="text-white font-medium">
                        {blueprint.furniture_specification.project_info.difficulty_level}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-white/70">Build Time</div>
                      <div className="text-white font-medium">
                        {blueprint.furniture_specification.project_info.estimated_build_time}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-white/70">Estimated Cost</div>
                      <div className="text-white font-medium">
                        {blueprint.furniture_specification.project_info.cost_estimate}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-white/50">
                <div className="text-center">
                  <div className="text-6xl mb-4">🔧</div>
                  <div className="text-xl mb-2">Professional Blueprint Generator</div>
                  <div>Enter your furniture specifications to generate detailed technical drawings</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Specifications */}
        {blueprint && (
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            {/* Materials & Hardware */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>🛠️</span>
                <span>Materials & Hardware</span>
              </h3>
              
              {blueprint.furniture_specification?.materials_list && (
                <div className="space-y-3">
                  <h4 className="text-white/90 font-medium">Materials:</h4>
                  {blueprint.furniture_specification.materials_list.map((material, index) => (
                    <div key={index} className="bg-white/5 rounded p-3 text-sm">
                      <div className="text-white font-medium">{material.component}</div>
                      <div className="text-white/70">{material.material} - {material.dimensions}</div>
                      <div className="text-white/60">Qty: {material.quantity} | {material.cost_estimate}</div>
                    </div>
                  ))}
                </div>
              )}

              {blueprint.furniture_specification?.hardware_list && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-white/90 font-medium">Hardware:</h4>
                  {blueprint.furniture_specification.hardware_list.map((hardware, index) => (
                    <div key={index} className="bg-white/5 rounded p-3 text-sm">
                      <div className="text-white font-medium">{hardware.item}</div>
                      <div className="text-white/70">{hardware.specification}</div>
                      <div className="text-white/60">Qty: {hardware.quantity} | {hardware.cost_estimate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assembly Instructions */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>📋</span>
                <span>Assembly Steps</span>
              </h3>
              
              {blueprint.furniture_specification?.assembly_steps && (
                <div className="space-y-3">
                  {blueprint.furniture_specification.assembly_steps.map((step, index) => (
                    <div key={index} className="bg-white/5 rounded p-3 text-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {step.step}
                        </div>
                        <div className="text-white font-medium">{step.title}</div>
                      </div>
                      <div className="text-white/70 mb-1">{step.description}</div>
                      <div className="text-white/60 text-xs">Time: {step.time_estimate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation & Cost */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>✅</span>
                <span>Validation & Cost</span>
              </h3>
              
              {blueprint.validation_results && (
                <div className="space-y-3 mb-6">
                  <div className={`p-3 rounded ${blueprint.validation_results.compliant ? 'bg-green-500/20 border border-green-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'}`}>
                    <div className="text-white font-medium">
                      {blueprint.validation_results.compliant ? '✅ Design Compliant' : '⚠️ Needs Review'}
                    </div>
                  </div>
                  
                  {blueprint.validation_results.warnings?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-white/90 font-medium">Warnings:</div>
                      {blueprint.validation_results.warnings.map((warning, index) => (
                        <div key={index} className="text-yellow-300 text-xs">• {warning}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {blueprint.estimated_cost && (
                <div className="space-y-2">
                  <div className="text-white/90 font-medium">Cost Breakdown:</div>
                  <div className="bg-white/5 rounded p-3 text-sm space-y-1">
                    <div className="flex justify-between text-white/70">
                      <span>Materials:</span>
                      <span>${blueprint.estimated_cost.materials}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Hardware:</span>
                      <span>${blueprint.estimated_cost.hardware}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Labor Est.:</span>
                      <span>${blueprint.estimated_cost.labor_estimate}</span>
                    </div>
                    <div className="border-t border-white/20 pt-1 mt-2">
                      <div className="flex justify-between text-white font-bold">
                        <span>Total:</span>
                        <span>${blueprint.estimated_cost.grand_total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FurnitureBlueprintGenerator; 