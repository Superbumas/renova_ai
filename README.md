# RenovaAI - Kitchen Interior Design with Realistic Measurements & Furniture Planning

A professional kitchen interior redesign app that uses AI to generate realistic furniture with proper proportions based on actual room measurements, plus interactive furniture plans for implementation.

## 🎯 **Features**

### **AI-Powered Interior Design**
- **Redesign Mode**: Transform existing kitchens with new styles while preserving layout
- **Design Mode**: Fully furnish empty rooms with complete furniture layouts
- **Style Variety**: Modern, Traditional, Scandinavian, Industrial, and more
- **Professional Quality**: High-resolution, photorealistic results

### **Smart Measurement System**
- **Interactive Measurement Tool**: Draw directly on uploaded images
- **Multiple Unit Support**: Meters, centimeters, feet, inches (metric preferred)
- **Measurement Types**: Wall dimensions, furniture spaces, ceiling heights, counter depths
- **Real-Scale Furniture**: AI generates furniture that matches your actual room dimensions
- **Smart Furniture Sizing**: AI generates furniture that matches your room's actual dimensions
- **Spatial Intelligence**: Prevents unrealistic layouts (e.g., islands in narrow spaces < 3m)

### **Advanced AI Integration**
- **OpenAI GPT-4**: Chat assistance and prompt enhancement
- **Stable Diffusion XL**: High-quality image generation with ControlNet
- **Replicate API**: Reliable cloud-based AI processing
- **Measurement-Aware Generation**: AI considers real room dimensions

### **Professional Blueprints**
- **Architectural Plans**: Generate professional floor plans from your designs
- **Precise Measurements**: All furniture dimensioned in metric system
- **Multiple Views**: Elevation and plan views for complete understanding
- **Download Options**: SVG (editable) and PNG (shareable) formats
- **Shopping Lists**: Itemized furniture with specifications and priorities

### **🆕 Furniture Planning & Implementation Guide**
- **Interactive Furniture Map**: Click hotspots on your generated design to see furniture details
- **Smart Shopping Lists**: Automatically generated with priorities and price estimates
- **Implementation Guide**: Layout analysis with traffic flow and zoning recommendations
- **Measurement Integration**: Plans consider your actual room dimensions for realistic recommendations

## 🤖 **AI Models Used**

1. **Primary**: `adirik/interior-design` - Specialized model for layout-preserving interior design
2. **Fallback**: `stability-ai/sdxl` - High-quality image-to-image generation
3. **Integration**: OpenAI GPT-4 for prompt enhancement and chat assistance
4. **🆕 Analysis**: OpenAI GPT-4 Vision for furniture identification and planning

## 🎨 **Available Styles**

- Modern
- Traditional  
- Rustic
- Industrial
- Scandinavian
- Mediterranean
- Minimalist
- Farmhouse

## 🚀 **Quick Start**

### Prerequisites
- Node.js 16+ and npm
- Python 3.11+
- API Keys:
  - Replicate API token
  - OpenAI API key (required for furniture planning)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd designer_appaiv2
```

2. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your API keys
```

3. **Install dependencies**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

