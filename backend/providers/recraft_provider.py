import httpx
from typing import Dict, Any, List, Optional
from .base_provider import BaseImageProvider, ProviderFeature


class RecraftProvider(BaseImageProvider):
    
    DEFAULT_BASE_URL = "https://external.api.recraft.ai/v1"
    
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
        return "recraft"
    
    def get_supported_features(self) -> List[ProviderFeature]:
        return [
            ProviderFeature.GENERATE,
            ProviderFeature.IMAGE_TO_IMAGE,
            ProviderFeature.UPSCALE,
            ProviderFeature.REMOVE_BACKGROUND,
            ProviderFeature.REPLACE_BACKGROUND,
            ProviderFeature.VECTORIZE,
        ]
    
    async def generate_image(
        self,
        prompt: str,
        style: str = "realistic_image",
        size: str = "1024x1024",
        model: str = "recraftv3",
        n: int = 1,
        leather_color: str = None,
        ink_color: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        
        if style in ["embroidery", "leather", "screen_print", "woven", "sublimation", "pvc"]:
            style = "realistic_image"
        
        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={
                "prompt": prompt,
                "style": style,
                "size": size,
                "model": model,
                "n": n,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img.get("url")} for img in data.get("data", [])],
            "model": model,
            "style": style
        })
    
    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        style: str = "realistic_image",
        size: str = "1024x1024",
        model: str = "recraftv3",
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/generations",
            json={
                "prompt": prompt,
                "style": style,
                "size": size,
                "model": model,
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img.get("url")} for img in data.get("data", [])]
        })
    
    async def upscale_image(
        self,
        image_url: str,
        upscale_type: str = "crisp",
        **kwargs
    ) -> Dict[str, Any]:
        
        valid_types = ["crisp", "creative"]
        if upscale_type not in valid_types:
            raise ValueError(f"upscale_type must be one of {valid_types}")
        
        response = await self._client.post(
            f"{self.base_url}/images/{upscale_type}_upscale",
            json={
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": data.get("data", {}).get("url")}],
            "upscale_type": upscale_type
        })
    
    async def remove_background(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/removeBackground",
            json={
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": data.get("data", {}).get("url")}]
        })
    
    async def replace_background(
        self,
        image_url: str,
        prompt: str,
        style: str = "realistic_image",
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/replaceBackground",
            json={
                "image_url": image_url,
                "prompt": prompt,
                "style": style,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": img.get("url")} for img in data.get("data", [])]
        })
    
    async def vectorize_image(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        response = await self._client.post(
            f"{self.base_url}/images/vectorize",
            json={
                "image_url": image_url,
                **kwargs
            }
        )
        response.raise_for_status()
        data = response.json()
        
        return self.normalize_response({
            "images": [{"url": data.get("data", {}).get("url")}]
        })

