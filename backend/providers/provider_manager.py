from typing import Dict, List, Optional, Any
import os
from dotenv import load_dotenv
from .base_provider import BaseImageProvider, ProviderFeature
from .recraft_provider import RecraftProvider
from .openai_provider import OpenAIProvider
from .replicate_provider import ReplicateProvider
from .google_imagen_provider import GoogleImagenProvider
from .gemini_provider import GeminiProvider

load_dotenv()


class ProviderManager:
    
    def __init__(self):
        self.providers: Dict[str, BaseImageProvider] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        if os.getenv("RECRAFT_API_KEY"):
            try:
                self.providers["recraft"] = RecraftProvider(
                    api_key=os.getenv("RECRAFT_API_KEY"),
                    base_url=os.getenv("RECRAFT_URL")
                )
            except Exception as e:
                print(f"Failed to initialize Recraft provider: {e}")
        
        if os.getenv("OPENAI_API_KEY"):
            try:
                self.providers["openai"] = OpenAIProvider(
                    api_key=os.getenv("OPENAI_API_KEY")
                )
            except Exception as e:
                print(f"Failed to initialize OpenAI provider: {e}")
        
        if os.getenv("REPLICATE_API_KEY"):
            try:
                self.providers["replicate"] = ReplicateProvider(
                    api_key=os.getenv("REPLICATE_API_KEY")
                )
            except Exception as e:
                print(f"Failed to initialize Replicate provider: {e}")
        
        if os.getenv("GEMINI_API_KEY"):
            try:
                self.providers["gemini"] = GeminiProvider(
                    api_key=os.getenv("GEMINI_API_KEY")
                )
                print("Gemini provider initialized (Google AI Studio quality)")
            except Exception as e:
                print(f"Failed to initialize Gemini provider: {e}")
        
        if os.getenv("GOOGLE_PROJECT_ID"):
            try:
                self.providers["google-imagen"] = GoogleImagenProvider(
                    project_id=os.getenv("GOOGLE_PROJECT_ID"),
                    location=os.getenv("GOOGLE_LOCATION", "us-central1"),
                    credentials_path=os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
                )
                print("Google Imagen (Vertex AI) provider initialized - DEPRECATED, use 'gemini' instead")
            except Exception as e:
                print(f"Failed to initialize Google Imagen provider: {e}")
    
    def get_provider(self, name: str) -> Optional[BaseImageProvider]:
        provider = self.providers.get(name.lower())
        if not provider:
            raise ValueError(
                f"Provider '{name}' not found. Available providers: {list(self.providers.keys())}"
            )
        return provider
    
    def list_providers(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": name,
                "features": [f.value for f in provider.get_supported_features()],
                "available": True
            }
            for name, provider in self.providers.items()
        ]
    
    def get_providers_by_feature(self, feature: ProviderFeature) -> List[str]:
        return [
            name
            for name, provider in self.providers.items()
            if provider.supports_feature(feature)
        ]
    
    async def generate_image(
        self,
        prompt: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.GENERATE):
            raise ValueError(
                f"Provider '{provider}' does not support image generation"
            )
        
        return await provider_instance.generate_image(prompt, **kwargs)
    
    async def edit_image(
        self,
        image_url: str,
        prompt: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.EDIT):
            raise ValueError(
                f"Provider '{provider}' does not support image editing"
            )
        
        return await provider_instance.edit_image(image_url, prompt, **kwargs)
    
    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.IMAGE_TO_IMAGE):
            raise ValueError(
                f"Provider '{provider}' does not support image-to-image"
            )
        
        return await provider_instance.image_to_image(image_url, prompt, **kwargs)
    
    async def upscale_image(
        self,
        image_url: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.UPSCALE):
            raise ValueError(
                f"Provider '{provider}' does not support upscaling"
            )
        
        return await provider_instance.upscale_image(image_url, **kwargs)
    
    async def remove_background(
        self,
        image_url: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.REMOVE_BACKGROUND):
            raise ValueError(
                f"Provider '{provider}' does not support background removal"
            )
        
        return await provider_instance.remove_background(image_url, **kwargs)
    
    async def replace_background(
        self,
        image_url: str,
        prompt: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.REPLACE_BACKGROUND):
            raise ValueError(
                f"Provider '{provider}' does not support background replacement"
            )
        
        return await provider_instance.replace_background(image_url, prompt, **kwargs)
    
    async def vectorize_image(
        self,
        image_url: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.VECTORIZE):
            raise ValueError(
                f"Provider '{provider}' does not support vectorization"
            )
        
        return await provider_instance.vectorize_image(image_url, **kwargs)
    
    async def inpaint(
        self,
        image_url: str,
        mask_url: str,
        prompt: str,
        provider: str = "recraft",
        **kwargs
    ) -> Dict[str, Any]:
        provider_instance = self.get_provider(provider)
        
        if not provider_instance.supports_feature(ProviderFeature.INPAINTING):
            raise ValueError(
                f"Provider '{provider}' does not support inpainting"
            )
        
        return await provider_instance.inpaint(image_url, mask_url, prompt, **kwargs)
    
    def get_best_provider_for_feature(
        self,
        feature: ProviderFeature,
        preferred: Optional[List[str]] = None
    ) -> Optional[str]:
        available = self.get_providers_by_feature(feature)
        
        if not available:
            return None
        
        if preferred:
            for pref in preferred:
                if pref in available:
                    return pref
        
        return available[0]


provider_manager = ProviderManager()

