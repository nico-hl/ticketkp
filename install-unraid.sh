#!/bin/bash

# 🎯 Ticketsystem - Automatische Unraid Installation
# Dieses Script installiert das komplette Ticketsystem auf Unraid
# 
# Verwendung: ./install-unraid.sh
# 
# Autor: Assistant
# Version: 1.0

set -e  # Exit bei Fehlern

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner anzeigen
show_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════╗"
    echo "║       🎫 TICKETSYSTEM INSTALLER          ║"
    echo "║       Automatische Unraid Installation   ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Logging Funktion
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

# Sichere Passwort-Generierung
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Prüfen ob wir auf Unraid sind
check_unraid() {
    if [[ ! -d "/mnt/user" ]]; then
        error "Dieses Script muss auf einem Unraid-Server ausgeführt werden!"
    fi
    log "✅ Unraid-System erkannt"
}

# Docker prüfen
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker ist nicht installiert oder nicht im PATH"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose ist nicht verfügbar"
    fi
    
    log "✅ Docker ist verfügbar"
}

# Freie Ports prüfen
check_ports() {
    local ports=("3000" "5432")
    for port in "${ports[@]}"; do
        if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
            warn "Port $port ist bereits belegt. Installation wird trotzdem fortgesetzt."
        fi
    done
    log "✅ Port-Check abgeschlossen"
}

# Zielverzeichnis erstellen
setup_directories() {
    APP_DIR="/mnt/user/appdata/ticketkp"
    
    log "📁 Erstelle Verzeichnisstruktur..."
    
    # Backup existierender Installation
    if [[ -d "$APP_DIR" ]]; then
        BACKUP_DIR="/mnt/user/appdata/ticketkp-backup-$(date +%Y%m%d-%H%M%S)"
        warn "Existierende Installation gefunden. Backup nach: $BACKUP_DIR"
        cp -r "$APP_DIR" "$BACKUP_DIR"
    fi
    
    # Verzeichnis erstellen
    mkdir -p "$APP_DIR"
    mkdir -p "$APP_DIR/uploads"
    mkdir -p "$APP_DIR/data"
    
    # Richtige Berechtigungen setzen
    chmod -R 755 "$APP_DIR"
    chown -R nobody:users "$APP_DIR"
    
    log "✅ Verzeichnisse erstellt: $APP_DIR"
}

# Dateien kopieren
copy_files() {
    log "📋 Kopiere Anwendungsdateien..."
    
    local source_dir="$(pwd)"
    
    # Alle Dateien außer node_modules und .git kopieren
    rsync -av \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.next' \
        --exclude='*.log' \
        --exclude='.env*' \
        "$source_dir/" "$APP_DIR/"
    
    log "✅ Dateien kopiert"
}

# Umgebungsvariablen erstellen
setup_environment() {
    log "🔐 Erstelle Umgebungskonfiguration..."
    
    # Sichere Passwörter generieren
    DB_PASSWORD=$(generate_password)
    ENCRYPTION_KEY=$(generate_password)
    
    # .env Datei erstellen
    cat > "$APP_DIR/.env" << EOF
# Ticketsystem - Automatisch generierte Konfiguration
# Erstellt am: $(date)

# Datenbank Konfiguration
DB_PASSWORD=${DB_PASSWORD}
POSTGRES_PASSWORD=${DB_PASSWORD}

# Verschlüsselung (32 Zeichen)
ENCRYPTION_KEY=${ENCRYPTION_KEY}
NEXT_PUBLIC_ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Datenbank URL
DATABASE_URL=postgresql://ticketuser:${DB_PASSWORD}@postgres:5432/ticketsystem

# Container Konfiguration
WEB_PORT=3000
DB_PORT=5432
STORAGE_PATH=/app/uploads

# Node.js Umgebung
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF

    # Berechtigungen setzen
    chmod 600 "$APP_DIR/.env"
    chown nobody:users "$APP_DIR/.env"
    
    log "✅ Umgebungskonfiguration erstellt"
    log "🔑 DB Passwort: $DB_PASSWORD"
    log "🔐 Verschlüsselungsschlüssel: $ENCRYPTION_KEY"
}

# Docker Images bauen
build_images() {
    log "🐳 Baue Docker Images..."
    
    cd "$APP_DIR"
    
    # Prüfe ob Pre-Built Version verfügbar ist
    if [[ -d ".next" && -f "Dockerfile.prebuilt" ]]; then
        log "📦 Verwende Pre-Built Version (schneller)..."
        # Docker Compose Build mit Pre-Built Dockerfile
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.prebuilt.yml build --no-cache
        else
            docker compose -f docker-compose.prebuilt.yml build --no-cache
        fi
        COMPOSE_FILE="docker-compose.prebuilt.yml"
    else
        log "🏗️ Erstelle Build im Container..."
        # Fallback zur normalen Version
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.local.yml build --no-cache
        else
            docker compose -f docker-compose.local.yml build --no-cache
        fi
        COMPOSE_FILE="docker-compose.local.yml"
    fi
    
    log "✅ Docker Images erstellt"
}

