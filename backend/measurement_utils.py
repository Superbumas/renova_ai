"""
Utility functions for processing measurements and enhancing AI prompts
"""

def convert_to_meters(value, unit):
    """Convert measurements to meters for consistency"""
    conversions = {
        'm': 1,
        'cm': 0.01,
        'ft': 0.3048,
        'in': 0.0254
    }
    
    try:
        return float(value) * conversions.get(unit, 1)
    except (ValueError, TypeError):
        return None

def process_measurements(measurements):
    """Process measurements and return structured data - compatibility wrapper"""
    if not measurements:
        return {
            'has_measurements': False,
            'room_width': None,
            'room_height': None,
            'scale_category': 'medium',
            'measurement_context': '',
            'scale_context': ''
        }
    
    # Use existing analyze_room_scale function
    scale_info = analyze_room_scale(measurements)
    measurement_context, scale_context = create_measurement_context(measurements)
    
    return {
        'has_measurements': bool(measurements),
        'room_width': scale_info.get('room_width') if scale_info else None,
        'room_height': scale_info.get('room_height') if scale_info else None,
        'scale_category': scale_info.get('scale_category', 'medium') if scale_info else 'medium',
        'measurement_context': measurement_context,
        'scale_context': scale_context,
        'measurements': measurements
    }

def generate_measurement_context(measurements):
    """Generate measurement context - compatibility wrapper"""
    measurement_context, scale_context = create_measurement_context(measurements)
    return measurement_context, scale_context

def analyze_room_scale(measurements):
    """Analyze room measurements to determine scale category"""
    if not measurements:
        return None
    
    wall_measurements = [m for m in measurements if m.get('type') == 'wall']
    ceiling_measurements = [m for m in measurements if m.get('type') == 'ceiling']
    
    room_width = None
    room_height = None
    
    if wall_measurements:
        widths = []
        for m in wall_measurements:
            dim = m.get('dimension', {})
            width_m = convert_to_meters(dim.get('value'), dim.get('unit'))
            if width_m:
                widths.append(width_m)
        
        if widths:
            room_width = max(widths)
    
    if ceiling_measurements:
        heights = []
        for m in ceiling_measurements:
            dim = m.get('dimension', {})
            height_m = convert_to_meters(dim.get('value'), dim.get('unit'))
            if height_m:
                heights.append(height_m)
        
        if heights:
            room_height = max(heights)
    
    # Determine scale category (metric thresholds)
    scale_category = "medium"
    if room_width:
        if room_width < 2.4:  # Less than 2.4m (8ft)
            scale_category = "small"
        elif room_width > 4.9:  # Greater than 4.9m (16ft)
            scale_category = "large"
    
    return {
        'room_width': room_width,
        'room_height': room_height,
        'scale_category': scale_category,
        'has_measurements': True
    }

