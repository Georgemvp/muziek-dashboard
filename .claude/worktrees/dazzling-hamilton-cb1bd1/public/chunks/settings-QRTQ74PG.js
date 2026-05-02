import{h as o,z as m}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var S={},f={},k="algemeen";function v(e,t="ok"){let s=document.getElementById("settings-toast");s||(s=document.createElement("div"),s.id="settings-toast",s.className="settings-toast",document.body.appendChild(s)),s.textContent=e,s.className=`settings-toast${t==="error"?" error":""}`,requestAnimationFrame(()=>{requestAnimationFrame(()=>s.classList.add("visible"))}),clearTimeout(s._timer),s._timer=setTimeout(()=>s.classList.remove("visible"),2800)}async function W(){let e=await m("/api/settings");S=e.categories||{},f=e.env||{}}async function F(e,t){await m(`/api/settings/${e}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}function b(e,t,s=""){return S[e]?.[t]??s}function g(e,t,s=!1){let n=b(e,t,s)===!0||b(e,t,s)==="true";return`
    <label class="settings-toggle" title="">
      <input type="checkbox" id="${`stg-${e}-${t}`}" data-cat="${o(e)}" data-key="${o(t)}" ${n?"checked":""}>
      <span class="settings-toggle-track"></span>
    </label>`}function h(e,t,s,n=""){let a=b(e,t,n),i=`stg-${e}-${t}`,l=s.map(r=>typeof r=="string"?`<option value="${o(r)}" ${a===r?"selected":""}>${o(r)}</option>`:`<option value="${o(r.value)}" ${a===r.value?"selected":""}>${o(r.label)}</option>`).join("");return`<select class="settings-select" id="${i}" data-cat="${o(e)}" data-key="${o(t)}">${l}</select>`}function w(e,t,s={}){let{type:n="text",placeholder:a="",readonly:i=!1,cls:l=""}=s,r=b(e,t,s.defaultVal??""),d=`stg-${e}-${t}`;return`<input
    class="settings-input ${l}"
    id="${d}"
    type="${o(n)}"
    placeholder="${o(a)}"
    value="${o(String(r))}"
    data-cat="${o(e)}"
    data-key="${o(t)}"
    ${i?"readonly":""}>`}function M(e,t,{min:s=0,max:n=100,step:a=1,unit:i="",defaultVal:l=50}={}){let r=Number(b(e,t,l)),d=`stg-${e}-${t}`;return`
    <div class="settings-slider-wrap">
      <input
        class="settings-slider"
        id="${d}"
        type="range"
        min="${s}" max="${n}" step="${a}"
        value="${r}"
        data-cat="${o(e)}"
        data-key="${o(t)}"
        data-unit="${o(i)}">
      <span class="settings-slider-value" id="${d}-val">${r}${i}</span>
    </div>`}function c(e){return`<span class="settings-status"><span class="settings-status-dot ${e==="ok"?"ok":e==="loading"?"loading":e==="error"?"error":"idle"}"></span>${e==="ok"?"Verbonden":e==="loading"?"Testen\u2026":e==="error"?"Niet bereikbaar":"Onbekend"}</span>`}function p(e){return`<button class="settings-btn settings-btn-primary settings-save-btn" data-cat="${o(e)}">Opslaan</button>`}function V(){let e=[{value:"home",label:"Home"},{value:"albums",label:"Albums"},{value:"artists",label:"Artists"},{value:"ontdek",label:"Ontdek"},{value:"nu",label:"Nu Bezig"},{value:"downloads",label:"Downloads"},{value:"releases",label:"Nieuwe Releases"},{value:"stats",label:"Statistieken"}];return`
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
            ${h("algemeen","language",[{value:"nl",label:"Nederlands"},{value:"en",label:"English"}],"nl")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Thema</strong>
            <span>Kleurschema van de interface</span>
          </div>
          <div class="settings-row-control">
            ${h("algemeen","theme",[{value:"light",label:"Licht"},{value:"dark",label:"Donker"},{value:"auto",label:"Systeem (auto)"}],"light")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Startpagina</strong>
            <span>Welke view wordt geladen bij opstarten</span>
          </div>
          <div class="settings-row-control">
            ${h("algemeen","startView",e,"home")}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Sidebar items</h3>
      <div class="settings-group">
        ${[{key:"showGenres",label:"Genres",desc:"Genre browser in de sidebar"},{key:"showRadio",label:"Live Radio",desc:"Live radio tab"},{key:"showHistory",label:"History",desc:"Afspeel-geschiedenis"},{key:"showStats",label:"Statistieken",desc:"Last.fm statistieken"},{key:"showComposers",label:"Componisten",desc:"Klassieke muziek componisten"},{key:"showFolders",label:"Folders",desc:"Bestandsmappen browser"},{key:"showTags",label:"Tags",desc:"Genre tags overzicht"},{key:"showMediaSage",label:"MediaSage AI",desc:"AI aanbevelingen tools"}].map(t=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${o(t.label)}</strong>
              <span>${o(t.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${g("sidebar",t.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${p("algemeen")}${p("sidebar")}</div>
    </div>
  </div>`}function G(){let e=f.lastfm||{},t=f.plex||{},s=f.spotify||{},n=f.tidarr||{},a=f.orpheus||{};return`
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
        ${["itunes","discogs","audiodb","genius","tidal","qobuz"].map(i=>`
        <div class="settings-row">
          <div class="settings-row-label"><strong>${o(i.charAt(0).toUpperCase()+i.slice(1))}</strong></div>
          <div class="settings-row-control">
            <label class="settings-toggle">
              <input type="checkbox" class="enr-worker-toggle" data-source="${o(i)}" checked>
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
            <input class="settings-input" type="url" value="${o(t.url||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Token</strong><span>Plex authenticatie token</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(t.token||"\u2014")}" readonly>
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
            <input class="settings-input" type="url" value="${o(n.url||"http://localhost:8484")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${o(n.api_key||"\u2014")}" readonly>
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
        ${["Tidal","Qobuz","Deezer","Spotify","SoundCloud","Apple Music","Beatport","Beatsource","YouTube"].map(i=>`<div class="settings-platform-item">
            <span class="settings-status-dot idle" id="plat-${i.toLowerCase().replace(" ","")}"></span>
            ${o(i)}
          </div>`).join("")}
      </div>
    </div>
  </div>`}function U(){let e=(()=>{try{let n=b("downloads","sourcePriority",null);return n?JSON.parse(n):["orpheus","tidarr"]}catch{return["orpheus","tidarr"]}})(),s=[...[{id:"orpheus",label:"OrpheusDL",badge:"9 platforms"},{id:"tidarr",label:"Tidarr",badge:"Tidal"}]].sort((n,a)=>{let i=e.indexOf(n.id),l=e.indexOf(a.id);return(i===-1?99:i)-(l===-1?99:l)});return`
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
            ${h("downloads","defaultQuality",[{value:"lossless",label:"FLAC (Lossless)"},{value:"high",label:"MP3 320kbps"},{value:"low",label:"MP3 128kbps"}],"lossless")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Download locatie</strong>
            <span>Pad naar de muziekmap op de server</span>
          </div>
          <div class="settings-row-control">
            ${w("downloads","downloadPath",{placeholder:"/music",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Mapstructuur</strong>
            <span>Template voor mapindeling van downloads</span>
          </div>
          <div class="settings-row-control" style="flex-direction:column;align-items:flex-start;gap:8px;">
            ${w("downloads","folderTemplate",{placeholder:"$albumartist/$year - $album",defaultVal:"$albumartist/$year - $album",cls:"settings-input-full"})}
            <div class="settings-var-ref">
              ${["$albumartist","$artist","$album","$title","$track","$year","$genre","$quality"].map(n=>`<span class="settings-var-chip">${n}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${p("downloads")}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Download-bron prioriteit</h3>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 var(--space-4)">
        Sleep de bronnen in de gewenste volgorde. Hogere positie = hogere prioriteit.
      </p>
      <ul class="settings-drag-list" id="source-priority-list">
        ${s.map(n=>{let a=b("downloads",`${n.id}Enabled`,!0)!==!1;return`
          <li class="settings-drag-item" draggable="true" data-source="${o(n.id)}">
            <span class="settings-drag-handle">\u283F</span>
            <span class="settings-drag-item-label">${o(n.label)}</span>
            <span class="settings-drag-item-badge">${o(n.badge)}</span>
            <label class="settings-toggle" style="margin-left:auto">
              <input type="checkbox" class="source-enabled-toggle" data-source="${o(n.id)}" ${a?"checked":""}>
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

      <div class="settings-save-row">${p("downloads")}</div>
    </div>
  </div>`}function J(){let e=b("postprocess","lossyCopy",!1)===!0||b("postprocess","lossyCopy",!1)==="true";return`
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
              ${h("postprocess","lossyFormat",[{value:"mp3",label:"MP3"},{value:"opus",label:"Opus"},{value:"aac",label:"AAC"}],"mp3")}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Bitrate</strong>
            </div>
            <div class="settings-row-control">
              ${M("postprocess","lossyBitrate",{min:128,max:320,step:64,unit:"kbps",defaultVal:320})}
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
      <div class="settings-warning" id="blasphemy-warning" style="${b("postprocess","deleteOriginal",!1)?"":"display:none"}">
        <span class="settings-warning-icon">\u26A0\uFE0F</span>
        <span class="settings-warning-text">
          <strong>Let op!</strong> Het originele lossless bestand wordt permanent verwijderd na conversie.
          Dit is onomkeerbaar. Zorg dat je een backup hebt.
        </span>
      </div>
      <div class="settings-save-row">${p("postprocess")}</div>
    </div>
  </div>`}function K(){let e=["1960s","1970s","1980s","1990s","2000s","2010s","2020s"],t=(()=>{try{let n=b("discovery","activeDecades",null);return n?JSON.parse(n):["1990s","2000s","2010s","2020s"]}catch{return["1990s","2000s","2010s","2020s"]}})(),s=[{value:"1",label:"Maandag"},{value:"2",label:"Dinsdag"},{value:"3",label:"Woensdag"},{value:"4",label:"Donderdag"},{value:"5",label:"Vrijdag"},{value:"6",label:"Zaterdag"},{value:"0",label:"Zondag"}];return`
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
            ${h("discovery","weeklyDay",s,"1")}
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
            ${h("discovery","radarInterval",[{value:"6",label:"Elke 6 uur"},{value:"12",label:"Elke 12 uur"},{value:"24",label:"Dagelijks"},{value:"48",label:"Om de dag"},{value:"168",label:"Wekelijks"}],"24")}
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
          ${e.map(n=>{let a=t.includes(n);return`<label class="settings-checkbox-pill${a?" checked":""}" data-decade="${o(n)}">
              <input type="checkbox" ${a?"checked":""} value="${o(n)}">
              ${o(n)}
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
              value="${Number(b("discovery","maxTracks",50))}">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Serendipity factor</strong>
            <span>Hoe "verrassend" de aanbevelingen zijn (0% = alleen bekende artiesten, 100% = maximale ontdekking)</span>
          </div>
          <div class="settings-row-control">
            ${M("discovery","serendipity",{min:0,max:100,step:5,unit:"%",defaultVal:30})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${p("discovery")}</div>
    </div>
  </div>`}function Z(){return`
  <div class="settings-panel" id="tab-automatisering">
    <div class="settings-card">
      <div class="settings-coming-soon">
        <div class="settings-coming-soon-icon">\u2699\uFE0F</div>
        <h3 class="settings-coming-soon-title">Automatisering</h3>
        <p class="settings-coming-soon-sub">Automatische taken, schema's en triggers komen binnenkort.</p>
      </div>
    </div>
  </div>`}function Q(){let e=[{key:"notifNewRelease",label:"Nieuwe release",desc:"Artiest uit je bibliotheek heeft iets uitgebracht"},{key:"notifDownloadDone",label:"Download voltooid",desc:"Een album is succesvol gedownload"},{key:"notifLibraryScan",label:"Library scan klaar",desc:"Plex bibliotheek synchronisatie voltooid"},{key:"notifError",label:"Fout opgetreden",desc:"Download of service fout"}];return`
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
            ${w("notifications","discordWebhook",{placeholder:"https://discord.com/api/webhooks/...",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-discord-btn">Test Discord</button>
        ${p("notifications")}
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
            ${w("notifications","telegramToken",{placeholder:"123456:ABC-DEF...",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Chat ID</strong>
            <span>Je Telegram chat of groep ID</span>
          </div>
          <div class="settings-row-control">
            ${w("notifications","telegramChatId",{placeholder:"-1001234567890",cls:"settings-input-sm"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-telegram-btn">Test Telegram</button>
        ${p("notifications")}
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
            ${w("notifications","pushbulletKey",{placeholder:"o.xxxxxxxxxxxxxxxxxx",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-pushbullet-btn">Test Pushbullet</button>
        ${p("notifications")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Notificatie types</h3>
      <div class="settings-group">
        ${e.map(t=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${o(t.label)}</strong>
              <span>${o(t.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${g("notifications",t.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${p("notifications")}</div>
    </div>
  </div>`}function Y(){return`
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
            ${h("onderhoud","logLevel",[{value:"trace",label:"Trace (meest detail)"},{value:"debug",label:"Debug"},{value:"info",label:"Info (standaard)"},{value:"warn",label:"Warn"},{value:"error",label:"Error"},{value:"fatal",label:"Fatal (minst detail)"}],"info")}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${p("onderhoud")}</div>
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
            ${h("onderhoud","backupInterval",[{value:"never",label:"Nooit"},{value:"daily",label:"Dagelijks"},{value:"weekly",label:"Wekelijks"},{value:"monthly",label:"Maandelijks"}],"weekly")}
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
      <div class="settings-save-row">${p("onderhoud")}</div>
    </div>
  </div>`}function X(){return`
  <div class="settings-panel" id="tab-logs">
    <div class="log-viewer">
      <div class="log-toolbar">
        <select class="log-level-select" id="log-level-filter" aria-label="Log niveau filter">
          <option value="all">Alle niveaus</option>
          <option value="debug">DEBUG+</option>
          <option value="info" selected>INFO+</option>
          <option value="warn">WARN+</option>
          <option value="error">ERROR+</option>
        </select>
        <input type="search" class="log-search-input" id="log-search" placeholder="Zoek in logs\u2026" aria-label="Zoek in logs">
        <div class="log-toolbar-right">
          <label class="log-autoscroll-label">
            <input type="checkbox" id="log-autoscroll" checked aria-label="Auto-scroll">
            Auto-scroll
          </label>
          <button class="log-toolbar-btn" id="log-clear-btn" title="Wis alle logs">Wis</button>
          <button class="log-toolbar-btn" id="log-copy-btn" title="Kopieer alle logs als JSON">Kopieer</button>
          <span class="log-ws-status" id="log-ws-status" title="WebSocket status">\u23F3</span>
        </div>
      </div>
      <div class="log-terminal" id="log-terminal" role="log" aria-live="polite" aria-label="Server logs">
        <div class="log-entries" id="log-entries">
          <div class="log-empty">
            <div class="log-empty-icon">\u{1F4CB}</div>
            <span>Logs laden\u2026</span>
          </div>
        </div>
      </div>
    </div>
  </div>`}var H=[{id:"algemeen",label:"Algemeen",render:V},{id:"verbindingen",label:"Verbindingen",render:G},{id:"downloads",label:"Downloads",render:U},{id:"postprocess",label:"Post-Processing",render:J},{id:"discovery",label:"Discovery",render:K},{id:"automatisering",label:"Automatisering",render:Z},{id:"notificaties",label:"Notificaties",render:Q},{id:"onderhoud",label:"Onderhoud",render:Y},{id:"logs",label:"\u{1F4CB} Logs",render:X}];function ee(e){let t={};return document.querySelectorAll(`[data-cat="${e}"]`).forEach(s=>{if(!s.dataset.key)return;let n=s.dataset.key;s.type==="checkbox"?t[n]=s.checked:s.type==="range"||s.type==="number"?t[n]=Number(s.value):t[n]=s.value}),t}async function I(){try{let t=(await m("/api/settings")).categories||{},s=0;for(let a of Object.values(t))s+=Object.keys(a).length;let n=a=>document.getElementById(a);n("db-settings-count")&&(n("db-settings-count").textContent=s);try{let a=await m("/api/downloads/history");n("db-downloads-count")&&Array.isArray(a)&&(n("db-downloads-count").textContent=a.length)}catch{n("db-downloads-count")&&(n("db-downloads-count").textContent="?")}try{let a=await m("/api/wishlist");n("db-wishlist-count")&&Array.isArray(a)&&(n("db-wishlist-count").textContent=a.length)}catch{n("db-wishlist-count")&&(n("db-wishlist-count").textContent="?")}n("db-cache-count")&&(n("db-cache-count").textContent="?")}catch(e){console.warn("DB stats failed:",e)}}async function te(e,t){let s=document.getElementById(e);s&&(s.innerHTML=c("loading"));try{let n=await m(t),a=n&&n.up!==!1;s&&(s.innerHTML=c(a?"ok":"error"))}catch{s&&(s.innerHTML=c("error"))}}function se(){let e=document.getElementById("source-priority-list");if(!e)return;let t=null;e.querySelectorAll(".settings-drag-item").forEach(s=>{s.addEventListener("dragstart",()=>{t=s,s.style.opacity="0.5"}),s.addEventListener("dragend",()=>{s.style.opacity="",t=null,e.querySelectorAll(".settings-drag-item").forEach(a=>a.classList.remove("drag-over"));let n=[...e.querySelectorAll(".settings-drag-item")].map(a=>a.dataset.source);m("/api/settings/downloads",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourcePriority:JSON.stringify(n)})}).catch(()=>{})}),s.addEventListener("dragover",n=>{if(n.preventDefault(),t&&t!==s){s.classList.add("drag-over");let a=s.getBoundingClientRect(),i=a.top+a.height/2;n.clientY<i?e.insertBefore(t,s):e.insertBefore(t,s.nextSibling)}}),s.addEventListener("dragleave",()=>s.classList.remove("drag-over")),s.addEventListener("drop",n=>n.preventDefault())})}function ne(){let e=document.getElementById("decade-grid");e&&e.querySelectorAll(".settings-checkbox-pill").forEach(t=>{let s=t.querySelector("input");s&&(t.addEventListener("click",n=>{n.target!==s&&(s.checked=!s.checked)}),s.addEventListener("change",()=>{t.classList.toggle("checked",s.checked)}))})}var ie={all:0,trace:10,debug:20,info:30,warn:40,error:50,fatal:60},ae={10:"TRACE",20:"DEBUG",30:"INFO",40:"WARN",50:"ERROR",60:"FATAL"},le={10:"#6c7086",20:"#6c7086",30:"#89b4fa",40:"#f9e2af",50:"#f38ba8",60:"#f38ba8"},y=[],u=null,C=null,E=1e3,L={level:"info",search:""},D=!0,A=!1;function P(e){let t=e.level||30,s=ae[t]||String(t),n=le[t]||"#a6adc8",a=t>=60,i="";if(e.time){let T=new Date(typeof e.time=="number"&&e.time<1e12?e.time*1e3:e.time);if(!isNaN(T)){i=T.toLocaleTimeString("nl-NL",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit"});let R=String(T.getMilliseconds()).padStart(3,"0");i+=`.${R}`}}let l=o(e.msg||""),r=e.service?o(e.service):"",{time:d,level:$,msg:O,service:pe,pid:be,hostname:me,environment:he,...N}=e,j=Object.keys(N).length>0,z=j?o(JSON.stringify(N,null,2)):"";return`<div class="log-entry log-entry--${s.toLowerCase()}${a?" log-entry--fatal":""}" data-level="${t}"><span class="log-ts">${i}</span><span class="log-level" style="color:${n}">${s}</span>`+(r?`<span class="log-service">${r}</span>`:"")+`<span class="log-msg">${l}</span>`+(j?`<button class="log-expand-btn" aria-label="Details tonen">\u203A</button><pre class="log-extra" style="display:none">${z}</pre>`:"")+"</div>"}function q(e){let t=ie[L.level]||0;return!(t>0&&(e.level||30)<t||L.search&&!((e.msg||"")+JSON.stringify(e)).toLowerCase().includes(L.search))}function B(){let e=document.getElementById("log-entries");if(!e)return;let t=y.filter(q).slice(-500);if(t.length===0){e.innerHTML='<div class="log-empty"><div class="log-empty-icon">\u{1F50D}</div><span>Geen logs gevonden</span></div>';return}if(e.innerHTML=t.map(P).join(""),oe(e),D){let s=document.getElementById("log-terminal");s&&(s.scrollTop=s.scrollHeight)}}function oe(e){e.querySelectorAll(".log-expand-btn").forEach(t=>{t.addEventListener("click",()=>{let s=t.nextElementSibling;if(!s)return;let n=s.style.display!=="none";s.style.display=n?"none":"block",t.textContent=n?"\u203A":"\u2304"})})}function re(e){if(y.push(e),y.length>1e3&&y.shift(),!q(e))return;let t=document.getElementById("log-entries");if(!t)return;let s=t.querySelector(".log-empty");for(s&&s.remove();t.children.length>=500;)t.removeChild(t.firstChild);let n=document.createElement("div");n.innerHTML=P(e);let a=n.firstElementChild;a&&(a.querySelector(".log-expand-btn")?.addEventListener("click",()=>{let i=a.querySelector(".log-extra"),l=a.querySelector(".log-expand-btn");if(!i||!l)return;let r=i.style.display!=="none";i.style.display=r?"none":"block",l.textContent=r?"\u203A":"\u2304"}),t.appendChild(a),D&&!A&&(A=!0,requestAnimationFrame(()=>{A=!1;let i=document.getElementById("log-terminal");i&&(i.scrollTop=i.scrollHeight)})))}function x(e,t){let s=document.getElementById("log-ws-status");s&&(s.textContent=e,s.title=t)}function _(){if(u&&(u.readyState===WebSocket.OPEN||u.readyState===WebSocket.CONNECTING))return;let t=`${location.protocol==="https:"?"wss:":"ws:"}//${location.host}/logs`;x("\u{1F504}","Verbinding maken\u2026");try{u=new WebSocket(t)}catch(s){x("\u{1F534}",`Kon niet verbinden: ${s.message}`);return}u.addEventListener("open",()=>{E=1e3,x("\u{1F7E2}","Live verbonden")}),u.addEventListener("message",s=>{try{let n=JSON.parse(s.data);if(n._bulk){for(let a of n.entries||[])y.push(a),y.length>1e3&&y.shift();B()}else n.type!=="pong"&&re(n)}catch{}}),u.addEventListener("close",()=>{x("\u{1F534}",`Verbroken \u2013 herverbinden in ${Math.round(E/1e3)}s`),clearTimeout(C),C=setTimeout(()=>{E=Math.min(E*2,3e4),_()},E)}),u.addEventListener("error",()=>{x("\u26A0\uFE0F","Verbindingsfout")})}function de(){clearTimeout(C),u&&(u.onclose=null,u.close(),u=null)}function ce(){document.getElementById("log-level-filter")?.addEventListener("change",t=>{L.level=t.target.value,B()});let e=null;document.getElementById("log-search")?.addEventListener("input",t=>{clearTimeout(e),e=setTimeout(()=>{L.search=t.target.value.toLowerCase(),B()},200)}),document.getElementById("log-autoscroll")?.addEventListener("change",t=>{D=t.target.checked}),document.getElementById("log-clear-btn")?.addEventListener("click",()=>{y=[];let t=document.getElementById("log-entries");t&&(t.innerHTML='<div class="log-empty"><div class="log-empty-icon">\u{1F5D1}\uFE0F</div><span>Logs gewist</span></div>')}),document.getElementById("log-copy-btn")?.addEventListener("click",()=>{let t=y.map(s=>JSON.stringify(s)).join(`
`);navigator.clipboard?.writeText(t).then(()=>v("\u2713 Logs gekopieerd")).catch(()=>v("Kopi\xEBren mislukt","error"))}),k==="logs"&&_()}function ge(){let e=document.getElementById("settings-page");if(!e)return;e.querySelectorAll(".settings-tab-btn").forEach(i=>{i.addEventListener("click",()=>{k=i.dataset.tab,e.querySelectorAll(".settings-tab-btn").forEach(r=>r.classList.toggle("active",r===i)),e.querySelectorAll(".settings-panel").forEach(r=>r.classList.remove("active"));let l=document.getElementById(`tab-${k}`);l&&l.classList.add("active"),k==="logs"&&_()})}),e.querySelectorAll(".settings-save-btn").forEach(i=>{i.addEventListener("click",async()=>{let l=i.dataset.cat;if(l){i.disabled=!0,i.textContent="Opslaan\u2026";try{let r=ee(l);if(l==="discovery"){let $=[...document.querySelectorAll("#decade-grid .settings-checkbox-pill input:checked")].map(O=>O.value);r.activeDecades=JSON.stringify($)}await F(l,r),S[l]={...S[l]||{},...r},v("\u2713 Instellingen opgeslagen")}catch(r){console.error("Save failed:",r),v("Opslaan mislukt: "+r.message,"error")}finally{i.disabled=!1,i.textContent="Opslaan"}}})}),e.querySelectorAll(".settings-slider").forEach(i=>{let l=document.getElementById(`${i.id}-val`);l&&i.addEventListener("input",()=>{l.textContent=i.value+(i.dataset.unit||"")})});let t=document.getElementById("stg-postprocess-lossyCopy"),s=document.getElementById("lossy-options");t&&s&&t.addEventListener("change",()=>{s.style.display=t.checked?"":"none"});let n=document.getElementById("stg-postprocess-deleteOriginal"),a=document.getElementById("blasphemy-warning");n&&a&&n.addEventListener("change",()=>{a.style.display=n.checked?"":"none"}),document.getElementById("test-plex-btn")?.addEventListener("click",()=>te("plex-status-dot","/api/plex/status")),document.getElementById("test-tidarr-btn")?.addEventListener("click",async()=>{let i=document.getElementById("tidarr-status-dot");i&&(i.innerHTML=c("loading"));try{let l=await m("/api/tidarr/status");i&&(i.innerHTML=c(l?.online?"ok":"error"))}catch{i&&(i.innerHTML=c("error"))}}),document.getElementById("test-orpheus-btn")?.addEventListener("click",async()=>{let i=document.getElementById("orpheus-status-dot");i&&(i.innerHTML=c("loading"));try{let l=await m("/api/orpheus/status");i&&(i.innerHTML=c(l?.online?"ok":"error"))}catch{i&&(i.innerHTML=c("error"))}}),document.getElementById("test-spotify-btn")?.addEventListener("click",async()=>{v("Spotify verbinding getest")}),document.getElementById("test-discord-btn")?.addEventListener("click",async()=>{let i=(document.getElementById("stg-notifications-discordWebhook")?.value||"").trim();if(!i)return v("Voer eerst een webhook URL in","error");try{await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:"\u{1F3B5} Muziekdashboard test notificatie"})}),v("\u2713 Discord test verstuurd")}catch{v("Discord test mislukt","error")}}),document.getElementById("test-telegram-btn")?.addEventListener("click",()=>v("Telegram test (nog niet ge\xEFmplementeerd)")),document.getElementById("test-pushbullet-btn")?.addEventListener("click",()=>v("Pushbullet test (nog niet ge\xEFmplementeerd)")),document.getElementById("clear-cache-btn")?.addEventListener("click",async()=>{if(confirm("Weet je zeker dat je de cache wilt leegmaken? De app is even langzamer totdat de cache opnieuw is gevuld."))try{await m("/api/cache/clear",{method:"POST"}),v("\u2713 Cache geleegd"),I()}catch{v("Cache leegmaken mislukt","error")}}),document.getElementById("refresh-db-stats-btn")?.addEventListener("click",I),ve(),se(),ne(),ce()}async function ve(){try{let e=await fetch("/api/enrichment/settings");if(!e.ok)return;let t=await e.json(),s=document.getElementById("enr-genius-key");s&&t.genius_api_key&&(s.placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");let n=document.getElementById("enr-discogs-token");n&&t.discogs_token&&(n.placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");let a=document.getElementById("enr-discogs-ua");a&&t.discogs_user_agent&&(a.value=t.discogs_user_agent);let i=document.getElementById("enr-genre-filter");i&&(i.checked=!!t.genre_filter_enabled),document.querySelectorAll(".enr-worker-toggle").forEach(l=>{let d=`worker_${l.dataset.source}_enabled`;l.checked=t[d]!==!1})}catch(e){console.warn("Enrichment settings load failed:",e)}document.getElementById("save-enrichment-settings")?.addEventListener("click",async()=>{let e=document.getElementById("enrichment-settings-msg");e&&(e.textContent="Opslaan\u2026");let t={},s=document.getElementById("enr-genius-key"),n=document.getElementById("enr-discogs-token"),a=document.getElementById("enr-discogs-ua"),i=document.getElementById("enr-genre-filter");s?.value.trim()&&(t.genius_api_key=s.value.trim()),n?.value.trim()&&(t.discogs_token=n.value.trim()),a?.value.trim()&&(t.discogs_user_agent=a.value.trim()),i&&(t.genre_filter_enabled=i.checked),document.querySelectorAll(".enr-worker-toggle").forEach(l=>{t[`worker_${l.dataset.source}_enabled`]=l.checked});try{let l=await fetch("/api/enrichment/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!l.ok)throw new Error(`HTTP ${l.status}`);e&&(e.textContent="\u2713 Opgeslagen!",setTimeout(()=>{e&&(e.textContent="")},3e3))}catch(l){e&&(e.textContent=`Fout: ${l.message}`)}}),document.getElementById("enr-manage-genres")?.addEventListener("click",()=>ue())}async function ue(){try{let s=(await(await fetch("/api/enrichment/genres")).json()).genres||[],n=document.getElementById("enrichment-settings-card");if(!n)return;document.getElementById("enr-genre-panel")?.remove();let a=document.createElement("div");a.id="enr-genre-panel",a.style.cssText="margin-top:16px;padding:14px;background:var(--color-bg2,rgba(128,128,128,.08));border-radius:8px;";let i="enr-genre-search-"+Date.now();a.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:13px;">Genre Whitelist (${s.length} genres)</strong>
        <button id="enr-genre-panel-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-muted)">\u2715</button>
      </div>
      <input id="${i}" type="search" placeholder="Zoek genre\u2026" style="width:100%;font-size:12px;padding:5px 8px;border:1px solid var(--color-border,rgba(128,128,128,.2));border-radius:4px;background:var(--color-bg);color:var(--color-text);margin-bottom:8px;">
      <div id="enr-genre-list" style="max-height:220px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px;">
        ${s.map(l=>`
          <label style="display:flex;align-items:center;gap:4px;font-size:11px;padding:3px 6px;background:${l.enabled?"var(--color-accent,#1a73e8)":"var(--color-bg2,rgba(128,128,128,.12))"};color:${l.enabled?"#fff":"var(--color-text)"};border-radius:12px;cursor:pointer;user-select:none;">
            <input type="checkbox" class="enr-genre-check" data-genre="${l.genre}" ${l.enabled?"checked":""} style="width:0;height:0;opacity:0;position:absolute;">
            ${l.genre}
          </label>`).join("")}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <button id="enr-genre-save" class="settings-btn settings-btn-primary" style="font-size:12px;">Opslaan</button>
        <button id="enr-genre-select-all" class="settings-btn settings-btn-secondary" style="font-size:12px;">Alles aan</button>
        <button id="enr-genre-deselect-all" class="settings-btn settings-btn-secondary" style="font-size:12px;">Alles uit</button>
      </div>
      <div id="enr-genre-msg" style="font-size:11px;margin-top:6px;color:var(--color-accent)"></div>`,n.appendChild(a),a.scrollIntoView({behavior:"smooth",block:"nearest"}),a.querySelector("#enr-genre-panel-close")?.addEventListener("click",()=>a.remove()),a.querySelector(`#${i}`)?.addEventListener("input",l=>{let r=l.target.value.toLowerCase();a.querySelectorAll(".enr-genre-check").forEach(d=>{let $=d.closest("label");$&&($.style.display=d.dataset.genre.includes(r)?"":"none")})}),a.querySelectorAll(".enr-genre-check").forEach(l=>{l.addEventListener("change",()=>{let r=l.closest("label");r&&(r.style.background=l.checked?"var(--color-accent,#1a73e8)":"var(--color-bg2,rgba(128,128,128,.12))",r.style.color=l.checked?"#fff":"var(--color-text)")})}),a.querySelector("#enr-genre-select-all")?.addEventListener("click",()=>{a.querySelectorAll(".enr-genre-check").forEach(l=>{l.checked=!0,l.dispatchEvent(new Event("change"))})}),a.querySelector("#enr-genre-deselect-all")?.addEventListener("click",()=>{a.querySelectorAll(".enr-genre-check").forEach(l=>{l.checked=!1,l.dispatchEvent(new Event("change"))})}),a.querySelector("#enr-genre-save")?.addEventListener("click",async()=>{let l=a.querySelector("#enr-genre-msg");l&&(l.textContent="Opslaan\u2026");let r=[];a.querySelectorAll(".enr-genre-check").forEach(d=>{r.push({genre:d.dataset.genre,enabled:d.checked})});try{let d=await fetch("/api/enrichment/genres",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({genres:r})});if(!d.ok)throw new Error(`HTTP ${d.status}`);l&&(l.textContent=`\u2713 ${r.length} genres opgeslagen`)}catch(d){l&&(l.textContent=`Fout: ${d.message}`)}})}catch(e){console.warn("Genre whitelist load failed:",e)}}async function we(){let e=document.getElementById("content");if(!e)return;de(),e.innerHTML='<div style="padding:48px;text-align:center;color:var(--text-muted)">Instellingen laden\u2026</div>';try{await W()}catch(n){console.error("Settings load failed:",n)}let t=H.map(n=>`<button class="settings-tab-btn${n.id===k?" active":""}" data-tab="${o(n.id)}">${o(n.label)}</button>`).join(""),s=H.map(n=>n.render()).join(`
`);e.innerHTML=`
    <div class="settings-page" id="settings-page">
      <div class="settings-page-header">
        <h1 class="settings-page-title">Instellingen</h1>
        <p class="settings-page-subtitle">Pas het muziekdashboard aan naar jouw wensen</p>
      </div>
      <div class="settings-tabs">${t}</div>
      ${s}
    </div>`,document.title="Muziek \xB7 Instellingen",ge(),k==="onderhoud"&&I()}export{we as loadSettings};
