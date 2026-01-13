from fastapi import APIRouter
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests

load_dotenv()

router = APIRouter()

API_KEY = os.getenv("RECRAFT_API_KEY")
BASE_URL = os.getenv("RECRAFT_URL")

class GenerateRequest(BaseModel):
    prompt: str
    model: str = "recraftv3"
    style: str = "digital_illustration"

@router.post("/generate-image")
async def generateImage(data: GenerateRequest):
    url = f"{BASE_URL}/images/generations"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = data.model_dump()
    response = requests.post(url, json=payload, headers=headers)
    return response.json()
