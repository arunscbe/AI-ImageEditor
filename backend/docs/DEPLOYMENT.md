# 🚀 Backend Deployment Guide - Google Cloud Run

## Prerequisites

- Google Cloud account
- `gcloud` CLI installed and authenticated
- Docker installed (for local testing)
- Firebase project: `threeddd-design-editor`

## Quick Deploy

### 1. Set Your Project

```bash
gcloud config set project threeddd-design-editor
```

### 2. Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 3. Deploy to Cloud Run

```bash
# Using Cloud Build (recommended)
gcloud builds submit --config cloudbuild.yaml

# Or using the deploy script
chmod +x deploy.sh
./deploy.sh threeddd-design-editor
```

### 4. Set Environment Variables

**Option A: Direct environment variables** (quick, less secure)

```bash
gcloud run services update ai-image-editor-backend \
  --region us-central1 \
  --set-env-vars "\
ORCHESTRATOR_TYPE=openai,\
OPENAI_API_KEY=your-openai-key,\
ANTHROPIC_API_KEY=your-anthropic-key,\
GEMINI_API_KEY=your-gemini-key,\
RECRAFT_API_KEY=your-recraft-key,\
REPLICATE_API_KEY=your-replicate-key,\
IMAGE_STORAGE_PATH=generated_images"
```

**Option B: Secret Manager** (recommended, more secure)

```bash
# Create secrets
echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
echo -n "your-anthropic-key" | gcloud secrets create ANTHROPIC_API_KEY --data-file=-
echo -n "your-gemini-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "your-recraft-key" | gcloud secrets create RECRAFT_API_KEY --data-file=-

# Update Cloud Run to use secrets
gcloud run services update ai-image-editor-backend \
  --region us-central1 \
  --set-secrets "\
OPENAI_API_KEY=OPENAI_API_KEY:latest,\
ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,\
GEMINI_API_KEY=GEMINI_API_KEY:latest,\
RECRAFT_API_KEY=RECRAFT_API_KEY:latest"
```

### 5. Get Your Backend URL

```bash
gcloud run services describe ai-image-editor-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

The output will be something like:
```
https://ai-image-editor-backend-xxxxxxxxxx-uc.a.run.app
```

## Update Frontend

### Update Frontend to Use Production Backend

Create `.env.production` in frontend folder:

```env
VITE_API_URL=https://ai-image-editor-backend-xxxxxxxxxx-uc.a.run.app
```

Update your frontend code to use this:

```javascript
// In AIChatPanel.jsx or a config file
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Use in fetch calls
fetch(`${API_URL}/chat`, { /* ... */ })
```

### Redeploy Frontend

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

## Testing

### Test Backend Health

```bash
curl https://your-backend-url.run.app/health
```

Expected response:
```json
{"status": "healthy"}
```

### Test CORS

```bash
curl -H "Origin: https://threeddd-design-editor.web.app" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-backend-url.run.app/chat
```

### Test Image Generation

```bash
curl -X POST https://your-backend-url.run.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a lion logo", "conversation_id": "test"}'
```

## Monitoring & Logs

### View Logs

```bash
gcloud run logs read ai-image-editor-backend \
  --region us-central1 \
  --limit 50
```

### View in Console

https://console.cloud.google.com/run/detail/us-central1/ai-image-editor-backend/logs

### Monitor Metrics

https://console.cloud.google.com/run/detail/us-central1/ai-image-editor-backend/metrics

## Cost Optimization

### Current Configuration

- **Memory**: 2Gi
- **CPU**: 2
- **Timeout**: 300s (5 minutes)
- **Min instances**: 0 (scales to zero)
- **Max instances**: 10

### Estimated Costs

- **Free tier**: 2 million requests/month, 360,000 GB-seconds
- **After free tier**: ~$0.00002400 per request
- **Typical monthly cost**: $5-20 for moderate usage

### Reduce Costs

```bash
# Reduce memory and CPU
gcloud run services update ai-image-editor-backend \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1

# Reduce timeout (if applicable)
gcloud run services update ai-image-editor-backend \
  --region us-central1 \
  --timeout 120
```

## Troubleshooting

### Build Fails

Check Cloud Build logs:
```bash
gcloud builds list --limit 5
gcloud builds log <BUILD_ID>
```

### Service Won't Start

Check logs:
```bash
gcloud run logs read ai-image-editor-backend --region us-central1 --limit 100
```

Common issues:
1. Missing environment variables
2. Port not set to 8080
3. Health check failing

### CORS Errors

Verify CORS settings in `main.py`:
```python
allow_origins=[
    "https://threeddd-design-editor.web.app",
    "https://threeddd-design-editor.firebaseapp.com"
]
```

### 502 Bad Gateway

Usually means the service is crashing. Check:
1. Logs for Python errors
2. Memory limits (increase if needed)
3. Cold start timeout

## Rollback

```bash
# List revisions
gcloud run revisions list --service ai-image-editor-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic ai-image-editor-backend \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

## Clean Up

### Delete Service

```bash
gcloud run services delete ai-image-editor-backend --region us-central1
```

### Delete Images

```bash
gcloud container images delete gcr.io/threeddd-design-editor/ai-image-editor-backend --quiet
```

## Security Checklist

- ✅ CORS properly configured
- ✅ Use Secret Manager for API keys
- ✅ Service uses HTTPS only
- ✅ Authentication disabled (public API) or enabled (private API)
- ✅ Rate limiting configured (if needed)
- ✅ Monitor for abuse

## Production Checklist

- ✅ All API keys set in Secret Manager
- ✅ CORS includes production frontend URL
- ✅ Health check endpoint working
- ✅ Logs being collected
- ✅ Alerts configured for errors
- ✅ Backend URL updated in frontend
- ✅ Frontend redeployed with production backend URL
- ✅ End-to-end test completed

## Support

- Cloud Run docs: https://cloud.google.com/run/docs
- Firebase docs: https://firebase.google.com/docs/hosting
- Project console: https://console.firebase.google.com/project/threeddd-design-editor


