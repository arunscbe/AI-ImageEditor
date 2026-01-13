from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from enum import Enum


class ProviderFeature(str, Enum):
    GENERATE = "generate"
    EDIT = "edit"
    IMAGE_TO_IMAGE = "image_to_image"
    UPSCALE = "upscale"
    REMOVE_BACKGROUND = "remove_background"
    REPLACE_BACKGROUND = "replace_background"
    VECTORIZE = "vectorize"
    INPAINTING = "inpainting"
    OUTPAINTING = "outpainting"
    STYLE_TRANSFER = "style_transfer"


class BaseImageProvider(ABC):
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url
        self._client = None
    
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass
    
    @abstractmethod
    def get_supported_features(self) -> List[ProviderFeature]:
        pass
    
    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        pass
    
    async def edit_image(
        self,
        image_url: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support image editing"
        )
    
    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support image-to-image"
        )
    
    async def upscale_image(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support upscaling"
        )
    
    async def remove_background(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support background removal"
        )
    
    async def replace_background(
        self,
        image_url: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support background replacement"
        )
    
    async def vectorize_image(
        self,
        image_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support vectorization"
        )
    
    async def inpaint(
        self,
        image_url: str,
        mask_url: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        raise NotImplementedError(
            f"{self.provider_name} does not support inpainting"
        )
    
    def normalize_response(self, response: Any) -> Dict[str, Any]:
        return {
            "provider": self.provider_name,
            "data": response
        }
    
    def supports_feature(self, feature: ProviderFeature) -> bool:
        return feature in self.get_supported_features()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client and hasattr(self._client, 'aclose'):
            await self._client.aclose()


