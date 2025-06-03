#!/bin/bash

# 🎯 Ticketsystem - Management Script
# Verwaltung der Ticketsystem-Installation auf Unraid
#
# Verwendung: ./manage-ticketsystem.sh [command]
# 
# Kommandos:
#   status    - Zeigt Container-Status
#   logs      - Zeigt Logs an
#   restart   - Startet Container neu
#   stop      - Stoppt Container
#   start     - Startet Container
#   backup    - Erstellt Backup
#   update    - Aktualisiert System
#   clean     - Räumt auf
#
# Autor: Assistant
# Version: 1.0

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfiguration
APP_DIR="/mnt/user/appdata/ticketkp"
BACKUP_DIR="/mnt/user/appdata/ticketkp-backups"

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

# Prüfung ob Installation existiert
check_installation() {
    if [[ ! -d "$APP_DIR" ]]; then
        error "Ticketsystem ist nicht installiert. Führen Sie zuerst ./install-unraid.sh aus"
    fi
    
    if [[ ! -f "$APP_DIR/docker-compose.local.yml" ]]; then
        error "Docker Compose Datei nicht gefunden in $APP_DIR"
    fi
}

# Docker Compose Wrapper
compose_cmd() {
    cd "$APP_DIR"
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.local.yml "$@"
    else
        docker compose -f docker-compose.local.yml "$@"
    fi
}

# Container Status anzeigen
show_status() {
    echo -e "${BLUE}🔍 Container Status:${NC}"
    echo ""
    
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=ticketsystem" | grep -q ticketsystem; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=ticketsystem"
        echo ""
        
        # Service URLs
        local server_ip=$(hostname -I | awk '{print $1}')
        echo -e "${GREEN}🌐 Services:${NC}"
        echo "   • Web-Interface: http://$server_ip:3000"
        echo "   • Datenbank: localhost:5432"
        echo ""
        
        # Ressourcen-Nutzung
        echo -e "${BLUE}📊 Ressourcen:${NC}"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" ticketsystem ticketsystem-db 2>/dev/null || echo "   Stats nicht verfügbar"
        
    else
        warn "Keine Ticketsystem-Container gefunden"
        echo "   Möglicherweise ist das System gestoppt"
        echo "   Verwenden Sie: $0 start"
    fi
}

# Logs anzeigen
show_logs() {
    local service="$1"
    local lines="${2:-50}"
    
    if [[ -z "$service" ]]; then
        echo -e "${BLUE}📋 Verfügbare Services für Logs:${NC}"
        echo "   • app - Ticketsystem Anwendung"
        echo "   • db  - PostgreSQL Datenbank"
        echo "   • all - Beide Services"
        echo ""
        echo "Verwendung: $0 logs [app|db|all] [anzahl_zeilen]"
        return
    fi
    
    case "$service" in
        "app")
            echo -e "${BLUE}📋 Ticketsystem App Logs (letzte $lines Zeilen):${NC}"
            docker logs --tail "$lines" ticketsystem 2>/dev/null || warn "Container nicht gefunden"
            ;;
        "db")
            echo -e "${BLUE}📋 Datenbank Logs (letzte $lines Zeilen):${NC}"
            docker logs --tail "$lines" ticketsystem-db 2>/dev/null || warn "Container nicht gefunden"
            ;;
        "all")
            echo -e "${BLUE}📋 Alle Logs (letzte $lines Zeilen):${NC}"
            echo "=== Ticketsystem App ==="
            docker logs --tail "$lines" ticketsystem 2>/dev/null || warn "App Container nicht gefunden"
            echo -e "\n=== Datenbank ==="
            docker logs --tail "$lines" ticketsystem-db 2>/dev/null || warn "DB Container nicht gefunden"
            ;;
        "live")
            echo -e "${BLUE}📋 Live Logs (Ctrl+C zum Beenden):${NC}"
            docker logs -f ticketsystem &
            docker logs -f ticketsystem-db &
            wait
            ;;
        *)
            error "Unbekannter Service: $service"
            ;;
    esac
}

# Container neustarten
restart_services() {
    log "🔄 Starte Container neu..."
    compose_cmd restart
    log "✅ Container neu gestartet"
    
    # Kurz warten und Status prüfen
    sleep 3
    show_status
}

# Container stoppen
stop_services() {
    log "🛑 Stoppe Container..."
    compose_cmd down
    log "✅ Container gestoppt"
}

# Container starten
start_services() {
    log "🚀 Starte Container..."
    compose_cmd up -d
    log "✅ Container gestartet"
    
    # Health Check
    log "⏳ Warte auf Service-Start..."
    local retries=30
    while ! docker exec ticketsystem-db pg_isready -U ticketuser > /dev/null 2>&1; do
        if [[ $retries -eq 0 ]]; then
            warn "Datenbank braucht länger zum Starten"
            break
        fi
        echo -n "."
        sleep 2
        ((retries--))
    done
    echo ""
    
    sleep 3
    show_status
}

