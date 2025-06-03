# 🚀 GitHub Setup & Unraid Deployment

## Schritt 1: GitHub Repository erstellen

1. **Gehe zu:** https://github.com/new
2. **Repository Name:** `ticketkp`
3. **Beschreibung:** `Modern Ticket System for iOS PWA`
4. **Visibility:** Public (oder Private)
5. **Klicke:** "Create repository"

## Schritt 2: Code zu GitHub pushen

```bash
# Im Terminal (du bist bereits im richtigen Ordner):
git push -u origin main
```

## Schritt 3: Auf Unraid installieren

### Option A: GitHub Clone (empfohlen)

SSH zu Unraid:
```bash
ssh root@192.168.10.254
```
Passwort: `345123Nc#`

Dann:
```bash
cd /mnt/user/appdata
git clone https://github.com/nico-hk/ticketkp.git
cd ticketkp
chmod +x install-unraid.sh
./install-unraid.sh
```

### Option B: Wget Download

```bash
ssh root@192.168.10.254
cd /mnt/user/appdata
wget https://github.com/nico-hk/ticketkp/archive/main.zip
unzip main.zip
mv ticketkp-main ticketkp
cd ticketkp
chmod +x install-unraid.sh
./install-unraid.sh
```

## Schritt 4: Zugriff

- **URL:** http://192.168.10.254:3000
- **PWA:** "Zum Home-Bildschirm hinzufügen" auf iPhone

## Updates (später)

```bash
ssh root@192.168.10.254
cd /mnt/user/appdata/ticketkp
git pull
docker-compose -f docker-compose.local.yml restart
```

Das war's! Viel einfacher als die ganze SSH-Upload-Geschichte! 🎉 