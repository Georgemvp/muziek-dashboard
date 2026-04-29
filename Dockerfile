# ═══════════════════════════════════════════════════════════════════════════
# Stage 1 — Bouw Tidarr (frontend React + backend Node/TypeScript)
# Alleen build-artefacten (JS dist) worden meegenomen; geen binaries.
# Alpine is hier prima: de output zijn platformonafhankelijke JS-bestanden.
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
# BELANGRIJK: node:20-slim (Debian/glibc) zodat de gekopieerde Node-binary
# en native modules (better-sqlite3, sharp) compatibel zijn met het Debian
# productie-image in Stage 5. Een Alpine (musl) binary draait NIET op glibc.
# ═══════════════════════════════════════════════════════════════════════════
FROM node:20-slim AS app_builder

WORKDIR /app

# Build-tools voor native modules (better-sqlite3, sharp)
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

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
# Stage 3 — AudioMuse ONNX-modellen (gecached; alleen opnieuw bij model-update)
# ═══════════════════════════════════════════════════════════════════════════
FROM alpine:3.21 AS audiomuse_models

RUN apk add --no-cache wget ca-certificates && \
    mkdir -p /app/audiomuse/model

# MusiCNN modellen + CLAP text model (~478 MB)
# Bron: NeptuneHub/AudioMuse-AI releases v4.0.0-model
RUN set -eux; \
    base="https://github.com/NeptuneHub/AudioMuse-AI/releases/download/v4.0.0-model"; \
    for f in musicnn_embedding.onnx musicnn_prediction.onnx clap_text_model.onnx; do \
        n=0; \
        until [ "$n" -ge 5 ]; do \
            if wget --no-verbose --tries=3 --retry-connrefused --waitretry=5 \
               --header="User-Agent: AudioMuse-Docker/1.0 (+https://github.com/NeptuneHub/AudioMuse-AI)" \
               -O "/app/audiomuse/model/$f" "$base/$f"; then \
                echo "✓ $f gedownload"; break; \
            fi; \
            n=$((n+1)); \
            echo "Poging $n mislukt voor $f — wacht $((n*n))s"; \
            sleep $((n*n)); \
        done; \
        [ "$n" -lt 5 ] || { echo "ERROR: download van $f mislukt na 5 pogingen"; exit 1; }; \
    done

# DCLAP audio model (~21 MB incl. externe datafile)
# Bron: NeptuneHub/AudioMuse-AI-DCLAP releases v1
RUN set -eux; \
    dclap="https://github.com/NeptuneHub/AudioMuse-AI-DCLAP/releases/download/v1"; \
    for f in model_epoch_36.onnx model_epoch_36.onnx.data; do \
        n=0; \
        until [ "$n" -ge 5 ]; do \
            if wget --no-verbose --tries=3 --retry-connrefused --waitretry=10 \
               --header="User-Agent: AudioMuse-Docker/1.0 (+https://github.com/NeptuneHub/AudioMuse-AI)" \
               -O "/app/audiomuse/model/$f" "$dclap/$f"; then \
                echo "✓ $f gedownload"; break; \
            fi; \
            n=$((n+1)); \
            echo "Poging $n mislukt voor $f — wacht $((n*n))s"; \
            sleep $((n*n)); \
        done; \
        [ "$n" -lt 5 ] || { echo "ERROR: download van $f mislukt na 5 pogingen"; exit 1; }; \
    done

RUN echo "=== Gedownloade modellen ===" && ls -lh /app/audiomuse/model/

# ═══════════════════════════════════════════════════════════════════════════
# Stage 4 — AudioMuse Python venv (Debian: alle manylinux wheels beschikbaar)
# Debian/glibc: onnxruntime, llvmlite, sentencepiece, voyager etc. installeren
# allemaal als native manylinux binary wheel. Geen workarounds nodig.
# De venv wordt direct gekopieerd naar het Debian productie-image (Stage 5).
# ═══════════════════════════════════════════════════════════════════════════
FROM python:3.11-slim-bookworm AS audiomuse_venv

