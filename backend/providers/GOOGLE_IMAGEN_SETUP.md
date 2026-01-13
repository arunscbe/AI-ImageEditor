# Google Vertex AI Imagen Provider - Setup Guide

## Overview

Google Imagen 3 via Vertex AI provides:
- 🎨 **High-quality photorealistic generation**
- ✍️ **Best-in-class text rendering** (can write actual text in images)
- 🖼️ **Inpainting and outpainting**
- 🎭 **Style control**
- 📐 **Multiple aspect ratios** (1:1, 3:4, 4:3, 9:16, 16:9)
- ⬆️ **Upscaling** (x2, x4)

## Setup Instructions

### 1. Create Google Cloud Project

```bash
# Visit https://console.cloud.google.com/
# Create a new project or select existing one
```

### 2. Enable Vertex AI API

```bash
gcloud services enable aiplatform.googleapis.com
```

Or via console: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

### 3. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create imagen-service-account \
    --display-name="Imagen Service Account"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:imagen-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Create and download key
gcloud iam service-accounts keys create ~/imagen-key.json \
    --iam-account=imagen-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 4. Configure Environment

```bash
# Add to .env
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/imagen-key.json
```

### 5. Install Dependencies

```bash
pip install google-cloud-aiplatform
```

## Usage

### Basic Generation

```python
from providers import provider_manager

result = await provider_manager.generate_image(
    prompt="A professional product photo of a smartphone",
    provider="google-imagen",
    aspect_ratio="1:1",
    number_of_images=1
)
```

### With Text Rendering (Imagen's specialty!)

```python
result = await provider_manager.generate_image(
    prompt='A logo with the text "ACME Corp" in bold modern font',
    provider="google-imagen",
    aspect_ratio="16:9"
)
```

### Image Editing

```python
result = await provider_manager.edit_image(
    image_url="https://example.com/image.jpg",
    prompt="Make it sunset lighting",
    provider="google-imagen",
    guidance_scale=7.0
)
```

### Inpainting

```python
result = await provider_manager.inpaint(
    image_url="https://example.com/photo.jpg",
    mask_url="https://example.com/mask.jpg",
    prompt="Replace with a red car",
    provider="google-imagen"
)
```

### Upscaling

```python
result = await provider_manager.upscale_image(
    image_url="https://example.com/small.jpg",
    provider="google-imagen",
    upscale_factor="x4"  # or "x2"
)
```

## Available Models

- `imagen-3.0-generate-001` - Latest high-quality generation
- `imagen-3.0-fast-generate-001` - Faster generation
- `imagegeneration@006` - Previous version with editing
- `imagegeneration@005` - Older version

## Response Format

Returns base64-encoded images:

```python
{
    "provider": "google-imagen",
    "data": {
        "images": [
            {
                "url": "data:image/png;base64,...",
                "base64": "iVBORw0KGgoAAAANSUhEUgAA..."
            }
        ],
        "model": "imagen-3.0",
        "aspect_ratio": "1:1"
    }
}
```

## Pricing

- **Generation**: ~$0.02-0.04 per image
- **Editing**: ~$0.02-0.04 per operation
- **Upscaling**: ~$0.01 per operation

See: https://cloud.google.com/vertex-ai/pricing

## Strengths

✅ Best text rendering in images  
✅ High photorealistic quality  
✅ Good prompt adherence  
✅ Inpainting/outpainting support  
✅ Multiple aspect ratios  

## Limitations

⚠️ More complex setup (Google Cloud required)  
⚠️ Returns base64 (not URLs) - larger response size  
⚠️ Requires service account authentication  
⚠️ Region-specific availability  

## Troubleshooting

### "PermissionDenied" error
```bash
# Grant additional permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT" \
    --role="roles/aiplatform.user"
```

### "API not enabled" error
```bash
gcloud services enable aiplatform.googleapis.com
```

### Import error
```bash
pip install google-cloud-aiplatform
```

## When to Use Google Imagen

- ✅ Need text in images (logos, signs, posters)
- ✅ High-quality photorealistic images
- ✅ Enterprise/production use with Google Cloud
- ✅ Need inpainting with precise masks
- ❌ Don't use if: Setup is too complex or prefer URL responses


