import os
import uuid
from flask import Flask, request, jsonify, send_from_directory, current_app
from flask_cors import CORS
from dotenv import load_dotenv
import replicate
from openai import OpenAI
from PIL import Image
import io
import base64
from typing import Dict, List, Optional, Any
import logging
import traceback
from datetime import datetime
import cv2
import numpy as np
from io import BytesIO
from services.ai_service import AIService
from services.image_processor import ImageProcessor
from services.blueprint_service import BlueprintService
from services.db_service import DatabaseService
from routes.generate import generate_bp
from routes.analysis import analysis_bp

# Configure comprehensive logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log') if os.path.exists('/app') else logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv('FRONTEND_URL', 'https://renova.andrius.cloud'),
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))  # 16MB
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')

# Initialize services
logger.info("=== STARTING RENOVAAI BACKEND ===")

# Initialize API clients
replicate_client = None
openai_client = None
replicate_status = "❌ Failed"
openai_status = "❌ Failed"

# Initialize Replicate client
try:
    replicate_token = os.getenv('REPLICATE_API_TOKEN')
    if replicate_token and replicate_token != 'your_replicate_token_here':
        logger.info("Initializing Replicate client...")
        replicate_client = replicate.Client(api_token=replicate_token)
        
        # Test connection
        logger.info("Testing Replicate API connection...")
        test_models = replicate_client.models.list()
        logger.info(f"Replicate API test successful! Found {len(list(test_models))} models available")
        replicate_status = "✅ Connected & Tested"
    else:
        logger.warning("Replicate API token not configured")
        replicate_status = "⚠️ No Valid Token"
except Exception as e:
    logger.error(f"Replicate client initialization failed: {str(e)}")
    replicate_status = f"❌ Error: {str(e)}"

# Initialize OpenAI client
try:
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key and openai_key != 'your_openai_api_key_here':
        logger.info("Initializing OpenAI client...")
        openai_client = OpenAI(api_key=openai_key)
        
        # Test connection
        logger.info("Testing OpenAI API connection...")
        test_response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello, testing connection"}],
            max_tokens=5
        )
        logger.info(f"OpenAI API test successful! Response: {test_response.choices[0].message.content}")
        openai_status = "✅ Connected & Tested"
    else:
        logger.warning("OpenAI API key not configured")
        openai_status = "⚠️ No Valid Key"
except Exception as e:
    logger.error(f"OpenAI client initialization failed: {str(e)}")
    openai_status = f"❌ Error: {str(e)}"

# Initialize services with clients
ai_service = AIService(openai_client)
image_processor = ImageProcessor()
blueprint_service = BlueprintService(openai_client)

# Initialize database service
db_service = DatabaseService(os.getenv('DATABASE_URL'))

# Create uploads directory
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Store services in app config
app.config['REPLICATE_CLIENT'] = replicate_client
app.config['OPENAI_CLIENT'] = openai_client
app.config['AI_SERVICE'] = ai_service
app.config['IMAGE_PROCESSOR'] = image_processor
app.config['BLUEPRINT_SERVICE'] = blueprint_service
app.config['DB_SERVICE'] = db_service

# Register blueprints
app.register_blueprint(generate_bp, url_prefix='/api')
app.register_blueprint(analysis_bp, url_prefix='/api')

