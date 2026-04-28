#!/bin/bash
# Verwijder eventuele lock files van vorige git operaties
rm -f .git/HEAD.lock .git/index.lock 2>/dev/null

git config user.email "c.jo.jansen@gmail.com" 2>/dev/null || true

# Commit 1: Bug 5 backend (services/plex.js was al gecommit)
# Commit 2: Backend fixes (lastfm limit + Deezer imageproxy endpoint)
git add routes/lastfm.js routes/artist.js
git commit -m "fix(bug3+1): loved tracks limit 50; voeg /api/imageproxy/artist/:name endpoint toe"

# Commit 3: Frontend home.js (bugs 1, 2, 3, 4, 6)
git add public/src/views/home.js public/css/home.css
git commit -m "fix(bugs 1,2,3,4,6): Deezer art fallback, play buttons, loved shuffle, NP indicator, artiest naam fix

- artistImgEl() helper met onerror Deezer fallback voor alle covers
- Featured artist play: zoekt artiest in Plex, shufflet albums, speelt af  
- Loved tracks: shuffle + slice(0,8), artiest naam fix, play knop per track
- Now Playing indicator boven Recent Activity met pulserende dot
- Artiest naam extractie gefixed: t.artist?.name || t.artist?.['#text']"

# Commit 4: main.js (bug 4 NP event dispatch)
git add public/src/main.js
git commit -m "fix(bug4): plex-np-update event dispatch bij track wissel in main.js"

# Commit 5: Rebuilt frontend
git add public/app.js public/styles.css public/chunks/
git commit -m "build: rebuild frontend na bug fixes 1-6"

echo "✅ Alle commits klaar! Run 'git push' om te pushen."
