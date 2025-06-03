#!/bin/bash

# Deployment script for Ticket System from GitHub to Unraid
# Usage: ./deploy-from-github.sh

set -e

UNRAID_IP="192.168.10.254"
UNRAID_USER="root"
GITHUB_REPO="https://github.com/nico-hl/ticketkp.git"
APP_NAME="ticketsystem"

echo "🚀 Deploying Ticket System from GitHub to Unraid..."

# Prompt for password
echo "Enter Unraid root password:"
read -s UNRAID_PASSWORD

echo "📥 Connecting to Unraid and cloning repository..."

# Create deployment script for Unraid
cat > temp_deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "📦 Installing git if not present..."
if ! command -v git &> /dev/null; then
    echo "Git not found, installing..."
    # For Unraid, we might need to install git
    opkg update
    opkg install git
fi

echo "🗂️ Creating application directory..."
cd /mnt/user/appdata
rm -rf ticketsystem
git clone https://github.com/nico-hl/ticketkp.git ticketsystem
cd ticketsystem

echo "🐳 Building and starting containers..."
chmod +x *.sh

# Use the local PostgreSQL setup
cp docker-compose.local.yml docker-compose.yml

# Start the application
docker-compose down || true
docker-compose pull
docker-compose up -d

echo "✅ Deployment complete!"
echo "🌐 Access your ticket system at: http://192.168.10.254:3000"
echo "🗄️ Database will be available at: http://192.168.10.254:5432"
echo "📊 Database admin at: http://192.168.10.254:8080"

# Show running containers
docker-compose ps
EOF

echo "📤 Uploading and executing deployment script..."

# Copy script to Unraid and execute
sshpass -p "$UNRAID_PASSWORD" scp temp_deploy.sh $UNRAID_USER@$UNRAID_IP:/tmp/
sshpass -p "$UNRAID_PASSWORD" ssh $UNRAID_USER@$UNRAID_IP "chmod +x /tmp/temp_deploy.sh && /tmp/temp_deploy.sh"

# Cleanup
rm temp_deploy.sh

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your ticket system is now running at: http://$UNRAID_IP:3000"
echo "🗄️ Database: http://$UNRAID_IP:5432"
echo "📊 Database Admin: http://$UNRAID_IP:8080"
echo ""
echo "Default database credentials:"
echo "  Username: postgres"
echo "  Password: ticketsystem123"
echo "  Database: ticketsystem" 