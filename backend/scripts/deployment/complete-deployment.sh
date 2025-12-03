#!/bin/bash
# Complete Frontend Deployment on Server

set -e

echo "=========================================="
echo "Completing Frontend Deployment"
echo "=========================================="
echo ""

cd /opt/hospital-management/frontend

echo "Step 1: Installing dependencies..."
npm install --production --legacy-peer-deps

echo ""
echo "Step 2: Running deployment script..."
cd ~
chmod +x deploy-frontend-only.sh
./deploy-frontend-only.sh

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs hospital-frontend"
echo "Test: curl http://localhost:3002"
echo ""
