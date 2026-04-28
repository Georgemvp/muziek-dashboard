#!/bin/bash
# Verwijder stale git lock en maak de commit aan voor de WiiM Pro player bar fix
set -e
cd "$(dirname "$0")"

# Verwijder stale lock (dit is veilig als er geen andere git-processen draaien)
rm -f .git/index.lock

# Stage alleen de gewijzigde bestanden voor deze fix
git add public/src/components/player.js routes/plex.js

git commit -m "fix: player bar remote playback (WiiM Pro) volledig werkend

Probleem 1 - Track info & album art niet zichtbaar bij remote playback:
- Thumb-URL nu altijd via /api/img proxy zodat hij bereikbaar is
  ongeacht of de browser de interne Plex URL kan bereiken
- SSE handler herschreven: betrouwbare update van title, artist, art,
  progress en speelknop op elk event
- Polling fallback van 10s naar 5s, activeRemote bijwerken

Probleem 2 - Play/Pause/Skip werken niet zonder zone:
- playerState.activeRemote opgeslagen bij elk SSE event
  { machineId, playerName, state, ratingKey, albumRatingKey }
- Alle drie knoppen (play, next, prev) vallen terug op
  activeRemote.machineId als geen zone geselecteerd is
- Zone-naam in player bar getoond op basis van SSE playerName

Probleem 3 - Queue panel leeg bij remote playback:
- Nieuw backend endpoint GET /api/plex/remotequeue
  Probeert Plex playQueue API, daarna albumtracks, daarna enkel huidig nummer
- Queue knop toont remote queue als web-queue leeg is
- Actief nummer gemarkeerd met driehoekje, auto-scroll naar actief item

Overig:
- Progress ticker loopt elke seconde voor soepele voortgangsbalk
- Ambient achtergrond triggert ook bij remote album art
- Web player UI wordt niet overschreven door SSE als web player speelt"

echo ""
echo "Commit klaar. Push met: git push"
