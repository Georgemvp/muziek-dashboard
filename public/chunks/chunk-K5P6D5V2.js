import{a as b}from"./chunk-NQBJDQD4.js";import{E as m,F as f,h as r,z as c}from"./chunk-HCN2ZK5I.js";import{a as o}from"./chunk-2BMKGNH5.js";var p=document.querySelector(".app-shell"),C=document.getElementById("sidebar"),v=document.getElementById("sidebar-toggle"),h="sidebar-state";function S(){let e=document.getElementById("sidebar-overlay");return e||(e=document.createElement("button"),e.id="sidebar-overlay",e.className="sidebar-overlay",e.setAttribute("aria-label","Sluit zijbalk"),document.body.appendChild(e),e)}var E=S();function d(e){p&&(p.classList.toggle("sidebar-open",e),v?.setAttribute("aria-expanded",e?"true":"false"),E.classList.toggle("visible",e),localStorage.setItem(h,e?"open":"closed"))}function O(){localStorage.getItem(h)==="open"&&d(!0),v?.addEventListener("click",()=>{let a=p?.classList.contains("sidebar-open");d(!a)}),E.addEventListener("click",()=>d(!1)),document.addEventListener("sidebar:close",()=>d(!1)),I(),k().catch(a=>{console.error("Failed to load sidebar playlists:",a)})}var x=[{id:"all",label:"All",color:"#888"},{id:"tidal",label:"Tidal",color:"#33ffe7"},{id:"qobuz",label:"Qobuz",color:"#0070ef"},{id:"deezer",label:"Deezer",color:"#a238ff"},{id:"spotify",label:"Spotify",color:"#1cc659"},{id:"soundcloud",label:"SoundCloud",color:"#ff5502"},{id:"applemusic",label:"Apple Music",color:"#FA586A"},{id:"beatport",label:"Beatport",color:"#00ff89"},{id:"beatsource",label:"Beatsource",color:"#16a8f4"},{id:"youtube",label:"YouTube",color:"#FF0000"}];function I(){let e=document.getElementById("sidebar");if(!e)return;let s=localStorage.getItem("downloadEngine")||"tidarr",a=localStorage.getItem("orpheusPlatform")||"all";o.downloadEngine=s,o.orpheusPlatform=a;let t=document.createElement("div");t.className="sidebar-settings-panel",t.id="sidebar-settings-panel",t.setAttribute("aria-hidden","true"),t.innerHTML=`
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

    <div class="ssp-group" id="ssp-orpheus-config-group" style="${s==="orpheus"?"":"display:none"}">
      <button class="ssp-orpheus-settings-btn" id="ssp-orpheus-settings-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
        </svg>
        OrpheusDL Instellingen
      </button>
    </div>

    <div class="ssp-group" id="ssp-platform-group" style="${s==="orpheus"?"":"display:none"}">
      <div class="ssp-group-label">Zoekplatform</div>
      <div class="ssp-pills" id="ssp-platform-pills">
        ${x.map(n=>`
          <button class="ssp-pill${a===n.id?" active":""}"
                  data-platform="${n.id}"
                  style="${n.id!=="all"?`--platform-color:${n.color}`:""}">
            ${n.id!=="all"?`<span class="ssp-pill-dot" style="background:${n.color}"></span>`:""}
            ${n.label}
          </button>`).join("")}
      </div>
      <div class="ssp-platform-list" id="ssp-platform-list">
        <div class="ssp-loading-text">Platforms laden\u2026</div>
      </div>
    </div>
  `,e.appendChild(t),t.querySelector(".ssp-close-btn").addEventListener("click",y),document.querySelector(".sidebar-settings-btn")?.addEventListener("click",B),t.querySelectorAll(".ssp-engine-btn").forEach(n=>{n.addEventListener("click",()=>{let l=n.dataset.engine;o.downloadEngine=l,localStorage.setItem("downloadEngine",l),t.querySelectorAll(".ssp-engine-btn").forEach(g=>g.classList.toggle("active",g.dataset.engine===l));let i=document.getElementById("ssp-platform-group");i&&(i.style.display=l==="orpheus"?"":"none");let u=document.getElementById("ssp-orpheus-config-group");u&&(u.style.display=l==="orpheus"?"":"none"),document.dispatchEvent(new CustomEvent("engine:changed",{detail:{engine:l}}))})}),t.querySelectorAll(".ssp-pill").forEach(n=>{n.addEventListener("click",()=>{let l=n.dataset.platform;o.orpheusPlatform=l,localStorage.setItem("orpheusPlatform",l),t.querySelectorAll(".ssp-pill").forEach(i=>i.classList.toggle("active",i.dataset.platform===l)),document.dispatchEvent(new CustomEvent("platform:changed",{detail:{platform:l}}))})}),document.getElementById("ssp-orpheus-settings-btn")?.addEventListener("click",()=>{y(),b()}),L()}function B(){let e=document.getElementById("sidebar-settings-panel");if(!e)return;let s=e.classList.toggle("open");e.setAttribute("aria-hidden",s?"false":"true"),s&&L()}function y(){let e=document.getElementById("sidebar-settings-panel");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"))}async function L(){try{let e=await c("/api/tidarr/status"),s=document.getElementById("dot-tidarr");s&&s.classList.toggle("connected",!!e.connected)}catch{let e=document.getElementById("dot-tidarr");e&&e.classList.remove("connected")}try{let e=await m();o.orpheusConnected=!!e.connected;let s=document.getElementById("dot-orpheus");s&&s.classList.toggle("connected",!!e.connected)}catch{o.orpheusConnected=!1;let e=document.getElementById("dot-orpheus");e&&e.classList.remove("connected")}$()}async function $(){let e=document.getElementById("ssp-platform-list");if(e)try{let a=(await f()).platforms||[];if(o.availableOrpheusPlatforms=a,!a.length){e.innerHTML='<div class="ssp-loading-text">Geen platforms gevonden</div>';return}e.innerHTML=a.map(t=>`
      <div class="ssp-platform-row">
        <span class="ssp-platform-name">${r(t.name)}</span>
        <span class="ssp-platform-badge ${t.configured?"configured":"unconfigured"}">
          ${t.configured?"\u2713 Actief":"\u2717 Niet geconfigureerd"}
        </span>
      </div>`).join("")}catch{e.innerHTML='<div class="ssp-loading-text">Status ophalen mislukt</div>'}}function T(e,s){document.querySelectorAll(`[data-view="${e}"]`).forEach(a=>{let t=a.querySelector(".nav-release-badge");t||(t=document.createElement("span"),t.className="nav-release-badge",t.setAttribute("aria-hidden","true"),a.appendChild(t)),s>0?(t.textContent=s>99?"99+":String(s),t.classList.add("visible")):t.classList.remove("visible")})}async function k(){let e=document.getElementById("sidebar-playlists");if(e){e.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let s=await c("/api/plex/playlists"),a=s.playlists||s||[];if(!a.length){e.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}e.innerHTML=a.map(t=>{let n=r(t.ratingKey||t.key||""),l=r(t.title||"Playlist"),i=t.leafCount||t.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${n}" data-playlist-title="${l}"
                aria-label="Afspeellijst ${l}">
        <svg class="sidebar-playlist-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="sidebar-playlist-name">${l}</span>
        ${i?`<span class="sidebar-playlist-count">${i}</span>`:""}
      </button>`}).join("")}catch(s){s.name!=="AbortError"&&(e.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}export{O as a,T as b};
