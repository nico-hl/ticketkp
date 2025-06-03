#!/bin/bash

# 🚀 Manuelles Unraid Deployment
# Für SSH-Verbindungen mit Passwort-Authentifizierung
#
# Verwendung: ./deploy-manual.sh

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# Banner
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════╗"
    echo "║    🚀 MANUELLES TICKETSYSTEM DEPLOYMENT   ║"
    echo "║    Schritt für Schritt Installation      ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

UNRAID_IP="192.168.10.254"
UNRAID_USER="root"
REMOTE_DIR="/mnt/user/appdata/ticketkp"

show_banner

log "📋 Deployment-Konfiguration:"
echo "   🌐 Unraid IP: $UNRAID_IP"
echo "   👤 SSH User: $UNRAID_USER"
echo "   📁 Ziel-Verzeichnis: $REMOTE_DIR"
echo "   🔒 Passwort: 345123Nc#"
echo ""

# Schritt 1: Lokaler Build
log "🔨 Schritt 1: Lokaler Build"
echo "Bereinige alte Build-Dateien..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo "Installiere Dependencies und erstelle Build..."
npm ci
npm run build

echo "Optimiere für Transfer..."
rm -rf node_modules

log "✅ Lokaler Build abgeschlossen"
echo ""

# Schritt 2: Erstelle Transfer-Archiv
log "📦 Schritt 2: Erstelle Transfer-Archiv"
tar -czf ticketsystem-deploy.tar.gz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  .

log "✅ Transfer-Archiv erstellt: ticketsystem-deploy.tar.gz"
echo ""

# Schritt 3: Upload
log "🚀 Schritt 3: Upload zu Unraid"
echo "Das Passwort ist: 345123Nc#"
echo ""

echo "Übertrage Archiv..."
scp -o StrictHostKeyChecking=no ticketsystem-deploy.tar.gz "$UNRAID_USER@$UNRAID_IP:/tmp/"

log "✅ Upload abgeschlossen"
echo ""

# Schritt 4: Remote Installation
log "⚡ Schritt 4: Remote Installation"
echo "Das Passwort ist: 345123Nc#"
echo ""

ssh -o StrictHostKeyChecking=no "$UNRAID_USER@$UNRAID_IP" << 'EOF'
# Stoppe eventuell laufende Container
if [[ -d "/mnt/user/appdata/ticketkp" ]]; then
    echo "Stoppe eventuell laufende Container..."
    cd /mnt/user/appdata/ticketkp
    docker-compose down 2>/dev/null || true
    
    # Backup erstellen
    if [[ -d "uploads" || -f ".env" ]]; then
        echo "Erstelle Backup..."
        backup_dir="/mnt/user/appdata/ticketkp-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        [[ -d "uploads" ]] && cp -r uploads "$backup_dir/"
        [[ -f ".env" ]] && cp .env "$backup_dir/"
        echo "Backup erstellt in: $backup_dir"
    fi
fi

# Verzeichnis vorbereiten
echo "Bereite Ziel-Verzeichnis vor..."
mkdir -p /mnt/user/appdata/ticketkp
cd /mnt/user/appdata/ticketkp

# Archiv extrahieren
echo "Extrahiere Anwendung..."
tar -xzf /tmp/ticketsystem-deploy.tar.gz
rm /tmp/ticketsystem-deploy.tar.gz

# Scripts ausführbar machen
chmod +x install-unraid.sh manage-ticketsystem.sh

# Installation starten
echo "🚀 Starte Installation..."
./install-unraid.sh

echo "✅ Installation abgeschlossen!"
EOF

log "✅ Remote Installation abgeschlossen"
echo ""

# Schritt 5: Status prüfen
log "🔍 Schritt 5: Status prüfen"
echo "Das Passwort ist: 345123Nc#"
echo ""

sleep 5

ssh -o StrictHostKeyChecking=no "$UNRAID_USER@$UNRAID_IP" << 'EOF'
cd /mnt/user/appdata/ticketkp

echo "📊 Container Status:"
docker ps --filter "name=ticketsystem" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Health Check:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web-Interface ist erreichbar"
else
    echo "⚠️ Web-Interface antwortet noch nicht (kann einige Sekunden dauern)"
fi

if docker exec ticketsystem-db pg_isready -U ticketuser > /dev/null 2>&1; then
    echo "✅ Datenbank ist bereit"
else
    echo "⚠️ Datenbank-Problem"
fi
EOF

# Aufräumen
log "🧹 Lokale Aufräumung"
rm -f ticketsystem-deploy.tar.gz

# Erfolg anzeigen
echo -e "\n${GREEN}╔══════════════════════════════════════════╗"
echo "║           🎉 DEPLOYMENT ERFOLGREICH!     ║"
echo "╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "🌐 ${BLUE}Ticketsystem URL:${NC} http://$UNRAID_IP:3000"
echo -e "📱 ${BLUE}PWA Installation:${NC} URL besuchen → 'Zum Home-Bildschirm'"
echo ""
echo -e "🛠️ ${YELLOW}Remote-Verwaltung:${NC}"
echo "   ssh $UNRAID_USER@$UNRAID_IP"
echo "   cd $REMOTE_DIR"
echo "   ./manage-ticketsystem.sh status"
echo ""
echo -e "📋 ${YELLOW}Logs anzeigen:${NC}"
echo "   ssh $UNRAID_USER@$UNRAID_IP 'cd $REMOTE_DIR && ./manage-ticketsystem.sh logs all'"

log "🎯 Manuelles Deployment erfolgreich abgeschlossen!" 