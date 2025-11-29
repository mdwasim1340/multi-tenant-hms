#!/bin/bash

# Frontend-Only Deployment Script for AWS Lightsail
# Server: 65.0.78.75
# Backend already deployed on port 3001
# Frontend will be deployed on port 3002
# Using Cloudflare SSL (no Let's Encrypt needed)

set -e  # Exit on error

echo "=========================================="
echo "Hospital Management System"
echo "Frontend Deployment Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3001
FRONTEND_PORT=3002
APP_DIR="/opt/hospital-management"
FRONTEND_DIR="$APP_DIR/frontend"
LOGS_DIR="$APP_DIR/logs"

echo -e "${BLUE}Step 1: Verify Backend Status${NC}"
echo "----------------------------------------"
echo "Checking if backend is running on port $BACKEND_PORT..."
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running on port $BACKEND_PORT${NC}"
else
    echo -e "${RED}✗ Backend is NOT responding on port $BACKEND_PORT${NC}"
    echo "Please ensure backend is deployed and running first."
    exit 1
fi
echo ""

echo -e "${BLUE}Step 2: Check Port Availability${NC}"
echo "----------------------------------------"
if sudo lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Port $FRONTEND_PORT is already in use${NC}"
    echo "Current process:"
    sudo lsof -i :$FRONTEND_PORT
    read -p "Do you want to stop the existing process? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pm2 stop hospital-frontend 2>/dev/null || true
        echo -e "${GREEN}✓ Stopped existing process${NC}"
    else
        echo "Deployment cancelled."
        exit 1
    fi
else
    echo -e "${GREEN}✓ Port $FRONTEND_PORT is available${NC}"
fi
echo ""

echo -e "${BLUE}Step 3: Verify Frontend Directory${NC}"
echo "----------------------------------------"
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}✗ Frontend directory not found: $FRONTEND_DIR${NC}"
    echo "Please upload frontend files first."
    exit 1
fi

cd "$FRONTEND_DIR"
echo -e "${GREEN}✓ Frontend directory exists${NC}"
echo "Location: $FRONTEND_DIR"
echo ""

echo -e "${BLUE}Step 4: Check Required Files${NC}"
echo "----------------------------------------"
REQUIRED_FILES=("package.json" ".next" "node_modules")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "$file" ]; then
        MISSING_FILES+=("$file")
        echo -e "${RED}✗ Missing: $file${NC}"
    else
        echo -e "${GREEN}✓ Found: $file${NC}"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}Missing required files/directories. Please ensure:${NC}"
    echo "1. Frontend files are uploaded"
    echo "2. npm install has been run"
    echo "3. npm run build has been run"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 5: Verify Environment Configuration${NC}"
