from fastapi import APIRouter, UploadFile, File
from PIL import Image
from io import BytesIO
from utils.image_storage import save_uploaded_file, get_image_url
from services.image_operations import image_operations

router = APIRouter()

def ensure_min_size(image_bytes):
    img = Image.open(BytesIO(image_bytes))
    w, h = img.size

    # If image is already big enough, do nothing
    if w >= 256 and h >= 256:
        return image_bytes

    # Scale up proportionally
    scale = 256 / min(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)

    img = img.resize((new_w, new_h), Image.LANCZOS)

    output = BytesIO()
    img.save(output, format="PNG")
    return output.getvalue()

@router.post("/vectorizeImage")
async def vectorize_image(image: UploadFile = File(...)):
    """
    Vectorize an uploaded image using the provider system.
    This ensures gradient flattening and color normalization are applied.
    """
    # Read and resize image
    original_bytes = await image.read()
    resized_bytes = ensure_min_size(original_bytes)
    
    # Save the uploaded image temporarily
    filepath = save_uploaded_file(resized_bytes, image.filename or "upload.png")
    image_url = get_image_url(filepath)
    
    # Use the provider system for vectorization (includes gradient flattening & color normalization)
    result = await image_operations.vectorize(
        image_url=image_url,
        provider="recraft"
    )
    
    # Extract the URL from the provider response
    # Provider returns: {"provider": "recraft", "data": {"images": [{"url": "..."}]}}
    if result.get("data") and result["data"].get("images"):
        images = result["data"]["images"]
        if len(images) > 0:
            return {
                "image": {
                    "url": images[0].get("url")
                }
            }
    
    # Fallback: return the result as-is
    return result
