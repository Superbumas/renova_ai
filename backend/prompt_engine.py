"""
Advanced Prompt Engine for Kitchen Redesign AI
Generates comprehensive, structure-preserving prompts that maintain architectural elements
while providing rich stylistic guidance for high-quality interior design generation.
"""

import logging
from typing import Dict, List, Optional, Tuple
import re

logger = logging.getLogger(__name__)

class PromptEngine:
    """Advanced prompt generation engine for kitchen redesigns"""
    
    def __init__(self):
        self.style_definitions = {
            'Modern': {
                'colors': ['crisp white', 'charcoal gray', 'warm beige', 'soft black'],
                'materials': ['quartz countertops', 'stainless steel appliances', 'handleless cabinets', 'glass backsplash'],
                'characteristics': ['clean lines', 'minimal ornamentation', 'sleek hardware', 'integrated appliances'],
                'lighting': ['recessed LED lighting', 'pendant lights over island', 'under-cabinet lighting'],
                'description': 'Sleek and minimalist with an emphasis on clean lines, open spaces, and functional design. Features handleless cabinets, integrated appliances, and neutral tones with occasional bold accents.'
            },
            'Traditional': {
                'colors': ['warm white', 'cream', 'sage green', 'navy blue'],
                'materials': ['granite countertops', 'raised panel cabinets', 'subway tile backsplash', 'hardwood floors'],
                'characteristics': ['ornate details', 'crown molding', 'decorative hardware', 'classic proportions'],
                'lighting': ['chandeliers', 'pendant lights', 'decorative sconces'],
                'description': 'Rich with historical details and timeless elegance. Features ornate moldings, raised panel cabinetry, classic fixtures, and warm wood tones. Emphasizes craftsmanship and traditional design principles.'
            },
            'Luxury': {
                'colors': ['rich gold', 'deep emerald', 'marble white', 'charcoal black', 'royal navy', 'champagne bronze'],
                'materials': ['marble countertops', 'custom millwork', 'brass hardware', 'stone backsplash', 'hardwood floors', 'designer appliances'],
                'characteristics': ['opulent finishes', 'dramatic lighting', 'statement pieces', 'high-end materials', 'custom details', 'bold contrasts'],
                'lighting': ['crystal chandeliers', 'statement pendant lights', 'dramatic accent lighting', 'gold fixtures'],
                'description': 'Opulent and sumptuous with premium materials and exquisite craftsmanship. Features imported marble, custom cabinetry, statement lighting fixtures, and luxurious metallic accents. No expense spared on finishes and appliances.'
            },
            'Scandinavian': {
                'colors': ['pure white', 'light gray', 'pale wood tones', 'soft blue'],
                'materials': ['light wood cabinets', 'white quartz', 'white subway tiles', 'natural wood floors'],
                'characteristics': ['functional simplicity', 'light wood accents', 'minimal hardware', 'cozy textures'],
                'lighting': ['natural light emphasis', 'simple pendant lights', 'warm LED fixtures'],
                'description': 'Bright, airy, and minimalist with an emphasis on natural materials and light. Features blonde wood, white surfaces, simple lines, and uncluttered spaces. Balances functionality with warmth and organic elements.'
            },
            'Industrial': {
                'colors': ['exposed brick red', 'steel gray', 'charcoal black', 'weathered copper', 'raw concrete', 'rust orange'],
                'materials': ['concrete countertops', 'steel cabinets', 'exposed brick backsplash', 'stainless steel appliances', 'metal shelving', 'concrete floors'],
                'characteristics': ['exposed structural elements', 'raw industrial materials', 'metal pipe fixtures', 'urban loft aesthetic', 'weathered finishes', 'bold contrasts'],
                'lighting': ['Edison bulb pendants', 'track lighting', 'industrial metal fixtures', 'exposed conduit lighting'],
                'description': 'Raw, utilitarian aesthetic inspired by factories and warehouses. Features exposed brick, metal fixtures, concrete surfaces, and weathered finishes. Celebrates structural elements and mechanical details with open shelving and pipework.'
            },
            'Farmhouse': {
                'colors': ['warm white', 'cream', 'sage green', 'natural wood'],
                'materials': ['butcher block counters', 'shaker cabinets', 'farmhouse sink', 'reclaimed wood'],
                'characteristics': ['rustic charm', 'vintage elements', 'open shelving', 'country details'],
                'lighting': ['vintage-style fixtures', 'mason jar lights', 'wrought iron pendants'],
                'description': 'Warm and rustic with countryside charm and vintage touches. Features apron sinks, shaker cabinets, reclaimed wood, and antique-inspired hardware. Balances practicality with nostalgic elements and natural materials.'
            },
            'Contemporary': {
                'colors': ['bold accent colors', 'neutral base', 'black and white', 'metallic accents'],
                'materials': ['engineered quartz', 'flat-panel cabinets', 'large format tiles', 'mixed materials'],
                'characteristics': ['current trends', 'bold contrasts', 'innovative materials', 'statement pieces'],
                'lighting': ['statement lighting', 'LED strips', 'modern chandeliers'],
                'description': 'Current, on-trend design featuring bold contrasts and mixed materials. Less rigid than modern style, incorporating innovative fixtures, distinctive lighting, and unexpected combinations of textures and finishes.'
            }
        }
        
        # Add translations for common non-English style names
        self.style_translations = {
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
        
        self.structural_preservation_phrases = [
            "PRESERVE EXACT window locations and sizes",
            "MAINTAIN all door openings and positions", 
            "KEEP original wall corners and room boundaries",
            "RETAIN existing architectural elements",
            "PRESERVE room layout and structural walls",
            "MAINTAIN window frames and door frames",
            "KEEP ceiling height and proportions",
            "PRESERVE any built-in architectural features",
            "MAINTAIN window above sink position EXACTLY",
            "PRESERVE door frame locations and openings",
            "KEEP wall-to-wall cabinet alignment",
            "RETAIN exact window trim and molding",
            "MAINTAIN structural corner positions",
            "PRESERVE architectural wall features",
            "KEEP original room proportions and boundaries",
            "MAINTAIN existing electrical outlet positions"
        ]
        
        self.quality_enhancers = [
            "professional interior photography",
            "realistic natural lighting", 
            "accurate material textures",
            "proper perspective and scale",
            "high-end interior design quality",
            "magazine-worthy composition",
            "photorealistic rendering",
            "sharp architectural details",
            "8K resolution",
            "ultrarealistic",
            "ultra detailed",
            "high definition",
            "cinematic lighting",
            "ray tracing",
            "physically-based rendering",
            "perfect lighting",
            "professional color grading",
            "extreme detail",
            "photographic quality"
        ]
    
    def _translate_style_to_english(self, style: str) -> str:
        """Translate style name to English for better AI compatibility"""
        return self.style_translations.get(style, style)
    
    def generate_comprehensive_prompt(
        self, 
        mode: str,
        style: str, 
        room_type: str = 'kitchen',
        ai_intensity: float = 0.5,
        measurements: Optional[List] = None,
        inspiration_description: Optional[str] = None,
        room_analysis: Optional[Dict] = None
    ) -> Tuple[str, str]:
        """
        Generate comprehensive positive and negative prompts
        Returns: (positive_prompt, negative_prompt)
        """
        
        # Translate style to English if needed
        style = self._translate_style_to_english(style)
        
        # Base prompt structure
        if mode == 'redesign':
            base_prompt = self._generate_redesign_prompt(
                style, room_type, ai_intensity, measurements, 
                inspiration_description, room_analysis
            )
        else:  # design mode
            base_prompt = self._generate_design_prompt(
                style, room_type, measurements, inspiration_description, room_analysis
            )
        
        # Generate negative prompt for structure preservation
        negative_prompt = self._generate_negative_prompt(mode, ai_intensity, measurements)
        
        logger.info(f"Generated {mode} prompt: {base_prompt[:100]}...")
        logger.info(f"Generated negative prompt: {negative_prompt[:80]}...")
        
        return base_prompt, negative_prompt
    
    def _generate_redesign_prompt(
        self,
        style: str,
        room_type: str,
        ai_intensity: float,
        measurements: Optional[List],
        inspiration_description: Optional[str],
        room_analysis: Optional[Dict]
    ) -> str:
        """Generate redesign prompt based on settings"""
        
        # Ensure style is in English
        style = self._translate_style_to_english(style)
        
        # Get full style details - use ALL available style elements
        style_data = self.style_definitions.get(style, self.style_definitions['Modern'])
        
        # Base prompt structure with detailed style information
        base_prompt = f"Beautiful {style.lower()} {room_type} interior design. {style_data['description']} "
        
        # Add detailed style characteristics
        base_prompt += f"KEY STYLE ELEMENTS: "
        base_prompt += f"Colors: {', '.join(style_data['colors'])}. "
        base_prompt += f"Materials: {', '.join(style_data['materials'])}. "
        base_prompt += f"Features: {', '.join(style_data['characteristics'])}. "
        base_prompt += f"Lighting: {', '.join(style_data['lighting'])}. "
        
        # Spatial constraints - always include when measurements are available
        if measurements:
            max_width = self._analyze_room_dimensions(measurements).get('max_width', 0)
            if max_width > 0 and max_width < 3.2:
                base_prompt += f"SPATIAL CONSTRAINTS: narrow galley {room_type} {max_width:.1f}m wide, "
                base_prompt += "linear countertop arrangement, efficient space utilization, no center island possible. "
            else:
                # Larger kitchen with island potential
                base_prompt += f"SPATIAL DIMENSIONS: {room_type} {max_width:.1f}m x {max_width-0.5:.1f}m space. "
        
        # Add layout and workflow elements
        base_prompt += "LAYOUT REQUIREMENTS: streamlined workflow, realistic proportions, "
        
        if measurements:
            base_prompt += f"properly scaled for {max_width:.1f}m x {max_width-0.5:.1f}m space. "
        
        # Enhanced quality prompts with ultrarealistic and 8K terms
        base_prompt += "RENDERING QUALITY: accurately scaled for room, perfect proportions and spatial relationships, "
        base_prompt += "following professional interior design standards, ultra high quality interior design, "
        base_prompt += "photorealistic rendering, intricate material textures, cinematic lighting with soft shadows, "
        base_prompt += "professional architectural photography, magazine quality presentation, "
        base_prompt += "8K resolution, ultrarealistic, ultra detailed, high definition, ray-traced lighting, "
        base_prompt += "crystal clear details, hyper-realistic materials, award-winning design, "
        base_prompt += f"luxury {style.lower()} interior design showcase, photographic quality. "
        
        # Add style-specific details from inspiration if available
        if inspiration_description:
            # Extract key elements from inspiration (use full description)
            base_prompt += f"INSPIRED BY: {inspiration_description} "
            
            # Extract color information from inspiration
            color_words = [word for word in inspiration_description.split() if word.lower() in [
                "white", "black", "gray", "grey", "blue", "green", "red", "yellow", "orange", 
                "purple", "pink", "brown", "beige", "cream", "ivory", "gold", "silver", "bronze",
                "copper", "brass", "wood", "marble", "granite", "quartz", "steel", "metal"
            ]]
            
            if color_words:
                base_prompt += f"WITH COLOR PALETTE FEATURING: {', '.join(color_words)}. "
        
        # Room analysis integration - add important details if available
        if room_analysis:
            analysis_prompt = self._integrate_room_analysis(room_analysis)
            if analysis_prompt:
                base_prompt += "ROOM ANALYSIS: " + analysis_prompt
        
        return base_prompt
    
    def _generate_design_prompt(
        self,
        style: str,
        room_type: str,
        measurements: Optional[List],
        inspiration_description: Optional[str],
        room_analysis: Optional[Dict]
    ) -> str:
        """Generate detailed design-from-scratch prompt"""
        
        # Ensure style is in English
        style = self._translate_style_to_english(style)
        
        prompt_parts = []
        
        # Base design premise
        prompt_parts.extend([
            f"COMPLETE {room_type.upper()} DESIGN: Furnish and design empty space with full",
            f"{style.lower()} style interior including all necessary furniture, appliances, and fixtures."
        ])
        
        # Style-specific details
        style_details = self._get_style_details(style, inspiration_description)
        prompt_parts.append(style_details)
        
        # Essential kitchen elements
        if room_type == 'kitchen':
            prompt_parts.append(
                "INCLUDE ESSENTIAL ELEMENTS: kitchen cabinets (upper and lower), "
                "countertops, backsplash, sink, stove/cooktop, refrigerator, "
                "appropriate lighting, and proper storage solutions."
            )
        
        # Spatial layout from measurements
        spatial_layout = self._generate_spatial_layout(measurements, room_type)
        if spatial_layout:
            prompt_parts.append(spatial_layout)
        
        # Room analysis integration
        if room_analysis:
            analysis_prompt = self._integrate_room_analysis(room_analysis)
            if analysis_prompt:
                prompt_parts.append(analysis_prompt)
        
        # Quality enhancers
        prompt_parts.extend([
            "Professional interior design quality:",
            "realistic furniture placement, proper scale and proportions,",
            "functional layout design, high-end materials and finishes,",
            "excellent lighting design, photorealistic rendering"
        ])
        
        return " ".join(prompt_parts)
    
    def _get_style_details(self, style: str, inspiration_description: Optional[str]) -> str:
        """Generate detailed style description"""
        
        # Ensure style is in English
        style = self._translate_style_to_english(style)
        
        # Always include the full style description
        style_data = self.style_definitions.get(style, self.style_definitions['Modern'])
        
        details = []
        details.append(f"{style.upper()} STYLE: {style_data['description']}")
        
        # If inspiration is available, combine it with style information
        if inspiration_description:
            details.append(f"STYLE INSPIRATION: {inspiration_description}")
            
            # Extract color information from inspiration to enhance the prompt
            color_words = [word for word in inspiration_description.split() if word.lower() in [
                "white", "black", "gray", "grey", "blue", "green", "red", "yellow", "orange", 
                "purple", "pink", "brown", "beige", "cream", "ivory", "gold", "silver", "bronze",
                "copper", "brass", "wood", "marble", "granite", "quartz", "steel", "metal"
            ]]
            
            if color_words:
                details.append(f"COLOR PALETTE: {', '.join(color_words)}")
        else:
            # Otherwise use the full style definition
            details.append(f"Colors: {', '.join(style_data['colors'])}")
            details.append(f"Materials: {', '.join(style_data['materials'])}")
            details.append(f"Features: {', '.join(style_data['characteristics'])}")
            details.append(f"Lighting: {', '.join(style_data['lighting'])}")
        
        return " ".join(details)
    
    def _get_enhanced_style_details(self, style: str, inspiration_description: Optional[str], ai_intensity: float) -> str:
        """Generate enhanced style description with more dramatic details for high AI intensity"""
        
        # Ensure style is in English
        style = self._translate_style_to_english(style)
        
        # Get the full style data
        style_data = self.style_definitions.get(style, self.style_definitions['Modern'])
        
        details = []
        details.append(f"{style.upper()} STYLE: {style_data['description']}")
        
        # If inspiration is available, combine it with style information
        if inspiration_description:
            details.append(f"STYLE INSPIRATION: {inspiration_description}")
            
            # Add high-quality enhancements based on style
            quality_enhancements = {
                'Modern': "ultra clean lines, minimalist fixtures, seamless integration, smart home features, hidden storage",
                'Traditional': "hand-crafted details, ornate moldings, rich wood tones, heritage fixtures, classic proportions",
                'Luxury': "premium imported marble, gold fixtures, custom cabinetry, designer lighting, rare materials",
                'Scandinavian': "natural light maximization, blonde woods, functional simplicity, textural contrast, hygge atmosphere",
                'Industrial': "exposed structural elements, raw concrete finishes, black metal accents, salvaged materials, open ducting",
                'Farmhouse': "reclaimed wood features, apron sink, vintage-inspired fixtures, shiplap details, antique elements",
                'Contemporary': "mixed materials, statement lighting, technological integration, bold accents, curated accessories"
            }
            
            # Add style-specific quality details
            style_enhancement = quality_enhancements.get(style, "high-end finishes, premium materials, masterful craftsmanship")
            
            if ai_intensity > 0.6:
                details.append(f"ENHANCED ELEMENTS: {style_enhancement}")
                details.append("DRAMATIC TRANSFORMATION: bold design choices, luxury upgrades, striking focal points, professional lighting design")
            else:
                details.append(f"REFINED ELEMENTS: {style_enhancement}")
                
            # Extract color information from inspiration to enhance the prompt
            color_words = [word for word in inspiration_description.split() if word.lower() in [
                "white", "black", "gray", "grey", "blue", "green", "red", "yellow", "orange", 
                "purple", "pink", "brown", "beige", "cream", "ivory", "gold", "silver", "bronze",
                "copper", "brass", "wood", "marble", "granite", "quartz", "steel", "metal"
            ]]
            
            if color_words:
                details.append(f"COLOR PALETTE: {', '.join(color_words)}")
                
        else:
            # If no inspiration, use full style definition with additional premium elements
            if ai_intensity > 0.6:
                # Add premium materials and quality elements
                if style == 'Modern':
                    details.append("Premium Materials: Italian porcelain, brushed stainless steel, engineered quartz, tempered glass")
                    details.append("Luxury Features: hidden LED lighting, flush cabinetry, integrated appliances, smart home technology")
                elif style == 'Traditional':
                    details.append("Premium Materials: hardwood cabinetry, natural stone, oil-rubbed bronze, custom millwork")
                    details.append("Luxury Features: ornate crown molding, furniture-style islands, decorative range hood, vintage-inspired fixtures")
                elif style == 'Luxury':
                    details.append("Premium Materials: Calacatta marble, burnished brass, exotic woods, artisan glass")
                    details.append("Luxury Features: statement chandelier, waterfall countertops, custom range hood, designer hardware")
                else:
                    details.append(f"Premium Materials: {', '.join(style_data['materials'])}")
                    details.append(f"Luxury Features: {', '.join(style_data['characteristics'])}")
            else:
                details.append(f"Colors: {', '.join(style_data['colors'])}")
                details.append(f"Materials: {', '.join(style_data['materials'])}")
                details.append(f"Features: {', '.join(style_data['characteristics'])}")
                
            details.append(f"Lighting: {', '.join(style_data['lighting'])}")
        
        # Add quality elements regardless of AI intensity
        details.append("Professional quality: magazine-worthy composition, architectural details, perfect proportions")
        
        return " ".join(details)
    
    def _generate_spatial_constraints(self, measurements: Optional[List], room_type: str) -> str:
        """Generate spatial constraints from measurements"""
        
        if not measurements or len(measurements) == 0:
            return ""
        
        # Analyze measurements for spatial constraints
        room_analysis = self._analyze_room_dimensions(measurements)
        
        constraints = []
        
        if room_analysis['width'] and room_analysis['width'] < 3.0:
            # Very narrow space
            constraints.extend([
                f"CRITICAL SPATIAL CONSTRAINT: Room width only {room_analysis['width']:.1f}m.",
                "MANDATORY GALLEY LAYOUT: Single-wall or narrow double-wall configuration only.",
                "ABSOLUTELY NO center island or peninsula - insufficient space.",
                "Linear countertop arrangement, compact appliances, efficient storage."
            ])
        elif room_analysis['width'] and room_analysis['width'] < 3.7:
            # Moderately narrow space
            constraints.extend([
                f"SPATIAL CONSTRAINT: Room width {room_analysis['width']:.1f}m.",
                "COMPACT LAYOUT REQUIRED: No full-size island, consider small peninsula if space allows.",
                "Efficient galley or L-shaped layout, space-conscious design."
            ])
        elif room_analysis['width'] and room_analysis['width'] > 5.0:
            # Very spacious room
            constraints.extend([
                f"SPACIOUS ROOM: Width {room_analysis['width']:.1f}m allows generous layout.",
                "LUXURY CONFIGURATION: Large kitchen island with seating, multiple work zones,",
                "professional-grade appliances, ample storage and counter space."
            ])
        
        if room_analysis['height'] and room_analysis['height'] > 3.2:
            constraints.append("HIGH CEILINGS: Include tall cabinets, statement lighting, vertical design elements.")
        elif room_analysis['height'] and room_analysis['height'] < 2.4:
            constraints.append("LOW CEILINGS: Horizontal emphasis, low-profile fixtures, space-expanding design.")
        
        return " ".join(constraints) if constraints else ""
    
    def _generate_spatial_layout(self, measurements: Optional[List], room_type: str) -> str:
        """Generate spatial layout suggestions for design mode"""
        
        if not measurements or len(measurements) == 0:
            return f"STANDARD {room_type.upper()} LAYOUT: Functional and efficient design with proper work triangle."
        
        room_analysis = self._analyze_room_dimensions(measurements)
        
        layout_suggestions = []
        
        if room_type == 'kitchen':
            if room_analysis['width'] and room_analysis['width'] < 3.0:
                layout_suggestions.extend([
                    f"GALLEY KITCHEN LAYOUT for {room_analysis['width']:.1f}m width:",
                    "Single-wall configuration with compact appliances,",
                    "wall-mounted storage, linear workflow design."
                ])
            elif room_analysis['width'] and room_analysis['width'] > 4.0:
                layout_suggestions.extend([
                    f"SPACIOUS KITCHEN LAYOUT for {room_analysis['width']:.1f}m width:",
                    "Large central island with seating, multiple work zones,",
                    "professional appliances, abundant storage."
                ])
            else:
                layout_suggestions.extend([
                    f"EFFICIENT KITCHEN LAYOUT for {room_analysis['width']:.1f}m width:",
                    "L-shaped or U-shaped configuration, compact island if space allows,",
                    "optimized work triangle, practical storage solutions."
                ])
        
        return " ".join(layout_suggestions) if layout_suggestions else ""
    
    def _analyze_room_dimensions(self, measurements: List) -> Dict:
        """Analyze measurements to understand room dimensions"""
        
        room_data = {
            'width': None,
            'length': None,
            'height': None,
            'area': None
        }
        
        if not measurements:
            return room_data
        
        # Extract dimensions from measurements
        widths = []
        lengths = []
        heights = []
        
        for measurement in measurements:
            if isinstance(measurement, dict):
                value = measurement.get('realMeasurement', 0)
                unit = measurement.get('unit', 'm')
                measurement_type = measurement.get('type', 'wall')
                
                # Convert to meters
                if unit == 'cm':
                    value = value / 100
                elif unit == 'ft':
                    value = value * 0.3048
                elif unit == 'in':
                    value = value * 0.0254
                
                if measurement_type in ['wall', 'room_width']:
                    widths.append(value)
                elif measurement_type in ['room_length']:
                    lengths.append(value)
                elif measurement_type in ['ceiling', 'height']:
                    heights.append(value)
        
        # Calculate representative dimensions
        if widths:
            room_data['width'] = max(widths)  # Use maximum width for space planning
        if lengths:
            room_data['length'] = max(lengths)
        if heights:
            room_data['height'] = max(heights)
        
        if room_data['width'] and room_data['length']:
            room_data['area'] = room_data['width'] * room_data['length']
        
        return room_data
    
    def _integrate_room_analysis(self, room_analysis: Dict) -> str:
        """Integrate AI room analysis into prompt"""
        
        if not room_analysis:
            return ""
        
        analysis_parts = []
        
        # Extract key insights from room analysis
        if 'layout_type' in room_analysis:
            analysis_parts.append(f"EXISTING LAYOUT: {room_analysis['layout_type']}")
        
        if 'key_features' in room_analysis and isinstance(room_analysis['key_features'], list):
            features = room_analysis['key_features']
            analysis_parts.append(f"KEY FEATURES: {', '.join(features)}")
        
        if 'lighting_conditions' in room_analysis:
            analysis_parts.append(f"LIGHTING: {room_analysis['lighting_conditions']}")
            
        if 'colors' in room_analysis and isinstance(room_analysis['colors'], list):
            colors = room_analysis['colors']
            analysis_parts.append(f"DETECTED COLORS: {', '.join(colors)}")
            
        if 'materials' in room_analysis and isinstance(room_analysis['materials'], list):
            materials = room_analysis['materials']
            analysis_parts.append(f"DETECTED MATERIALS: {', '.join(materials)}")
            
        if 'style_elements' in room_analysis and isinstance(room_analysis['style_elements'], list):
            style_elements = room_analysis['style_elements']
            analysis_parts.append(f"STYLE ELEMENTS: {', '.join(style_elements)}")
        
        return " ".join(analysis_parts) if analysis_parts else ""
    
    def _generate_negative_prompt(self, mode: str, ai_intensity: float, measurements: Optional[List]) -> str:
        """Generate negative prompt based on Replicate playground settings"""
        
        # Use the successful negative prompt from Replicate playground as base with quality-focused additions
        negative_elements = [
            "lowres", "watermark", "banner", "logo", "watermark", "contactinfo", "text", "deformed", 
            "blurry", "blur", "out of focus", "out of frame", "surreal", "extra", "ugly", 
            "upholstered walls", "fabric walls", "plush walls", "mirror", "mirrored", "functional",
            "grainy", "pixelated", "low resolution", "bad shadows", "poor lighting", "low quality",
            "unrealistic lighting", "poor composition", "dull colors", "flat lighting", "amateur",
            "low detail", "simplistic", "bad proportions", "unprofessional", "cartoon", "anime",
            "drawing", "sketch", "painting", "CGI", "3d render", "poor textures", "underexposed",
            "overexposed", "clipart", "stock photo", "cropped", "grain", "noise", "artifacts",
            "jpeg artifacts", "compression artifacts", "glitch", "corrupted", "poor resolution"
        ]
        
        # Add spatial constraint negatives if we have measurements for a narrow space
        if measurements:
            room_analysis = self._analyze_room_dimensions(measurements)
            if room_analysis['width'] and room_analysis['width'] < 3.0:  # Narrow space
                negative_elements.extend([
                    "kitchen island", "center island", "double island"
                ])
        
        # For maximum structure preservation (low AI intensity), add structure preservation
        if mode == 'redesign' and ai_intensity <= 0.3:
            negative_elements.extend([
                "different room layout", "moving walls", "changing windows", "different architecture"
            ])
        
        return ", ".join(negative_elements)
    
    def get_model_parameters(self, ai_intensity: float, high_quality: bool, mode: str) -> Dict:
        """Get optimized model parameters based on settings"""
        
        import random
        
        # Enhanced parameters for higher quality results
        base_params = {
            "guidance_scale": 15,  # Based on playground value
            "num_inference_steps": 60,  # Increased for better quality
            "scheduler": "DPM_PLUS_PLUS_2M",  # Higher quality scheduler
            "seed": random.randint(1, 2147483647),  # Random seed for variety
            "prompt_strength": 0.8,  # Based on playground value
            "width": 768,   # Larger output dimensions
            "height": 768   # Larger output dimensions
        }
        
        # Still allow AI intensity to modify parameters if needed
        if ai_intensity <= 0.3:  # Maximum structure preservation
            base_params.update({
                "guidance_scale": 10.0,  # More moderate guidance
                "prompt_strength": 0.5  # Lower for more structure preservation
            })
        elif ai_intensity <= 0.6:  # Balanced approach
            base_params.update({
                "guidance_scale": 12.5,  # Medium guidance
                "prompt_strength": 0.65  # Medium prompt strength
            })
        else:  # High intensity - MAXIMUM creativity and transformation
            # Use the default values (closest to the playground settings)
            pass
        
        # High quality adjustments
        if high_quality:
            base_params.update({
                "num_inference_steps": 80,  # More steps for quality
                "width": 1024,
                "height": 1024,
                "guidance_scale": 18,  # Increased guidance for more detailed output
                "scheduler": "DDIM"  # Best quality but slower scheduler
            })
        
        # Mode-specific adjustments
        if mode == 'design':
            # Design mode needs higher guidance for better generation from scratch
            base_params["num_inference_steps"] = base_params["num_inference_steps"] + 10
        
        return base_params
    
    def _generate_structural_preservation(self, intensity_level: str = "balanced", measurements: Optional[List] = None) -> str:
        """
        Generate structural preservation instructions for maintaining architectural elements
        
        Args:
            intensity_level: "strict", "balanced", or "relaxed"
            measurements: Optional room measurements
        
        Returns:
            String with structural preservation instructions
        """
        preservation_parts = []
        
        if intensity_level == "strict":
            # Strongest preservation - maintain everything
            preservation_parts.append("CRITICAL STRUCTURE PRESERVATION REQUIREMENTS:")
            preservation_parts.extend([
                "PRESERVE EXACT window locations, sizes, and frames",
                "MAINTAIN ALL door openings, positions, and frames", 
                "KEEP ORIGINAL wall corners, boundaries, and structural elements",
                "RETAIN ALL existing architectural features exactly as they are",
                "PRESERVE EXACT room dimensions and proportions",
                "MAINTAIN electrical outlet and switch positions",
                "KEEP ceiling height and fixtures in original locations",
                "PRESERVE ALL plumbing fixtures in their exact positions"
            ])
            
        elif intensity_level == "balanced":
            # Balanced preservation - maintain structural elements but allow some design freedom
            preservation_parts.append("STRUCTURE PRESERVATION REQUIREMENTS:")
            preservation_parts.extend([
                "Preserve window locations and sizes",
                "Maintain door openings and positions", 
                "Keep wall corners and room boundaries",
                "Retain existing architectural elements",
                "Preserve room layout and structural walls",
                "Keep ceiling height and proportions",
                "Maintain plumbing fixture locations where practical"
            ])
            
        else:  # relaxed
            # Allow more creative freedom, just preserve basic structure
            preservation_parts.append("BASIC STRUCTURE GUIDELINES:")
            preservation_parts.extend([
                "Maintain general room shape and key structural elements",
                "Keep windows and doors in generally the same locations",
                "Preserve load-bearing walls and key architectural features"
            ])
        
        # Add specific constraints based on measurements
        if measurements and intensity_level in ["strict", "balanced"]:
            room_data = self._analyze_room_dimensions(measurements)
            if room_data.get('max_width', 0) < 3.2:
                preservation_parts.append(f"CRITICAL: Limited width of {room_data['max_width']:.1f}m requires maintaining exact wall positions")
            
        return " ".join(preservation_parts) 