import{a as g,f as h,g as f,i as k}from"./chunk-JWPBI32X.js";import{n as o}from"./chunk-L7FPKZB5.js";import{h as d,j as y,z as m}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";function w(){return document.getElementById("content")}function L(a){return!a||a.length===0?"":`<div class="am-mood-list">${a.slice(0,4).map(t=>`<span class="am-mood-badge">${d(String(t))}</span>`).join("")}</div>`}function $(a){let t=a.name||`Playlist ${a.id}`,s=a.track_count??a.tracks?.length??0,i=a.moods||a.tags||[],e=y(t,!0);return`
    <div class="am-pl-card" data-pl-id="${d(String(a.id))}" tabindex="0" role="button"
         aria-label="Bekijk ${d(t)}">
      <div class="am-pl-cover" style="background:${e}">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
             stroke="rgba(255,255,255,0.7)" stroke-width="1.5" aria-hidden="true">
          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <div class="am-pl-info">
        <div class="am-pl-name">${d(t)}</div>
        <div class="am-pl-meta">${s} nummers</div>
        ${L(i)}
      </div>
    </div>`}async function M(a,t){let s=w();if(!s)return;s.innerHTML=`
    <div class="am-view">
      <div class="am-header">
        <button class="am-back-btn" id="am-back-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Terug
        </button>
        <h1 class="am-view-title">${d(t)}</h1>
      </div>
      <div class="am-card">
        <div class="am-loading-small"><div class="spinner"></div>Nummers laden\u2026</div>
      </div>
    </div>`,document.getElementById("am-back-btn")?.addEventListener("click",()=>{x()});let i=await f(a),e=s.querySelector(".am-card");if(e){if(i.length===0){e.innerHTML='<div class="am-empty">Geen nummers gevonden voor deze playlist.</div>';return}e.innerHTML=`
    <div class="am-pl-detail-header">
      <span class="am-pl-detail-count">${i.length} nummers</span>
      <button class="am-submit-btn am-play-all-btn" id="am-play-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Alles afspelen
      </button>
    </div>
    <div class="am-track-list" id="am-pl-tracks">
      ${k(i)}
    </div>`,C(e),document.getElementById("am-play-all")?.addEventListener("click",async()=>{let n=document.getElementById("am-play-all");n&&(n.disabled=!0,n.textContent="Laden\u2026");let l=i.find(r=>r.plex_rating_key||r.rating_key);if(l)o(l.plex_rating_key||l.rating_key);else if(i[0]){let r=i[0],c=r.artist||"",u=r.title||r.name||"";try{let v=await m(`/api/plex/search?q=${encodeURIComponent(`${c} ${u}`)}`),p=(v.tracks||v.results||[]).find(b=>(b.title||"").toLowerCase().includes(u.toLowerCase()));p?.ratingKey&&o(p.ratingKey)}catch{}}n&&(n.disabled=!1,n.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg> Alles afspelen')})}}async function x(){let a=w();if(!a)return;a.innerHTML=`
    <div class="am-view">
      <div class="am-header">
        <div class="am-header-left">
          <button class="am-back-btn" id="am-spl-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            AudioMuse
          </button>
          <div>
            <h1 class="am-view-title">Smart Playlists</h1>
            <p class="am-view-sub">AudioMuse groepeert je muziek op sonic kenmerken</p>
          </div>
        </div>
      </div>
      <div id="am-spl-body">
        <div class="am-loading-small"><div class="spinner"></div>Playlists laden\u2026</div>
      </div>
    </div>`,document.getElementById("am-spl-back")?.addEventListener("click",()=>{import("./router-RBFHH422.js").then(e=>e.switchView("audiomuse"))});let t=await g(),s=document.getElementById("am-spl-body");if(!s)return;if(!t){s.innerHTML=`
      <div class="am-card">
        <div class="am-status-row">
          <span class="am-status-dot am-dot-red"></span>
          <span class="am-status-text">AudioMuse is offline. Smart Playlists zijn niet beschikbaar.</span>
        </div>
      </div>`;return}let i=await h();if(i.length===0){let e=(t.status||"").toLowerCase(),n=e==="analyzing"||e==="running"||e==="processing";s.innerHTML=`
      <div class="am-card">
        ${n?`<div class="am-status-row">
               <span class="am-status-dot am-dot-orange"></span>
               <span>AudioMuse is bezig met analyseren (${t.percent??0}%). Smart Playlists verschijnen zodra de analyse klaar is.</span>
             </div>`:'<div class="am-empty">Nog geen Smart Playlists beschikbaar. Start de analyse vanuit AudioMuse UI.</div>'}
      </div>`;return}s.innerHTML=`
    <div class="am-pl-grid" id="am-pl-grid">
      ${i.map($).join("")}
    </div>`,s.querySelectorAll(".am-pl-card").forEach(e=>{let n=()=>{let l=e.dataset.plId,r=e.querySelector(".am-pl-name")?.textContent||`Playlist ${l}`;M(l,r)};e.addEventListener("click",n),e.addEventListener("keydown",l=>{(l.key==="Enter"||l.key===" ")&&n()})})}function C(a){a.querySelectorAll(".am-play-btn").forEach(t=>{t.addEventListener("click",async()=>{let s=t.dataset.playRatingkey;if(s){o(s);return}let i=t.dataset.amArtist||"",e=t.dataset.amTitle||"";if(!i&&!e)return;t.disabled=!0;let n=t.innerHTML;t.textContent="\u2026";try{let l=await m(`/api/plex/search?q=${encodeURIComponent(`${i} ${e}`)}`),r=(l.tracks||l.results||[]).find(c=>(c.title||"").toLowerCase().includes(e.toLowerCase()));r?.ratingKey?o(r.ratingKey):(t.textContent="?",setTimeout(()=>{t.disabled=!1,t.innerHTML=n},2e3))}catch{t.disabled=!1,t.innerHTML=n}})})}export{x as loadAudioMuseSmartPlaylists};
