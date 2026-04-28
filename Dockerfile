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
# Stage 4 — Productie-image (Tidarr + muziekdashboard + AudioMuse-AI)
# ═══════════════════════════════════════════════════════════════════════════
FROM python:3.10-alpine3.21

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
        supervisor \
        libsndfile \
        postgresql-libs \
        gcompat && \
    rm -rf /var/cache/apk/*

# Node.js 20 — exact dezelfde binary als in app_builder (V8 ABI match)
COPY --from=app_builder /usr/local/bin/node          /usr/local/bin/node
COPY --from=app_builder /usr/local/lib/node_modules  /usr/local/lib/node_modules
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx && \
    npm install -g yarn

# ── Tidarr: Python-afhankelijkheden (tiddl downloader) ──────────────────────
COPY tidarr/docker/requirements.txt /tidarr/docker/requirements.txt
# tiddl==3.2.3 bestaat niet op PyPI (hoogste versie = 2.8.0); vervang inline
RUN sed -i 's/tiddl==3\.2\.3/tiddl==2.8.0/' /tidarr/docker/requirements.txt && \
    apk add --no-cache --virtual .pydeps python3-dev build-base && \
    python -m pip install --no-cache-dir -r /tidarr/docker/requirements.txt && \
    apk del .pydeps

# ── MediaSage: Python-afhankelijkheden (FastAPI + LLM aanbevelingen) ─────────
COPY mediasage/requirements.txt /mediasage/requirements.txt
RUN apk add --no-cache --virtual .mediasage-pydeps \
        python3-dev build-base libxml2-dev libxslt-dev libffi-dev openssl-dev && \
    python -m pip install --no-cache-dir -r /mediasage/requirements.txt && \
    apk del .mediasage-pydeps

# ── MediaSage: broncode, frontend en persistente datamap ─────────────────────
COPY mediasage/backend/  /mediasage/backend/
COPY mediasage/frontend/ /mediasage/frontend/
RUN mkdir -p /mediasage/data

# ── AudioMuse-AI: Python virtualenv + afhankelijkheden ───────────────────────
# Gebruikte requirements: audiomuse/requirements/common.txt (alle platforms)
#                       + audiomuse/requirements/cpu.txt   (ONNX CPU runtime)
# Noot: 'audiomuse/requirements/requirements.txt' bestaat niet in de bron;
#        common.txt + cpu.txt dekken dezelfde scope.
# Noot: common.txt bevat 'zstandard===' (ongeldige spec) — gefilterd en
#        vervangen door 'zstandard' zonder versiepin.
COPY audiomuse/requirements/ /tmp/audiomuse-req/
RUN apk add --no-cache --virtual .audiomuse-build \
        python3-dev build-base libsndfile-dev postgresql-dev libffi-dev && \
    python -m venv /app/venv && \
    grep -v "^zstandard===\s*$" /tmp/audiomuse-req/common.txt > /tmp/audiomuse-merged.txt && \
    cat /tmp/audiomuse-req/cpu.txt >> /tmp/audiomuse-merged.txt && \
    echo "zstandard" >> /tmp/audiomuse-merged.txt && \
    sed -i \
        -e 's/voyager==2\.1\.0/voyager/' \
        -e 's/scikit-learn==1\.8\.0/scikit-learn/' \
        /tmp/audiomuse-merged.txt && \
    /app/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/venv/bin/pip install --no-cache-dir --prefer-binary -r /tmp/audiomuse-merged.txt && \
    apk del .audiomuse-build && \
    rm -rf /tmp/audiomuse-req /tmp/audiomuse-merged.txt /root/.cache/pip

# ── AudioMuse-AI: broncode + ONNX-modellen (uit model-stage) ─────────────────
COPY audiomuse/ /app/audiomuse/
COPY --from=audiomuse_models /app/audiomuse/model/ /app/audiomuse/model/
RUN mkdir -p /app/audiomuse/data

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
