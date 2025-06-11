"""
Spatial Processing Module for Kitchen Design AI
Handles spatial analysis, room understanding, and layout optimization
"""

import cv2
import numpy as np
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional
import json

logger = logging.getLogger(__name__)

class SpatialProcessor:
    """Advanced spatial processing for interior design AI"""
    
    def __init__(self):
        """Initialize spatial processor with OpenCV and analysis capabilities"""
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing SpatialProcessor...")
        
        # Spatial analysis parameters
        self.min_room_width = 2.4  # meters
        self.max_room_width = 15.0  # meters
        self.kitchen_island_min_width = 3.7  # meters minimum for island
        
        self.logger.info("SpatialProcessor initialized successfully")
    
    def analyze_room_layout(self, image: Image.Image) -> Dict:
        """
        Analyze room layout from uploaded image
        Returns spatial constraints and room characteristics
        """
        try:
            # Convert PIL to OpenCV format
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            else:
                img_cv = img_array
            
            # Basic room analysis
            analysis = {
                'room_type': 'kitchen',  # Default
                'layout_style': 'unknown',
                'estimated_dimensions': self._estimate_room_dimensions(img_cv),
                'spatial_constraints': self._generate_spatial_constraints(img_cv),
                'feature_detection': self._detect_room_features(img_cv),
                'layout_recommendations': []
            }
            
            # Add layout recommendations based on analysis
            analysis['layout_recommendations'] = self._generate_layout_recommendations(analysis)
            
            return analysis
            
        except Exception as e:
            self.logger.error(f"Error analyzing room layout: {str(e)}")
            return {
                'room_type': 'kitchen',
                'layout_style': 'unknown',
                'estimated_dimensions': {'width': 4.0, 'length': 5.0},
                'spatial_constraints': [],
                'feature_detection': {},
                'layout_recommendations': []
            }
    
    def _estimate_room_dimensions(self, img_cv: np.ndarray) -> Dict:
        """Estimate room dimensions from image analysis"""
        try:
            height, width = img_cv.shape[:2]
            
            # Basic aspect ratio analysis
            aspect_ratio = width / height
            
            # Estimate real-world dimensions based on typical kitchen proportions
            if aspect_ratio > 1.5:
                # Wide/rectangular room
                estimated_width = 5.5
                estimated_length = 4.0
                layout_type = 'galley_or_linear'
            elif aspect_ratio < 0.8:
                # Tall/narrow room  
                estimated_width = 3.5
                estimated_length = 5.5
                layout_type = 'narrow_galley'
            else:
                # Square-ish room
                estimated_width = 4.5
                estimated_length = 4.5
                layout_type = 'square_layout'
            
            return {
                'width': estimated_width,
                'length': estimated_length,
                'aspect_ratio': aspect_ratio,
                'layout_type': layout_type,
                'confidence': 0.6  # Medium confidence for image-based estimation
            }
            
        except Exception as e:
            self.logger.error(f"Error estimating dimensions: {str(e)}")
            return {
                'width': 4.0,
                'length': 4.5,
                'aspect_ratio': 1.0,
                'layout_type': 'square_layout',
                'confidence': 0.3
            }
    
    def _generate_spatial_constraints(self, img_cv: np.ndarray) -> List[str]:
        """Generate spatial constraints based on room analysis"""
        constraints = []
        
        try:
            height, width = img_cv.shape[:2]
            aspect_ratio = width / height
            
            # Add constraints based on room proportions
            if aspect_ratio > 1.8:
                constraints.extend([
                    "very_narrow_space_detected",
                    "galley_layout_required", 
                    "no_center_island_possible",
                    "linear_arrangement_only"
                ])
            elif aspect_ratio > 1.3:
                constraints.extend([
                    "rectangular_space",
                    "limited_island_space",
                    "prefer_galley_or_L_shape"
                ])
            else:
                constraints.extend([
                    "compact_square_layout",
                    "island_possible_if_sufficient_width"
                ])
            
            # Add universal kitchen constraints
            constraints.extend([
                "maintain_work_triangle",
                "ensure_adequate_clearances",
                "position_appliances_logically"
            ])
            
        except Exception as e:
            self.logger.error(f"Error generating constraints: {str(e)}")
            constraints = ["standard_kitchen_layout"]
        
        return constraints
    
    def _detect_room_features(self, img_cv: np.ndarray) -> Dict:
        """Detect room features like windows, doors, etc."""
        features = {
            'windows_detected': False,
            'doors_detected': False,
            'existing_cabinets': False,
            'appliances_visible': False,
            'structural_elements': []
        }
        
        try:
            # Basic edge detection for structural elements
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY) if len(img_cv.shape) == 3 else img_cv
            edges = cv2.Canny(gray, 50, 150)
            
            # Find contours for major structural elements
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Basic feature detection based on contour analysis
            large_contours = [c for c in contours if cv2.contourArea(c) > 1000]
            
            if len(large_contours) > 5:
                features['existing_cabinets'] = True
                features['structural_elements'].append('cabinetry_detected')
            
            if len(large_contours) > 10:
                features['appliances_visible'] = True
                features['structural_elements'].append('appliances_detected')
            
            # Assume windows/doors present in most kitchens
            features['windows_detected'] = True
            features['doors_detected'] = True
            features['structural_elements'].extend(['windows_present', 'door_openings'])
            
        except Exception as e:
            self.logger.error(f"Error detecting features: {str(e)}")
        
        return features
    
    def _generate_layout_recommendations(self, analysis: Dict) -> List[str]:
        """Generate layout recommendations based on spatial analysis"""
        recommendations = []
        
        try:
            dimensions = analysis.get('estimated_dimensions', {})
            width = dimensions.get('width', 4.0)
            length = dimensions.get('length', 4.0)
            layout_type = dimensions.get('layout_type', 'square_layout')
            
            # Width-based recommendations
            if width < 3.0:
                recommendations.extend([
                    "MANDATORY: Single-wall galley layout only",
                    "CRITICAL: No kitchen island - insufficient space", 
                    "Use wall-mounted storage exclusively",
                    "Linear appliance arrangement required",
                    "Maximize vertical storage space"
                ])
            elif width < 3.7:
                recommendations.extend([
                    "Galley or L-shaped layout recommended",
                    "Small peninsula possible, no full island",
                    "Compact appliance selection",
                    "Efficient counter space utilization"
                ])
            elif width >= 4.5:
                recommendations.extend([
                    "Kitchen island feasible with proper clearances",
                    "Multiple layout options available",
                    "Consider work triangle optimization",
                    "Ample space for full-size appliances"
                ])
            
            # Layout-specific recommendations
            if layout_type == 'narrow_galley':
                recommendations.extend([
                    "Galley layout with opposing counters",
                    "Maintain 1.2m minimum clearance between counters",
                    "Consider galley-style workflow optimization"
                ])
            elif layout_type == 'square_layout':
                recommendations.extend([
                    "L-shaped or U-shaped layout options",
                    "Central island possible if space permits",
                    "Multiple work zone possibilities"
                ])
            
            # Add structural recommendations
            constraints = analysis.get('spatial_constraints', [])
            if 'no_center_island_possible' in constraints:
                recommendations.append("AVOID: Any center island furniture")
            if 'linear_arrangement_only' in constraints:
                recommendations.append("ENFORCE: Linear cabinet and appliance arrangement")
                
        except Exception as e:
            self.logger.error(f"Error generating recommendations: {str(e)}")
            recommendations = ["Standard kitchen layout principles apply"]
        
        return recommendations
    
    def validate_layout_feasibility(self, layout_plan: Dict, room_constraints: Dict) -> Dict:
        """
        Validate if a proposed layout is feasible given room constraints
        Returns validation results with scores and recommendations
        """
        validation = {
            'feasible': True,
            'confidence_score': 0.8,
            'issues': [],
            'warnings': [],
            'recommendations': []
        }
        
        try:
            # Get room dimensions
            room_width = room_constraints.get('width', 4.0)
            room_length = room_constraints.get('length', 4.0)
            
            # Check furniture items in layout
            furniture_items = layout_plan.get('furniture_items', [])
            
            for item in furniture_items:
                item_name = item.get('name', '').lower()
                
                # Check for problematic items in narrow spaces
                if room_width < 3.0:
                    if 'island' in item_name:
                        validation['feasible'] = False
                        validation['issues'].append(f"Kitchen island impossible in {room_width:.1f}m wide space")
                        validation['confidence_score'] -= 0.3
                    
                    if 'peninsula' in item_name:
                        validation['warnings'].append(f"Peninsula may be too large for {room_width:.1f}m width")
                        validation['confidence_score'] -= 0.1
                
                elif room_width < 3.7:
                    if 'island' in item_name and 'large' in item_name:
                        validation['issues'].append(f"Large island not recommended in {room_width:.1f}m wide space")
                        validation['confidence_score'] -= 0.2
            
            # Add recommendations based on validation
            if validation['confidence_score'] < 0.6:
                validation['recommendations'].append("Consider alternative layout arrangement")
            if not validation['feasible']:
                validation['recommendations'].append("Redesign required - current layout violates spatial constraints")
                
        except Exception as e:
            self.logger.error(f"Error validating layout: {str(e)}")
            validation['warnings'].append(f"Validation error: {str(e)}")
        
        return validation
    
    def generate_spatial_prompt_additions(self, spatial_analysis: Dict, measurements: List = None) -> str:
        """
        Generate additional prompt text based on spatial analysis
        To be integrated with the main PromptEngine
        """
        prompt_additions = []
        
        try:
            # Extract key spatial information
            dimensions = spatial_analysis.get('estimated_dimensions', {})
            constraints = spatial_analysis.get('spatial_constraints', [])
            recommendations = spatial_analysis.get('layout_recommendations', [])
            
            room_width = dimensions.get('width', 4.0)
            layout_type = dimensions.get('layout_type', 'square_layout')
            
            # Add spatial-specific prompting
            if room_width < 3.0:
                prompt_additions.append(
                    "CRITICAL SPATIAL CONSTRAINT: Extremely narrow kitchen space detected. "
                    "MANDATORY single-wall galley layout. ABSOLUTELY no kitchen islands, "
                    "peninsulas, or center furniture. Wall-mounted storage only. "
                    "Linear appliance arrangement against single wall."
                )
            elif room_width < 3.7:
                prompt_additions.append(
                    f"SPATIAL CONSTRAINT: Limited width space ({room_width:.1f}m). "
                    "Galley or L-shaped layout required. Small peninsula possible but "
                    "no full kitchen island. Compact efficient design."
                )
            
            # Add layout-specific guidance
            if layout_type == 'narrow_galley':
                prompt_additions.append(
                    "LAYOUT GUIDANCE: Narrow galley configuration. Optimize for "
                    "efficient workflow. Maintain clear center passage. "
                    "Parallel counter arrangement if space permits."
                )
            
            # Include measurement-based constraints if available
            if measurements:
                prompt_additions.append(
                    "MEASUREMENT INTEGRATION: Design must respect provided room "
                    "measurements. Ensure all furniture fits within specified dimensions. "
                    "Prioritize spatial accuracy and realistic proportions."
                )
            
            # Combine all additions
            if prompt_additions:
                return " ".join(prompt_additions)
            else:
                return "Apply standard spatial design principles with appropriate room proportions."
                
        except Exception as e:
            self.logger.error(f"Error generating spatial prompt additions: {str(e)}")
            return "Standard kitchen layout with proper spatial considerations." 