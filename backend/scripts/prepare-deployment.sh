#!/bin/bash

###############################################################################
# Deployment Preparation Script
# Prepares the production server for first deployment
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_IP="65.0.78.75"
SERVER_USER="bitnami"
SSH_KEY="../n8n/LightsailDefaultKey-ap-south-1.pem"
GITHUB_REPO="https://github.com/mdwasim1340/multi-tenant-backend-only.git"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Preparation${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    exit 1
fi

chmod 400 "$SSH_KEY"
echo -e "${GREEN}✓ SSH key permissions set${NC}"

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SERVER_USER@$SERVER_IP" "echo 'Connection successful'" &>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo "Please check:"
    echo "  1. Server is running"
    echo "  2. SSH key is correct"
    echo "  3. Network connectivity"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking server status...${NC}"

ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
    set -e
    
    echo "Server Information:"
    echo "  Hostname: $(hostname)"
    echo "  OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "  Uptime: $(uptime -p)"
    echo ""
    
    # Check if Node.js is installed
    if command -v node &> /dev/null; then
        echo "✓ Node.js installed: $(node --version)"
    else
        echo "✗ Node.js not installed"
        echo "  Will be installed during setup"
    fi
    
    # Check if PM2 is installed
    if command -v pm2 &> /dev/null; then
        echo "✓ PM2 installed: $(pm2 --version)"
    else
        echo "✗ PM2 not installed"
        echo "  Will be installed during setup"
    fi
    
    # Check if PostgreSQL is installed
    if command -v psql &> /dev/null; then
        echo "✓ PostgreSQL installed: $(psql --version | head -1)"
    else
        echo "✗ PostgreSQL not installed"
        echo "  Will be installed during setup"
    fi
    
    # Check if Nginx is installed
    if command -v nginx &> /dev/null; then
        echo "✓ Nginx installed: $(nginx -v 2>&1 | cut -d'/' -f2)"
    else
        echo "✗ Nginx not installed"
        echo "  Will be installed during setup"
    fi
    
    echo ""
    
    # Check if project directory exists
    if [ -d "/home/bitnami/multi-tenant-backend" ]; then
        echo "✓ Project directory exists"
        cd /home/bitnami/multi-tenant-backend
        
        # Check git status
        if [ -d ".git" ]; then
            echo "  Git branch: $(git branch --show-current)"
            echo "  Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
        fi
    else
        echo "✗ Project directory not found"
        echo "  Will be created during setup"
    fi
    
    echo ""
    echo "Disk Space:"
    df -h / | tail -1 | awk '{print "  Total: " $2 ", Used: " $3 " (" $5 "), Available: " $4}'
    
    echo ""
    echo "Memory:"
    free -h | grep Mem | awk '{print "  Total: " $2 ", Used: " $3 ", Available: " $7}'
ENDSSH

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Preparation Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. ${BLUE}First-time setup${NC} (if server is not configured):"
echo "   scp -i $SSH_KEY scripts/setup-production.sh $SERVER_USER@$SERVER_IP:/home/bitnami/"
echo "   ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP"
echo "   chmod +x setup-production.sh"
echo "   ./setup-production.sh"
echo ""
echo "2. ${BLUE}Deploy application${NC}:"
echo "   ./deploy.sh"
echo ""
echo "3. ${BLUE}Verify deployment${NC}:"
echo "   ./scripts/check-deployment.sh"
echo "   curl https://backend.aajminpolyclinic.com.np/health"
echo ""
