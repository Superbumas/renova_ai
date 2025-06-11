import React, { useState } from 'react';

const InspirationSelector = ({ selectedStyle, onStyleChange, inspirationImage, onInspirationImageChange }) => {
  const [activeTab, setActiveTab] = useState('presets');
  const [imageUrl, setImageUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const styles = [
    { name: 'Modern', emoji: '🔲', description: 'Clean lines, minimal clutter' },
    { name: 'Minimalist', emoji: '⚪', description: 'Less is more philosophy' },
    { name: 'Rustic', emoji: '🪵', description: 'Natural materials, cozy feel' },
    { name: 'Industrial', emoji: '⚙️', description: 'Raw materials, urban vibe' },
    { name: 'Scandinavian', emoji: '❄️', description: 'Light colors, hygge comfort' },
    { name: 'Bohemian', emoji: '🌺', description: 'Eclectic, artistic, colorful' },
    { name: 'Traditional', emoji: '🏛️', description: 'Classic, timeless elegance' },
    { name: 'Contemporary', emoji: '✨', description: 'Current trends, sophisticated' }
  ];

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setIsValidUrl(true);
  };

  const handleImageUrlSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setIsLoadingImage(true);
    setIsValidUrl(true);

    try {
      // Check if it's a valid URL format first
      const url = new URL(imageUrl);
      
      // Check if it's a known image domain or has image extension
      const isKnownImageDomain = [
        'i.pinimg.com',
        'pinterest.com', 
        'instagram.com',
        'houzz.com',
        'archdaily.com',
        'imgur.com',
        'unsplash.com'
      ].some(domain => url.hostname.includes(domain));
      
      const hasImageExtension = /\.(jpg|jpeg|png|webp|gif)$/i.test(url.pathname);
      
      if (isKnownImageDomain || hasImageExtension) {
        // For known domains or image extensions, proceed directly
        onInspirationImageChange(imageUrl);
        onStyleChange('custom-inspiration');
        setIsLoadingImage(false);
        return;
      }
      
      // For other URLs, try to validate with image loading (may fail due to CORS)
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      
      // Set a timeout to avoid hanging on CORS issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Image load timeout')), 5000);
      });
      
      await Promise.race([imageLoadPromise, timeoutPromise]);
      
      // If image loads successfully, set it as inspiration
      onInspirationImageChange(imageUrl);
      onStyleChange('custom-inspiration');
      
    } catch (error) {
      console.error('Image validation error:', error);
      
      // Check if the URL at least looks like an image URL
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i;
      const pinterestPattern = /^https?:\/\/(.*\.)?pinterest\.com/i;
      const pinimgPattern = /^https?:\/\/i\.pinimg\.com/i;
      
      if (urlPattern.test(imageUrl) || pinterestPattern.test(imageUrl) || pinimgPattern.test(imageUrl)) {
        // Likely a valid image URL but CORS blocked, proceed anyway
        console.log('CORS blocked but URL looks valid, proceeding...');
        onInspirationImageChange(imageUrl);
        onStyleChange('custom-inspiration');
      } else {
        setIsValidUrl(false);
      }
    } finally {
      setIsLoadingImage(false);
    }
  };

  const handlePresetSelect = (styleName) => {
    onStyleChange(styleName);
    onInspirationImageChange(null);
  };

  const handleRemoveInspiration = () => {
    onInspirationImageChange(null);
    setImageUrl('');
    setActiveTab('presets');
    onStyleChange('Modern'); // Default back to Modern
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex bg-white/10 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200
                     ${activeTab === 'presets'
                       ? 'bg-white text-gray-900'
                       : 'text-white/70 hover:text-white hover:bg-white/10'
                     }`}
        >
          🎨 Style Presets
        </button>
        <button
          onClick={() => setActiveTab('inspiration')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200
                     ${activeTab === 'inspiration'
                       ? 'bg-white text-gray-900'
                       : 'text-white/70 hover:text-white hover:bg-white/10'
                     }`}
        >
          📌 Pinterest Inspiration
        </button>
      </div>

      {/* Preset Styles Tab */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => (
            <button
              key={style.name}
              onClick={() => handlePresetSelect(style.name)}
              className={`p-3 rounded-lg border text-left transition-all duration-200
                         ${selectedStyle === style.name && !inspirationImage
                           ? 'border-blue-400 bg-blue-500/20 text-white'
                           : 'border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10'
                         }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{style.emoji}</span>
                <span className="font-medium text-sm">{style.name}</span>
              </div>
              <p className="text-xs opacity-70 leading-tight">{style.description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pinterest Inspiration Tab */}
      {activeTab === 'inspiration' && (
        <div className="space-y-4">
          {/* Current Inspiration Image */}
          {inspirationImage && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex flex-col items-center justify-center text-purple-300">
                  {inspirationImage.includes('pinterest.com') ? (
                    <>
                      <span className="text-2xl">📌</span>
                      <span className="text-xs">Pinterest</span>
                    </>
                  ) : inspirationImage.includes('i.pinimg.com') ? (
                    <img 
                      src={inspirationImage} 
                      alt="Inspiration" 
                      className="w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <>
                      <span className="text-2xl">🎨</span>
                      <span className="text-xs">Image</span>
                    </>
                  )}
                  {inspirationImage.includes('i.pinimg.com') && (
                    <div className="w-20 h-20 rounded-lg bg-purple-500/20 border border-purple-500/30 flex-col items-center justify-center text-purple-300 text-xs hidden">
                      <span className="text-lg">📌</span>
                      <span>Pinterest</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-green-400 text-sm font-medium">✓ Inspiration Active</span>
                    <button
                      onClick={handleRemoveInspiration}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed">
                    AI will analyze this image to understand your preferred style, colors, and design elements.
                  </p>
                  <div className="mt-2 text-white/50 text-xs">
                    <span className="font-medium">Source:</span> {
                      inspirationImage.includes('pinterest.com') ? 'Pinterest Page' :
                      inspirationImage.includes('i.pinimg.com') ? 'Pinterest Image' :
                      'Custom Image'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* URL Input Form */}
          <form onSubmit={handleImageUrlSubmit} className="space-y-3">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Paste Pinterest or design inspiration image URL:
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={handleImageUrlChange}
                placeholder="https://i.pinimg.com/564x/... or any image URL"
                className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-white placeholder-white/40
                           focus:outline-none focus:ring-2 transition-all duration-200
                           ${!isValidUrl 
                             ? 'border-red-400 focus:ring-red-400/50' 
                             : 'border-white/20 focus:border-white/40 focus:ring-blue-400/50'
                           }`}
                disabled={isLoadingImage}
              />
              {!isValidUrl && (
                <p className="text-red-400 text-xs mt-1">
                  Please enter a valid image URL. Make sure the link directly points to an image.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!imageUrl.trim() || isLoadingImage}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:cursor-not-allowed
                         text-white font-medium py-3 px-4 rounded-lg transition-all duration-200
                         flex items-center justify-center space-x-2"
            >
              {isLoadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading Image...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Use as Inspiration</span>
                </>
              )}
            </button>
          </form>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 text-sm font-medium mb-2 flex items-center space-x-2">
              <span>💡</span>
              <span>How to use Pinterest inspiration:</span>
            </h4>
            <ul className="text-white/70 text-xs space-y-1">
              <li>• Right-click any Pinterest image and select "Copy image address"</li>
              <li>• Paste the URL above to use it as your design inspiration</li>
              <li>• Works with any image URL from Pinterest, Instagram, or design websites</li>
              <li>• AI will analyze colors, textures, furniture styles, and layout preferences</li>
            </ul>
          </div>

          {/* Popular Sources */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-white/80 text-sm font-medium mb-3">Popular inspiration sources:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2 text-white/60">
                <span>📌</span>
                <span>Pinterest.com</span>
              </div>
              <div className="flex items-center space-x-2 text-white/60">
                <span>📷</span>
                <span>Instagram.com</span>
              </div>
              <div className="flex items-center space-x-2 text-white/60">
                <span>🏠</span>
                <span>Houzz.com</span>
              </div>
              <div className="flex items-center space-x-2 text-white/60">
                <span>✨</span>
                <span>ArchDaily.com</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspirationSelector; 