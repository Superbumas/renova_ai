import uuid
import logging
import traceback
import base64
from datetime import datetime
from io import BytesIO
from flask import Blueprint, request, jsonify, current_app
from PIL import Image
import numpy as np
from utils.helpers import create_measurement_context
from spatial_layout_engine import SpatialLayoutEngine
import os

logger = logging.getLogger(__name__)

# Create blueprint
generate_bp = Blueprint('generate', __name__)

@generate_bp.route('/generate', methods=['POST'])
def generate_design():
    """
    Generate redesign or design based on uploaded image and dimensions
    Expected payload: { 
        image: base64, 
        mode: 'redesign'|'design', 
        style: string, 
        inspirationImage: string, 
        measurements: array,
        roomDimensions: object,
        aiIntensity: float,
        numRenders: int,
        highQuality: bool,
        privateRender: bool,
        advancedMode: bool,
        modelType: string
    }
    """
    logger.info("=== GENERATE DESIGN REQUEST RECEIVED ===")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Extract parameters
        image_data = data.get('image')
        mode = data.get('mode')
        style = data.get('style')
        inspiration_image = data.get('inspirationImage')
        measurements = data.get('measurements')
        room_dimensions = data.get('roomDimensions')
        ai_intensity = data.get('aiIntensity', 0.5)
        num_renders = data.get('numRenders', 1)
        high_quality = data.get('highQuality', False)
        private_render = data.get('privateRender', False)
        advanced_mode = data.get('advancedMode', False)
        model_selection = data.get('modelType', 'adirik')  # Default to adirik model
        
        if not image_data or not mode or not style:
            return jsonify({'error': 'Missing required parameters'}), 400
            
        # Create job ID
        job_id = str(uuid.uuid4())
        
        # Extract room type from measurements if available
        room_type = None
        if measurements:
            # Handle case where measurements can be either a list or a dictionary
            if isinstance(measurements, dict):
                room_type = measurements.get('roomType')
            elif isinstance(measurements, list) and len(measurements) > 0:
                # Try to find roomType in the list of measurements
                for item in measurements:
                    if isinstance(item, dict) and 'roomType' in item:
                        room_type = item['roomType']
                        break
        
        # Create job data
        job_data = {
            'id': job_id,
            'status': 'pending',
            'mode': mode,
            'style': style,
            'ai_intensity': ai_intensity,
            'num_renders': num_renders,
            'high_quality': high_quality,
            'private_render': private_render,
            'advanced_mode': advanced_mode,
            'model_selection': model_selection,
            'room_type': room_type,
            'room_dimensions': room_dimensions,
            'spatial_layout': None  # We'll handle this separately
        }
        
        # Get services from app context
        db_service = current_app.config['DB_SERVICE']
        ai_service = current_app.config['AI_SERVICE']
        image_processor = current_app.config['IMAGE_PROCESSOR']
        replicate_client = current_app.config['REPLICATE_CLIENT']
        
        # Create job in database
        job = db_service.create_job(job_data)
        if not job:
            return jsonify({'error': 'Failed to create job'}), 500
            
        # Process image
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(BytesIO(image_bytes))
            
            # Process image for redesign
            processed_image = image_processor.process_image(image)
            
            # Analyze room image for layout and important features
            room_analysis = None
            spatial_processor = current_app.config.get('SPATIAL_PROCESSOR')
            if spatial_processor:
                try:
                    logger.info(f"Analyzing room layout for job {job_id}")
                    room_analysis = spatial_processor.analyze_room_layout(image)
                    
                    # Also use AI to analyze the room image
                    if ai_service.openai_client:
                        logger.info(f"Performing AI analysis of room for job {job_id}")
                        ai_room_analysis = ai_service.analyze_room_image(image_data)
                        
                        # Merge AI analysis with spatial processor analysis
                        if ai_room_analysis and isinstance(ai_room_analysis, dict):
                            if room_analysis is None:
                                room_analysis = {}
                            # Add AI-detected colors, materials, and style elements
                            if 'colors' in ai_room_analysis:
                                room_analysis['colors'] = ai_room_analysis.get('colors', [])
                            if 'materials' in ai_room_analysis:
                                room_analysis['materials'] = ai_room_analysis.get('materials', [])
                            if 'style_elements' in ai_room_analysis:
                                room_analysis['style_elements'] = ai_room_analysis.get('style_elements', [])
                            if 'key_features' in ai_room_analysis:
                                room_analysis['key_features'] = ai_room_analysis.get('key_features', [])
                except Exception as e:
                    logger.error(f"Error analyzing room layout: {str(e)}")
                    # Continue even if analysis fails
            
            # Process inspiration image if provided
            inspiration_description = None
            if inspiration_image:
                try:
                    logger.info(f"Analyzing inspiration image for job {job_id}")
                    inspiration_description = ai_service.analyze_inspiration_image(inspiration_image)
                    logger.info(f"Inspiration analysis result: {inspiration_description[:100] if inspiration_description else 'None'}")
                except Exception as e:
                    logger.error(f"Error analyzing inspiration image: {str(e)}")
                    # Continue even if analysis fails
            
            # Generate prompts using existing method with enhanced inputs
            room_type = room_type or 'room'
            positive_prompt, negative_prompt = ai_service.generate_comprehensive_prompt(
                mode=mode,
                style=style,
                room_type=room_type,
                ai_intensity=ai_intensity,
                measurements=measurements,
                inspiration_description=inspiration_description,
                room_analysis=room_analysis
            )
            
            # Log the prompt for debugging
            logger.info(f"Job {job_id} positive prompt: {positive_prompt[:100]}...")
            logger.info(f"Job {job_id} negative prompt: {negative_prompt[:100]}...")
            
            # Select model version based on user preference
            if model_selection == 'erayyavuz':
                model_version = "erayyavuz/interior-ai:e299c531485aac511610a878ef44b554381355de5ee032d109fcae5352f39fa9"
                logger.info(f"Using erayyavuz/interior-ai model")
                
                # Parameters for erayyavuz model
                model_input = {
                    "image": processed_image,
                    "prompt": positive_prompt,
                    "negative_prompt": negative_prompt,
                    "strength": 0.8,
                    "num_inference_steps": 60 if high_quality else 30,
                    "guidance_scale": 15.0,
                    "width": 1024 if high_quality else 768,
                    "height": 1024 if high_quality else 768
                }
            else:
                # Default to adirik model
                model_version = "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38"
                logger.info(f"Using Adirik interior design model")
                
                # Parameters for adirik model
                model_input = {
                    "image": processed_image,
                    "prompt": positive_prompt,
                    "negative_prompt": negative_prompt,
                    "prompt_strength": 0.8,
                    "num_inference_steps": 60 if high_quality else 30,
                    "guidance_scale": 15.0,
                    "scheduler": "DPM_PLUS_PLUS_2M",
                    "num_outputs": num_renders,
                    "disable_safety_checker": True
                }
                
                # Apply high-quality settings if requested
                if high_quality:
                    model_input.update({
                        "width": 1024,
                        "height": 1024,
                        "guidance_scale": 20.0,
                        "scheduler": "DDIM",
                        "num_inference_steps": 85
                    })
            
            # Start Replicate prediction
            prediction = replicate_client.predictions.create(
                version=model_version,
                input=model_input
            )
            
            # Update job with prediction info and analysis data
            job.prediction_id = prediction.id
            job.model_version = model_version
            job.prompt = positive_prompt
            job.negative_prompt = negative_prompt
            job.status = 'processing'
            job.room_analysis = room_analysis
            job.inspiration_analysis = inspiration_description
            db_service.update_job(job.id, job.to_dict())
            
            return jsonify({
                'job_id': job_id,
                'status': 'processing',
                'message': 'Generation started successfully'
            })
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            logger.error(traceback.format_exc())
            job.status = 'failed'
            job.error = str(e)
            db_service.update_job(job.id, job.to_dict())
            return jsonify({'error': 'Failed to process image'}), 500
            
    except Exception as e:
        logger.error(f"Error in generate_design: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@generate_bp.route('/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """Get results for a specific job"""
    try:
        logger.info(f"Results requested for job: {job_id}")
        db_service = current_app.config['DB_SERVICE']
        replicate_client = current_app.config['REPLICATE_CLIENT']
        
        # Get job from database
        job = db_service.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return jsonify({'error': 'Job not found'}), 404
            
        # If job is still processing, check status
        if job.status == 'processing' and job.prediction_id:
            try:
                prediction = replicate_client.predictions.get(job.prediction_id)
                logger.info(f"Prediction status: {prediction.status}")
                
                if prediction.status == 'succeeded':
                    logger.info(f"Prediction succeeded. Output: {prediction.output}")
                    
                    # Handle different output formats
                    result_url = None
                    if isinstance(prediction.output, list) and prediction.output:
                        result_url = prediction.output[0]
                    elif isinstance(prediction.output, str):
                        result_url = prediction.output
                    elif isinstance(prediction.output, dict) and 'result' in prediction.output:
                        result_url = prediction.output['result']
                    
                    if result_url:
                        logger.info(f"Setting result URL: {result_url}")
                        job.status = 'completed'
                        job.result_url = result_url
                        db_service.update_job(job.id, job.to_dict())
                    else:
                        logger.error(f"No valid result URL found in output: {prediction.output}")
                        job.status = 'failed'
                        job.error = "No valid output URL found in prediction result"
                        db_service.update_job(job.id, job.to_dict())
                        
                elif prediction.status == 'failed':
                    logger.error(f"Prediction failed: {prediction.error}")
                    job.status = 'failed'
                    job.error = prediction.error
                    db_service.update_job(job.id, job.to_dict())
            except Exception as e:
                logger.error(f"Error checking prediction status: {str(e)}")
                logger.error(traceback.format_exc())
                
        # Log the result we're returning
        logger.info(f"Returning job with status: {job.status}")
        if job.result_url:
            logger.info(f"Result URL: {job.result_url}")
        if job.error:
            logger.error(f"Job error: {job.error}")
            
        return jsonify(job.to_dict())
        
    except Exception as e:
        logger.error(f"Error in get_results: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@generate_bp.route('/jobs', methods=['GET'])
def list_jobs():
    """List all processing jobs (for debugging/admin)"""
    try:
        db_service = current_app.config['DB_SERVICE']
        jobs = db_service.list_jobs()
        return jsonify([job.to_dict() for job in jobs])
    except Exception as e:
        logger.error(f"Error in list_jobs: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@generate_bp.route('/generate-layout', methods=['POST'])
def generate_layout():
    """
    Generate layout from room dimensions only (without image)
    """
    logger.info("=== GENERATE LAYOUT REQUEST RECEIVED ===")
    
    try:
        spatial_engine = SpatialLayoutEngine()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        room_dimensions = data.get('roomDimensions')
        if not room_dimensions:
            return jsonify({'error': 'Room dimensions required'}), 400
        
        # Generate layout
        layout_data = spatial_engine.generate_layout_from_dimensions(room_dimensions)
        
        # Convert images to base64 for response
        response_data = {
            'layout_type': layout_data['layout_type'],
            'spatial_constraints': layout_data['spatial_constraints'],
            'layout_feasibility': layout_data['layout_feasibility'],
            'furniture_zones': layout_data['furniture_zones'],
            'room_dimensions': layout_data['room_dimensions']
        }
        
        # Convert PNG mask to base64
        if layout_data['png_mask']:
            buffer = BytesIO()
            layout_data['png_mask'].save(buffer, format='PNG')
            response_data['layout_preview'] = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'layout_data': response_data
        })
        
    except Exception as e:
        logger.error(f"Layout generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@generate_bp.route('/chat', methods=['POST'])
def enhance_prompt():
    """
    Enhance style prompts using OpenAI GPT-4
    Expected payload: { prompt: string }
    """
    try:
        ai_service = current_app.config['AI_SERVICE']
        
        data = request.get_json()
        user_prompt = data.get('prompt', '')
        
        if not user_prompt:
            return jsonify({'error': 'No prompt provided'}), 400
        
        result = ai_service.enhance_prompt(user_prompt)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': f'Error enhancing prompt: {str(e)}'}), 500

@generate_bp.route('/extract-pinterest-url', methods=['POST'])
def extract_pinterest_url():
    """
    Extract direct image URL from Pinterest page URL
    Expected payload: { url: string }
    """
    try:
        from utils.helpers import extract_pinterest_image_url
        
        data = request.get_json()
        pinterest_url = data.get('url')
        
        if not pinterest_url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Try to extract direct image URL
        direct_image_url = extract_pinterest_image_url(pinterest_url)
        
        if direct_image_url:
            return jsonify({
                'success': True,
                'original_url': pinterest_url,
                'direct_image_url': direct_image_url
            })
        else:
            # If extraction fails, return original URL
            return jsonify({
                'success': False,
                'original_url': pinterest_url,
                'direct_image_url': pinterest_url,
                'message': 'Could not extract direct image URL, using original'
            })
            
    except Exception as e:
        return jsonify({'error': f'Error extracting Pinterest URL: {str(e)}'}), 500

@generate_bp.route('/refine', methods=['POST'])
def refine_design():
    """
    Refine an existing design based on user feedback
    Expected payload: {
        base_image_url: string,
        refinement_request: string,
        original_style: string,
        room_type: string,
        ai_intensity: float,
        measurements: array
    }
    """
    try:
        ai_service = current_app.config['AI_SERVICE']
        image_processor = current_app.config['IMAGE_PROCESSOR']
        replicate_client = current_app.config['REPLICATE_CLIENT']
        db_service = current_app.config['DB_SERVICE']
        
        data = request.get_json()
        
        # Extract parameters
        base_image_url = data.get('base_image_url')
        refinement_request = data.get('refinement_request', '')
        original_style = data.get('original_style', 'Modern')
        room_type = data.get('room_type', 'kitchen')
        ai_intensity = data.get('ai_intensity', 0.5)
        measurements = data.get('measurements', [])
        high_quality = data.get('high_quality', False)
        
        if not base_image_url or not refinement_request:
            return jsonify({'error': 'Base image URL and refinement request are required'}), 400
        
        # Generate job ID
        job_id = str(uuid.uuid4())
        
        # Store initial job info
        job_data = {
            'id': job_id,
            'status': 'processing',
            'created_at': datetime.now().isoformat(),
            'type': 'refinement',
            'base_image_url': base_image_url,
            'refinement_request': refinement_request
        }
        
        try:
            db_service.create_job(job_data)
        except Exception as e:
            logger.error(f"Job {job_id}: Failed to create job in database: {str(e)}")
            return jsonify({'error': 'Failed to create job'}), 500
        
        # Create specialized refinement prompt
        refinement_prompt = f"""
        Professional photo of {original_style} {room_type.replace('-', ' ')} interior design with the following specific changes:
        
        {refinement_request}
        
        This is a professional interior photograph showing an elegant {original_style.lower()} {room_type.replace('-', ' ')} with:
        - High-quality materials and finishes
        - Professional interior lighting
        - Expert composition
        - Perfect exposure
        - Ultrarealistic details
        - 8K resolution quality
        - Architectural photography style
        - Magazine-quality presentation
        
        The changes requested should be implemented while maintaining the overall layout, proportions, and core design elements of the existing space.
        """
        
        # Generate negative prompt for refinement - more specific
        negative_prompt = """
        poor interior design, cluttered space, mismatched styles, unprofessional result, 
        low quality, blurry, artifacts, distorted perspective, unrealistic scale, 
        oversaturated colors, bad lighting, bad composition, unnatural shadows,
        poorly rendered materials, incorrect reflections, cartoon style, sketch, 
        drawing, amateur photography, badly framed
        """
        
        # Get model parameters optimized for VERY conservative refinement
        model_params = ai_service.get_model_parameters(ai_intensity * 0.4, high_quality, 'redesign')  # Much lower intensity
        
        # CRITICAL: Use very low prompt strength for refinements
        original_prompt_strength = model_params.get('prompt_strength', 0.5)
        # Increase prompt strength for more visible changes - using 0.3 instead of 0.2
        model_params['prompt_strength'] = min(0.3, original_prompt_strength * 0.6)  # Cap at 0.3, higher multiplier
        
        # Increase guidance scale for more pronounced changes
        model_params['guidance_scale'] = min(model_params.get('guidance_scale', 7.5) + 3.0, 12.0)  # Higher guidance scale
        
        # Use more inference steps for better quality on subtle changes
        model_params['num_inference_steps'] = max(model_params.get('num_inference_steps', 25), 35)
        
        # Make sure we're using a valid scheduler
        if 'scheduler' in model_params and model_params['scheduler'] not in [
            "DDIM", "DPMSolverMultistep", "HeunDiscrete", "KarrasDPM", 
            "K_EULER_ANCESTRAL", "K_EULER", "PNDM"
        ]:
            # Default to a safe option
            model_params['scheduler'] = "K_EULER_ANCESTRAL"
            logger.info(f"Job {job_id}: Changed to valid scheduler: K_EULER_ANCESTRAL")
        
        # Use primary model for refinement
        model_id = os.getenv('MODELS_REDESIGN_ID', 'adirik/interior-design:76604baddc85b1b4f2ae5c5977713409fa7b53c8d8e9ac5e9e56ca7c2aac8b4a')
        
        logger.info(f"Starting refinement generation for job {job_id}")
        logger.info(f"Refinement request: {refinement_request}")
        logger.info(f"Model: {model_id}")
        logger.info(f"Parameters: {model_params}")
        
        # Create input for the model
        model_input = {
            "image": base_image_url,
            "prompt": refinement_prompt,
            "negative_prompt": negative_prompt,
            **model_params
        }
        
        # Start the prediction
        try:
            prediction = replicate_client.predictions.create(
                version=model_id,
                input=model_input
            )
            
            # Update job storage with prediction info
            db_service.update_job(job_id, {
                'prediction_id': prediction.id,
                'model_used': model_id,
                'input_params': model_input,
                'prompt': refinement_prompt
            })
            
            logger.info(f"Refinement prediction started: {prediction.id}")
            
            return jsonify({
                'job_id': job_id,
                'status': 'processing',
                'message': 'Refinement started successfully',
                'prediction_id': prediction.id
            })
            
        except Exception as e:
            logger.error(f"Error starting refinement prediction: {str(e)}")
            db_service.update_job(job_id, {
                'status': 'failed',
                'error': str(e)
            })
            return jsonify({'error': f'Error starting refinement: {str(e)}'}), 500
            
    except Exception as e:
        logger.error(f"Error in refine_design: {str(e)}")
        return jsonify({'error': f'Error processing refinement request: {str(e)}'}), 500

@generate_bp.route('/available-models', methods=['GET'])
def get_available_models():
    """Get available AI models and their pricing"""
    try:
        # Define available models with details
        available_models = [
            {
                "id": "adirik",
                "name": "Adirik Interior Design",
                "description": "Default interior design model with good quality and reasonable cost",
                "version": "76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38",
                "cost_per_generation": "$0.05",
                "strengths": ["Cost-effective", "Good overall quality", "Fast generation"],
                "ideal_for": ["General interior design", "Quick iterations", "Budget-conscious projects"]
            },
            {
                "id": "erayyavuz",
                "name": "Erayyavuz Interior AI",
                "description": "Premium interior design model for photorealistic results",
                "version": "e299c531485aac511610a878ef44b554381355de5ee032d109fcae5352f39fa9",
                "cost_per_generation": "$0.25",
                "strengths": ["Highly photorealistic", "Better lighting", "Superior material quality"],
                "ideal_for": ["Premium visualizations", "Presentation quality", "Marketing materials"]
            }
        ]
        
        return jsonify({
            "models": available_models,
            "default_model": "adirik"
        })
        
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        return jsonify({"error": "Failed to retrieve available models"}), 500 