# Debian build-deps voor C-extensies in de requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential cmake libsndfile1-dev libpq-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY audiomuse/requirements/ /tmp/audiomuse-req/

# Alle packages worden op hun originele pins geïnstalleerd — op Debian/glibc
# zijn manylinux wheels beschikbaar voor alle dependencies incl. voyager,
# scipy, scikit-learn en onnxruntime. Geen sed-patches nodig.
RUN python -m venv /app/venv && \
    grep -v "^zstandard===\s*$" /tmp/audiomuse-req/common.txt > /tmp/audiomuse-merged.txt && \
    cat /tmp/audiomuse-req/cpu.txt >> /tmp/audiomuse-merged.txt && \
    echo "zstandard" >> /tmp/audiomuse-merged.txt && \
    /app/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/venv/bin/pip install --no-cache-dir --prefer-binary -r /tmp/audiomuse-merged.txt && \
    rm -rf /tmp/audiomuse-req /tmp/audiomuse-merged.txt /root/.cache/pip

# ═══════════════════════════════════════════════════════════════════════════
# Stage 5 — OrpheusDL + modules (multi-source downloader, Flask webui)
# Debian/glibc zodat pip manylinux wheels installeert zonder compilatie.
# Modules worden gekloned in /app/orpheusdl/modules/.
# ═══════════════════════════════════════════════════════════════════════════
FROM python:3.11-slim-bookworm AS orpheus_builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        git ca-certificates build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/orpheusdl

# Kloon OrpheusDL (bascurtiz fork met webui.py)
RUN git clone https://github.com/bascurtiz/OrpheusDL .

# ── Alle download-modules ─────────────────────────────────────────────────
RUN git clone https://github.com/bascurtiz/orpheusdl-applemusic    modules/applemusic
RUN git clone https://github.com/bascurtiz/orpheusdl-beatport       modules/beatport
RUN git clone https://github.com/bascurtiz/orpheusdl-beatsource     modules/beatsource
RUN git clone https://github.com/bascurtiz/orpheusdl-deezer         modules/deezer
RUN git clone https://github.com/bascurtiz/orpheusdl-qobuz          modules/qobuz
RUN git clone https://github.com/bascurtiz/orpheusdl-soundcloud     modules/soundcloud
RUN git clone https://github.com/bascurtiz/orpheusdl-spotify        modules/spotify
RUN git clone --recurse-submodules https://github.com/bascurtiz/orpheusdl-tidal modules/tidal
RUN git clone https://github.com/bascurtiz/orpheusdl-youtube        modules/youtube

# Installeer Python-afhankelijkheden + Flask in een eigen venv
# (isoleert OrpheusDL van AudioMuse's /app/venv in het productie-image)
RUN python -m venv /orpheus_venv && \
    /orpheus_venv/bin/pip install --no-cache-dir --upgrade pip && \
    /orpheus_venv/bin/pip install --no-cache-dir -r requirements.txt flask && \
    rm -rf /root/.cache/pip

# ═══════════════════════════════════════════════════════════════════════════
# Stage 6 — Productie-image (Tidarr + muziekdashboard + AudioMuse-AI)
# Base: python:3.11-slim-bookworm (Debian/glibc) — zelfde libc als de venv-
# builder en de Node-builder, zodat alle binaries native draaien zonder shims.
# ═══════════════════════════════════════════════════════════════════════════
FROM python:3.11-slim-bookworm

WORKDIR /tidarr

ENV SHELL=bash \
    PYTHONUNBUFFERED=1 \
    HOME=/shared \
    ENVIRONMENT=production \
    NODE_ENV=production \
    PORT=80

