# 🚀 Quick Deploy Commands

## Deploy Backend to Cloud Run

```powershell
# 1. Set your project
gcloud config set project threeddd-design-editor

# 2. Enable APIs (one-time setup)
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

# 3. Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# 4. Get your backend URL
gcloud run services describe ai-image-editor-backend --region us-central1 --format="value(status.url)"
```

## Set API Keys (After Deployment)

```powershell
# Replace with your actual API keys
gcloud run services update ai-image-editor-backend `
  --region us-central1 `
  --set-env-vars "ORCHESTRATOR_TYPE=openai,OPENAI_API_KEY=your-key,GEMINI_API_KEY=your-key,RECRAFT_API_KEY=your-key"
```

## Update Frontend

1. Create `frontend/.env.production`:
```
VITE_API_URL=https://your-backend-url.run.app
```

2. Redeploy frontend:
```powershell
cd frontend
npm run build
firebase deploy
```

## Test

```powershell
# Test health endpoint
curl https://your-backend-url.run.app/health
```


