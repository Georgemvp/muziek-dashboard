# Last.fm Music Dashboard

Een persoonlijke muziekdashboard op basis van **Last.fm** met integratie van **Plex**, **Spotify**, en **Tidarr**. Draait in Docker als containerized applicatie.

**Hoofdfuncties:**
- 🎵 Last.fm statistieken (recente nummers, top artiesten, geliefd)
- 🎬 Plex media collectie verkennen en afspelen
- 🎯 Spotify aanbevelingen op basis van stemming
- 🚀 Tidarr voor muziekdownloads via Tidal
- 🔍 Artiest-info met foto's, albums, genres en tags
- 🎨 Genre-overzichten met artiestengrid
- 💾 SQLite cache voor snellere laadtijden

---

## 📁 Mappenstructuur

```
lastfm-app/
├── public/
│   ├── src/
│   │   ├── main.js         ← Frontend entry point
│   │   └── styles.css      ← Styling (esbuild gecompileerd)
│   ├── chunks/             ← Gecompileerde JavaScript chunks
│   ├── fonts/              ← Web fonts
│   ├── index.html          ← HTML shell
│   └── app.js              ← Gecompileerde frontend
│
├── routes/
│   ├── lastfm.js           ← Last.fm API routes
│   ├── artist.js           ← Artiest-detail routes
│   ├── plex.js             ← Plex integratie & media control
│   ├── spotify.js          ← Spotify aanbevelingen
│   ├── tidarr.js           ← Tidarr downloads
│   └── misc.js             ← Overige routes
│
├── services/
│   ├── lastfm.js           ← Last.fm API client
│   ├── plex.js             ← Plex API client & library sync
│   ├── musicbrainz.js      ← MusicBrainz metadata
│   ├── deezer.js           ← Deezer artiest foto's
│   ├── spotify.js          ← Spotify aanbevelingen
│   ├── tidarr.js           ← Tidarr client
│   ├── discover.js         ← Nieuwe artiesten ontdekking
│   ├── gaps.js             ← Ontbrekende albums detectie
│   ├── releases.js         ← Nieuwe releases tracker
│   └── imageproxy.js       ← Image proxy & caching
│
├── server.js               ← Express backend
├── db.js                   ← SQLite database & cache
├── logger.js               ← Logging configuratie
├── package.json
├── Dockerfile
├── docker-compose.yml
├── supervisord.conf        ← Supervisor config
├── .env                    ← Environment variables (niet committen!)
├── .env.example            ← Template voor .env
└── README.md               ← Dit bestand
```

---

## 🚀 Installatie & Setup

