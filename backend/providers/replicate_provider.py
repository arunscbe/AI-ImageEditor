import httpx
import asyncio
from typing import Dict, Any, List, Optional
from .base_provider import BaseImageProvider, ProviderFeature


class ReplicateProvider(BaseImageProvider):
    
    DEFAULT_BASE_URL = "https://api.replicate.com/v1"
    
    MODELS = {
        "flux-schnell": "black-forest-labs/flux-schnell",
        "flux-dev": "black-forest-labs/flux-dev",
        "flux-pro": "black-forest-labs/flux-1.1-pro",
        "sdxl": "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "sdxl-lightning": "bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637",
        "playground-v2.5": "playgroundai/playground-v2.5-1024px-aesthetic:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
        "real-esrgan-upscale": "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
        "instruct-pix2pix": "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
    }
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        super().__init__(api_key, base_url or self.DEFAULT_BASE_URL)
        self._client = httpx.AsyncClient(
            timeout=180.0,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
        )
    
    @property
    def provider_name(self) -> str:
        return "replicate"
    
    def get_supported_features(self) -> List[ProviderFeature]:
        return [
            ProviderFeature.GENERATE,
            ProviderFeature.IMAGE_TO_IMAGE,
            ProviderFeature.UPSCALE,
            ProviderFeature.EDIT,
        ]
    
    async def generate_image(
        self,
        prompt: str,
        model: str = "flux-schnell",
        width: int = 1024,
        height: int = 1024,
        num_outputs: int = 1,
        **kwargs
    ) -> Dict[str, Any]:
        
        model_version = self.MODELS.get(model, self.MODELS["flux-schnell"])
        
        input_data = {
            "prompt": prompt,
            "num_outputs": num_outputs,
        }
        
        if "flux" in model:
            input_data.update({
                "aspect_ratio": kwargs.get("aspect_ratio", "1:1"),
                "output_format": "png",
                "output_quality": kwargs.get("output_quality", 80),
            })
        elif "sdxl" in model:
            input_data.update({
                "width": width,
                "height": height,
                "num_inference_steps": kwargs.get("num_inference_steps", 4 if "lightning" in model else 50),
                "guidance_scale": kwargs.get("guidance_scale", 7.5),
            })
        
        response = await self._client.post(
            f"{self.base_url}/predictions",
            json={
                "version": model_version,
                "input": input_data
            }
        )
        response.raise_for_status()
        prediction = response.json()
        
        result = await self._poll_prediction(prediction["id"])
        
        if result["status"] == "succeeded":
            output = result["output"]
            if not isinstance(output, list):
                output = [output]
            
            return self.normalize_response({
                "images": [{"url": url} for url in output if url],
                "model": model
            })
        else:
            raise Exception(f"Generation failed: {result.get('error')}")
    
    async def image_to_image(
        self,
        image_url: str,
        prompt: str,
        model: str = "instruct-pix2pix",
        **kwargs
    ) -> Dict[str, Any]:
        
        if model == "instruct-pix2pix":
            model_version = self.MODELS["instruct-pix2pix"]
            input_data = {
                "image": image_url,
                "prompt": prompt,
                "num_inference_steps": kwargs.get("num_inference_steps", 20),
                "guidance_scale": kwargs.get("guidance_scale", 7.5),
                "image_guidance_scale": kwargs.get("image_guidance_scale", 1.5),
            }
        else:
            model_version = self.MODELS.get(model, self.MODELS["flux-schnell"])
            input_data = {
                "prompt": prompt,
                "image": image_url,
                "prompt_strength": kwargs.get("prompt_strength", 0.8),
            }
        
        response = await self._client.post(
            f"{self.base_url}/predictions",
            json={
                "version": model_version,
                "input": input_data
            }
        )
        response.raise_for_status()
        prediction = response.json()
        
        result = await self._poll_prediction(prediction["id"])
        
        if result["status"] == "succeeded":
            output = result["output"]
            if not isinstance(output, list):
                output = [output]
            
            return self.normalize_response({
                "images": [{"url": url} for url in output if url],
                "model": model
            })
        else:
            raise Exception(f"Image-to-image failed: {result.get('error')}")
    
    async def upscale_image(
        self,
        image_url: str,
        scale: int = 4,
        face_enhance: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        
        model_version = self.MODELS["real-esrgan-upscale"]
        
        response = await self._client.post(
            f"{self.base_url}/predictions",
            json={
                "version": model_version,
                "input": {
                    "image": image_url,
                    "scale": scale,
                    "face_enhance": face_enhance,
                }
            }
        )
        response.raise_for_status()
        prediction = response.json()
        
        result = await self._poll_prediction(prediction["id"])
        
        if result["status"] == "succeeded":
            output = result["output"]
            return self.normalize_response({
                "images": [{"url": output}],
                "scale": scale
            })
        else:
            raise Exception(f"Upscale failed: {result.get('error')}")
    
    async def _poll_prediction(
        self,
        prediction_id: str,
        max_wait: int = 180,
        poll_interval: float = 1.0
    ) -> Dict[str, Any]:
        
        start_time = asyncio.get_event_loop().time()
        
        while True:
            response = await self._client.get(
                f"{self.base_url}/predictions/{prediction_id}"
            )
            response.raise_for_status()
            prediction = response.json()
            
            status = prediction["status"]
            
            if status == "succeeded":
                return prediction
            elif status == "failed":
                raise Exception(f"Prediction failed: {prediction.get('error')}")
            elif status == "canceled":
                raise Exception("Prediction was canceled")
            
            elapsed = asyncio.get_event_loop().time() - start_time
            if elapsed > max_wait:
                raise TimeoutError(f"Prediction timed out after {max_wait} seconds")
            
            await asyncio.sleep(poll_interval)
    
    def get_available_models(self) -> List[str]:
        return list(self.MODELS.keys())