def generate_furniture_scale_prompt(measurements, room_type):
    """Generate furniture scaling prompts based on measurements"""
    scale_info = analyze_room_scale(measurements)
    
    if not scale_info or not scale_info['has_measurements']:
        return "appropriately-sized furniture"
    
    scale_category = scale_info['scale_category']
    room_width = scale_info.get('room_width')
    room_height = scale_info.get('room_height')
    
    # FORCE GALLEY MODE for extremely narrow spaces
    if room_width and room_width < 3.0 and room_type == 'kitchen':  # Less than 3m (10ft)
        return f"GALLEY KITCHEN ONLY: narrow single-wall or double-wall galley kitchen design with cabinets and appliances built into walls, linear countertop workspace, NO CENTER FURNITURE of any kind, NO ISLANDS, NO PENINSULAS, NO FREESTANDING ELEMENTS, clear center walkway, wall-mounted everything, compact built-in appliances, linear design only, narrow galley configuration, professional galley kitchen layout. MANDATORY: Keep center floor area completely empty for walking space. CRITICAL: room width is only {room_width:.1f}m - GALLEY LAYOUT REQUIRED"
    
    # Enhanced spatial constraint checking with VERY explicit language
    spatial_constraints = []
    layout_restrictions = []
    
    if room_width:
        if room_width < 3.0:  # Less than 3m (10 feet)
            spatial_constraints.append("ABSOLUTELY NO KITCHEN ISLAND - IMPOSSIBLE TO FIT")
            spatial_constraints.append("STRICTLY GALLEY KITCHEN ONLY")
            layout_restrictions.append("single-wall kitchen against one wall, linear layout, narrow galley configuration")
        elif room_width < 3.7:  # Less than 3.7m (12 feet) 
            spatial_constraints.append("NO FULL-SIZE ISLAND - SPACE TOO NARROW")
            layout_restrictions.append("galley kitchen or small peninsula maximum, linear layout preferred")
    
    # Base scale descriptions with VERY explicit spatial awareness
    scale_descriptions = {
        'small': "extremely compact, space-efficient furniture, ABSOLUTELY NO KITCHEN ISLAND EVER",
        'medium': "standard-sized furniture with comfortable proportions" if room_width and room_width >= 3.7 else "compact galley kitchen furniture, STRICTLY NO ISLAND, linear wall-mounted configuration only",
        'large': "generous, full-size furniture that fills the spacious room appropriately"
    }
    
    # Enhanced room-specific furniture guidelines with AGGRESSIVE spatial constraints
    room_specific_guidelines = {
        'kitchen': {
            'small': "narrow galley kitchen with wall-mounted cabinets along ONE WALL ONLY, compact appliances in a row, linear counter space, NO ISLAND NO PENINSULA EVER",
            'medium': "single-wall galley kitchen layout with appliances in a line, NO KITCHEN ISLAND ALLOWED, compact linear design against one wall, efficient narrow counter space" if room_width and room_width < 3.7 else "kitchen island with 3-4 bar stools, standard appliances, ample counter space",
            'large': "large kitchen island with 6+ stools, professional-grade appliances, multiple work zones, pantry area"
        },
        'living-room': {
            'small': "loveseat or small sectional, compact coffee table, wall-mounted TV, minimal side tables",
            'medium': "full-size sofa with coffee table, side chairs, floor lamps, entertainment center",
            'large': "large sectional or multiple seating areas, oversized coffee table, multiple side tables, floor lamps, large entertainment center"
        },
        'bedroom': {
            'small': "queen bed with compact nightstands, wall-mounted storage, small dresser",
            'medium': "king bed with full nightstands, dresser, accent chair, full-length mirror",
            'large': "king bed with large nightstands, multiple dressers, sitting area with chairs, walk-in closet area"
        },
        'dining-room': {
            'small': "4-person dining table with chairs, wall-mounted buffet or small sideboard",
            'medium': "6-8 person dining table with chairs, buffet/sideboard, china cabinet",
            'large': "8-12 person dining table with chairs, large buffet, china cabinet, additional seating area"
        },
        'home-office': {
            'small': "compact desk with built-in storage, wall-mounted shelves, ergonomic chair",
            'medium': "full-size desk with separate storage, bookshelf, office chair, reading chair",
            'large': "executive desk, multiple storage units, bookshelf wall, office chair, reading area with chairs"
        },
        'bathroom': {
            'small': "space-saving vanity, corner shower, wall-mounted storage",
            'medium': "standard vanity with storage, shower/tub combo, linen closet",
            'large': "double vanity, separate shower and soaking tub, extensive storage, seating area"
        }
    }
    
    base_description = scale_descriptions.get(scale_category, scale_descriptions['medium'])
    room_specific = room_specific_guidelines.get(room_type, {}).get(scale_category, "")
    
    furniture_prompt = base_description
    if room_specific:
        furniture_prompt += f", specifically: {room_specific}"
    
    # Add EXTREMELY explicit spatial constraints
    if spatial_constraints:
        furniture_prompt += f". CRITICAL REQUIREMENTS: {'; '.join(spatial_constraints)}"
    
    if layout_restrictions:
        furniture_prompt += f". MANDATORY LAYOUT: {'; '.join(layout_restrictions)}"
    
    # Add height considerations
    if room_height:
        if room_height < 2.4:  # Less than 2.4m (8ft)
            furniture_prompt += ", keep furniture low-profile to maintain ceiling proportions"
        elif room_height > 3.0:  # Greater than 3m (10ft)
            furniture_prompt += ", include tall furniture and vertical elements to complement high ceilings"
    
    # Add VERY explicit measurements reminder with consequences
    if room_width:
        if room_width < 3.0:
            furniture_prompt += f". SPATIAL REALITY CHECK: room is ONLY {room_width:.1f}m wide - kitchen islands require 3.7m+ MINIMUM - IMPOSSIBLE TO FIT"
        else:
            furniture_prompt += f". REMEMBER: room is {room_width:.1f}m wide - design accordingly"
    
    return furniture_prompt

