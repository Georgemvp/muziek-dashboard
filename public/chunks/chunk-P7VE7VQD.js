import{E as g,F as m,h as r,z as c}from"./chunk-HCN2ZK5I.js";import{a as o}from"./chunk-2BMKGNH5.js";var p=document.querySelector(".app-shell"),w=document.getElementById("sidebar"),f=document.getElementById("sidebar-toggle"),b="sidebar-state";function h(){let e=document.getElementById("sidebar-overlay");return e||(e=document.createElement("button"),e.id="sidebar-overlay",e.className="sidebar-overlay",e.setAttribute("aria-label","Sluit zijbalk"),document.body.appendChild(e),e)}var y=h();function d(e){p&&(p.classList.toggle("sidebar-open",e),f?.setAttribute("aria-expanded",e?"true":"false"),y.classList.toggle("visible",e),localStorage.setItem(b,e?"open":"closed"))}function P(){localStorage.getItem(b)==="open"&&d(!0),f?.addEventListener("click",()=>{let a=p?.classList.contains("sidebar-open");d(!a)}),y.addEventListener("click",()=>d(!1)),document.addEventListener("sidebar:close",()=>d(!1)),L(),$().catch(a=>{console.error("Failed to load sidebar playlists:",a)})}var E=[{id:"all",label:"All",color:"#888"},{id:"tidal",label:"Tidal",color:"#33ffe7"},{id:"qobuz",label:"Qobuz",color:"#0070ef"},{id:"deezer",label:"Deezer",color:"#a238ff"},{id:"spotify",label:"Spotify",color:"#1cc659"},{id:"soundcloud",label:"SoundCloud",color:"#ff5502"},{id:"applemusic",label:"Apple Music",color:"#FA586A"},{id:"beatport",label:"Beatport",color:"#00ff89"},{id:"beatsource",label:"Beatsource",color:"#16a8f4"},{id:"youtube",label:"YouTube",color:"#FF0000"}];function L(){let e=document.getElementById("sidebar");if(!e)return;let s=localStorage.getItem("downloadEngine")||"tidarr",a=localStorage.getItem("orpheusPlatform")||"all";o.downloadEngine=s,o.orpheusPlatform=a;let t=document.createElement("div");t.className="sidebar-settings-panel",t.id="sidebar-settings-panel",t.setAttribute("aria-hidden","true"),t.innerHTML=`
    <div class="ssp-header">
      <span class="ssp-title">Instellingen</span>
      <button class="ssp-close-btn" aria-label="Instellingen sluiten">\u2715</button>
    </div>

    <div class="ssp-group">
      <div class="ssp-group-label">Download engine</div>
      <div class="ssp-engine-toggle">
        <button class="ssp-engine-btn${s==="tidarr"?" active":""}" data-engine="tidarr">
          <span class="ssp-status-dot" id="dot-tidarr"></span>Tidarr
        </button>
        <button class="ssp-engine-btn${s==="orpheus"?" active":""}" data-engine="orpheus">
          <span class="ssp-status-dot" id="dot-orpheus"></span>OrpheusDL
        </button>
      </div>
    </div>

    <div class="ssp-group" id="ssp-platform-group" style="${s==="orpheus"?"":"display:none"}">
      <div class="ssp-group-label">Zoekplatform</div>
      <div class="ssp-pills" id="ssp-platform-pills">
        ${E.map(l=>`
          <button class="ssp-pill${a===l.id?" active":""}"
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
  `,e.appendChild(t),t.querySelector(".ssp-close-btn").addEventListener("click",x),document.querySelector(".sidebar-settings-btn")?.addEventListener("click",S),t.querySelectorAll(".ssp-engine-btn").forEach(l=>{l.addEventListener("click",()=>{let n=l.dataset.engine;o.downloadEngine=n,localStorage.setItem("downloadEngine",n),t.querySelectorAll(".ssp-engine-btn").forEach(u=>u.classList.toggle("active",u.dataset.engine===n));let i=document.getElementById("ssp-platform-group");i&&(i.style.display=n==="orpheus"?"":"none"),document.dispatchEvent(new CustomEvent("engine:changed",{detail:{engine:n}}))})}),t.querySelectorAll(".ssp-pill").forEach(l=>{l.addEventListener("click",()=>{let n=l.dataset.platform;o.orpheusPlatform=n,localStorage.setItem("orpheusPlatform",n),t.querySelectorAll(".ssp-pill").forEach(i=>i.classList.toggle("active",i.dataset.platform===n)),document.dispatchEvent(new CustomEvent("platform:changed",{detail:{platform:n}}))})}),v()}function S(){let e=document.getElementById("sidebar-settings-panel");if(!e)return;let s=e.classList.toggle("open");e.setAttribute("aria-hidden",s?"false":"true"),s&&v()}function x(){let e=document.getElementById("sidebar-settings-panel");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"))}async function v(){try{let e=await c("/api/tidarr/status"),s=document.getElementById("dot-tidarr");s&&s.classList.toggle("connected",!!e.connected)}catch{let e=document.getElementById("dot-tidarr");e&&e.classList.remove("connected")}try{let e=await g();o.orpheusConnected=!!e.connected;let s=document.getElementById("dot-orpheus");s&&s.classList.toggle("connected",!!e.connected)}catch{o.orpheusConnected=!1;let e=document.getElementById("dot-orpheus");e&&e.classList.remove("connected")}I()}async function I(){let e=document.getElementById("ssp-platform-list");if(e)try{let a=(await m()).platforms||[];if(o.availableOrpheusPlatforms=a,!a.length){e.innerHTML='<div class="ssp-loading-text">Geen platforms gevonden</div>';return}e.innerHTML=a.map(t=>`
      <div class="ssp-platform-row">
        <span class="ssp-platform-name">${r(t.name)}</span>
        <span class="ssp-platform-badge ${t.configured?"configured":"unconfigured"}">
          ${t.configured?"\u2713 Actief":"\u2717 Niet geconfigureerd"}
        </span>
      </div>`).join("")}catch{e.innerHTML='<div class="ssp-loading-text">Status ophalen mislukt</div>'}}function T(e,s){document.querySelectorAll(`[data-view="${e}"]`).forEach(a=>{let t=a.querySelector(".nav-release-badge");t||(t=document.createElement("span"),t.className="nav-release-badge",t.setAttribute("aria-hidden","true"),a.appendChild(t)),s>0?(t.textContent=s>99?"99+":String(s),t.classList.add("visible")):t.classList.remove("visible")})}async function $(){let e=document.getElementById("sidebar-playlists");if(e){e.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let s=await c("/api/plex/playlists"),a=s.playlists||s||[];if(!a.length){e.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}e.innerHTML=a.map(t=>{let l=r(t.ratingKey||t.key||""),n=r(t.title||"Playlist"),i=t.leafCount||t.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${l}" data-playlist-title="${n}"
                aria-label="Afspeellijst ${n}">
        <svg class="sidebar-playlist-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="sidebar-playlist-name">${n}</span>
        ${i?`<span class="sidebar-playlist-count">${i}</span>`:""}
      </button>`}).join("")}catch(s){s.name!=="AbortError"&&(e.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}export{P as a,T as b};
