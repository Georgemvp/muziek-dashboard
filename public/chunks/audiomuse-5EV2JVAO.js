import{a as v,d as p,e as y,i as c}from"./chunk-JWPBI32X.js";import{n as d}from"./chunk-P4AK6SM6.js";import{h as l,z as u}from"./chunk-E2KQEDIW.js";import"./chunk-2GHQROOJ.js";var o=null;function w(){return document.getElementById("content")}function m(){o&&(clearInterval(o),o=null)}function k(t){if(!t)return{cls:"am-dot-red",label:"Offline"};let e=(t.status||"").toLowerCase();return e==="complete"||e==="idle"||e==="done"?{cls:"am-dot-green",label:"Klaar"}:e==="analyzing"||e==="running"||e==="processing"?{cls:"am-dot-orange",label:"Bezig\u2026"}:{cls:"am-dot-green",label:"Online"}}function b(t){if(!t)return"";let e=t.percent??(t.analyzed&&t.total?Math.round(t.analyzed/t.total*100):0),i=t.analyzed??0,a=t.total??0;return`
    <div class="am-progress-wrap">
      <div class="am-progress-bar" style="width:${e}%"></div>
    </div>
    <div class="am-progress-label">${i.toLocaleString("nl-NL")} / ${a.toLocaleString("nl-NL")} nummers geanalyseerd (${e}%)</div>`}async function S(){m();let t=w();t&&(t.innerHTML=`
    <div class="am-view">

      <!-- \u2550\u2550 Header \u2550\u2550 -->
      <div class="am-header">
        <div class="am-header-left">
          <div class="am-logo-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M2 10a2 2 0 0 1 2-2h1l2-4h10l2 4h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/>
              <circle cx="8.5" cy="13" r="1.5"/>
              <circle cx="15.5" cy="13" r="1.5"/>
              <path d="M8.5 13h7"/>
            </svg>
          </div>
          <div>
            <h1 class="am-view-title">AudioMuse</h1>
            <p class="am-view-sub">Sonic analyse &amp; aanbevelingen</p>
          </div>
        </div>
        <div class="am-header-right">
          <div class="am-status-inline" id="am-status-inline">
            <span class="am-status-dot am-dot-grey" id="am-inline-dot"></span>
            <span id="am-inline-label">Verbinden\u2026</span>
          </div>
          <a href="/audiomuse/" target="_blank" class="am-open-btn" rel="noopener">
            Open AudioMuse UI
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- \u2550\u2550 Status kaart \u2550\u2550 -->
      <div class="am-card am-status-card" id="am-status-card">
        <div class="am-card-title">Analyse Status</div>
        <div id="am-status-body">
          <div class="am-loading-small">
            <div class="spinner" aria-hidden="true"></div>Status laden\u2026
          </div>
        </div>
      </div>

      <!-- \u2550\u2550 Two-column grid \u2550\u2550 -->
      <div class="am-two-col">

        <!-- \u2550 Similar Songs \u2550 -->
        <div class="am-card">
          <div class="am-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Vergelijkbare nummers
          </div>
          <form class="am-search-form" id="am-similar-form" autocomplete="off">
            <input type="text" class="am-input" id="am-sim-artist" placeholder="Artiest" />
            <input type="text" class="am-input" id="am-sim-title"  placeholder="Nummer"  />
            <button type="submit" class="am-submit-btn">Zoeken</button>
          </form>
          <div id="am-similar-results" class="am-results-area"></div>
        </div>

        <!-- \u2550 Sonic Search \u2550 -->
        <div class="am-card">
          <div class="am-card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            Sonic Search
          </div>
          <p class="am-card-hint">
            Omschrijf het geluid dat je zoekt, bijv. <em>"calm piano music"</em> of <em>"high energy electronic"</em>.
          </p>
          <form class="am-search-form" id="am-sonic-form" autocomplete="off">
            <input type="text" class="am-input am-input-full" id="am-sonic-query"
                   placeholder="Beschrijf het geluid\u2026" />
            <button type="submit" class="am-submit-btn">Zoeken</button>
          </form>
          <div id="am-sonic-results" class="am-results-area"></div>
        </div>

      </div><!-- /.am-two-col -->

      <!-- \u2550\u2550 Smart Playlists link \u2550\u2550 -->
      <div class="am-card am-playlists-promo">
        <div class="am-playlists-promo-inner">
          <div>
            <div class="am-card-title">Smart Playlists</div>
            <p class="am-card-hint">AudioMuse groepeert je muziek automatisch op sonic kenmerken. Bekijk de gegenereerde afspeellijsten en speel ze direct af via Plex.</p>
          </div>
          <button class="am-nav-btn" data-view="audiomuse-smart-playlists">
            Bekijk Smart Playlists \u2192
          </button>
        </div>
      </div>

    </div>`,t.querySelector('[data-view="audiomuse-smart-playlists"]')?.addEventListener("click",()=>{import("./router-UFOGHVQB.js").then(e=>e.switchView("audiomuse-smart-playlists"))}),await g(),o=setInterval(g,15e3),document.addEventListener("sidebar:close",m,{once:!0}),document.addEventListener("am:view-unload",m,{once:!0}),document.getElementById("am-similar-form")?.addEventListener("submit",async e=>{e.preventDefault();let i=document.getElementById("am-sim-artist").value.trim(),a=document.getElementById("am-sim-title").value.trim();if(!i||!a)return;let s=document.getElementById("am-similar-results");s.innerHTML='<div class="am-loading-small"><div class="spinner"></div>Zoeken\u2026</div>';let n=await p(i,a);if(!n){s.innerHTML='<div class="am-empty">Nummer niet gevonden in AudioMuse database.</div>';return}s.innerHTML=`
      <div class="am-results-header">Vergelijkbaar met <strong>${l(n.source.title||a)}</strong></div>
      ${c(n.similar)}`,h(s)}),document.getElementById("am-sonic-form")?.addEventListener("submit",async e=>{e.preventDefault();let i=document.getElementById("am-sonic-query").value.trim();if(!i)return;let a=document.getElementById("am-sonic-results");a.innerHTML='<div class="am-loading-small"><div class="spinner"></div>Zoeken\u2026</div>';let s=await y(i);a.innerHTML=`
      <div class="am-results-header">Resultaten voor <em>"${l(i)}"</em></div>
      ${c(s)}`,h(a)}))}async function g(){let t=await v(),e=k(t),i=document.getElementById("am-inline-dot"),a=document.getElementById("am-inline-label");i&&(i.className=`am-status-dot ${e.cls}`,a&&(a.textContent=e.label));let s=document.getElementById("am-status-body");if(!s)return;if(!t){s.innerHTML=`
      <div class="am-status-row">
        <span class="am-status-dot am-dot-red"></span>
        <span class="am-status-text">AudioMuse is offline of niet bereikbaar.</span>
      </div>
      <p class="am-status-hint">Zorg dat AudioMuse draait op <code>localhost:8000</code> en de proxy actief is.</p>`;return}let{cls:n,label:r}=e;s.innerHTML=`
    <div class="am-status-row">
      <span class="am-status-dot ${n}"></span>
      <span class="am-status-text">${l(r)}</span>
    </div>
    ${b(t)}`}function h(t){t.querySelectorAll(".am-play-btn").forEach(e=>{e.addEventListener("click",async()=>{let i=e.dataset.playRatingkey;if(i){d(i);return}let a=e.dataset.amArtist||"",s=e.dataset.amTitle||"";if(!(!a&&!s)){e.disabled=!0,e.textContent="\u2026";try{let n=await u(`/api/plex/search?q=${encodeURIComponent(`${a} ${s}`)}`),r=(n.tracks||n.results||[]).find(f=>(f.title||"").toLowerCase().includes(s.toLowerCase()));r?.ratingKey?d(r.ratingKey):(e.textContent="?",setTimeout(()=>{e.disabled=!1,e.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>'},2e3))}catch{e.disabled=!1,e.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}}})})}export{S as loadAudioMuse};
