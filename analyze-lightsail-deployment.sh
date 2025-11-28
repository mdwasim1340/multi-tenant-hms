#!/bin/bash

# Lightsail Deployment Analysis Script
# Server: 65.0.78.75
# User: bitnami

echo "=========================================="
echo "AWS Lightsail Server Analysis"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}1. System Information${NC}"
echo "----------------------------------------"
uname -a
echo ""
cat /etc/os-release | grep PRETTY_NAME
echo ""

echo -e "${GREEN}2. Running Services${NC}"
echo "----------------------------------------"
sudo systemctl list-units --type=service --state=running | grep -E 'apache|nginx|postgresql|mysql|node|pm2'
echo ""

echo -e "${GREEN}3. Listening Ports${NC}"
echo "----------------------------------------"
echo "Port | Process | PID"
echo "----------------------------------------"
sudo netstat -tulpn | grep LISTEN | awk '{print $4 " | " $7}' | sort -t: -k2 -n
echo ""

echo -e "${GREEN}4. PM2 Processes${NC}"
echo "----------------------------------------"
pm2 list
echo ""
pm2 describe all 2>/dev/null | grep -E 'name|script|port|status|uptime'
echo ""

echo -e "${GREEN}5. Docker Containers${NC}"
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not running or not installed"
echo ""

echo -e "${GREEN}6. Web Server Configuration${NC}"
echo "----------------------------------------"
if [ -d "/opt/bitnami/apache" ]; then
    echo "Apache (Bitnami) detected"
    echo "Virtual hosts:"
    ls -la /opt/bitnami/apache/conf/vhosts/ 2>/dev/null
    echo ""
    echo "Enabled sites:"
    cat /opt/bitnami/apache/conf/vhosts/*.conf 2>/dev/null | grep -E 'ServerName|ProxyPass|Listen' | head -20
elif [ -d "/etc/nginx" ]; then
    echo "Nginx detected"
    echo "Enabled sites:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null
    echo ""
    cat /etc/nginx/sites-enabled/* 2>/dev/null | grep -E 'server_name|proxy_pass|listen' | head -20
fi
echo ""

echo -e "${GREEN}7. Database Services${NC}"
echo "----------------------------------------"
sudo systemctl status postgresql 2>/dev/null | grep -E 'Active|Main PID' || echo "PostgreSQL not found"
sudo systemctl status mysql 2>/dev/null | grep -E 'Active|Main PID' || echo "MySQL not found"
echo ""

echo -e "${GREEN}8. Node.js Applications${NC}"
echo "----------------------------------------"
ps aux | grep node | grep -v grep | awk '{print $2 " | " $11 " " $12 " " $13 " " $14}'
echo ""

echo -e "${GREEN}9. Application Directories${NC}"
echo "----------------------------------------"
echo "Common application locations:"
ls -la /opt/ 2>/dev/null | grep -v total
echo ""
ls -la /home/bitnami/ 2>/dev/null | grep -v total | head -10
echo ""

echo -e "${GREEN}10. Disk Usage${NC}"
echo "----------------------------------------"
df -h | grep -E 'Filesystem|/dev/'
echo ""

echo -e "${GREEN}11. Memory Usage${NC}"
echo "----------------------------------------"
free -h
echo ""

echo -e "${GREEN}12. Environment Variables (Node apps)${NC}"
echo "----------------------------------------"
pm2 env 0 2>/dev/null | grep -E 'PORT|NODE_ENV|API' || echo "No PM2 processes found"
echo ""

echo -e "${GREEN}13. SSL Certificates${NC}"
echo "----------------------------------------"
sudo ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No Let's Encrypt certificates found"
echo ""

echo -e "${GREEN}14. Firewall Status${NC}"
echo "----------------------------------------"
sudo ufw status verbose 2>/dev/null || echo "UFW not enabled"
echo ""

echo -e "${GREEN}15. Cron Jobs${NC}"
echo "----------------------------------------"
crontab -l 2>/dev/null || echo "No cron jobs for current user"
echo ""

echo "=========================================="
echo "Analysis Complete"
echo "=========================================="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the output above"
echo "2. Identify port conflicts (especially 3000, 3001)"
echo "3. Check existing virtual host configurations"
echo "4. Verify available resources (disk, memory)"
echo "5. Update deployment plan accordingly"
