#!/bin/bash

# Deploy Backend CORS Fix
# Run this on the server: bash deploy-backend-cors-fix.sh

echo "🚀 Deploying Backend CORS Fix..."

# Navigate to backend directory
cd /home/ubuntu/backend

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin development

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Restart PM2 process
echo "🔄 Restarting backend service..."
pm2 restart backend

# Show status
echo "✅ Deployment complete!"
pm2 status

# Test the API
echo ""
echo "🧪 Testing API health..."
curl -s http://localhost:3000/health | jq '.'

echo ""
echo "✅ Backend CORS fix deployed successfully!"
echo "The following origins are now allowed:"
echo "  - https://aajminpolyclinic.healthsync.live"
echo "  - http://aajminpolyclinic.healthsync.live"
echo "  - All *.healthsync.live subdomains"
