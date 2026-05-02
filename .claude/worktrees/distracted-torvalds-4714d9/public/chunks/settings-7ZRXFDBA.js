import{h as o,z as u}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var f={},h={},k="algemeen";function b(e,n="ok"){let s=document.getElementById("settings-toast");s||(s=document.createElement("div"),s.id="settings-toast",s.className="settings-toast",document.body.appendChild(s)),s.textContent=e,s.className=`settings-toast${n==="error"?" error":""}`,requestAnimationFrame(()=>{requestAnimationFrame(()=>s.classList.add("visible"))}),clearTimeout(s._timer),s._timer=setTimeout(()=>s.classList.remove("visible"),2800)}async function S(){let e=await u("/api/settings");f=e.categories||{},h=e.env||{}}async function T(e,n){await u(`/api/settings/${e}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)})}function p(e,n,s=""){return f[e]?.[n]??s}function g(e,n,s=!1){let t=p(e,n,s)===!0||p(e,n,s)==="true";return`
    <label class="settings-toggle" title="">
      <input type="checkbox" id="${`stg-${e}-${n}`}" data-cat="${o(e)}" data-key="${o(n)}" ${t?"checked":""}>
      <span class="settings-toggle-track"></span>
    </label>`}function m(e,n,s,t=""){let a=p(e,n,t),l=`stg-${e}-${n}`,i=s.map(r=>typeof r=="string"?`<option value="${o(r)}" ${a===r?"selected":""}>${o(r)}</option>`:`<option value="${o(r.value)}" ${a===r.value?"selected":""}>${o(r.label)}</option>`).join("");return`<select class="settings-select" id="${l}" data-cat="${o(e)}" data-key="${o(n)}">${i}</select>`}function y(e,n,s={}){let{type:t="text",placeholder:a="",readonly:l=!1,cls:i=""}=s,r=p(e,n,s.defaultVal??""),d=`stg-${e}-${n}`;return`<input
    class="settings-input ${i}"
    id="${d}"
    type="${o(t)}"
    placeholder="${o(a)}"
    value="${o(String(r))}"
    data-cat="${o(e)}"
    data-key="${o(n)}"
    ${l?"readonly":""}>`}function E(e,n,{min:s=0,max:t=100,step:a=1,unit:l="",defaultVal:i=50}={}){let r=Number(p(e,n,i)),d=`stg-${e}-${n}`;return`
    <div class="settings-slider-wrap">
      <input
        class="settings-slider"
        id="${d}"
        type="range"
        min="${s}" max="${t}" step="${a}"
        value="${r}"
        data-cat="${o(e)}"
        data-key="${o(n)}"
        data-unit="${o(l)}">
      <span class="settings-slider-value" id="${d}-val">${r}${l}</span>
    </div>`}function c(e){return`<span class="settings-status"><span class="settings-status-dot ${e==="ok"?"ok":e==="loading"?"loading":e==="error"?"error":"idle"}"></span>${e==="ok"?"Verbonden":e==="loading"?"Testen\u2026":e==="error"?"Niet bereikbaar":"Onbekend"}</span>`}function v(e){return`<button class="settings-btn settings-btn-primary settings-save-btn" data-cat="${o(e)}">Opslaan</button>`}function A(){let e=[{value:"home",label:"Home"},{value:"albums",label:"Albums"},{value:"artists",label:"Artists"},{value:"ontdek",label:"Ontdek"},{value:"nu",label:"Nu Bezig"},{value:"downloads",label:"Downloads"},{value:"releases",label:"Nieuwe Releases"},{value:"stats",label:"Statistieken"}];return`
  <div class="settings-panel active" id="tab-algemeen">
    <div class="settings-card">
      <h3 class="settings-card-title">Weergave & Navigatie</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Taal</strong>
            <span>Interface taal (herstart vereist)</span>
          </div>
          <div class="settings-row-control">
            ${m("algemeen","language",[{value:"nl",label:"Nederlands"},{value:"en",label:"English"}],"nl")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Thema</strong>
            <span>Kleurschema van de interface</span>
          </div>
          <div class="settings-row-control">
            ${m("algemeen","theme",[{value:"light",label:"Licht"},{value:"dark",label:"Donker"},{value:"auto",label:"Systeem (auto)"}],"light")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Startpagina</strong>
            <span>Welke view wordt geladen bij opstarten</span>
          </div>
          <div class="settings-row-control">
            ${m("algemeen","startView",e,"home")}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Sidebar items</h3>
      <div class="settings-group">
        ${[{key:"showGenres",label:"Genres",desc:"Genre browser in de sidebar"},{key:"showRadio",label:"Live Radio",desc:"Live radio tab"},{key:"showHistory",label:"History",desc:"Afspeel-geschiedenis"},{key:"showStats",label:"Statistieken",desc:"Last.fm statistieken"},{key:"showComposers",label:"Componisten",desc:"Klassieke muziek componisten"},{key:"showFolders",label:"Folders",desc:"Bestandsmappen browser"},{key:"showTags",label:"Tags",desc:"Genre tags overzicht"},{key:"showMediaSage",label:"MediaSage AI",desc:"AI aanbevelingen tools"}].map(n=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${o(n.label)}</strong>
              <span>${o(n.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${g("sidebar",n.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${v("algemeen")}${v("sidebar")}</div>
    </div>
  </div>`}function I(){let e=h.lastfm||{},n=h.plex||{},s=h.spotify||{},t=h.tidarr||{},a=h.orpheus||{};return`
  <div class="settings-panel" id="tab-verbindingen">

    <div class="settings-card">
      <h3 class="settings-card-title">Last.fm</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(e.api_key||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Gebruikersnaam</strong><span>Last.fm account</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(e.username||"\u2014")}" readonly>
          </div>
        </div>
      </div>
      <div class="settings-info">\u2139\uFE0F Last.fm inloggegevens worden beheerd via de <code>.env</code> omgevingsvariabelen op de server.</div>
    </div>

    <div class="settings-card" id="enrichment-settings-card">
      <h3 class="settings-card-title">Metadata Enrichment</h3>
      <div class="settings-group" id="enrichment-settings-form">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Genius API Key</strong><span>Songteksten + artiest bio (gratis via genius.com/api-clients)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" id="enr-genius-key" placeholder="Voer API key in\u2026">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Discogs Token</strong><span>Optioneel \u2014 hogere rate limit (60/min)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" id="enr-discogs-token" placeholder="Persoonlijk token\u2026">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Discogs User-Agent</strong><span>Verplicht voor Discogs API</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="text" id="enr-discogs-ua" value="LastfmMuziekApp/1.0">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Genre Whitelist Filter</strong><span>Filter ongeldige genres uit alle enrichment-data</span></div>
          <div class="settings-row-control">
            <label class="settings-toggle">
              <input type="checkbox" id="enr-genre-filter">
              <span class="settings-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin:var(--space-4) 0 var(--space-3);">Workers in-/uitschakelen</h4>
      <div class="settings-group">
        ${["itunes","discogs","audiodb","genius","tidal","qobuz"].map(l=>`
        <div class="settings-row">
          <div class="settings-row-label"><strong>${o(l.charAt(0).toUpperCase()+l.slice(1))}</strong></div>
          <div class="settings-row-control">
            <label class="settings-toggle">
              <input type="checkbox" class="enr-worker-toggle" data-source="${o(l)}" checked>
              <span class="settings-toggle-slider"></span>
            </label>
          </div>
        </div>`).join("")}
      </div>

      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="settings-btn settings-btn-primary" id="save-enrichment-settings">Opslaan</button>
        <button class="settings-btn settings-btn-secondary" id="enr-manage-genres">Genre Whitelist Beheren</button>
      </div>
      <div id="enrichment-settings-msg" style="font-size:12px;margin-top:8px;min-height:16px;color:var(--color-accent)"></div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Plex</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Server URL</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${o(n.url||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Token</strong><span>Plex authenticatie token</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(n.token||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="plex-status-dot">${c("idle")}</span>
            <button class="settings-btn settings-btn-secondary" id="test-plex-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Spotify</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Client ID</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(s.client_id||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Client Secret</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" value="${s.client_secret?"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022":"\u2014"}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Status</strong></div>
          <div class="settings-row-control">
            ${s.configured?c("ok"):c("error")}
            <button class="settings-btn settings-btn-secondary" id="test-spotify-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Tidarr</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>URL</strong><span>Intern Tidarr adres</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${o(t.url||"http://localhost:8484")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(t.api_key||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="tidarr-status-dot">${c("idle")}</span>
            <button class="settings-btn settings-btn-secondary" id="test-tidarr-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">OrpheusDL</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>URL</strong><span>OrpheusDL web UI adres</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${o(a.url||"http://localhost:5000")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="orpheus-status-dot">${c("idle")}</span>
            <button class="settings-btn settings-btn-secondary" id="test-orpheus-btn">Test</button>
          </div>
        </div>
      </div>
      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin:var(--space-4) 0 var(--space-3);">Platform status</h4>
      <div class="settings-platform-grid" id="orpheus-platforms">
        ${["Tidal","Qobuz","Deezer","Spotify","SoundCloud","Apple Music","Beatport","Beatsource","YouTube"].map(l=>`<div class="settings-platform-item">
            <span class="settings-status-dot idle" id="plat-${l.toLowerCase().replace(" ","")}"></span>
            ${o(l)}
          </div>`).join("")}
      </div>
    </div>
  </div>`}function C(){let e=(()=>{try{let t=p("downloads","sourcePriority",null);return t?JSON.parse(t):["orpheus","tidarr"]}catch{return["orpheus","tidarr"]}})(),s=[...[{id:"orpheus",label:"OrpheusDL",badge:"9 platforms"},{id:"tidarr",label:"Tidarr",badge:"Tidal"}]].sort((t,a)=>{let l=e.indexOf(t.id),i=e.indexOf(a.id);return(l===-1?99:l)-(i===-1?99:i)});return`
  <div class="settings-panel" id="tab-downloads">

    <div class="settings-card">
      <h3 class="settings-card-title">Kwaliteit & Locatie</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Standaard kwaliteit</strong>
            <span>Formaat voor nieuwe downloads</span>
          </div>
          <div class="settings-row-control">
            ${m("downloads","defaultQuality",[{value:"lossless",label:"FLAC (Lossless)"},{value:"high",label:"MP3 320kbps"},{value:"low",label:"MP3 128kbps"}],"lossless")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Download locatie</strong>
            <span>Pad naar de muziekmap op de server</span>
          </div>
          <div class="settings-row-control">
            ${y("downloads","downloadPath",{placeholder:"/music",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Mapstructuur</strong>
            <span>Template voor mapindeling van downloads</span>
          </div>
          <div class="settings-row-control" style="flex-direction:column;align-items:flex-start;gap:8px;">
            ${y("downloads","folderTemplate",{placeholder:"$albumartist/$year - $album",defaultVal:"$albumartist/$year - $album",cls:"settings-input-full"})}
            <div class="settings-var-ref">
              ${["$albumartist","$artist","$album","$title","$track","$year","$genre","$quality"].map(t=>`<span class="settings-var-chip">${t}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${v("downloads")}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Download-bron prioriteit</h3>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 var(--space-4)">
        Sleep de bronnen in de gewenste volgorde. Hogere positie = hogere prioriteit.
      </p>
      <ul class="settings-drag-list" id="source-priority-list">
        ${s.map(t=>{let a=p("downloads",`${t.id}Enabled`,!0)!==!1;return`
          <li class="settings-drag-item" draggable="true" data-source="${o(t.id)}">
            <span class="settings-drag-handle">\u283F</span>
            <span class="settings-drag-item-label">${o(t.label)}</span>
            <span class="settings-drag-item-badge">${o(t.badge)}</span>
            <label class="settings-toggle" style="margin-left:auto">
              <input type="checkbox" class="source-enabled-toggle" data-source="${o(t.id)}" ${a?"checked":""}>
              <span class="settings-toggle-track"></span>
            </label>
          </li>`}).join("")}
      </ul>

      <div class="settings-row" style="margin-top:var(--space-4)">
        <div class="settings-row-label">
          <strong>Hybrid mode</strong>
          <span>Automatisch naar volgende bron als download mislukt</span>
        </div>
        <div class="settings-row-control">
          ${g("downloads","hybridMode",!0)}
        </div>
      </div>

      <div class="settings-save-row">${v("downloads")}</div>
    </div>
  </div>`}function D(){let e=p("postprocess","lossyCopy",!1)===!0||p("postprocess","lossyCopy",!1)==="true";return`
  <div class="settings-panel" id="tab-postprocess">
    <div class="settings-card">
      <h3 class="settings-card-title">Audio Conversie</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Lossy kopie aanmaken</strong>
            <span>Maak naast FLAC ook een gecomprimeerde kopie</span>
          </div>
          <div class="settings-row-control">
            ${g("postprocess","lossyCopy",!1)}
          </div>
        </div>
        <div id="lossy-options" style="${e?"":"display:none"}">
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Lossy formaat</strong>
            </div>
            <div class="settings-row-control">
              ${m("postprocess","lossyFormat",[{value:"mp3",label:"MP3"},{value:"opus",label:"Opus"},{value:"aac",label:"AAC"}],"mp3")}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Bitrate</strong>
            </div>
            <div class="settings-row-control">
              ${E("postprocess","lossyBitrate",{min:128,max:320,step:64,unit:"kbps",defaultVal:320})}
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Hi-Res downsampling</strong>
            <span>Converteer 24-bit \u2192 16-bit / 44.1kHz voor compatibiliteit</span>
          </div>
          <div class="settings-row-control">
            ${g("postprocess","hiresDownsample",!1)}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Metadata & Kwaliteit</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>ReplayGain</strong>
            <span>Normaliseer afspeelvolume tussen tracks en albums</span>
          </div>
          <div class="settings-row-control">
            ${g("postprocess","replaygain",!1)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Synchronized lyrics (LRC)</strong>
            <span>Download tijdgestempelde songteksten indien beschikbaar</span>
          </div>
          <div class="settings-row-control">
            ${g("postprocess","syncedLyrics",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Album consistentie check</strong>
            <span>Waarschuw als tracks van een album ontbreken of metadata verschilt</span>
          </div>
          <div class="settings-row-control">
            ${g("postprocess","albumConsistency",!0)}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Opruimen</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Blasphemy Mode</strong>
            <span>Verwijder het originele FLAC-bestand na lossy conversie</span>
          </div>
          <div class="settings-row-control">
            ${g("postprocess","deleteOriginal",!1)}
          </div>
        </div>
      </div>
      <div class="settings-warning" id="blasphemy-warning" style="${p("postprocess","deleteOriginal",!1)?"":"display:none"}">
        <span class="settings-warning-icon">\u26A0\uFE0F</span>
        <span class="settings-warning-text">
          <strong>Let op!</strong> Het originele lossless bestand wordt permanent verwijderd na conversie.
          Dit is onomkeerbaar. Zorg dat je een backup hebt.
        </span>
      </div>
      <div class="settings-save-row">${v("postprocess")}</div>
    </div>
  </div>`}function B(){let e=["1960s","1970s","1980s","1990s","2000s","2010s","2020s"],n=(()=>{try{let t=p("discovery","activeDecades",null);return t?JSON.parse(t):["1990s","2000s","2010s","2020s"]}catch{return["1990s","2000s","2010s","2020s"]}})(),s=[{value:"1",label:"Maandag"},{value:"2",label:"Dinsdag"},{value:"3",label:"Woensdag"},{value:"4",label:"Donderdag"},{value:"5",label:"Vrijdag"},{value:"6",label:"Zaterdag"},{value:"0",label:"Zondag"}];return`
  <div class="settings-panel" id="tab-discovery">

    <div class="settings-card">
      <h3 class="settings-card-title">Discovery Weekly</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Discovery Weekly</strong>
            <span>Wekelijkse aanbevelingen op basis van luistergeschiedenis</span>
          </div>
          <div class="settings-row-control">
            ${g("discovery","weeklyEnabled",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Dag van de week</strong>
            <span>Wanneer wordt de lijst vernieuwd</span>
          </div>
          <div class="settings-row-control">
            ${m("discovery","weeklyDay",s,"1")}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Release Radar</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Release Radar</strong>
            <span>Automatisch nieuwe releases opsporen van artiesten in je bibliotheek</span>
          </div>
          <div class="settings-row-control">
            ${g("discovery","radarEnabled",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Check interval</strong>
            <span>Hoe vaak controleren op nieuwe releases</span>
          </div>
          <div class="settings-row-control">
            ${m("discovery","radarInterval",[{value:"6",label:"Elke 6 uur"},{value:"12",label:"Elke 12 uur"},{value:"24",label:"Dagelijks"},{value:"48",label:"Om de dag"},{value:"168",label:"Wekelijks"}],"24")}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Afspeellijsten</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Seizoensplaylists</strong>
            <span>Automatische playlists gebaseerd op het huidige seizoen</span>
          </div>
          <div class="settings-row-control">
            ${g("discovery","seasonalPlaylists",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Decennium playlists</strong>
            <span>Actieve decennia voor retro-playlists</span>
          </div>
          <div class="settings-row-control"></div>
        </div>
        <div class="settings-checkbox-grid" id="decade-grid">
          ${e.map(t=>{let a=n.includes(t);return`<label class="settings-checkbox-pill${a?" checked":""}" data-decade="${o(t)}">
              <input type="checkbox" ${a?"checked":""} value="${o(t)}">
              ${o(t)}
            </label>`}).join("")}
        </div>

        <div class="settings-row" style="margin-top:var(--space-3)">
          <div class="settings-row-label">
            <strong>Genre playlists</strong>
            <span>Automatische playlists per muziekgenre</span>
          </div>
          <div class="settings-row-control">
            ${g("discovery","genrePlaylists",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Max tracks per playlist</strong>
            <span>Maximaal aantal nummers in een automatische playlist</span>
          </div>
          <div class="settings-row-control">
            <input class="settings-number" type="number" min="10" max="200" step="5"
              id="stg-discovery-maxTracks" data-cat="discovery" data-key="maxTracks"
              value="${Number(p("discovery","maxTracks",50))}">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Serendipity factor</strong>
            <span>Hoe "verrassend" de aanbevelingen zijn (0% = alleen bekende artiesten, 100% = maximale ontdekking)</span>
          </div>
          <div class="settings-row-control">
            ${E("discovery","serendipity",{min:0,max:100,step:5,unit:"%",defaultVal:30})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${v("discovery")}</div>
    </div>
  </div>`}function j(){return`
  <div class="settings-panel" id="tab-automatisering">
    <div class="settings-card">
      <div class="settings-coming-soon">
        <div class="settings-coming-soon-icon">\u2699\uFE0F</div>
        <h3 class="settings-coming-soon-title">Automatisering</h3>
        <p class="settings-coming-soon-sub">Automatische taken, schema's en triggers komen binnenkort.</p>
      </div>
    </div>
  </div>`}function O(){let e=[{key:"notifNewRelease",label:"Nieuwe release",desc:"Artiest uit je bibliotheek heeft iets uitgebracht"},{key:"notifDownloadDone",label:"Download voltooid",desc:"Een album is succesvol gedownload"},{key:"notifLibraryScan",label:"Library scan klaar",desc:"Plex bibliotheek synchronisatie voltooid"},{key:"notifError",label:"Fout opgetreden",desc:"Download of service fout"}];return`
  <div class="settings-panel" id="tab-notificaties">

    <div class="settings-card">
      <h3 class="settings-card-title">Discord</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Webhook URL</strong>
            <span>Discord kanaal webhook voor notificaties</span>
          </div>
          <div class="settings-row-control" style="flex:1">
            ${y("notifications","discordWebhook",{placeholder:"https://discord.com/api/webhooks/...",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-discord-btn">Test Discord</button>
        ${v("notifications")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Telegram</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Bot Token</strong>
            <span>Van @BotFather op Telegram</span>
          </div>
          <div class="settings-row-control" style="flex:1">
            ${y("notifications","telegramToken",{placeholder:"123456:ABC-DEF...",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Chat ID</strong>
            <span>Je Telegram chat of groep ID</span>
          </div>
          <div class="settings-row-control">
            ${y("notifications","telegramChatId",{placeholder:"-1001234567890",cls:"settings-input-sm"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-telegram-btn">Test Telegram</button>
        ${v("notifications")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Pushbullet</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>API Key</strong>
            <span>Van pushbullet.com/account</span>
          </div>
          <div class="settings-row-control" style="flex:1">
            ${y("notifications","pushbulletKey",{placeholder:"o.xxxxxxxxxxxxxxxxxx",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-pushbullet-btn">Test Pushbullet</button>
        ${v("notifications")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Notificatie types</h3>
      <div class="settings-group">
        ${e.map(n=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${o(n.label)}</strong>
              <span>${o(n.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${g("notifications",n.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${v("notifications")}</div>
    </div>
  </div>`}function P(){return`
  <div class="settings-panel" id="tab-onderhoud">

    <div class="settings-card">
      <h3 class="settings-card-title">Database</h3>
      <div class="settings-db-stats" id="db-stats">
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-cache-count">\u2026</span>
          <span class="settings-db-stat-label">Cache items</span>
        </div>
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-wishlist-count">\u2026</span>
          <span class="settings-db-stat-label">Wishlist items</span>
        </div>
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-downloads-count">\u2026</span>
          <span class="settings-db-stat-label">Download records</span>
        </div>
        <div class="settings-db-stat">
          <span class="settings-db-stat-value" id="db-settings-count">\u2026</span>
          <span class="settings-db-stat-label">Instellingen</span>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
        <button class="settings-btn settings-btn-secondary" id="refresh-db-stats-btn">\u21BB Vernieuwen</button>
        <button class="settings-btn settings-btn-danger" id="clear-cache-btn">Cache leegmaken</button>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Logging</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Log niveau</strong>
            <span>Hoeveelheid detail in de server logs (herstart vereist)</span>
          </div>
          <div class="settings-row-control">
            ${m("onderhoud","logLevel",[{value:"trace",label:"Trace (meest detail)"},{value:"debug",label:"Debug"},{value:"info",label:"Info (standaard)"},{value:"warn",label:"Warn"},{value:"error",label:"Error"},{value:"fatal",label:"Fatal (minst detail)"}],"info")}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${v("onderhoud")}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Auto-backup</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Auto-backup interval</strong>
            <span>Hoe vaak wordt de database automatisch geback-upt</span>
          </div>
          <div class="settings-row-control">
            ${m("onderhoud","backupInterval",[{value:"never",label:"Nooit"},{value:"daily",label:"Dagelijks"},{value:"weekly",label:"Wekelijks"},{value:"monthly",label:"Maandelijks"}],"weekly")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Laatste backup</strong>
          </div>
          <div class="settings-row-control">
            <span style="font-size:var(--text-sm);color:var(--text-muted)" id="last-backup-date">\u2014</span>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${v("onderhoud")}</div>
    </div>
  </div>`}var x=[{id:"algemeen",label:"Algemeen",render:A},{id:"verbindingen",label:"Verbindingen",render:I},{id:"downloads",label:"Downloads",render:C},{id:"postprocess",label:"Post-Processing",render:D},{id:"discovery",label:"Discovery",render:B},{id:"automatisering",label:"Automatisering",render:j},{id:"notificaties",label:"Notificaties",render:O},{id:"onderhoud",label:"Onderhoud",render:P}];function z(e){let n={};return document.querySelectorAll(`[data-cat="${e}"]`).forEach(s=>{if(!s.dataset.key)return;let t=s.dataset.key;s.type==="checkbox"?n[t]=s.checked:s.type==="range"||s.type==="number"?n[t]=Number(s.value):n[t]=s.value}),n}async function $(){try{let n=(await u("/api/settings")).categories||{},s=0;for(let a of Object.values(n))s+=Object.keys(a).length;let t=a=>document.getElementById(a);t("db-settings-count")&&(t("db-settings-count").textContent=s);try{let a=await u("/api/downloads/history");t("db-downloads-count")&&Array.isArray(a)&&(t("db-downloads-count").textContent=a.length)}catch{t("db-downloads-count")&&(t("db-downloads-count").textContent="?")}try{let a=await u("/api/wishlist");t("db-wishlist-count")&&Array.isArray(a)&&(t("db-wishlist-count").textContent=a.length)}catch{t("db-wishlist-count")&&(t("db-wishlist-count").textContent="?")}t("db-cache-count")&&(t("db-cache-count").textContent="?")}catch(e){console.warn("DB stats failed:",e)}}async function H(e,n){let s=document.getElementById(e);s&&(s.innerHTML=c("loading"));try{let t=await u(n),a=t&&t.up!==!1;s&&(s.innerHTML=c(a?"ok":"error"))}catch{s&&(s.innerHTML=c("error"))}}function M(){let e=document.getElementById("source-priority-list");if(!e)return;let n=null;e.querySelectorAll(".settings-drag-item").forEach(s=>{s.addEventListener("dragstart",()=>{n=s,s.style.opacity="0.5"}),s.addEventListener("dragend",()=>{s.style.opacity="",n=null,e.querySelectorAll(".settings-drag-item").forEach(a=>a.classList.remove("drag-over"));let t=[...e.querySelectorAll(".settings-drag-item")].map(a=>a.dataset.source);u("/api/settings/downloads",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourcePriority:JSON.stringify(t)})}).catch(()=>{})}),s.addEventListener("dragover",t=>{if(t.preventDefault(),n&&n!==s){s.classList.add("drag-over");let a=s.getBoundingClientRect(),l=a.top+a.height/2;t.clientY<l?e.insertBefore(n,s):e.insertBefore(n,s.nextSibling)}}),s.addEventListener("dragleave",()=>s.classList.remove("drag-over")),s.addEventListener("drop",t=>t.preventDefault())})}function _(){let e=document.getElementById("decade-grid");e&&e.querySelectorAll(".settings-checkbox-pill").forEach(n=>{let s=n.querySelector("input");s&&(n.addEventListener("click",t=>{t.target!==s&&(s.checked=!s.checked)}),s.addEventListener("change",()=>{n.classList.toggle("checked",s.checked)}))})}function q(){let e=document.getElementById("settings-page");if(!e)return;e.querySelectorAll(".settings-tab-btn").forEach(l=>{l.addEventListener("click",()=>{k=l.dataset.tab,e.querySelectorAll(".settings-tab-btn").forEach(r=>r.classList.toggle("active",r===l)),e.querySelectorAll(".settings-panel").forEach(r=>r.classList.remove("active"));let i=document.getElementById(`tab-${k}`);i&&i.classList.add("active")})}),e.querySelectorAll(".settings-save-btn").forEach(l=>{l.addEventListener("click",async()=>{let i=l.dataset.cat;if(i){l.disabled=!0,l.textContent="Opslaan\u2026";try{let r=z(i);if(i==="discovery"){let w=[...document.querySelectorAll("#decade-grid .settings-checkbox-pill input:checked")].map(L=>L.value);r.activeDecades=JSON.stringify(w)}await T(i,r),f[i]={...f[i]||{},...r},b("\u2713 Instellingen opgeslagen")}catch(r){console.error("Save failed:",r),b("Opslaan mislukt: "+r.message,"error")}finally{l.disabled=!1,l.textContent="Opslaan"}}})}),e.querySelectorAll(".settings-slider").forEach(l=>{let i=document.getElementById(`${l.id}-val`);i&&l.addEventListener("input",()=>{i.textContent=l.value+(l.dataset.unit||"")})});let n=document.getElementById("stg-postprocess-lossyCopy"),s=document.getElementById("lossy-options");n&&s&&n.addEventListener("change",()=>{s.style.display=n.checked?"":"none"});let t=document.getElementById("stg-postprocess-deleteOriginal"),a=document.getElementById("blasphemy-warning");t&&a&&t.addEventListener("change",()=>{a.style.display=t.checked?"":"none"}),document.getElementById("test-plex-btn")?.addEventListener("click",()=>H("plex-status-dot","/api/plex/status")),document.getElementById("test-tidarr-btn")?.addEventListener("click",async()=>{let l=document.getElementById("tidarr-status-dot");l&&(l.innerHTML=c("loading"));try{let i=await u("/api/tidarr/status");l&&(l.innerHTML=c(i?.online?"ok":"error"))}catch{l&&(l.innerHTML=c("error"))}}),document.getElementById("test-orpheus-btn")?.addEventListener("click",async()=>{let l=document.getElementById("orpheus-status-dot");l&&(l.innerHTML=c("loading"));try{let i=await u("/api/orpheus/status");l&&(l.innerHTML=c(i?.online?"ok":"error"))}catch{l&&(l.innerHTML=c("error"))}}),document.getElementById("test-spotify-btn")?.addEventListener("click",async()=>{b("Spotify verbinding getest")}),document.getElementById("test-discord-btn")?.addEventListener("click",async()=>{let l=(document.getElementById("stg-notifications-discordWebhook")?.value||"").trim();if(!l)return b("Voer eerst een webhook URL in","error");try{await fetch(l,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:"\u{1F3B5} Muziekdashboard test notificatie"})}),b("\u2713 Discord test verstuurd")}catch{b("Discord test mislukt","error")}}),document.getElementById("test-telegram-btn")?.addEventListener("click",()=>b("Telegram test (nog niet ge\xEFmplementeerd)")),document.getElementById("test-pushbullet-btn")?.addEventListener("click",()=>b("Pushbullet test (nog niet ge\xEFmplementeerd)")),document.getElementById("clear-cache-btn")?.addEventListener("click",async()=>{if(confirm("Weet je zeker dat je de cache wilt leegmaken? De app is even langzamer totdat de cache opnieuw is gevuld."))try{await u("/api/cache/clear",{method:"POST"}),b("\u2713 Cache geleegd"),$()}catch{b("Cache leegmaken mislukt","error")}}),document.getElementById("refresh-db-stats-btn")?.addEventListener("click",$),N(),M(),_()}async function N(){try{let e=await fetch("/api/enrichment/settings");if(!e.ok)return;let n=await e.json(),s=document.getElementById("enr-genius-key");s&&n.genius_api_key&&(s.placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");let t=document.getElementById("enr-discogs-token");t&&n.discogs_token&&(t.placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");let a=document.getElementById("enr-discogs-ua");a&&n.discogs_user_agent&&(a.value=n.discogs_user_agent);let l=document.getElementById("enr-genre-filter");l&&(l.checked=!!n.genre_filter_enabled),document.querySelectorAll(".enr-worker-toggle").forEach(i=>{let d=`worker_${i.dataset.source}_enabled`;i.checked=n[d]!==!1})}catch(e){console.warn("Enrichment settings load failed:",e)}document.getElementById("save-enrichment-settings")?.addEventListener("click",async()=>{let e=document.getElementById("enrichment-settings-msg");e&&(e.textContent="Opslaan\u2026");let n={},s=document.getElementById("enr-genius-key"),t=document.getElementById("enr-discogs-token"),a=document.getElementById("enr-discogs-ua"),l=document.getElementById("enr-genre-filter");s?.value.trim()&&(n.genius_api_key=s.value.trim()),t?.value.trim()&&(n.discogs_token=t.value.trim()),a?.value.trim()&&(n.discogs_user_agent=a.value.trim()),l&&(n.genre_filter_enabled=l.checked),document.querySelectorAll(".enr-worker-toggle").forEach(i=>{n[`worker_${i.dataset.source}_enabled`]=i.checked});try{let i=await fetch("/api/enrichment/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(!i.ok)throw new Error(`HTTP ${i.status}`);e&&(e.textContent="\u2713 Opgeslagen!",setTimeout(()=>{e&&(e.textContent="")},3e3))}catch(i){e&&(e.textContent=`Fout: ${i.message}`)}}),document.getElementById("enr-manage-genres")?.addEventListener("click",()=>W())}async function W(){try{let s=(await(await fetch("/api/enrichment/genres")).json()).genres||[],t=document.getElementById("enrichment-settings-card");if(!t)return;document.getElementById("enr-genre-panel")?.remove();let a=document.createElement("div");a.id="enr-genre-panel",a.style.cssText="margin-top:16px;padding:14px;background:var(--color-bg2,rgba(128,128,128,.08));border-radius:8px;";let l="enr-genre-search-"+Date.now();a.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:13px;">Genre Whitelist (${s.length} genres)</strong>
        <button id="enr-genre-panel-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-muted)">\u2715</button>
      </div>
      <input id="${l}" type="search" placeholder="Zoek genre\u2026" style="width:100%;font-size:12px;padding:5px 8px;border:1px solid var(--color-border,rgba(128,128,128,.2));border-radius:4px;background:var(--color-bg);color:var(--color-text);margin-bottom:8px;">
      <div id="enr-genre-list" style="max-height:220px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px;">
        ${s.map(i=>`
          <label style="display:flex;align-items:center;gap:4px;font-size:11px;padding:3px 6px;background:${i.enabled?"var(--color-accent,#1a73e8)":"var(--color-bg2,rgba(128,128,128,.12))"};color:${i.enabled?"#fff":"var(--color-text)"};border-radius:12px;cursor:pointer;user-select:none;">
            <input type="checkbox" class="enr-genre-check" data-genre="${i.genre}" ${i.enabled?"checked":""} style="width:0;height:0;opacity:0;position:absolute;">
            ${i.genre}
          </label>`).join("")}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button id="enr-genre-save" class="settings-btn settings-btn-primary" style="font-size:12px;">Opslaan</button>
        <button id="enr-genre-select-all" class="settings-btn settings-btn-secondary" style="font-size:12px;">Alles aan</button>
        <button id="enr-genre-deselect-all" class="settings-btn settings-btn-secondary" style="font-size:12px;">Alles uit</button>
      </div>
      <div id="enr-genre-msg" style="font-size:11px;margin-top:6px;color:var(--color-accent)"></div>`,t.appendChild(a),a.scrollIntoView({behavior:"smooth",block:"nearest"}),a.querySelector("#enr-genre-panel-close")?.addEventListener("click",()=>a.remove()),a.querySelector(`#${l}`)?.addEventListener("input",i=>{let r=i.target.value.toLowerCase();a.querySelectorAll(".enr-genre-check").forEach(d=>{let w=d.closest("label");w&&(w.style.display=d.dataset.genre.includes(r)?"":"none")})}),a.querySelectorAll(".enr-genre-check").forEach(i=>{i.addEventListener("change",()=>{let r=i.closest("label");r&&(r.style.background=i.checked?"var(--color-accent,#1a73e8)":"var(--color-bg2,rgba(128,128,128,.12))",r.style.color=i.checked?"#fff":"var(--color-text)")})}),a.querySelector("#enr-genre-select-all")?.addEventListener("click",()=>{a.querySelectorAll(".enr-genre-check").forEach(i=>{i.checked=!0,i.dispatchEvent(new Event("change"))})}),a.querySelector("#enr-genre-deselect-all")?.addEventListener("click",()=>{a.querySelectorAll(".enr-genre-check").forEach(i=>{i.checked=!1,i.dispatchEvent(new Event("change"))})}),a.querySelector("#enr-genre-save")?.addEventListener("click",async()=>{let i=a.querySelector("#enr-genre-msg");i&&(i.textContent="Opslaan\u2026");let r=[];a.querySelectorAll(".enr-genre-check").forEach(d=>{r.push({genre:d.dataset.genre,enabled:d.checked})});try{let d=await fetch("/api/enrichment/genres",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({genres:r})});if(!d.ok)throw new Error(`HTTP ${d.status}`);i&&(i.textContent=`\u2713 ${r.length} genres opgeslagen`)}catch(d){i&&(i.textContent=`Fout: ${d.message}`)}})}catch(e){console.warn("Genre whitelist load failed:",e)}}async function G(){let e=document.getElementById("content");if(!e)return;e.innerHTML='<div style="padding:48px;text-align:center;color:var(--text-muted)">Instellingen laden\u2026</div>';try{await S()}catch(t){console.error("Settings load failed:",t)}let n=x.map(t=>`<button class="settings-tab-btn${t.id===k?" active":""}" data-tab="${o(t.id)}">${o(t.label)}</button>`).join(""),s=x.map(t=>t.render()).join(`
`);e.innerHTML=`
    <div class="settings-page" id="settings-page">
      <div class="settings-page-header">
        <h1 class="settings-page-title">Instellingen</h1>
        <p class="settings-page-subtitle">Pas het muziekdashboard aan naar jouw wensen</p>
      </div>
      <div class="settings-tabs">${n}</div>
      ${s}
    </div>`,document.title="Muziek \xB7 Instellingen",q(),k==="onderhoud"&&$()}export{G as loadSettings};