# Container starten
start_containers() {
    log "🚀 Starte Container..."
    
    cd "$APP_DIR"
    
    # Verwende das richtige Compose File
    local compose_file="${COMPOSE_FILE:-docker-compose.local.yml}"
    
    # Container starten
    if command -v docker-compose &> /dev/null; then
        docker-compose -f "$compose_file" up -d
    else
        docker compose -f "$compose_file" up -d
    fi
    
    log "✅ Container gestartet"
}

# Health Check
wait_for_services() {
    log "⏳ Warte auf Service-Start..."
    
    # Warte auf Datenbank
    local retries=30
    while ! docker exec ticketsystem-db pg_isready -U ticketuser > /dev/null 2>&1; do
        if [[ $retries -eq 0 ]]; then
            error "Datenbank startet nicht"
        fi
        echo -n "."
        sleep 2
        ((retries--))
    done
    echo ""
    log "✅ Datenbank ist bereit"
    
    # Warte auf Web-App
    retries=30
    while ! curl -f http://localhost:3000 > /dev/null 2>&1; do
        if [[ $retries -eq 0 ]]; then
            warn "Web-App antwortet nicht sofort. Prüfen Sie die Logs mit: docker logs ticketsystem"
            break
        fi
        echo -n "."
        sleep 2
        ((retries--))
    done
    echo ""
    log "✅ Services sind bereit"
}

# Netzwerk-Info ermitteln
get_network_info() {
    local server_ip=$(hostname -I | awk '{print $1}')
    if [[ -z "$server_ip" ]]; then
        server_ip="UNRAID-SERVER-IP"
    fi
    
    echo -e "\n${GREEN}╔══════════════════════════════════════════╗"
    echo "║            🎉 INSTALLATION FERTIG!       ║"
    echo "╚══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "🌐 ${BLUE}Ticketsystem URL:${NC} http://$server_ip:3000"
    echo -e "📱 ${BLUE}Für iOS PWA:${NC} URL besuchen → Teilen → 'Zum Home-Bildschirm'"
    echo ""
    echo -e "🔧 ${YELLOW}Verwaltung:${NC}"
    echo "   • Status prüfen: docker ps"
    echo "   • Logs anzeigen: docker logs ticketsystem"
    echo "   • Stoppen: docker-compose -f docker-compose.local.yml down"
    echo "   • Neustarten: docker-compose -f docker-compose.local.yml restart"
    echo ""
    echo -e "💾 ${YELLOW}Backup:${NC}"
    echo "   • Datenbank: docker exec ticketsystem-db pg_dump -U ticketuser ticketsystem > backup.sql"
    echo "   • Dateien: /mnt/user/appdata/ticketkp/"
    echo ""
    echo -e "📚 ${BLUE}Dokumentation:${NC} $APP_DIR/LOKALE_INSTALLATION.md"
}

# Container Status anzeigen
show_status() {
    echo -e "\n${BLUE}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=ticketsystem"
}

# Logs anzeigen (optional)
show_logs() {
    if [[ "$1" == "--logs" ]]; then
        echo -e "\n${BLUE}Aktuelle Logs:${NC}"
        echo "=== Ticketsystem ==="
        docker logs --tail 10 ticketsystem 2>/dev/null || echo "Container noch nicht bereit"
        echo -e "\n=== Datenbank ==="
        docker logs --tail 5 ticketsystem-db 2>/dev/null || echo "Container noch nicht bereit"
    fi
}

# Cleanup bei Fehlern
cleanup_on_error() {
    if [[ -d "$APP_DIR" ]]; then
        warn "Aufräumen nach Fehler..."
        cd "$APP_DIR"
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.local.yml down 2>/dev/null || true
        else
            docker compose -f docker-compose.local.yml down 2>/dev/null || true
        fi
    fi
}

# Signal Handler für Cleanup
trap cleanup_on_error ERR

# Hauptinstallation
main() {
    show_banner
    
    log "🔍 Starte Installations-Checks..."
    check_unraid
    check_docker
    check_ports
    
    log "📦 Bereite Installation vor..."
    setup_directories
    copy_files
    setup_environment
    
    log "🐳 Docker Setup..."
    build_images
    start_containers
    
    log "✅ Warte auf Service-Start..."
    wait_for_services
    
    get_network_info
    show_status
    show_logs "$1"
    
    log "🎯 Installation erfolgreich abgeschlossen!"
}

# Script ausführen
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 