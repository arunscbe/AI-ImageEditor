import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
import requests

load_dotenv()

router = APIRouter()

API_KEY = os.getenv("RECRAFT_API_KEY")
BASE_URL = os.getenv("RECRAFT_URL")

@router.post("/upscale")
async def upscale_image(image: UploadFile = File(...)):
    url = f"{BASE_URL}/images/crispUpscale"

    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }

    files = {
        "file": (image.filename, await image.read(), image.content_type)
    }

    try:
        response = requests.post(url, headers=headers, files=files)

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


