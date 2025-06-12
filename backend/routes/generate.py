import uuid
import logging
import traceback
import base64
from datetime import datetime
from io import BytesIO
from flask import Blueprint, request, jsonify, current_app
from PIL import Image
import numpy as np
from utils.helpers import create_measurement_context, sanitize_text
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
        advancedMode: bool
    }
    """
    logger.info("=== GENERATE DESIGN REQUEST RECEIVED ===")
    
    try:
        # Get services from app config
        ai_service = current_app.config['AI_SERVICE']
        image_processor = current_app.config['IMAGE_PROCESSOR']
        replicate_client = current_app.config['REPLICATE_CLIENT']
        db_service = current_app.config['DB_SERVICE']
        
        data = request.get_json()
        logger.info(f"Request data received: {list(data.keys()) if data else 'No data'}")
        
        if not data:
            logger.error("No data provided in request")
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract parameters
        image_data = data.get('image')
        mode = sanitize_text(data.get('mode'))
        style = sanitize_text(data.get('style', 'Modern'))
        inspiration_image = data.get('inspirationImage')
        measurements = data.get('measurements', [])
        room_dimensions = data.get('roomDimensions')
        room_type = sanitize_text(data.get('roomType', 'kitchen'))
        ai_intensity = float(data.get('aiIntensity', 0.5))
        num_renders = int(data.get('numRenders', 1))
        high_quality = bool(data.get('highQuality', False))
        private_render = bool(data.get('privateRender', False))
        advanced_mode = bool(data.get('advancedMode', False))
        model_selection = sanitize_text(data.get('modelType', 'adirik'))
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Log sanitized inputs
        logger.info(f"Job {job_id}: Sanitized input - mode: {mode}, style: {style}, room_type: {room_type}")
        logger.info(f"Parameters: mode={mode}, style={style}, room_type={room_type}")
        logger.info(f"Advanced: ai_intensity={ai_intensity}, num_renders={num_renders}, high_quality={high_quality}")
        logger.info(f"Room dimensions provided: {bool(room_dimensions)}")
        
        # Validate required parameters
        if not image_data:
            logger.error("No image provided")
            return jsonify({'error': 'Image is required'}), 400
        
        if not mode:
            logger.error("No mode specified")
            return jsonify({'error': 'Mode is required (redesign or design)'}), 400
        
        if not replicate_client:
            logger.error("Replicate client not available")
            return jsonify({'error': 'AI service not available. Please check configuration.'}), 500
        
        logger.info(f"Job {job_id}: Starting {mode} with style: {style}")
        
        # Process and save image
        logger.info(f"Job {job_id}: Processing image data...")
        
        try:
            # Clean the base64 data
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode and save image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(BytesIO(image_bytes))
            
            # Save image to uploads directory
            image_path = f"uploads/{job_id}.png"
            image.save(image_path)
            
            logger.info(f"Job {job_id}: Image saved to {image_path}, size: {image.size}")
            
        except Exception as e:
            logger.error(f"Job {job_id}: Image processing failed: {str(e)}")
            return jsonify({'error': f'Image processing failed: {str(e)}'}), 400
        
        # Generate comprehensive prompts
        logger.info(f"Job {job_id}: Generating comprehensive prompts...")
        try:
            positive_prompt, negative_prompt = ai_service.generate_comprehensive_prompt(
                mode=mode,
                style=style,
                room_type=room_type,
                ai_intensity=ai_intensity,
                measurements=measurements,
                inspiration_description=None,
                room_analysis=None
            )
            
            logger.info(f"Job {job_id}: Prompts generated successfully")
            logger.info(f"Job {job_id}: Positive prompt: {positive_prompt[:200]}...")
            
        except Exception as e:
            logger.error(f"Job {job_id}: Prompt generation failed: {str(e)}")
            return jsonify({'error': f'Prompt generation failed: {str(e)}'}), 500
        
        # Store additional model information
        model_info = {
            'adirik': {
                'name': 'Adirik Interior Design',
                'cost_per_generation': '$0.05'
            },
            'erayyavuz': {
                'name': 'Erayyavuz Interior AI',
                'cost_per_generation': '$0.25'
            }
        }
        
        # Get model cost information
        model_cost = model_info.get(model_selection, {}).get('cost_per_generation', 'Unknown')
        model_name = model_info.get(model_selection, {}).get('name', model_selection)
        
        # Create job in database
        job_data = {
            'id': job_id,
            'status': 'processing',
            'mode': mode,
            'style': style,
            'ai_intensity': ai_intensity,
            'num_renders': num_renders,
            'high_quality': high_quality,
            'private_render': private_render,
            'advanced_mode': advanced_mode,
            'model_selection': model_selection,
            'model_name': model_name,
            'model_cost': model_cost,
            'room_type': room_type,
            'prompt': positive_prompt,
            'negative_prompt': negative_prompt,
            'room_dimensions': room_dimensions
        }
        
        try:
            db_service.create_job(job_data)
        except Exception as e:
            logger.error(f"Job {job_id}: Failed to create job in database: {str(e)}")
            return jsonify({'error': 'Failed to create job'}), 500
        
        # Process image for AI generation
        logger.info(f"Job {job_id}: Processing image for AI generation...")
        try:
            processing_info = image_processor.process_image_for_ai(image_path, ai_intensity)
            logger.info(f"Job {job_id}: Image processing completed - mode: {processing_info['mode']}")
        except Exception as e:
            logger.error(f"Job {job_id}: Image processing failed: {str(e)}")
            processing_info = {'mode': 'img2img', 'mask_path': None, 'strength_adjustment': 1.0}
        
        # Get model parameters
        model_params = ai_service.get_model_parameters(ai_intensity, high_quality, mode)
        
        # Prepare for Replicate API call
        logger.info(f"Job {job_id}: Preparing Replicate API call...")
        
        # Select model based on user choice
        if model_selection == 'erayyavuz':
            model_version = "erayyavuz/interior-ai:e299c531485aac511610a878ef44b554381355de5ee032d109fcae5352f39fa9"
            logger.info(f"Job {job_id}: Using erayyavuz/interior-ai model (Cost: $0.25 per generation)")
            
            base_url = os.getenv('BACKEND_URL', 'https://renova.andrius.cloud')
            image_url = f"{base_url}/uploads/{job_id}.png"
            
            replicate_input = {
                "image": image_url,
                "prompt": positive_prompt,
                "negative_prompt": negative_prompt,
                "strength": model_params.get('prompt_strength', 0.8),
                "num_inference_steps": model_params.get('num_inference_steps', 60),
                "guidance_scale": model_params.get('guidance_scale', 15),
                "width": model_params.get('width', 768),
                "height": model_params.get('height', 768),
                "seed": model_params.get('seed')
            }
            
            if high_quality:
                replicate_input.update({
                    "num_inference_steps": 85,
                    "width": 1024,
                    "height": 1024,
                    "guidance_scale": 20
                })
                
        else:
            model_version = "adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38"
            logger.info(f"Job {job_id}: Using Adirik interior design model")
            
            replicate_input = {
                "image": f"data:image/png;base64,{image_data}",
                "prompt": positive_prompt,
                "negative_prompt": negative_prompt,
                "prompt_strength": model_params.get('prompt_strength', 0.8),
                "num_inference_steps": model_params.get('num_inference_steps', 60),
                "guidance_scale": model_params.get('guidance_scale', 15),
                "scheduler": model_params.get('scheduler', 'DPM_PLUS_PLUS_2M'),
                "width": model_params.get('width', 768),
                "height": model_params.get('height', 768),
                "num_outputs": 1,
                "disable_safety_checker": True,
                "seed": model_params.get('seed')
            }
            
            if high_quality:
                replicate_input.update({
                    "num_inference_steps": 85,
                    "width": 1024,
                    "height": 1024,
                    "guidance_scale": 20,
                    "scheduler": "DDIM"
                })
        
        # Log the selected model and parameters
        logger.info(f"Job {job_id}: Using model: {model_version}")
        logger.info(f"Job {job_id}: Model parameters - steps: {replicate_input.get('num_inference_steps')}, " + 
                   f"guidance_scale: {replicate_input.get('guidance_scale')}, " +
                   f"dimensions: {replicate_input.get('width')}x{replicate_input.get('height')}")
        
        # Execute Replicate prediction
        logger.info(f"Job {job_id}: Starting Replicate prediction with model: {model_version}")
        try:
            prediction = replicate_client.predictions.create(
                version=model_version,
                input=replicate_input
            )
            
            # Update job with prediction info
            db_service.update_job(job_id, {
                'prediction_id': prediction.id,
                'model_version': model_version
            })
            
            logger.info(f"Job {job_id}: Replicate prediction started with ID: {prediction.id}")
            
            return jsonify({
                'success': True,
                'job_id': job_id,
                'prediction_id': prediction.id,
                'status': 'processing',
                'message': 'Design generation started successfully',
                'estimated_time': '60-120 seconds'
            })
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"Job {job_id}: Replicate prediction failed: {error_message}")
            
            # Handle character encoding issues
            if "non-ASCII" in error_message or "UnicodeEncodeError" in error_message or "codec can't encode" in error_message:
                logger.error(f"Job {job_id}: Detected character encoding issue - non-English characters in prompt")
                db_service.update_job(job_id, {
                    'status': 'failed',
                    'error': 'Non-English characters detected in prompt. Please use English style names only.'
                })
                return jsonify({
                    'job_id': job_id,
                    'status': 'failed',
                    'error': 'Non-English characters detected in prompt. Please use English style names only.'
                })
            
            # Handle other errors
            db_service.update_job(job_id, {
                'status': 'failed',
                'error': f'Prediction failed: {error_message}'
            })
            return jsonify({
                'job_id': job_id,
                'status': 'failed',
                'error': f'Prediction failed: {error_message}'
            })
            
    except Exception as e:
        error_msg = f"Unexpected error in generate_design: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500

@generate_bp.route('/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """Get results for a specific job"""
    logger.info(f"Results requested for job: {job_id}")
    
    try:
        db_service = current_app.config['DB_SERVICE']
        replicate_client = current_app.config['REPLICATE_CLIENT']
        
        # Get job from database
        job = db_service.get_job(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if this is a job with a prediction ID that needs checking
        if job.get('prediction_id') and job.get('status') == 'processing' and replicate_client:
            try:
                # Check the Replicate prediction status
                prediction = replicate_client.predictions.get(job['prediction_id'])
                logger.info(f"Job {job_id} prediction status: {prediction.status}")
                
                if prediction.status == 'succeeded':
                    # Update job with results
                    result_url = prediction.output[0] if isinstance(prediction.output, list) else prediction.output
                    db_service.update_job(job_id, {
                        'status': 'completed',
                        'result_url': result_url,
                        'all_renders': [result_url] if result_url else []
                    })
                    logger.info(f"Job {job_id} completed successfully")
                    
                elif prediction.status == 'failed':
                    # Update job with failure
                    error_msg = getattr(prediction, 'error', 'Generation failed')
                    db_service.update_job(job_id, {
                        'status': 'failed',
                        'error': str(error_msg)
                    })
                    logger.error(f"Job {job_id} failed: {error_msg}")
                    
                elif prediction.status == 'canceled':
                    db_service.update_job(job_id, {
                        'status': 'failed',
                        'error': 'Generation was canceled'
                    })
                    logger.warning(f"Job {job_id} was canceled")
                
            except Exception as e:
                logger.error(f"Error checking prediction {job.get('prediction_id')}: {str(e)}")
        
        # Get updated job data
        job = db_service.get_job(job_id)
        
        # Return job status and any available results
        result = {
            'status': job.get('status', 'unknown'),
            'job_id': job_id,
            'mode': job.get('mode'),
            'style': job.get('style'),
            'timestamp': job.get('created_at'),
            'model': {
                'id': job.get('model_selection'),
                'name': job.get('model_name'),
                'cost_per_generation': job.get('model_cost')
            },
            'prompt_info': {
                'prompt': job.get('prompt'),
                'negative_prompt': job.get('negative_prompt')
            }
        }
        
        # Add result URL if available
        if job.get('result_url'):
            result['result_url'] = job['result_url']
        
        # Add error if present
        if job.get('error'):
            result['error'] = job.get('error')
        
        logger.info(f"Returning results for job {job_id}: status={result['status']}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error getting results for job {job_id}: {str(e)}")
        return jsonify({'error': f'Error getting results: {str(e)}'}), 500

@generate_bp.route('/jobs', methods=['GET'])
def list_jobs():
    """List all processing jobs (for debugging/admin)"""
    try:
        db_service = current_app.config['DB_SERVICE']
        jobs = db_service.list_jobs()
        return jsonify({'jobs': jobs})
    except Exception as e:
        logger.error(f"Error listing jobs: {str(e)}")
        return jsonify({'error': f'Error listing jobs: {str(e)}'}), 500

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