# 🎫 Modernes Ticketsystem

Ein elegantes, verschlüsseltes Ticketsystem als Progressive Web App (PWA) für Nico und Finnja.

## ✨ Features

- 📱 **PWA mit iOS-Badge-Support** - Installierbar auf iOS mit Badge-Anzeige für offene Tickets
- 🔒 **End-to-End Verschlüsselung** - Alle sensiblen Daten sind verschlüsselt
- 📅 **Apple-Style Datepicker** - Native iOS-ähnliche Datumsauswahl
- 📎 **Datei- & Bildupload** - Mit Vorschau für hochgeladene Bilder
- 👥 **Benutzer-Zuweisung** - Tickets an Nico und/oder Finnja zuweisen
- ⚡ **Prioritäts-System** - Niedrig, Normal, Hoch mit visueller Hervorhebung
- 🔄 **Status-Management** - Offen, In Bearbeitung, Fertig
- 📊 **Dashboard** - Übersicht mit Statistiken
- 🔍 **Filter-Funktionen** - Nach Status und Priorität filtern
- 📱 **Responsive Design** - Optimiert für alle Geräte
- ⚡ **Real-time Updates** - Sofortige Aktualisierungen
- 🐳 **Docker-Ready** - Einfache Installation auf Unraid

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Storage)
- **PWA**: next-pwa für Installation & Badges
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Styling**: Tailwind CSS
- **Encryption**: crypto-js
- **Deployment**: Docker + Docker Compose

## 🚀 Deployment-Optionen

### 🐳 Option 1: Docker auf Unraid (Empfohlen)

**Schnellste Installation für Unraid:**

1. **Repository in Unraid klonen:**
   ```bash
   cd /mnt/user/appdata/
   git clone https://github.com/your-username/ticketsystem.git
   cd ticketsystem
   ```

2. **Umgebungsvariablen einrichten:**
   ```bash
   # .env Datei erstellen
   nano .env
   ```
   
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ENCRYPTION_KEY=your-super-secure-32-character-key
   ```

3. **Docker Container starten:**
   ```bash
   # Mit Docker Compose
   docker-compose up -d
   
   # Oder direkt via Unraid Docker UI:
   # Repository: ticketsystem:latest
   # Port: 3000:3000
   # Umgebungsvariablen wie oben eintragen
   ```

4. **Zugriff:** `http://your-unraid-ip:3000`

**Detaillierte Anleitung:** Siehe [DOCKER_SETUP.md](DOCKER_SETUP.md)

