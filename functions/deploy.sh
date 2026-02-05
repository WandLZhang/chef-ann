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
#      - gcloud services enable aiplatform.googleapis.com
#
# Usage:
#   ./deploy.sh
#
# Uses Vertex AI with service account (no API key needed)
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
GCP_PROJECT="${GCP_PROJECT:-wz-chef-ann}"
GCP_LOCATION="global"  # gemini-3-pro-preview requires global region

echo "🚀 Deploying Chef Ann Cloud Function..."
echo "   Function: $FUNCTION_NAME"
echo "   Region: $REGION"
echo "   Runtime: $RUNTIME"
echo "   GCP Project: $GCP_PROJECT"
echo "   Vertex AI Location: $GCP_LOCATION"
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
    --set-env-vars GCP_PROJECT=$GCP_PROJECT,GCP_LOCATION=$GCP_LOCATION \
    --memory=$MEMORY \
    --cpu=$CPU \
    --timeout=$TIMEOUT \
    --max-instances=$MAX_INSTANCES

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Function Details:"
gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(serviceConfig.uri)"
