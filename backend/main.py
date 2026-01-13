from fastapi import FastAPI, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional, List
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
from generateImage import router as generateImage_router
from removeBG import router as removeBG_router
from vectorizeImage import router as vectorize_router
from upscaleImage import router as upscale_router
from eraseRegion import router as erase_router
from test import testinApp

from providers.provider_manager import provider_manager
from utils.image_storage import save_pil_image, get_image_url
from PIL import Image
from io import BytesIO

ORCHESTRATOR_TYPE = os.getenv("ORCHESTRATOR_TYPE", "openai").lower()

orchestrator = None

def get_orchestrator_instance():
    global orchestrator
    if orchestrator is None:
        if ORCHESTRATOR_TYPE == "claude":
            from orchestrator.llm_orchestrator import get_orchestrator
            orchestrator = get_orchestrator()
        elif ORCHESTRATOR_TYPE == "openai":
            from orchestrator.openai_orchestrator import get_openai_orchestrator
            orchestrator = get_openai_orchestrator()
        else:
            raise ValueError(f"Invalid ORCHESTRATOR_TYPE: {ORCHESTRATOR_TYPE}. Use 'claude' or 'openai'")
    return orchestrator

app = FastAPI(title="AI Image Editor API")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://localhost:5000,https://threeddd-design-editor.web.app,https://threeddd-design-editor.firebaseapp.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

os.makedirs("generated_images", exist_ok=True)
app.mount("/images", StaticFiles(directory="generated_images"), name="images")


@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Image Editor API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )

# Register ALL routers
app.include_router(generateImage_router)
app.include_router(removeBG_router)
app.include_router(vectorize_router)
app.include_router(upscale_router)
app.include_router(erase_router)
@app.get("/test")
def test_route():
    return testinApp()

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    message: str
    images: List[str]
    actions_taken: List[str]
    conversation_id: str


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        logger.info(f"Chat request received - conversation_id: {request.conversation_id}")
        logger.debug(f"Message: {request.message[:200]}")
        
        orch = get_orchestrator_instance()
        result = await orch.process_message(
            message=request.message,
            conversation_id=request.conversation_id
        )
        
        logger.info(f"Chat response - actions: {result.get('actions_taken', [])}, images: {len(result.get('images', []))}")
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-canvas-image")
async def upload_canvas_image(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        pil_image = Image.open(BytesIO(contents))
        
        filepath = save_pil_image(pil_image, prefix="upload_")
        image_url = get_image_url(filepath)
        
        return {
            "url": image_url,
            "local_path": filepath,
            "message": "Canvas image uploaded successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")


@app.post("/ingest/upload")
async def ingest_upload(
    file: UploadFile = File(...),
    vectorize: bool = True
):
    """
    Upload and process a file (PNG/JPG/PDF/AI)
    Automatically routes to appropriate processing:
    - PNG/JPG → Optional Recraft vectorization
    - PDF/AI → Inkscape conversion to SVG
    """
    try:
        from services.ingestion_service import ingestion_service
        
        file_data = await file.read()
        
        result = await ingestion_service.process_upload(
            file_data=file_data,
            filename=file.filename,
            vectorize=vectorize
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")


@app.post("/analyze-image")
async def analyze_image(request: dict):
    """
    Analyze an image to determine quality and recommend processing workflow.
    
    Request body:
    {
        "image_url": "https://example.com/image.png",
        "provider": "gemini"  // optional, defaults to gemini
    }
    
    Returns analysis with recommendations for upscaling, vectorization, etc.
    """
    try:
        image_url = request.get("image_url")
        if not image_url:
            raise HTTPException(status_code=400, detail="image_url is required")
        
        provider = request.get("provider", "gemini")
        
        result = await provider_manager.analyze_image(
            image_url=image_url,
            provider=provider
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/providers")
async def list_providers():
    return provider_manager.list_providers()


@app.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    try:
        orch = get_orchestrator_instance()
        history = orch.get_conversation_history(conversation_id)
        if not history:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"conversation_id": conversation_id, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/conversation/{conversation_id}")
async def clear_conversation(conversation_id: str):
    try:
        orch = get_orchestrator_instance()
        success = orch.clear_conversation(conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"message": "Conversation cleared", "conversation_id": conversation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "providers": len(provider_manager.providers),
        "orchestrator": ORCHESTRATOR_TYPE
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)