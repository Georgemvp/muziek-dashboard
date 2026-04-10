# Muziek-dashboard

Een persoonlijke muziekdashboard op basis van Last.fm, draaiend als Docker-container op je Mac Mini.

**Functies:** recente nummers · top artiesten & tracks · aanbevelingen · ontdek nieuwe artiesten · Plex collectiegaten

---

## Mappenstructuur

```
lastfm-app/
├── server.js           ← Node/Express backend + alle API-logica
├── public/
│   └── index.html      ← Frontend (HTML/CSS/JS in één bestand)
├── Dockerfile          ← Hoe de container wordt gebouwd
├── docker-compose.yml  ← Hoe de container wordt gestart
├── .env                ← Jouw API-sleutels (nooit committen!)
├── .env.example        ← Leeg sjabloon voor .env
├── .dockerignore       ← Bestanden die niet in de Docker image gaan
└── README.md           ← Dit bestand
```

---

## Opstarten

Zorg dat `.env` gevuld is (zie `.env.example`), open Terminal en run:

```bash
cd ~/pad/naar/lastfm-app
docker compose up -d
```

De app is bereikbaar op: **http://localhost:9090**

---

## Wijzigingen aanbrengen

Pas `public/index.html` of `server.js` aan en herbouw de container:

```bash
docker compose down
docker compose up -d --build
```

---

## Handige commando's

```bash
# Logs bekijken
docker compose logs -f

# Status controleren
docker compose ps

# Container herstarten
docker compose restart

# Cache handmatig vernieuwen (via API)
curl -X POST http://localhost:9090/api/discover/refresh
curl -X POST http://localhost:9090/api/gaps/refresh
```

---

## API-overzicht

| Endpoint | Omschrijving |
|---|---|
| `GET /api/user` | Profielinfo |
| `GET /api/recent` | Recentelijk gespeeld |
| `GET /api/topartists?period=7day` | Top artiesten (7day / 1month / 3month / 12month / overall) |
| `GET /api/toptracks?period=7day` | Top nummers |
| `GET /api/loved` | Geliefde nummers |
| `GET /api/recs` | Snelle aanbevelingen (Last.fm + Plex) |
| `GET /api/discover` | Diepgaande ontdekkingen (MusicBrainz + Deezer) |
| `GET /api/gaps` | Ontbrekende albums bij artiesten die je al hebt |
| `GET /api/artist/:name/info` | Artiest-info (foto, albums, tags, Plex-status) |
| `GET /api/plex/status` | Plex verbindingsstatus |
| `GET /api/plex/nowplaying` | Wat er nu speelt in Plex |
| `POST /api/discover/refresh` | Forceer discover-cache vernieuwing |
| `POST /api/gaps/refresh` | Forceer gaps-cache vernieuwing |
