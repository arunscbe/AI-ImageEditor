# 🧪 Local Testing Guide

## Test Backend Locally

### Option 1: Run with Python (Recommended for Development)

```powershell
# Make sure you're in the backend directory
cd D:\WORK\RoyalCyber\AI-ImageEditor\backend

# Activate virtual environment
.\.venv312\Scripts\Activate

# Run the server
python main.py
```

The server will start at `http://localhost:8000`

### Option 2: Run with Uvicorn (Production-like)

```powershell
cd D:\WORK\RoyalCyber\AI-ImageEditor\backend
.\.venv312\Scripts\Activate

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Test with Docker (Exact Production Environment)

```powershell
# Build the Docker image
cd D:\WORK\RoyalCyber\AI-ImageEditor\backend
docker build -t ai-image-editor-backend .

# Run with environment variables
docker run -p 8080:8080 `
  -e ORCHESTRATOR_TYPE=openai `
  -e OPENAI_API_KEY=$env:OPENAI_API_KEY `
  -e GEMINI_API_KEY=$env:GEMINI_API_KEY `
  -e RECRAFT_API_TOKEN=$env:RECRAFT_API_TOKEN `
  ai-image-editor-backend
```

## Test Endpoints

### 1. Health Check
```powershell
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "providers": 3,
  "orchestrator": "openai"
}
```

### 2. List Providers
```powershell
curl http://localhost:8000/providers
```

### 3. Test Chat (with Gemini)
```powershell
curl -X POST http://localhost:8000/chat `
  -H "Content-Type: application/json" `
  -d '{
    "message": "[Provider: gemini] Generate a blue circle logo",
    "conversation_id": "test123"
  }'
```

### 4. Test Image Upload
```powershell
curl -X POST http://localhost:8000/upload-canvas-image `
  -F "image=@path/to/image.png"
```

### 5. Root Endpoint
```powershell
curl http://localhost:8000/
```

## Test Frontend with Local Backend

Update your frontend to use local backend:

```javascript
// In frontend/.env or .env.local
VITE_API_URL=http://localhost:8000
```

Then run frontend:
```powershell
cd D:\WORK\RoyalCyber\AI-ImageEditor\frontend
npm run dev
```

## Common Issues

### Issue: "Failed to initialize X provider"
**Solution**: This is just a warning if API keys aren't set. The server will still work.

### Issue: "Cannot find module"
**Solution**: Install dependencies
```powershell
pip install -r requirements.txt
```

### Issue: Port 8000 already in use
**Solution**: Use a different port
```powershell
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Issue: CORS errors from frontend
**Solution**: Make sure your frontend URL is in the CORS allow_origins list in `main.py`

## Debug Mode

Run with detailed logging:
```powershell
$env:LOG_LEVEL="DEBUG"
python main.py
```

## Check Logs

Watch server logs in real-time:
```powershell
# Windows PowerShell - server logs appear in the same terminal
python main.py | Tee-Object -FilePath "server.log"
```

## Quick Test Script

Create `test_api.ps1`:
```powershell
# Test all endpoints
Write-Host "🧪 Testing API..." -ForegroundColor Cyan

Write-Host "`n1️⃣ Testing root..." -ForegroundColor Yellow
curl http://localhost:8000/

Write-Host "`n2️⃣ Testing health..." -ForegroundColor Yellow
curl http://localhost:8000/health

Write-Host "`n3️⃣ Testing providers..." -ForegroundColor Yellow
curl http://localhost:8000/providers

Write-Host "`n✅ All tests complete!" -ForegroundColor Green
```

Run:
```powershell
.\test_api.ps1
```


