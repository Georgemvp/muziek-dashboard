import{h as n,z as o}from"./chunk-E2KQEDIW.js";var r=document.querySelector(".app-shell"),h=document.getElementById("sidebar"),c=document.getElementById("sidebar-toggle"),y="sidebar-state";function u(){let e=document.getElementById("sidebar-overlay");return e||(e=document.createElement("button"),e.id="sidebar-overlay",e.className="sidebar-overlay",e.setAttribute("aria-label","Sluit zijbalk"),document.body.appendChild(e),e)}var b=u();function i(e){r&&(r.classList.toggle("sidebar-open",e),c?.setAttribute("aria-expanded",e?"true":"false"),b.classList.toggle("visible",e),localStorage.setItem(y,e?"open":"closed"))}function E(){localStorage.getItem(y)==="open"&&i(!0),c?.addEventListener("click",()=>{let s=r?.classList.contains("sidebar-open");i(!s)}),b.addEventListener("click",()=>i(!1)),document.addEventListener("sidebar:close",()=>i(!1)),m().catch(s=>{console.error("Failed to load sidebar playlists:",s)})}function L(e,a){document.querySelectorAll(`[data-view="${e}"]`).forEach(s=>{let t=s.querySelector(".nav-release-badge");t||(t=document.createElement("span"),t.className="nav-release-badge",t.setAttribute("aria-hidden","true"),s.appendChild(t)),a>0?(t.textContent=a>99?"99+":String(a),t.classList.add("visible")):t.classList.remove("visible")})}async function m(){let e=document.getElementById("sidebar-playlists");if(e){e.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let a=await o("/api/plex/playlists"),s=a.playlists||a||[];if(!s.length){e.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}e.innerHTML=s.map(t=>{let p=n(t.ratingKey||t.key||""),l=n(t.title||"Playlist"),d=t.leafCount||t.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${p}" data-playlist-title="${l}"
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
        ${d?`<span class="sidebar-playlist-count">${d}</span>`:""}
      </button>`}).join("")}catch(a){a.name!=="AbortError"&&(e.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}export{E as a,L as b};
