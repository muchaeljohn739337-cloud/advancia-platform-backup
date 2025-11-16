#!/bin/bash
# Quick fix for extraction issue

echo "Checking archive..."
ls -lh /root/advancia-deploy.zip

echo "Creating directory..."
mkdir -p /var/www/advancia

echo "Extracting archive..."
cd /root
unzip -o advancia-deploy.zip -d /var/www/advancia

echo "Checking extracted files..."
ls -la /var/www/advancia/

echo "Starting backend..."
cd /var/www/advancia/backend
pm2 delete advancia-backend || true
NODE_ENV=production pm2 start src/index.js --name advancia-backend

echo "Starting frontend..."
cd /var/www/advancia/frontend  
pm2 delete advancia-frontend || true
NODE_ENV=production pm2 start npm --name advancia-frontend -- start

pm2 save
pm2 status

echo "Done!"