### Vereisten
- Docker & Docker Compose
- API-sleutels voor:
  - Last.fm (https://www.last.fm/api)
  - Plex (lokale server of cloud)
  - Spotify (optioneel, https://developer.spotify.com)
  - Tidarr (optioneel, voor Tidal downloads)

### Stap 1: Environment configureren

```bash
cp .env.example .env
```

Vul ``.env`` in met je API-sleutels:

```env
# Last.fm
LASTFM_API_KEY=your_key_here
LASTFM_USER=your_username

# Plex
PLEX_URL=http://your-plex:32400
PLEX_TOKEN=your_plex_token

# Spotify (optioneel)
SPOTIFY_CLIENT_ID=optional
SPOTIFY_CLIENT_SECRET=optional

# Tidarr (optioneel)
TIDARR_URL=http://tidarr:8484
TIDARR_API_KEY=optional

# Server
PORT=9090
LOG_LEVEL=info
NODE_ENV=production
```

### Stap 2: Docker starten

```bash
docker compose up -d
```

De app is bereikbaar op: **http://localhost:9090**

Logs checken:
```bash
docker compose logs -f
```

---

## 🛠️ Development

### Frontend development

```bash
npm run dev
```

Dit start esbuild in watch-modus. Bestanden in `public/src/` worden gecompileerd naar `public/`.

### Frontend builden

```bash
npm run build:frontend
```

Dit minified en bundelt de frontend voor production.

### Tests

```bash
npm test              # Eenmalig uitvoeren
npm run test:watch    # Continu testen
```

### Container herbouwen

```bash
docker compose down
docker compose up -d --build
```

---

## 📡 API Endpoints

### Last.fm Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/user` | GET | Profielinfo & statistieken |
| `/api/recent` | GET | Recentelijk gespeeld nummers |
| `/api/top/artists` | GET | Top artiesten (query: `period=7day\|1month\|3month\|12month\|overall`) |
| `/api/top/tracks` | GET | Top nummers |
| `/api/loved` | GET | Alle geliefde nummers |
| `/api/artist/search` | GET | Zoeken naar artiesten |
| `/api/artist/:name` | GET | Artiest-detail (foto, albums, genres, stats) |
| `/api/artist/:name/info` | GET | Uitgebreide artiest-info (MusicBrainz data) |
| `/api/artist/:name/similar` | GET | Soortgelijke artiesten |
| `/api/genre/:genre` | GET | Artiesten in genre met foto's |

### Plex Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/plex/status` | GET | Plex verbindingsstatus |
| `/api/plex/library` | GET | Plex bibliotheekinfo |
| `/api/plex/search` | GET | Zoeken in Plex bibliotheek |
| `/api/plex/artist/:artist` | GET | Artiest in Plex (met albums) |
| `/api/plex/album/:name` | GET | Album in Plex |
| `/api/plex/clients` | GET | Beschikbare Plex clients |
| `/api/plex/play` | POST | Afspelen op client |
| `/api/plex/pause` | POST | Pauzeren |
| `/api/plex/stop` | POST | Stoppen |
| `/api/plex/skip/next` | POST | Volgende nummer |
| `/api/plex/skip/prev` | POST | Vorig nummer |
| `/api/plex/nowplaying` | GET | Wat er nu speelt |
| `/api/plex/playlists` | GET | Alle Plex playlists |
| `/api/plex/playlist/:id/tracks` | GET | Nummers in playlist |
| `/api/plex/refresh-library` | POST | Trigger Plex library scan |

### Spotify Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/spotify/moods` | GET | Beschikbare stemmingen |
| `/api/spotify/recommendations` | GET | Aanbevelingen (query: `mood=happy\|sad\|etc`) |

### Tidarr Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/tidarr/status` | GET | Tidarr verbindingsstatus |
| `/api/tidarr/search` | GET | Zoeken in Tidal |
| `/api/tidarr/queue` | GET | Download queue |
| `/api/tidarr/history` | GET | Download history |
| `/api/tidarr/add` | POST | Album toevoegen aan queue |
| `/api/tidarr/remove` | POST | Item verwijderen |

### Discovery Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/discover` | GET | Ontdek nieuwe artiesten |
| `/api/discover/refresh` | POST | Cache verversen |
| `/api/gaps` | GET | Ontbrekende albums detectie |
| `/api/gaps/refresh` | POST | Cache verversen |
| `/api/releases` | GET | Nieuwe releases van artiesten |
| `/api/releases/refresh` | POST | Cache verversen |

### Wishlist & Downloads

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/wishlist` | GET | Mijn wishlist |
| `/api/wishlist/add` | POST | Item toevoegen |
| `/api/wishlist/remove` | POST | Item verwijderen |
| `/api/downloads` | GET | Mijn downloads |
| `/api/downloads/add` | POST | Download toevoegen |
| `/api/downloads/remove` | POST | Download verwijderen |

---

## 🔧 Handige Commando's

### Docker Management

```bash
# Container starten
docker compose up -d

# Container stoppen
docker compose down

# Logs in realtime
docker compose logs -f

# Specifieke service logs
docker compose logs -f app

# Status controleren
docker compose ps

# Container herstarten
docker compose restart
```

### Cache & Caching

```bash
# Cache handmatig verversen (via API)
curl -X POST http://localhost:9090/api/discover/refresh
curl -X POST http://localhost:9090/api/gaps/refresh
curl -X POST http://localhost:9090/api/releases/refresh
```

### Database

```bash
# SQLite database inspectie (in container)
docker compose exec app sqlite3 data/cache.db

# Query voorbeeld
sqlite> SELECT * FROM cache LIMIT 5;
```

---

## 🔐 Environment Variabelen

| Variable | Nodig | Beschrijving |
|----------|-------|--------------|
| `LASTFM_API_KEY` | ✅ | API-sleutel van Last.fm |
| `LASTFM_USER` | ✅ | Last.fm gebruikersnaam |
| `PLEX_URL` | ✅ | Plex server URL (bijv. `http://localhost:32400`) |
| `PLEX_TOKEN` | ✅ | Plex API token |
| `SPOTIFY_CLIENT_ID` | ❌ | Spotify app ID |
| `SPOTIFY_CLIENT_SECRET` | ❌ | Spotify app secret |
| `TIDARR_URL` | ❌ | Tidarr container URL |
| `TIDARR_API_KEY` | ❌ | Tidarr API key |
| `PORT` | ❌ | Server poort (default: 9090) |
| `NODE_ENV` | ❌ | Environment (default: production) |
| `LOG_LEVEL` | ❌ | Log niveau (default: info) |

---

## 📊 Cache & Performance

De app gebruikt SQLite voor caching:

- **Cache TTL**: Configureerbaar per endpoint
- **Image Proxy**: Cacht externe afbeeldingen
- **Etag Support**: Staticische bestanden hebben browser caching headers
- **Compression**: Gzip compression ingeschakeld

Cache-Control headers per bestandstype:
- HTML: `no-cache` (altijd opnieuw laden)
- Chunks: `public, max-age=31536000, immutable` (1 jaar)
- CSS/JS/Fonts: `public, max-age=86400` (1 dag)

---

## 🐛 Troubleshooting

### Plex niet bereikbaar

```bash
# Check Plex verbinding
curl http://your-plex:32400/library/sections

# Controleer PLEX_URL en PLEX_TOKEN in .env
docker compose logs | grep -i plex
```

### Tidarr proxy fout

Tidarr UI is beschikbaar op `/tidarr-ui` route. Als deze niet werkt:

```bash
# Check of Tidarr container draait
docker compose ps

# Controleer logs
docker compose logs tidarr
```

### Cache problemen

```bash
# Cache is opgeslagen in `/data/` volume
# Volume verwijderen om cache te clearen
docker compose down -v
docker compose up -d
```

### Last.fm API limits

Last.fm heeft rate limits. Als je veel requests doet:
- Cache wordt gebruikt (standaard enabled)
- Rate limiter is ingesteld op 30 req/min per IP
- Controleer `LOG_LEVEL=debug` voor meer details

---

## 📝 Logging

Logging via Pino met gestructureerde logs. Output naar stdout/stderr in JSON-formaat in production, pretty-printed in development.

Log bestanden:
- `docker compose logs` → Alle service logs
- `docker compose logs app` → Alleen app logs

---

## 📦 Dependencies

| Package | Gebruik |
|---------|---------|
| `express` | Web framework |
| `better-sqlite3` | Synchrone SQLite client |
| `compression` | Gzip middleware |
| `express-rate-limit` | Rate limiting |
| `pino` | Logging |
| `sharp` | Image processing |
| `http-proxy-middleware` | Tidarr proxy |
| `esbuild` | Frontend bundler |

---

## 📄 Licentie

Privé project. Niet publiek beschikbaar.

---

## 👤 Contact

Voor bugs, features, of vragen: check de LOGGING.md voor debug info.
