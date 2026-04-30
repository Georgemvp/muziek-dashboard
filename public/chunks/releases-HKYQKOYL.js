import{a as m}from"./chunk-U2Z6ONHY.js";import{d as g,f,h as l,j as x,z as c}from"./chunk-HCN2ZK5I.js";import{a as b}from"./chunk-2BMKGNH5.js";var E="seenReleaseIds",n=null,i="all",o="playcount";function v(e){if(!e)return"\u2014";let t=new Date(e);if(isNaN(t))return e;let s=new Date-t,a=Math.floor(s/(1e3*60*60*24));return a===0?"Vandaag":a===1?"Gisteren":a<7?`${a}d geleden`:a<30?`${Math.floor(a/7)}w geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"})}function y(e){if(!e)return"Album";switch(e.toLowerCase()){case"single":return"Single";case"ep":return"EP";default:return"Album"}}function L(e){let t=e;return i!=="all"&&(t=e.filter(r=>(r.type||"album").toLowerCase()===i)),o==="date"?t=[...t].sort((r,s)=>{let a=r.releaseDate?new Date(r.releaseDate):new Date(0);return(s.releaseDate?new Date(s.releaseDate):new Date(0))-a}):t=[...t].sort((r,s)=>(s.artistPlaycount||0)-(r.artistPlaycount||0)),t}function k(e){let t=x(e.album||e.artist||""),r=e.image?g(e.image,240):null,s=r?`<img src="${l(r)}" alt="${l(e.album)}" loading="lazy" decoding="async"
         style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1"
         onload="this.style.opacity='1'"
         onerror="this.style.display='none'">`:"",a=f(e.album||e.artist||"?"),u=y(e.type),w=v(e.releaseDate),$=e.inPlex?'<span class="releases-plex-badge" title="In je Plex bibliotheek">\u25B6 Plex</span>':"";return`
    <div class="releases-card">
      <div class="releases-cover" style="background:${t}">
        <div class="releases-cover-ph">${l(a)}</div>
        ${s}
        <span class="releases-type-badge releases-type-badge--${l((e.type||"album").toLowerCase())}">${l(u)}</span>
      </div>
      <div class="releases-info">
        <div class="releases-album" title="${l(e.album)}">${l(e.album)}</div>
        <div class="releases-artist"
             data-artist="${l(e.artist)}"
             title="${l(e.artist)}">${l(e.artist)}</div>
        <div class="releases-meta">
          <span class="releases-date">${l(w)}</span>
          ${$}
        </div>
      </div>
    </div>`}function h(e){let t=document.getElementById("view-toolbar");if(!t)return;let r=e?e.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <button class="toolbar-btn releases-filter-btn ${i==="all"?"active":""}" data-filter="all">Alle</button>
      <button class="toolbar-btn releases-filter-btn ${i==="album"?"active":""}" data-filter="album">Albums</button>
      <button class="toolbar-btn releases-filter-btn ${i==="single"?"active":""}" data-filter="single">Singles</button>
      <button class="toolbar-btn releases-filter-btn ${i==="ep"?"active":""}" data-filter="ep">EPs</button>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${r} release${r!==1?"s":""}</span>
      <select id="releases-sort" class="toolbar-select">
        <option value="playcount" ${o==="playcount"?"selected":""}>Meest beluisterd</option>
        <option value="date"      ${o==="date"?"selected":""}>Nieuwste eerst</option>
      </select>
      <button id="releases-refresh-btn" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
  `,t.querySelectorAll(".releases-filter-btn").forEach(s=>{s.addEventListener("click",()=>{i=s.dataset.filter,p(),h(n?n.releases:[])})}),document.getElementById("releases-sort")?.addEventListener("change",s=>{o=s.target.value,p()}),document.getElementById("releases-refresh-btn")?.addEventListener("click",async()=>{await z()})}function p(){let e=document.getElementById("content");if(!e)return;let t=e.querySelector("#releases-grid");if(!t)return;let r=n?n.releases:[],s=L(r);if(s.length===0){let a=i==="all"?"":` (${y(i)}s)`;t.innerHTML=`
      <div class="releases-empty">
        <div class="releases-empty-icon">\u266B</div>
        <div class="releases-empty-text">Geen nieuwe releases${a} gevonden</div>
      </div>`;return}t.innerHTML=s.map(k).join(""),t.querySelectorAll(".releases-artist[data-artist]").forEach(a=>{a.addEventListener("click",()=>{m("artist-detail",{name:a.dataset.artist})})})}async function z(){let e=document.getElementById("releases-refresh-btn");e&&(e.disabled=!0,e.textContent="\u21BB Bezig\u2026");try{await c("/api/releases/refresh",{method:"POST"}),n=null,await d()}catch(t){let r=document.getElementById("content");if(r){let s=r.querySelector(".releases-error");s&&s.remove();let a=document.createElement("div");a.className="releases-error error-box",a.textContent="Verversen mislukt: "+t.message,r.prepend(a)}}finally{e&&(e.disabled=!1,e.textContent="\u21BB Vernieuwen")}}async function d(){let e=document.getElementById("content");if(e){e.innerHTML=`
    <div class="releases-loading">
      <div class="releases-loading-spinner"></div>
      <div class="releases-loading-text">Releases laden\u2026</div>
    </div>`;try{let t=await c("/api/releases");if(t&&t.status==="building"){let s=t.progress?.percent??0;e.innerHTML=`
        <div class="releases-building">
          <div class="releases-building-title">Releases worden opgebouwd\u2026</div>
          <div class="releases-building-bar-wrap">
            <div class="releases-building-bar" style="width:${s}%"></div>
          </div>
          <div class="releases-building-pct">${s}%</div>
          <div class="releases-building-hint">Dit kan even duren. Probeer het over een minuut opnieuw.</div>
          <button class="toolbar-btn" id="releases-retry-btn" style="margin-top:16px">\u21BB Opnieuw proberen</button>
        </div>`,document.getElementById("releases-retry-btn")?.addEventListener("click",d);return}if(n=t,t&&t.releases){let s=t.releases.map(a=>`${a.artist}::${a.album}`);localStorage.setItem(E,JSON.stringify(s)),b.newReleaseCount=0,document.querySelectorAll(".nav-releases-badge, .releases-badge").forEach(a=>{a.style.display="none",a.textContent=""})}let r=t&&t.releases||[];e.innerHTML=`
      <div class="releases-header">
        <h1 class="releases-title">New Releases</h1>
        ${t&&t.builtAt?`<div class="releases-built-at">Bijgewerkt ${v(new Date(t.builtAt).toISOString().split("T")[0])}</div>`:""}
      </div>
      <div id="releases-grid" class="releases-grid"></div>`,h(r),p()}catch(t){e.innerHTML=`
      <div class="error-box">
        \u26A0\uFE0F Releases laden mislukt: ${l(t.message)}
        <button class="error-retry-btn" style="margin-left:12px;padding:4px 10px;cursor:pointer;">
          Probeer opnieuw
        </button>
      </div>`,e.querySelector(".error-retry-btn")?.addEventListener("click",d)}}}function S(){if(document.getElementById("releases-view-styles"))return;let e=document.createElement("style");e.id="releases-view-styles",e.textContent=`
    /* \u2500\u2500 Releases: Loading / Building \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .releases-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 16px;
      color: var(--text-secondary);
    }
    .releases-loading-spinner {
      width: 36px;
      height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: releases-spin 0.7s linear infinite;
    }
    @keyframes releases-spin { to { transform: rotate(360deg); } }
    .releases-loading-text { font-size: 14px; }

    .releases-building {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 12px;
      color: var(--text-secondary);
    }
    .releases-building-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .releases-building-bar-wrap {
      width: 280px; height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }
    .releases-building-bar {
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
      transition: width 0.4s ease;
    }
    .releases-building-pct { font-size: 13px; }
    .releases-building-hint { font-size: 12px; opacity: 0.7; }

    /* \u2500\u2500 Releases: Header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .releases-header {
      display: flex;
      align-items: baseline;
      gap: 16px;
      padding: 24px 24px 0;
    }
    .releases-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      font-family: var(--font-display, inherit);
      margin: 0;
    }
    .releases-built-at {
      font-size: 12px;
      color: var(--text-tertiary);
    }

    /* \u2500\u2500 Releases: Grid \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .releases-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      padding: 20px 24px 40px;
    }

    /* \u2500\u2500 Releases: Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .releases-card {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-secondary);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      cursor: default;
    }
    .releases-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.18);
    }

    .releases-cover {
      position: relative;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .releases-cover img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .releases-cover-ph {
      font-size: 28px;
      font-weight: 700;
      color: rgba(255,255,255,0.6);
      letter-spacing: 1px;
      position: relative;
      z-index: 0;
    }

    .releases-type-badge {
      position: absolute;
      bottom: 6px;
      left: 6px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 2;
      background: rgba(0,0,0,0.6);
      color: #fff;
    }
    .releases-type-badge--single { background: rgba(var(--accent-rgb, 80,120,255), 0.85); }
    .releases-type-badge--ep     { background: rgba(180,100,20,0.85); }
    .releases-type-badge--album  { background: rgba(0,0,0,0.6); }

    .releases-plex-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-weight: 600;
      color: var(--plex-color, #e5a00d);
      background: rgba(229,160,13,0.12);
      padding: 1px 5px;
      border-radius: 3px;
    }

    .releases-info {
      padding: 10px 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .releases-album {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .releases-artist {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      transition: color 0.15s;
    }
    .releases-artist:hover { color: var(--accent); text-decoration: underline; }

    .releases-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 2px;
    }
    .releases-date {
      font-size: 11px;
      color: var(--text-tertiary);
    }

    /* \u2500\u2500 Releases: Empty \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .releases-empty {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 20px;
      gap: 12px;
      color: var(--text-secondary);
    }
    .releases-empty-icon { font-size: 36px; opacity: 0.4; }
    .releases-empty-text { font-size: 14px; }

    /* \u2500\u2500 Toolbar: filter buttons active state \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .toolbar-btn.releases-filter-btn.active {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    /* \u2500\u2500 Mobile \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    @media (max-width: 600px) {
      .releases-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 12px;
        padding: 16px 12px 32px;
      }
      .releases-header { padding: 16px 12px 0; }
    }
  `,document.head.appendChild(e)}async function C(){S(),await d()}export{C as loadReleases};