echo "----------------------------------------"
if [ -f ".env.local" ] || [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ Environment file found${NC}"
    
    # Check for required variables
    ENV_FILE=".env.local"
    [ -f ".env.production" ] && ENV_FILE=".env.production"
    
    if grep -q "NEXT_PUBLIC_API_URL" "$ENV_FILE"; then
        API_URL=$(grep "NEXT_PUBLIC_API_URL" "$ENV_FILE" | cut -d '=' -f2)
        echo "  API URL: $API_URL"
    else
        echo -e "${YELLOW}⚠ NEXT_PUBLIC_API_URL not found in $ENV_FILE${NC}"
    fi
    
    if grep -q "PORT" "$ENV_FILE"; then
        ENV_PORT=$(grep "^PORT=" "$ENV_FILE" | cut -d '=' -f2)
        if [ "$ENV_PORT" != "$FRONTEND_PORT" ]; then
            echo -e "${YELLOW}⚠ PORT in .env ($ENV_PORT) doesn't match expected port ($FRONTEND_PORT)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ No environment file found (.env.local or .env.production)${NC}"
    echo "Creating default .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.aajminpolyclinic.com.np
NEXT_PUBLIC_API_KEY=your_api_key_here
PORT=$FRONTEND_PORT
NODE_ENV=production
EOF
    echo -e "${GREEN}✓ Created .env.local with default values${NC}"
    echo -e "${YELLOW}⚠ Please update API_KEY and other values as needed${NC}"
fi
echo ""

echo -e "${BLUE}Step 6: Test Frontend Locally${NC}"
echo "----------------------------------------"
echo "Starting frontend on port $FRONTEND_PORT for testing..."
timeout 10s npm start -- -p $FRONTEND_PORT > /tmp/frontend-test.log 2>&1 &
TEST_PID=$!
sleep 5

if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend starts successfully${NC}"
    kill $TEST_PID 2>/dev/null || true
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    echo "Check logs:"
    cat /tmp/frontend-test.log
    kill $TEST_PID 2>/dev/null || true
    exit 1
fi
echo ""

echo -e "${BLUE}Step 7: Configure PM2${NC}"
echo "----------------------------------------"
# Check if PM2 ecosystem file exists
if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
    echo "Creating PM2 ecosystem configuration..."
    cat > "$APP_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'hospital-backend',
      cwd: '/opt/hospital-management/backend',
      script: 'src/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/opt/hospital-management/logs/backend-error.log',
      out_file: '/opt/hospital-management/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'hospital-frontend',
      cwd: '/opt/hospital-management/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3002',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/opt/hospital-management/logs/frontend-error.log',
      out_file: '/opt/hospital-management/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
EOF
    echo -e "${GREEN}✓ Created ecosystem.config.js${NC}"
else
    echo -e "${GREEN}✓ ecosystem.config.js already exists${NC}"
fi
echo ""

echo -e "${BLUE}Step 8: Start Frontend with PM2${NC}"
echo "----------------------------------------"
cd "$APP_DIR"

# Stop if already running
pm2 stop hospital-frontend 2>/dev/null || true
pm2 delete hospital-frontend 2>/dev/null || true

# Start frontend
echo "Starting frontend..."
pm2 start ecosystem.config.js --only hospital-frontend

# Wait for startup
sleep 3

# Check status
if pm2 list | grep -q "hospital-frontend.*online"; then
    echo -e "${GREEN}✓ Frontend started successfully${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    pm2 logs hospital-frontend --lines 20
    exit 1
fi

# Save PM2 configuration
pm2 save
echo -e "${GREEN}✓ PM2 configuration saved${NC}"
echo ""

echo -e "${BLUE}Step 9: Verify Frontend is Running${NC}"
echo "----------------------------------------"
sleep 2

if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is responding on port $FRONTEND_PORT${NC}"
else
    echo -e "${RED}✗ Frontend is not responding${NC}"
    echo "Checking logs..."
    pm2 logs hospital-frontend --lines 20
    exit 1
fi
echo ""

echo -e "${BLUE}Step 10: Configure Apache Reverse Proxy${NC}"
echo "----------------------------------------"
VHOST_FILE="/opt/bitnami/apache/conf/vhosts/hospital-vhost.conf"

if [ -f "$VHOST_FILE" ]; then
    echo -e "${YELLOW}⚠ Virtual host file already exists${NC}"
    echo "Location: $VHOST_FILE"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping Apache configuration."
        echo "Please manually configure reverse proxy for:"
        echo "  - aajminpolyclinic.com.np → localhost:$FRONTEND_PORT"
        echo "  - api.aajminpolyclinic.com.np → localhost:$BACKEND_PORT"
        echo ""
        echo -e "${GREEN}Frontend deployment complete!${NC}"
        exit 0
    fi
fi

echo "Creating Apache virtual host configuration..."
sudo tee "$VHOST_FILE" > /dev/null << 'EOF'
# Backend API
<VirtualHost *:80>
    ServerName api.aajminpolyclinic.com.np
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/
    
    # Headers for Cloudflare
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
    
    ErrorLog /opt/bitnami/apache/logs/api-error.log
    CustomLog /opt/bitnami/apache/logs/api-access.log combined
</VirtualHost>

# Frontend Application
<VirtualHost *:80>
    ServerName aajminpolyclinic.com.np
    ServerAlias www.aajminpolyclinic.com.np
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3002/
    ProxyPassReverse / http://localhost:3002/
    
    # WebSocket support for Next.js
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*)           ws://localhost:3002/$1 [P,L]
    
    # Headers for Cloudflare
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-For "%{REMOTE_ADDR}s"
    
    ErrorLog /opt/bitnami/apache/logs/frontend-error.log
    CustomLog /opt/bitnami/apache/logs/frontend-access.log combined
</VirtualHost>
EOF

echo -e "${GREEN}✓ Virtual host configuration created${NC}"
echo ""

echo -e "${BLUE}Step 11: Test and Restart Apache${NC}"
echo "----------------------------------------"
echo "Testing Apache configuration..."
if sudo /opt/bitnami/apache/bin/apachectl configtest 2>&1 | grep -q "Syntax OK"; then
    echo -e "${GREEN}✓ Apache configuration is valid${NC}"
    
    echo "Restarting Apache..."
    sudo /opt/bitnami/ctlscript.sh restart apache
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Apache restarted successfully${NC}"
    else
        echo -e "${RED}✗ Failed to restart Apache${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Apache configuration has errors${NC}"
    sudo /opt/bitnami/apache/bin/apachectl configtest
    exit 1
fi
echo ""

echo -e "${BLUE}Step 12: Final Verification${NC}"
echo "----------------------------------------"
sleep 2

echo "Testing endpoints..."
echo ""

# Test backend
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend: http://localhost:$BACKEND_PORT/health${NC}"
else
    echo -e "${RED}✗ Backend not responding${NC}"
fi

# Test frontend
if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend: http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "${RED}✗ Frontend not responding${NC}"
fi

# Test through Apache
if curl -s -H "Host: aajminpolyclinic.com.np" http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Apache proxy: aajminpolyclinic.com.np${NC}"
else
    echo -e "${YELLOW}⚠ Apache proxy test failed (may work with actual domain)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Frontend Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "📊 Deployment Summary:"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo "  Domain:   https://aajminpolyclinic.com.np (via Cloudflare SSL)"
echo "  API:      https://api.aajminpolyclinic.com.np (via Cloudflare SSL)"
echo ""
echo "📝 Next Steps:"
echo "  1. Verify Cloudflare DNS points to 65.0.78.75"
echo "  2. Ensure Cloudflare SSL is set to 'Full' or 'Full (strict)'"
echo "  3. Test: https://aajminpolyclinic.com.np"
echo "  4. Test: https://api.aajminpolyclinic.com.np/health"
echo "  5. Monitor logs: pm2 logs hospital-frontend"
echo ""
echo "🔧 Useful Commands:"
echo "  pm2 status"
echo "  pm2 logs hospital-frontend"
echo "  pm2 restart hospital-frontend"
echo "  pm2 monit"
echo ""