### 💻 Option 2: Lokale Entwicklung

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd ticketsystem
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   ```

3. **Supabase Projekt erstellen**
   - Gehe zu [supabase.com](https://supabase.com)
   - Erstelle ein neues Projekt
   - Kopiere URL und anon key

4. **Umgebungsvariablen einrichten**
   ```bash
   # .env.local erstellen
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   NEXT_PUBLIC_ENCRYPTION_KEY=change-this-to-a-secure-key-in-production
   ```

5. **Supabase Datenbank Schema**
   
   Führe diese SQL-Befehle in der Supabase SQL Editor aus:

   ```sql
   -- Tickets Tabelle erstellen
   CREATE TABLE tickets (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     subject TEXT NOT NULL,
     description TEXT NOT NULL,
     contact TEXT NOT NULL,
     date TIMESTAMP WITH TIME ZONE NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'completed')),
     priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
     assigned_users TEXT[] DEFAULT '{}',
     files JSONB DEFAULT '[]',
     history JSONB DEFAULT '[]',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Storage Bucket für Dateien
   INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-files', 'ticket-files', true);

   -- RLS Policies (für Demo-Zwecke alle erlauben)
   ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Allow all operations" ON tickets
   FOR ALL USING (true) WITH CHECK (true);

   CREATE POLICY "Allow all operations on storage" ON storage.objects
   FOR ALL USING (bucket_id = 'ticket-files') WITH CHECK (bucket_id = 'ticket-files');
   ```

6. **Anwendung starten**
   ```bash
   npm run dev
   ```

## 🐳 Docker Features

- **Multi-stage Build** für optimale Image-Größe
- **Health Checks** für Container-Monitoring
- **Non-root User** für Sicherheit
- **Standalone Output** für Performance
- **Unraid Template** für einfache Installation
- **Auto-Restart** bei Containern-Crashes

## 📱 PWA Features

### iOS Badge Support
- Automatische Badge-Anzeige mit Anzahl offener Tickets
- Funktioniert ab iOS 16.4+
- Updates in Echtzeit

### Installation
- **iOS**: Safari → Teilen → Zum Home-Bildschirm
- **Android**: Chrome → Menü → App installieren
- **Desktop**: Chrome → URL-Leiste → Install-Icon

## 🔐 Sicherheit

- **Verschlüsselung**: Betreff, Beschreibung und Kontakt werden vor dem Speichern verschlüsselt
- **Umgebungsvariablen**: Alle sensiblen Daten über Umgebungsvariablen
- **Supabase RLS**: Row Level Security für Datenbankzugriff
- **Non-root Container**: Docker läuft mit eingeschränkten Berechtigungen
- **Secure Headers**: Automatische Sicherheits-Headers

## 📋 Ticket-Felder

- **Betreff**: Kurze Zusammenfassung
- **Beschreibung**: Detaillierte Problembeschreibung
- **Kontakt**: Name, E-Mail oder Telefon
- **Datum**: Apple-Style Datumsauswahl
- **Priorität**: Niedrig, Normal, Hoch
- **Zuweisung**: Nico und/oder Finnja
- **Dateien**: Upload mit Bildvorschau
- **Status**: Offen → In Bearbeitung → Fertig

## 🎨 Design-Prinzipien

- **Clean & Minimal**: Übersichtliche, nicht überladene UI
- **Apple-inspired**: Native iOS-ähnliche Komponenten
- **Responsive**: Optimiert für alle Bildschirmgrößen
- **Accessibility**: Barrierefreie Bedienung

## 🚀 Deployment

### Unraid (empfohlen)
```bash
# In /mnt/user/appdata/ticketsystem/
docker-compose up -d
```

### Vercel
```bash
npm run build
vercel --prod
```

### Andere Plattformen
```bash
npm run build
npm start
```

## 🔄 Updates

### Docker auf Unraid
```bash
cd /mnt/user/appdata/ticketsystem
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### Lokale Installation
```bash
git pull origin main
npm install
npm run build
```

## 📊 Monitoring

### Container Health
```bash
# Status prüfen
docker ps

# Logs anzeigen
docker logs ticketsystem

# Health Check
docker inspect ticketsystem | grep -A 10 "Health"
```

### Metriken
- Automatische Health Checks alle 30 Sekunden
- Container Restart bei Fehlern
- Resource Limits konfigurierbar

## 🛠️ Troubleshooting

### Häufige Probleme

1. **Container startet nicht**
   ```bash
   docker logs ticketsystem
   ```

2. **Supabase Verbindung**
   - Prüfe URL und API-Key
   - Teste Netzwerk-Konnektivität

3. **Port bereits belegt**
   ```bash
   # Anderen Port verwenden
   docker run -p 3001:3000 ...
   ```

4. **Permissions**
   ```bash
   chmod -R 755 /mnt/user/appdata/ticketsystem
   ```

## 📞 Support

Bei Fragen oder Problemen:
- Überprüfe die Container-Logs
- Teste die Supabase-Verbindung
- Kontrolliere die Umgebungsvariablen
- Schaue in die Browser-Konsole für Client-Fehler

## 📂 Projektstruktur

```
ticketsystem/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React Komponenten
│   ├── lib/                 # Utilities & API
│   └── types/               # TypeScript Definitionen
├── public/                  # Statische Assets
├── docker-compose.yml       # Docker Compose Config
├── Dockerfile              # Docker Build Instructions
├── unraid-template.xml     # Unraid Template
└── DOCKER_SETUP.md         # Detaillierte Docker Anleitung
```

---

**Entwickelt für Nico und Finnja** 🎯

**🐳 Docker-Ready für sichere Unraid-Installation!**
