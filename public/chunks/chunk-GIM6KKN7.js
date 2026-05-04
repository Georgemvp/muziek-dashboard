import{a as k}from"./chunk-JVAXILKZ.js";import{C as L,D as S,h as b,x as g}from"./chunk-OJFTIB2W.js";import{a as u}from"./chunk-2BMKGNH5.js";var E=document.querySelector(".app-shell"),G=document.getElementById("sidebar"),A=document.getElementById("sidebar-toggle");function $(){let e=document.getElementById("sidebar-overlay");return e||(e=document.createElement("button"),e.id="sidebar-overlay",e.className="sidebar-overlay",e.setAttribute("aria-label","Sluit zijbalk"),document.body.appendChild(e),e)}var I=$();function v(e){E&&(E.classList.toggle("sidebar-open",e),A?.setAttribute("aria-expanded",e?"true":"false"),I.classList.toggle("visible",e))}function J(){v(!1),A?.addEventListener("click",()=>{let e=E?.classList.contains("sidebar-open");v(!e)}),I.addEventListener("click",()=>v(!1)),document.querySelectorAll(".nav-item[data-view]").forEach(e=>{e.addEventListener("click",()=>v(!1))}),document.addEventListener("sidebar:close",()=>v(!1)),document.querySelectorAll(".sidebar-collapse-toggle").forEach(e=>{let t=e.getAttribute("aria-controls");localStorage.getItem(`sidebar-group-${t}`)==="open"&&e.setAttribute("aria-expanded","true"),e.addEventListener("click",s=>{s.stopPropagation();let l=e.getAttribute("aria-expanded")==="true";e.setAttribute("aria-expanded",l?"false":"true"),localStorage.setItem(`sidebar-group-${t}`,l?"closed":"open")})}),O(),D().catch(e=>{console.error("Failed to load sidebar playlists:",e)})}var q=[{id:"all",label:"All",color:"#888"},{id:"tidal",label:"Tidal",color:"#33ffe7"},{id:"qobuz",label:"Qobuz",color:"#0070ef"},{id:"deezer",label:"Deezer",color:"#a238ff"},{id:"spotify",label:"Spotify",color:"#1cc659"},{id:"soundcloud",label:"SoundCloud",color:"#ff5502"},{id:"applemusic",label:"Apple Music",color:"#FA586A"},{id:"beatport",label:"Beatport",color:"#00ff89"},{id:"beatsource",label:"Beatsource",color:"#16a8f4"},{id:"youtube",label:"YouTube",color:"#FF0000"}];function O(){let e=document.getElementById("sidebar");if(!e)return;let t=localStorage.getItem("downloadEngine")||"tidarr",n=localStorage.getItem("orpheusPlatform")||"all";u.downloadEngine=t,u.orpheusPlatform=n;let s=document.createElement("div");s.className="sidebar-settings-panel",s.id="sidebar-settings-panel",s.setAttribute("aria-hidden","true"),s.innerHTML=`
    <div class="ssp-header">
      <span class="ssp-title">Instellingen</span>
      <button class="ssp-close-btn" aria-label="Instellingen sluiten">\u2715</button>
    </div>

    <div class="ssp-group">
      <div class="ssp-group-label">Download engine</div>
      <div class="ssp-engine-toggle">
        <button class="ssp-engine-btn${t==="tidarr"?" active":""}" data-engine="tidarr">
          <span class="ssp-status-dot" id="dot-tidarr"></span>Tidarr
        </button>
        <button class="ssp-engine-btn${t==="orpheus"?" active":""}" data-engine="orpheus">
          <span class="ssp-status-dot" id="dot-orpheus"></span>OrpheusDL
        </button>
      </div>
    </div>

    <div class="ssp-group" id="ssp-orpheus-config-group" style="${t==="orpheus"?"":"display:none"}">
      <button class="ssp-orpheus-settings-btn" id="ssp-orpheus-settings-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
        </svg>
        OrpheusDL Instellingen
      </button>
    </div>

    <div class="ssp-group" id="ssp-platform-group" style="${t==="orpheus"?"":"display:none"}">
      <div class="ssp-group-label">Zoekplatform</div>
      <div class="ssp-pills" id="ssp-platform-pills">
        ${q.map(l=>`
          <button class="ssp-pill${n===l.id?" active":""}"
                  data-platform="${l.id}"
                  style="${l.id!=="all"?`--platform-color:${l.color}`:""}">
            ${l.id!=="all"?`<span class="ssp-pill-dot" style="background:${l.color}"></span>`:""}
            ${l.label}
          </button>`).join("")}
      </div>
      <div class="ssp-platform-list" id="ssp-platform-list">
        <div class="ssp-loading-text">Platforms laden\u2026</div>
      </div>
    </div>

    <div class="ssp-group" id="ssp-dl-priority-group">
      <div class="ssp-group-label">Download-bron prioriteit</div>
      <div class="dl-hybrid-row">
        <div>
          <div>Fallback modus</div>
          <div class="dl-hybrid-desc">Probeer volgende bron bij falen</div>
        </div>
        <input type="checkbox" class="dl-priority-toggle" id="dl-hybrid-toggle" checked>
      </div>
      <div class="dl-priority-list" id="dl-priority-list">
        <div class="ssp-loading-text">Prioriteiten laden\u2026</div>
      </div>
      <div class="dl-settings-save-bar">
        <button class="tool-btn" id="dl-priority-save-btn" type="button">Opslaan</button>
        <span class="dl-settings-saved" id="dl-priority-saved">\u2713 Opgeslagen</span>
      </div>
    </div>

    <div class="ssp-group" id="ssp-scrobbling-group">
      <div class="ssp-group-label">Scrobbling</div>

      <div class="ssp-scrobble-section">
        <div class="ssp-scrobble-header">
          <span class="ssp-scrobble-service-label">
            <span class="ssp-status-dot" id="dot-lastfm"></span>Last.fm
          </span>
          <label class="ssp-toggle-label">
            <input type="checkbox" id="ssp-lastfm-enabled" class="ssp-toggle-cb">
            <span class="ssp-toggle-track"></span>
          </label>
        </div>
        <div class="ssp-scrobble-body" id="ssp-lastfm-body">
          <div class="ssp-scrobble-status" id="ssp-lastfm-status">Laden\u2026</div>
          <div class="ssp-scrobble-actions">
            <button class="tool-btn tool-btn--sm" id="ssp-lastfm-auth-btn" type="button">Autoriseer via Last.fm</button>
            <button class="tool-btn tool-btn--sm tool-btn--danger" id="ssp-lastfm-disconnect-btn" type="button" style="display:none">Ontkoppelen</button>
          </div>
          <div class="ssp-hint">Vereist LASTFM_API_SECRET in .env</div>
        </div>
      </div>

      <div class="ssp-scrobble-section">
        <div class="ssp-scrobble-header">
          <span class="ssp-scrobble-service-label">
            <span class="ssp-status-dot" id="dot-listenbrainz"></span>ListenBrainz
          </span>
          <label class="ssp-toggle-label">
            <input type="checkbox" id="ssp-lb-enabled" class="ssp-toggle-cb">
            <span class="ssp-toggle-track"></span>
          </label>
        </div>
        <div class="ssp-scrobble-body" id="ssp-lb-body">
          <input type="text" class="ssp-text-input" id="ssp-lb-username" placeholder="ListenBrainz gebruikersnaam">
          <input type="password" class="ssp-text-input" id="ssp-lb-token" placeholder="User Token (van listenbrainz.org)">
          <button class="tool-btn tool-btn--sm" id="ssp-lb-save-btn" type="button">Opslaan</button>
          <span class="dl-settings-saved" id="ssp-lb-saved">\u2713 Opgeslagen</span>
        </div>
      </div>
    </div>
  `,e.appendChild(s),s.querySelector(".ssp-close-btn").addEventListener("click",w),C(s),y(),document.querySelector(".sidebar-settings-btn")?.addEventListener("click",M),s.querySelectorAll(".ssp-engine-btn").forEach(l=>{l.addEventListener("click",()=>{let o=l.dataset.engine;u.downloadEngine=o,localStorage.setItem("downloadEngine",o),s.querySelectorAll(".ssp-engine-btn").forEach(f=>f.classList.toggle("active",f.dataset.engine===o));let r=document.getElementById("ssp-platform-group");r&&(r.style.display=o==="orpheus"?"":"none");let p=document.getElementById("ssp-orpheus-config-group");p&&(p.style.display=o==="orpheus"?"":"none"),document.dispatchEvent(new CustomEvent("engine:changed",{detail:{engine:o}}))})}),s.querySelectorAll(".ssp-pill").forEach(l=>{l.addEventListener("click",()=>{let o=l.dataset.platform;u.orpheusPlatform=o,localStorage.setItem("orpheusPlatform",o),s.querySelectorAll(".ssp-pill").forEach(r=>r.classList.toggle("active",r.dataset.platform===o)),document.dispatchEvent(new CustomEvent("platform:changed",{detail:{platform:o}}))})}),document.getElementById("ssp-orpheus-settings-btn")?.addEventListener("click",()=>{w(),k()}),B(),P(s)}var x={tidarr:{label:"Tidal (Tidarr)",color:"#33ffe7"},orpheus_tidal:{label:"Tidal (Orpheus)",color:"#33ffe7"},orpheus_qobuz:{label:"Qobuz",color:"#0070ef"},orpheus_deezer:{label:"Deezer",color:"#a238ff"},orpheus_spotify:{label:"Spotify",color:"#1cc659"},orpheus_soundcloud:{label:"SoundCloud",color:"#ff5502"},orpheus_applemusic:{label:"Apple Music",color:"#FA586A"},orpheus_beatport:{label:"Beatport",color:"#00ff89"},orpheus_beatsource:{label:"Beatsource",color:"#16a8f4"},orpheus_youtube:{label:"YouTube",color:"#FF0000"}};async function P(e){let t=e.querySelector("#dl-priority-list"),n=e.querySelector("#dl-priority-save-btn"),s=e.querySelector("#dl-priority-saved"),l=e.querySelector("#dl-hybrid-toggle");if(!t)return;let o;try{o=await(await fetch("/api/download/settings")).json()}catch{t.innerHTML='<div class="ssp-loading-text">Instellingen niet beschikbaar</div>';return}let r=o.source_priority||Object.keys(x),p=o.source_enabled||{},f=o.hybrid_mode!==!1;l&&(l.checked=f);function _(h){t.innerHTML=h.map((a,i)=>{let d=x[a]||{label:a,color:"#888"},m=p[a]!==!1;return`
        <div class="dl-priority-item" draggable="true" data-source="${b(a)}" data-enabled="${m}">
          <span class="dl-priority-handle" aria-hidden="true">\u283F</span>
          <span class="dl-priority-dot" style="background:${d.color}"></span>
          <span class="dl-priority-name">${b(d.label)}</span>
          <span class="dl-priority-status">#${i+1}</span>
          <input type="checkbox" class="dl-priority-toggle" data-src="${b(a)}"
                 ${m?"checked":""} title="Bron in-/uitschakelen"
                 aria-label="${b(d.label)} in-/uitschakelen">
        </div>`}).join(""),t.querySelectorAll(".dl-priority-toggle").forEach(a=>{a.addEventListener("change",()=>{let i=a.dataset.src;p[i]=a.checked;let d=a.closest(".dl-priority-item");d&&(d.dataset.enabled=String(a.checked))})});let c=null;t.querySelectorAll(".dl-priority-item").forEach(a=>{a.addEventListener("dragstart",i=>{c=a,a.classList.add("dragging"),i.dataTransfer.effectAllowed="move",i.dataTransfer.setData("text/plain",a.dataset.source)}),a.addEventListener("dragend",()=>{a.classList.remove("dragging"),t.querySelectorAll(".dl-priority-item").forEach(i=>i.classList.remove("drag-over")),c=null,t.querySelectorAll(".dl-priority-item").forEach((i,d)=>{let m=i.querySelector(".dl-priority-status");m&&(m.textContent=`#${d+1}`)})}),a.addEventListener("dragover",i=>{i.preventDefault(),i.dataTransfer.dropEffect="move",c&&c!==a&&(t.querySelectorAll(".dl-priority-item").forEach(d=>d.classList.remove("drag-over")),a.classList.add("drag-over"))}),a.addEventListener("dragleave",()=>{a.classList.remove("drag-over")}),a.addEventListener("drop",i=>{if(i.preventDefault(),a.classList.remove("drag-over"),!c||c===a)return;let d=[...t.querySelectorAll(".dl-priority-item")],m=d.indexOf(c),T=d.indexOf(a);m<T?a.after(c):a.before(c)})})}_(r),n?.addEventListener("click",async()=>{let h=[...t.querySelectorAll(".dl-priority-item")].map(a=>a.dataset.source),c={};t.querySelectorAll(".dl-priority-toggle[data-src]").forEach(a=>{c[a.dataset.src]=a.checked}),n.disabled=!0;try{await fetch("/api/download/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source_priority:h,hybrid_mode:l?.checked??!0,source_enabled:c})}),s&&(s.classList.add("visible"),setTimeout(()=>s.classList.remove("visible"),2500))}catch(a){alert("Opslaan mislukt: "+a.message)}finally{n.disabled=!1}})}async function y(){try{let e=await g("/api/scrobbler/settings"),t=document.getElementById("ssp-lastfm-enabled"),n=document.getElementById("ssp-lastfm-status"),s=document.getElementById("ssp-lastfm-auth-btn"),l=document.getElementById("ssp-lastfm-disconnect-btn"),o=document.getElementById("dot-lastfm");t&&(t.checked=!!e.lastfm_enabled),o&&o.classList.toggle("connected",!!e.lastfm_connected),n&&(n.textContent=e.lastfm_connected?`Verbonden als ${e.lastfm_username||"\u2014"}`:"Niet verbonden"),s&&(s.style.display=e.lastfm_connected?"none":""),l&&(l.style.display=e.lastfm_connected?"":"none");let r=document.getElementById("ssp-lb-enabled"),p=document.getElementById("ssp-lb-username"),f=document.getElementById("dot-listenbrainz");r&&(r.checked=!!e.lb_enabled),p&&(p.value=e.lb_username||""),f&&f.classList.toggle("connected",!!e.lb_token_set&&!!e.lb_enabled)}catch{}}function C(e){e.querySelector("#ssp-lastfm-enabled")?.addEventListener("change",async t=>{await g("/api/scrobbler/settings",{method:"POST",body:JSON.stringify({lastfm_enabled:t.target.checked})}),y()}),e.querySelector("#ssp-lastfm-auth-btn")?.addEventListener("click",()=>{let t=window.open("/api/lastfm/auth","lastfm_auth","width=600,height=500,resizable=yes"),n=s=>{s.data==="lastfm_auth_ok"&&(window.removeEventListener("message",n),t?.close(),y())};window.addEventListener("message",n)}),e.querySelector("#ssp-lastfm-disconnect-btn")?.addEventListener("click",async()=>{confirm("Last.fm ontkoppelen?")&&(await g("/api/lastfm/auth",{method:"DELETE"}),y())}),e.querySelector("#ssp-lb-enabled")?.addEventListener("change",async t=>{await g("/api/scrobbler/settings",{method:"POST",body:JSON.stringify({lb_enabled:t.target.checked})}),y()}),e.querySelector("#ssp-lb-save-btn")?.addEventListener("click",async()=>{let t=e.querySelector("#ssp-lb-token")?.value.trim(),n=e.querySelector("#ssp-lb-username")?.value.trim(),s={};n&&(s.lb_username=n),t&&(s.lb_token=t);try{await g("/api/scrobbler/settings",{method:"POST",body:JSON.stringify(s)});let l=document.getElementById("ssp-lb-saved");l&&(l.classList.add("visible"),setTimeout(()=>l.classList.remove("visible"),2500)),y()}catch(l){alert("Opslaan mislukt: "+l.message)}})}function M(){let e=document.getElementById("sidebar-settings-panel");if(!e)return;let t=e.classList.toggle("open");e.setAttribute("aria-hidden",t?"false":"true"),t&&(B(),y())}function w(){let e=document.getElementById("sidebar-settings-panel");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"))}async function B(){try{let e=await g("/api/tidarr/status"),t=document.getElementById("dot-tidarr");t&&t.classList.toggle("connected",!!e.connected)}catch{let e=document.getElementById("dot-tidarr");e&&e.classList.remove("connected")}try{let e=await L();u.orpheusConnected=!!e.connected;let t=document.getElementById("dot-orpheus");t&&t.classList.toggle("connected",!!e.connected)}catch{u.orpheusConnected=!1;let e=document.getElementById("dot-orpheus");e&&e.classList.remove("connected")}z()}async function z(){let e=document.getElementById("ssp-platform-list");if(e)try{let n=(await S()).platforms||[];if(u.availableOrpheusPlatforms=n,!n.length){e.innerHTML='<div class="ssp-loading-text">Geen platforms gevonden</div>';return}e.innerHTML=n.map(s=>`
      <div class="ssp-platform-row">
        <span class="ssp-platform-name">${b(s.name)}</span>
        <span class="ssp-platform-badge ${s.configured?"configured":"unconfigured"}">
          ${s.configured?"\u2713 Actief":"\u2717 Niet geconfigureerd"}
        </span>
      </div>`).join("")}catch{e.innerHTML='<div class="ssp-loading-text">Status ophalen mislukt</div>'}}function R(e,t){document.querySelectorAll(`[data-view="${e}"]`).forEach(n=>{let s=n.querySelector(".nav-release-badge");s||(s=document.createElement("span"),s.className="nav-release-badge",s.setAttribute("aria-hidden","true"),n.appendChild(s)),t>0?(s.textContent=t>99?"99+":String(t),s.classList.add("visible")):s.classList.remove("visible")})}async function D(){let e=document.getElementById("sidebar-playlists");if(e){e.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let t=await g("/api/plex/playlists"),n=t.playlists||t||[];if(!n.length){e.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}e.innerHTML=n.map(s=>{let l=b(s.ratingKey||s.key||""),o=b(s.title||"Playlist"),r=s.leafCount||s.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${l}" data-playlist-title="${o}"
                aria-label="Afspeellijst ${o}">
        <svg class="sidebar-playlist-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="sidebar-playlist-name">${o}</span>
        ${r?`<span class="sidebar-playlist-count">${r}</span>`:""}
      </button>`}).join("")}catch(t){t.name!=="AbortError"&&(e.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}export{J as a,R as b};
