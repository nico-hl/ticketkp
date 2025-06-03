#!/bin/bash

# 🚀 Schneller Unraid Transfer Script
# Optimiert für minimale Übertragungszeit und erfolgreiche Installation
#
# Verwendung: ./copy-to-unraid.sh UNRAID-IP
#
# Was passiert:
# 1. Lokales Cleanup
# 2. Dependencies installieren
# 3. Build erstellen
# 4. Nur notwendige Dateien übertragen
# 5. Auf Unraid installieren

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
    echo "║    🚀 OPTIMIERTER UNRAID TRANSFER        ║"
    echo "║    Schnell • Sicher • Vollautomatisch    ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Parameter prüfen
if [[ -z "$1" ]]; then
    echo "Verwendung: $0 UNRAID-IP"
    echo "Beispiel: $0 192.168.1.100"
    exit 1
fi

UNRAID_IP="$1"
TEMP_DIR="/tmp/ticketsystem-transfer"

show_banner

log "🧹 Bereite lokales System vor..."

# 1. Cleanup lokaler Build-Reste
log "🗑️ Entferne alte Build-Dateien..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# 2. Dependencies installieren/aktualisieren
log "📦 Installiere Dependencies..."
npm ci

# 3. Produktions-Build erstellen
log "🏗️ Erstelle Production Build..."
npm run build

# 4. Transfer-Verzeichnis vorbereiten
log "📁 Bereite Transfer vor..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 5. Nur notwendige Dateien kopieren
log "📋 Kopiere notwendige Dateien..."

# Grundlegende Projektdateien
cp package.json "$TEMP_DIR/"
cp package-lock.json "$TEMP_DIR/"
cp next.config.js "$TEMP_DIR/"
cp tailwind.config.ts "$TEMP_DIR/"
cp postcss.config.mjs "$TEMP_DIR/"
cp tsconfig.json "$TEMP_DIR/"

# Source-Code
cp -r src "$TEMP_DIR/"

# Public-Verzeichnis
cp -r public "$TEMP_DIR/"

# Build-Output
cp -r .next "$TEMP_DIR/"

# Docker-Dateien
cp Dockerfile "$TEMP_DIR/"
cp Dockerfile.prebuilt "$TEMP_DIR/"
cp docker-compose.local.yml "$TEMP_DIR/"
cp docker-compose.prebuilt.yml "$TEMP_DIR/"

# Datenbank-Setup
cp init.sql "$TEMP_DIR/"

# Scripts und Dokumentation
cp install-unraid.sh "$TEMP_DIR/"
cp manage-ticketsystem.sh "$TEMP_DIR/"
cp README-UNRAID.md "$TEMP_DIR/"
cp LOKALE_INSTALLATION.md "$TEMP_DIR/"
cp env.local.example "$TEMP_DIR/"

# Scripts ausführbar machen
chmod +x "$TEMP_DIR/install-unraid.sh"
chmod +x "$TEMP_DIR/manage-ticketsystem.sh"

# 6. Dateigröße anzeigen
TRANSFER_SIZE=$(du -sh "$TEMP_DIR" | cut -f1)
log "📊 Transfer-Größe: $TRANSFER_SIZE"

# 7. Verbindung zu Unraid testen
log "🔍 Teste Verbindung zu Unraid ($UNRAID_IP)..."
if ! ping -c 1 "$UNRAID_IP" > /dev/null 2>&1; then
    error "Unraid-Server $UNRAID_IP ist nicht erreichbar"
fi

# 8. Dateien übertragen
log "🚀 Übertrage Dateien nach Unraid..."
rsync -av --progress \
  --delete \
  "$TEMP_DIR/" \
  "root@$UNRAID_IP:/mnt/user/appdata/ticketkp/"

# 9. Remote-Installation starten
log "⚡ Starte Installation auf Unraid..."
ssh "root@$UNRAID_IP" << 'EOF'
cd /mnt/user/appdata/ticketkp
chmod +x install-unraid.sh manage-ticketsystem.sh
./install-unraid.sh
EOF

# 10. Cleanup
log "🧹 Räume temporäre Dateien auf..."
rm -rf "$TEMP_DIR"

# 11. Erfolg anzeigen
echo -e "\n${GREEN}╔══════════════════════════════════════════╗"
echo "║           🎉 TRANSFER ERFOLGREICH!        ║"
echo "╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "🌐 ${BLUE}Ticketsystem URL:${NC} http://$UNRAID_IP:3000"
echo -e "📱 ${BLUE}PWA Installation:${NC} URL besuchen → 'Zum Home-Bildschirm'"
echo ""
echo -e "🛠️ ${YELLOW}Verwaltung:${NC}"
echo "   ssh root@$UNRAID_IP"
echo "   cd /mnt/user/appdata/ticketkp"
echo "   ./manage-ticketsystem.sh status"
echo ""
echo -e "💡 ${BLUE}Tipp:${NC} Für Updates einfach dieses Script erneut ausführen!"

log "🎯 Transfer und Installation in $(date) abgeschlossen!" 