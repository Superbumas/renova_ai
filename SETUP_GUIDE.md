# RenovaAI Setup Guide

This guide will walk you through setting up RenovaAI with all the required API keys and configuration.

## Prerequisites

- Node.js (18+)
- Python (3.11+)
- Docker (optional but recommended)
- Git

## Step 1: Get API Keys

### 1.1 Replicate API Token (Required)

1. Go to [Replicate.com](https://replicate.com)
2. Sign up for an account or log in
3. Go to your [API tokens page](https://replicate.com/account/api-tokens)
4. Create a new token and copy it

### 1.2 OpenAI API Key (Optional but recommended)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Create a new API key
4. Copy the key (starts with `sk-`)

## Step 2: Configure Environment Variables

1. In the project root directory, copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit the `.env` file and add your API keys:
   ```env
   # API Keys
   OPENAI_API_KEY=sk-your-openai-key-here
   REPLICATE_API_TOKEN=r8_your-replicate-token-here
   
   # Replicate Model IDs (pre-configured with best models)
   MODELS_DESIGN_ID=stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b
   MODELS_REDESIGN_ID=adirik/interior-design:76604baddc85b1b4f2ae5c5977713409fa7b53c8d8e9ac5e9e56ca7c2aac8b4a
   
   # Other settings (keep as default)
   FLASK_ENV=development
   FLASK_DEBUG=True
   UPLOAD_FOLDER=uploads
   MAX_CONTENT_LENGTH=16777216
   FRONTEND_URL=http://localhost:3000
   ```

## Step 3: Choose Your Setup Method

### Option A: Docker (Recommended - Easiest)

1. Make sure Docker is running on your system
2. Run the application:
   ```bash
   docker-compose up --build
   ```
3. Wait for both services to start (you'll see "Compiled successfully!" for frontend)
4. Open your browser to [http://localhost:3000](http://localhost:3000)

### Option B: Manual Setup

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the Flask server:
   ```bash
   python app.py
   ```
4. You should see "Starting RenovaAI backend..." with checkmarks for services

#### Frontend Setup (in a new terminal)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
4. Open your browser to [http://localhost:3000](http://localhost:3000)

## Step 4: Test the Application

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the RenovaAI interface with a beautiful gradient background
3. Upload a room image (JPG, PNG, or WebP)
4. Select a mode:
   - **Redesign**: Apply new style while keeping layout
   - **Design**: Furnish empty space from scratch
5. Choose a style (Modern, Rustic, etc.)
6. Click "Generate Design"
7. Wait 10-30 seconds for AI processing
8. View your transformed space!

## AI Models Used

### For Redesign Mode
- **Model**: `adirik/interior-design`
- **Purpose**: Realistic interior design with layout preservation
- **Cost**: ~$0.0055 per generation
- **Speed**: ~6 seconds

### For Design Mode
- **Model**: `stability-ai/sdxl`
- **Purpose**: High-quality image generation from text
- **Cost**: Varies by usage
- **Speed**: ~10-30 seconds

## Troubleshooting

### "Replicate client: ✗" in backend logs
- Check that your `REPLICATE_API_TOKEN` is set correctly in `.env`
- Make sure the token starts with `r8_`

### "OpenAI client: ✗" in backend logs
- This is optional - the app works without OpenAI
- If you want prompt enhancement, add your `OPENAI_API_KEY` to `.env`

### "Invalid model_version" error
- The model IDs have been updated to include proper versions
- Make sure you copied the latest `env.example` to your `.env` file

### Frontend won't connect to backend
- Make sure both services are running
- Check that backend is on port 5000 and frontend on port 3000
- Verify no firewall is blocking the connections

### Docker issues
- Make sure Docker Desktop is running
- Try `docker-compose down` then `docker-compose up --build`

## Costs

- **Replicate**: Pay per use (~$0.0055-0.12 per image)
- **OpenAI**: Pay per token (optional, for prompt enhancement)
- No subscription fees for the application itself

## Support

If you encounter any issues:
1. Check the logs in terminal/Docker
2. Verify your API keys are correct
3. Make sure all dependencies are installed
4. Try restarting the services

The application will display service status at startup to help diagnose issues.

## Next Steps

Once everything is working:
- Experiment with different styles and room types
- Try both Redesign and Design modes
- Use the download and share features
- Consider upgrading your Replicate plan for faster processing

Enjoy creating beautiful interior designs with RenovaAI! 🎨🏠 