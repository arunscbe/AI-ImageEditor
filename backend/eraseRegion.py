import os
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from dotenv import load_dotenv
import requests
from typing import Optional
from PIL import Image
import io

load_dotenv()

router = APIRouter()

API_KEY = os.getenv("RECRAFT_API_KEY")
BASE_URL = os.getenv("RECRAFT_URL")

def convert_to_binary_grayscale(image_data):
    """Convert image to pure binary grayscale PNG (only 0 or 255 values)"""
    img = Image.open(io.BytesIO(image_data))
    
    grayscale_img = img.convert('L')
    
    pixels = grayscale_img.load()
    width, height = grayscale_img.size
    
    for y in range(height):
        for x in range(width):
            pixel_value = pixels[x, y]
            if pixel_value < 128:
                pixels[x, y] = 0
            else:
                pixels[x, y] = 255
    
    output = io.BytesIO()
    grayscale_img.save(output, format='PNG')
    output.seek(0)
    
    return output.getvalue()

@router.post("/erase-region")
async def erase_region(
    image: UploadFile = File(...),
    mask: UploadFile = File(...),
    response_format: Optional[str] = Form("url")
):
    url = f"{BASE_URL}/images/eraseRegion"

    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }

    image_data = await image.read()
    mask_data = await mask.read()
    
    img_pil = Image.open(io.BytesIO(image_data))
    binary_mask = convert_to_binary_grayscale(mask_data)
    mask_pil = Image.open(io.BytesIO(binary_mask))

    files = {
        "image": (image.filename, image_data, image.content_type),
        "mask": ("mask.png", binary_mask, "image/png")
    }

    data = {}
    if response_format:
        data["response_format"] = response_format

    try:
        response = requests.post(url, headers=headers, files=files, data=data)

        if not response.ok:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"API Error: {response.text}"
            )

        return response.json()
    
    except requests.exceptions.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid API response. Status: {response.status_code}, Body: {response.text}"
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error: {str(e)}"
        )