# Backup erstellen
create_backup() {
    local backup_name="ticketsystem-backup-$(date +%Y%m%d-%H%M%S)"
    
    log "💾 Erstelle Backup: $backup_name"
    
    # Backup-Verzeichnis erstellen
    mkdir -p "$BACKUP_DIR"
    
    local backup_path="$BACKUP_DIR/$backup_name"
    mkdir -p "$backup_path"
    
    # Datenbank-Backup
    log "📊 Sichere Datenbank..."
    docker exec ticketsystem-db pg_dump -U ticketuser ticketsystem > "$backup_path/database.sql" 2>/dev/null || warn "Datenbank-Backup fehlgeschlagen"
    
    # Dateien-Backup
    log "📁 Sichere Dateien..."
    cp -r "$APP_DIR/uploads" "$backup_path/" 2>/dev/null || warn "Upload-Dateien nicht gefunden"
    cp "$APP_DIR/.env" "$backup_path/" 2>/dev/null || warn ".env Datei nicht gefunden"
    
    # Konfiguration
    cp "$APP_DIR/docker-compose.local.yml" "$backup_path/"
    
    # Backup-Info
    cat > "$backup_path/backup-info.txt" << EOF
Ticketsystem Backup
Erstellt: $(date)
Version: 1.0
Server: $(hostname)

Inhalt:
- database.sql: PostgreSQL Dump
- uploads/: Hochgeladene Dateien
- .env: Umgebungskonfiguration
- docker-compose.local.yml: Container Konfiguration

Wiederherstellung:
1. Container stoppen: ./manage-ticketsystem.sh stop
2. Datenbank wiederherstellen: 
   docker exec -i ticketsystem-db psql -U ticketuser ticketsystem < database.sql
3. Dateien kopieren: cp -r uploads/* /mnt/user/appdata/ticketkp/uploads/
4. Container starten: ./manage-ticketsystem.sh start
EOF
    
    # Backup komprimieren
    cd "$BACKUP_DIR"
    tar -czf "${backup_name}.tar.gz" "$backup_name"
    rm -rf "$backup_name"
    
    log "✅ Backup erstellt: $BACKUP_DIR/${backup_name}.tar.gz"
    
    # Alte Backups löschen (älter als 30 Tage)
    find "$BACKUP_DIR" -name "ticketsystem-backup-*.tar.gz" -mtime +30 -delete 2>/dev/null || true
    
    echo -e "${GREEN}💾 Backup-Info:${NC}"
    echo "   • Speicherort: $BACKUP_DIR/${backup_name}.tar.gz"
    echo "   • Größe: $(du -h "$BACKUP_DIR/${backup_name}.tar.gz" | cut -f1)"
    echo "   • Inhalt: Datenbank + Uploads + Konfiguration"
}

# System aktualisieren
update_system() {
    log "🔄 Aktualisiere Ticketsystem..."
    
    # Backup vor Update
    warn "Erstelle Sicherheits-Backup vor Update..."
    create_backup
    
    # Container stoppen
    log "🛑 Stoppe Container für Update..."
    compose_cmd down
    
    # Images neu bauen
    log "🐳 Baue neue Images..."
    compose_cmd build --no-cache
    
    # Container starten
    log "🚀 Starte aktualisierte Container..."
    compose_cmd up -d
    
    log "✅ Update abgeschlossen"
    
    # Status prüfen
    sleep 5
    show_status
}

# System aufräumen
cleanup_system() {
    log "🧹 Räume System auf..."
    
    # Alte Container und Images
    log "🗑️ Lösche unbenutzte Docker-Ressourcen..."
    docker system prune -f
    
    # Alte Logs
    log "📋 Räume Container-Logs auf..."
    docker exec ticketsystem truncate -s 0 /dev/null 2>/dev/null || true
    docker exec ticketsystem-db truncate -s 0 /dev/null 2>/dev/null || true
    
    # Temporäre Dateien
    if [[ -d "$APP_DIR/.next" ]]; then
        rm -rf "$APP_DIR/.next"
    fi
    
    if [[ -d "$APP_DIR/node_modules" ]]; then
        warn "Lösche node_modules (werden beim nächsten Build neu erstellt)"
        rm -rf "$APP_DIR/node_modules"
    fi
    
    log "✅ Aufräumen abgeschlossen"
}

# Hilfe anzeigen
show_help() {
    echo -e "${BLUE}🎫 Ticketsystem Management${NC}"
    echo ""
    echo "Verwendung: $0 [KOMMANDO] [OPTIONEN]"
    echo ""
    echo -e "${GREEN}Verfügbare Kommandos:${NC}"
    echo "   status                 - Zeigt Container-Status"
    echo "   logs [app|db|all|live] - Zeigt Logs an"
    echo "   restart                - Startet Container neu"
    echo "   stop                   - Stoppt Container"
    echo "   start                  - Startet Container"
    echo "   backup                 - Erstellt vollständiges Backup"
    echo "   update                 - Aktualisiert System"
    echo "   clean                  - Räumt System auf"
    echo "   help                   - Zeigt diese Hilfe"
    echo ""
    echo -e "${YELLOW}Beispiele:${NC}"
    echo "   $0 status              # Container Status anzeigen"
    echo "   $0 logs app 100        # App Logs (100 Zeilen)"
    echo "   $0 logs live           # Live Logs verfolgen"
    echo "   $0 backup              # Backup erstellen"
    echo ""
    echo -e "${BLUE}Dateien:${NC}"
    echo "   • App-Daten: $APP_DIR"
    echo "   • Backups: $BACKUP_DIR"
}

# Hauptfunktion
main() {
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    # Installation prüfen (außer bei help)
    if [[ "$1" != "help" ]]; then
        check_installation
    fi
    
    case "$1" in
        "status")
            show_status
            ;;
        "logs")
            show_logs "$2" "$3"
            ;;
        "restart")
            restart_services
            ;;
        "stop")
            stop_services
            ;;
        "start")
            start_services
            ;;
        "backup")
            create_backup
            ;;
        "update")
            update_system
            ;;
        "clean")
            cleanup_system
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Unbekanntes Kommando: $1\n\nVerwenden Sie '$0 help' für Hilfe"
            ;;
    esac
}

# Script ausführen
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 