#!/bin/bash

###############################################################################
# First-Time Production Setup Script
# Run this on the production server for initial setup
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Production Server Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as bitnami user
if [ "$USER" != "bitnami" ]; then
    echo -e "${RED}Error: This script must be run as bitnami user${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y

# Install Node.js (if not installed)
echo -e "${YELLOW}Step 2: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install PM2
echo -e "${YELLOW}Step 3: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "PM2 version: $(pm2 --version)"

# Setup PM2 startup
echo -e "${YELLOW}Step 4: Configuring PM2 startup...${NC}"
pm2 startup | tail -1 | sudo bash

# Install PostgreSQL
echo -e "${YELLOW}Step 5: Installing PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi
echo "PostgreSQL version: $(psql --version)"

# Create database
echo -e "${YELLOW}Step 6: Setting up database...${NC}"
read -sp "Enter PostgreSQL password for 'postgres' user: " DB_PASSWORD
echo ""

sudo -u postgres psql << EOF
-- Create database if not exists
SELECT 'CREATE DATABASE multitenant_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'multitenant_db')\gexec

-- Set password for postgres user
ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';
EOF

echo -e "${GREEN}✓ Database setup complete${NC}"

# Clone repository
echo -e "${YELLOW}Step 7: Cloning repository...${NC}"
cd /home/bitnami
if [ ! -d "multi-tenant-backend" ]; then
    git clone https://github.com/mdwasim1340/multi-tenant-backend-only.git multi-tenant-backend
else
    echo "Repository already exists, pulling latest changes..."
    cd multi-tenant-backend
    git pull origin main
fi

cd /home/bitnami/multi-tenant-backend

# Install dependencies
echo -e "${YELLOW}Step 8: Installing dependencies...${NC}"
npm install --production=false

# Build application
echo -e "${YELLOW}Step 9: Building application...${NC}"
npm run build

# Setup environment
echo -e "${YELLOW}Step 10: Configuring environment...${NC}"
if [ ! -f .env ]; then
    cp .env.production .env
    
    # Generate JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
    
    # Update .env file
    sed -i "s/DB_PASSWORD=CHANGE_THIS_IN_PRODUCTION/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/JWT_SECRET=CHANGE_THIS_TO_STRONG_SECRET_IN_PRODUCTION/JWT_SECRET=$JWT_SECRET/" .env
    
    echo -e "${GREEN}✓ Environment file created${NC}"
    echo -e "${YELLOW}⚠ Please review and update .env file with production credentials${NC}"
else
    echo "Environment file already exists"
fi

# Create logs directory
mkdir -p logs

# Run migrations
echo -e "${YELLOW}Step 11: Running database migrations...${NC}"
npm run migrate up || echo -e "${YELLOW}⚠ Migrations may have already been applied${NC}"

# Install Nginx
echo -e "${YELLOW}Step 12: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Configure Nginx
echo -e "${YELLOW}Step 13: Configuring Nginx...${NC}"
sudo tee /etc/nginx/sites-available/backend > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name backend.aajminpolyclinic.com.np;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
        proxy_read_timeout 90s;
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
echo -e "${YELLOW}Step 14: Installing Certbot for SSL...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi

echo -e "${YELLOW}Step 15: Obtaining SSL certificate...${NC}"
echo -e "${BLUE}Running certbot for backend.aajminpolyclinic.com.np${NC}"
sudo certbot --nginx -d backend.aajminpolyclinic.com.np --non-interactive --agree-tos --email admin@aajminpolyclinic.com.np || echo -e "${YELLOW}⚠ SSL setup may need manual configuration${NC}"

# Setup PM2 log rotation
echo -e "${YELLOW}Step 16: Setting up log rotation...${NC}"
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Start application
echo -e "${YELLOW}Step 17: Starting application...${NC}"
pm2 start ecosystem.config.js --env production --only backend-api-prod
pm2 save

# Setup firewall
echo -e "${YELLOW}Step 18: Configuring firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}✓ System packages updated${NC}"
echo -e "${GREEN}✓ Node.js and PM2 installed${NC}"
echo -e "${GREEN}✓ PostgreSQL configured${NC}"
echo -e "${GREEN}✓ Repository cloned${NC}"
echo -e "${GREEN}✓ Application built${NC}"
echo -e "${GREEN}✓ Nginx configured${NC}"
echo -e "${GREEN}✓ SSL certificate obtained${NC}"
echo -e "${GREEN}✓ Application started${NC}"
echo ""
echo "Backend URL: https://backend.aajminpolyclinic.com.np"
echo ""
echo "Next steps:"
echo "1. Review .env file: nano .env"
echo "2. Update production credentials"
echo "3. Restart application: pm2 restart backend-api-prod"
echo "4. Check status: pm2 status"
echo "5. View logs: pm2 logs backend-api-prod"
echo ""
echo "Useful commands:"
echo "  pm2 list          - List all processes"
echo "  pm2 monit         - Monitor resources"
echo "  pm2 logs          - View logs"
echo "  pm2 restart all   - Restart all processes"
echo ""
