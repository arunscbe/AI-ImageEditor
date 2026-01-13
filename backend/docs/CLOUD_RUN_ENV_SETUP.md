# 🔑 Cloud Run Environment Variables Setup

After the initial deployment, you need to set your API keys as environment variables in Cloud Run.

## Required API Keys

You'll need at least ONE of these providers configured:

### Option 1: Set via Console (Easiest)

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on `ai-image-editor-backend` service
3. Click **"EDIT & DEPLOY NEW REVISION"**
4. Scroll to **"Variables & Secrets"** → **"Environment Variables"**
5. Click **"ADD VARIABLE"** and add:

**Required (pick at least one):**
```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
RECRAFT_API_TOKEN=your_recraft_api_token_here
```

**Orchestrator (Required):**
```
ORCHESTRATOR_TYPE=openai
OPENAI_API_KEY=your_openai_api_key_here
```

**Optional (if using Google Imagen):**
```
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

6. Click **"DEPLOY"**

### Option 2: Set via CLI (Faster)

```powershell
# Set OpenAI orchestrator (required)
gcloud run services update ai-image-editor-backend `
  --region=us-central1 `
  --update-env-vars OPENAI_API_KEY=your_openai_api_key_here

# Set Gemini (recommended)
gcloud run services update ai-image-editor-backend `
  --region=us-central1 `
  --update-env-vars GEMINI_API_KEY=your_gemini_api_key_here

# Set Recraft (optional)
gcloud run services update ai-image-editor-backend `
  --region=us-central1 `
  --update-env-vars RECRAFT_API_TOKEN=your_recraft_api_token_here

# Set all at once
gcloud run services update ai-image-editor-backend `
  --region=us-central1 `
  --update-env-vars="ORCHESTRATOR_TYPE=openai,OPENAI_API_KEY=your_key,GEMINI_API_KEY=your_key,RECRAFT_API_TOKEN=your_key"
```

## Get Your Cloud Run URL

```powershell
gcloud run services describe ai-image-editor-backend --region=us-central1 --format="value(status.url)"
```

## Test the Deployment

```powershell
# Get the URL
$url = gcloud run services describe ai-image-editor-backend --region=us-central1 --format="value(status.url)"

# Test health endpoint
curl "$url/health"

# Test providers
curl "$url/providers"
```

## Update Frontend with Backend URL

Once deployed, update your frontend's API endpoint:

```javascript
// In your frontend .env or config
VITE_API_URL=https://ai-image-editor-backend-xxxxxxxxx-uc.a.run.app
```

## Troubleshooting

### Check Logs
```powershell
gcloud run logs read ai-image-editor-backend --region=us-central1 --limit=50
```

### View Recent Errors
```powershell
gcloud run logs read ai-image-editor-backend --region=us-central1 --limit=20 --format="value(textPayload)" | Select-String "ERROR"
```

### Test Locally with Docker
```powershell
# Build
docker build -t ai-image-editor-backend .

# Run with env vars
docker run -p 8080:8080 `
  -e ORCHESTRATOR_TYPE=openai `
  -e OPENAI_API_KEY=your_key `
  -e GEMINI_API_KEY=your_key `
  ai-image-editor-backend

# Test
curl http://localhost:8080/health
```


