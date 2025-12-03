#!/bin/bash
set -e

echo "Stopping services..."
pm2 stop multi-tenant-backend hospital-frontend || true

echo "Backing up..."
cp -r multi-tenant-backend multi-tenant-backend-backup-$(date +%H%M%S) || true
cp -r hospital-frontend hospital-frontend-backup-$(date +%H%M%S) || true

echo "Extracting backend..."
cd multi-tenant-backend
unzip -o ../backend-tenant-fix-v2-dec3.zip
cd ..

echo "Extracting frontend..."
cd hospital-frontend
rm -rf .next
unzip -o ../frontend-tenant-fix-v2-dec3-next.zip
unzip -o ../frontend-tenant-fix-v2-dec3-other.zip
cd ..

echo "Restarting services..."
pm2 restart multi-tenant-backend hospital-frontend

sleep 5

echo "Deployment complete!"
pm2 list
