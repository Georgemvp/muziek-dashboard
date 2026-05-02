import{a as $}from"./chunk-MECMCQE2.js";import{f as h,h as i,j as w,z as l}from"./chunk-HCN2ZK5I.js";import{a as v}from"./chunk-2BMKGNH5.js";var k="seenReleaseIds";typeof window<"u"&&!window._imgFb&&(window._imgFb=function(e,t){if(!e._d){e._d=1;var r=e.getAttribute("data-fb");if(r){e.src=r;return}}e.style.display="none",e.insertAdjacentHTML("afterend",'<div class="releases-cover-ph">'+(t||"\u266B")+"</div>")});var o=null,n="all",p="playcount";function E(e){if(!e)return"\u2014";let t=new Date(e);if(isNaN(t))return e;let s=new Date-t,a=Math.floor(s/(1e3*60*60*24));return a===0?"Vandaag":a===1?"Gisteren":a<7?`${a}d geleden`:a<30?`${Math.floor(a/7)}w geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"})}function S(e){if(!e)return"Album";switch(e.toLowerCase()){case"single":return"Single";case"ep":return"EP";default:return"Album"}}function z(e){let t=e;return n!=="all"&&(t=e.filter(r=>(r.type||"album").toLowerCase()===n)),p==="date"?t=[...t].sort((r,s)=>{let a=r.releaseDate?new Date(r.releaseDate):new Date(0);return(s.releaseDate?new Date(s.releaseDate):new Date(0))-a}):t=[...t].sort((r,s)=>(s.artistPlaycount||0)-(r.artistPlaycount||0)),t}function C(e){let t=`/api/imageproxy/artist/${encodeURIComponent(e.artist)}`;if(e.image)return`<img src="${i(e.image)}" alt="${i(e.album)}" loading="lazy" decoding="async"
      data-fb="${i(t)}"
      onerror="window._imgFb ? window._imgFb(this,'\u266B') : this.style.display='none'"
      style="opacity:0;transition:opacity 0.35s;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1"
      onload="this.style.opacity='1'">`;let s=`/api/imageproxy/album?${new URLSearchParams({q:`${e.artist} ${e.album}`,artist:e.artist,album:e.album}).toString()}`;return`<img src="${i(s)}" alt="${i(e.album)}" loading="lazy" decoding="async"
    data-fb="${i(t)}"
    onerror="window._imgFb ? window._imgFb(this,'\u266B') : this.style.display='none'"
    style="opacity:0;transition:opacity 0.35s;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1"
    onload="this.style.opacity='1'">`}function D(e){let t=w(e.album||e.artist||""),r=h(e.album||e.artist||"?"),s=S(e.type),a=E(e.releaseDate),d=e.inPlex?'<span class="releases-plex-badge" title="In je Plex bibliotheek">\u25B6 Plex</span>':"";return`
    <div class="releases-card">
      <div class="releases-cover" style="background:${t}">
        <div class="releases-cover-ph">${i(r)}</div>
        ${C(e)}
        <span class="releases-type-badge releases-type-badge--${i((e.type||"album").toLowerCase())}">${i(s)}</span>
        <button class="releases-download-btn"
          data-artist="${i(e.artist)}"
          data-album="${i(e.album)}"
          title="Download via Tidarr / OrpheusDL">\u2B07</button>
      </div>
      <div class="releases-info">
        <div class="releases-album" title="${i(e.album)}">${i(e.album)}</div>
        <div class="releases-artist"
             data-artist="${i(e.artist)}"
             title="${i(e.artist)}">${i(e.artist)}</div>
        <div class="releases-meta">
          <span class="releases-date">${i(a)}</span>
          ${d}
        </div>
      </div>
    </div>`}function L(e){let t=document.getElementById("view-toolbar");if(!t)return;let r=e?e.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <button class="toolbar-btn releases-filter-btn ${n==="all"?"active":""}" data-filter="all">Alle</button>
      <button class="toolbar-btn releases-filter-btn ${n==="album"?"active":""}" data-filter="album">Albums</button>
      <button class="toolbar-btn releases-filter-btn ${n==="single"?"active":""}" data-filter="single">Singles</button>
      <button class="toolbar-btn releases-filter-btn ${n==="ep"?"active":""}" data-filter="ep">EPs</button>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${r} release${r!==1?"s":""}</span>
      <select id="releases-sort" class="toolbar-select">
        <option value="playcount" ${p==="playcount"?"selected":""}>Meest beluisterd</option>
        <option value="date"      ${p==="date"?"selected":""}>Nieuwste eerst</option>
      </select>
      <button id="releases-refresh-btn" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
  `,t.querySelectorAll(".releases-filter-btn").forEach(s=>{s.addEventListener("click",()=>{n=s.dataset.filter,f(),L(o?o.releases:[])})}),document.getElementById("releases-sort")?.addEventListener("change",s=>{p=s.target.value,f()}),document.getElementById("releases-refresh-btn")?.addEventListener("click",async()=>{await I()})}function f(){let e=document.getElementById("content");if(!e)return;let t=e.querySelector("#releases-grid");if(!t)return;let r=o?o.releases:[],s=z(r);if(s.length===0){let a=n==="all"?"":` (${S(n)}s)`;t.innerHTML=`
      <div class="releases-empty">
        <div class="releases-empty-icon">\u266B</div>
        <div class="releases-empty-text">Geen nieuwe releases${a} gevonden</div>
      </div>`;return}t.innerHTML=s.map(D).join(""),t.querySelectorAll(".releases-artist[data-artist]").forEach(a=>{a.addEventListener("click",()=>{$("artist-detail",{name:a.dataset.artist})})}),t.querySelectorAll(".releases-download-btn").forEach(a=>{a.addEventListener("click",async d=>{d.stopPropagation();let m=a.dataset.artist,x=a.dataset.album;a.disabled=!0,a.textContent="\u2026";try{let c=await l(`/api/tidarr/search?q=${encodeURIComponent(`${m} ${x}`)}`),y=c?.albums||c?.results||[];if(y.length){let b=localStorage.getItem("downloadQuality")||"high";await l("/api/tidarr/add",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:y[0].id,type:"album",quality:b})}),a.textContent="\u2713",a.style.color="#4caf50";return}let g=(await l(`/api/orpheus/search?q=${encodeURIComponent(`${m} ${x}`)}&type=album`))?.results||[];if(g.length){let b=localStorage.getItem("downloadQuality")||"high";await l("/api/orpheus/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:g[0].url,platform:g[0].platform,quality:b})}),a.textContent="\u2713",a.style.color="#4caf50";return}a.textContent="\u2717",a.title="Niet gevonden in Tidarr of OrpheusDL"}catch(c){console.error("Download mislukt:",c),a.textContent="\u2717"}finally{setTimeout(()=>{a.textContent!=="\u2713"&&(a.disabled=!1,a.textContent="\u2B07",a.style.color="")},3e3)}})})}async function I(){let e=document.getElementById("releases-refresh-btn");e&&(e.disabled=!0,e.textContent="\u21BB Bezig\u2026");try{await l("/api/releases/refresh",{method:"POST"}),o=null,await u()}catch(t){let r=document.getElementById("content");if(r){let s=r.querySelector(".releases-error");s&&s.remove();let a=document.createElement("div");a.className="releases-error error-box",a.textContent="Verversen mislukt: "+t.message,r.prepend(a)}}finally{e&&(e.disabled=!1,e.textContent="\u21BB Vernieuwen")}}async function u(){let e=document.getElementById("content");if(e){e.innerHTML=`
    <div class="releases-loading">
      <div class="releases-loading-spinner"></div>
      <div class="releases-loading-text">Releases laden\u2026</div>
    </div>`;try{let t=await l("/api/releases");if(t&&t.status==="building"){let s=t.progress?.percent??0;e.innerHTML=`
        <div class="releases-building">
          <div class="releases-building-title">Releases worden opgebouwd\u2026</div>
          <div class="releases-building-bar-wrap">
            <div class="releases-building-bar" style="width:${s}%"></div>
          </div>
          <div class="releases-building-pct">${s}%</div>
          <div class="releases-building-hint">Dit kan even duren. Probeer het over een minuut opnieuw.</div>
          <button class="toolbar-btn" id="releases-retry-btn" style="margin-top:16px">\u21BB Opnieuw proberen</button>
        </div>`,document.getElementById("releases-retry-btn")?.addEventListener("click",u);return}if(o=t,t&&t.releases){let s=t.releases.map(a=>`${a.artist}::${a.album}`);localStorage.setItem(k,JSON.stringify(s)),v.newReleaseCount=0,document.querySelectorAll(".nav-releases-badge, .releases-badge").forEach(a=>{a.style.display="none",a.textContent=""})}let r=t&&t.releases||[];e.innerHTML=`
      <div class="releases-header">
        <h1 class="releases-title">New Releases</h1>
        ${t&&t.builtAt?`<div class="releases-built-at">Bijgewerkt ${E(new Date(t.builtAt).toISOString().split("T")[0])}</div>`:""}
      </div>
      <div id="releases-grid" class="releases-grid"></div>`,L(r),f()}catch(t){e.innerHTML=`
      <div class="error-box">
        \u26A0\uFE0F Releases laden mislukt: ${i(t.message)}
        <button class="error-retry-btn" style="margin-left:12px;padding:4px 10px;cursor:pointer;">
          Probeer opnieuw
        </button>
      </div>`,e.querySelector(".error-retry-btn")?.addEventListener("click",u)}}}function R(){if(document.getElementById("releases-view-styles"))return;let e=document.createElement("style");e.id="releases-view-styles",e.textContent=`
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
      position: relative;
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

    /* \u2500\u2500 Releases: Download button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .releases-download-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s, background 0.15s;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .releases-download-btn:hover { background: rgba(0,0,0,0.85); }
    .releases-download-btn:disabled { cursor: default; }
    .releases-card:hover .releases-download-btn,
    .releases-download-btn:focus { opacity: 1; }

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
  `,document.head.appendChild(e)}async function N(){R(),await u()}export{N as loadReleases};
