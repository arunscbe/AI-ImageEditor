from fastapi import APIRouter, UploadFile, File
import requests
from PIL import Image
from io import BytesIO
import os
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

API_KEY = os.getenv("RECRAFT_API_KEY")
BASE_URL = os.getenv("RECRAFT_URL")  # https://external.api.recraft.ai/v1

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
    url = f"{BASE_URL}/images/vectorize"

    original_bytes = await image.read()
    resized_bytes = ensure_min_size(original_bytes)

    headers = {
        "Authorization": f"Bearer {API_KEY}"    
    }

    files = {
        "file": ("vector.png", resized_bytes, "image/png")
    }

    response = requests.post(url, headers=headers, files=files)
    return response.json()
