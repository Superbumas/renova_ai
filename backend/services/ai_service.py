import logging
from typing import Dict, List, Optional, Tuple
import requests
from bs4 import BeautifulSoup
from prompt_engine import PromptEngine
from utils.helpers import extract_pinterest_image_url

logger = logging.getLogger(__name__)

class AIService:
    """Service for handling AI-related operations including prompting and OpenAI integration"""
    
    def __init__(self, openai_client=None):
        self.openai_client = openai_client
        self.prompt_engine = PromptEngine()
        logger.info("AIService initialized")
    
    def _translate_style_to_english(self, style: str) -> str:
        """Translate common style names to English for better prompt compatibility"""
        
        # Dictionary of translations for common non-English style names
        translations = {
            # Lithuanian
            'Šiuolaikinis': 'Contemporary',
            'Modernus': 'Modern',
            'Tradicinis': 'Traditional',
            'Skandinaviškas': 'Scandinavian',
            'Pramoninis': 'Industrial',
            'Kaimo': 'Farmhouse',
            'Prabangus': 'Luxury',
            
            # Other languages can be added as needed
            'Moderno': 'Modern',
            'Contemporáneo': 'Contemporary',
            'Tradicional': 'Traditional',
            'Escandinavo': 'Scandinavian',
            'Industrial': 'Industrial',
            'Rústico': 'Farmhouse',
            'Lujo': 'Luxury'
        }
        
        # Return the English translation if available, otherwise return the original
        return translations.get(style, style)
    
    def _sanitize_prompt(self, prompt: str) -> str:
        """Sanitize prompt to ensure it contains only ASCII characters"""
        # Replace common non-ASCII characters with ASCII equivalents
        replacements = {
            'ą': 'a', 'č': 'c', 'ę': 'e', 'ė': 'e', 'į': 'i', 'š': 's', 'ų': 'u', 'ū': 'u', 'ž': 'z',
            'Ą': 'A', 'Č': 'C', 'Ę': 'E', 'Ė': 'E', 'Į': 'I', 'Š': 'S', 'Ų': 'U', 'Ū': 'U', 'Ž': 'Z',
            'ñ': 'n', 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ü': 'u',
            'Ñ': 'N', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U'
        }
        
        for non_ascii, ascii_char in replacements.items():
            prompt = prompt.replace(non_ascii, ascii_char)
        
        # As a final safety measure, filter out any remaining non-ASCII characters
        return ''.join(char for char in prompt if ord(char) < 128)
    
    def generate_comprehensive_prompt(self, mode: str, style: str, room_type: str = 'kitchen', 
                                    ai_intensity: float = 0.5, measurements: List = None,
                                    inspiration_description: str = None, room_analysis: Dict = None,
                                    spatial_constraints: Dict = None) -> Tuple[str, str]:
        """
        Generate comprehensive positive and negative prompts with spatial awareness
        
        Args:
            mode: 'redesign' or 'design'
            style: Selected style
            room_type: Type of room
            ai_intensity: 0-1 intensity level
            measurements: Room measurements
            inspiration_description: AI analysis of inspiration image
            room_analysis: Room structure analysis
            spatial_constraints: Spatial layout constraints from layout engine
        
        Returns:
            Tuple of (positive_prompt, negative_prompt)
        """
        
        # Translate style name to English for better compatibility with AI models
        english_style = self._translate_style_to_english(style)
        
        # Log if translation occurred
        if english_style != style:
            logger.info(f"Translated style name from '{style}' to '{english_style}' for better compatibility")
            style = english_style
        
        # Sanitize room_type to ensure it's ASCII
        room_type = self._sanitize_prompt(room_type)
        
        # Use prompt engine to generate comprehensive base prompt
        if mode == 'redesign':
            # For redesign, we add spatial preservation as well
            base_engine = self.prompt_engine
            
            # Generate the main prompt
            positive_prompt = base_engine._generate_redesign_prompt(
                style=style,
                room_type=room_type,
                ai_intensity=ai_intensity,
                measurements=measurements,
                inspiration_description=inspiration_description,
                room_analysis=room_analysis
            )
            
            # Generate structural preservation prompts
            if ai_intensity < 0.3:
                # Low intensity: very strict structural preservation
                structure_preservation = base_engine._generate_structural_preservation(
                    intensity_level="strict",
                    measurements=measurements
                )
                positive_prompt = f"{positive_prompt} {structure_preservation}"
            elif ai_intensity < 0.7:
                # Medium intensity: balanced preservation
                structure_preservation = base_engine._generate_structural_preservation(
                    intensity_level="balanced",
                    measurements=measurements
                )
                positive_prompt = f"{positive_prompt} {structure_preservation}"
            # For high intensity, we omit structure preservation to allow more creative freedom
            
        else:  # Design mode
            # Design mode: create from scratch with style guidance but no structural preservation
            positive_prompt = self.prompt_engine._generate_design_prompt(
                style=style,
                room_type=room_type,
                measurements=measurements,
                inspiration_description=inspiration_description,
                room_analysis=room_analysis
            )
        
        # Extract style-specific keywords that enhance quality
        style_keywords = self._get_style_keywords(style)
        
        # Add style-specific keywords for better quality
        positive_prompt = f"{positive_prompt} with {', '.join(style_keywords[:5])}"
        
        # Add inspiration elements if available
        if inspiration_description:
            # Keep inspiration description concise but extract key style elements
            words = inspiration_description.split()
            
            # Extract style keywords that enhance quality
            quality_keywords = [word for word in words if word.lower() in [
                "luxury", "elegant", "sophisticated", "premium", "high-end", "designer",
                "modern", "contemporary", "minimalist", "classic", "traditional",
                "rustic", "industrial", "scandinavian", "bohemian", "coastal",
                "marble", "wood", "brass", "gold", "steel", "glass", "leather",
                "chandelier", "pendant", "recessed", "hidden", "integrated"
            ]]
            
            # Prioritize quality keywords in the inspiration
            if quality_keywords:
                quality_terms = " ".join(quality_keywords)
                inspiration_elements = f"{quality_terms} with " + ' '.join(words[:30])
            else:
                inspiration_elements = ' '.join(words[:50])
                
            positive_prompt = f"{positive_prompt} with {inspiration_elements}"
        
        # Build negative prompt using Replicate playground example with quality enhancements
        negative_prompt = "lowres, watermark, banner, logo, watermark, contactinfo, text, deformed, "
        negative_prompt += "blurry, blur, out of focus, out of frame, surreal, extra, ugly, "
        negative_prompt += "upholstered walls, fabric walls, plush walls, mirror, mirrored, functional, "
        negative_prompt += "grainy, pixelated, unrealistic lighting, poor composition, low contrast, muddy colors, "
        negative_prompt += "amateur, unprofessional, crooked angles, flat lighting, dull materials, cartoon style, "
        negative_prompt += "dark, underexposed, dim, unrealistic architecture, impossible layout, warped, "
        negative_prompt += "unrealistic proportions, floating elements, incoherent design, distorted perspective"
        
        # If in redesign mode with medium-high preservation, add strong negative prompts to preserve structure
        if mode == 'redesign' and ai_intensity < 0.7:
            negative_prompt += ", changed wall layout, moved windows, moved doors, structurally impossible, "
            negative_prompt += "different floor plan, changed ceiling height, moved plumbing fixtures, "
            negative_prompt += "architecturally unrealistic, non-structural changes, structural changes"
        
        # Log the prompts for debugging
        logger.info(f"Generated {mode} prompt: {positive_prompt[:100]}...")
        logger.info(f"Generated negative prompt: {negative_prompt[:80]}...")
        
        return positive_prompt, negative_prompt
        
    def _get_style_keywords(self, style: str) -> List[str]:
        """Get style-specific keywords for enhancing prompt quality"""
        style_keywords = {
            'Modern': [
                "sleek surfaces", "minimal ornamentation", "clean lines", 
                "geometric forms", "neutral palette", "uncluttered spaces",
                "integrated appliances", "flat-panel cabinets", "frameless glass"
            ],
            'Traditional': [
                "ornate details", "classic proportions", "rich wood tones",
                "decorative moldings", "raised panel cabinetry", "warm colors",
                "traditional craftsmanship", "heritage design", "timeless appeal"
            ],
            'Luxury': [
                "premium materials", "custom details", "handcrafted elements",
                "imported marble", "exotic woods", "gold accents",
                "designer fixtures", "statement lighting", "opulent finishes"
            ],
            'Scandinavian': [
                "light wood tones", "white surfaces", "natural materials",
                "functional simplicity", "cozy minimalism", "hygge atmosphere",
                "organic textures", "neutral palette", "natural light maximization"
            ],
            'Industrial': [
                "exposed brick", "raw concrete", "metal fixtures",
                "weathered surfaces", "utilitarian aesthetic", "factory-inspired",
                "open ductwork", "structural elements", "salvaged materials"
            ],
            'Farmhouse': [
                "rustic charm", "shaker cabinets", "apron sink",
                "reclaimed wood", "vintage fixtures", "antique elements",
                "country aesthetic", "warm neutrals", "handcrafted details"
            ],
            'Contemporary': [
                "bold contrasts", "mixed materials", "innovative fixtures",
                "statement pieces", "current trends", "distinctive lighting",
                "unexpected combinations", "dynamic elements", "sculptural forms"
            ]
        }
        
        return style_keywords.get(style, style_keywords['Modern'])
    
    def get_model_parameters(self, ai_intensity: float, high_quality: bool, mode: str) -> Dict:
        """Get optimized model parameters based on settings and style-specifics"""
        base_params = self.prompt_engine.get_model_parameters(ai_intensity, high_quality, mode)
        
        # Enhanced quality parameters
        if high_quality:
            # These higher-quality settings override the prompt engine defaults
            base_params.update({
                "num_inference_steps": 80,
                "width": 1024,
                "height": 1024,
                "guidance_scale": 18,
                "scheduler": "DDIM"
            })
        
        return base_params
    
    def analyze_inspiration_image(self, inspiration_url: str) -> Optional[str]:
        """Analyze inspiration image using OpenAI Vision API for comprehensive style analysis"""
        if not self.openai_client:
            logger.warning("OpenAI client not available for inspiration analysis")
            return None
        
        try:
            # Check if it's a Pinterest URL and extract direct image URL
            direct_image_url = inspiration_url
            if 'pinterest.com' in inspiration_url:
                logger.info(f"Extracting direct image URL from Pinterest: {inspiration_url}")
                extracted_url = extract_pinterest_image_url(inspiration_url)
                if extracted_url:
                    direct_image_url = extracted_url
                    logger.info(f"Successfully extracted direct URL: {direct_image_url}")
                else:
                    logger.warning("Failed to extract Pinterest image URL, attempting with original URL")
            
            # If it's still not a direct image URL, try to download and convert to base64
            if 'pinterest.com' in direct_image_url or not any(ext in direct_image_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp', '.gif']):
                logger.info("URL doesn't appear to be a direct image, attempting to download and convert to base64")
                
                # Download the image
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                response = requests.get(direct_image_url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    import base64
                    # Convert to base64
                    image_base64 = base64.b64encode(response.content).decode('utf-8')
                    # Determine content type
                    content_type = response.headers.get('content-type', 'image/jpeg')
                    direct_image_url = f"data:{content_type};base64,{image_base64}"
                    logger.info("Successfully converted image to base64")
                else:
                    logger.error(f"Failed to download image: {response.status_code}")
                    return None
            
            # Enhanced prompt for more comprehensive style analysis
            analysis_prompt = """
            Analyze this interior design image in detail and provide a comprehensive analysis focusing on:
            
            1. Design Style: Identify the main interior design style and any sub-styles or influences
            2. Color Palette: List all prominent colors (be specific with color names)
            3. Materials: Identify key materials used in furniture, surfaces, and decorative elements
            4. Key Design Elements: Describe distinctive furniture pieces, architectural features, and decorative items
            5. Textures and Patterns: Note any significant textural elements or patterns
            6. Lighting: Describe the lighting approach and fixtures
            7. Spatial Arrangement: Note how space is utilized and furniture is arranged
            
            Focus on elements that would be valuable for kitchen redesign. Be specific and descriptive with colors, materials, and finishes.
            Provide a thorough analysis that can guide an AI image generation system.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": analysis_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": direct_image_url,
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            analysis = response.choices[0].message.content.strip()
            logger.info(f"Inspiration analysis completed: {analysis[:100]}...")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing inspiration image: {str(e)}")
            # Try to provide more specific error information
            if hasattr(e, 'response') and hasattr(e.response, 'json'):
                try:
                    error_details = e.response.json()
                    logger.error(f"API Error details: {error_details}")
                except:
                    pass
            return None
    
    def enhance_prompt(self, user_prompt: str) -> Dict[str, str]:
        """Enhance user prompt using OpenAI"""
        if not self.openai_client:
            return {
                'original_prompt': user_prompt,
                'enhanced_prompt': user_prompt,
                'error': 'OpenAI client not available'
            }
        
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interior designer. Enhance the user's design request with specific, detailed descriptions that will produce better AI-generated interior designs. Focus on colors, materials, lighting, furniture styles, and spatial arrangements. Keep responses concise but descriptive."
                    },
                    {
                        "role": "user",
                        "content": f"Enhance this interior design prompt: {user_prompt}"
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            enhanced_prompt = response.choices[0].message.content.strip()
            
            return {
                'original_prompt': user_prompt,
                'enhanced_prompt': enhanced_prompt
            }
            
        except Exception as e:
            logger.error(f"Error enhancing prompt: {str(e)}")
            return {
                'original_prompt': user_prompt,
                'enhanced_prompt': user_prompt,
                'error': str(e)
            }
    
    def analyze_furniture(self, image_url: str, room_type: str, measurements: List) -> Dict:
        """Analyze furniture in generated design image"""
        if not self.openai_client:
            return {'error': 'OpenAI API not configured. Furniture analysis requires OpenAI Vision API.'}
        
        try:
            # Create measurement context
            measurement_context = self._create_measurement_context(measurements)
            
            # Define furniture categories by room type
            furniture_categories = {
                'kitchen': [
                    'kitchen island', 'bar stools', 'cabinets', 'countertops', 'refrigerator', 
                    'stove/cooktop', 'dishwasher', 'microwave', 'sink', 'pendant lights', 
                    'dining table', 'dining chairs', 'backsplash', 'range hood'
                ],
                'living-room': [
                    'sofa', 'armchairs', 'coffee table', 'side tables', 'TV stand', 
                    'entertainment center', 'floor lamps', 'table lamps', 'area rug', 
                    'bookshelf', 'plants', 'artwork', 'throw pillows'
                ],
                'bedroom': [
                    'bed', 'headboard', 'nightstands', 'table lamps', 'dresser', 
                    'wardrobe', 'mirror', 'chair', 'bench', 'area rug', 'curtains', 
                    'artwork', 'plants'
                ]
            }
            
            expected_furniture = furniture_categories.get(room_type, furniture_categories['kitchen'])
            
            # Create analysis prompt
            analysis_prompt = f"""
            Analyze this {room_type.replace('-', ' ')} interior design image and identify furniture pieces and their approximate locations.
            
            Expected furniture types: {', '.join(expected_furniture)}
            
            Room measurements context: {measurement_context if measurements else 'No measurements provided'}
            
            Please provide a detailed analysis in this JSON format:
            {{
                "furniture_items": [
                    {{
                        "name": "furniture name",
                        "category": "category (e.g., seating, storage, lighting, appliance)",
                        "location": "descriptive location",
                        "approximate_position": {{"x": percentage_from_left, "y": percentage_from_top}},
                        "estimated_size": "small/medium/large",
                        "style_notes": "brief description",
                        "practical_notes": "functionality notes"
                    }}
                ],
                "room_layout": {{
                    "primary_zones": ["zone descriptions"],
                    "traffic_flow": "description of movement patterns",
                    "focal_points": ["main visual focal points"],
                    "lighting_scheme": "description of lighting setup"
                }},
                "shopping_list": [
                    {{
                        "item": "furniture piece name",
                        "category": "category",
                        "estimated_price_range": "price range",
                        "priority": "high/medium/low",
                        "notes": "specific requirements"
                    }}
                ]
            }}
            
            Be thorough but practical. Focus on implementable furniture pieces.
            """
            
            # Call OpenAI Vision API
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": analysis_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            # Parse the response
            analysis_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            import json
            import re
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                try:
                    furniture_analysis = json.loads(json_match.group())
                    
                    # Add measurement context to the analysis
                    if measurements:
                        furniture_analysis["measurements_used"] = measurements
                    
                    return {
                        'success': True,
                        'analysis': furniture_analysis,
                        'raw_response': analysis_text
                    }
                except json.JSONDecodeError as e:
                    logger.error(f"JSON Parse Error: {e}")
                    return {'error': f'Failed to parse furniture analysis: {str(e)}'}
            else:
                logger.error("No JSON found in response!")
                return {'error': 'No valid furniture analysis found in AI response'}
            
        except Exception as e:
            logger.error(f"Error analyzing furniture: {str(e)}")
            return {'error': f'Error analyzing furniture: {str(e)}'}
    
    def _create_measurement_context(self, measurements: List) -> str:
        """Create measurement context from user measurements"""
        if not measurements or len(measurements) == 0:
            return ""
        
        measurement_text = []
        for measurement in measurements:
            if measurement.get('type') == 'wall':
                dimension = measurement.get('dimension', {})
                value = dimension.get('value', 0)
                unit = dimension.get('unit', 'ft')
                measurement_text.append(f"Wall: {value}{unit}")
        
        return "; ".join(measurement_text) if measurement_text else ""
    
    def _generate_fallback_prompt(self, style: str, room_type: str) -> str:
        """Generate a fallback prompt if the main prompt generation fails"""
        return f"photorealistic {style.lower()} {room_type.replace('-', ' ')} interior design, professional photography, realistic lighting, high quality"
    
    def _generate_fallback_negative_prompt(self) -> str:
        """Generate a fallback negative prompt"""
        return "blurry, low quality, distorted, cartoon, anime, sketched, low resolution, bad lighting"

    def _get_style_specific_prompt(self, style: str, room_type: str) -> str:
        """Get style-specific prompt based on room type"""
        style_prompts = {
            'Modern': f"modern {room_type} with clean lines, minimalist design, neutral colors, sleek surfaces",
            'Traditional': f"traditional {room_type} with classic furniture, warm wood tones, elegant details",
            'Scandinavian': f"scandinavian {room_type} with light woods, white walls, cozy textures, functional design",
            'Industrial': f"industrial {room_type} with exposed brick, metal fixtures, concrete surfaces, vintage elements",
            'Bohemian': f"bohemian {room_type} with colorful textiles, eclectic furniture, plants, artistic elements",
            'Minimalist': f"minimalist {room_type} with essential furniture only, neutral palette, clean space",
            'Rustic': f"rustic {room_type} with natural materials, weathered wood, cozy atmosphere",
            'Contemporary': f"contemporary {room_type} with current trends, sophisticated finishes, balanced design"
        }
        return style_prompts.get(style, f"{style.lower()} {room_type} interior design")

    def _get_basic_prompt(self, style: str, room_type: str) -> str:
        """Get basic prompt based on style and room type"""
        return f"professional {style.lower()} {room_type} interior design, realistic lighting, high quality photography"

    def _get_basic_negative_prompt(self) -> str:
        """Get basic negative prompt"""
        return "blurry, low quality, distorted proportions, unrealistic scale, floating objects, cartoon, sketch, drawing" 

    def enhance_quality_for_style(self, prompt: str, style: str) -> str:
        """Add style-specific quality enhancements to the prompt"""
        
        # Style-specific quality terms with ultrarealistic keywords
        style_quality = {
            'Modern': "clean lines, minimalist elegance, seamless integration, smart features, architectural lighting, 8K quality, ultrarealistic, ray tracing",
            'Traditional': "rich textures, detailed craftsmanship, elegant moldings, timeless appeal, refined finishes, 8K resolution, photorealistic, extreme detail",
            'Luxury': "opulent finishes, rare materials, designer details, curated accents, bespoke elements, ultrarealistic, cinematic quality, 8K perfection",
            'Scandinavian': "organic materials, natural light, calm palette, functional beauty, textural harmony, photorealistic, 8K resolution, perfect lighting",
            'Industrial': "authentic materials, architectural elements, raw textures, statement fixtures, urban edge, ultrarealistic, 8K detail, high definition",
            'Farmhouse': "rustic charm, vintage details, weathered textures, warm tones, pastoral influences, photorealistic, 8K quality, ultra detailed",
            'Contemporary': "bold statement pieces, mixed materials, artistic elements, curated design, sleek innovation, ultrarealistic, 8K resolution, photographic"
        }
        
        # If style is recognized, add quality terms
        if style in style_quality:
            quality_terms = style_quality[style]
            if "with" in prompt:
                # Insert before the "with" clause
                parts = prompt.split(" with ", 1)
                return f"{parts[0]}, {quality_terms} with {parts[1]}"
            else:
                # Add to the end
                return f"{prompt}, {quality_terms}"
        
        return prompt 

    def analyze_room_image(self, image_data: str) -> Optional[Dict]:
        """Analyze room image using OpenAI Vision API to extract colors, materials, and style elements"""
        if not self.openai_client:
            logger.warning("OpenAI client not available for room image analysis")
            return None
        
        try:
            # If image_data is a base64 string, use it directly
            if image_data.startswith('data:image'):
                direct_image_url = image_data
            else:
                # Convert to base64 if it's not already
                try:
                    import base64
                    # Ensure we have the correct format by decoding and re-encoding
                    if ',' in image_data:
                        # It's already a data URL, extract the base64 part
                        image_bytes = base64.b64decode(image_data.split(',')[1])
                    else:
                        # It's just base64 content
                        image_bytes = base64.b64decode(image_data)
                    
                    # Re-encode to ensure proper format
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    direct_image_url = f"data:image/jpeg;base64,{image_base64}"
                except Exception as e:
                    logger.error(f"Error processing image data: {str(e)}")
                    return None
            
            # Enhanced prompt for room analysis
            analysis_prompt = """
            Analyze this room image in detail and extract the following information:
            
            1. Colors: Identify all prominent colors in the room (walls, floors, cabinets, countertops, appliances)
            2. Materials: Identify all visible materials (wood types, stone, metal, glass, etc.)
            3. Style Elements: List key style elements and design features present
            4. Key Features: Identify important architectural and functional elements
            5. Layout Type: Describe the room layout (e.g., galley kitchen, L-shaped, open concept)
            6. Lighting Conditions: Describe the lighting (natural light, fixtures)
            7. Room Type: Confirm what type of room this is (kitchen, bathroom, living room, etc.)
            
            Format your response as a JSON object with these exact keys:
            {
                "colors": ["color1", "color2", ...],
                "materials": ["material1", "material2", ...],
                "style_elements": ["element1", "element2", ...],
                "key_features": ["feature1", "feature2", ...],
                "layout_type": "description",
                "lighting_conditions": "description",
                "room_type": "type"
            }
            
            Be specific and detailed with color names and material descriptions. Focus on elements that would be important for redesign.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": analysis_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": direct_image_url,
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            analysis_text = response.choices[0].message.content.strip()
            logger.info(f"Room analysis completed: {analysis_text[:100]}...")
            
            # Parse JSON response
            import json
            try:
                analysis_data = json.loads(analysis_text)
                return analysis_data
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing room analysis JSON: {str(e)}")
                # Try to extract JSON from the response text
                import re
                json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
                if json_match:
                    try:
                        analysis_data = json.loads(json_match.group(0))
                        return analysis_data
                    except:
                        logger.error("Failed to extract valid JSON from response")
                return None
            
        except Exception as e:
            logger.error(f"Error analyzing room image: {str(e)}")
            return None 