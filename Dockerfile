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
# Stage 2 — Gecombineerd productie-image (Tidarr + muziekdashboard)
# ═══════════════════════════════════════════════════════════════════════════
FROM python:3.13-alpine3.21

WORKDIR /tidarr

ENV SHELL=bash \
    PYTHONUNBUFFERED=1 \
    HOME=/shared \
    ENVIRONMENT=production

# Systeempakketten voor Tidarr én het muziekdashboard
RUN apk update && apk upgrade && \
    apk add --no-cache \
        nodejs npm \
        ffmpeg \
        bash \
        su-exec \
        curl \
        wget \
        rsgain \
        supervisor && \
    npm install -g yarn && \
    rm -rf /var/cache/apk/*

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

# Native module better-sqlite3 heeft buildtools nodig
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm install --production

COPY server.js db.js ./
COPY services/         ./services/
COPY public/           ./public/

# ── Supervisord: beheert beide processen ─────────────────────────────────────
COPY supervisord.conf /etc/supervisord.conf

# Alleen poort 80 (muziekdashboard) hoeft extern bereikbaar te zijn.
# Tidarr draait intern op poort 8484.
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s \
  CMD node -e "require('http').get('http://localhost/',r=>r.statusCode===200?process.exit(0):process.exit(1)).on('error',()=>process.exit(1))"

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
