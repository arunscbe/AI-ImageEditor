import httpx
from typing import Dict, Any, List, Optional
from .base_provider import BaseImageProvider, ProviderFeature
import base64
from io import BytesIO
from PIL import Image


class OpenAIProvider(BaseImageProvider):
    
    DEFAULT_BASE_URL = "https://api.openai.com/v1"
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.DEFAULT_BASE_URL)
        self._client = httpx.AsyncClient(
            timeout=120.0,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
    
    @property
    def provider_name(self) -> str:
        return "openai"
    
    def get_supported_features(self) -> List[ProviderFeature]:
        return [
            ProviderFeature.GENERATE,
            ProviderFeature.EDIT,
            ProviderFeature.IMAGE_TO_IMAGE,
        ]
    
    async def generate_image(
        self,
        prompt: str,
        model: str = "dall-e-3",
        size: str = "1024x1024",
        quality: str = "standard",
        n: int = 1,
        style: str = "embroidery",
        leather_color: str = None,
        ink_color: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        
        STYLE_SUFFIXES = {
            "embroidery": ", embroidered patch style with stitched thread texture and flat colors",
            "leather": f", leather patch with {leather_color or 'natural leather'} color and {ink_color or 'debossed'} finish",
            "screen_print": ", screen print style with flat solid colors and high contrast",
            "woven": ", woven label style with interlaced thread pattern",
            "sublimation": ", sublimation print style with vibrant full color",
            "pvc": ", PVC rubber patch style with 3D raised texture"
        }
        
        style_suffix = STYLE_SUFFIXES.get(style, "")
        enhanced_prompt = f"{prompt}{style_suffix}"
        
        if model == "dall-e-3":
            n = 1
            valid_sizes = ["1024x1024", "1792x1024", "1024x1792"]
        else:
            valid_sizes = ["256x256", "512x512", "1024x1024"]
        
        if size not in valid_sizes:
            size = "1024x1024"
        
        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={
                "model": model,
                "prompt": enhanced_prompt,
                "n": n,
                "size": size,
                "quality": quality if model == "dall-e-3" else None,
                "response_format": "url",
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [
                {
                    "url": img["url"],
                    "revised_prompt": img.get("revised_prompt")
                }
                for img in data.get("data", [])
            ],
            "model": model
        })
    
    async def edit_image(
        self,
        image_url: str,
        prompt: str,
        mask_url: Optional[str] = None,
        model: str = "dall-e-2",
        size: str = "1024x1024",
        n: int = 1,
        style: str = "embroidery",
        **kwargs
    ) -> Dict[str, Any]:
        
        image_bytes = await self._download_image(image_url)
        processed_image = self._process_image_for_openai(image_bytes, size)
        
        files = {
            "image": ("image.png", processed_image, "image/png"),
            "prompt": (None, prompt),
            "n": (None, str(n)),
            "size": (None, size),
        }
        
        if mask_url:
            mask_bytes = await self._download_image(mask_url)
            processed_mask = self._process_image_for_openai(mask_bytes, size)
            files["mask"] = ("mask.png", processed_mask, "image/png")
        
        response = await self._client.post(
            f"{self.base_url}/images/edits",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files=files
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img["url"]} for img in data.get("data", [])],
            "model": model
        })
    
    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        
        return await self.edit_image(image_url, prompt, **kwargs)
    
    async def create_variation(
        self,
        image_url: str,
        n: int = 1,
        size: str = "1024x1024",
        **kwargs
    ) -> Dict[str, Any]:
        
        image_bytes = await self._download_image(image_url)
        processed_image = self._process_image_for_openai(image_bytes, size)
        
        files = {
            "image": ("image.png", processed_image, "image/png"),
            "n": (None, str(n)),
            "size": (None, size),
        }
        
        response = await self._client.post(
            f"{self.base_url}/images/variations",
            headers={"Authorization": f"Bearer {self.api_key}"},
            files=files
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img["url"]} for img in data.get("data", [])]
        })
    
    def _process_image_for_openai(self, image_bytes: bytes, target_size: str = "1024x1024") -> bytes:
        img = Image.open(BytesIO(image_bytes))
        
        width, height = map(int, target_size.split('x'))
        
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        if img.size[0] != width or img.size[1] != height:
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        output = BytesIO()
        img.save(output, format='PNG')
        output.seek(0)
        
        if output.getbuffer().nbytes > 4 * 1024 * 1024:
            output = BytesIO()
            img.save(output, format='PNG', optimize=True, compress_level=9)
            output.seek(0)
        
        return output.getvalue()
    
    async def _download_image(self, url: str) -> bytes:
        response = await self._client.get(url)
        response.raise_for_status()
        return response.content

