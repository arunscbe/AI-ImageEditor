"""
Shared Image Operations Service
Used by both direct API endpoints and LLM function calling
"""
from typing import Dict, Any, Optional
import os
import httpx
import subprocess
import tempfile
from pathlib import Path
from providers.provider_manager import provider_manager


class ImageOperations:
    """Centralized image operations logic"""
    
    @staticmethod
    async def vectorize(image_url: str, provider: str = "recraft", **kwargs) -> Dict[str, Any]:
        """Vectorize a raster image to SVG"""
        return await provider_manager.vectorize_image(
            image_url=image_url,
            provider=provider,
            **kwargs
        )
    
    @staticmethod
    async def upscale(image_url: str, provider: str = "recraft", **kwargs) -> Dict[str, Any]:
        """Upscale an image to higher resolution"""
        return await provider_manager.upscale_image(
            image_url=image_url,
            provider=provider,
            **kwargs
        )
    
    @staticmethod
    async def remove_background(image_url: str, provider: str = "recraft", **kwargs) -> Dict[str, Any]:
        """Remove background from an image"""
        return await provider_manager.remove_background(
            image_url=image_url,
            provider=provider,
            **kwargs
        )
    
    @staticmethod
    async def erase_region(image_url: str, mask_url: str, **kwargs) -> Dict[str, Any]:
        """Erase a region from an image using a mask"""
        # This uses Recraft's eraseRegion endpoint
        # The actual implementation is in eraseRegion.py
        # For now, we'll call the provider directly
        from providers.recraft_provider import RecraftProvider
        
        recraft = provider_manager.get_provider("recraft")
        if not recraft:
            raise ValueError("Recraft provider not available for erase_region")
        
        # Download images
        async with httpx.AsyncClient() as client:
            image_response = await client.get(image_url)
            mask_response = await client.get(mask_url)
            
            image_response.raise_for_status()
            mask_response.raise_for_status()
            
            image_data = image_response.content
            mask_data = mask_response.content
        
        # Call Recraft API directly
        url = f"{recraft.base_url}/images/eraseRegion"
        headers = {"Authorization": f"Bearer {recraft.api_key}"}
        
        files = {
            "image": ("image.png", image_data, "image/png"),
            "mask": ("mask.png", mask_data, "image/png")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, files=files)
            response.raise_for_status()
            result = response.json()
        
        return {
            "provider": "recraft",
            "data": result
        }
    
    @staticmethod
    async def convert_pdf_ai_to_svg(file_url: str) -> Dict[str, Any]:
        """Convert PDF or AI file to SVG using Inkscape"""
        conversion_url = os.getenv("IMAGE_CONVERSION_URL")
        
        if not conversion_url:
            raise ValueError(
                "IMAGE_CONVERSION_URL not configured. "
                "Please set it in your .env file to enable PDF/AI conversion."
            )
        
        # Download the file
        async with httpx.AsyncClient(timeout=60.0) as client:
            file_response = await client.get(file_url)
            file_response.raise_for_status()
            file_data = file_response.content
        
        # Send to conversion service
        files = {"file": ("document.pdf", file_data, "application/pdf")}
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(conversion_url, files=files)
            response.raise_for_status()
            
            # Handle response - could be JSON with URL or direct SVG content
            content_type = response.headers.get("content-type", "")
            
            if "application/json" in content_type:
                result = response.json()
                svg_url = result.get("svg_url") or result.get("url")
                return {
                    "svg_url": svg_url,
                    "conversion_service": "inkscape"
                }
            elif "image/svg+xml" in content_type or "text/xml" in content_type:
                # Direct SVG content - save it
                from utils.image_storage import save_svg_content, get_image_url
                filepath = save_svg_content(response.content, prefix="final_")
                svg_url = get_image_url(filepath)
                return {
                    "svg_url": svg_url,
                    "conversion_service": "inkscape"
                }
            else:
                raise ValueError(f"Unexpected response type: {content_type}")


# Singleton instance
image_operations = ImageOperations()
