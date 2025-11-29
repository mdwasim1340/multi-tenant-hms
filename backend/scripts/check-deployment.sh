#!/bin/bash

###############################################################################
# Deployment Health Check Script
# Verifies production deployment status
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVER_IP="65.0.78.75"
SERVER_USER="bitnami"
SSH_KEY="n8n/LightsailDefaultKey-ap-south-1.pem"
BACKEND_URL="https://backend.aajminpolyclinic.com.np"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Health Check${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}✗ SSH key not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH key found${NC}"

# Check SSH connection
echo -e "${YELLOW}Checking SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'Connected'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    exit 1
fi

# Check server status
echo ""
echo -e "${YELLOW}Checking server status...${NC}"
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    echo "Server Information:"
    echo "  Hostname: $(hostname)"
    echo "  Uptime: $(uptime -p)"
    echo "  Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
    echo "  Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
    echo ""
    
    # Check if project directory exists
    if [ -d "/home/bitnami/multi-tenant-backend" ]; then
        echo "✓ Project directory exists"
        cd /home/bitnami/multi-tenant-backend
        
        # Check git status
        echo "  Git branch: $(git branch --show-current)"
        echo "  Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
    else
        echo "✗ Project directory not found"
        exit 1
    fi
    echo ""
    
    # Check PM2 status
    if command -v pm2 &> /dev/null; then
        echo "PM2 Status:"
        pm2 list
        echo ""
        
        # Check if backend is running
        if pm2 list | grep -q "backend-api-prod.*online"; then
            echo "✓ Backend API is running"
        else
            echo "✗ Backend API is not running"
        fi
    else
        echo "✗ PM2 not installed"
    fi
    echo ""
    
    # Check PostgreSQL
    if systemctl is-active --quiet postgresql; then
        echo "✓ PostgreSQL is running"
    else
        echo "✗ PostgreSQL is not running"
    fi
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        echo "✓ Nginx is running"
    else
        echo "✗ Nginx is not running"
    fi
ENDSSH

# Check API health endpoint
echo ""
echo -e "${YELLOW}Checking API health endpoint...${NC}"
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✓ API health check passed${NC}"
    echo "  Response: $(curl -s "$BACKEND_URL/health" | jq -r '.status' 2>/dev/null || echo 'ok')"
else
    echo -e "${RED}✗ API health check failed${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Health Check Complete${NC}"
echo -e "${GREEN}========================================${NC}"
