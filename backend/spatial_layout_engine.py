"""
Advanced Spatial Layout Engine for Kitchen Design AI
Generates scale-accurate layout masks from user dimensions
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import logging
from typing import Dict, List, Tuple, Optional
import xml.etree.ElementTree as ET
from datetime import datetime
import tempfile
import os

logger = logging.getLogger(__name__)

class SpatialLayoutEngine:
    """Advanced engine for generating space-aware kitchen layouts"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Standard dimensions in meters
        self.KITCHEN_STANDARDS = {
            'min_walkway': 0.9,           # 90cm minimum walkway
            'preferred_walkway': 1.2,      # 120cm preferred walkway  
            'island_clearance': 1.0,       # 100cm around island
            'counter_depth': 0.6,          # 60cm standard counter
            'island_min_width': 1.2,       # 120cm minimum island width
            'island_min_length': 2.0,      # 200cm minimum island length
            'appliance_width': 0.6,        # 60cm standard appliance
            'door_swing': 0.9,             # 90cm door swing clearance
        }
        
        # Layout thresholds  
        self.LAYOUT_THRESHOLDS = {
            'galley_max_width': 3.0,       # Maximum width for galley-only
            'island_min_width': 3.7,       # Minimum width for island
            'u_shape_min_width': 3.0,      # Minimum for U-shaped
            'l_shape_min_width': 2.4,      # Minimum for L-shaped
        }
        
    def generate_layout_from_dimensions(self, room_data: Dict) -> Dict:
        """
        Generate complete layout from user-provided room dimensions
        
        Args:
            room_data: {
                'width': float,      # meters
                'length': float,     # meters  
                'height': float,     # meters (optional)
                'doors': List[Dict], # door locations (optional)
                'windows': List[Dict] # window locations (optional)
            }
            
        Returns:
            {
                'layout_type': str,
                'svg_mask': str,
                'png_mask': Image,
                'controlnet_conditioning': Image,
                'spatial_constraints': Dict,
                'measurements_overlay': Image,
                'layout_feasibility': Dict
            }
        """
        
        width = room_data.get('width', 4.0)
        length = room_data.get('length', 5.0)
        height = room_data.get('height', 2.7)
        doors = room_data.get('doors', [])
        windows = room_data.get('windows', [])
        
        self.logger.info(f"Generating layout for {width}m x {length}m kitchen")
        
        # Validate dimensions
        validation_result = self._validate_room_dimensions(width, length, height)
        if not validation_result['valid']:
            raise ValueError(f"Invalid room dimensions: {validation_result['errors']}")
            
        # Determine optimal layout type
        layout_type = self._determine_layout_type(width, length)
        self.logger.info(f"Recommended layout type: {layout_type}")
        
        # Generate furniture zones based on layout type
        furniture_zones = self._generate_furniture_zones(width, length, layout_type, doors, windows)
        
        # Create SVG layout mask
        svg_mask = self._create_svg_layout_mask(width, length, furniture_zones, doors, windows)
        
        # Convert SVG to PNG mask for ControlNet
        png_mask = self._svg_to_png_mask(svg_mask, width, length)
        
        # Generate ControlNet conditioning image
        controlnet_conditioning = self._create_controlnet_conditioning(width, length, furniture_zones)
        
        # Create measurements overlay
        measurements_overlay = self._create_measurements_overlay(width, length, furniture_zones)
        
        # Generate spatial constraints for prompt
        spatial_constraints = self._generate_spatial_constraints(width, length, layout_type, furniture_zones)
        
        # Layout feasibility analysis
        layout_feasibility = self._analyze_layout_feasibility(width, length, layout_type, furniture_zones)
        
        return {
            'layout_type': layout_type,
            'svg_mask': svg_mask,
            'png_mask': png_mask,
            'controlnet_conditioning': controlnet_conditioning,
            'spatial_constraints': spatial_constraints,
            'measurements_overlay': measurements_overlay,
            'layout_feasibility': layout_feasibility,
            'furniture_zones': furniture_zones,
            'room_dimensions': {'width': width, 'length': length, 'height': height}
        }
    
    def _validate_room_dimensions(self, width: float, length: float, height: float) -> Dict:
        """Validate room dimensions for kitchen design"""
        errors = []
        warnings = []
        
        # Minimum kitchen requirements
        if width < 1.8:
            errors.append(f"Kitchen width {width}m too narrow (minimum 1.8m)")
        elif width < 2.4:
            warnings.append(f"Very narrow kitchen {width}m - galley layout required")
            
        if length < 2.0:
            errors.append(f"Kitchen length {length}m too short (minimum 2.0m)")
            
        if height and height < 2.2:
            warnings.append(f"Low ceiling {height}m - consider low-profile furniture")
        elif height and height > 3.5:
            warnings.append(f"Very high ceiling {height}m - can accommodate tall cabinets")
            
        # Area check
        area = width * length
        if area < 4.0:
            warnings.append(f"Very small kitchen area {area:.1f}m² - efficiency layout required")
        elif area > 40.0:
            warnings.append(f"Large kitchen area {area:.1f}m² - multiple work zones possible")
            
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'area': area
        }
    
    def _determine_layout_type(self, width: float, length: float) -> str:
        """Determine optimal kitchen layout based on dimensions"""
        
        # Galley kitchen (narrow spaces)
        if width <= self.LAYOUT_THRESHOLDS['galley_max_width']:
            return 'galley'
            
        # Single wall (very narrow but longer)
        if width < self.LAYOUT_THRESHOLDS['l_shape_min_width']:
            return 'single_wall'
            
        # L-shaped layout
        if width >= self.LAYOUT_THRESHOLDS['l_shape_min_width'] and width < self.LAYOUT_THRESHOLDS['u_shape_min_width']:
            return 'l_shaped'
            
        # U-shaped layout
        if width >= self.LAYOUT_THRESHOLDS['u_shape_min_width'] and width < self.LAYOUT_THRESHOLDS['island_min_width']:
            return 'u_shaped'
            
        # Island kitchen (spacious)
        if width >= self.LAYOUT_THRESHOLDS['island_min_width']:
            return 'island'
            
        return 'galley'  # Default fallback
    
    def _generate_furniture_zones(self, width: float, length: float, layout_type: str, 
                                 doors: List, windows: List) -> List[Dict]:
        """Generate furniture zones based on layout type and constraints"""
        
        zones = []
        
        if layout_type == 'galley':
            zones = self._create_galley_zones(width, length, doors, windows)
        elif layout_type == 'single_wall':
            zones = self._create_single_wall_zones(width, length, doors, windows)
        elif layout_type == 'l_shaped':
            zones = self._create_l_shaped_zones(width, length, doors, windows)
        elif layout_type == 'u_shaped':
            zones = self._create_u_shaped_zones(width, length, doors, windows)
        elif layout_type == 'island':
            zones = self._create_island_zones(width, length, doors, windows)
            
        return zones
    
    def _create_galley_zones(self, width: float, length: float, doors: List, windows: List) -> List[Dict]:
        """Create zones for galley kitchen layout"""
        zones = []
        
        # Counter depth
        counter_depth = self.KITCHEN_STANDARDS['counter_depth']
        walkway = width - (2 * counter_depth)
        
        if walkway >= self.KITCHEN_STANDARDS['min_walkway']:
            # Double galley (both sides)
            zones.extend([
                {
                    'type': 'counter',
                    'name': 'left_counter',
                    'x': 0,
                    'y': 0,
                    'width': counter_depth,
                    'height': length,
                    'appliances': ['sink', 'dishwasher']
                },
                {
                    'type': 'counter', 
                    'name': 'right_counter',
                    'x': width - counter_depth,
                    'y': 0,
                    'width': counter_depth,
                    'height': length,
                    'appliances': ['stove', 'refrigerator']
                },
                {
                    'type': 'walkway',
                    'name': 'center_walkway',
                    'x': counter_depth,
                    'y': 0,
                    'width': walkway,
                    'height': length,
                    'keep_clear': True
                }
            ])
        else:
            # Single wall galley
            zones.extend([
                {
                    'type': 'counter',
                    'name': 'main_counter',
                    'x': 0,
                    'y': 0,
                    'width': counter_depth,
                    'height': length,
                    'appliances': ['sink', 'stove', 'refrigerator', 'dishwasher']
                },
                {
                    'type': 'walkway',
                    'name': 'open_space',
                    'x': counter_depth,
                    'y': 0,
                    'width': width - counter_depth,
                    'height': length,
                    'keep_clear': True
                }
            ])
            
        return zones
    
    def _create_island_zones(self, width: float, length: float, doors: List, windows: List) -> List[Dict]:
        """Create zones for island kitchen layout"""
        zones = []
        
        counter_depth = self.KITCHEN_STANDARDS['counter_depth']
        island_clearance = self.KITCHEN_STANDARDS['island_clearance']
        
        # Calculate island dimensions
        available_width = width - (2 * counter_depth) - (2 * island_clearance)
        available_length = length - (2 * island_clearance)
        
        island_width = min(available_width, self.KITCHEN_STANDARDS['island_min_width'] * 1.5)
        island_length = min(available_length, self.KITCHEN_STANDARDS['island_min_length'] * 1.5)
        
        # Position island in center
        island_x = (width - island_width) / 2
        island_y = (length - island_length) / 2
        
        zones.extend([
            # Perimeter counters
            {
                'type': 'counter',
                'name': 'back_counter',
                'x': 0,
                'y': 0,
                'width': width,
                'height': counter_depth,
                'appliances': ['sink', 'dishwasher']
            },
            {
                'type': 'counter',
                'name': 'side_counter',
                'x': width - counter_depth,
                'y': counter_depth,
                'width': counter_depth,
                'height': length - counter_depth,
                'appliances': ['refrigerator']
            },
            # Island
            {
                'type': 'island',
                'name': 'center_island',
                'x': island_x,
                'y': island_y,
                'width': island_width,
                'height': island_length,
                'appliances': ['stove', 'prep_area'],
                'seating': True
            }
        ])
        
        return zones
    
    def _create_single_wall_zones(self, width: float, length: float, doors: List, windows: List) -> List[Dict]:
        """Create zones for single wall layout"""
        counter_depth = self.KITCHEN_STANDARDS['counter_depth']
        
        return [
            {
                'type': 'counter',
                'name': 'main_wall',
                'x': 0,
                'y': 0,
                'width': counter_depth,
                'height': length,
                'appliances': ['sink', 'stove', 'refrigerator', 'dishwasher']
            },
            {
                'type': 'open_space',
                'name': 'room_space',
                'x': counter_depth,
                'y': 0,
                'width': width - counter_depth,
                'height': length,
                'keep_clear': False
            }
        ]
    
    def _create_l_shaped_zones(self, width: float, length: float, doors: List, windows: List) -> List[Dict]:
        """Create zones for L-shaped layout"""
        counter_depth = self.KITCHEN_STANDARDS['counter_depth']
        
        return [
            {
                'type': 'counter',
                'name': 'main_wall',
                'x': 0,
                'y': 0,
                'width': counter_depth,
                'height': length,
                'appliances': ['sink', 'dishwasher']
            },
            {
                'type': 'counter',
                'name': 'side_wall',
                'x': 0,
                'y': length - counter_depth,
                'width': width * 0.6,
                'height': counter_depth,
                'appliances': ['stove', 'refrigerator']
            }
        ]
    
    def _create_u_shaped_zones(self, width: float, length: float, doors: List, windows: List) -> List[Dict]:
        """Create zones for U-shaped layout"""
        counter_depth = self.KITCHEN_STANDARDS['counter_depth']
        
        return [
            {
                'type': 'counter',
                'name': 'left_wall',
                'x': 0,
                'y': 0,
                'width': counter_depth,
                'height': length,
                'appliances': ['refrigerator']
            },
            {
                'type': 'counter',
                'name': 'back_wall',
                'x': 0,
                'y': 0,
                'width': width,
                'height': counter_depth,
                'appliances': ['sink', 'dishwasher']
            },
            {
                'type': 'counter',
                'name': 'right_wall',
                'x': width - counter_depth,
                'y': 0,
                'width': counter_depth,
                'height': length,
                'appliances': ['stove']
            }
        ]
    
    def _create_svg_layout_mask(self, width: float, length: float, zones: List[Dict], 
                               doors: List, windows: List) -> str:
        """Create SVG layout mask with precise measurements"""
        
        # Scale factor for SVG (pixels per meter)
        scale = 100
        svg_width = int(width * scale)
        svg_height = int(length * scale)
        
        svg_elements = []
        svg_elements.append(f'<svg width="{svg_width}" height="{svg_height}" xmlns="http://www.w3.org/2000/svg">')
        
        # Background
        svg_elements.append(f'<rect width="{svg_width}" height="{svg_height}" fill="white"/>')
        
        # Room outline
        svg_elements.append(f'<rect x="0" y="0" width="{svg_width}" height="{svg_height}" '
                           f'fill="none" stroke="black" stroke-width="4"/>')
        
        # Add furniture zones
        for zone in zones:
            x = int(zone['x'] * scale)
            y = int(zone['y'] * scale)
            w = int(zone['width'] * scale)
            h = int(zone['height'] * scale)
            
            if zone['type'] == 'counter':
                color = "#8B4513"  # Brown for counters
            elif zone['type'] == 'island':
                color = "#654321"  # Darker brown for island
            elif zone['type'] == 'walkway':
                color = "none"     # Transparent for walkways
            else:
                color = "#D2B48C"  # Light brown for other furniture
                
            svg_elements.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" '
                               f'fill="{color}" stroke="black" stroke-width="2"/>')
                               
            # Add zone label
            label_x = x + w//2
            label_y = y + h//2
            svg_elements.append(f'<text x="{label_x}" y="{label_y}" text-anchor="middle" '
                               f'font-family="Arial" font-size="12" fill="white">{zone["name"]}</text>')
        
        # Add dimensions
        svg_elements.append(f'<text x="{svg_width//2}" y="{svg_height + 20}" text-anchor="middle" '
                           f'font-family="Arial" font-size="14" fill="black">{width:.1f}m</text>')
        svg_elements.append(f'<text x="-20" y="{svg_height//2}" text-anchor="middle" '
                           f'font-family="Arial" font-size="14" fill="black" '
                           f'transform="rotate(-90 -20 {svg_height//2})">{length:.1f}m</text>')
        
        svg_elements.append('</svg>')
        
        return '\n'.join(svg_elements)
    
    def _svg_to_png_mask(self, svg_content: str, width: float, length: float) -> Image.Image:
        """Convert SVG layout mask to PNG for ControlNet"""
        try:
            # Create simple mask since cairosvg may not be available
            return self._create_simple_mask(width, length)
            
        except Exception as e:
            self.logger.error(f"SVG to PNG conversion failed: {str(e)}")
            # Fallback: create simple mask
            return self._create_simple_mask(width, length)
    
    def _create_simple_mask(self, width: float, length: float) -> Image.Image:
        """Create simple mask for ControlNet"""
        mask = Image.new('RGB', (512, 512), 'white')
        draw = ImageDraw.Draw(mask)
        
        # Draw room outline
        margin = 50
        room_width = 512 - 2 * margin
        room_height = int(room_width * (length / width))
        
        y_offset = (512 - room_height) // 2
        
        draw.rectangle([margin, y_offset, margin + room_width, y_offset + room_height], 
                      outline='black', width=4)
        
        return mask
    
    def _create_controlnet_conditioning(self, width: float, length: float, zones: List[Dict]) -> Image.Image:
        """Create ControlNet conditioning image for Stable Diffusion"""
        
        # Create grayscale conditioning image
        conditioning = Image.new('L', (512, 512), 255)  # White background
        draw = ImageDraw.Draw(conditioning)
        
        # Scale zones to image
        scale_x = 512 / width
        scale_y = 512 / length
        
        # Draw zones as different gray levels
        for i, zone in enumerate(zones):
            x = int(zone['x'] * scale_x)
            y = int(zone['y'] * scale_y)
            w = int(zone['width'] * scale_x)
            h = int(zone['height'] * scale_y)
            
            # Different gray levels for different zone types
            if zone['type'] == 'counter':
                gray_level = 100  # Dark gray
            elif zone['type'] == 'island':
                gray_level = 80   # Darker gray
            elif zone['type'] == 'walkway':
                gray_level = 200  # Light gray
            else:
                gray_level = 150  # Medium gray
                
            draw.rectangle([x, y, x + w, y + h], fill=gray_level)
        
        # Convert to RGB for ControlNet
        return conditioning.convert('RGB')
    
    def _create_measurements_overlay(self, width: float, length: float, zones: List[Dict]) -> Image.Image:
        """Create measurements overlay for final image annotation"""
        
        overlay = Image.new('RGBA', (512, 512), (0, 0, 0, 0))  # Transparent
        draw = ImageDraw.Draw(overlay)
        
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except:
            font = ImageFont.load_default()
        
        # Add dimension annotations
        margin = 20
        
        # Width annotation (bottom)
        draw.line([(margin, 512 - margin), (512 - margin, 512 - margin)], 
                 fill=(255, 0, 0, 255), width=2)
        width_text = f"{width:.1f}m"
        bbox = draw.textbbox((0, 0), width_text, font=font)
        text_width = bbox[2] - bbox[0]
        draw.text((256 - text_width//2, 512 - margin + 5), width_text, 
                 fill=(255, 0, 0, 255), font=font)
        
        # Length annotation (right)
        draw.line([(512 - margin, margin), (512 - margin, 512 - margin)], 
                 fill=(255, 0, 0, 255), width=2)
        length_text = f"{length:.1f}m"
        draw.text((512 - margin + 5, 256), length_text, fill=(255, 0, 0, 255), font=font)
        
        return overlay
    
    def _generate_spatial_constraints(self, width: float, length: float, 
                                    layout_type: str, zones: List[Dict]) -> Dict:
        """Generate spatial constraints for AI prompt"""
        
        constraints = {
            'room_dimensions': f"{width:.1f}m x {length:.1f}m",
            'layout_type': layout_type,
            'area': width * length,
            'prompt_additions': [],
            'negative_prompts': [],
            'layout_rules': []
        }
        
        # Add layout-specific constraints
        if layout_type == 'galley':
            constraints['prompt_additions'].extend([
                f"narrow galley kitchen {width:.1f}m wide",
                "linear countertop arrangement",
                "efficient space utilization",
                "no center island possible",
                "streamlined workflow"
            ])
            constraints['negative_prompts'].extend([
                "kitchen island",
                "center furniture",
                "dining table in kitchen"
            ])
            
        elif layout_type == 'island':
            constraints['prompt_additions'].extend([
                f"spacious kitchen {width:.1f}m x {length:.1f}m",
                "large center island with seating",
                "multiple work zones",
                "generous counter space",
                "professional layout"
            ])
            
        # Add measurement accuracy requirements
        constraints['prompt_additions'].append(f"realistic proportions for {width:.1f}m x {length:.1f}m space")
        constraints['layout_rules'] = [
            f"maintain {self.KITCHEN_STANDARDS['min_walkway']:.1f}m minimum walkways",
            f"ensure {self.KITCHEN_STANDARDS['counter_depth']:.1f}m standard counter depth",
            "respect architectural constraints and real measurements"
        ]
        
        return constraints
    
    def _analyze_layout_feasibility(self, width: float, length: float, 
                                  layout_type: str, zones: List[Dict]) -> Dict:
        """Analyze layout feasibility and provide recommendations"""
        
        analysis = {
            'feasible': True,
            'efficiency_score': 0.0,
            'warnings': [],
            'recommendations': [],
            'work_triangle': None
        }
        
        # Calculate efficiency score based on layout type and dimensions
        area = width * length
        
        if layout_type == 'galley' and width <= 3.0:
            analysis['efficiency_score'] = 0.9  # Very efficient for narrow spaces
            analysis['recommendations'].append("Excellent choice for narrow kitchen")
        elif layout_type == 'island' and width >= 3.7:
            analysis['efficiency_score'] = 0.95  # Ideal for spacious kitchens
            analysis['recommendations'].append("Perfect dimensions for island layout")
        else:
            analysis['efficiency_score'] = 0.7   # Acceptable but not optimal
            
        # Check for potential issues
        if area < 6.0:
            analysis['warnings'].append("Very compact kitchen - prioritize essential appliances only")
        elif area > 30.0:
            analysis['warnings'].append("Large kitchen - consider multiple work zones")
            
        return analysis 