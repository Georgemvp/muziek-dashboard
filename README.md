# Last.fm Muziekaanbevelingen

Een persoonlijke muziekaanbevelingsapp op basis van jouw Last.fm-account, draaiend als Docker-container op je Mac Mini M4.

## Mappenstructuur

```
lastfm-app/
├── index.html          ← De app zelf (hier pas je alles aan)
├── Dockerfile          ← Hoe de container wordt gebouwd
├── docker-compose.yml  ← Hoe de container wordt gestart
└── README.md           ← Dit bestand
```

---

## Opstarten (eerste keer)

Open Terminal op je Mac Mini en navigeer naar de map:

```bash
cd ~/lastfm-app
docker compose up -d
```

De app is daarna bereikbaar op: **http://localhost:8484**

Via ZeroTier ook bereikbaar op: **http://10.94.184.22:8484**

---

## Aanpassingen maken aan de app

Omdat `index.html` direct als volume is gekoppeld, hoef je de container **niet opnieuw te bouwen** na een wijziging. Je past `index.html` aan, slaat op, en herlaadt de pagina in je browser.

### Workflow voor aanpassingen:
1. Open `index.html` in een teksteditor (bijv. TextEdit, VS Code, of Cursor)
2. Maak je wijzigingen
3. Sla op
4. Herlaad de pagina in je browser → klaar

---

## Handige Docker-commando's

```bash
# Starten
docker compose up -d

# Stoppen
docker compose down

# Logs bekijken
docker compose logs -f

# Status controleren
docker compose ps

# Container herstarten (bijv. na config-wijziging)
docker compose restart
```

---

## Poort wijzigen

Wil je een andere poort dan 8484? Pas dit aan in `docker-compose.yml`:

```yaml
ports:
  - "9000:80"    # Verander 8484 naar jouw gewenste poort
```

Daarna:
```bash
docker compose down
docker compose up -d
```

---

## Nieuwe functies toevoegen

Alle logica zit in `index.html`. Vraag Claude om uitbreidingen te maken, zoals:
- Vergelijken met je lokale muziekbibliotheek op de 4tbdrive
- Periode-filter (week / maand / jaar)
- Genre-tags bij aanbevelingen
- Koppeling met Lidarr

Plak de nieuwe versie van `index.html` in de map en herlaad de browser.

---

## Toevoegen aan bestaande Docker Compose stack

Als je dit wilt samenvoegen met je bestaande `docker-compose.yml` (voor Immich, Lidarr, etc.), voeg dan dit blok toe aan je bestaande bestand:

```yaml
  lastfm-app:
    build: /pad/naar/lastfm-app
    container_name: lastfm-app
    restart: unless-stopped
    ports:
      - "8484:80"
    volumes:
      - /pad/naar/lastfm-app/index.html:/usr/share/nginx/html/index.html:ro
```
