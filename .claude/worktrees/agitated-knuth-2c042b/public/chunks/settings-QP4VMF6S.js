import{h as n,z as u}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var h={},w={},f="algemeen";function p(t,i="ok"){let s=document.getElementById("settings-toast");s||(s=document.createElement("div"),s.id="settings-toast",s.className="settings-toast",document.body.appendChild(s)),s.textContent=t,s.className=`settings-toast${i==="error"?" error":""}`,requestAnimationFrame(()=>{requestAnimationFrame(()=>s.classList.add("visible"))}),clearTimeout(s._timer),s._timer=setTimeout(()=>s.classList.remove("visible"),2800)}async function T(){let t=await u("/api/settings");h=t.categories||{},w=t.env||{}}async function D(t,i){await u(`/api/settings/${t}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)})}function v(t,i,s=""){return h[t]?.[i]??s}function c(t,i,s=!1){let e=v(t,i,s)===!0||v(t,i,s)==="true";return`
    <label class="settings-toggle" title="">
      <input type="checkbox" id="${`stg-${t}-${i}`}" data-cat="${n(t)}" data-key="${n(i)}" ${e?"checked":""}>
      <span class="settings-toggle-track"></span>
    </label>`}function b(t,i,s,e=""){let l=v(t,i,e),a=`stg-${t}-${i}`,o=s.map(d=>typeof d=="string"?`<option value="${n(d)}" ${l===d?"selected":""}>${n(d)}</option>`:`<option value="${n(d.value)}" ${l===d.value?"selected":""}>${n(d.label)}</option>`).join("");return`<select class="settings-select" id="${a}" data-cat="${n(t)}" data-key="${n(i)}">${o}</select>`}function m(t,i,s={}){let{type:e="text",placeholder:l="",readonly:a=!1,cls:o=""}=s,d=v(t,i,s.defaultVal??""),y=`stg-${t}-${i}`;return`<input
    class="settings-input ${o}"
    id="${y}"
    type="${n(e)}"
    placeholder="${n(l)}"
    value="${n(String(d))}"
    data-cat="${n(t)}"
    data-key="${n(i)}"
    ${a?"readonly":""}>`}function x(t,i,{min:s=0,max:e=100,step:l=1,unit:a="",defaultVal:o=50}={}){let d=Number(v(t,i,o)),y=`stg-${t}-${i}`;return`
    <div class="settings-slider-wrap">
      <input
        class="settings-slider"
        id="${y}"
        type="range"
        min="${s}" max="${e}" step="${l}"
        value="${d}"
        data-cat="${n(t)}"
        data-key="${n(i)}"
        data-unit="${n(a)}">
      <span class="settings-slider-value" id="${y}-val">${d}${a}</span>
    </div>`}function r(t){return`<span class="settings-status"><span class="settings-status-dot ${t==="ok"?"ok":t==="loading"?"loading":t==="error"?"error":"idle"}"></span>${t==="ok"?"Verbonden":t==="loading"?"Testen\u2026":t==="error"?"Niet bereikbaar":"Onbekend"}</span>`}function g(t){return`<button class="settings-btn settings-btn-primary settings-save-btn" data-cat="${n(t)}">Opslaan</button>`}function S(){let t=[{value:"home",label:"Home"},{value:"albums",label:"Albums"},{value:"artists",label:"Artists"},{value:"ontdek",label:"Ontdek"},{value:"nu",label:"Nu Bezig"},{value:"downloads",label:"Downloads"},{value:"releases",label:"Nieuwe Releases"},{value:"stats",label:"Statistieken"}];return`
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
            ${b("algemeen","language",[{value:"nl",label:"Nederlands"},{value:"en",label:"English"}],"nl")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Thema</strong>
            <span>Kleurschema van de interface</span>
          </div>
          <div class="settings-row-control">
            ${b("algemeen","theme",[{value:"light",label:"Licht"},{value:"dark",label:"Donker"},{value:"auto",label:"Systeem (auto)"}],"light")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Startpagina</strong>
            <span>Welke view wordt geladen bij opstarten</span>
          </div>
          <div class="settings-row-control">
            ${b("algemeen","startView",t,"home")}
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Sidebar items</h3>
      <div class="settings-group">
        ${[{key:"showGenres",label:"Genres",desc:"Genre browser in de sidebar"},{key:"showRadio",label:"Live Radio",desc:"Live radio tab"},{key:"showHistory",label:"History",desc:"Afspeel-geschiedenis"},{key:"showStats",label:"Statistieken",desc:"Last.fm statistieken"},{key:"showComposers",label:"Componisten",desc:"Klassieke muziek componisten"},{key:"showFolders",label:"Folders",desc:"Bestandsmappen browser"},{key:"showTags",label:"Tags",desc:"Genre tags overzicht"},{key:"showMediaSage",label:"MediaSage AI",desc:"AI aanbevelingen tools"}].map(i=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${n(i.label)}</strong>
              <span>${n(i.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${c("sidebar",i.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${g("algemeen")}${g("sidebar")}</div>
    </div>
  </div>`}function A(){let t=w.lastfm||{},i=w.plex||{},s=w.spotify||{},e=w.tidarr||{},l=w.orpheus||{};return`
  <div class="settings-panel" id="tab-verbindingen">

    <div class="settings-card">
      <h3 class="settings-card-title">Last.fm</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${n(t.api_key||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Gebruikersnaam</strong><span>Last.fm account</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${n(t.username||"\u2014")}" readonly>
          </div>
        </div>
      </div>
      <div class="settings-info">\u2139\uFE0F Last.fm inloggegevens worden beheerd via de <code>.env</code> omgevingsvariabelen op de server.</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Plex</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>Server URL</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${n(i.url||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Token</strong><span>Plex authenticatie token</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${n(i.token||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="plex-status-dot">${r("idle")}</span>
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
            <input class="settings-input settings-input-sm" type="text" value="${n(s.client_id||"\u2014")}" readonly>
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
            ${s.configured?r("ok"):r("error")}
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
            <input class="settings-input" type="url" value="${n(e.url||"http://localhost:8484")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${n(e.api_key||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="tidarr-status-dot">${r("idle")}</span>
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
            <input class="settings-input" type="url" value="${n(l.url||"http://localhost:5000")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="orpheus-status-dot">${r("idle")}</span>
            <button class="settings-btn settings-btn-secondary" id="test-orpheus-btn">Test</button>
          </div>
        </div>
      </div>
      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin:var(--space-4) 0 var(--space-3);">Platform status</h4>
      <div class="settings-platform-grid" id="orpheus-platforms">
        ${["Tidal","Qobuz","Deezer","Spotify","SoundCloud","Apple Music","Beatport","Beatsource","YouTube"].map(a=>`<div class="settings-platform-item">
            <span class="settings-status-dot idle" id="plat-${a.toLowerCase().replace(" ","")}"></span>
            ${n(a)}
          </div>`).join("")}
      </div>
    </div>
  </div>`}function C(){let t=(()=>{try{let e=v("downloads","sourcePriority",null);return e?JSON.parse(e):["orpheus","tidarr"]}catch{return["orpheus","tidarr"]}})(),s=[...[{id:"orpheus",label:"OrpheusDL",badge:"9 platforms"},{id:"tidarr",label:"Tidarr",badge:"Tidal"}]].sort((e,l)=>{let a=t.indexOf(e.id),o=t.indexOf(l.id);return(a===-1?99:a)-(o===-1?99:o)});return`
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
            ${b("downloads","defaultQuality",[{value:"lossless",label:"FLAC (Lossless)"},{value:"high",label:"MP3 320kbps"},{value:"low",label:"MP3 128kbps"}],"lossless")}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Download locatie</strong>
            <span>Pad naar de muziekmap op de server</span>
          </div>
          <div class="settings-row-control">
            ${m("downloads","downloadPath",{placeholder:"/music",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Mapstructuur</strong>
            <span>Template voor mapindeling van downloads</span>
          </div>
          <div class="settings-row-control" style="flex-direction:column;align-items:flex-start;gap:8px;">
            ${m("downloads","folderTemplate",{placeholder:"$albumartist/$year - $album",defaultVal:"$albumartist/$year - $album",cls:"settings-input-full"})}
            <div class="settings-var-ref">
              ${["$albumartist","$artist","$album","$title","$track","$year","$genre","$quality"].map(e=>`<span class="settings-var-chip">${e}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${g("downloads")}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Download-bron prioriteit</h3>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 var(--space-4)">
        Sleep de bronnen in de gewenste volgorde. Hogere positie = hogere prioriteit.
      </p>
      <ul class="settings-drag-list" id="source-priority-list">
        ${s.map(e=>{let l=v("downloads",`${e.id}Enabled`,!0)!==!1;return`
          <li class="settings-drag-item" draggable="true" data-source="${n(e.id)}">
            <span class="settings-drag-handle">\u283F</span>
            <span class="settings-drag-item-label">${n(e.label)}</span>
            <span class="settings-drag-item-badge">${n(e.badge)}</span>
            <label class="settings-toggle" style="margin-left:auto">
              <input type="checkbox" class="source-enabled-toggle" data-source="${n(e.id)}" ${l?"checked":""}>
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
          ${c("downloads","hybridMode",!0)}
        </div>
      </div>

      <div class="settings-save-row">${g("downloads")}</div>
    </div>
  </div>`}function I(){let t=v("postprocess","lossyCopy",!1)===!0||v("postprocess","lossyCopy",!1)==="true";return`
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
            ${c("postprocess","lossyCopy",!1)}
          </div>
        </div>
        <div id="lossy-options" style="${t?"":"display:none"}">
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Lossy formaat</strong>
            </div>
            <div class="settings-row-control">
              ${b("postprocess","lossyFormat",[{value:"mp3",label:"MP3"},{value:"opus",label:"Opus"},{value:"aac",label:"AAC"}],"mp3")}
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>Bitrate</strong>
            </div>
            <div class="settings-row-control">
              ${x("postprocess","lossyBitrate",{min:128,max:320,step:64,unit:"kbps",defaultVal:320})}
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Hi-Res downsampling</strong>
            <span>Converteer 24-bit \u2192 16-bit / 44.1kHz voor compatibiliteit</span>
          </div>
          <div class="settings-row-control">
            ${c("postprocess","hiresDownsample",!1)}
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
            ${c("postprocess","replaygain",!1)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Synchronized lyrics (LRC)</strong>
            <span>Download tijdgestempelde songteksten indien beschikbaar</span>
          </div>
          <div class="settings-row-control">
            ${c("postprocess","syncedLyrics",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Album consistentie check</strong>
            <span>Waarschuw als tracks van een album ontbreken of metadata verschilt</span>
          </div>
          <div class="settings-row-control">
            ${c("postprocess","albumConsistency",!0)}
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
            ${c("postprocess","deleteOriginal",!1)}
          </div>
        </div>
      </div>
      <div class="settings-warning" id="blasphemy-warning" style="${v("postprocess","deleteOriginal",!1)?"":"display:none"}">
        <span class="settings-warning-icon">\u26A0\uFE0F</span>
        <span class="settings-warning-text">
          <strong>Let op!</strong> Het originele lossless bestand wordt permanent verwijderd na conversie.
          Dit is onomkeerbaar. Zorg dat je een backup hebt.
        </span>
      </div>
      <div class="settings-save-row">${g("postprocess")}</div>
    </div>
  </div>`}function B(){let t=["1960s","1970s","1980s","1990s","2000s","2010s","2020s"],i=(()=>{try{let e=v("discovery","activeDecades",null);return e?JSON.parse(e):["1990s","2000s","2010s","2020s"]}catch{return["1990s","2000s","2010s","2020s"]}})(),s=[{value:"1",label:"Maandag"},{value:"2",label:"Dinsdag"},{value:"3",label:"Woensdag"},{value:"4",label:"Donderdag"},{value:"5",label:"Vrijdag"},{value:"6",label:"Zaterdag"},{value:"0",label:"Zondag"}];return`
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
            ${c("discovery","weeklyEnabled",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Dag van de week</strong>
            <span>Wanneer wordt de lijst vernieuwd</span>
          </div>
          <div class="settings-row-control">
            ${b("discovery","weeklyDay",s,"1")}
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
            ${c("discovery","radarEnabled",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Check interval</strong>
            <span>Hoe vaak controleren op nieuwe releases</span>
          </div>
          <div class="settings-row-control">
            ${b("discovery","radarInterval",[{value:"6",label:"Elke 6 uur"},{value:"12",label:"Elke 12 uur"},{value:"24",label:"Dagelijks"},{value:"48",label:"Om de dag"},{value:"168",label:"Wekelijks"}],"24")}
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
            ${c("discovery","seasonalPlaylists",!0)}
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
          ${t.map(e=>{let l=i.includes(e);return`<label class="settings-checkbox-pill${l?" checked":""}" data-decade="${n(e)}">
              <input type="checkbox" ${l?"checked":""} value="${n(e)}">
              ${n(e)}
            </label>`}).join("")}
        </div>

        <div class="settings-row" style="margin-top:var(--space-3)">
          <div class="settings-row-label">
            <strong>Genre playlists</strong>
            <span>Automatische playlists per muziekgenre</span>
          </div>
          <div class="settings-row-control">
            ${c("discovery","genrePlaylists",!0)}
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
              value="${Number(v("discovery","maxTracks",50))}">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Serendipity factor</strong>
            <span>Hoe "verrassend" de aanbevelingen zijn (0% = alleen bekende artiesten, 100% = maximale ontdekking)</span>
          </div>
          <div class="settings-row-control">
            ${x("discovery","serendipity",{min:0,max:100,step:5,unit:"%",defaultVal:30})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${g("discovery")}</div>
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
  </div>`}function O(){let t=[{key:"notifNewRelease",label:"Nieuwe release",desc:"Artiest uit je bibliotheek heeft iets uitgebracht"},{key:"notifDownloadDone",label:"Download voltooid",desc:"Een album is succesvol gedownload"},{key:"notifLibraryScan",label:"Library scan klaar",desc:"Plex bibliotheek synchronisatie voltooid"},{key:"notifError",label:"Fout opgetreden",desc:"Download of service fout"}];return`
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
            ${m("notifications","discordWebhook",{placeholder:"https://discord.com/api/webhooks/...",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-discord-btn">Test Discord</button>
        ${g("notifications")}
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
            ${m("notifications","telegramToken",{placeholder:"123456:ABC-DEF...",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Chat ID</strong>
            <span>Je Telegram chat of groep ID</span>
          </div>
          <div class="settings-row-control">
            ${m("notifications","telegramChatId",{placeholder:"-1001234567890",cls:"settings-input-sm"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-telegram-btn">Test Telegram</button>
        ${g("notifications")}
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
            ${m("notifications","pushbulletKey",{placeholder:"o.xxxxxxxxxxxxxxxxxx",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-pushbullet-btn">Test Pushbullet</button>
        ${g("notifications")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Notificatie types</h3>
      <div class="settings-group">
        ${t.map(i=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${n(i.label)}</strong>
              <span>${n(i.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${c("notifications",i.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${g("notifications")}</div>
    </div>
  </div>`}function H(){return`
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
            ${b("onderhoud","logLevel",[{value:"trace",label:"Trace (meest detail)"},{value:"debug",label:"Debug"},{value:"info",label:"Info (standaard)"},{value:"warn",label:"Warn"},{value:"error",label:"Error"},{value:"fatal",label:"Fatal (minst detail)"}],"info")}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${g("onderhoud")}</div>
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
            ${b("onderhoud","backupInterval",[{value:"never",label:"Nooit"},{value:"daily",label:"Dagelijks"},{value:"weekly",label:"Wekelijks"},{value:"monthly",label:"Maandelijks"}],"weekly")}
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
      <div class="settings-save-row">${g("onderhoud")}</div>
    </div>
  </div>`}var $=[{id:"algemeen",label:"Algemeen",render:S},{id:"verbindingen",label:"Verbindingen",render:A},{id:"downloads",label:"Downloads",render:C},{id:"postprocess",label:"Post-Processing",render:I},{id:"discovery",label:"Discovery",render:B},{id:"automatisering",label:"Automatisering",render:j},{id:"notificaties",label:"Notificaties",render:O},{id:"onderhoud",label:"Onderhoud",render:H}];function M(t){let i={};return document.querySelectorAll(`[data-cat="${t}"]`).forEach(s=>{if(!s.dataset.key)return;let e=s.dataset.key;s.type==="checkbox"?i[e]=s.checked:s.type==="range"||s.type==="number"?i[e]=Number(s.value):i[e]=s.value}),i}async function k(){try{let i=(await u("/api/settings")).categories||{},s=0;for(let l of Object.values(i))s+=Object.keys(l).length;let e=l=>document.getElementById(l);e("db-settings-count")&&(e("db-settings-count").textContent=s);try{let l=await u("/api/downloads/history");e("db-downloads-count")&&Array.isArray(l)&&(e("db-downloads-count").textContent=l.length)}catch{e("db-downloads-count")&&(e("db-downloads-count").textContent="?")}try{let l=await u("/api/wishlist");e("db-wishlist-count")&&Array.isArray(l)&&(e("db-wishlist-count").textContent=l.length)}catch{e("db-wishlist-count")&&(e("db-wishlist-count").textContent="?")}e("db-cache-count")&&(e("db-cache-count").textContent="?")}catch(t){console.warn("DB stats failed:",t)}}async function P(t,i){let s=document.getElementById(t);s&&(s.innerHTML=r("loading"));try{let e=await u(i),l=e&&e.up!==!1;s&&(s.innerHTML=r(l?"ok":"error"))}catch{s&&(s.innerHTML=r("error"))}}function N(){let t=document.getElementById("source-priority-list");if(!t)return;let i=null;t.querySelectorAll(".settings-drag-item").forEach(s=>{s.addEventListener("dragstart",()=>{i=s,s.style.opacity="0.5"}),s.addEventListener("dragend",()=>{s.style.opacity="",i=null,t.querySelectorAll(".settings-drag-item").forEach(l=>l.classList.remove("drag-over"));let e=[...t.querySelectorAll(".settings-drag-item")].map(l=>l.dataset.source);u("/api/settings/downloads",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourcePriority:JSON.stringify(e)})}).catch(()=>{})}),s.addEventListener("dragover",e=>{if(e.preventDefault(),i&&i!==s){s.classList.add("drag-over");let l=s.getBoundingClientRect(),a=l.top+l.height/2;e.clientY<a?t.insertBefore(i,s):t.insertBefore(i,s.nextSibling)}}),s.addEventListener("dragleave",()=>s.classList.remove("drag-over")),s.addEventListener("drop",e=>e.preventDefault())})}function z(){let t=document.getElementById("decade-grid");t&&t.querySelectorAll(".settings-checkbox-pill").forEach(i=>{let s=i.querySelector("input");s&&(i.addEventListener("click",e=>{e.target!==s&&(s.checked=!s.checked)}),s.addEventListener("change",()=>{i.classList.toggle("checked",s.checked)}))})}function R(){let t=document.getElementById("settings-page");if(!t)return;t.querySelectorAll(".settings-tab-btn").forEach(a=>{a.addEventListener("click",()=>{f=a.dataset.tab,t.querySelectorAll(".settings-tab-btn").forEach(d=>d.classList.toggle("active",d===a)),t.querySelectorAll(".settings-panel").forEach(d=>d.classList.remove("active"));let o=document.getElementById(`tab-${f}`);o&&o.classList.add("active")})}),t.querySelectorAll(".settings-save-btn").forEach(a=>{a.addEventListener("click",async()=>{let o=a.dataset.cat;if(o){a.disabled=!0,a.textContent="Opslaan\u2026";try{let d=M(o);if(o==="discovery"){let L=[...document.querySelectorAll("#decade-grid .settings-checkbox-pill input:checked")].map(E=>E.value);d.activeDecades=JSON.stringify(L)}await D(o,d),h[o]={...h[o]||{},...d},p("\u2713 Instellingen opgeslagen")}catch(d){console.error("Save failed:",d),p("Opslaan mislukt: "+d.message,"error")}finally{a.disabled=!1,a.textContent="Opslaan"}}})}),t.querySelectorAll(".settings-slider").forEach(a=>{let o=document.getElementById(`${a.id}-val`);o&&a.addEventListener("input",()=>{o.textContent=a.value+(a.dataset.unit||"")})});let i=document.getElementById("stg-postprocess-lossyCopy"),s=document.getElementById("lossy-options");i&&s&&i.addEventListener("change",()=>{s.style.display=i.checked?"":"none"});let e=document.getElementById("stg-postprocess-deleteOriginal"),l=document.getElementById("blasphemy-warning");e&&l&&e.addEventListener("change",()=>{l.style.display=e.checked?"":"none"}),document.getElementById("test-plex-btn")?.addEventListener("click",()=>P("plex-status-dot","/api/plex/status")),document.getElementById("test-tidarr-btn")?.addEventListener("click",async()=>{let a=document.getElementById("tidarr-status-dot");a&&(a.innerHTML=r("loading"));try{let o=await u("/api/tidarr/status");a&&(a.innerHTML=r(o?.online?"ok":"error"))}catch{a&&(a.innerHTML=r("error"))}}),document.getElementById("test-orpheus-btn")?.addEventListener("click",async()=>{let a=document.getElementById("orpheus-status-dot");a&&(a.innerHTML=r("loading"));try{let o=await u("/api/orpheus/status");a&&(a.innerHTML=r(o?.online?"ok":"error"))}catch{a&&(a.innerHTML=r("error"))}}),document.getElementById("test-spotify-btn")?.addEventListener("click",async()=>{p("Spotify verbinding getest")}),document.getElementById("test-discord-btn")?.addEventListener("click",async()=>{let a=(document.getElementById("stg-notifications-discordWebhook")?.value||"").trim();if(!a)return p("Voer eerst een webhook URL in","error");try{await fetch(a,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:"\u{1F3B5} Muziekdashboard test notificatie"})}),p("\u2713 Discord test verstuurd")}catch{p("Discord test mislukt","error")}}),document.getElementById("test-telegram-btn")?.addEventListener("click",()=>p("Telegram test (nog niet ge\xEFmplementeerd)")),document.getElementById("test-pushbullet-btn")?.addEventListener("click",()=>p("Pushbullet test (nog niet ge\xEFmplementeerd)")),document.getElementById("clear-cache-btn")?.addEventListener("click",async()=>{if(confirm("Weet je zeker dat je de cache wilt leegmaken? De app is even langzamer totdat de cache opnieuw is gevuld."))try{await u("/api/cache/clear",{method:"POST"}),p("\u2713 Cache geleegd"),k()}catch{p("Cache leegmaken mislukt","error")}}),document.getElementById("refresh-db-stats-btn")?.addEventListener("click",k),N(),z()}async function q(){let t=document.getElementById("content");if(!t)return;t.innerHTML='<div style="padding:48px;text-align:center;color:var(--text-muted)">Instellingen laden\u2026</div>';try{await T()}catch(e){console.error("Settings load failed:",e)}let i=$.map(e=>`<button class="settings-tab-btn${e.id===f?" active":""}" data-tab="${n(e.id)}">${n(e.label)}</button>`).join(""),s=$.map(e=>e.render()).join(`
`);t.innerHTML=`
    <div class="settings-page" id="settings-page">
      <div class="settings-page-header">
        <h1 class="settings-page-title">Instellingen</h1>
        <p class="settings-page-subtitle">Pas het muziekdashboard aan naar jouw wensen</p>
      </div>
      <div class="settings-tabs">${i}</div>
      ${s}
    </div>`,document.title="Muziek \xB7 Instellingen",R(),f==="onderhoud"&&k()}export{q as loadSettings};
