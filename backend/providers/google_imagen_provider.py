import httpx
import base64
from typing import Dict, Any, List, Optional
from .base_provider import BaseImageProvider, ProviderFeature
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import save_pil_image, get_image_url


class GoogleImagenProvider(BaseImageProvider):
    
    def __init__(
        self,
        project_id: str,
        location: str = "us-central1",
        credentials_path: Optional[str] = None
    ):
        super().__init__(api_key="", base_url=None)
        self.project_id = project_id
        self.location = location
        self.credentials_path = credentials_path
        self._setup_client()
    
    def _setup_client(self):
        try:
            from google.cloud import aiplatform
            from google.oauth2 import service_account
            
            if self.credentials_path:
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path
                )
                aiplatform.init(
                    project=self.project_id,
                    location=self.location,
                    credentials=credentials
                )
            else:
                aiplatform.init(
                    project=self.project_id,
                    location=self.location
                )
            
            self.aiplatform = aiplatform
            self._client = httpx.AsyncClient(timeout=120.0)
            
        except ImportError:
            raise ImportError(
                "google-cloud-aiplatform is required for Google Imagen. "
                "Install with: pip install google-cloud-aiplatform"
            )
    
    @property
    def provider_name(self) -> str:
        return "google-imagen"
    
    def get_supported_features(self) -> List[ProviderFeature]:
        return [
            ProviderFeature.GENERATE,
            ProviderFeature.EDIT,
            ProviderFeature.INPAINTING,
            ProviderFeature.OUTPAINTING,
            ProviderFeature.UPSCALE,
        ]
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        aspect_ratio: str = "1:1",
        number_of_images: int = 1,
        seed: Optional[int] = None,
        add_watermark: bool = False,
        safety_filter_level: str = "block_some",
        person_generation: str = "allow_adult",
        **kwargs
    ) -> Dict[str, Any]:
        
        from vertexai.preview.vision_models import ImageGenerationModel
        
        model = ImageGenerationModel.from_pretrained("imagen-3.0-generate-001")
        
        valid_ratios = ["1:1", "3:4", "4:3", "9:16", "16:9"]
        if aspect_ratio not in valid_ratios:
            aspect_ratio = "1:1"
        
        images = model.generate_images(
            prompt=prompt,
            negative_prompt=negative_prompt,
            number_of_images=number_of_images,
            aspect_ratio=aspect_ratio,
            seed=seed,
            add_watermark=add_watermark,
            safety_filter_level=safety_filter_level,
            person_generation=person_generation,
        )
        
        results = []
        for idx, img in enumerate(images.images):
            pil_image = img._pil_image if hasattr(img, '_pil_image') else None
            
            if not pil_image:
                img_bytes = img._image_bytes
                from PIL import Image
                from io import BytesIO
                pil_image = Image.open(BytesIO(img_bytes))
            
            filepath = save_pil_image(pil_image, prefix="final_")
            image_url = get_image_url(filepath)
            
            results.append({
                "url": image_url,
                "local_path": filepath
            })
        
        return self.normalize_response({
            "images": results,
            "model": "imagen-3.0",
            "aspect_ratio": aspect_ratio
        })
    
    async def edit_image(
        self,
        image_url: str,
        prompt: str,
        negative_prompt: Optional[str] = None,
        number_of_images: int = 1,
        seed: Optional[int] = None,
        guidance_scale: float = 100,
        style: str = "embroidery",
        **kwargs
    ) -> Dict[str, Any]:
        
        from vertexai.preview.vision_models import ImageGenerationModel, Image
        
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        
        image_bytes = await self._download_image(image_url)
        base_image = Image(image_bytes=image_bytes)
        
        images = model.edit_image(
            prompt=prompt,
            base_image=base_image,
            negative_prompt=negative_prompt,
            number_of_images=number_of_images,
            seed=seed,
            guidance_scale=guidance_scale,
            edit_mode="inpainting-insert",
        )
        
        results = []
        for idx, img in enumerate(images.images):
            pil_image = img._pil_image if hasattr(img, '_pil_image') else None
            
            if not pil_image:
                img_bytes = img._image_bytes
                from PIL import Image
                from io import BytesIO
                pil_image = Image.open(BytesIO(img_bytes))
            
            filepath = save_pil_image(pil_image, prefix="final_")
            image_url = get_image_url(filepath)
            
            results.append({
                "url": image_url,
                "local_path": filepath
            })
        
        return self.normalize_response({
            "images": results,
            "model": "imagen-3.0"
        })
    
    async def inpaint(
        self,
        image_url: str,
        mask_url: str,
        prompt: str,
        negative_prompt: Optional[str] = None,
        number_of_images: int = 1,
        seed: Optional[int] = None,
        **kwargs
    ) -> Dict[str, Any]:
        
        from vertexai.preview.vision_models import ImageGenerationModel, Image
        
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        
        image_bytes = await self._download_image(image_url)
        mask_bytes = await self._download_image(mask_url)
        
        base_image = Image(image_bytes=image_bytes)
        mask_image = Image(image_bytes=mask_bytes)
        
        images = model.edit_image(
            prompt=prompt,
            base_image=base_image,
            mask=mask_image,
            negative_prompt=negative_prompt,
            number_of_images=number_of_images,
            seed=seed,
        )
        
        results = []
        for img in images.images:
            img_bytes = img._pil_image.tobytes() if hasattr(img, '_pil_image') else img._image_bytes
            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            results.append({
                "url": f"data:image/png;base64,{img_b64}",
                "base64": img_b64
            })
        
        return self.normalize_response({
            "images": results,
            "model": "imagegeneration@006"
        })
    
    async def upscale_image(
        self,
        image_url: str,
        upscale_factor: str = "x2",
        **kwargs
    ) -> Dict[str, Any]:
        
        from vertexai.preview.vision_models import ImageGenerationModel, Image
        
        model = ImageGenerationModel.from_pretrained("imagegeneration@006")
        
        image_bytes = await self._download_image(image_url)
        base_image = Image(image_bytes=image_bytes)
        
        valid_factors = ["x2", "x4"]
        if upscale_factor not in valid_factors:
            upscale_factor = "x2"
        
        upscaled_image = model.upscale_image(
            image=base_image,
            upscale_factor=upscale_factor,
        )
        
        pil_image = upscaled_image._pil_image if hasattr(upscaled_image, '_pil_image') else None
        
        if not pil_image:
            img_bytes = upscaled_image._image_bytes
            from PIL import Image
            from io import BytesIO
            pil_image = Image.open(BytesIO(img_bytes))
        
        filepath = save_pil_image(pil_image, prefix="temp_")
        image_url = get_image_url(filepath)
        
        return self.normalize_response({
            "images": [{
                "url": image_url,
                "local_path": filepath
            }],
            "upscale_factor": upscale_factor
        })
    
    async def _download_image(self, url: str) -> bytes:
        if url.startswith("data:"):
            header, encoded = url.split(",", 1)
            return base64.b64decode(encoded)
        
        response = await self._client.get(url)
        response.raise_for_status()
        return response.content
    
    def get_available_models(self) -> List[str]:
        return [
            "imagen-3.0-generate-001",
            "imagen-3.0-fast-generate-001",
            "imagegeneration@006",
            "imagegeneration@005",
        ]