# Systeempakketten — nodejs/npm NIET via apt: dat installeert een andere Node-
# versie, maar native modules zijn gecompileerd tegen Node 20 (app_builder).
# Andere V8-versie = ABI-mismatch = crash. Node wordt hieronder gekopieerd.
# Nota: libstdc++ en libssl3 zijn al aanwezig in slim-bookworm.
#       rsgain is niet beschikbaar als Debian-pakket en wordt weggelaten.
#       su-exec bestaat niet op Debian; gosu is het equivalent.
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
        ffmpeg \
        bash \
        gosu \
        curl \
        wget \
        supervisor \
        libsndfile1 \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20 — exact dezelfde binary als in app_builder (zelfde glibc, V8 ABI match)
COPY --from=app_builder /usr/local/bin/node          /usr/local/bin/node
COPY --from=app_builder /usr/local/lib/node_modules  /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && \
    npm install -g yarn

# ── Tidarr: Python-afhankelijkheden (tiddl downloader) ──────────────────────
COPY tidarr/docker/requirements.txt /tidarr/docker/requirements.txt
# tiddl: submodule heeft mogelijk een oude pin; normaliseer naar 2.8.0 (Python 3.11 compat)
RUN sed -i 's/tiddl==[0-9.]*/tiddl==2.8.0/' /tidarr/docker/requirements.txt && \
    apt-get update && apt-get install -y --no-install-recommends \
        python3-dev build-essential && \
    python -m pip install --no-cache-dir -r /tidarr/docker/requirements.txt && \
    apt-get purge -y python3-dev build-essential && \
    apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# ── MediaSage: Python-afhankelijkheden (FastAPI + LLM aanbevelingen) ─────────
COPY mediasage/requirements.txt /mediasage/requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3-dev build-essential libxml2-dev libxslt1-dev libffi-dev libssl-dev && \
    python -m pip install --no-cache-dir -r /mediasage/requirements.txt && \
    apt-get purge -y python3-dev build-essential libxml2-dev libxslt1-dev libffi-dev libssl-dev && \
    apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# ── MediaSage: broncode, frontend en persistente datamap ─────────────────────
COPY mediasage/backend/  /mediasage/backend/
COPY mediasage/frontend/ /mediasage/frontend/
RUN mkdir -p /mediasage/data

# ── AudioMuse-AI: Python virtualenv (pre-gebouwd in audiomuse_venv stage) ────
# Beide images zijn Debian/glibc: alle manylinux/glibc binaries draaien direct.
# Geen force-reinstall of musl-workaround nodig.
COPY --from=audiomuse_venv /app/venv /app/venv

# ── AudioMuse-AI: broncode + ONNX-modellen (uit model-stage) ─────────────────
COPY audiomuse/ /app/audiomuse/
COPY --from=audiomuse_models /app/audiomuse/model/ /app/audiomuse/model/
# Symlink zodat config.py (/app/model/) de modellen vindt in /app/audiomuse/model/
RUN ln -sf /app/audiomuse/model /app/model && \
    mkdir -p /app/audiomuse/data

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
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3-dev build-essential && \
    mkdir -p /shared/.processing && \
    yarn install --frozen-lockfile --production --ignore-optional && \
    apt-get purge -y python3-dev build-essential && \
    apt-get autoremove -y && rm -rf /var/lib/apt/lists/* && \
    rm -rf /root/.npm /tmp/* /var/tmp/*

# ── OrpheusDL: broncode + modules + eigen Python venv ────────────────────────
COPY --from=orpheus_builder /app/orpheusdl  /app/orpheusdl
COPY --from=orpheus_builder /orpheus_venv   /orpheus_venv
RUN mkdir -p /app/orpheusdl/config /app/orpheusdl/downloads

# ── Muziekdashboard (lastfm-app) ────────────────────────────────────────────
WORKDIR /app

# Kopieer pre-built node_modules en gebundelde frontend uit app_builder
# → geen npm install, geen build-tools nodig in het productie-image
COPY --from=app_builder /app/node_modules ./node_modules
COPY --from=app_builder /app/public/      ./public/

COPY server.js db.js logger.js ./
COPY routes/         ./routes/
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
