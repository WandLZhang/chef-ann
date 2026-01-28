#!/bin/bash
#
# Deploy Chef Ann Cloud Function to Google Cloud
# 
# Prerequisites:
#   1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
#   2. Authenticate: gcloud auth login
#   3. Set your project: gcloud config set project YOUR_PROJECT_ID
#   4. Enable required APIs:
#      - gcloud services enable cloudfunctions.googleapis.com
#      - gcloud services enable cloudbuild.googleapis.com
#      - gcloud services enable run.googleapis.com
#
# Usage:
#   ./deploy.sh [GEMINI_API_KEY]
#
# If GEMINI_API_KEY is not provided, you must set it as an environment variable
#

set -e

# Configuration
FUNCTION_NAME="chef-ann-api"
REGION="us-central1"
RUNTIME="python312"
ENTRY_POINT="main"
MEMORY="2Gi"
CPU="2"
TIMEOUT="300"
MAX_INSTANCES="100"

# Get API key from argument or environment
GEMINI_API_KEY="${1:-$GEMINI_API_KEY}"

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY is required"
    echo "   Usage: ./deploy.sh YOUR_GEMINI_API_KEY"
    echo "   Or set GEMINI_API_KEY environment variable"
    exit 1
fi

echo "🚀 Deploying Chef Ann Cloud Function..."
echo "   Function: $FUNCTION_NAME"
echo "   Region: $REGION"
echo "   Runtime: $RUNTIME"
echo ""

# Deploy the function
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --source=. \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY \
    --memory=$MEMORY \
    --cpu=$CPU \
    --timeout=$TIMEOUT \
    --max-instances=$MAX_INSTANCES

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function Details:"
gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(serviceConfig.uri)"
