#!/bin/bash

###############################################################################
# Production Deployment Script
# Deploys backend to AWS Lightsail instance
# Server: 65.0.78.75 (bitnami user)
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="65.0.78.75"
SERVER_USER="bitnami"
SSH_KEY="n8n/LightsailDefaultKey-ap-south-1.pem"
REMOTE_DIR="/home/bitnami/multi-tenant-backend"
GITHUB_REPO="https://github.com/mdwasim1340/multi-tenant-backend-only.git"
BRANCH="main"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Multi-Tenant Backend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

# Set correct permissions for SSH key
chmod 400 "$SSH_KEY"

echo -e "${YELLOW}Step 1: Connecting to server...${NC}"
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e
    
    echo "Connected to server successfully!"
    
    # Navigate to project directory
    cd /home/bitnami/multi-tenant-backend
    
    echo "Step 2: Pulling latest changes from GitHub..."
    git fetch origin
    git pull origin main
    
    echo "Step 3: Installing dependencies..."
    npm install --production=false
    
    echo "Step 4: Building TypeScript..."
    npm run build
    
    echo "Step 5: Setting up environment..."
    if [ ! -f .env ]; then
        echo "Warning: .env file not found. Copying from .env.production..."
        cp .env.production .env
        echo "IMPORTANT: Update .env with production credentials!"
    fi
    
    echo "Step 6: Creating logs directory..."
    mkdir -p logs
    
    echo "Step 7: Restarting PM2 process..."
    # Stop existing process if running
    pm2 stop backend-api-prod 2>/dev/null || true
    
    # Start with production environment
    pm2 start ecosystem.config.js --env production --only backend-api-prod
    
    # Save PM2 configuration
    pm2 save
    
    echo "Step 8: Checking application status..."
    pm2 status
    
    echo ""
    echo "Deployment completed successfully!"
    echo "View logs: pm2 logs backend-api-prod"
    echo "Monitor: pm2 monit"
ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backend URL: ${GREEN}https://backend.aajminpolyclinic.com.np${NC}"
echo ""
echo "Next steps:"
echo "1. SSH into server: ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "2. Update .env with production credentials"
echo "3. Restart: pm2 restart backend-api-prod"
echo "4. Check logs: pm2 logs backend-api-prod"
echo ""
