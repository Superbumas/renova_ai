import re
import requests
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

def extract_number(value, default=60):
    """Extract numeric value from string, return default in cm if not found"""
    if isinstance(value, (int, float)):
        return value
    
    if isinstance(value, str):
        # Remove common prefixes/suffixes and extract number
        numbers = re.findall(r'\d+(?:\.\d+)?', value.replace(',', '.'))
        if numbers:
            return float(numbers[0])
    
    return default

def extract_pinterest_image_url(pinterest_url):
    """
    Extract direct image URL from Pinterest page URL
    Converts https://pinterest.com/pin/123456/ to https://i.pinimg.com/564x/...jpg
    """
    try:
        # Check if it's already a direct image URL
        if 'i.pinimg.com' in pinterest_url:
            return pinterest_url
            
        # Check if it's a Pinterest page URL
        if 'pinterest.com/pin/' in pinterest_url:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(pinterest_url, headers=headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for the main image in various possible locations
                img_selectors = [
                    'img[data-test-id="pin-closeup-image"]',
                    'img[data-test-id="visual-content-container"]', 
                    'div[data-test-id="visual-content-container"] img',
                    'img[alt*="Pin"]',
                    'img[src*="i.pinimg.com"]'
                ]
                
                for selector in img_selectors:
                    img_element = soup.select_one(selector)
                    if img_element and img_element.get('src'):
                        src = img_element.get('src')
                        if 'i.pinimg.com' in src:
                            logger.info(f"Extracted Pinterest image URL: {src}")
                            return src
                
                # Fallback: look for any Pinterest image URL in the page
                all_imgs = soup.find_all('img')
                for img in all_imgs:
                    src = img.get('src', '')
                    if 'i.pinimg.com' in src and any(ext in src for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                        logger.info(f"Found Pinterest image URL: {src}")
                        return src
        
        return None
        
    except Exception as e:
        logger.error(f"Error extracting Pinterest image URL: {e}")
        return None

def create_measurement_context(measurements):
    """
    Create measurement context from user measurements
    """
    try:
        if not measurements or len(measurements) == 0:
            return "", ""
        
        measurement_text = []
        scale_info = []
        
        for measurement in measurements:
            if measurement.get('type') == 'wall':
                dimension = measurement.get('dimension', {})
                value = dimension.get('value', 0)
                unit = dimension.get('unit', 'ft')
                
                measurement_text.append(f"Wall: {value}{unit}")
                scale_info.append(f"Wall measurement: {value}{unit}")
        
        context = "; ".join(measurement_text) if measurement_text else ""
        scale = "; ".join(scale_info) if scale_info else ""
        
        return context, scale
        
    except Exception as e:
        logger.error(f"Error creating measurement context: {str(e)}")
        return "", ""

def validate_url(url):
    """Validate if a URL is properly formatted"""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return url_pattern.match(url) is not None

def sanitize_filename(filename):
    """Sanitize filename for safe file system usage"""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove any whitespace and replace with underscore
    filename = re.sub(r'\s+', '_', filename)
    # Limit length
    if len(filename) > 255:
        filename = filename[:255]
    return filename

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def convert_to_meters(value, unit):
    """Convert various units to meters"""
    if not value:
        return None
        
    try:
        value = float(value)
        
        if unit in ['m', 'meter', 'meters']:
            return value
        elif unit in ['cm', 'centimeter', 'centimeters']:
            return value / 100
        elif unit in ['ft', 'foot', 'feet']:
            return value * 0.3048
        elif unit in ['in', 'inch', 'inches']:
            return value * 0.0254
        else:
            # Default to meters if unit is unknown
            return value
            
    except (ValueError, TypeError):
        return None

def get_image_dimensions_text(width, height):
    """Generate human-readable text for image dimensions"""
    aspect_ratio = width / height if height != 0 else 1
    
    if abs(aspect_ratio - 1) < 0.1:
        orientation = "square"
    elif aspect_ratio > 1.2:
        orientation = "landscape"
    elif aspect_ratio < 0.8:
        orientation = "portrait"
    else:
        orientation = "roughly square"
    
    return f"{width}x{height} pixels ({orientation})"

def truncate_text(text, max_length=100, suffix="..."):
    """Truncate text to a maximum length with optional suffix"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix 