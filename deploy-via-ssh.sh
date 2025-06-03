#!/bin/bash

# 🚀 SSH-basierte Unraid Installation
# Installiert das Ticketsystem direkt über SSH auf Unraid
#
# Verwendung: ./deploy-via-ssh.sh
#
# Was passiert:
# 1. Abfrage der SSH-Zugangsdaten
# 2. Lokaler Build und Optimierung
# 3. Direkter Transfer via SSH/SCP
# 4. Remote-Installation auf Unraid
# 5. Container-Start und Test

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
    echo "║    🚀 SSH TICKETSYSTEM DEPLOYMENT        ║"
    echo "║    Direkt • Schnell • Automatisch        ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

# SSH-Zugangsdaten abfragen
get_ssh_credentials() {
    echo -e "${BLUE}🔐 SSH-Zugangsdaten für Unraid${NC}"
    echo ""
    
    # IP-Adresse
    read -p "📡 Unraid IP-Adresse (z.B. 192.168.10.254): " UNRAID_IP
    if [[ -z "$UNRAID_IP" ]]; then
        error "IP-Adresse ist erforderlich"
    fi
    
    # Benutzername
    read -p "👤 SSH-Benutzername [root]: " UNRAID_USER
    UNRAID_USER=${UNRAID_USER:-root}
    
    # Passwort oder SSH-Key?
    echo ""
    echo "🔑 Authentifizierung:"
    echo "  1) SSH-Key (empfohlen)"
    echo "  2) Passwort"
    read -p "Wählen Sie (1 oder 2) [1]: " auth_method
    auth_method=${auth_method:-1}
    
    if [[ "$auth_method" == "2" ]]; then
        read -s -p "🔒 SSH-Passwort: " UNRAID_PASSWORD
        echo ""
        export SSHPASS="$UNRAID_PASSWORD"
        SSH_CMD="sshpass -e ssh"
        SCP_CMD="sshpass -e scp"
        RSYNC_CMD="sshpass -e rsync"
    else
        SSH_CMD="ssh"
        SCP_CMD="scp"
        RSYNC_CMD="rsync"
        
        # Prüfe ob SSH-Key existiert
        if [[ ! -f ~/.ssh/id_rsa && ! -f ~/.ssh/id_ed25519 ]]; then
            warn "Kein SSH-Key gefunden. Möchten Sie einen erstellen?"
            read -p "SSH-Key erstellen? (j/n) [j]: " create_key
            create_key=${create_key:-j}
            
            if [[ "$create_key" =~ ^[jJ] ]]; then
                log "🔑 Erstelle SSH-Key..."
                ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""
                
                log "📤 Kopiere SSH-Key zu Unraid..."
                echo "Bitte geben Sie das Unraid-Passwort ein:"
                ssh-copy-id "$UNRAID_USER@$UNRAID_IP"
            fi
        fi
    fi
    
    REMOTE_DIR="/mnt/user/appdata/ticketkp"
    
    echo ""
    log "📋 Verbindungsdetails:"
    echo "   IP: $UNRAID_IP"
    echo "   User: $UNRAID_USER"
    echo "   Auth: $([ "$auth_method" == "2" ] && echo "Passwort" || echo "SSH-Key")"
    echo "   Ziel: $REMOTE_DIR"
    echo ""
}

show_banner

# SSH-Tools prüfen
if [[ "$auth_method" == "2" ]] && ! command -v sshpass &> /dev/null; then
    warn "sshpass ist nicht installiert. Installiere es für Passwort-Authentifizierung:"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "brew install hudochenkov/sshpass/sshpass"
        read -p "Jetzt installieren? (j/n) [j]: " install_sshpass
        install_sshpass=${install_sshpass:-j}
        
        if [[ "$install_sshpass" =~ ^[jJ] ]]; then
            if command -v brew &> /dev/null; then
                brew install hudochenkov/sshpass/sshpass
            else
                error "Homebrew ist nicht installiert. Bitte installieren Sie sshpass manuell."
            fi
        else
            error "sshpass ist für Passwort-Authentifizierung erforderlich"
        fi
    else
        error "Bitte installieren Sie sshpass für Passwort-Authentifizierung"
    fi
