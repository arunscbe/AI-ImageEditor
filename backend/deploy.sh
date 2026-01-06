#!/bin/bash

# AI Image Editor Backend - Google Cloud Run Deployment Script
# Usage: ./deploy.sh [PROJECT_ID]

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AI Image Editor - Cloud Run Deployment${NC}"
echo "=========================================="

# Get project ID
if [ -z "$1" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}❌ Error: No project ID provided and no default project set${NC}"
        echo "Usage: ./deploy.sh [PROJECT_ID]"
        exit 1
    fi
else
    PROJECT_ID=$1
fi

echo -e "${BLUE}📋 Using Project: ${PROJECT_ID}${NC}"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${BLUE}🔧 Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

echo -e "${GREEN}✅ APIs enabled${NC}"

# Build and deploy
echo -e "${BLUE}🔨 Building and deploying to Cloud Run...${NC}"
gcloud builds submit --config cloudbuild.yaml

echo -e "${GREEN}✅ Deployment initiated!${NC}"

# Get the service URL
echo -e "${BLUE}🌐 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe ai-image-editor-backend \
    --region us-central1 \
    --format 'value(status.url)' 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
    echo ""
    echo "Service URL: ${SERVICE_URL}"
    echo ""
    echo -e "${BLUE}📝 Next steps:${NC}"
    echo "1. Update your frontend .env.production with:"
    echo "   VITE_API_URL=${SERVICE_URL}"
    echo ""
    echo "2. Set environment variables (API keys):"
    echo "   gcloud run services update ai-image-editor-backend \\"
    echo "     --region us-central1 \\"
    echo "     --set-env-vars OPENAI_API_KEY=your-key,GEMINI_API_KEY=your-key"
    echo ""
    echo "3. Or use Secret Manager (recommended):"
    echo "   echo -n 'your-key' | gcloud secrets create OPENAI_API_KEY --data-file=-"
else
    echo -e "${RED}❌ Could not retrieve service URL. Check Cloud Console.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"