4. **Start the application**
```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm start
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## 🎯 **How It Works**

1. **Upload**: Upload a photo of your kitchen/space
2. **Select Mode**: Choose Redesign (for renovations) or Design (for furnishing)  
3. **Pick Style**: Select from 8+ interior design styles
4. **Choose Room Type**: (Design mode only) Select the type of room for appropriate furniture
5. **Add Measurements**: (Optional) Add real measurements for realistic scaling
6. **Generate**: AI processes your image preserving structure while applying changes
7. **🆕 Plan Furniture**: Generate interactive furniture plans with shopping lists
8. **Download**: Get your transformed space and implementation guide

## 🛠 **Technology Stack**

- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Flask, Python 3.11, OpenAI SDK
- **AI**: ControlNet + Stable Diffusion (via Replicate API)
- **🆕 Furniture Analysis**: OpenAI GPT-4 Vision API
- **Containerization**: Docker & Docker Compose

## ✨ **Modern Landing Page**

Inspired by leading AI platforms, featuring:
- **Professional Design**: Clean, modern interface with smooth animations
- **Social Proof**: User statistics and success metrics
- **Clear Value Proposition**: Instant understanding of benefits
- **Interactive Elements**: Smooth transitions and hover effects
- **Conversion Optimized**: Strategic placement of CTAs and demos
- **Mobile Responsive**: Perfect experience across all devices

## 🆕 **Furniture Planning Features**

### **Interactive Furniture Map**
- **Clickable Hotspots**: Click on furniture pieces in your generated design
- **Detailed Information**: See furniture category, size, location, and style notes
- **Visual Positioning**: Hotspots show approximate positions of each furniture piece
- **Smart Categories**: Automatically categorizes items (seating, storage, lighting, appliances, etc.)

### **Smart Shopping Lists**
- **Automated Generation**: AI creates shopping lists from your generated design
- **Priority System**: Items ranked by importance (High/Medium/Low priority)
- **Price Estimates**: Rough price ranges for budgeting
- **Detailed Notes**: Specific requirements, alternatives, and purchasing tips
- **Downloadable**: Export shopping lists as text files

### **Layout Analysis**
- **Zone Identification**: Primary functional zones in your space
- **Traffic Flow**: Analysis of movement patterns and accessibility
- **Focal Points**: Key visual elements and design highlights
- **Lighting Scheme**: Lighting setup recommendations

### **Measurement-Aware Planning**
- **Scale Consideration**: Plans account for your actual room measurements
- **Realistic Proportions**: Furniture recommendations match your space size
- **Size Categories**: Automatic detection of small/medium/large spaces
- **Spatial Constraints**: Considers room width for appropriate furniture (e.g., no islands in narrow kitchens)

### **Implementation Support**
- **Professional Guidance**: AI provides practical implementation advice
- **Shopping Coordination**: Organized lists for efficient purchasing
- **Style Consistency**: Ensures all recommendations match your chosen design style
- **Functionality Focus**: Balances aesthetics with practical usability

## 🆕 New Features: Realistic Measurements

### Measurement Tool
- **Interactive Canvas**: Click and drag on your uploaded image to add measurement lines
- **Multiple Measurement Types**:
  - Wall dimensions (length/height)
  - Furniture spaces
  - Ceiling height
  - Counter depth
- **Unit Support**: Feet, inches, meters, centimeters
- **Visual Feedback**: Color-coded measurement lines with labels

### AI-Powered Realistic Scaling
- **Smart Furniture Sizing**: AI generates furniture that matches your room's actual dimensions
- **Scale Categories**: Automatically detects small, medium, or large spaces
- **Room-Specific Guidelines**: Different furniture recommendations based on room type and size
- **Proportional Design**: Maintains realistic relationships between furniture pieces

### Enhanced Generation
- **Measurement-Aware Prompts**: AI prompts include your specific room dimensions
- **Realistic Proportions**: Furniture scales properly to avoid tiny or oversized items
- **Professional Results**: Generates designs that look like real, livable spaces

## 📁 **Project Structure**

```
designer_appaiv2/
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FurniturePlan.js      # 🆕 Interactive furniture planning
│   │   │   ├── MeasurementTool.js    # Room measurement interface
│   │   │   └── ...
│   │   └── services/
│   │       └── apiService.js         # 🆕 Updated with furniture analysis
├── backend/           # Flask API backend  
│   ├── app.py         # 🆕 New /api/analyze-furniture endpoint
│   ├── measurement_utils.py
│   └── ...
├── docker-compose.yml # Container orchestration
└── README.md         # Documentation
```

## 🔧 **Configuration**

Create a `.env` file with your API keys:

```env
REPLICATE_API_TOKEN=your_replicate_token_here
OPENAI_API_KEY=your_openai_key_here  # Required for furniture planning
```

## 🎯 **API Endpoints**

### Core Endpoints
- `POST /api/generate` - Start design generation with measurements
- `GET /api/results/<job_id>` - Check generation status and retrieve results
- `POST /api/chat` - Enhance prompts with OpenAI (optional)
- `🆕 POST /api/analyze-furniture` - Analyze generated designs for furniture planning
- `GET /api/health` - Service health check

### 🆕 Furniture Analysis Data Format
```json
{
  "image_url": "https://replicate.delivery/...",
  "room_type": "kitchen",
  "measurements": [
    {
      "id": 1640995200000,
      "start": {"x": 100, "y": 150},
      "end": {"x": 300, "y": 150},
      "dimension": {"value": "3.6", "unit": "m"},
      "type": "wall"
    }
  ]
}
```

### 🆕 Furniture Analysis Response
```json
{
  "success": true,
  "analysis": {
    "furniture_items": [
      {
        "name": "Kitchen Island",
        "category": "island",
        "location": "center of room",
        "approximate_position": {"x": 45, "y": 60},
        "estimated_size": "large",
        "style_notes": "Modern white marble countertop",
        "practical_notes": "Provides additional storage and workspace"
      }
    ],
    "room_layout": {
      "primary_zones": ["cooking zone", "prep zone", "storage zone"],
      "traffic_flow": "Clear L-shaped flow around island",
      "focal_points": ["Kitchen island", "Window backsplash"],
      "lighting_scheme": "Pendant lights over island, under-cabinet LED strips"
    },
    "shopping_list": [
      {
        "item": "Kitchen Island with Storage",
        "category": "island",
        "estimated_price_range": "$800-$2000",
        "priority": "high",
        "notes": "Look for models with built-in storage and electrical outlets"
      }
    ]
  }
}
```

## 🎯 **How to Use Furniture Planning**

### **After Generating Your Design**
1. **Generate Your Design**: Complete the normal design generation process
2. **Click "Generate Plan"**: Button appears in the Furniture Plan section
3. **Explore Interactive Map**: Click purple hotspots on your generated image
4. **Review Shopping List**: Check automatically generated shopping recommendations
5. **Download Lists**: Export shopping lists and implementation notes

### **Understanding the Analysis**
- **Furniture Hotspots**: Purple dots show clickable furniture locations
- **Categories**: Items grouped by function (seating, storage, lighting, etc.)
- **Priority System**: Shopping items ranked by importance for the design
- **Layout Zones**: Room divided into functional areas (cooking, dining, etc.)

### **Implementation Tips**
- **Start with High Priority**: Focus on high-priority shopping list items first
- **Consider Measurements**: Plans account for your room measurements when provided
- **Style Consistency**: All recommendations match your selected design style
- **Traffic Flow**: Layout analysis helps optimize furniture placement for usability

## 🎯 **How to Use Measurements**

### Adding Measurements
1. **Upload Your Image**: Start by uploading a photo of your kitchen
2. **Access Measurement Tool**: The measurement section appears after image upload
3. **Draw Measurement Lines**: 
   - Click and drag on the image to create measurement lines
   - Lines must be at least 20 pixels long to be saved
4. **Add Dimensions**:
   - A modal appears after drawing each line
   - Enter the real measurement (e.g., "3.6" for 3.6 meters)
   - Select the unit (m, cm, ft, in)
   - Choose the measurement type (wall, furniture space, ceiling, counter)
5. **Review Measurements**: See all measurements listed with the ability to delete individual ones

### Measurement Types
- **Wall**: Room length, width, or wall heights
- **Furniture Space**: Areas designated for specific furniture pieces
- **Ceiling**: Room height from floor to ceiling
- **Counter**: Depth of countertops or work surfaces

### Best Practices
- **Measure Key Dimensions**: Focus on the longest wall and ceiling height for best results
- **Multiple Measurements**: Add 2-4 measurements for optimal AI understanding
- **Accurate Values**: Use real measurements for the most realistic furniture scaling
- **Clear Reference Points**: Draw lines along obvious architectural features

## 🎯 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly with various measurement scenarios
5. Submit a pull request

## 🎯 **License**

This project is licensed under the MIT License.

## 🎯 **Support**

For issues or questions:
1. Check the troubleshooting section
2. Review the measurement best practices
3. Open an issue on GitHub
4. Include screenshots of your measurements and any error messages

## Model Selection Feature

## Available Models

The application now supports multiple AI models for interior design generation:

### Adirik Interior Design (Default)
- **Cost**: $0.05 per generation
- **Strengths**: Cost-effective, good overall quality
- **Ideal for**: General interior design, quick iterations, budget-conscious projects

### Erayyavuz Interior AI (Premium)
- **Cost**: $0.25 per generation
- **Strengths**: Highly photorealistic, better lighting, superior material quality
- **Ideal for**: Premium visualizations, presentation quality, marketing materials

## How to Use

When making an API request to `/api/generate`, you can specify the model using the `modelSelection` parameter:

```json
{
  "image": "base64_image_data",
  "mode": "redesign",
  "style": "Modern",
  "modelSelection": "erayyavuz"
}
```

If no model is specified, the system will default to the more affordable "adirik" model.

## Getting Available Models

You can retrieve the list of available models and their details via the `/api/available-models` endpoint:

```
GET /api/available-models
```

This returns a JSON response with details about each model including pricing, strengths, and recommended use cases.

## Cost Considerations

- The premium "erayyavuz" model costs 5x more than the default model
- Be mindful of usage when generating multiple designs with the premium model
- Cost information is included in the job results to help track expenses

## Language Support

## English-Only Inputs Required

⚠️ **Important**: The AI models used in this application require inputs in English. Using non-English characters or words in style names, room types, or other parameters may cause errors.

### Supported Style Names
- Modern
- Traditional
- Contemporary
- Scandinavian
- Industrial
- Farmhouse
- Luxury

### Automatic Translation
The system will attempt to automatically translate common non-English style names to their English equivalents (e.g., "Šiuolaikinis" → "Contemporary"), but this is not guaranteed to work for all terms.

### Best Practices
- Always use English terms in API requests
- If you need to support multiple languages in your frontend, translate to English before sending to the API
- Check returned error messages for indications of language-related issues

If you get an error about "non-ASCII characters detected in prompt," review your input parameters and ensure they're in English.

---

**RenovaAI** - Transform your space with AI-powered design and realistic measurements! 🏠✨ 