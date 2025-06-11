"""
Floor Plan Generation Module
Programmatically creates 2D floor plans based on room measurements
"""

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import math
import json
import os
from typing import Dict, List, Tuple, Optional
import io
import base64

class FloorPlanGenerator:
    def __init__(self, scale_factor: float = 50):
        """
        Initialize floor plan generator
        
        Args:
            scale_factor: Pixels per meter for image generation
        """
        self.scale_factor = scale_factor
        self.min_furniture_spacing = 0.6  # 60cm minimum spacing
        self.min_walkway_width = 0.9  # 90cm minimum walkway
        
        # Standard door and window dimensions (in meters)
        self.door_width = 0.8
        self.door_thickness = 0.1
        self.window_depth = 0.15
        
        # Color scheme for different elements
        self.colors = {
            'wall': '#2C3E50',
            'door': '#8B4513',
            'window': '#87CEEB',
            'furniture': '#D2B48C',
            'walkway': '#F0F8FF',
            'background': '#FFFFFF',
            'grid': '#E8E8E8',
            'text': '#2C3E50'
        }
        
    def create_floor_plan(self, room_data: Dict) -> Dict:
        """
        Create a complete floor plan from room specifications
        
        Args:
            room_data: Dictionary containing room specifications
                {
                    'dimensions': {'length': float, 'width': float, 'height': float},
                    'doors': [{'position': {'x': float, 'y': float}, 'width': float, 'orientation': str}],
                    'windows': [{'position': {'x': float, 'y': float}, 'width': float, 'height': float, 'wall': str}],
                    'furniture_requirements': [{'type': str, 'dimensions': dict, 'position': dict}],
                    'room_type': str,
                    'style_preferences': str
                }
                
        Returns:
            Dictionary containing floor plan data and validation results
        """
        
        dimensions = room_data.get('dimensions', {})
        length = dimensions.get('length', 5.0)  # Default 5m
        width = dimensions.get('width', 4.0)   # Default 4m
        height = dimensions.get('height', 2.7) # Default 2.7m
        
        # Create base floor plan
        floor_plan = self._create_base_floor_plan(length, width)
        
        # Add doors and windows
        doors = room_data.get('doors', [])
        windows = room_data.get('windows', [])
        
        floor_plan = self._add_doors_and_windows(floor_plan, doors, windows, length, width)
        
        # Generate furniture layout
        furniture_requirements = room_data.get('furniture_requirements', [])
        room_type = room_data.get('room_type', 'living-room')
        
        furniture_layout = self._generate_furniture_layout(
            length, width, doors, windows, furniture_requirements, room_type
        )
        
        # Validate spatial requirements
        validation_results = self._validate_spatial_requirements(
            length, width, furniture_layout, doors, windows
        )
        
        # Create final floor plan image
        floor_plan_image = self._render_complete_floor_plan(
            length, width, doors, windows, furniture_layout
        )
        
        # Generate ControlNet conditioning image
        controlnet_image = self._generate_controlnet_conditioning(
            length, width, doors, windows, furniture_layout
        )
        
        return {
            'floor_plan_image': floor_plan_image,
            'controlnet_conditioning': controlnet_image,
            'furniture_layout': furniture_layout,
            'validation_results': validation_results,
            'room_dimensions': {'length': length, 'width': width, 'height': height},
            'spatial_constraints': self._generate_spatial_constraints(length, width, room_type)
        }
    
    def _create_base_floor_plan(self, length: float, width: float) -> np.ndarray:
        """Create base floor plan with walls"""
        
        # Calculate image dimensions
        img_width = int(width * self.scale_factor) + 100  # Add margin
        img_height = int(length * self.scale_factor) + 100
        
        # Create base array
        floor_plan = np.ones((img_height, img_width, 3), dtype=np.uint8) * 255
        
        return floor_plan
    
    def _add_doors_and_windows(self, floor_plan: np.ndarray, doors: List[Dict], 
                              windows: List[Dict], length: float, width: float) -> np.ndarray:
        """Add doors and windows to floor plan"""
        
        img = Image.fromarray(floor_plan)
        draw = ImageDraw.Draw(img)
        
        margin = 50
        scale = self.scale_factor
        
        # Draw room outline
        room_rect = [
            margin, margin,
            margin + width * scale,
            margin + length * scale
        ]
        draw.rectangle(room_rect, outline=self.colors['wall'], width=3)
        
        # Add doors
        for door in doors:
            pos = door.get('position', {})
            door_width = door.get('width', self.door_width)
            orientation = door.get('orientation', 'horizontal')
            
            x = pos.get('x', 0) * scale + margin
            y = pos.get('y', 0) * scale + margin
            
            if orientation == 'horizontal':
                door_rect = [x, y-5, x + door_width * scale, y+5]
            else:
                door_rect = [x-5, y, x+5, y + door_width * scale]
                
            draw.rectangle(door_rect, fill=self.colors['door'], outline=self.colors['door'])
        
        # Add windows
        for window in windows:
            pos = window.get('position', {})
            window_width = window.get('width', 1.0)
            wall = window.get('wall', 'north')
            
            x = pos.get('x', 0) * scale + margin
            y = pos.get('y', 0) * scale + margin
            
            if wall in ['north', 'south']:
                window_rect = [x, y-3, x + window_width * scale, y+3]
            else:
                window_rect = [x-3, y, x+3, y + window_width * scale]
                
            draw.rectangle(window_rect, fill=self.colors['window'], outline=self.colors['window'])
        
        return np.array(img)
    
    def _generate_furniture_layout(self, length: float, width: float, doors: List[Dict], 
                                  windows: List[Dict], requirements: List[Dict], 
                                  room_type: str) -> List[Dict]:
        """Generate optimal furniture layout based on room constraints"""
        
        furniture_layout = []
        
        # Define standard furniture dimensions for different room types
        standard_furniture = {
            'kitchen': [
                {'type': 'cabinets', 'width': 0.6, 'depth': 0.6, 'priority': 1},
                {'type': 'island', 'width': 2.0, 'depth': 1.0, 'priority': 2, 'min_room_width': 3.7},
                {'type': 'appliances', 'width': 0.6, 'depth': 0.6, 'priority': 1}
            ],
            'living-room': [
                {'type': 'sofa', 'width': 2.2, 'depth': 0.9, 'priority': 1},
                {'type': 'coffee_table', 'width': 1.2, 'depth': 0.6, 'priority': 2},
                {'type': 'tv_unit', 'width': 1.5, 'depth': 0.4, 'priority': 2}
            ],
            'bedroom': [
                {'type': 'bed', 'width': 1.6, 'depth': 2.0, 'priority': 1},
                {'type': 'nightstand', 'width': 0.5, 'depth': 0.4, 'priority': 2},
                {'type': 'dresser', 'width': 1.0, 'depth': 0.5, 'priority': 2}
            ],
            'dining-room': [
                {'type': 'dining_table', 'width': 1.5, 'depth': 1.0, 'priority': 1},
                {'type': 'chairs', 'width': 0.5, 'depth': 0.5, 'priority': 1},
                {'type': 'sideboard', 'width': 1.5, 'depth': 0.4, 'priority': 2}
            ]
        }
        
        furniture_list = requirements if requirements else standard_furniture.get(room_type, [])
        
        # Calculate available space
        available_area = self._calculate_available_area(length, width, doors, windows)
        
        # Place furniture with spatial validation
        for furniture in sorted(furniture_list, key=lambda x: x.get('priority', 999)):
            # Check if furniture fits in room
            if furniture.get('min_room_width', 0) > width:
                continue
                
            # Find optimal position
            position = self._find_optimal_furniture_position(
                furniture, length, width, doors, windows, furniture_layout
            )
            
            if position:
                furniture_item = {
                    'type': furniture['type'],
                    'dimensions': {
                        'width': furniture['width'],
                        'depth': furniture['depth']
                    },
                    'position': position,
                    'rotation': position.get('rotation', 0)
                }
                furniture_layout.append(furniture_item)
        
        return furniture_layout
    
    def _find_optimal_furniture_position(self, furniture: Dict, length: float, width: float,
                                       doors: List[Dict], windows: List[Dict], 
                                       existing_furniture: List[Dict]) -> Optional[Dict]:
        """Find optimal position for furniture piece"""
        
        furniture_width = furniture['width']
        furniture_depth = furniture['depth']
        
        # Try different positions and rotations
        positions_to_try = []
        
        # Generate grid of possible positions
        grid_step = 0.2  # 20cm steps
        for x in np.arange(0.5, width - furniture_width - 0.5, grid_step):
            for y in np.arange(0.5, length - furniture_depth - 0.5, grid_step):
                positions_to_try.append({'x': x, 'y': y, 'rotation': 0})
                
                # Try 90-degree rotation if furniture is not square
                if furniture_width != furniture_depth:
                    if x + furniture_depth < width - 0.5 and y + furniture_width < length - 0.5:
                        positions_to_try.append({'x': x, 'y': y, 'rotation': 90})
        
        # Score positions based on layout quality
        best_position = None
        best_score = -1
        
        for pos in positions_to_try:
            score = self._score_furniture_position(
                pos, furniture, length, width, doors, windows, existing_furniture
            )
            
            if score > best_score:
                best_score = score
                best_position = pos
        
        return best_position if best_score > 0 else None
    
    def _score_furniture_position(self, position: Dict, furniture: Dict, 
                                 length: float, width: float, doors: List[Dict], 
                                 windows: List[Dict], existing_furniture: List[Dict]) -> float:
        """Score furniture position based on multiple criteria"""
        
        score = 100.0  # Base score
        
        x, y = position['x'], position['y']
        rotation = position.get('rotation', 0)
        
        # Get furniture dimensions considering rotation
        if rotation == 90:
            fw, fd = furniture['depth'], furniture['width']
        else:
            fw, fd = furniture['width'], furniture['depth']
        
        # Check boundaries
        if x + fw > width or y + fd > length:
            return 0
        
        # Check collisions with existing furniture
        for existing in existing_furniture:
            ex, ey = existing['position']['x'], existing['position']['y']
            erotation = existing['position'].get('rotation', 0)
            
            if erotation == 90:
                ew, ed = existing['dimensions']['depth'], existing['dimensions']['width']
            else:
                ew, ed = existing['dimensions']['width'], existing['dimensions']['depth']
            
            # Check overlap with spacing
            if (x < ex + ew + self.min_furniture_spacing and 
                x + fw + self.min_furniture_spacing > ex and
                y < ey + ed + self.min_furniture_spacing and 
                y + fd + self.min_furniture_spacing > ey):
                return 0
        
        # Check clearance from doors
        for door in doors:
            door_x = door.get('position', {}).get('x', 0)
            door_y = door.get('position', {}).get('y', 0)
            door_width = door.get('width', self.door_width)
            
            # Furniture should not block door swing
            door_clearance = 1.2  # 1.2m clearance for door swing
            
            distance_to_door = math.sqrt((x - door_x)**2 + (y - door_y)**2)
            if distance_to_door < door_clearance:
                score -= 50
        
        # Prefer positions away from walls for better access
        wall_distance = min(x, y, width - x - fw, length - y - fd)
        if wall_distance > 0.5:
            score += 10
        
        # Room-specific scoring
        furniture_type = furniture.get('type', '')
        
        if furniture_type == 'sofa':
            # Sofas should face the room center
            center_x, center_y = width / 2, length / 2
            facing_center_score = 1 / (1 + abs(x + fw/2 - center_x) + abs(y + fd/2 - center_y))
            score += facing_center_score * 20
        
        elif furniture_type == 'island':
            # Kitchen island should be centered with adequate clearance
            if x > 1.0 and x + fw < width - 1.0 and y > 1.0 and y + fd < length - 1.0:
                score += 30
            else:
                score -= 30
        
        return score
    
    def _calculate_available_area(self, length: float, width: float, 
                                 doors: List[Dict], windows: List[Dict]) -> float:
        """Calculate available floor area for furniture"""
        
        total_area = length * width
        
        # Subtract door swing areas
        door_swing_area = 0
        for door in doors:
            door_swing_area += 1.5 * 1.5  # Assume 1.5m x 1.5m swing area
        
        # Subtract minimum walkway areas
        walkway_area = self.min_walkway_width * (length + width)
        
        return max(0, total_area - door_swing_area - walkway_area)
    
    def _validate_spatial_requirements(self, length: float, width: float, 
                                     furniture_layout: List[Dict], doors: List[Dict], 
                                     windows: List[Dict]) -> Dict:
        """Validate that the layout meets spatial requirements"""
        
        validation_results = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'recommendations': []
        }
        
        # Check minimum walkway widths
        walkway_violations = self._check_walkway_clearances(
            length, width, furniture_layout, doors
        )
        
        if walkway_violations:
            validation_results['errors'].extend(walkway_violations)
            validation_results['valid'] = False
        
        # Check furniture spacing
        spacing_violations = self._check_furniture_spacing(furniture_layout)
        
        if spacing_violations:
            validation_results['warnings'].extend(spacing_violations)
        
        # Check door clearances
        door_violations = self._check_door_clearances(furniture_layout, doors)
        
        if door_violations:
            validation_results['errors'].extend(door_violations)
            validation_results['valid'] = False
        
        # Generate recommendations
        recommendations = self._generate_layout_recommendations(
            length, width, furniture_layout
        )
        validation_results['recommendations'] = recommendations
        
        return validation_results
    
    def _check_walkway_clearances(self, length: float, width: float, 
                                 furniture_layout: List[Dict], doors: List[Dict]) -> List[str]:
        """Check minimum walkway clearances"""
        
        violations = []
        
        # Create occupancy grid
        grid_resolution = 0.1  # 10cm resolution
        grid_width = int(width / grid_resolution)
        grid_length = int(length / grid_resolution)
        
        occupancy_grid = np.zeros((grid_length, grid_width))
        
        # Mark furniture positions
        for furniture in furniture_layout:
            pos = furniture['position']
            dims = furniture['dimensions']
            rotation = pos.get('rotation', 0)
            
            if rotation == 90:
                fw, fd = dims['depth'], dims['width']
            else:
                fw, fd = dims['width'], dims['depth']
            
            start_x = int(pos['x'] / grid_resolution)
            end_x = int((pos['x'] + fw) / grid_resolution)
            start_y = int(pos['y'] / grid_resolution)
            end_y = int((pos['y'] + fd) / grid_resolution)
            
            occupancy_grid[start_y:end_y, start_x:end_x] = 1
        
        # Check walkway connectivity
        min_walkway_cells = int(self.min_walkway_width / grid_resolution)
        
        # This is a simplified check - in practice, you'd use path-finding algorithms
        free_area_ratio = np.sum(occupancy_grid == 0) / occupancy_grid.size
        
        if free_area_ratio < 0.4:  # Less than 40% free space
            violations.append("Insufficient walkway space - furniture layout too dense")
        
        return violations
    
    def _check_furniture_spacing(self, furniture_layout: List[Dict]) -> List[str]:
        """Check spacing between furniture pieces"""
        
        violations = []
        
        for i, furniture1 in enumerate(furniture_layout):
            for j, furniture2 in enumerate(furniture_layout[i+1:], i+1):
                distance = self._calculate_furniture_distance(furniture1, furniture2)
                
                if distance < self.min_furniture_spacing:
                    violations.append(
                        f"Insufficient spacing between {furniture1['type']} and {furniture2['type']} "
                        f"({distance:.1f}m < {self.min_furniture_spacing}m required)"
                    )
        
        return violations
    
    def _calculate_furniture_distance(self, furniture1: Dict, furniture2: Dict) -> float:
        """Calculate minimum distance between two furniture pieces"""
        
        pos1 = furniture1['position']
        dims1 = furniture1['dimensions']
        rot1 = pos1.get('rotation', 0)
        
        pos2 = furniture2['position']
        dims2 = furniture2['dimensions']
        rot2 = pos2.get('rotation', 0)
        
        # Get actual dimensions considering rotation
        if rot1 == 90:
            w1, d1 = dims1['depth'], dims1['width']
        else:
            w1, d1 = dims1['width'], dims1['depth']
            
        if rot2 == 90:
            w2, d2 = dims2['depth'], dims2['width']
        else:
            w2, d2 = dims2['width'], dims2['depth']
        
        # Calculate bounding boxes
        x1, y1 = pos1['x'], pos1['y']
        x2, y2 = pos2['x'], pos2['y']
        
        # Calculate minimum distance between rectangles
        dx = max(0, max(x1 - (x2 + w2), x2 - (x1 + w1)))
        dy = max(0, max(y1 - (y2 + d2), y2 - (y1 + d1)))
        
        return math.sqrt(dx**2 + dy**2)
    
    def _check_door_clearances(self, furniture_layout: List[Dict], doors: List[Dict]) -> List[str]:
        """Check that furniture doesn't block door operation"""
        
        violations = []
        
        for door in doors:
            door_pos = door.get('position', {})
            door_x, door_y = door_pos.get('x', 0), door_pos.get('y', 0)
            door_width = door.get('width', self.door_width)
            
            # Define door swing area (simplified as a rectangle)
            swing_clearance = 1.2  # 1.2m clearance needed
            
            for furniture in furniture_layout:
                pos = furniture['position']
                dims = furniture['dimensions']
                
                # Check if furniture is within door swing area
                distance = math.sqrt((pos['x'] - door_x)**2 + (pos['y'] - door_y)**2)
                
                if distance < swing_clearance:
                    violations.append(
                        f"{furniture['type']} is too close to door - "
                        f"may interfere with door operation"
                    )
        
        return violations
    
    def _generate_layout_recommendations(self, length: float, width: float, 
                                       furniture_layout: List[Dict]) -> List[str]:
        """Generate recommendations for layout improvement"""
        
        recommendations = []
        
        # Check room utilization
        total_furniture_area = sum(
            item['dimensions']['width'] * item['dimensions']['depth'] 
            for item in furniture_layout
        )
        room_area = length * width
        utilization_ratio = total_furniture_area / room_area
        
        if utilization_ratio < 0.2:
            recommendations.append("Room appears under-furnished - consider adding more furniture pieces")
        elif utilization_ratio > 0.6:
            recommendations.append("Room may be over-furnished - consider removing or downsizing some pieces")
        
        # Check for missing furniture types by room
        furniture_types = {item['type'] for item in furniture_layout}
        
        # This would be expanded based on room type analysis
        if 'sofa' not in furniture_types and 'living' in str(furniture_types):
            recommendations.append("Consider adding seating for a living room")
        
        return recommendations
    
    def _render_complete_floor_plan(self, length: float, width: float, doors: List[Dict], 
                                   windows: List[Dict], furniture_layout: List[Dict]) -> Image.Image:
        """Render the complete floor plan with all elements"""
        
        # Calculate image dimensions
        margin = 100
        img_width = int(width * self.scale_factor) + 2 * margin
        img_height = int(length * self.scale_factor) + 2 * margin
        
        # Create image
        img = Image.new('RGB', (img_width, img_height), self.colors['background'])
        draw = ImageDraw.Draw(img)
        
        # Draw grid
        self._draw_grid(draw, img_width, img_height, margin)
        
        # Draw room outline
        room_rect = [
            margin, margin,
            margin + width * self.scale_factor,
            margin + length * self.scale_factor
        ]
        draw.rectangle(room_rect, outline=self.colors['wall'], width=4)
        
        # Draw doors
        for door in doors:
            self._draw_door(draw, door, margin)
        
        # Draw windows
        for window in windows:
            self._draw_window(draw, window, margin)
        
        # Draw furniture
        for furniture in furniture_layout:
            self._draw_furniture(draw, furniture, margin)
        
        # Add measurements and labels
        self._add_measurements(draw, length, width, margin)
        
        return img
    
    def _draw_grid(self, draw: ImageDraw.Draw, img_width: int, img_height: int, margin: int):
        """Draw grid lines for reference"""
        
        grid_spacing = self.scale_factor  # 1 meter grid
        
        # Vertical lines
        for x in range(margin, img_width - margin, grid_spacing):
            draw.line([(x, margin), (x, img_height - margin)], 
                     fill=self.colors['grid'], width=1)
        
        # Horizontal lines
        for y in range(margin, img_height - margin, grid_spacing):
            draw.line([(margin, y), (img_width - margin, y)], 
                     fill=self.colors['grid'], width=1)
    
    def _draw_door(self, draw: ImageDraw.Draw, door: Dict, margin: int):
        """Draw door on floor plan"""
        
        pos = door.get('position', {})
        door_width = door.get('width', self.door_width)
        orientation = door.get('orientation', 'horizontal')
        
        x = pos.get('x', 0) * self.scale_factor + margin
        y = pos.get('y', 0) * self.scale_factor + margin
        
        if orientation == 'horizontal':
            door_rect = [x, y-8, x + door_width * self.scale_factor, y+8]
            # Draw door swing arc
            draw.arc([x-5, y-door_width*self.scale_factor/2, 
                     x+door_width*self.scale_factor+5, y+door_width*self.scale_factor/2], 
                    0, 90, fill=self.colors['door'])
        else:
            door_rect = [x-8, y, x+8, y + door_width * self.scale_factor]
            # Draw door swing arc
            draw.arc([x-door_width*self.scale_factor/2, y-5, 
                     x+door_width*self.scale_factor/2, y+door_width*self.scale_factor+5], 
                    0, 90, fill=self.colors['door'])
        
        draw.rectangle(door_rect, fill=self.colors['door'], outline=self.colors['door'], width=2)
    
    def _draw_window(self, draw: ImageDraw.Draw, window: Dict, margin: int):
        """Draw window on floor plan"""
        
        pos = window.get('position', {})
        window_width = window.get('width', 1.0)
        wall = window.get('wall', 'north')
        
        x = pos.get('x', 0) * self.scale_factor + margin
        y = pos.get('y', 0) * self.scale_factor + margin
        
        if wall in ['north', 'south']:
            window_rect = [x, y-6, x + window_width * self.scale_factor, y+6]
            # Draw window lines
            draw.line([(x + window_width * self.scale_factor / 3, y-6), 
                      (x + window_width * self.scale_factor / 3, y+6)], 
                     fill=self.colors['text'], width=1)
            draw.line([(x + 2 * window_width * self.scale_factor / 3, y-6), 
                      (x + 2 * window_width * self.scale_factor / 3, y+6)], 
                     fill=self.colors['text'], width=1)
        else:
            window_rect = [x-6, y, x+6, y + window_width * self.scale_factor]
            # Draw window lines
            draw.line([(x-6, y + window_width * self.scale_factor / 3), 
                      (x+6, y + window_width * self.scale_factor / 3)], 
                     fill=self.colors['text'], width=1)
            draw.line([(x-6, y + 2 * window_width * self.scale_factor / 3), 
                      (x+6, y + 2 * window_width * self.scale_factor / 3)], 
                     fill=self.colors['text'], width=1)
        
        draw.rectangle(window_rect, fill=self.colors['window'], outline=self.colors['window'], width=2)
    
    def _draw_furniture(self, draw: ImageDraw.Draw, furniture: Dict, margin: int):
        """Draw furniture piece on floor plan"""
        
        pos = furniture['position']
        dims = furniture['dimensions']
        rotation = pos.get('rotation', 0)
        furniture_type = furniture['type']
        
        x = pos['x'] * self.scale_factor + margin
        y = pos['y'] * self.scale_factor + margin
        
        if rotation == 90:
            width = dims['depth'] * self.scale_factor
            height = dims['width'] * self.scale_factor
        else:
            width = dims['width'] * self.scale_factor
            height = dims['depth'] * self.scale_factor
        
        # Draw furniture rectangle
        furniture_rect = [x, y, x + width, y + height]
        draw.rectangle(furniture_rect, fill=self.colors['furniture'], 
                      outline=self.colors['text'], width=2)
        
        # Add furniture type label
        try:
            # Try to load a font, fall back to default if not available
            font = ImageFont.truetype("arial.ttf", 10)
        except:
            font = ImageFont.load_default()
        
        text = furniture_type.replace('_', ' ').title()
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        text_x = x + (width - text_width) / 2
        text_y = y + (height - text_height) / 2
        
        # Draw text background
        draw.rectangle([text_x-2, text_y-1, text_x+text_width+2, text_y+text_height+1], 
                      fill=self.colors['background'])
        
        draw.text((text_x, text_y), text, fill=self.colors['text'], font=font)
    
    def _add_measurements(self, draw: ImageDraw.Draw, length: float, width: float, margin: int):
        """Add dimension measurements to floor plan"""
        
        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except:
            font = ImageFont.load_default()
        
        # Width measurement
        width_text = f"{width:.1f}m"
        text_bbox = draw.textbbox((0, 0), width_text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        
        text_x = margin + (width * self.scale_factor - text_width) / 2
        text_y = margin - 30
        
        draw.text((text_x, text_y), width_text, fill=self.colors['text'], font=font)
        
        # Width dimension line
        draw.line([(margin, margin - 20), (margin + width * self.scale_factor, margin - 20)], 
                 fill=self.colors['text'], width=2)
        draw.line([(margin, margin - 25), (margin, margin - 15)], 
                 fill=self.colors['text'], width=2)
        draw.line([(margin + width * self.scale_factor, margin - 25), 
                  (margin + width * self.scale_factor, margin - 15)], 
                 fill=self.colors['text'], width=2)
        
        # Length measurement
        length_text = f"{length:.1f}m"
        text_bbox = draw.textbbox((0, 0), length_text, font=font)
        text_height = text_bbox[3] - text_bbox[1]
        
        text_x = margin - 50
        text_y = margin + (length * self.scale_factor - text_height) / 2
        
        draw.text((text_x, text_y), length_text, fill=self.colors['text'], font=font)
        
        # Length dimension line
        draw.line([(margin - 20, margin), (margin - 20, margin + length * self.scale_factor)], 
                 fill=self.colors['text'], width=2)
        draw.line([(margin - 25, margin), (margin - 15, margin)], 
                 fill=self.colors['text'], width=2)
        draw.line([(margin - 25, margin + length * self.scale_factor), 
                  (margin - 15, margin + length * self.scale_factor)], 
                 fill=self.colors['text'], width=2)
    
    def _generate_controlnet_conditioning(self, length: float, width: float, doors: List[Dict], 
                                        windows: List[Dict], furniture_layout: List[Dict]) -> Image.Image:
        """Generate ControlNet conditioning image for Stable Diffusion"""
        
        # Create simplified black and white conditioning image
        margin = 50
        img_width = int(width * self.scale_factor) + 2 * margin
        img_height = int(length * self.scale_factor) + 2 * margin
        
        # Create binary image (black and white)
        img = Image.new('L', (img_width, img_height), 255)  # White background
        draw = ImageDraw.Draw(img)
        
        # Draw room outline in black
        room_rect = [
            margin, margin,
            margin + width * self.scale_factor,
            margin + length * self.scale_factor
        ]
        draw.rectangle(room_rect, outline=0, width=8)  # Black outline
        
        # Draw furniture as black rectangles
        for furniture in furniture_layout:
            pos = furniture['position']
            dims = furniture['dimensions']
            rotation = pos.get('rotation', 0)
            
            x = pos['x'] * self.scale_factor + margin
            y = pos['y'] * self.scale_factor + margin
            
            if rotation == 90:
                width_px = dims['depth'] * self.scale_factor
                height_px = dims['width'] * self.scale_factor
            else:
                width_px = dims['width'] * self.scale_factor
                height_px = dims['depth'] * self.scale_factor
            
            furniture_rect = [x, y, x + width_px, y + height_px]
            draw.rectangle(furniture_rect, fill=0)  # Black furniture
        
        # Draw doors as gray areas
        for door in doors:
            pos = door.get('position', {})
            door_width = door.get('width', self.door_width)
            orientation = door.get('orientation', 'horizontal')
            
            x = pos.get('x', 0) * self.scale_factor + margin
            y = pos.get('y', 0) * self.scale_factor + margin
            
            if orientation == 'horizontal':
                door_rect = [x, y-10, x + door_width * self.scale_factor, y+10]
            else:
                door_rect = [x-10, y, x+10, y + door_width * self.scale_factor]
            
            draw.rectangle(door_rect, fill=128)  # Gray doors
        
        # Convert to RGB for ControlNet
        return img.convert('RGB')
    
    def _generate_spatial_constraints(self, length: float, width: float, room_type: str) -> Dict:
        """Generate spatial constraints for AI image generation"""
        
        constraints = {
            'room_dimensions': {'length': length, 'width': width},
            'minimum_clearances': {
                'walkway_width': self.min_walkway_width,
                'furniture_spacing': self.min_furniture_spacing,
                'door_clearance': 1.2
            },
            'layout_rules': []
        }
        
        # Add room-specific constraints
        if room_type == 'kitchen':
            if width < 3.0:
                constraints['layout_rules'].append("GALLEY_KITCHEN_ONLY")
                constraints['layout_rules'].append("NO_ISLAND_ALLOWED")
            elif width < 3.7:
                constraints['layout_rules'].append("NO_FULL_ISLAND")
                constraints['layout_rules'].append("PENINSULA_MAXIMUM")
            else:
                constraints['layout_rules'].append("ISLAND_ALLOWED")
        
        # Add accessibility constraints
        constraints['accessibility'] = {
            'wheelchair_clearance': 1.5,  # 1.5m clearance for wheelchair access
            'door_width_minimum': 0.8,
            'counter_height_accessible': 0.85
        }
        
        return constraints

    def export_floor_plan_data(self, floor_plan_data: Dict, output_path: str):
        """Export floor plan data to JSON file"""
        
        # Convert PIL Images to base64 for JSON serialization
        export_data = floor_plan_data.copy()
        
        if 'floor_plan_image' in export_data:
            img = export_data['floor_plan_image']
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            export_data['floor_plan_image'] = img_str
        
        if 'controlnet_conditioning' in export_data:
            img = export_data['controlnet_conditioning']
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            export_data['controlnet_conditioning'] = img_str
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2) 