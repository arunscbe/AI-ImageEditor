# AI Image Editor - Provider System

This directory contains the multi-provider architecture for AI image generation and manipulation.

## Architecture

```
providers/
├── __init__.py              # Package exports
├── base_provider.py         # Abstract base class
├── recraft_provider.py      # Recraft AI implementation
├── openai_provider.py       # OpenAI DALL-E implementation
├── replicate_provider.py    # Replicate (Flux, SDXL) implementation
└── provider_manager.py      # Central provider management
```

## Supported Providers

### 1. **Recraft AI** (`recraft`)
- ✅ Generate images (realistic, digital art, vector)
- ✅ Image-to-image transformation
- ✅ Upscale (crisp & creative)
- ✅ Remove/replace background
- ✅ Vectorize images

**API Key**: Get from [recraft.ai/profile/api](https://www.recraft.ai/profile/api)

### 2. **OpenAI DALL-E** (`openai`)
- ✅ Generate images (DALL-E 2 & 3)
- ✅ Edit images with masks
- ✅ Create variations
- ❌ No upscaling
- ❌ No background removal

**API Key**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### 3. **Replicate** (`replicate`)
- ✅ Generate images (Flux, SDXL, Playground)
- ✅ Image-to-image (Instruct-Pix2Pix)
- ✅ Upscale (Real-ESRGAN)
- ✅ Multiple model options
- ⚠️ Slower (polling-based)

**API Key**: Get from [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)

**Available Models**:
- `flux-schnell` - Fast Flux model
- `flux-dev` - High quality Flux
- `flux-pro` - Best quality Flux
- `sdxl` - Stable Diffusion XL
- `sdxl-lightning` - Fast SDXL (4 steps)
- `playground-v2.5` - Playground AI
- `real-esrgan-upscale` - Upscaling
- `instruct-pix2pix` - Image editing

## Usage

### Basic Usage

```python
from providers import provider_manager

# List available providers
providers = provider_manager.list_providers()
print(providers)

# Generate image with specific provider
result = await provider_manager.generate_image(
    prompt="A beautiful sunset over mountains",
    provider="recraft",
    style="realistic_image",
    size="1024x1024"
)

# Upscale image
result = await provider_manager.upscale_image(
    image_url="https://example.com/image.jpg",
    provider="recraft",
    upscale_type="crisp"
)
```

### Advanced Usage

```python
from providers import RecraftProvider, OpenAIProvider, ReplicateProvider
from providers.base_provider import ProviderFeature

# Direct provider instantiation
recraft = RecraftProvider(api_key="your_key")
result = await recraft.generate_image(
    prompt="Mountain landscape",
    style="digital_illustration"
)

# Check provider capabilities
if provider_manager.get_provider("openai").supports_feature(ProviderFeature.UPSCALE):
    # This won't execute because OpenAI doesn't support upscaling
    pass

# Get best provider for a feature
best_upscaler = provider_manager.get_best_provider_for_feature(
    ProviderFeature.UPSCALE,
    preferred=["recraft", "replicate"]
)
```

### Provider Manager Methods

```python
# Generate image
await provider_manager.generate_image(prompt, provider, **kwargs)

# Edit image
await provider_manager.edit_image(image_url, prompt, provider, **kwargs)

# Image-to-image transformation
await provider_manager.image_to_image(image_url, prompt, provider, **kwargs)

# Upscale
await provider_manager.upscale_image(image_url, provider, **kwargs)

# Background removal
await provider_manager.remove_background(image_url, provider, **kwargs)

# Background replacement
await provider_manager.replace_background(image_url, prompt, provider, **kwargs)

# Vectorize
await provider_manager.vectorize_image(image_url, provider, **kwargs)

# Inpainting
await provider_manager.inpaint(image_url, mask_url, prompt, provider, **kwargs)
```

## Response Format

All providers return normalized responses:

```python
{
    "provider": "recraft",  # Provider name
    "data": {
        "images": [
            {
                "url": "https://...",
                "revised_prompt": "..."  # OpenAI only
            }
        ],
        "model": "recraftv3",  # Model used
        "style": "realistic_image"  # Style applied
    }
}
```

## Configuration

Set environment variables in `.env`:

```bash
# Required: At least one provider
RECRAFT_API_KEY=your_key
OPENAI_API_KEY=your_key
REPLICATE_API_KEY=your_key

# Optional
RECRAFT_URL=https://external.api.recraft.ai/v1
DEFAULT_PROVIDER=recraft
```

## Error Handling

```python
try:
    result = await provider_manager.generate_image(
        prompt="test",
        provider="invalid_provider"
    )
except ValueError as e:
    # Provider not found or doesn't support feature
    print(f"Error: {e}")
except httpx.HTTPStatusError as e:
    # API error
    print(f"API Error: {e.response.status_code}")
except Exception as e:
    # Other errors
    print(f"Unexpected error: {e}")
```

## Adding New Providers

1. Create new provider class inheriting from `BaseImageProvider`
2. Implement required abstract methods
3. Register in `provider_manager.py`

Example:

```python
from .base_provider import BaseImageProvider, ProviderFeature

class MyNewProvider(BaseImageProvider):
    @property
    def provider_name(self) -> str:
        return "mynewprovider"
    
    def get_supported_features(self) -> List[ProviderFeature]:
        return [ProviderFeature.GENERATE]
    
    async def generate_image(self, prompt: str, **kwargs):
        # Implementation
        pass
```

## Features by Provider

| Feature | Recraft | OpenAI | Replicate |
|---------|---------|--------|-----------|
| Generate | ✅ | ✅ | ✅ |
| Edit | ❌ | ✅ | ✅ |
| Image-to-Image | ✅ | ✅ | ✅ |
| Upscale | ✅ | ❌ | ✅ |
| Remove BG | ✅ | ❌ | ❌ |
| Replace BG | ✅ | ❌ | ❌ |
| Vectorize | ✅ | ❌ | ❌ |
| Inpainting | ❌ | ✅ | ❌ |

## Performance Notes

- **Recraft**: Fast (2-5s), good quality
- **OpenAI**: Medium (5-15s), excellent prompt understanding
- **Replicate**: Slow (10-60s), highest quality, most model options

## Cost Estimates

- **Recraft**: ~$0.04 per image
- **OpenAI DALL-E 3**: ~$0.04-0.08 per image
- **Replicate Flux**: ~$0.003-0.055 per image (model dependent)


