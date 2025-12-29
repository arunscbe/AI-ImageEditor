import os
from fastapi import APIRouter, UploadFile, File
from dotenv import load_dotenv
import requests

load_dotenv()

router = APIRouter()

API_KEY = os.getenv("RECRAFT_API_KEY")
BASE_URL = os.getenv("RECRAFT_URL")

@router.post("/removebg")
async def remove_bg(image: UploadFile = File(...)):
    url = f"{BASE_URL}/images/removeBackground"

    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }

    files = {
        "file": (image.filename, await image.read(), image.content_type)
    }

    response = requests.post(url, headers=headers, files=files)
    print("Recraft Response:", response.text)

    return response.json()