# Route to serve uploaded images
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    logger.info(f"Serving uploaded file: {filename}")
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Core health and status routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Enhanced health check with detailed API status"""
    logger.info("Health check requested")
    
    # Test all services in real-time
    current_replicate_status = replicate_status
    current_openai_status = openai_status
    
    # Quick connection tests
    if replicate_client:
        try:
            models = replicate_client.models.list()
            current_replicate_status = "✅ Active"
        except Exception as e:
            current_replicate_status = f"❌ Connection Error: {str(e)}"
    
    if openai_client:
        try:
            openai_client.models.list()
            current_openai_status = "✅ Active"
        except Exception as e:
            current_openai_status = f"❌ Connection Error: {str(e)}"
    
    health_data = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'RenovaAI API is running',
        'services': {
            'replicate': {
                'status': current_replicate_status,
                'client_available': replicate_client is not None,
                'token_configured': bool(os.getenv('REPLICATE_API_TOKEN'))
            },
            'openai': {
                'status': current_openai_status,
                'client_available': openai_client is not None,
                'key_configured': bool(os.getenv('OPENAI_API_KEY'))
            },
            'ai_service': {
                'status': '✅ Initialized' if ai_service else '❌ Failed',
                'available': ai_service is not None
            },
            'image_processor': {
                'status': '✅ Initialized' if image_processor else '❌ Failed',
                'available': image_processor is not None
            },
            'blueprint_service': {
                'status': '✅ Initialized' if blueprint_service else '❌ Failed',
                'available': blueprint_service is not None
            },
            'database': {
                'status': '✅ Initialized' if db_service else '❌ Failed',
                'available': db_service is not None
            }
        },
        'models': {
            'adirik': {
                'name': 'Adirik Interior Design',
                'status': '✅ Available' if replicate_client else '❌ Unavailable',
                'cost_per_generation': '$0.05'
            },
            'erayyavuz': {
                'name': 'Erayyavuz Interior AI',
                'status': '✅ Available' if replicate_client else '❌ Unavailable',
                'cost_per_generation': '$0.25'
            }
        },
        'environment': {
            'upload_folder': app.config['UPLOAD_FOLDER'],
            'max_content_length': app.config['MAX_CONTENT_LENGTH'],
            'cors_origin': os.getenv('FRONTEND_URL', 'https://renova.andrius.cloud')
        }
    }
    
    logger.info(f"Health check response: {health_data}")
    return jsonify(health_data)

@app.route('/api/test-connections', methods=['POST'])
def test_api_connections():
    """Test API connections with detailed diagnostics"""
    logger.info("=== API CONNECTION TEST REQUESTED ===")
    
    test_results = {
        'timestamp': datetime.now().isoformat(),
        'tests': {}
    }
    
    # Test Replicate API
    logger.info("Testing Replicate API...")
    try:
        if not replicate_client:
            test_results['tests']['replicate'] = {
                'status': '❌ Failed',
                'error': 'Client not initialized - check API token',
                'details': 'REPLICATE_API_TOKEN not configured or invalid'
            }
        else:
            models = list(replicate_client.models.list())
            test_results['tests']['replicate'] = {
                'status': '✅ Success',
                'details': f'Connected successfully, {len(models)} models available',
                'sample_models': [m.name for m in models[:3]] if models else []
            }
            logger.info(f"Replicate test successful: {len(models)} models found")
    except Exception as e:
        error_msg = str(e)
        test_results['tests']['replicate'] = {
            'status': '❌ Failed',
            'error': error_msg,
            'details': 'Connection failed - check token validity'
        }
        logger.error(f"Replicate test failed: {error_msg}")
    
    # Test OpenAI API
    logger.info("Testing OpenAI API...")
    try:
        if not openai_client:
            test_results['tests']['openai'] = {
                'status': '❌ Failed',
                'error': 'Client not initialized - check API key',
                'details': 'OPENAI_API_KEY not configured or invalid'
            }
        else:
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Test connection - respond with 'OK'"}],
                max_tokens=5
            )
            test_results['tests']['openai'] = {
                'status': '✅ Success',
                'details': 'Connected successfully',
                'test_response': response.choices[0].message.content
            }
            logger.info(f"OpenAI test successful: {response.choices[0].message.content}")
    except Exception as e:
        error_msg = str(e)
        test_results['tests']['openai'] = {
            'status': '❌ Failed',
            'error': error_msg,
            'details': 'Connection failed - check API key validity'
        }
        logger.error(f"OpenAI test failed: {error_msg}")
    
    # Test Services
    test_results['tests']['services'] = {
        'ai_service': '✅ Success' if ai_service else '❌ Failed',
        'image_processor': '✅ Success' if image_processor else '❌ Failed',
        'blueprint_service': '✅ Success' if blueprint_service else '❌ Failed'
    }
    
    logger.info(f"=== API TEST RESULTS: {test_results} ===")
    return jsonify(test_results)

@app.route('/api/jobs', methods=['GET'])
def list_jobs():
    """List all processing jobs (for debugging/admin)"""
    return jsonify({
        'jobs': [
            {
                'job_id': job_id,
                'status': job_data['status'],
                'mode': job_data.get('mode', 'unknown'),
                'style': job_data.get('style', 'unknown'),
                'ai_intensity': job_data.get('ai_intensity', 0),
                'num_renders': job_data.get('num_renders', 1),
                'high_quality': job_data.get('high_quality', False),
                'model_used': job_data.get('model_used', 'unknown')
            }
            for job_id, job_data in job_storage.items()
        ]
    })

def sanitize_for_json(text):
    """Sanitize text to ensure it's safe for JSON encoding"""
    if not isinstance(text, str):
        return text
        
    # Replace common non-ASCII characters with ASCII equivalents
    replacements = {
        'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
        'Ą': 'A', 'Č': 'C', 'Ę': 'E', 'Ė': 'E', 'Į': 'I', 'Š': 'S', 'Ų': 'U', 'Ū': 'U', 'Ž': 'Z',
        'ñ': 'n', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u',
        'Ñ': 'N', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U'
    }
    
    for non_ascii, ascii_char in replacements.items():
        text = text.replace(non_ascii, ascii_char)
    
    # Filter out any remaining non-ASCII characters
    return ''.join(char for char in text if ord(char) < 128)

