# Pinterest Inspiration Feature Guide

## Overview
The new inspiration feature allows users to paste Pinterest image URLs instead of selecting preset design styles. The AI will analyze the inspiration image to extract style elements, colors, materials, and design characteristics.

## Setup Requirements

### 1. Environment Configuration
Make sure your `.env` file includes:
```bash
OPENAI_API_KEY=your_actual_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here
```

### 2. Docker Setup
Your existing Docker configuration supports this feature. No changes needed to `docker-compose.yml`.

## How to Use

### 1. Start the Application
```bash
docker-compose up --build
```

### 2. Navigate to Style & Inspiration Section
1. Upload a kitchen image
2. Go to the "Style & Inspiration" section
3. You'll see two tabs:
   - **🎨 Style Presets** (original functionality)
   - **📌 Pinterest Inspiration** (new feature)

### 3. Using Pinterest Inspiration
1. Click the **📌 Pinterest Inspiration** tab
2. Right-click any Pinterest image and select "Copy image address"
3. Paste the URL into the input field
4. Click "✨ Use as Inspiration"
5. The AI will analyze the image and extract style characteristics

### 4. Supported Image Sources
- Pinterest.com (recommended)
- Instagram.com
- Houzz.com
- ArchDaily.com
- Any direct image URL (jpg, png, webp)

## How It Works

### Frontend Changes
- **New Component**: `InspirationSelector.js` with tabbed interface
- **Updated State**: Added `inspirationImage` state in `App.js`
- **Enhanced Preview**: Shows inspiration image thumbnail when active

### Backend Changes
- **New Function**: `analyze_inspiration_image()` using OpenAI Vision API
- **Enhanced Prompts**: Uses extracted style descriptions instead of preset styles
- **Updated API**: `/api/generate` now accepts `inspirationImage` parameter

### AI Analysis Process
1. **Image Analysis**: OpenAI Vision API analyzes the Pinterest image
2. **Style Extraction**: Identifies colors, materials, furniture styles, lighting
3. **Prompt Generation**: Creates detailed style descriptions for Stable Diffusion
4. **Design Generation**: Uses custom style description instead of preset styles

## Testing Examples

### Good Pinterest URLs to Test
```
# Modern Kitchen Examples
https://i.pinimg.com/564x/[pinterest-image-id].jpg

# How to get Pinterest image URLs:
1. Go to Pinterest.com
2. Find a kitchen design you like
3. Right-click the image
4. Select "Copy image address"
5. Paste into the inspiration field
```

### Expected Behavior
- ✅ **Success**: Image loads, shows green "✓ Inspiration Active" status
- ✅ **Analysis**: Console shows "Inspiration analysis: [detailed description]"
- ✅ **Generation**: Uses custom style description in prompts
- ❌ **Error**: Shows red error message for invalid URLs

## Troubleshooting

### Common Issues

1. **"OpenAI API not configured"**
   - Solution: Add valid `OPENAI_API_KEY` to `.env` file
   - Restart Docker containers: `docker-compose down && docker-compose up --build`

2. **"Invalid image URL"**
   - Solution: Ensure URL points directly to an image file
   - Try right-clicking and "Copy image address" instead of copying page URL

3. **"Failed to analyze inspiration image"**
   - Solution: Check OpenAI API quota and key validity
   - Try a different image URL

### Debug Mode
Check the backend logs for inspiration analysis:
```bash
docker-compose logs -f backend
```

Look for messages like:
```
Job [uuid]: Analyzing inspiration image from: [url]
Job [uuid]: Inspiration analysis: [extracted style description]
Job [uuid]: Using inspiration-based style: [description]
```

## Feature Benefits

### For Users
- **Unlimited Styles**: No longer limited to 8 preset styles
- **Precise Matching**: AI extracts exact style elements from inspiration
- **Visual Reference**: See exactly what style you're aiming for
- **Pinterest Integration**: Use the world's largest design inspiration platform

### For Developers
- **Extensible**: Easy to add more image sources
- **Scalable**: Uses OpenAI's robust Vision API
- **Maintainable**: Clean separation between preset and custom styles
- **Backwards Compatible**: All existing functionality preserved

## API Reference

### New Endpoint Parameters
```javascript
// POST /api/generate
{
  "image": "base64_image_data",
  "mode": "redesign|design", 
  "style": "Modern", // Fallback if inspiration fails
  "inspirationImage": "https://i.pinimg.com/564x/...", // New parameter
  "roomType": "kitchen",
  "measurements": []
}
```

### Response Changes
```javascript
{
  "job_id": "uuid",
  "status": "processing",
  // Job storage now includes:
  "inspiration_image": "url",
  "inspiration_style_description": "AI extracted description",
  "style": "custom inspiration" // When inspiration is used
}
```

## Next Steps

### Potential Enhancements
1. **Image Upload**: Allow direct image upload instead of just URLs
2. **Style Library**: Save analyzed styles for reuse
3. **Multi-Image**: Combine multiple inspiration images
4. **Style Mixing**: Blend preset styles with inspiration
5. **Advanced Filters**: Extract specific elements (colors only, furniture only, etc.)

This feature significantly expands the creative possibilities while maintaining the ease of use that makes RenovaAI special! 