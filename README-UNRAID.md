# 🎫 Ticketsystem für Unraid

**Modernes, lokales Ticketsystem - Komplett automatisierte Installation**

---

## 🚀 **Super-Schnelle Installation (3 Minuten)**

### **1. Ordner auf Unraid kopieren**

**Via SCP (Terminal):**
```bash
scp -r /Users/nico/Ticketsystem root@UNRAID-IP:/mnt/user/appdata/ticketkp
```

**Via GUI (Finder/Explorer):**
1. Netzlaufwerk verbinden: `\\UNRAID-IP` oder `smb://UNRAID-IP`
2. Zu `appdata` navigieren
3. Ordner `Ticketsystem` komplett kopieren
4. In `ticketkp` umbenennen

### **2. Script ausführen**

Per SSH auf Unraid:
```bash
cd /mnt/user/appdata/ticketkp
./install-unraid.sh
```

### **3. Fertig! 🎉**

- **URL:** `http://UNRAID-IP:3000`
- **PWA:** URL besuchen → "Zum Home-Bildschirm hinzufügen"
- **Badge:** Zeigt automatisch offene Tickets

---

## 🛠️ **Verwaltung**

```bash
cd /mnt/user/appdata/ticketkp

# Status prüfen
./manage-ticketsystem.sh status

# Logs anzeigen
./manage-ticketsystem.sh logs app

# Backup erstellen
./manage-ticketsystem.sh backup

# Neustart
./manage-ticketsystem.sh restart

# Alle Befehle anzeigen
./manage-ticketsystem.sh help
```

---

## ✨ **Features**

- 🎫 **Ticket-Management** - Erstellen, bearbeiten, verwalten
- 📁 **Datei-Uploads** - Bilder und Dokumente anhängen
- 👥 **Benutzer-Zuweisung** - Nico und/oder Finnja
- 🎯 **Prioritäten** - Niedrig, Normal, Hoch
- 📊 **Dashboard** - Übersicht und Statistiken
- 📱 **PWA Support** - iOS App mit Badge
- 🔐 **Verschlüsselung** - Alle Daten sicher verschlüsselt
- 🏠 **100% Lokal** - Keine externen Services

---

## 📦 **Was passiert bei der Installation?**

Das Script macht **alles automatisch**:

1. ✅ **System-Checks** (Unraid, Docker, Ports)
2. ✅ **Verzeichnisse erstellen** (`/mnt/user/appdata/ticketkp`)
3. ✅ **Dateien kopieren** (ohne `node_modules`, `.git`)
4. ✅ **Sichere Passwörter generieren** (automatisch)
5. ✅ **Docker Images bauen** (PostgreSQL + App)
6. ✅ **Container starten** (mit Health-Checks)
7. ✅ **Verbindung testen** (automatisch)

**Dauer:** 3-5 Minuten (je nach Server)

---

## 🔒 **Sicherheit**

- 🔐 **Automatische Verschlüsselung** aller Ticket-Daten
- 🔑 **Sichere Passwörter** (32 Zeichen, automatisch generiert)
- 🏠 **Lokale Datenbank** (PostgreSQL, kein Cloud-Service)
- 💾 **Automatische Backups** (auf Unraid gespeichert)
- 🛡️ **Container-Isolation** (Docker Security)

---

## 🆘 **Problemlösung**

### **Script bricht ab:**
```bash
# Logs prüfen
./install-unraid.sh --logs

# Manuelle Installation
docker-compose -f docker-compose.local.yml up -d
```

### **Container starten nicht:**
```bash
# Status prüfen
docker ps

# Logs anzeigen
docker logs ticketsystem
docker logs ticketsystem-db

# Neustart versuchen
./manage-ticketsystem.sh restart
```

### **Web-Interface nicht erreichbar:**
```bash
# Firewall prüfen (falls aktiv)
iptables -L | grep 3000

# Container-Status
./manage-ticketsystem.sh status

# Andere IP verwenden
curl http://localhost:3000
```

---

## 🎯 **Das bekommen Sie:**

```
http://UNRAID-IP:3000
├── 📊 Dashboard mit Statistiken
├── ➕ Ticket erstellen (mit Datei-Upload)
├── 📋 Ticket-Liste (filterbar)
├── 👥 Benutzer-Zuweisung
├── 🎯 Prioritäten-System
├── 📱 PWA Installation
└── 🔐 Sichere Datenspeicherung
```

**Automatische Backups:** `/mnt/user/appdata/ticketkp-backups/`

---

## 📞 **Support**

- 📚 **Vollständige Anleitung:** `LOKALE_INSTALLATION.md`
- 🛠️ **Management-Befehle:** `./manage-ticketsystem.sh help`
- 📋 **Logs:** `./manage-ticketsystem.sh logs all`

**Bei Problemen:** Alle Logs sammeln und diese README durchgehen! 