@app.route('/api/results/<job_id>', methods=['GET'])
def get_results(job_id):
    """Get results for a specific job"""
    logger.info(f"Results requested for job: {job_id}")
    
    job_storage = current_app.config['JOB_STORAGE']
    replicate_client = current_app.config['REPLICATE_CLIENT']
    
    if job_id not in job_storage:
        return jsonify({'error': 'Job not found'}), 404
    
    job = job_storage[job_id]
    
    # Check if this is a job with a prediction ID that needs checking
    if job.get('prediction_id') and job.get('status') == 'processing' and replicate_client:
        try:
            # Check the Replicate prediction status
            prediction = replicate_client.predictions.get(job['prediction_id'])
            logger.info(f"Job {job_id} prediction status: {prediction.status}")
            
            if prediction.status == 'succeeded':
                # Update job with results
                result_url = prediction.output[0] if isinstance(prediction.output, list) else prediction.output
                job_storage[job_id].update({
                    'status': 'completed',
                    'result_url': result_url,
                    'all_renders': [result_url] if result_url else [],
                    'timestamp': datetime.now().isoformat()
                })
                logger.info(f"Job {job_id} completed successfully")
                
            elif prediction.status == 'failed':
                # Update job with failure
                error_msg = getattr(prediction, 'error', 'Generation failed')
                job_storage[job_id].update({
                    'status': 'failed',
                    'error': str(error_msg),
                    'timestamp': datetime.now().isoformat()
                })
                logger.error(f"Job {job_id} failed: {error_msg}")
                
            elif prediction.status == 'canceled':
                job_storage[job_id].update({
                    'status': 'failed',
                    'error': 'Generation was canceled',
                    'timestamp': datetime.now().isoformat()
                })
                logger.warning(f"Job {job_id} was canceled")
                
            # If still processing, keep status as is
            
        except Exception as e:
            logger.error(f"Error checking prediction {job.get('prediction_id')}: {str(e)}")
            # Don't fail the request, just log the error
    
    # Return job status and any available results
    result = {
        'status': job.get('status', 'unknown'),
        'job_id': job_id,
        'mode': sanitize_for_json(job.get('mode')),
        'style': sanitize_for_json(job.get('style')),
        'timestamp': job.get('timestamp', datetime.now().isoformat()),
        'model': {
            'id': sanitize_for_json(job.get('model_selection', 'adirik')),
            'name': sanitize_for_json(job.get('model_name', 'Adirik Interior Design')),
            'cost_per_generation': sanitize_for_json(job.get('model_cost', '$0.05'))
        },
        'model_version': sanitize_for_json(job.get('model_version')),
        'prompt_info': {
            'prompt': sanitize_for_json(job.get('prompt')),
            'negative_prompt': sanitize_for_json(job.get('negative_prompt'))
        },
        # Include direct top-level fields for backward compatibility
        'prompt': sanitize_for_json(job.get('prompt')),
        'negative_prompt': sanitize_for_json(job.get('negative_prompt'))
    }
    
    # Add result URL if available
    if job.get('result_url'):
        result['result_url'] = job['result_url']
    
    # Add error if present
    if job.get('error'):
        result['error'] = sanitize_for_json(job.get('error'))
    
    # Include prompt information for debug purposes
    if 'debug' in request.args and request.args['debug'] == 'true':
        result['debug'] = {
            'prompt': sanitize_for_json(job.get('prompt')),
            'negative_prompt': sanitize_for_json(job.get('negative_prompt')),
            'ai_intensity': job.get('ai_intensity'),
            'high_quality': job.get('high_quality'),
            'prediction_id': job.get('prediction_id')
        }
    
    logger.info(f"Returning results for job {job_id}: status={result['status']}")
    
    return jsonify(result)

