# 🐳 Docker Setup für Unraid

Komplette Anleitung zur Installation des Ticketsystems auf Unraid oder anderen Docker-Hosts.

## 🚀 Schnelle Installation auf Unraid

### Option 1: Über Community Applications (empfohlen)

1. **Community Applications installieren** (falls noch nicht installiert)
2. **Template hinzufügen:**
   - Kopiere `unraid-template.xml` in deinen Template-Ordner
   - Oder importiere direkt über die URL

3. **Container erstellen:**
   - Gehe zu Docker → Add Container
   - Wähle "Ticketsystem" Template
   - Fülle die erforderlichen Felder aus

### Option 2: Manuell über Unraid Docker UI

1. **Docker Container hinzufügen**
2. **Repository:** `ticketsystem:latest` (nach dem Build)
3. **Ports:** `3000:3000`
4. **Umgebungsvariablen** hinzufügen:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_ENCRYPTION_KEY=your-32-char-encryption-key
   ```

## 🔧 Vollständige Installation

### Schritt 1: Repository klonen

```bash
cd /mnt/user/appdata/
git clone https://github.com/nico-hk/ticketkp.git
cd ticketkp
```

### Schritt 2: Umgebungsvariablen konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env

# Bearbeiten Sie die .env Datei:
nano .env
```

**Wichtige Variablen:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
ENCRYPTION_KEY=your-super-secure-32-character-key
```

### Schritt 3: Docker Image bauen

```bash
# Image bauen
docker build -t ticketsystem:latest .

# Oder mit Docker Compose
docker-compose build
```

### Schritt 4: Container starten

```bash
# Mit Docker Compose (empfohlen)
docker-compose up -d

# Oder direkt mit Docker
docker run -d \
  --name ticketsystem \
  --restart unless-stopped \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  -e NEXT_PUBLIC_ENCRYPTION_KEY=your-32-char-key \
  -v /mnt/user/appdata/ticketkp/data:/app/data \
  ticketsystem:latest
```

## 🔒 Sicherheitsempfehlungen

### 1. Starke Verschlüsselung
```bash
# Generiere einen sicheren 32-Zeichen Schlüssel
openssl rand -base64 32
```

### 2. Reverse Proxy (Traefik/Nginx Proxy Manager)
```yaml
# Traefik Labels (optional)
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.ticketsystem.rule=Host(`tickets.yourdomain.com`)"
  - "traefik.http.routers.ticketsystem.tls=true"
  - "traefik.http.routers.ticketsystem.tls.certresolver=letsencrypt"
```

### 3. Firewall
```bash
# Nur lokalen Zugriff erlauben (optional)
-p 192.168.1.100:3000:3000
```

## 📊 Monitoring & Logs

### Logs anzeigen
```bash
# Container Logs
docker logs ticketsystem

# Live Logs
docker logs -f ticketsystem
```

### Health Check
Der Container enthält einen eingebauten Health Check:
```bash
# Health Status prüfen
docker inspect ticketsystem | grep -A 10 "Health"
```

### Ressourcen-Limits
```yaml
# In docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 🔄 Updates

### 1. Code aktualisieren
```bash
cd /mnt/user/appdata/ticketkp
git pull origin main
```

### 2. Image neu bauen
```bash
docker-compose build --no-cache
docker-compose up -d
```

### 3. Alte Images aufräumen
```bash
docker image prune
```

## 🛠️ Troubleshooting

### Container startet nicht
```bash
# Container Status prüfen
docker ps -a

# Detaillierte Logs
docker logs ticketsystem

# Container interaktiv starten
docker run -it --rm ticketsystem:latest sh
```

### Häufige Probleme

1. **"supabaseUrl is required"**
   - Überprüfe Umgebungsvariablen
   - Stelle sicher, dass .env korrekt geladen wird

2. **Port bereits belegt**
   ```bash
   # Anderen Port verwenden
   -p 3001:3000
   ```

3. **Permission Denied**
   ```bash
   # Volume Berechtigungen prüfen
   chmod -R 755 /mnt/user/appdata/ticketsystem
   ```

## 🌐 Netzwerk-Setup

### Bridge Network (Standard)
```yaml
networks:
  default:
    driver: bridge
```

### Custom Network
```bash
# Netzwerk erstellen
docker network create ticketsystem-net

# Container mit custom network
docker run --network ticketsystem-net ...
```

## 📱 PWA Features

Nach der Installation:

1. **iOS Safari:** Besuche `http://your-unraid-ip:3000`
2. **"Teilen" → "Zum Home-Bildschirm"**
3. **Badge-Unterstützung** funktioniert automatisch

## 🔧 Erweiterte Konfiguration

### Mit eigener PostgreSQL-Datenbank
```yaml
# Uncomment in docker-compose.yml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: ticketsystem
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: secure_password
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

### Backup-Strategie
```bash
# Datenbank Backup (bei lokaler PostgreSQL)
docker exec postgres pg_dump -U postgres ticketsystem > backup.sql

# Volume Backup
tar -czf ticketsystem-backup.tar.gz /mnt/user/appdata/ticketkp/
```

## 📞 Support

Bei Problemen:
1. Überprüfe die Logs: `docker logs ticketsystem`
2. Teste die Konnektivität zu Supabase
3. Prüfe Firewall-Einstellungen
4. Verifiziere Umgebungsvariablen

---

**🎯 Ihr Ticketsystem läuft sicher und effizient auf Unraid!** 