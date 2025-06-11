import logging
from flask import Blueprint, request, jsonify, current_app

logger = logging.getLogger(__name__)

# Create blueprint
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze-furniture', methods=['POST'])
def analyze_furniture():
    """
    Analyze the generated design image to identify furniture pieces and their locations
    Expected payload: { image_url: string, roomType: string, measurements: array }
    """
    try:
        ai_service = current_app.config['AI_SERVICE']
        
        data = request.get_json()
        image_url = data.get('image_url')
        room_type = data.get('roomType', 'kitchen')
        measurements = data.get('measurements', [])
        
        if not image_url:
            return jsonify({'error': 'Image URL is required'}), 400
        
        # Use AI service to analyze furniture
        result = ai_service.analyze_furniture(image_url, room_type, measurements)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error analyzing furniture: {str(e)}")
        return jsonify({'error': f'Error analyzing furniture: {str(e)}'}), 500

@analysis_bp.route('/generate-blueprint', methods=['POST'])
def generate_blueprint():
    """
    Convert a generated design image into an architectural blueprint/floor plan
    Expected payload: { image_url: string, roomType: string, measurements: array }
    """
    try:
        blueprint_service = current_app.config.get('BLUEPRINT_SERVICE')
        
        if not blueprint_service:
            return jsonify({'error': 'Blueprint service not available'}), 500
        
        data = request.get_json()
        image_url = data.get('image_url')
        room_type = data.get('roomType', 'kitchen')
        measurements = data.get('measurements', [])
        
        if not image_url:
            return jsonify({'error': 'Image URL is required'}), 400
        
        # Generate blueprint using blueprint service
        result = blueprint_service.generate_blueprint(image_url, room_type, measurements)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating blueprint: {str(e)}")
        return jsonify({'error': f'Error generating blueprint: {str(e)}'}), 500

@analysis_bp.route('/generate-furniture-blueprint', methods=['POST'])
def generate_furniture_blueprint():
    """
    Generate detailed furniture blueprints with CAD precision
    Expected payload: { 
        description: string, 
        furniture_type: string, 
        dimensions: { width: string, depth: string, height: string },
        material: string, 
        style: string, 
        compliance_requirements: array 
    }
    """
    try:
        blueprint_service = current_app.config.get('BLUEPRINT_SERVICE')
        
        if not blueprint_service:
            return jsonify({'error': 'Blueprint service not available'}), 500
        
        data = request.get_json()
        logger.info(f"Furniture blueprint request: {data}")
        
        # Validate required fields
        if not data.get('description') and not (data.get('dimensions', {}).get('width') and 
                                               data.get('dimensions', {}).get('depth') and 
                                               data.get('dimensions', {}).get('height')):
            return jsonify({'error': 'Either description or complete dimensions are required'}), 400
        
        # Generate furniture blueprint using blueprint service
        result = blueprint_service.generate_furniture_blueprint(
            description=data.get('description', ''),
            furniture_type=data.get('furniture_type', 'cabinet'),
            dimensions=data.get('dimensions', {}),
            material=data.get('material', 'oak'),
            style=data.get('style', 'modern'),
            compliance_requirements=data.get('compliance_requirements', [])
        )
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 500
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating furniture blueprint: {str(e)}")
        return jsonify({'error': f'Error generating furniture blueprint: {str(e)}'}), 500 