@app.route('/api/debug-job/<job_id>', methods=['GET'])
def debug_job(job_id):
    """Debug endpoint to inspect the full contents of a job"""
    try:
        if job_id not in job_storage:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_storage[job_id]
        
        # Log the full job data structure
        logger.info(f"DEBUG - Job {job_id} full data structure: {job_data}")
        
        # Detailed logging of all_renders
        all_renders = job_data.get('all_renders')
        logger.info(f"DEBUG - all_renders type: {type(all_renders)}")
        logger.info(f"DEBUG - all_renders is array: {isinstance(all_renders, list)}")
        if isinstance(all_renders, list):
            logger.info(f"DEBUG - all_renders length: {len(all_renders)}")
            logger.info(f"DEBUG - all_renders first item type: {type(all_renders[0]) if all_renders else None}")
        elif isinstance(all_renders, dict):
            logger.info(f"DEBUG - all_renders keys: {list(all_renders.keys())}")
        elif all_renders is not None:
            logger.info(f"DEBUG - all_renders stringified: {str(all_renders)}")
        
        # Return the raw job data
        return jsonify({
            'job_id': job_id,
            'full_data': job_data,
            'has_all_renders': 'all_renders' in job_data,
            'all_renders_type': str(type(job_data.get('all_renders', None))),
            'all_renders_is_list': isinstance(job_data.get('all_renders'), list),
            'all_renders_length': len(job_data.get('all_renders', [])) if isinstance(job_data.get('all_renders'), list) else 0,
            'all_renders_raw': job_data.get('all_renders')
        })
    except Exception as e:
        logger.error(f"Error in debug endpoint: {str(e)}")
        return jsonify({'error': f'Error debugging job: {str(e)}'}), 500

@app.route('/api/check-job/<job_id>', methods=['POST'])
def manual_check_job(job_id):
    """Manually check and update a job's status - useful for stuck jobs"""
    try:
        if job_id not in job_storage:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_storage[job_id]
        logger.info(f"Manual check requested for job {job_id}")
        
        # If it's any job with a prediction ID
        if job_data.get('prediction_id'):
            try:
                prediction = replicate_client.predictions.get(job_data['prediction_id'])
                logger.info(f"Job {job_id} prediction status: {prediction.status}")
                
                if prediction.status == 'succeeded':
                    result_url = prediction.output[0] if isinstance(prediction.output, list) else prediction.output
                    job_storage[job_id].update({
                        'status': 'completed',
                        'result_url': result_url,
                        'all_renders': [result_url] if result_url else []
                    })
                    return jsonify({
                        'success': True,
                        'message': 'Job completed successfully',
                        'status': 'completed',
                        'result_url': result_url
                    })
                    
                elif prediction.status == 'failed':
                    error_msg = getattr(prediction, 'error', 'Refinement failed')
                    job_storage[job_id].update({
                        'status': 'failed',
                        'error': str(error_msg)
                    })
                    return jsonify({
                        'success': True,
                        'message': 'Job marked as failed',
                        'status': 'failed',
                        'error': str(error_msg)
                    })
                    
                else:
                    return jsonify({
                        'success': True,
                        'message': f'Job is still {prediction.status}',
                        'status': prediction.status,
                        'prediction_id': prediction.id
                    })
                    
            except Exception as e:
                logger.error(f"Error checking prediction: {str(e)}")
                return jsonify({'error': f'Error checking prediction: {str(e)}'}), 500
        
        # For regular jobs or jobs without prediction IDs
        return jsonify({
            'success': True,
            'message': 'Job status unchanged',
            'status': job_data.get('status'),
            'type': job_data.get('type', 'unknown')
        })
        
    except Exception as e:
        logger.error(f"Error in manual job check: {str(e)}")
        return jsonify({'error': f'Error checking job: {str(e)}'}), 500

# Print comprehensive startup status
logger.info("=== RENOVAAI STARTUP STATUS ===")
logger.info(f"🔗 Replicate API: {replicate_status}")
logger.info(f"🤖 OpenAI API: {openai_status}")  
logger.info(f"🎨 AI Service: {'✅ Initialized' if ai_service else '❌ Failed'}")
logger.info(f"🖼️ Image Processor: {'✅ Initialized' if image_processor else '❌ Failed'}")
logger.info(f"📐 Blueprint Service: {'✅ Initialized' if blueprint_service else '❌ Failed'}")
logger.info(f"📁 Upload Folder: {app.config['UPLOAD_FOLDER']}")
logger.info(f"🌐 CORS Origin: {os.getenv('FRONTEND_URL', 'https://renova.andrius.cloud')}")
logger.info("=== STARTUP COMPLETE ===")

if __name__ == '__main__':
    print("Starting RenovaAI backend...")
    print("Replicate client: ✓" if replicate_client else "Replicate client: ✗")
    print("OpenAI client: ✓" if openai_client else "OpenAI client: ✗")
    app.run(debug=True, host='0.0.0.0', port=5000)