def create_measurement_context(measurements):
    """Create measurement context string for AI prompts"""
    if not measurements:
        return "", ""
    
    measurement_details = []
    scale_info = analyze_room_scale(measurements)
    
    # Group measurements by type
    wall_measurements = [m for m in measurements if m.get('type') == 'wall']
    furniture_spaces = [m for m in measurements if m.get('type') == 'furniture']
    ceiling_heights = [m for m in measurements if m.get('type') == 'ceiling']
    counter_depths = [m for m in measurements if m.get('type') == 'counter']
    
    if wall_measurements:
        wall_dims = []
        for m in wall_measurements:
            dim = m.get('dimension', {})
            wall_dims.append(f"{dim.get('value')}{dim.get('unit')}")
        measurement_details.append(f"wall dimensions: {', '.join(wall_dims)}")
    
    if ceiling_heights:
        ceiling_dims = []
        for m in ceiling_heights:
            dim = m.get('dimension', {})
            ceiling_dims.append(f"{dim.get('value')}{dim.get('unit')}")
        measurement_details.append(f"ceiling height: {', '.join(ceiling_dims)}")
    
    if furniture_spaces:
        furniture_dims = []
        for m in furniture_spaces:
            dim = m.get('dimension', {})
            furniture_dims.append(f"{dim.get('value')}{dim.get('unit')}")
        measurement_details.append(f"furniture spaces: {', '.join(furniture_dims)}")
    
    if counter_depths:
        counter_dims = []
        for m in counter_depths:
            dim = m.get('dimension', {})
            counter_dims.append(f"{dim.get('value')}{dim.get('unit')}")
        measurement_details.append(f"counter depth: {', '.join(counter_dims)}")
    
    measurement_context = ""
    scale_context = ""
    
    if measurement_details:
        measurement_context = f" Room measurements provided: {'; '.join(measurement_details)}."
        
        if scale_info and scale_info['has_measurements']:
            room_width = scale_info.get('room_width')
            
            # Enhanced scale context with spatial awareness
            base_scale_context = f" Generate {scale_info['scale_category']}-scale furniture with realistic proportions that fit these exact measurements. Ensure all furniture scales properly to the room dimensions and maintains appropriate spacing."
            
            # Add critical spatial warnings
            spatial_warnings = []
            if room_width and room_width < 3.0:  # Less than 3m
                spatial_warnings.append("CRITICAL: Room is very narrow (under 3m) - absolutely NO kitchen islands or large furniture pieces")
            elif room_width and room_width < 3.7:  # Less than 3.7m
                spatial_warnings.append("WARNING: Limited width space - avoid kitchen islands, use galley or L-shaped layouts only")
            
            if spatial_warnings:
                scale_context = f"{base_scale_context} {' '.join(spatial_warnings)}. Prioritize space efficiency and realistic spatial constraints."
            else:
                scale_context = base_scale_context
    
    return measurement_context, scale_context

# Legacy function for backward compatibility
def convert_to_feet(value, unit):
    """Convert measurements to feet for backward compatibility"""
    meters = convert_to_meters(value, unit)
    if meters is not None:
        return meters * 3.28084  # Convert meters to feet
    return None 