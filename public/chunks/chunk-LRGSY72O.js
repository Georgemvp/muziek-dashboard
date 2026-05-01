import{a as L}from"./chunk-43ODBOND.js";import{E,F as S,h as u,z as m}from"./chunk-7DIT565V.js";import{a as p}from"./chunk-7DVASGHB.js";var h=document.querySelector(".app-shell"),z=document.getElementById("sidebar"),A=document.getElementById("sidebar-toggle");function B(){let e=document.getElementById("sidebar-overlay");return e||(e=document.createElement("button"),e.id="sidebar-overlay",e.className="sidebar-overlay",e.setAttribute("aria-label","Sluit zijbalk"),document.body.appendChild(e),e)}var $=B();function f(e){h&&(h.classList.toggle("sidebar-open",e),A?.setAttribute("aria-expanded",e?"true":"false"),$.classList.toggle("visible",e))}function N(){f(!1),A?.addEventListener("click",()=>{let e=h?.classList.contains("sidebar-open");f(!e)}),$.addEventListener("click",()=>f(!1)),document.querySelectorAll(".nav-item[data-view]").forEach(e=>{e.addEventListener("click",()=>f(!1))}),document.addEventListener("sidebar:close",()=>f(!1)),document.querySelectorAll(".sidebar-collapse-toggle").forEach(e=>{let t=e.getAttribute("aria-controls");localStorage.getItem(`sidebar-group-${t}`)==="open"&&e.setAttribute("aria-expanded","true"),e.addEventListener("click",s=>{s.stopPropagation();let l=e.getAttribute("aria-expanded")==="true";e.setAttribute("aria-expanded",l?"false":"true"),localStorage.setItem(`sidebar-group-${t}`,l?"closed":"open")})}),O(),_().catch(e=>{console.error("Failed to load sidebar playlists:",e)})}var T=[{id:"all",label:"All",color:"#888"},{id:"tidal",label:"Tidal",color:"#33ffe7"},{id:"qobuz",label:"Qobuz",color:"#0070ef"},{id:"deezer",label:"Deezer",color:"#a238ff"},{id:"spotify",label:"Spotify",color:"#1cc659"},{id:"soundcloud",label:"SoundCloud",color:"#ff5502"},{id:"applemusic",label:"Apple Music",color:"#FA586A"},{id:"beatport",label:"Beatport",color:"#00ff89"},{id:"beatsource",label:"Beatsource",color:"#16a8f4"},{id:"youtube",label:"YouTube",color:"#FF0000"}];function O(){let e=document.getElementById("sidebar");if(!e)return;let t=localStorage.getItem("downloadEngine")||"tidarr",i=localStorage.getItem("orpheusPlatform")||"all";p.downloadEngine=t,p.orpheusPlatform=i;let s=document.createElement("div");s.className="sidebar-settings-panel",s.id="sidebar-settings-panel",s.setAttribute("aria-hidden","true"),s.innerHTML=`
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
        ${T.map(l=>`
          <button class="ssp-pill${i===l.id?" active":""}"
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
  `,e.appendChild(s),s.querySelector(".ssp-close-btn").addEventListener("click",k),document.querySelector(".sidebar-settings-btn")?.addEventListener("click",M),s.querySelectorAll(".ssp-engine-btn").forEach(l=>{l.addEventListener("click",()=>{let r=l.dataset.engine;p.downloadEngine=r,localStorage.setItem("downloadEngine",r),s.querySelectorAll(".ssp-engine-btn").forEach(y=>y.classList.toggle("active",y.dataset.engine===r));let c=document.getElementById("ssp-platform-group");c&&(c.style.display=r==="orpheus"?"":"none");let b=document.getElementById("ssp-orpheus-config-group");b&&(b.style.display=r==="orpheus"?"":"none"),document.dispatchEvent(new CustomEvent("engine:changed",{detail:{engine:r}}))})}),s.querySelectorAll(".ssp-pill").forEach(l=>{l.addEventListener("click",()=>{let r=l.dataset.platform;p.orpheusPlatform=r,localStorage.setItem("orpheusPlatform",r),s.querySelectorAll(".ssp-pill").forEach(c=>c.classList.toggle("active",c.dataset.platform===r)),document.dispatchEvent(new CustomEvent("platform:changed",{detail:{platform:r}}))})}),document.getElementById("ssp-orpheus-settings-btn")?.addEventListener("click",()=>{k(),L()}),w(),P(s)}var x={tidarr:{label:"Tidal (Tidarr)",color:"#33ffe7"},orpheus_tidal:{label:"Tidal (Orpheus)",color:"#33ffe7"},orpheus_qobuz:{label:"Qobuz",color:"#0070ef"},orpheus_deezer:{label:"Deezer",color:"#a238ff"},orpheus_spotify:{label:"Spotify",color:"#1cc659"},orpheus_soundcloud:{label:"SoundCloud",color:"#ff5502"},orpheus_applemusic:{label:"Apple Music",color:"#FA586A"},orpheus_beatport:{label:"Beatport",color:"#00ff89"},orpheus_beatsource:{label:"Beatsource",color:"#16a8f4"},orpheus_youtube:{label:"YouTube",color:"#FF0000"}};async function P(e){let t=e.querySelector("#dl-priority-list"),i=e.querySelector("#dl-priority-save-btn"),s=e.querySelector("#dl-priority-saved"),l=e.querySelector("#dl-hybrid-toggle");if(!t)return;let r;try{r=await(await fetch("/api/download/settings")).json()}catch{t.innerHTML='<div class="ssp-loading-text">Instellingen niet beschikbaar</div>';return}let c=r.source_priority||Object.keys(x),b=r.source_enabled||{},y=r.hybrid_mode!==!1;l&&(l.checked=y);function I(v){t.innerHTML=v.map((a,o)=>{let n=x[a]||{label:a,color:"#888"},g=b[a]!==!1;return`
        <div class="dl-priority-item" draggable="true" data-source="${u(a)}" data-enabled="${g}">
          <span class="dl-priority-handle" aria-hidden="true">\u283F</span>
          <span class="dl-priority-dot" style="background:${n.color}"></span>
          <span class="dl-priority-name">${u(n.label)}</span>
          <span class="dl-priority-status">#${o+1}</span>
          <input type="checkbox" class="dl-priority-toggle" data-src="${u(a)}"
                 ${g?"checked":""} title="Bron in-/uitschakelen"
                 aria-label="${u(n.label)} in-/uitschakelen">
        </div>`}).join(""),t.querySelectorAll(".dl-priority-toggle").forEach(a=>{a.addEventListener("change",()=>{let o=a.dataset.src;b[o]=a.checked;let n=a.closest(".dl-priority-item");n&&(n.dataset.enabled=String(a.checked))})});let d=null;t.querySelectorAll(".dl-priority-item").forEach(a=>{a.addEventListener("dragstart",o=>{d=a,a.classList.add("dragging"),o.dataTransfer.effectAllowed="move",o.dataTransfer.setData("text/plain",a.dataset.source)}),a.addEventListener("dragend",()=>{a.classList.remove("dragging"),t.querySelectorAll(".dl-priority-item").forEach(o=>o.classList.remove("drag-over")),d=null,t.querySelectorAll(".dl-priority-item").forEach((o,n)=>{let g=o.querySelector(".dl-priority-status");g&&(g.textContent=`#${n+1}`)})}),a.addEventListener("dragover",o=>{o.preventDefault(),o.dataTransfer.dropEffect="move",d&&d!==a&&(t.querySelectorAll(".dl-priority-item").forEach(n=>n.classList.remove("drag-over")),a.classList.add("drag-over"))}),a.addEventListener("dragleave",()=>{a.classList.remove("drag-over")}),a.addEventListener("drop",o=>{if(o.preventDefault(),a.classList.remove("drag-over"),!d||d===a)return;let n=[...t.querySelectorAll(".dl-priority-item")],g=n.indexOf(d),q=n.indexOf(a);g<q?a.after(d):a.before(d)})})}I(c),i?.addEventListener("click",async()=>{let v=[...t.querySelectorAll(".dl-priority-item")].map(a=>a.dataset.source),d={};t.querySelectorAll(".dl-priority-toggle[data-src]").forEach(a=>{d[a.dataset.src]=a.checked}),i.disabled=!0;try{await fetch("/api/download/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({source_priority:v,hybrid_mode:l?.checked??!0,source_enabled:d})}),s&&(s.classList.add("visible"),setTimeout(()=>s.classList.remove("visible"),2500))}catch(a){alert("Opslaan mislukt: "+a.message)}finally{i.disabled=!1}})}function M(){let e=document.getElementById("sidebar-settings-panel");if(!e)return;let t=e.classList.toggle("open");e.setAttribute("aria-hidden",t?"false":"true"),t&&w()}function k(){let e=document.getElementById("sidebar-settings-panel");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"))}async function w(){try{let e=await m("/api/tidarr/status"),t=document.getElementById("dot-tidarr");t&&t.classList.toggle("connected",!!e.connected)}catch{let e=document.getElementById("dot-tidarr");e&&e.classList.remove("connected")}try{let e=await E();p.orpheusConnected=!!e.connected;let t=document.getElementById("dot-orpheus");t&&t.classList.toggle("connected",!!e.connected)}catch{p.orpheusConnected=!1;let e=document.getElementById("dot-orpheus");e&&e.classList.remove("connected")}C()}async function C(){let e=document.getElementById("ssp-platform-list");if(e)try{let i=(await S()).platforms||[];if(p.availableOrpheusPlatforms=i,!i.length){e.innerHTML='<div class="ssp-loading-text">Geen platforms gevonden</div>';return}e.innerHTML=i.map(s=>`
      <div class="ssp-platform-row">
        <span class="ssp-platform-name">${u(s.name)}</span>
        <span class="ssp-platform-badge ${s.configured?"configured":"unconfigured"}">
          ${s.configured?"\u2713 Actief":"\u2717 Niet geconfigureerd"}
        </span>
      </div>`).join("")}catch{e.innerHTML='<div class="ssp-loading-text">Status ophalen mislukt</div>'}}function G(e,t){document.querySelectorAll(`[data-view="${e}"]`).forEach(i=>{let s=i.querySelector(".nav-release-badge");s||(s=document.createElement("span"),s.className="nav-release-badge",s.setAttribute("aria-hidden","true"),i.appendChild(s)),t>0?(s.textContent=t>99?"99+":String(t),s.classList.add("visible")):s.classList.remove("visible")})}async function _(){let e=document.getElementById("sidebar-playlists");if(e){e.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let t=await m("/api/plex/playlists"),i=t.playlists||t||[];if(!i.length){e.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}e.innerHTML=i.map(s=>{let l=u(s.ratingKey||s.key||""),r=u(s.title||"Playlist"),c=s.leafCount||s.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${l}" data-playlist-title="${r}"
                aria-label="Afspeellijst ${r}">
        <svg class="sidebar-playlist-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="sidebar-playlist-name">${r}</span>
        ${c?`<span class="sidebar-playlist-count">${c}</span>`:""}
      </button>`}).join("")}catch(t){t.name!=="AbortError"&&(e.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}export{N as a,G as b};
