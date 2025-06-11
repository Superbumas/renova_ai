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
        
        try:
            # First try to use the PromptEngine for optimal prompts
            try:
                positive_prompt, negative_prompt = self.prompt_engine.generate_comprehensive_prompt(
                    mode=mode,
                    style=style,
                    room_type=room_type,
                    ai_intensity=ai_intensity,
                    measurements=measurements,
                    inspiration_description=inspiration_description,
                    room_analysis=room_analysis
                )
            
            # Add spatial constraints if available
                if spatial_constraints and positive_prompt:
                    if spatial_constraints.get('prompt_additions'):
                        spatial_additions = ", ".join(spatial_constraints['prompt_additions'])
                        positive_prompt = f"{positive_prompt}, {spatial_additions}"
                    
                    if spatial_constraints.get('negative_prompts') and negative_prompt:
                        spatial_negatives = ", ".join(spatial_constraints['negative_prompts'])
                        negative_prompt = f"{negative_prompt}, {spatial_negatives}"
                
                # If successful, return the generated prompts
                logger.info(f"Using PromptEngine generated prompts with length: {len(positive_prompt)}")
                
                # Apply style-specific quality enhancements
                positive_prompt = self.enhance_quality_for_style(positive_prompt, style)
                logger.info(f"Enhanced prompt with style-specific quality terms for {style}")
                
                # Final sanitization to ensure only ASCII characters
                positive_prompt = self._sanitize_prompt(positive_prompt)
                negative_prompt = self._sanitize_prompt(negative_prompt)
                
                logger.info(f"Generated Replicate-style prompt with length: {len(positive_prompt)}")
                
                return positive_prompt, negative_prompt
                
            except Exception as e:
                logger.warning(f"PromptEngine failed, falling back to direct prompt generation: {str(e)}")
            
            # If PromptEngine fails, use the structure from the Replicate playground example
            # Base from Replicate.com playground example for a prabangus kitchen
            positive_prompt = f"Beautiful {style.lower()} {room_type} interior design, professional interior design, "
            positive_prompt += "realistic lighting and materials, "
            
            # Add spatial constraints if available
            max_width = None
            if measurements:
                # Extract width from measurements
                for m in measurements:
                    if isinstance(m, dict) and m.get('type') in ['wall', 'room_width']:
                        value = m.get('realMeasurement', 0)
                        max_width = value
                        break
                
                if max_width and max_width < 3.2:
                    positive_prompt += f"narrow galley {room_type} {max_width:.1f}m wide, "
                    positive_prompt += "linear countertop arrangement, efficient space utilization, no center island possible, "
                elif max_width:
                    positive_prompt += f"{room_type} {max_width:.1f}m x {max_width-0.5:.1f}m space, "
            
            # Add workflow elements
            positive_prompt += "streamlined workflow, realistic proportions "
            
            if max_width:
                positive_prompt += f"for {max_width:.1f}m x {max_width-0.5:.1f}m space, "
            
            # Enhanced professional quality elements for superior results
            positive_prompt += "accurately scaled for room, perfect proportions and spatial relationships, "
            positive_prompt += "following professional interior design standards, ultra high quality interior design, "
            positive_prompt += "photorealistic rendering, intricate material textures, cinematic lighting with soft shadows, "
            positive_prompt += "professional architectural photography, magazine quality presentation, "
            positive_prompt += "crystal clear details, hyper-realistic materials, award-winning design, "
            positive_prompt += "8K resolution, ultrarealistic, ultra detailed, high definition, high resolution, "
            positive_prompt += "extreme detail, photographic, perfect lighting, professional color grading, "
            positive_prompt += "masterful composition, ray tracing, physically-based rendering, "
            positive_prompt += f"luxury {style.lower()} interior design showcase"
            
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
            negative_prompt += "bad shadows, unrealistic reflections, skewed perspective, disproportionate elements"
            
            # Add spatial negatives for narrow kitchens
            if max_width and max_width < 3.0:
                negative_prompt += ", kitchen island, center island, double island"
            
            # For maximum structure preservation (low AI intensity)
            if mode == 'redesign' and ai_intensity <= 0.3:
                negative_prompt += ", different room layout, moving walls, changing windows, different architecture"
            
            # Apply style-specific quality enhancements
            positive_prompt = self.enhance_quality_for_style(positive_prompt, style)
            logger.info(f"Enhanced prompt with style-specific quality terms for {style}")
            
            # Final sanitization to ensure only ASCII characters
            positive_prompt = self._sanitize_prompt(positive_prompt)
            negative_prompt = self._sanitize_prompt(negative_prompt)
            
            logger.info(f"Generated Replicate-style prompt with length: {len(positive_prompt)}")
            
            return positive_prompt, negative_prompt
            
        except Exception as e:
            logger.error(f"Error generating comprehensive prompt: {str(e)}")
            # Fallback to basic prompt
            return self._get_basic_prompt(style, room_type), self._get_basic_negative_prompt()
    
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
        """Analyze inspiration image using OpenAI Vision API"""
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
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this interior design image and describe the style, colors, materials, and key design elements in 2-3 sentences. Focus on elements that can be replicated in a kitchen design."
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
                max_tokens=150,
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