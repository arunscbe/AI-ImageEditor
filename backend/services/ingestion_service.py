"""
Ingestion Service
Handles file uploads and routes them appropriately:
- PNG/JPG → Optional Recraft vectorization
- PDF/AI → Inkscape conversion to SVG
"""
from typing import Dict, Any, Optional
import os
from pathlib import Path
import httpx
from .image_operations import image_operations
from utils.image_storage import save_uploaded_file, get_image_url


class IngestionService:
    """
    Simplified ingestion pipeline (NO flattening step)
    
    Flow:
    1. Detect file type
    2. Route appropriately:
       - Raster (PNG/JPG) → Optional vectorization
       - Vector (PDF/AI) → Inkscape conversion
    3. Return result
    """
    
    RASTER_FORMATS = {".png", ".jpg", ".jpeg", ".webp"}
    VECTOR_FORMATS = {".pdf", ".ai", ".eps"}
    
    @staticmethod
    async def process_upload(
        file_data: bytes,
        filename: str,
        vectorize: bool = True
    ) -> Dict[str, Any]:
        """
        Process uploaded file
        
        Args:
            file_data: Raw file bytes
            filename: Original filename
            vectorize: Whether to vectorize raster images
            
        Returns:
            Dict with processed file info
        """
        file_ext = Path(filename).suffix.lower()
        
        # Save the uploaded file first
        filepath = save_uploaded_file(file_data, filename)
        file_url = get_image_url(filepath)
        
        result = {
            "original_url": file_url,
            "original_format": file_ext,
            "processed": False
        }
        
        # Route based on file type
        if file_ext in IngestionService.RASTER_FORMATS:
            return await IngestionService._process_raster(file_url, vectorize, result)
        
        elif file_ext in IngestionService.VECTOR_FORMATS:
            return await IngestionService._process_vector(file_url, result)
        
        else:
            result["error"] = f"Unsupported file format: {file_ext}"
            return result
    
    @staticmethod
    async def _process_raster(
        file_url: str,
        vectorize: bool,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process raster images (PNG/JPG)"""
        
        if vectorize:
            # Direct vectorization with Recraft (no flattening)
            try:
                vectorize_result = await image_operations.vectorize(
                    image_url=file_url,
                    provider="recraft"
                )
                
                # Extract SVG URL from result
                svg_url = None
                if vectorize_result.get("data", {}).get("images"):
                    svg_url = vectorize_result["data"]["images"][0].get("url")
                elif vectorize_result.get("images"):
                    svg_url = vectorize_result["images"][0].get("url")
                
                result.update({
                    "svg_url": svg_url,
                    "vectorized": True,
                    "processed": True,
                    "method": "recraft_vectorize"
                })
            except Exception as e:
                result.update({
                    "vectorized": False,
                    "error": f"Vectorization failed: {str(e)}"
                })
        else:
            # Return as-is
            result.update({
                "vectorized": False,
                "processed": True,
                "message": "Raster image uploaded without vectorization"
            })
        
        return result
    
    @staticmethod
    async def _process_vector(
        file_url: str,
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process vector files (PDF/AI)"""
        
        try:
            # Convert using Inkscape service
            conversion_result = await image_operations.convert_pdf_ai_to_svg(file_url)
            
            result.update({
                "svg_url": conversion_result.get("svg_url"),
                "converted": True,
                "processed": True,
                "method": "inkscape_convert",
                "conversion_service": conversion_result.get("conversion_service")
            })
        except Exception as e:
            result.update({
                "converted": False,
                "error": f"Conversion failed: {str(e)}",
                "message": "Make sure IMAGE_CONVERSION_URL is configured"
            })
        
        return result


# Singleton instance
ingestion_service = IngestionService()
