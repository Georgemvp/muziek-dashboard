# Logging Strategy - LastFM App

## Overview

This application uses **Pino** for structured logging with support for:
- Development: Pretty-printed console output with colors and timestamps
- Production: JSON logs suitable for log aggregation systems
- Request tracking with unique request IDs
- Service-specific context logging

## Log Levels

| Level | Usage | Environment |
|-------|-------|-------------|
| `fatal` | Unrecoverable errors - causes crash | Both |
| `error` | Errors that need attention | Both |
| `warn` | Warnings about degraded functionality | Both |
| `info` | Important events and state changes | Both |
| `debug` | Detailed initialization and lifecycle events | Both |
| `trace` | Very verbose - database operations, cache hits/misses | Both |

## Configuration

### Environment Variables

```bash
# Set log level (default: 'info')
LOG_LEVEL=debug

# Node environment (affects output format)
NODE_ENV=production    # JSON output
NODE_ENV=development   # Pretty-printed output
```

### Docker Logs

When running in Docker, all logs from both services (Tidarr and lastfm-app) are sent to stdout/stderr:

```bash
# View all logs
docker logs <container_id>

# Follow logs in real-time
docker logs -f <container_id>

# View logs with timestamps
docker logs -t <container_id>

# Last N lines
docker logs --tail 100 <container_id>
```

## What Gets Logged

### Request Logging

Every HTTP request is logged with:
- **Request ID**: Unique identifier for tracking across logs
- **Method**: HTTP method (GET, POST, etc.)
- **Path**: Request path
- **Status Code**: HTTP response status
- **Duration**: Response time in milliseconds
- **Content Length**: Response size

Example log:
```
[info] GET /api/artist/Spotify
  requestId: "ABC123-XYZ"
  method: "GET"
  path: "/api/artist/Spotify"
  status: 200
  durationMs: 145
  contentLength: "2048"
```

### Startup/Initialization

Application startup sequence is fully logged:

```
[info] ═══ LastFM App Starting ═══
  nodeEnv: "production"
  logLevel: "info"
  port: 80

[info] Required environment variables validated
[info] Tidarr proxy configured
  tidarrUrl: "http://tidarr:8484"

[info] Global rate limiter configured
  window: "60s"
  maxRequests: 300

[info] API rate limiter configured
  window: "60s"
  maxRequests: 120

[info] ✓ Express server listening
  port: 80
  address: { address: '::', family: 'IPv6', port: 80 }

[info] 🔄 Initializing Plex library...
[info] ✓ Plex library loaded and ready
[info] ✓ All services initialized - app fully operational
```

### Database Operations

Database operations are logged with varying detail levels:

```
[debug] Cache tables and indices initialized
[trace] Cache written
  key: "artist:Dua Lipa:top"
  size: 4096

[trace] Cache hit
  key: "artist:Dua Lipa:top"
  ageMs: 3600000

[warn] Cache data corruption detected
  key: "artist:Dua Lipa:top"
```

### Service Operations

Services log important operations:

```
[info] Item added to wishlist
  type: "album"
  name: "Future Nostalgia"
  artist: "Dua Lipa"
  id: 42

[info] Download added to history
  artist: "Dua Lipa"
  title: "Levitating"
  quality: "320"
  tidal_id: "abc123"
```

### Error Scenarios

Errors include full context for debugging:

```
[error] Tidarr proxy error
  err: "ECONNREFUSED"
  code: "ECONNREFUSED"
  target: "http://tidarr:8484"
  path: "/tidarr-ui/dashboard"

[error] Error reading from cache
  key: "artist:Dua Lipa"
  err: { ... stack trace ... }

[warn] Rate limit exceeded
  ip: "192.168.1.100"
  path: "/api/artist/Spotify"
  method: "GET"
```

### Graceful Shutdown

```
[warn] SIGTERM received - gracefully shutting down
[info] Server closed
```

## Viewing Logs

### In Development

Logs are color-coded and pretty-printed:

```bash
npm start
# or
NODE_ENV=development node server.js
```

Example output:
```
[info] ═══ LastFM App Starting ═══
  nodeEnv: "development"
  logLevel: "info"
  port: 80

[info] ✓ Express server listening
```

### In Production / Docker

Logs are output as JSON, one per line:

```bash
docker logs myapp
```

Example output:
```json
{"level":30,"time":1682000000000,"service":"lastfm-app","environment":"production","method":"GET","path":"/api/artist/Spotify","query":{},"statusCode":200,"contentLength":"2048","durationMs":145,"requestId":"ABC123-XYZ","msg":"GET /api/artist/Spotify"}
```

### Combining with Docker Compose

```bash
docker-compose logs -f lastfm
docker-compose logs -f tidarr
docker-compose logs -f  # All services
```

## Adding Logging to New Code

### Basic Logging

```javascript
const logger = require('./logger');

// Simple log
logger.info('Something happened');

// With context
logger.info({ userId: 123, action: 'download' }, 'User downloaded album');

// Different levels
logger.debug('Detailed info for developers');
logger.warn({ issue: 'deprecated_api' }, 'Deprecated API used');
logger.error({ err: error }, 'An error occurred');
```

### In Request Handlers

```javascript
app.get('/api/test', (req, res) => {
  // req.logger includes request ID automatically
  req.logger.info('Processing request');
  
  try {
    const result = doSomething();
    req.logger.info({ result }, 'Request processed successfully');
    res.json(result);
  } catch (err) {
    req.logger.error({ err }, 'Request failed');
    res.status(500).json({ error: err.message });
  }
});
```

### In Services

```javascript
const logger = require('./logger');

function myService() {
  const serviceLogger = logger.child({ service: 'myService' });
  
  serviceLogger.info('Service started');
  // All logs from this logger will include service: 'myService'
}
```

## Log Retention

- **Console/Docker**: No automatic retention (handled by Docker log driver)
- **Application**: Only runtime logs are kept in memory
- **Cache Database**: Has its own pruning strategy (see db.js)

To configure Docker log retention, update `docker-compose.yml`:

```yaml
services:
  lastfm:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
```

## Troubleshooting

### Logs too verbose
```bash
LOG_LEVEL=warn node server.js
```

### Need debug info
```bash
LOG_LEVEL=debug node server.js
```

### Can't see any logs
- Check `NODE_ENV` is set correctly
- Verify `LOG_LEVEL` env var
- Check stderr redirection in Docker
- Look at supervisord configuration

### Request ID not showing
- Ensure middleware is loaded early in Express
- Check that the request logger middleware is being used

## Future Improvements

- [ ] Structured error tracking integration (Sentry)
- [ ] Centralized log aggregation (ELK, Loki, Splunk)
- [ ] Performance metrics logging
- [ ] Request timing breakdowns (database, external API calls)
- [ ] User activity audit logging
