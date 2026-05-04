import{h as r,x as g}from"./chunk-OJFTIB2W.js";import"./chunk-2BMKGNH5.js";var S={},u={},$="algemeen";function p(e,s="ok"){let t=document.getElementById("settings-toast");t||(t=document.createElement("div"),t.id="settings-toast",t.className="settings-toast",document.body.appendChild(t)),t.textContent=e,t.className=`settings-toast${s==="error"?" error":""}`,requestAnimationFrame(()=>{requestAnimationFrame(()=>t.classList.add("visible"))}),clearTimeout(t._timer),t._timer=setTimeout(()=>t.classList.remove("visible"),2800)}async function F(){let e=await g("/api/settings");S=e.categories||{},u=e.env||{}}async function W(e,s){await g(`/api/settings/${e}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)})}function y(e,s,t=""){return S[e]?.[s]??t}function v(e,s,t=!1){let n=y(e,s,t)===!0||y(e,s,t)==="true";return`
    <label class="settings-toggle" title="">
      <input type="checkbox" id="${`stg-${e}-${s}`}" data-cat="${r(e)}" data-key="${r(s)}" ${n?"checked":""}>
      <span class="settings-toggle-track"></span>
    </label>`}function h(e,s,t,n=""){let a=y(e,s,n),i=`stg-${e}-${s}`,l=t.map(o=>typeof o=="string"?`<option value="${r(o)}" ${a===o?"selected":""}>${r(o)}</option>`:`<option value="${r(o.value)}" ${a===o.value?"selected":""}>${r(o.label)}</option>`).join("");return`<select class="settings-select" id="${i}" data-cat="${r(e)}" data-key="${r(s)}">${l}</select>`}function k(e,s,t={}){let{type:n="text",placeholder:a="",readonly:i=!1,cls:l=""}=t,o=y(e,s,t.defaultVal??""),d=`stg-${e}-${s}`;return`<input
    class="settings-input ${l}"
    id="${d}"
    type="${r(n)}"
    placeholder="${r(a)}"
    value="${r(String(o))}"
    data-cat="${r(e)}"
    data-key="${r(s)}"
    ${i?"readonly":""}>`}function j(e,s,{min:t=0,max:n=100,step:a=1,unit:i="",defaultVal:l=50}={}){let o=Number(y(e,s,l)),d=`stg-${e}-${s}`;return`
    <div class="settings-slider-wrap">
      <input
        class="settings-slider"
        id="${d}"
        type="range"
        min="${t}" max="${n}" step="${a}"
        value="${o}"
        data-cat="${r(e)}"
        data-key="${r(s)}"
        data-unit="${r(i)}">
      <span class="settings-slider-value" id="${d}-val">${o}${i}</span>
    </div>`}function c(e){return`<span class="settings-status"><span class="settings-status-dot ${e==="ok"?"ok":e==="loading"?"loading":e==="error"?"error":"idle"}"></span>${e==="ok"?"Verbonden":e==="loading"?"Testen\u2026":e==="error"?"Niet bereikbaar":"Onbekend"}</span>`}function m(e){return`<button class="settings-btn settings-btn-primary settings-save-btn" data-cat="${r(e)}">Opslaan</button>`}function V(){let e=[{value:"home",label:"Home"},{value:"albums",label:"Albums"},{value:"artists",label:"Artists"},{value:"ontdek",label:"Ontdek"},{value:"nu",label:"Nu Bezig"},{value:"downloads",label:"Downloads"},{value:"releases",label:"Nieuwe Releases"},{value:"stats",label:"Statistieken"}];return`
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
        ${[{key:"showGenres",label:"Genres",desc:"Genre browser in de sidebar"},{key:"showRadio",label:"Live Radio",desc:"Live radio tab"},{key:"showHistory",label:"History",desc:"Afspeel-geschiedenis"},{key:"showStats",label:"Statistieken",desc:"Last.fm statistieken"},{key:"showComposers",label:"Componisten",desc:"Klassieke muziek componisten"},{key:"showFolders",label:"Folders",desc:"Bestandsmappen browser"},{key:"showTags",label:"Tags",desc:"Genre tags overzicht"},{key:"showMediaSage",label:"MediaSage AI",desc:"AI aanbevelingen tools"}].map(s=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${r(s.label)}</strong>
              <span>${r(s.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${v("sidebar",s.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${m("algemeen")}${m("sidebar")}</div>
    </div>
  </div>`}function G(){let e=u.lastfm||{},s=u.plex||{},t=u.spotify||{},n=u.tidarr||{},a=u.orpheus||{};return`
  <div class="settings-panel" id="tab-verbindingen">

    <div class="settings-card">
      <h3 class="settings-card-title">Last.fm</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong><span>Geconfigureerd in .env (read-only)</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${r(e.api_key||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Gebruikersnaam</strong><span>Last.fm account</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${r(e.username||"\u2014")}" readonly>
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


        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Primaire metadata-bron</strong>
            <span>Deze bron heeft voorrang op de artiest-detail pagina en de home-weergave</span>
          </div>
          <div class="settings-row-control">
            <select class="settings-input settings-input-sm" id="enr-primary-source">
              <option value="spotify">Spotify</option>
              <option value="itunes">iTunes / Apple Music</option>
              <option value="deezer">Deezer</option>
              <option value="discogs">Discogs</option>
              <option value="audiodb">TheAudioDB</option>
              <option value="musicbrainz">MusicBrainz</option>
              <option value="lastfm">Last.fm</option>
            </select>
          </div>
        </div>

      <h4 style="font-size:var(--text-sm);font-weight:600;color:var(--text-secondary);margin:var(--space-4) 0 var(--space-3);">Workers in-/uitschakelen</h4>
      <div class="settings-group">
        ${["itunes","discogs","audiodb","genius","tidal","qobuz","spotify","musicbrainz","lastfm","deezer"].map(i=>`
        <div class="settings-row">
          <div class="settings-row-label"><strong>${r({itunes:"iTunes / Apple Music",discogs:"Discogs",audiodb:"TheAudioDB",genius:"Genius",tidal:"Tidal",qobuz:"Qobuz",spotify:"Spotify",musicbrainz:"MusicBrainz",lastfm:"Last.fm",deezer:"Deezer"}[i]||i)}</strong></div>
          <div class="settings-row-control">
            <label class="settings-toggle">
              <input type="checkbox" class="enr-worker-toggle" data-source="${r(i)}" checked>
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
            <input class="settings-input" type="url" value="${r(s.url||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Token</strong><span>Plex authenticatie token</span></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${r(s.token||"\u2014")}" readonly>
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
            <input class="settings-input settings-input-sm" type="text" value="${r(t.client_id||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Client Secret</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="password" value="${t.client_secret?"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022":"\u2014"}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Status</strong></div>
          <div class="settings-row-control">
            ${t.configured?c("ok"):c("error")}
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
            <input class="settings-input" type="url" value="${r(n.url||"http://localhost:8484")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${r(n.api_key||"\u2014")}" readonly>
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
            <input class="settings-input" type="url" value="${r(a.url||"http://localhost:5000")}" readonly>
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
            ${r(i)}
          </div>`).join("")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Soulseek (slskd)</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label"><strong>URL</strong><span>slskd instance adres</span></div>
          <div class="settings-row-control">
            <input class="settings-input" type="url" value="${r(u.slskd&&u.slskd.url||"http://localhost:5030")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>API Key</strong></div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-sm" type="text" value="${r(u.slskd&&u.slskd.api_key||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="slskd-status-dot">${c("idle")}</span>
            <button class="settings-btn settings-btn-secondary" id="test-slskd-btn">Test</button>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">HiFi</h3>
      <div class="settings-group">
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Instances</strong>
            <span>Komma-gescheiden lijst van publieke HiFi API URL's (via HIFI_INSTANCES in .env)</span>
          </div>
          <div class="settings-row-control">
            <input class="settings-input settings-input-full" type="text"
              value="${r(u.hifi&&u.hifi.instances||"\u2014")}" readonly>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label"><strong>Verbindingsstatus</strong></div>
          <div class="settings-row-control">
            <span id="hifi-status-dot">${c("idle")}</span>
            <button class="settings-btn settings-btn-secondary" id="test-hifi-btn">Test</button>
          </div>
        </div>
      </div>
    </div>
  </div>`}function U(){let e=(()=>{try{let n=y("downloads","sourcePriority",null);return n?JSON.parse(n):["tidarr","soulseek","hifi","orpheus"]}catch{return["tidarr","soulseek","hifi","orpheus"]}})(),t=[...[{id:"tidarr",label:"Tidarr",badge:"Tidal"},{id:"soulseek",label:"Soulseek",badge:"slskd"},{id:"hifi",label:"HiFi",badge:"Lossless"},{id:"orpheus",label:"OrpheusDL",badge:"9 platforms"}]].sort((n,a)=>{let i=e.indexOf(n.id),l=e.indexOf(a.id);return(i===-1?99:i)-(l===-1?99:l)});return`
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
            ${k("downloads","downloadPath",{placeholder:"/music",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Mapstructuur</strong>
            <span>Template voor mapindeling van downloads</span>
          </div>
          <div class="settings-row-control" style="flex-direction:column;align-items:flex-start;gap:8px;">
            ${k("downloads","folderTemplate",{placeholder:"$albumartist/$year - $album",defaultVal:"$albumartist/$year - $album",cls:"settings-input-full"})}
            <div class="settings-var-ref">
              ${["$albumartist","$artist","$album","$title","$track","$year","$genre","$quality"].map(n=>`<span class="settings-var-chip">${n}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="settings-save-row">${m("downloads")}</div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Download-bron prioriteit</h3>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin:0 0 var(--space-4)">
        Sleep de bronnen in de gewenste volgorde. Hogere positie = hogere prioriteit.
      </p>
      <ul class="settings-drag-list" id="source-priority-list">
        ${t.map(n=>{let a=y("downloads",`${n.id}Enabled`,!0)!==!1;return`
          <li class="settings-drag-item" draggable="true" data-source="${r(n.id)}">
            <span class="settings-drag-handle">\u283F</span>
            <span class="settings-drag-item-label">${r(n.label)}</span>
            <span class="settings-drag-item-badge">${r(n.badge)}</span>
            <label class="settings-toggle" style="margin-left:auto">
              <input type="checkbox" class="source-enabled-toggle" data-source="${r(n.id)}" ${a?"checked":""}>
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
          ${v("downloads","hybridMode",!0)}
        </div>
      </div>

      <div class="settings-save-row">${m("downloads")}</div>
    </div>
  </div>`}function J(){let e=y("postprocess","lossyCopy",!1)===!0||y("postprocess","lossyCopy",!1)==="true";return`
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
            ${v("postprocess","lossyCopy",!1)}
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
              ${j("postprocess","lossyBitrate",{min:128,max:320,step:64,unit:"kbps",defaultVal:320})}
            </div>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Hi-Res downsampling</strong>
            <span>Converteer 24-bit \u2192 16-bit / 44.1kHz voor compatibiliteit</span>
          </div>
          <div class="settings-row-control">
            ${v("postprocess","hiresDownsample",!1)}
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
            ${v("postprocess","replaygain",!1)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Synchronized lyrics (LRC)</strong>
            <span>Download tijdgestempelde songteksten indien beschikbaar</span>
          </div>
          <div class="settings-row-control">
            ${v("postprocess","syncedLyrics",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Album consistentie check</strong>
            <span>Waarschuw als tracks van een album ontbreken of metadata verschilt</span>
          </div>
          <div class="settings-row-control">
            ${v("postprocess","albumConsistency",!0)}
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
            ${v("postprocess","deleteOriginal",!1)}
          </div>
        </div>
      </div>
      <div class="settings-warning" id="blasphemy-warning" style="${y("postprocess","deleteOriginal",!1)?"":"display:none"}">
        <span class="settings-warning-icon">\u26A0\uFE0F</span>
        <span class="settings-warning-text">
          <strong>Let op!</strong> Het originele lossless bestand wordt permanent verwijderd na conversie.
          Dit is onomkeerbaar. Zorg dat je een backup hebt.
        </span>
      </div>
      <div class="settings-save-row">${m("postprocess")}</div>
    </div>
  </div>`}function K(){let e=["1960s","1970s","1980s","1990s","2000s","2010s","2020s"],s=(()=>{try{let n=y("discovery","activeDecades",null);return n?JSON.parse(n):["1990s","2000s","2010s","2020s"]}catch{return["1990s","2000s","2010s","2020s"]}})(),t=[{value:"1",label:"Maandag"},{value:"2",label:"Dinsdag"},{value:"3",label:"Woensdag"},{value:"4",label:"Donderdag"},{value:"5",label:"Vrijdag"},{value:"6",label:"Zaterdag"},{value:"0",label:"Zondag"}];return`
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
            ${v("discovery","weeklyEnabled",!0)}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Dag van de week</strong>
            <span>Wanneer wordt de lijst vernieuwd</span>
          </div>
          <div class="settings-row-control">
            ${h("discovery","weeklyDay",t,"1")}
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
            ${v("discovery","radarEnabled",!0)}
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
            ${v("discovery","seasonalPlaylists",!0)}
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
          ${e.map(n=>{let a=s.includes(n);return`<label class="settings-checkbox-pill${a?" checked":""}" data-decade="${r(n)}">
              <input type="checkbox" ${a?"checked":""} value="${r(n)}">
              ${r(n)}
            </label>`}).join("")}
        </div>

        <div class="settings-row" style="margin-top:var(--space-3)">
          <div class="settings-row-label">
            <strong>Genre playlists</strong>
            <span>Automatische playlists per muziekgenre</span>
          </div>
          <div class="settings-row-control">
            ${v("discovery","genrePlaylists",!0)}
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
              value="${Number(y("discovery","maxTracks",50))}">
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Serendipity factor</strong>
            <span>Hoe "verrassend" de aanbevelingen zijn (0% = alleen bekende artiesten, 100% = maximale ontdekking)</span>
          </div>
          <div class="settings-row-control">
            ${j("discovery","serendipity",{min:0,max:100,step:5,unit:"%",defaultVal:30})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">${m("discovery")}</div>
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
            ${k("notifications","discordWebhook",{placeholder:"https://discord.com/api/webhooks/...",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-discord-btn">Test Discord</button>
        ${m("notifications")}
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
            ${k("notifications","telegramToken",{placeholder:"123456:ABC-DEF...",cls:"settings-input-full"})}
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row-label">
            <strong>Chat ID</strong>
            <span>Je Telegram chat of groep ID</span>
          </div>
          <div class="settings-row-control">
            ${k("notifications","telegramChatId",{placeholder:"-1001234567890",cls:"settings-input-sm"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-telegram-btn">Test Telegram</button>
        ${m("notifications")}
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
            ${k("notifications","pushbulletKey",{placeholder:"o.xxxxxxxxxxxxxxxxxx",cls:"settings-input-full"})}
          </div>
        </div>
      </div>
      <div class="settings-save-row">
        <button class="settings-btn settings-btn-secondary" id="test-pushbullet-btn">Test Pushbullet</button>
        ${m("notifications")}
      </div>
    </div>

    <div class="settings-card">
      <h3 class="settings-card-title">Notificatie types</h3>
      <div class="settings-group">
        ${e.map(s=>`
          <div class="settings-row">
            <div class="settings-row-label">
              <strong>${r(s.label)}</strong>
              <span>${r(s.desc)}</span>
            </div>
            <div class="settings-row-control">
              ${v("notifications",s.key,!0)}
            </div>
          </div>`).join("")}
      </div>
      <div class="settings-save-row">${m("notifications")}</div>
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
      <div class="settings-save-row">${m("onderhoud")}</div>
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
      <div class="settings-save-row">${m("onderhoud")}</div>
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
  </div>`}var N=[{id:"algemeen",label:"Algemeen",render:V},{id:"verbindingen",label:"Verbindingen",render:G},{id:"downloads",label:"Downloads",render:U},{id:"postprocess",label:"Post-Processing",render:J},{id:"discovery",label:"Discovery",render:K},{id:"automatisering",label:"Automatisering",render:Z},{id:"notificaties",label:"Notificaties",render:Q},{id:"onderhoud",label:"Onderhoud",render:Y},{id:"logs",label:"\u{1F4CB} Logs",render:X}];function ee(e){let s={};return document.querySelectorAll(`[data-cat="${e}"]`).forEach(t=>{if(!t.dataset.key)return;let n=t.dataset.key;t.type==="checkbox"?s[n]=t.checked:t.type==="range"||t.type==="number"?s[n]=Number(t.value):s[n]=t.value}),s}async function A(){try{let s=(await g("/api/settings")).categories||{},t=0;for(let a of Object.values(s))t+=Object.keys(a).length;let n=a=>document.getElementById(a);n("db-settings-count")&&(n("db-settings-count").textContent=t);try{let a=await g("/api/downloads/history");n("db-downloads-count")&&Array.isArray(a)&&(n("db-downloads-count").textContent=a.length)}catch{n("db-downloads-count")&&(n("db-downloads-count").textContent="?")}try{let a=await g("/api/wishlist");n("db-wishlist-count")&&Array.isArray(a)&&(n("db-wishlist-count").textContent=a.length)}catch{n("db-wishlist-count")&&(n("db-wishlist-count").textContent="?")}n("db-cache-count")&&(n("db-cache-count").textContent="?")}catch(e){console.warn("DB stats failed:",e)}}async function se(e,s){let t=document.getElementById(e);t&&(t.innerHTML=c("loading"));try{let n=await g(s),a=n&&n.up!==!1;t&&(t.innerHTML=c(a?"ok":"error"))}catch{t&&(t.innerHTML=c("error"))}}function te(){let e=document.getElementById("source-priority-list");if(!e)return;let s=null;e.querySelectorAll(".settings-drag-item").forEach(t=>{t.addEventListener("dragstart",()=>{s=t,t.style.opacity="0.5"}),t.addEventListener("dragend",()=>{t.style.opacity="",s=null,e.querySelectorAll(".settings-drag-item").forEach(a=>a.classList.remove("drag-over"));let n=[...e.querySelectorAll(".settings-drag-item")].map(a=>a.dataset.source);g("/api/settings/downloads",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourcePriority:JSON.stringify(n)})}).catch(()=>{})}),t.addEventListener("dragover",n=>{if(n.preventDefault(),s&&s!==t){t.classList.add("drag-over");let a=t.getBoundingClientRect(),i=a.top+a.height/2;n.clientY<i?e.insertBefore(s,t):e.insertBefore(s,t.nextSibling)}}),t.addEventListener("dragleave",()=>t.classList.remove("drag-over")),t.addEventListener("drop",n=>n.preventDefault())})}function ne(){let e=document.getElementById("decade-grid");e&&e.querySelectorAll(".settings-checkbox-pill").forEach(s=>{let t=s.querySelector("input");t&&(s.addEventListener("click",n=>{n.target!==t&&(t.checked=!t.checked)}),t.addEventListener("change",()=>{s.classList.toggle("checked",t.checked)}))})}var ie={all:0,trace:10,debug:20,info:30,warn:40,error:50,fatal:60},ae={10:"TRACE",20:"DEBUG",30:"INFO",40:"WARN",50:"ERROR",60:"FATAL"},le={10:"#6c7086",20:"#6c7086",30:"#89b4fa",40:"#f9e2af",50:"#f38ba8",60:"#f38ba8"},f=[],b=null,B=null,E=1e3,L={level:"info",search:""},D=!0,I=!1;function z(e){let s=e.level||30,t=ae[s]||String(s),n=le[s]||"#a6adc8",a=s>=60,i="";if(e.time){let T=new Date(typeof e.time=="number"&&e.time<1e12?e.time*1e3:e.time);if(!isNaN(T)){i=T.toLocaleTimeString("nl-NL",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit"});let R=String(T.getMilliseconds()).padStart(3,"0");i+=`.${R}`}}let l=r(e.msg||""),o=e.service?r(e.service):"",{time:d,level:w,msg:O,service:pe,pid:be,hostname:me,environment:ye,...H}=e,M=Object.keys(H).length>0,q=M?r(JSON.stringify(H,null,2)):"";return`<div class="log-entry log-entry--${t.toLowerCase()}${a?" log-entry--fatal":""}" data-level="${s}"><span class="log-ts">${i}</span><span class="log-level" style="color:${n}">${t}</span>`+(o?`<span class="log-service">${o}</span>`:"")+`<span class="log-msg">${l}</span>`+(M?`<button class="log-expand-btn" aria-label="Details tonen">\u203A</button><pre class="log-extra" style="display:none">${q}</pre>`:"")+"</div>"}function P(e){let s=ie[L.level]||0;return!(s>0&&(e.level||30)<s||L.search&&!((e.msg||"")+JSON.stringify(e)).toLowerCase().includes(L.search))}function C(){let e=document.getElementById("log-entries");if(!e)return;let s=f.filter(P).slice(-500);if(s.length===0){e.innerHTML='<div class="log-empty"><div class="log-empty-icon">\u{1F50D}</div><span>Geen logs gevonden</span></div>';return}if(e.innerHTML=s.map(z).join(""),oe(e),D){let t=document.getElementById("log-terminal");t&&(t.scrollTop=t.scrollHeight)}}function oe(e){e.querySelectorAll(".log-expand-btn").forEach(s=>{s.addEventListener("click",()=>{let t=s.nextElementSibling;if(!t)return;let n=t.style.display!=="none";t.style.display=n?"none":"block",s.textContent=n?"\u203A":"\u2304"})})}function re(e){if(f.push(e),f.length>1e3&&f.shift(),!P(e))return;let s=document.getElementById("log-entries");if(!s)return;let t=s.querySelector(".log-empty");for(t&&t.remove();s.children.length>=500;)s.removeChild(s.firstChild);let n=document.createElement("div");n.innerHTML=z(e);let a=n.firstElementChild;a&&(a.querySelector(".log-expand-btn")?.addEventListener("click",()=>{let i=a.querySelector(".log-extra"),l=a.querySelector(".log-expand-btn");if(!i||!l)return;let o=i.style.display!=="none";i.style.display=o?"none":"block",l.textContent=o?"\u203A":"\u2304"}),s.appendChild(a),D&&!I&&(I=!0,requestAnimationFrame(()=>{I=!1;let i=document.getElementById("log-terminal");i&&(i.scrollTop=i.scrollHeight)})))}function x(e,s){let t=document.getElementById("log-ws-status");t&&(t.textContent=e,t.title=s)}function _(){if(b&&(b.readyState===WebSocket.OPEN||b.readyState===WebSocket.CONNECTING))return;let s=`${location.protocol==="https:"?"wss:":"ws:"}//${location.host}/logs`;x("\u{1F504}","Verbinding maken\u2026");try{b=new WebSocket(s)}catch(t){x("\u{1F534}",`Kon niet verbinden: ${t.message}`);return}b.addEventListener("open",()=>{E=1e3,x("\u{1F7E2}","Live verbonden")}),b.addEventListener("message",t=>{try{let n=JSON.parse(t.data);if(n._bulk){for(let a of n.entries||[])f.push(a),f.length>1e3&&f.shift();C()}else n.type!=="pong"&&re(n)}catch{}}),b.addEventListener("close",()=>{x("\u{1F534}",`Verbroken \u2013 herverbinden in ${Math.round(E/1e3)}s`),clearTimeout(B),B=setTimeout(()=>{E=Math.min(E*2,3e4),_()},E)}),b.addEventListener("error",()=>{x("\u26A0\uFE0F","Verbindingsfout")})}function de(){clearTimeout(B),b&&(b.onclose=null,b.close(),b=null)}function ce(){document.getElementById("log-level-filter")?.addEventListener("change",s=>{L.level=s.target.value,C()});let e=null;document.getElementById("log-search")?.addEventListener("input",s=>{clearTimeout(e),e=setTimeout(()=>{L.search=s.target.value.toLowerCase(),C()},200)}),document.getElementById("log-autoscroll")?.addEventListener("change",s=>{D=s.target.checked}),document.getElementById("log-clear-btn")?.addEventListener("click",()=>{f=[];let s=document.getElementById("log-entries");s&&(s.innerHTML='<div class="log-empty"><div class="log-empty-icon">\u{1F5D1}\uFE0F</div><span>Logs gewist</span></div>')}),document.getElementById("log-copy-btn")?.addEventListener("click",()=>{let s=f.map(t=>JSON.stringify(t)).join(`
`);navigator.clipboard?.writeText(s).then(()=>p("\u2713 Logs gekopieerd")).catch(()=>p("Kopi\xEBren mislukt","error"))}),$==="logs"&&_()}function ge(){let e=document.getElementById("settings-page");if(!e)return;e.querySelectorAll(".settings-tab-btn").forEach(i=>{i.addEventListener("click",()=>{$=i.dataset.tab,e.querySelectorAll(".settings-tab-btn").forEach(o=>o.classList.toggle("active",o===i)),e.querySelectorAll(".settings-panel").forEach(o=>o.classList.remove("active"));let l=document.getElementById(`tab-${$}`);l&&l.classList.add("active"),$==="logs"&&_()})}),e.querySelectorAll(".settings-save-btn").forEach(i=>{i.addEventListener("click",async()=>{let l=i.dataset.cat;if(l){i.disabled=!0,i.textContent="Opslaan\u2026";try{let o=ee(l);if(l==="discovery"){let w=[...document.querySelectorAll("#decade-grid .settings-checkbox-pill input:checked")].map(O=>O.value);o.activeDecades=JSON.stringify(w)}await W(l,o),S[l]={...S[l]||{},...o},p("\u2713 Instellingen opgeslagen")}catch(o){console.error("Save failed:",o),p("Opslaan mislukt: "+o.message,"error")}finally{i.disabled=!1,i.textContent="Opslaan"}}})}),e.querySelectorAll(".settings-slider").forEach(i=>{let l=document.getElementById(`${i.id}-val`);l&&i.addEventListener("input",()=>{l.textContent=i.value+(i.dataset.unit||"")})});let s=document.getElementById("stg-postprocess-lossyCopy"),t=document.getElementById("lossy-options");s&&t&&s.addEventListener("change",()=>{t.style.display=s.checked?"":"none"});let n=document.getElementById("stg-postprocess-deleteOriginal"),a=document.getElementById("blasphemy-warning");n&&a&&n.addEventListener("change",()=>{a.style.display=n.checked?"":"none"}),document.getElementById("test-plex-btn")?.addEventListener("click",()=>se("plex-status-dot","/api/plex/status")),document.getElementById("test-tidarr-btn")?.addEventListener("click",async()=>{let i=document.getElementById("tidarr-status-dot");i&&(i.innerHTML=c("loading"));try{let l=await g("/api/tidarr/status");i&&(i.innerHTML=c(l?.online?"ok":"error"))}catch{i&&(i.innerHTML=c("error"))}}),document.getElementById("test-orpheus-btn")?.addEventListener("click",async()=>{let i=document.getElementById("orpheus-status-dot");i&&(i.innerHTML=c("loading"));try{let l=await g("/api/orpheus/status");i&&(i.innerHTML=c(l?.online?"ok":"error"))}catch{i&&(i.innerHTML=c("error"))}}),document.getElementById("test-slskd-btn")?.addEventListener("click",async()=>{let i=document.getElementById("slskd-status-dot");i&&(i.innerHTML=c("loading"));try{let o=((await g("/api/core/download/status"))?.sources||[]).find(d=>d.name==="soulseek");i&&(i.innerHTML=c(o?.available?"ok":"error"))}catch{i&&(i.innerHTML=c("error"))}}),document.getElementById("test-hifi-btn")?.addEventListener("click",async()=>{let i=document.getElementById("hifi-status-dot");i&&(i.innerHTML=c("loading"));try{let o=((await g("/api/core/download/status"))?.sources||[]).find(d=>d.name==="hifi");i&&(i.innerHTML=c(o?.available?"ok":"error"))}catch{i&&(i.innerHTML=c("error"))}}),document.getElementById("test-spotify-btn")?.addEventListener("click",async()=>{p("Spotify verbinding getest")}),document.getElementById("test-discord-btn")?.addEventListener("click",async()=>{let i=(document.getElementById("stg-notifications-discordWebhook")?.value||"").trim();if(!i)return p("Voer eerst een webhook URL in","error");try{await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:"\u{1F3B5} Muziekdashboard test notificatie"})}),p("\u2713 Discord test verstuurd")}catch{p("Discord test mislukt","error")}}),document.getElementById("test-telegram-btn")?.addEventListener("click",()=>p("Telegram test (nog niet ge\xEFmplementeerd)")),document.getElementById("test-pushbullet-btn")?.addEventListener("click",()=>p("Pushbullet test (nog niet ge\xEFmplementeerd)")),document.getElementById("clear-cache-btn")?.addEventListener("click",async()=>{if(confirm("Weet je zeker dat je de cache wilt leegmaken? De app is even langzamer totdat de cache opnieuw is gevuld."))try{await g("/api/cache/clear",{method:"POST"}),p("\u2713 Cache geleegd"),A()}catch{p("Cache leegmaken mislukt","error")}}),document.getElementById("refresh-db-stats-btn")?.addEventListener("click",A),ve(),te(),ne(),ce()}async function ve(){try{let e=await fetch("/api/core/enrichment/settings");if(!e.ok)return;let s=await e.json(),t=document.getElementById("enr-genius-key");t&&s.genius_api_key&&(t.placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");let n=document.getElementById("enr-discogs-token");n&&s.discogs_token&&(n.placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");let a=document.getElementById("enr-discogs-ua");a&&s.discogs_user_agent&&(a.value=s.discogs_user_agent);let i=document.getElementById("enr-genre-filter");i&&(i.checked=!!s.genre_filter_enabled);let l=document.getElementById("enr-primary-source");l&&s.primary_source&&(l.value=s.primary_source),document.querySelectorAll(".enr-worker-toggle").forEach(o=>{let w=`worker_${o.dataset.source}_enabled`;o.checked=s[w]!==!1})}catch(e){console.warn("Enrichment settings load failed:",e)}document.getElementById("save-enrichment-settings")?.addEventListener("click",async()=>{let e=document.getElementById("enrichment-settings-msg");e&&(e.textContent="Opslaan\u2026");let s={},t=document.getElementById("enr-genius-key"),n=document.getElementById("enr-discogs-token"),a=document.getElementById("enr-discogs-ua"),i=document.getElementById("enr-genre-filter");t?.value.trim()&&(s.genius_api_key=t.value.trim()),n?.value.trim()&&(s.discogs_token=n.value.trim()),a?.value.trim()&&(s.discogs_user_agent=a.value.trim()),i&&(s.genre_filter_enabled=i.checked);let l=document.getElementById("enr-primary-source");l?.value&&(s.primary_source=l.value),document.querySelectorAll(".enr-worker-toggle").forEach(o=>{s[`worker_${o.dataset.source}_enabled`]=o.checked});try{let o=await fetch("/api/core/enrichment/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});if(!o.ok)throw new Error(`HTTP ${o.status}`);e&&(e.textContent="\u2713 Opgeslagen!",setTimeout(()=>{e&&(e.textContent="")},3e3))}catch(o){e&&(e.textContent=`Fout: ${o.message}`)}}),document.getElementById("enr-manage-genres")?.addEventListener("click",()=>ue())}async function ue(){try{let t=(await(await fetch("/api/core/enrichment/genres")).json()).genres||[],n=document.getElementById("enrichment-settings-card");if(!n)return;document.getElementById("enr-genre-panel")?.remove();let a=document.createElement("div");a.id="enr-genre-panel",a.style.cssText="margin-top:16px;padding:14px;background:var(--color-bg2,rgba(128,128,128,.08));border-radius:8px;";let i="enr-genre-search-"+Date.now();a.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:13px;">Genre Whitelist (${t.length} genres)</strong>
        <button id="enr-genre-panel-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:var(--color-muted)">\u2715</button>
      </div>
      <input id="${i}" type="search" placeholder="Zoek genre\u2026" style="width:100%;font-size:12px;padding:5px 8px;border:1px solid var(--color-border,rgba(128,128,128,.2));border-radius:4px;background:var(--color-bg);color:var(--color-text);margin-bottom:8px;">
      <div id="enr-genre-list" style="max-height:220px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px;">
        ${t.map(l=>`
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
      <div id="enr-genre-msg" style="font-size:11px;margin-top:6px;color:var(--color-accent)"></div>`,n.appendChild(a),a.scrollIntoView({behavior:"smooth",block:"nearest"}),a.querySelector("#enr-genre-panel-close")?.addEventListener("click",()=>a.remove()),a.querySelector(`#${i}`)?.addEventListener("input",l=>{let o=l.target.value.toLowerCase();a.querySelectorAll(".enr-genre-check").forEach(d=>{let w=d.closest("label");w&&(w.style.display=d.dataset.genre.includes(o)?"":"none")})}),a.querySelectorAll(".enr-genre-check").forEach(l=>{l.addEventListener("change",()=>{let o=l.closest("label");o&&(o.style.background=l.checked?"var(--color-accent,#1a73e8)":"var(--color-bg2,rgba(128,128,128,.12))",o.style.color=l.checked?"#fff":"var(--color-text)")})}),a.querySelector("#enr-genre-select-all")?.addEventListener("click",()=>{a.querySelectorAll(".enr-genre-check").forEach(l=>{l.checked=!0,l.dispatchEvent(new Event("change"))})}),a.querySelector("#enr-genre-deselect-all")?.addEventListener("click",()=>{a.querySelectorAll(".enr-genre-check").forEach(l=>{l.checked=!1,l.dispatchEvent(new Event("change"))})}),a.querySelector("#enr-genre-save")?.addEventListener("click",async()=>{let l=a.querySelector("#enr-genre-msg");l&&(l.textContent="Opslaan\u2026");let o=[];a.querySelectorAll(".enr-genre-check").forEach(d=>{o.push({genre:d.dataset.genre,enabled:d.checked})});try{let d=await fetch("/api/core/enrichment/genres",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({genres:o})});if(!d.ok)throw new Error(`HTTP ${d.status}`);l&&(l.textContent=`\u2713 ${o.length} genres opgeslagen`)}catch(d){l&&(l.textContent=`Fout: ${d.message}`)}})}catch(e){console.warn("Genre whitelist load failed:",e)}}async function we(){let e=document.getElementById("content");if(!e)return;de(),e.innerHTML='<div style="padding:48px;text-align:center;color:var(--text-muted)">Instellingen laden\u2026</div>';try{await F()}catch(n){console.error("Settings load failed:",n)}let s=N.map(n=>`<button class="settings-tab-btn${n.id===$?" active":""}" data-tab="${r(n.id)}">${r(n.label)}</button>`).join(""),t=N.map(n=>n.render()).join(`
`);e.innerHTML=`
    <div class="settings-page" id="settings-page">
      <div class="settings-page-header">
        <h1 class="settings-page-title">Instellingen</h1>
        <p class="settings-page-subtitle">Pas het muziekdashboard aan naar jouw wensen</p>
      </div>
      <div class="settings-tabs">${s}</div>
      ${t}
    </div>`,document.title="Muziek \xB7 Instellingen",ge(),$==="onderhoud"&&A()}export{we as loadSettings};
