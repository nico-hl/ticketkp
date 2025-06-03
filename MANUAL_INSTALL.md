# 🚀 Manuelle Installation auf Unraid

## SSH-Zugang zu Unraid herstellen

1. **Terminal öffnen** (Mac) oder **PowerShell** (Windows)
2. **SSH-Verbindung herstellen:**
   ```bash
   ssh root@192.168.10.254
   ```
   Passwort eingeben: `345123Nc#`

## Schritt 1: Dateien hochladen

Die Dateien wurden bereits erfolgreich übertragen. Prüfen Sie:

```bash
cd /mnt/user/appdata/ticketkp
ls -la
```

Sie sollten alle Ticketsystem-Dateien sehen.

## Schritt 2: Docker-Container starten

Da der Pre-Built-Build fehlgeschlagen ist, verwenden wir die lokale Version:

```bash
cd /mnt/user/appdata/ticketkp

# Verwende lokales Docker-Compose
docker-compose -f docker-compose.local.yml up -d
```

## Schritt 3: Status prüfen

```bash
# Container-Status anzeigen
docker ps

# Logs anzeigen (falls Probleme)
docker-compose -f docker-compose.local.yml logs

# Web-Interface testen
curl http://localhost:3000
```

## Schritt 4: Zugriff testen

1. **Im Browser öffnen:** `http://192.168.10.254:3000`
2. **PWA installieren:** "Zum Home-Bildschirm hinzufügen"

## Alternative: Vollständige Neuinstallation

Falls Probleme auftreten, können Sie eine vollständige Neuinstallation durchführen:

```bash
cd /mnt/user/appdata/ticketkp

# Alle Container stoppen und entfernen
docker-compose -f docker-compose.local.yml down
docker system prune -f

# Neu starten
docker-compose -f docker-compose.local.yml up -d --build
```

## Verwaltung

```bash
# Container-Verwaltung
./manage-ticketsystem.sh

# Verfügbare Befehle:
# - status    : Status anzeigen
# - logs      : Logs anzeigen  
# - restart   : Neustart
# - stop      : Stoppen
# - start     : Starten
# - backup    : Backup erstellen
# - restore   : Backup wiederherstellen
```

## Troubleshooting

### Container startet nicht
```bash
docker-compose -f docker-compose.local.yml logs ticketsystem
```

### Datenbank-Probleme
```bash
docker-compose -f docker-compose.local.yml logs db
docker exec ticketsystem-db pg_isready -U ticketuser
```

### Port bereits belegt
```bash
netstat -tlnp | grep :3000
# Falls ein anderer Service Port 3000 verwendet, stoppen Sie diesen oder
# ändern Sie den Port in docker-compose.local.yml
```

## Zugangsdaten

- **Web-Interface:** http://192.168.10.254:3000
- **Datenbank:** PostgreSQL (nur intern)
- **Uploads:** `/mnt/user/appdata/ticketkp/uploads`
- **Backups:** `/mnt/user/appdata/ticketkp-backup-*`

## Features testen

1. **Ticket erstellen** mit Bild-Upload
2. **PWA installieren** auf dem iPhone
3. **Badge-Funktion** testen (zeigt offene Tickets)
4. **Benutzer zuweisen** (Nico/Finnja)
5. **Prioritäten setzen** (Low/Normal/High)
6. **Status ändern** (Open/In Progress/Completed)

Die Anwendung ist vollständig offline-fähig und funktioniert auch ohne Internetverbindung! 