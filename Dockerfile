# ═══════════════════════════════════════════════════════════════════════════
# Stage 1 — Bouw Tidarr (frontend React + backend Node/TypeScript)
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS tidarr_builder

WORKDIR /tidarr

RUN apk add --no-cache git python3 make g++ && \
    rm -rf /var/cache/apk/*

COPY tidarr/ .

RUN yarn install --prefer-offline --frozen-lockfile && \
    yarn workspace tidarr-react run build && \
    yarn workspace tidarr-api run build

# ═══════════════════════════════════════════════════════════════════════════
# Stage 2 — Bouw lastfm-app (frontend bundle + productie node_modules)
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-alpine AS app_builder

WORKDIR /app

# Build-tools voor native modules (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++

# Layer-cache: package-bestanden eerst → npm ci draait alleen opnieuw bij
# gewijzigde dependencies, niet bij gewijzigde broncode
COPY package.json package-lock.json ./
RUN npm ci

# Bouw de frontend bundle
COPY public/ ./public/
RUN npm run build

# Verwijder devDependencies; alleen productie-modules blijven over
RUN npm prune --production

# ═══════════════════════════════════════════════════════════════════════════
# Stage 3 — Productie-image (Tidarr + muziekdashboard)
# ═══════════════════════════════════════════════════════════════════════════
FROM python:3.13-alpine3.21

WORKDIR /tidarr

ENV SHELL=bash \
    PYTHONUNBUFFERED=1 \
    HOME=/shared \
    ENVIRONMENT=production \
    NODE_ENV=production \
    PORT=80

# Systeempakketten — nodejs/npm NIET via apk: apk installeert Node 22 op
# Alpine 3.21, maar native modules zijn gecompileerd tegen Node 20 (app_builder).
# Andere V8-versie = ABI-mismatch = crash. Node wordt hieronder gekopieerd.
RUN apk update && apk upgrade && \
    apk add --no-cache \
        libstdc++ \
        ffmpeg \
        bash \
        su-exec \
        curl \
        wget \
        rsgain \
        supervisor && \
    rm -rf /var/cache/apk/*

# Node.js 20 — exact dezelfde binary als in app_builder (V8 ABI match)
COPY --from=app_builder /usr/local/bin/node          /usr/local/bin/node
COPY --from=app_builder /usr/local/lib/node_modules  /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && \
    npm install -g yarn

# ── Tidarr: Python-afhankelijkheden (tiddl downloader) ──────────────────────
COPY tidarr/docker/requirements.txt /tidarr/docker/requirements.txt
RUN apk add --no-cache --virtual .pydeps python3-dev build-base && \
    python -m pip install --no-cache-dir -r /tidarr/docker/requirements.txt && \
    apk del .pydeps

# ── Tidarr: gebouwde artefacten + statische bestanden ───────────────────────
COPY --from=tidarr_builder /tidarr/api/dist       /tidarr/api/dist
COPY --from=tidarr_builder /tidarr/app/dist        /tidarr/app/build
COPY tidarr/docker/settings                        /tidarr/docker/settings
COPY tidarr/docker/entrypoint.sh                   /tidarr/docker/entrypoint.sh
COPY tidarr/.env                                   /tidarr/.env
COPY tidarr/package.json                           /tidarr/package.json
COPY tidarr/yarn.lock                              /tidarr/yarn.lock
COPY tidarr/api/package.json                       /tidarr/api/package.json

# Tidarr productie Node-modules
RUN apk add --no-cache --virtual .nodedeps python3-dev build-base && \
    mkdir -p /shared/.processing && \
    yarn install --frozen-lockfile --production --ignore-optional && \
    apk del .nodedeps && \
    rm -rf /root/.npm /tmp/* /var/tmp/*

# ── Muziekdashboard (lastfm-app) ────────────────────────────────────────────
WORKDIR /app

# Kopieer pre-built node_modules en gebundelde frontend uit app_builder
# → geen npm install, geen build-tools nodig in het productie-image
COPY --from=app_builder /app/node_modules ./node_modules
COPY --from=app_builder /app/public/      ./public/

COPY server.js db.js logger.js ./
COPY services/       ./services/

# ── Supervisord: beheert beide processen ─────────────────────────────────────
COPY supervisord.conf /etc/supervisord.conf

# Alleen poort 80 (muziekdashboard) hoeft extern bereikbaar te zijn.
# Tidarr draait intern op poort 8484.
EXPOSE 80

# wget is al aanwezig in het image; sneller dan een Node-process spawnen
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s \
  CMD wget -q --spider http://localhost:80/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
