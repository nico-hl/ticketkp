# 🏠 Lokale Installation - Ticketsystem

**Komplette Anleitung für die lokale Installation OHNE Supabase**

Alles läuft auf Ihrem Unraid - keine externen Dienste benötigt!

## 🚀 **Schnelle Installation (3 Schritte)**

### **Schritt 1: Dateien übertragen**

**Option A: Via Terminal (SCP)**
```bash
# Ersetzen Sie UNRAID-IP mit Ihrer Unraid IP-Adresse
scp -r /Users/nico/Ticketsystem root@UNRAID-IP:/mnt/user/appdata/ticketkp
```

**Option B: Via GUI/Finder**
1. Finder → "Gehe zu" → "Mit Server verbinden"
2. `smb://UNRAID-IP` eingeben
3. Zu `/mnt/user/appdata/` navigieren
4. Ordner `Ticketsystem` komplett kopieren
5. In `ticketkp` umbenennen

### **Schritt 2: Umgebungsvariablen einrichten**

Auf Unraid (SSH oder Terminal):
```bash
cd /mnt/user/appdata/ticketkp

# .env Datei erstellen
cat > .env << 'EOF'
# Datenbank Passwort
DB_PASSWORD=MeinSicheresPasswort2024!

# Verschlüsselungsschlüssel (32 Zeichen)
ENCRYPTION_KEY=IhrSicherer32ZeichenSchluesselHier

# Container Ports
WEB_PORT=3000
DB_PORT=5432
EOF
```

### **Schritt 3: Container starten**

```bash
# Lokale Version starten (mit PostgreSQL)
docker-compose -f docker-compose.local.yml up -d
```

🎉 **Fertig!** Ihr Ticketsystem läuft unter: `http://UNRAID-IP:3000`

---

## 🔧 **Detaillierte Anleitung**

### **Was Sie bekommen:**

- ✅ **PostgreSQL Datenbank** - Läuft lokal auf Unraid
- ✅ **Ticketsystem App** - Moderne Web-Oberfläche
- ✅ **Datei-Storage** - Uploads werden lokal gespeichert
- ✅ **PWA Support** - Installierbar auf iOS mit Badges
- ✅ **Komplett verschlüsselt** - Ihre Daten sind sicher
- ✅ **Keine externen Abhängigkeiten** - Funktioniert offline

### **Container-Übersicht:**

1. **ticketsystem-db** (PostgreSQL)
   - Port: 5432
   - Volume: `postgres_data`
   - Automatische Datenbank-Initialisierung

2. **ticketsystem** (Web-App)
   - Port: 3000
   - Volumes: `./uploads`, `./data`
   - Datei-Uploads lokal gespeichert

### **Verzeichnisstruktur nach Installation:**

```
/mnt/user/appdata/ticketkp/
├── .env                        # Ihre Konfiguration
├── docker-compose.local.yml    # Lokale Container-Config
├── init.sql                   # Datenbank-Schema
├── uploads/                   # Hochgeladene Dateien
├── data/                      # App-Daten
└── ... (alle anderen Dateien)
```

---

## 🔒 **Sicherheitseinstellungen**

### **Starkes Passwort generieren:**
```bash
# Sicheres DB-Passwort generieren
openssl rand -base64 32

# Sicheren Verschlüsselungsschlüssel generieren
openssl rand -base64 32
```

### **Firewall (optional):**
```bash
# Nur lokaler Zugriff (in docker-compose.local.yml ändern)
ports:
  - "192.168.1.100:3000:3000"  # Nur von dieser IP erreichbar
```

---

## 📊 **Verwaltung & Monitoring**

### **Container Status prüfen:**
```bash
docker ps
# Sollte zeigen: ticketsystem, ticketsystem-db
```

### **Logs anzeigen:**
```bash
# App Logs
docker logs ticketsystem

# Datenbank Logs
docker logs ticketsystem-db

# Live Logs
docker logs -f ticketsystem
```

### **Datenbank-Backup:**
```bash
# Backup erstellen
docker exec ticketsystem-db pg_dump -U ticketuser ticketsystem > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
docker exec -i ticketsystem-db psql -U ticketuser ticketsystem < backup_20240101.sql
```

---

## 🔄 **Updates & Wartung**

### **System Updates:**
```bash
cd /mnt/user/appdata/ticketkp

# Container stoppen
docker-compose -f docker-compose.local.yml down

# Code aktualisieren (falls von Git)
git pull origin main

# Neu bauen und starten
docker-compose -f docker-compose.local.yml build --no-cache
docker-compose -f docker-compose.local.yml up -d
```

### **Aufräumen:**
```bash
# Unbenutzte Images löschen
docker image prune

# Unbenutzte Volumes löschen (VORSICHT!)
docker volume prune
```

---

## 🛠️ **Troubleshooting**

### **Container startet nicht:**

1. **Logs prüfen:**
   ```bash
   docker logs ticketsystem
   docker logs ticketsystem-db
   ```

2. **Ports prüfen:**
   ```bash
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5432
   ```

3. **Berechtigungen:**
   ```bash
   chmod -R 755 /mnt/user/appdata/ticketkp
   chown -R nobody:users /mnt/user/appdata/ticketkp
   ```

### **Datenbank-Verbindung fehlgeschlagen:**

1. **Datenbank-Container läuft?**
   ```bash
   docker ps | grep ticketsystem-db
   ```

2. **Health Check:**
   ```bash
   docker exec ticketsystem-db pg_isready -U ticketuser
   ```

3. **Passwort korrekt?**
   - Prüfen Sie die `.env` Datei
   - Keine Sonderzeichen in Passwörtern verwenden

### **Datei-Uploads funktionieren nicht:**

1. **Upload-Verzeichnis prüfen:**
   ```bash
   ls -la /mnt/user/appdata/ticketkp/uploads/
   ```

2. **Berechtigungen setzen:**
   ```bash
   mkdir -p /mnt/user/appdata/ticketkp/uploads
   chmod 777 /mnt/user/appdata/ticketkp/uploads
   ```

---

## 📱 **PWA Installation**

### **iOS Safari:**
1. Besuche `http://UNRAID-IP:3000`
2. Teilen-Button → "Zum Home-Bildschirm"
3. Badge zeigt automatisch offene Tickets

### **Android Chrome:**
1. Besuche die URL
2. Menü → "App installieren"
3. Badge-Support verfügbar

### **Desktop:**
1. Chrome/Edge öffnen
2. URL-Leiste → Install-Icon klicken

---

## 📈 **Performance-Optimierung**

### **Ressourcen-Limits setzen:**

In `docker-compose.local.yml` ergänzen:
```yaml
services:
  ticketsystem:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
  
  postgres:
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
```

### **Datenbank-Tuning:**

Für bessere Performance bei vielen Tickets:
```sql
-- In der Datenbank ausführen
CREATE INDEX CONCURRENTLY idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX CONCURRENTLY idx_tickets_date ON tickets(date DESC);
```

---

## 🎯 **Fertig!**

Ihr lokales Ticketsystem ist jetzt:
- ✅ Vollständig funktionsfähig
- ✅ Sicher verschlüsselt
- ✅ Unabhängig von externen Diensten
- ✅ Als PWA installierbar
- ✅ Automatisch gesichert (über Unraid)

**Support:** Bei Problemen alle Logs prüfen und diese Anleitung durchgehen! 