fi

# Zugangsdaten abfragen
get_ssh_credentials

# SSH-Verbindung testen
log "🔐 Teste SSH-Verbindung zu $UNRAID_IP..."
if ! $SSH_CMD -o ConnectTimeout=5 -o BatchMode=yes "$UNRAID_USER@$UNRAID_IP" "echo 'SSH OK'" 2>/dev/null; then
    if [[ "$auth_method" == "1" ]]; then
        error "SSH-Verbindung fehlgeschlagen. Stellen Sie sicher, dass SSH-Keys korrekt eingerichtet sind."
    else
        error "SSH-Verbindung fehlgeschlagen. Prüfen Sie IP, Benutzername und Passwort."
    fi
fi

log "✅ SSH-Verbindung erfolgreich"

# Lokale Vorbereitung
log "🧹 Bereite lokales System vor..."

# Cleanup
log "🗑️ Entferne alte Build-Dateien..."
rm -rf .next 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Dependencies und Build
log "📦 Installiere Dependencies und erstelle Build..."
npm ci
npm run build

# Entferne node_modules für Transfer
log "🎯 Optimiere für Transfer..."
rm -rf node_modules

# Remote-Vorbereitung
log "📁 Bereite Remote-System vor..."

# Stoppe eventuell laufende Container
$SSH_CMD "$UNRAID_USER@$UNRAID_IP" << 'EOF'
if [[ -d "/mnt/user/appdata/ticketkp" ]]; then
    echo "Stoppe eventuell laufende Container..."
    cd /mnt/user/appdata/ticketkp
    if [[ -f "docker-compose.local.yml" ]]; then
        docker-compose -f docker-compose.local.yml down 2>/dev/null || true
    fi
    if [[ -f "docker-compose.prebuilt.yml" ]]; then
        docker-compose -f docker-compose.prebuilt.yml down 2>/dev/null || true
    fi
    
    # Backup erstellen
    if [[ -d "uploads" || -f ".env" ]]; then
        echo "Erstelle Backup der bestehenden Daten..."
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
EOF

# Dateien übertragen
log "🚀 Übertrage Dateien via SSH..."

# Optimierter rsync-Transfer
$RSYNC_CMD -av --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  --delete \
  . "$UNRAID_USER@$UNRAID_IP:$REMOTE_DIR/"

log "✅ Dateien erfolgreich übertragen"

# Remote-Installation
log "⚡ Starte Remote-Installation..."

$SSH_CMD "$UNRAID_USER@$UNRAID_IP" << EOF
cd $REMOTE_DIR

# Scripts ausführbar machen
chmod +x install-unraid.sh manage-ticketsystem.sh

# Installation starten
echo "🚀 Starte Ticketsystem-Installation..."
./install-unraid.sh

echo "✅ Installation abgeschlossen!"
EOF

# Status prüfen
log "🔍 Prüfe Installation..."

# Warte kurz auf Container-Start
sleep 10

# Status abrufen
$SSH_CMD "$UNRAID_USER@$UNRAID_IP" << EOF
cd $REMOTE_DIR
echo "📊 Container Status:"
docker ps --filter "name=ticketsystem" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Quick Health Check:"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web-Interface ist erreichbar"
else
    echo "⚠️ Web-Interface antwortet noch nicht"
fi

if docker exec ticketsystem-db pg_isready -U ticketuser > /dev/null 2>&1; then
    echo "✅ Datenbank ist bereit"
else
    echo "⚠️ Datenbank-Problem"
fi
EOF

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
echo ""
echo -e "💡 ${BLUE}Tipp:${NC} Für Updates einfach dieses Script erneut ausführen!"

log "🎯 SSH-Deployment erfolgreich abgeschlossen!" 