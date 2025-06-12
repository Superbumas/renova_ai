import logging
import cv2
import numpy as np
from PIL import Image as PILImage
from typing import Optional
import io
import base64

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Service for handling image processing operations"""
    
    def __init__(self):
        logger.info("ImageProcessor initialized")
    
    def create_minimal_preservation_mask(self, img_array: np.ndarray) -> np.ndarray:
        """
        Create a minimal mask that only preserves essential structural elements
        Returns a mask where WHITE = preserve (don't modify), BLACK = modify
        Used only for very conservative AI intensity (<=0.3)
        """
        try:
            # Convert to grayscale for edge detection
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            height, width = gray.shape
            
            # Create base mask (start with all black = modifiable)
            mask = np.zeros((height, width), dtype=np.uint8)
            
            # Only preserve absolute minimal boundaries - much less aggressive
            boundary_thickness = 15  # Reduced from 30
            
            # Only preserve thin window frames (if detectable)
            # Top boundary (potential window area) - much thinner
            mask[0:boundary_thickness, :] = 255
            # Bottom boundary - minimal  
            mask[height-boundary_thickness:height, :] = 255
            # Side boundaries - minimal
            mask[:, 0:boundary_thickness] = 255
            mask[:, width-boundary_thickness:width] = 255
            
            logger.info(f"Minimal preservation mask created - very conservative preservation")
            return mask
            
        except Exception as e:
            logger.error(f"Error creating minimal mask: {str(e)}")
            # Emergency fallback - preserve only edges
            height, width = img_array.shape[:2]
            mask = np.zeros((height, width), dtype=np.uint8)
            
            # Only preserve edges
            mask[0:10, :] = 255  # Top edge - minimal
            mask[height-10:height, :] = 255  # Bottom edge - minimal
            mask[:, 0:10] = 255  # Left edge - minimal
            mask[:, width-10:width] = 255  # Right edge - minimal
            
            logger.info("Using emergency minimal fallback mask")
            return mask
    
    def create_structural_preservation_mask(self, img_array: np.ndarray) -> np.ndarray:
        """
        Create a mask that preserves structural elements (windows, doors, walls)
        Returns a mask where WHITE = preserve (don't modify), BLACK = modify
        """
        try:
            # Convert to grayscale for edge detection
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            height, width = gray.shape
            
            # Create base mask (start with all black = modifiable)
            mask = np.zeros((height, width), dtype=np.uint8)
            
            # Simple structural preservation - preserve boundaries and upper areas
            boundary_thickness = 30
            
            # Top boundary (windows typically here)
            mask[0:boundary_thickness*2, :] = 255
            # Bottom boundary  
            mask[height-boundary_thickness:height, :] = 255
            # Left boundary
            mask[:, 0:boundary_thickness] = 255
            # Right boundary
            mask[:, width-boundary_thickness:width] = 255
            
            # Preserve upper 30% of image (typical window area)
            mask[0:int(height*0.3), :] = 255
            
            logger.info(f"Structural mask created with boundary preservation")
            return mask
            
        except Exception as e:
            logger.error(f"Error creating structural mask: {str(e)}")
            # Emergency fallback - preserve upper portion
            height, width = img_array.shape[:2]
            mask = np.zeros((height, width), dtype=np.uint8)
            
            # Preserve top 40% (windows) and edges
            mask[0:int(height*0.4), :] = 255
            mask[0:30, :] = 255  # Top edge
            mask[height-30:height, :] = 255  # Bottom edge
            mask[:, 0:30] = 255  # Left edge
            mask[:, width-30:width] = 255  # Right edge
            
            logger.info("Using emergency fallback mask")
            return mask
    
    def process_image_for_ai(self, image_path: str, ai_intensity: float) -> dict:
        """
        Process image based on AI intensity level
        Returns processing parameters and any generated masks
        """
        try:
            # Load image
            original_image = PILImage.open(image_path)
            img_array = np.array(original_image)
            
            processing_info = {
                'image_size': original_image.size,
                'mode': 'img2img',  # Default to img2img
                'mask_path': None,
                'strength_adjustment': 1.0
            }
            
            # Only use inpainting for very low AI intensity
            if ai_intensity <= 0.3:
                logger.info("Creating preservation mask for low AI intensity")
                
                # Create conservative mask
                mask = self.create_minimal_preservation_mask(img_array)
                
                # Save mask
                mask_filename = image_path.replace('.png', '_mask.png').replace('.jpg', '_mask.png')
                mask_pil = PILImage.fromarray(mask)
                mask_pil.save(mask_filename)
                
                processing_info.update({
                    'mode': 'inpainting',
                    'mask_path': mask_filename,
                    'strength_adjustment': 0.8  # Reduce strength for inpainting
                })
                
                logger.info(f"Inpainting mask saved to: {mask_filename}")
            
            else:
                logger.info("Using pure img2img for medium/high AI intensity")
                processing_info['strength_adjustment'] = 1.0 + (ai_intensity - 0.3) * 0.5  # Boost strength
            
            return processing_info
            
        except Exception as e:
            logger.error(f"Error processing image for AI: {str(e)}")
            return {
                'image_size': (512, 512),
                'mode': 'img2img',
                'mask_path': None,
                'strength_adjustment': 1.0,
                'error': str(e)
            }
    
    def enhance_image_quality(self, image_path: str, target_size: tuple = (1024, 1024)) -> str:
        """
        Enhance image quality by resizing and optimizing
        Returns path to enhanced image
        """
        try:
            image = PILImage.open(image_path)
            
            # Resize if needed
            if image.size != target_size:
                image = image.resize(target_size, PILImage.Resampling.LANCZOS)
            
            # Enhance image
            enhanced_path = image_path.replace('.png', '_enhanced.png').replace('.jpg', '_enhanced.png')
            image.save(enhanced_path, quality=95, optimize=True)
            
            logger.info(f"Image enhanced and saved to: {enhanced_path}")
            return enhanced_path
            
        except Exception as e:
            logger.error(f"Error enhancing image: {str(e)}")
            return image_path  # Return original path if enhancement fails
    
    def validate_image_format(self, image_path: str) -> bool:
        """Validate that the image is in a supported format"""
        try:
            with PILImage.open(image_path) as img:
                # Check if it's a valid image
                img.verify()
                return True
        except Exception as e:
            logger.error(f"Invalid image format: {str(e)}")
            return False
    
    def get_image_info(self, image_path: str) -> dict:
        """Get detailed information about an image"""
        try:
            with PILImage.open(image_path) as img:
                return {
                    'size': img.size,
                    'mode': img.mode,
                    'format': img.format,
                    'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info
                }
        except Exception as e:
            logger.error(f"Error getting image info: {str(e)}")
            return {
                'size': (0, 0),
                'mode': 'unknown',
                'format': 'unknown',
                'has_transparency': False,
                'error': str(e)
            }
    
    def process_image(self, image):
        """
        Process the input image for AI generation.
        Returns the processed image as a base64 string.
        """
        try:
            # Convert image to RGB if it's not
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image if needed (maintain aspect ratio)
            max_size = 1024
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                image = image.resize(new_size, PILImage.Resampling.LANCZOS)
            
            # Convert to base64
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise 