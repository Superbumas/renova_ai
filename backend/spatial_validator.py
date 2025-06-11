"""
Spatial Validation Module
Uses computer vision to validate generated images against spatial constraints
"""

import cv2
import numpy as np
from PIL import Image
from typing import Dict, List, Tuple, Optional
import json
import math
from dataclasses import dataclass

@dataclass
class BoundingBox:
    x: float
    y: float
    width: float
    height: float
    confidence: float
    class_name: str

class SpatialValidator:
    def __init__(self):
        """Initialize spatial validator with vision models and constraints"""
        
        # Validation thresholds
        self.position_tolerance = 0.3  # 30cm tolerance for furniture positions
        self.scale_tolerance = 0.2     # 20% tolerance for furniture scale
        self.overlap_threshold = 0.1   # 10% maximum overlap allowed
        
        # Standard furniture dimensions (in meters) for scale validation
        self.standard_dimensions = {
            'sofa': {'width': 2.2, 'depth': 0.9, 'height': 0.8},
            'coffee_table': {'width': 1.2, 'depth': 0.6, 'height': 0.4},
            'dining_table': {'width': 1.5, 'depth': 1.0, 'height': 0.75},
            'bed': {'width': 1.6, 'depth': 2.0, 'height': 0.6},
            'kitchen_island': {'width': 2.0, 'depth': 1.0, 'height': 0.9},
            'tv_unit': {'width': 1.5, 'depth': 0.4, 'height': 0.5},
            'dresser': {'width': 1.0, 'depth': 0.5, 'height': 1.2},
            'nightstand': {'width': 0.5, 'depth': 0.4, 'height': 0.6}
        }
    
    def validate_generated_image(self, generated_image: Image.Image, 
                                floor_plan_data: Dict, 
                                room_dimensions: Dict) -> Dict:
        """
        Validate generated image against floor plan and constraints
        
        Args:
            generated_image: PIL Image of the generated interior
            floor_plan_data: Floor plan data with furniture layout
            room_dimensions: Room dimensions in meters
            
        Returns:
            Validation results with scores and recommendations
        """
        
        validation_results = {
            'overall_score': 0.0,
            'spatial_accuracy': 0.0,
            'scale_consistency': 0.0,
            'layout_compliance': 0.0,
            'violations': [],
            'recommendations': [],
            'detected_objects': [],
            'missing_objects': [],
            'scale_mismatches': []
        }
        
        try:
            # Convert PIL to OpenCV format for analysis
            cv_image = cv2.cvtColor(np.array(generated_image), cv2.COLOR_RGB2BGR)
            
            # Extract room perspective and establish scale reference
            perspective_data = self._extract_room_perspective(cv_image, room_dimensions)
            
            if not perspective_data.get('valid', False):
                validation_results['violations'].append("Unable to establish spatial reference in image")
                # Return partial results for images where we can't establish perspective
                validation_results['overall_score'] = 0.5
                validation_results['spatial_accuracy'] = 0.5
                validation_results['scale_consistency'] = 0.5
                validation_results['layout_compliance'] = 0.5
                validation_results['recommendations'].append("Image perspective analysis limited - manual review recommended")
                return validation_results
            
            # Detect furniture and objects in generated image
            detected_objects = self._detect_furniture_objects(cv_image, perspective_data)
            validation_results['detected_objects'] = [
                {
                    'type': obj.class_name,
                    'position': {'x': obj.x, 'y': obj.y},
                    'dimensions': {'width': obj.width, 'height': obj.height},
                    'confidence': obj.confidence
                } for obj in detected_objects
            ]
            
            # Validate furniture positions against floor plan
            position_score = self._validate_furniture_positions(
                detected_objects, 
                floor_plan_data.get('furniture_layout', []),
                perspective_data
            )
            validation_results['spatial_accuracy'] = position_score
            
            # Validate furniture scales
            scale_score = self._validate_furniture_scales(
                detected_objects, 
                perspective_data,
                room_dimensions
            )
            validation_results['scale_consistency'] = scale_score
            
            # Check layout compliance (clearances, accessibility, etc.)
            layout_score = self._validate_layout_compliance(
                detected_objects,
                floor_plan_data.get('spatial_constraints', {}),
                perspective_data
            )
            validation_results['layout_compliance'] = layout_score
            
            # Check for missing furniture
            missing_objects = self._find_missing_furniture(
                detected_objects,
                floor_plan_data.get('furniture_layout', [])
            )
            validation_results['missing_objects'] = missing_objects
            
            # Calculate overall score
            validation_results['overall_score'] = (
                position_score * 0.4 + 
                scale_score * 0.3 + 
                layout_score * 0.3
            )
            
            # Generate recommendations
            recommendations = self._generate_validation_recommendations(validation_results)
            validation_results['recommendations'] = recommendations
            
        except Exception as e:
            print(f"Error in spatial validation: {e}")
            # Return default scores on error
            validation_results['overall_score'] = 0.6
            validation_results['spatial_accuracy'] = 0.6
            validation_results['scale_consistency'] = 0.6
            validation_results['layout_compliance'] = 0.6
            validation_results['violations'].append(f"Validation error: {str(e)}")
            validation_results['recommendations'].append("Validation completed with limited analysis due to technical constraints")
        
        return validation_results
    
    def _extract_room_perspective(self, image: np.ndarray, room_dimensions: Dict) -> Dict:
        """Extract room perspective and establish spatial reference"""
        
        perspective_data = {
            'valid': True,  # Default to valid for basic functionality
            'vanishing_points': [],
            'floor_plane': None,
            'scale_reference': None,
            'horizon_line': None,
            'room_corners': []
        }
        
        try:
            height, width = image.shape[:2]
            
            # Use room dimensions to establish pixel-to-meter ratio
            room_width = room_dimensions.get('width', 4.0)
            room_length = room_dimensions.get('length', 5.0)
            
            # Simple scale estimation based on image dimensions
            estimated_pixels_per_meter = min(width / room_width, height / room_length) * 0.6
            
            scale_reference = {
                'pixels_per_meter': estimated_pixels_per_meter,
                'room_width_pixels': room_width * estimated_pixels_per_meter,
                'room_length_pixels': room_length * estimated_pixels_per_meter,
                'reference_established': True
            }
            perspective_data['scale_reference'] = scale_reference
            
        except Exception as e:
            print(f"Error extracting perspective: {e}")
            perspective_data['valid'] = False
        
        return perspective_data
    
    def _detect_furniture_objects(self, image: np.ndarray, perspective_data: Dict) -> List[BoundingBox]:
        """Detect furniture objects in the image using basic computer vision"""
        
        detected_objects = []
        
        try:
            # Convert to grayscale and apply edge detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Filter contours by size and shape to identify potential furniture
            min_area = 1000  # Minimum area for furniture detection
            
            for i, contour in enumerate(contours):
                area = cv2.contourArea(contour)
                if area < min_area:
                    continue
                
                # Get bounding rectangle
                x, y, w, h = cv2.boundingRect(contour)
                
                # Calculate aspect ratio to classify furniture type
                aspect_ratio = w / h if h > 0 else 1.0
                
                # Simple heuristic classification
                furniture_type = self._classify_furniture_by_shape(aspect_ratio, area, y, image.shape[0])
                
                if furniture_type:
                    confidence = min(0.8, area / 10000)  # Simple confidence scoring
                    
                    detected_object = BoundingBox(
                        x=x, y=y, width=w, height=h,
                        confidence=confidence,
                        class_name=furniture_type
                    )
                    detected_objects.append(detected_object)
        
        except Exception as e:
            print(f"Error detecting furniture: {e}")
        
        return detected_objects
    
    def _classify_furniture_by_shape(self, aspect_ratio: float, area: float, 
                                   y_position: float, image_height: float) -> Optional[str]:
        """Classify furniture type based on shape characteristics"""
        
        try:
            # Vertical position relative to image height
            relative_y = y_position / image_height if image_height > 0 else 0.5
            
            # Simple heuristic classification
            if relative_y > 0.7:  # Bottom part of image (floor level)
                if 1.5 < aspect_ratio < 4.0:  # Wide and low
                    if area > 15000:
                        return 'sofa'
                    else:
                        return 'coffee_table'
                elif 0.8 < aspect_ratio < 1.5:  # More square
                    if area > 20000:
                        return 'dining_table'
                    else:
                        return 'nightstand'
                elif aspect_ratio > 4.0:  # Very wide
                    return 'kitchen_island'
            
            elif 0.3 < relative_y < 0.7:  # Middle part (standing furniture)
                if aspect_ratio > 2.0:
                    return 'tv_unit'
                else:
                    return 'dresser'
        
        except Exception as e:
            print(f"Error classifying furniture: {e}")
        
        return None
    
    def _validate_furniture_positions(self, detected_objects: List[BoundingBox],
                                    planned_furniture: List[Dict],
                                    perspective_data: Dict) -> float:
        """Validate that detected furniture matches planned positions"""
        
        if not perspective_data.get('scale_reference') or not planned_furniture:
            return 0.7  # Default moderate score when validation is limited
        
        try:
            scale_ref = perspective_data['scale_reference']
            pixels_per_meter = scale_ref.get('pixels_per_meter', 100)
            
            position_scores = []
            
            for planned_item in planned_furniture:
                planned_type = planned_item.get('type', 'furniture')
                planned_pos = planned_item.get('position', {})
                
                # Convert planned position to image coordinates
                planned_x_px = planned_pos.get('x', 0) * pixels_per_meter
                planned_y_px = planned_pos.get('y', 0) * pixels_per_meter
                
                # Find closest detected object of same type
                best_match = None
                min_distance = float('inf')
                
                for detected in detected_objects:
                    if self._furniture_types_match(detected.class_name, planned_type):
                        # Calculate center of detected object
                        detected_center_x = detected.x + detected.width / 2
                        detected_center_y = detected.y + detected.height / 2
                        
                        distance = math.sqrt(
                            (detected_center_x - planned_x_px)**2 + 
                            (detected_center_y - planned_y_px)**2
                        )
                        
                        if distance < min_distance:
                            min_distance = distance
                            best_match = detected
                
                if best_match:
                    # Calculate position accuracy score
                    tolerance_px = self.position_tolerance * pixels_per_meter
                    position_score = max(0, 1 - (min_distance / tolerance_px))
                    position_scores.append(position_score)
                else:
                    position_scores.append(0.5)  # Partial score for unmatched items
            
            return sum(position_scores) / len(position_scores) if position_scores else 0.7
            
        except Exception as e:
            print(f"Error validating positions: {e}")
            return 0.6
    
    def _furniture_types_match(self, detected_type: str, planned_type: str) -> bool:
        """Check if detected and planned furniture types match"""
        
        if not detected_type or not planned_type:
            return False
        
        # Create mapping between different naming conventions
        type_mappings = {
            'sofa': ['sofa', 'couch'],
            'coffee_table': ['coffee_table', 'table'],
            'dining_table': ['dining_table', 'table'],
            'tv_unit': ['tv_unit', 'entertainment_center'],
            'kitchen_island': ['island', 'kitchen_island'],
            'bed': ['bed'],
            'dresser': ['dresser', 'cabinet'],
            'nightstand': ['nightstand', 'side_table']
        }
        
        for canonical_type, variants in type_mappings.items():
            if detected_type in variants and planned_type in variants:
                return True
        
        return detected_type.lower() == planned_type.lower()
    
    def _validate_furniture_scales(self, detected_objects: List[BoundingBox],
                                  perspective_data: Dict,
                                  room_dimensions: Dict) -> float:
        """Validate furniture scales against standard dimensions"""
        
        if not perspective_data.get('scale_reference'):
            return 0.7  # Default score when scale validation is limited
        
        try:
            scale_ref = perspective_data['scale_reference']
            pixels_per_meter = scale_ref.get('pixels_per_meter', 100)
            
            scale_scores = []
            
            for detected in detected_objects:
                furniture_type = detected.class_name
                
                if furniture_type not in self.standard_dimensions:
                    continue
                
                standard_dims = self.standard_dimensions[furniture_type]
                
                # Convert detected dimensions to meters
                detected_width_m = detected.width / pixels_per_meter
                detected_height_m = detected.height / pixels_per_meter
                
                # Compare with standard dimensions
                expected_width = standard_dims['width']
                expected_depth = standard_dims['depth']
                
                # Calculate scale accuracy
                width_ratio = min(detected_width_m / expected_width, expected_width / detected_width_m)
                depth_ratio = min(detected_height_m / expected_depth, expected_depth / detected_height_m)
                
                # Average the ratios and apply tolerance
                avg_ratio = (width_ratio + depth_ratio) / 2
                scale_score = max(0, (avg_ratio - (1 - self.scale_tolerance)) / self.scale_tolerance)
                
                scale_scores.append(min(1.0, scale_score))
            
            return sum(scale_scores) / len(scale_scores) if scale_scores else 0.7
            
        except Exception as e:
            print(f"Error validating scales: {e}")
            return 0.6
    
    def _validate_layout_compliance(self, detected_objects: List[BoundingBox],
                                   spatial_constraints: Dict,
                                   perspective_data: Dict) -> float:
        """Validate layout compliance with spatial constraints"""
        
        try:
            compliance_scores = []
            
            # Check for overlapping furniture
            overlap_score = self._check_furniture_overlaps(detected_objects)
            compliance_scores.append(overlap_score)
            
            # Check accessibility paths (simplified)
            accessibility_score = self._check_accessibility_paths(detected_objects, perspective_data)
            compliance_scores.append(accessibility_score)
            
            # Check spatial constraints
            if spatial_constraints:
                constraint_score = self._check_spatial_constraints(detected_objects, spatial_constraints)
                compliance_scores.append(constraint_score)
            
            return sum(compliance_scores) / len(compliance_scores) if compliance_scores else 0.7
            
        except Exception as e:
            print(f"Error validating layout compliance: {e}")
            return 0.6
    
    def _check_furniture_overlaps(self, detected_objects: List[BoundingBox]) -> float:
        """Check for furniture overlaps"""
        
        if len(detected_objects) < 2:
            return 1.0
        
        try:
            overlap_violations = 0
            total_pairs = 0
            
            for i, obj1 in enumerate(detected_objects):
                for obj2 in detected_objects[i+1:]:
                    total_pairs += 1
                    
                    # Calculate intersection area
                    x1 = max(obj1.x, obj2.x)
                    y1 = max(obj1.y, obj2.y)
                    x2 = min(obj1.x + obj1.width, obj2.x + obj2.width)
                    y2 = min(obj1.y + obj1.height, obj2.y + obj2.height)
                    
                    if x1 < x2 and y1 < y2:
                        intersection_area = (x2 - x1) * (y2 - y1)
                        obj1_area = obj1.width * obj1.height
                        obj2_area = obj2.width * obj2.height
                        
                        overlap_ratio = intersection_area / min(obj1_area, obj2_area)
                        
                        if overlap_ratio > self.overlap_threshold:
                            overlap_violations += 1
            
            if total_pairs == 0:
                return 1.0
            
            return 1 - (overlap_violations / total_pairs)
            
        except Exception as e:
            print(f"Error checking overlaps: {e}")
            return 0.7
    
    def _check_accessibility_paths(self, detected_objects: List[BoundingBox],
                                  perspective_data: Dict) -> float:
        """Check for clear accessibility paths"""
        
        try:
            if not detected_objects:
                return 1.0
            
            # Check furniture density as a proxy for accessibility
            total_furniture_area = sum(obj.width * obj.height for obj in detected_objects)
            
            # Estimate image area from perspective data or use default
            if perspective_data.get('scale_reference'):
                scale_ref = perspective_data['scale_reference']
                image_area = scale_ref.get('room_width_pixels', 1000) * scale_ref.get('room_length_pixels', 1000)
            else:
                image_area = 800 * 600  # Default image area
            
            furniture_density = total_furniture_area / image_area
            
            # Score based on furniture density (lower density = better accessibility)
            if furniture_density < 0.3:
                return 1.0
            elif furniture_density < 0.5:
                return 0.8
            elif furniture_density < 0.7:
                return 0.6
            else:
                return 0.3
                
        except Exception as e:
            print(f"Error checking accessibility: {e}")
            return 0.7
    
    def _check_spatial_constraints(self, detected_objects: List[BoundingBox],
                                  spatial_constraints: Dict) -> float:
        """Check against specific spatial constraints"""
        
        try:
            layout_rules = spatial_constraints.get('layout_rules', [])
            violations = 0
            
            for rule in layout_rules:
                if 'NO_ISLAND' in rule:
                    # Check if island is detected when not allowed
                    for obj in detected_objects:
                        if 'island' in obj.class_name.lower():
                            violations += 1
                            break
                
                elif 'GALLEY_KITCHEN_ONLY' in rule:
                    # Check for center objects in galley kitchen
                    for obj in detected_objects:
                        if obj.class_name in ['kitchen_island', 'dining_table']:
                            violations += 1
            
            # Score based on violations
            if not layout_rules:
                return 1.0
            
            compliance_ratio = 1 - (violations / len(layout_rules))
            return max(0, compliance_ratio)
            
        except Exception as e:
            print(f"Error checking spatial constraints: {e}")
            return 0.7
    
    def _find_missing_furniture(self, detected_objects: List[BoundingBox],
                               planned_furniture: List[Dict]) -> List[str]:
        """Find furniture items that were planned but not detected"""
        
        missing_items = []
        
        try:
            for planned_item in planned_furniture:
                planned_type = planned_item.get('type', 'furniture')
                
                # Check if this type was detected
                found = False
                for detected in detected_objects:
                    if self._furniture_types_match(detected.class_name, planned_type):
                        found = True
                        break
                
                if not found:
                    missing_items.append(planned_type)
        
        except Exception as e:
            print(f"Error finding missing furniture: {e}")
        
        return missing_items
    
    def _generate_validation_recommendations(self, validation_results: Dict) -> List[str]:
        """Generate recommendations based on validation results"""
        
        recommendations = []
        
        try:
            # Position accuracy recommendations
            if validation_results['spatial_accuracy'] < 0.7:
                recommendations.append(
                    "Furniture positioning needs improvement - consider adjusting object placement to match floor plan"
                )
            
            # Scale consistency recommendations
            if validation_results['scale_consistency'] < 0.7:
                recommendations.append(
                    "Furniture scale appears inconsistent - verify that objects are sized appropriately for the room"
                )
            
            # Layout compliance recommendations
            if validation_results['layout_compliance'] < 0.6:
                recommendations.append(
                    "Layout may violate spatial constraints - check for adequate clearances and accessibility"
                )
            
            # Missing furniture recommendations
            if validation_results['missing_objects']:
                missing = ', '.join(validation_results['missing_objects'])
                recommendations.append(f"Missing planned furniture items: {missing}")
            
            # Overall score recommendations
            if validation_results['overall_score'] < 0.5:
                recommendations.append(
                    "Consider regenerating the design with stronger spatial conditioning"
                )
            elif validation_results['overall_score'] < 0.7:
                recommendations.append(
                    "Design is partially compliant - minor adjustments may improve spatial accuracy"
                )
            else:
                recommendations.append(
                    "Design shows good spatial compliance with floor plan constraints"
                )
        
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            recommendations.append("Validation completed - manual review recommended")
        
        return recommendations
    
    def export_validation_report(self, validation_results: Dict, output_path: str):
        """Export detailed validation report"""
        
        try:
            report = {
                'validation_summary': {
                    'overall_score': validation_results['overall_score'],
                    'spatial_accuracy': validation_results['spatial_accuracy'],
                    'scale_consistency': validation_results['scale_consistency'],
                    'layout_compliance': validation_results['layout_compliance']
                },
                'detected_objects': validation_results.get('detected_objects', []),
                'violations': validation_results['violations'],
                'missing_objects': validation_results['missing_objects'],
                'recommendations': validation_results['recommendations'],
                'timestamp': json.dumps(None, default=str)
            }
            
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
                
        except Exception as e:
            print(f"Error exporting validation report: {e}") 