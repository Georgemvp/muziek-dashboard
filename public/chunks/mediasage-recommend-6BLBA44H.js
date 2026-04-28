import{h as T,i as j,j as q,k as M,m as z,n as C}from"./chunk-HQMF7PTS.js";import{a as H}from"./chunk-6EPTSU2N.js";import{A as $,g as A,i as o,k as I}from"./chunk-LCSFBDUL.js";var b=1,c="library",y=null,h="",L=null,p=[],u={},l=null,m=null,v=[],x=[];async function ce(){b=1,c="library",y=null,h="",L=null,p=[],u={},l=null,v=[],x=[],m&&(m.abort(),m=null),Z(),P()}function Z(){if(document.getElementById("ms-recommend-styles"))return;let e=document.createElement("style");e.id="ms-recommend-styles",e.textContent=`
    /* \u2500\u2500 Hergebruik .ms-view, .ms-header, .ms-back-btn, .ms-title,           */
    /* .ms-card, .ms-btn, .ms-chips, .ms-chip, .ms-textarea van playlist view */

    /* \u2500\u2500 Mode toggle \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-mode-row {
      display: flex;
      gap: 8px;
      margin-top: 14px;
    }
    .msr-mode-btn {
      flex: 1;
      padding: 10px 14px;
      border-radius: 8px;
      border: 2px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      text-align: center;
      transition: all .15s;
    }
    .msr-mode-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
    .msr-mode-btn.active {
      border-color: var(--color-accent);
      background: color-mix(in srgb, var(--color-accent) 12%, transparent);
      color: var(--color-accent);
    }

    /* \u2500\u2500 Familiarity cards \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-fam-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 14px;
    }
    @media (max-width: 560px) {
      .msr-fam-grid { grid-template-columns: 1fr; }
    }
    .msr-fam-card {
      border: 2px solid var(--color-border);
      border-radius: 10px;
      padding: 14px 12px;
      cursor: pointer;
      text-align: center;
      transition: all .15s;
      background: var(--color-bg);
      user-select: none;
    }
    .msr-fam-card:hover { border-color: var(--color-accent); }
    .msr-fam-card.active {
      border-color: var(--color-accent);
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);
    }
    .msr-fam-icon { font-size: 26px; margin-bottom: 6px; }
    .msr-fam-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: 3px;
    }
    .msr-fam-desc { font-size: 11px; color: var(--color-text-secondary); line-height: 1.35; }

    /* \u2500\u2500 Vragen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-question-block { margin-bottom: 20px; }
    .msr-question-text {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 10px;
      line-height: 1.4;
    }
    .msr-answer-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }
    .msr-answer-btn {
      padding: 7px 15px;
      border-radius: 20px;
      border: 1.5px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: all .14s;
      user-select: none;
    }
    .msr-answer-btn:hover { border-color: var(--color-accent); color: var(--color-text); }
    .msr-answer-btn.selected {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
      font-weight: 600;
    }

    /* \u2500\u2500 Laad-indicator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-loading {
      text-align: center;
      padding: 32px 20px;
    }
    .msr-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: msr-spin .8s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes msr-spin { to { transform: rotate(360deg); } }
    .msr-loading-text { font-size: 14px; color: var(--color-text-secondary); }

    /* \u2500\u2500 Primaire aanbeveling \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-primary-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 14px;
      padding: 22px;
      margin: 0 20px 16px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
    @media (max-width: 560px) {
      .msr-primary-card { flex-direction: column; align-items: center; text-align: center; margin: 0 12px 14px; }
    }
    .msr-album-art {
      width: 200px;
      height: 200px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .msr-album-art-ph {
      width: 200px;
      height: 200px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      font-weight: 800;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    @media (max-width: 560px) {
      .msr-album-art, .msr-album-art-ph { width: 160px; height: 160px; }
    }
    .msr-album-meta { flex: 1; min-width: 0; }
    .msr-album-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--color-accent);
      margin-bottom: 6px;
    }
    .msr-album-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-text);
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .msr-album-artist {
      font-size: 15px;
      color: var(--color-text-secondary);
      margin-bottom: 10px;
    }
    .msr-album-pitch {
      font-size: 14px;
      color: var(--color-text);
      line-height: 1.55;
      margin-bottom: 12px;
      font-style: italic;
      opacity: .85;
    }
    .msr-album-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 16px;
    }
    @media (max-width: 560px) { .msr-album-tags { justify-content: center; } }
    .msr-tag {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      background: color-mix(in srgb, var(--color-accent) 14%, transparent);
      color: var(--color-accent);
      border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
    }

    /* \u2500\u2500 Secundaire picks \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-picks-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 0 20px 16px;
    }
    @media (max-width: 560px) {
      .msr-picks-row { grid-template-columns: 1fr; margin: 0 12px 14px; }
    }
    .msr-pick-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .msr-pick-art {
      width: 64px;
      height: 64px;
      border-radius: 7px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .msr-pick-art-ph {
      width: 64px;
      height: 64px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    .msr-pick-info { flex: 1; min-width: 0; }
    .msr-pick-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .msr-pick-artist {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .msr-pick-pitch {
      font-size: 11px;
      color: var(--color-text);
      opacity: .75;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* \u2500\u2500 Actie-sectie \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-actions-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 16px 20px;
      margin: 0 20px 12px;
    }
    @media (max-width: 768px) { .msr-actions-card { margin: 0 12px 12px; } }
    .msr-actions-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--color-text-secondary);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    /* \u2500\u2500 Tidarr zoekresultaten \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-tidarr-results {
      margin-top: 12px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      max-height: 260px;
      overflow-y: auto;
    }
    .msr-tidarr-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-bottom: 1px solid var(--color-border);
      transition: background .12s;
    }
    .msr-tidarr-row:last-child { border-bottom: none; }
    .msr-tidarr-row:hover { background: var(--color-card); }
    .msr-tidarr-info { flex: 1; min-width: 0; }
    .msr-tidarr-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .msr-tidarr-artist {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* \u2500\u2500 Select voor Plex client \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-select {
      width: 100%;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 14px;
      padding: 9px 12px;
      box-sizing: border-box;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 10px;
    }
    .msr-select:focus { outline: none; border-color: var(--color-accent); }

    /* \u2500\u2500 Navigatie knoppen onderaan \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .msr-bottom-bar {
      display: flex;
      gap: 10px;
      margin: 4px 20px 60px;
      flex-wrap: wrap;
    }
    @media (max-width: 560px) {
      .msr-bottom-bar { flex-direction: column; margin: 4px 12px 60px; }
      .msr-bottom-bar .ms-btn { width: 100%; }
    }

    /* \u2500\u2500 Responsive overrides \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    @media (max-width: 768px) {
      .ms-card  { margin: 0 12px 14px; padding: 16px; }
      .ms-header { padding: 12px 14px 6px; }
      .ms-steps  { padding: 10px 14px 8px; }
      .ms-title  { font-size: 17px; }
      .ms-row    { flex-direction: column; align-items: stretch; }
      .ms-btn    { width: 100%; }
    }
  `,document.head.appendChild(e)}function P(){let e=document.getElementById("content");e&&(e.innerHTML=`
    <div class="ms-view" style="max-width:860px;margin:0 auto;padding-bottom:60px">
      ${J()}
      ${_()}
      <div id="msr-body">${N()}</div>
    </div>
  `,R())}function E(e){b=e;let r=document.querySelector(".ms-steps"),t=document.getElementById("msr-body");r&&(r.outerHTML=_());let n=document.getElementById("msr-body")||t;n?(n.innerHTML=N(),R(),document.querySelector(".ms-view")?.scrollIntoView({behavior:"smooth",block:"start"})):P()}function J(){return`
    <div class="ms-header">
      <button class="ms-back-btn" id="msr-back-btn">\u2190 Terug</button>
      <h1 class="ms-title">\u{1F4BF} AI Album Aanbevelingen</h1>
    </div>
  `}function _(){let e=[{n:1,label:"Prompt"},{n:2,label:"Vragen"},{n:3,label:"Resultaat"}];return`
    <nav class="ms-steps" aria-label="Stappen">
      ${e.map((r,t)=>`
        <div class="ms-step${b===r.n?" active":""}${b>r.n?" done":""}">
          <div class="ms-step-dot">${b>r.n?"\u2713":r.n}</div>
          <span class="ms-step-label">${r.label}</span>
        </div>
        ${t<e.length-1?`<div class="ms-step-line${b>r.n?" done":""}"></div>`:""}
      `).join("")}
    </nav>
  `}function N(){switch(b){case 1:return Q();case 2:return G();case 3:return S();default:return""}}function Q(){let e=[{key:"comfort",icon:"\u{1F6CB}\uFE0F",label:"Comfort picks",desc:"Albums die je al kent en geweldig vindt"},{key:"hidden",icon:"\u{1F48E}",label:"Hidden gems",desc:"Minder bekende pareltjes die je verrassen"},{key:"rediscovery",icon:"\u{1F504}",label:"Rediscoveries",desc:"Albums die je vergeten was maar weer wil horen"}];return`
    <div class="ms-card">
      <h2>Beschrijf wat je wilt horen</h2>
      <textarea
        class="ms-textarea"
        id="msr-prompt"
        placeholder="Bijv. 'Een dromerig post-rock album voor een rustige avond' of 'Stevige jazz met een donkere sfeer\u2026'"
        maxlength="500"
      >${o(h)}</textarea>

      <div class="ms-field" style="margin-top:18px">
        <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px">Modus</label>
        <div class="msr-mode-row">
          <button class="msr-mode-btn${c==="library"?" active":""}" id="msr-mode-library">
            \u{1F4DA} Library
            <div style="font-weight:400;font-size:11px;margin-top:2px;opacity:.8">Albums die je hebt</div>
          </button>
          <button class="msr-mode-btn${c==="discovery"?" active":""}" id="msr-mode-discovery">
            \u{1F30D} Discovery
            <div style="font-weight:400;font-size:11px;margin-top:2px;opacity:.8">Nieuwe albums ontdekken</div>
          </button>
        </div>
      </div>

      <div class="ms-field">
        <label style="display:block;font-size:13px;font-weight:600;color:var(--color-text-secondary);margin-bottom:6px">Vertrouwdheid</label>
        <div class="msr-fam-grid">
          ${e.map(r=>`
            <div class="msr-fam-card${y===r.key?" active":""}" data-fam="${r.key}">
              <div class="msr-fam-icon">${r.icon}</div>
              <div class="msr-fam-label">${r.label}</div>
              <div class="msr-fam-desc">${r.desc}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="ms-row">
        <button class="ms-btn ms-btn-primary" id="msr-analyze-btn">Analyseer \u2192</button>
      </div>
    </div>
  `}function G(){if(!p.length)return`
      <div class="ms-card">
        <div class="msr-loading">
          <div class="msr-spinner"></div>
          <div class="msr-loading-text">Vragen genereren\u2026</div>
        </div>
      </div>
    `;let e=p.slice(0,2).map((t,n)=>{let s=Array.isArray(t.options)?t.options:[],i=u[n];return`
      <div class="msr-question-block">
        <div class="msr-question-text">${o(t.question||t.text||`Vraag ${n+1}`)}</div>
        <div class="msr-answer-grid">
          ${s.map(a=>{let d=typeof a=="string"?a:a.label||a.text||String(a);return`<button class="msr-answer-btn${i===d?" selected":""}"
              data-qi="${n}" data-answer="${o(d)}">${o(d)}</button>`}).join("")}
        </div>
      </div>
    `}).join(""),r=p.slice(0,2).every((t,n)=>u[n]);return`
    <div class="ms-card">
      <h2>Wat past het beste bij jou?</h2>
      <p style="font-size:13px;color:var(--color-text-secondary);margin:-10px 0 18px">
        Beantwoord de vragen voor nauwkeurigere aanbevelingen.
      </p>
      <div id="msr-questions-body">
        ${e}
      </div>
      <div class="ms-row">
        <button class="ms-btn ms-btn-ghost" id="msr-back-to-1">\u2190 Terug</button>
        <button class="ms-btn ms-btn-ghost"    id="msr-skip-btn">Sla over</button>
        ${r?'<button class="ms-btn ms-btn-primary" id="msr-generate-btn">Genereer \u2192</button>':""}
      </div>
    </div>
  `}function S(){if(!l)return`
      <div class="ms-card">
        <div class="msr-loading">
          <div class="msr-spinner"></div>
          <div class="msr-loading-text">Aanbeveling genereren\u2026</div>
        </div>
      </div>
    `;let e=l.primary||l.recommendation||l,r=l.picks||l.alternatives||[],t=c==="library"?"discovery":"library",n=c==="library"?"\u{1F30D} Schakel naar Discovery":"\u{1F4DA} Schakel naar Library";return`
    ${U(e)}
    ${r.length?W(r.slice(0,2)):""}
    ${X(e)}

    <div class="msr-bottom-bar">
      <button class="ms-btn ms-btn-secondary" id="msr-another-btn">\u21BB Ander album</button>
      <button class="ms-btn ms-btn-ghost"     id="msr-switch-mode-btn" data-mode="${t}">${n}</button>
      <button class="ms-btn ms-btn-ghost"     id="msr-back-to-1-result">\u2190 Nieuwe zoekopdracht</button>
    </div>
  `}function U(e){if(!e)return"";let r=e.album||e.title||"Onbekend album",t=e.artist||e.artist_name||"",n=e.year||e.release_year||"",s=e.pitch||e.description||e.editorial||"",i=e.genres||e.tags||[],a=e.ratingKey||e.rating_key,d=e.cover_url||e.cover||(a?C(a):null),g=d?`<img src="${o(d)}" class="msr-album-art" alt="${o(r)}"
         loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",w=`<div class="msr-album-art-ph"
    style="background:${I(r)};${d?"display:none":""}"
  >${A(r)}</div>`,k=c==="library"?"\u{1F4DA} In je bibliotheek":"\u{1F30D} Nieuw te ontdekken",B=i.slice(0,5).map(F=>`<span class="msr-tag">${o(String(F))}</span>`).join("");return`
    <div class="msr-primary-card" id="msr-primary-card">
      ${g}${w}
      <div class="msr-album-meta">
        <span class="msr-album-badge">${k}</span>
        <div class="msr-album-title">${o(r)}</div>
        <div class="msr-album-artist">${o(t)}${n?` \xB7 ${o(String(n))}`:""}</div>
        ${s?`<div class="msr-album-pitch">"${o(s)}"</div>`:""}
        ${B?`<div class="msr-album-tags">${B}</div>`:""}
      </div>
    </div>
  `}function W(e){return`
    <div style="padding:0 20px 4px;font-size:12px;font-weight:700;color:var(--color-text-secondary);
      text-transform:uppercase;letter-spacing:.05em">Ook het overwegen waard</div>
    <div class="msr-picks-row">${e.map(t=>{let n=t.album||t.title||"Onbekend",s=t.artist||t.artist_name||"",i=t.pitch||t.description||t.editorial||"",a=t.ratingKey||t.rating_key,d=t.cover_url||t.cover||(a?C(a):null),g=d?`<img src="${o(d)}" class="msr-pick-art" alt="${o(n)}"
           loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",w=`<div class="msr-pick-art-ph"
      style="background:${I(n)};${d?"display:none":""}"
    >${A(n)}</div>`;return`
      <div class="msr-pick-card">
        ${g}${w}
        <div class="msr-pick-info">
          <div class="msr-pick-title" title="${o(n)}">${o(n)}</div>
          <div class="msr-pick-artist">${o(s)}</div>
          ${i?`<div class="msr-pick-pitch">${o(i)}</div>`:""}
        </div>
      </div>
    `}).join("")}</div>
  `}function X(e){if(!e)return"";let r=e.album||e.title||"",t=e.artist||e.artist_name||"";if(c==="library")return`
      <div class="msr-actions-card">
        <div class="msr-actions-title">\u25B6 Afspelen</div>
        <select class="msr-select" id="msr-client-select">
          <option value="">Kies een Plex-client\u2026</option>
          ${v.length?v.map(s=>{let i=s.clientIdentifier||s.id||s.name||"",a=s.name||s.title||s.clientIdentifier||i;return`<option value="${o(i)}">${o(a)}</option>`}).join(""):'<option value="">Geen clients gevonden</option>'}
        </select>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="ms-btn ms-btn-primary" id="msr-play-btn"
            ${v.length?"":"disabled"}>\u25B6 Album afspelen</button>
          <button class="ms-btn ms-btn-secondary" id="msr-queue-btn"
            ${v.length?"":"disabled"}>+ Aan wachtrij</button>
          <span id="msr-play-status" style="font-size:13px;color:var(--color-text-secondary);align-self:center"></span>
        </div>
      </div>
    `;{let n=x.length?`<div class="msr-tidarr-results" id="msr-tidarr-results">
          ${x.map(s=>{let i=s.title||s.name||s.album||"Onbekend",a=s.artist||s.artistName||"",d=JSON.stringify({id:s.id,title:i,artist:a}).replace(/'/g,"&#39;");return`
              <div class="msr-tidarr-row">
                <div class="msr-tidarr-info">
                  <div class="msr-tidarr-title">${o(i)}</div>
                  <div class="msr-tidarr-artist">${o(a)}</div>
                </div>
                <button class="ms-btn ms-btn-primary" style="padding:6px 12px;font-size:12px"
                  data-tidarr-item='${d}' onclick="this.textContent='\u2193 Toegevoegd';this.disabled=true">
                  \u2193 Download
                </button>
              </div>
            `}).join("")}
        </div>`:"";return`
      <div class="msr-actions-card">
        <div class="msr-actions-title">\u{1F50D} Downloaden &amp; Bewaren</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:${n?"10px":"0"}">
          <button class="ms-btn ms-btn-primary" id="msr-tidarr-btn"
            data-q="${o(`${t} ${r}`)}">\u{1F3B5} Zoek in Tidarr</button>
          <button class="ms-btn ms-btn-secondary" id="msr-wishlist-btn"
            data-album="${o(r)}" data-artist="${o(t)}">\u2661 Listen Later</button>
          <span id="msr-disc-status" style="font-size:13px;color:var(--color-text-secondary);align-self:center"></span>
        </div>
        <div id="msr-tidarr-results-wrap">${n}</div>
      </div>
    `}}function R(){switch(document.getElementById("msr-back-btn")?.addEventListener("click",()=>{m&&(m.abort(),m=null),H("mediasage")}),b){case 1:Y();break;case 2:D();break;case 3:K();break}}function Y(){document.getElementById("msr-prompt")?.addEventListener("input",e=>{h=e.target.value}),document.getElementById("msr-mode-library")?.addEventListener("click",()=>{c="library",document.querySelectorAll(".msr-mode-btn").forEach(e=>e.classList.remove("active")),document.getElementById("msr-mode-library")?.classList.add("active")}),document.getElementById("msr-mode-discovery")?.addEventListener("click",()=>{c="discovery",document.querySelectorAll(".msr-mode-btn").forEach(e=>e.classList.remove("active")),document.getElementById("msr-mode-discovery")?.classList.add("active")}),document.querySelectorAll(".msr-fam-card").forEach(e=>{e.addEventListener("click",()=>{let r=e.dataset.fam;y=y===r?null:r,document.querySelectorAll(".msr-fam-card").forEach(t=>{t.classList.toggle("active",t.dataset.fam===y)})})}),document.getElementById("msr-analyze-btn")?.addEventListener("click",ee)}async function ee(){let e=document.getElementById("msr-prompt"),r=(e?.value||h).trim();if(!r){e?.focus();return}h=r;let t=document.getElementById("msr-analyze-btn");t&&(t.disabled=!0,t.textContent="Analyseren\u2026"),m&&m.abort(),m=new AbortController,p=[],u={},E(2);try{let n=await T(r);L=n;let s=n?.questions||n?.clarifications||[];p=Array.isArray(s)?s:[];let i=document.getElementById("msr-body");i&&(i.innerHTML=G(),D())}catch(n){if(n.name==="AbortError")return;t&&(t.disabled=!1,t.textContent="Analyseer \u2192"),p=[],f()}}function D(){document.getElementById("msr-back-to-1")?.addEventListener("click",()=>E(1)),document.getElementById("msr-skip-btn")?.addEventListener("click",()=>f()),document.querySelectorAll(".msr-answer-btn").forEach(e=>{e.addEventListener("click",()=>{let r=parseInt(e.dataset.qi),t=e.dataset.answer;if(u[r]=t,document.querySelectorAll(`.msr-answer-btn[data-qi="${r}"]`).forEach(s=>{s.classList.toggle("selected",s.dataset.answer===t)}),p.slice(0,2).every((s,i)=>u[i])){let s=document.querySelector(".ms-row");if(s&&!document.getElementById("msr-generate-btn")){let i=document.createElement("button");i.className="ms-btn ms-btn-primary",i.id="msr-generate-btn",i.textContent="Genereer \u2192",i.addEventListener("click",f),s.appendChild(i)}setTimeout(()=>{b===2&&p.slice(0,2).every((i,a)=>u[a])&&f()},600)}})}),document.getElementById("msr-generate-btn")?.addEventListener("click",f)}async function f(){m&&m.abort(),m=new AbortController,l=null,x=[],v=[],E(3);try{let e=te(),[r,t]=await Promise.all([j(e),c==="library"?M().catch(()=>[]):Promise.resolve([])]);l=r,v=Array.isArray(t)?t:t?.clients||[];let n=document.getElementById("msr-body");n&&(n.innerHTML=S(),K())}catch(e){if(e.name==="AbortError")return;V(`Generatie mislukt: ${e.message}`);let r=document.getElementById("msr-body");r&&(r.innerHTML=S())}}function te(){return{prompt:h||void 0,mode:c,familiarity:y||void 0,analysis:L||void 0,answers:Object.keys(u).length?u:void 0,questions:p.length?p.slice(0,2):void 0}}function K(){if(!l)return;let e=l.primary||l.recommendation||l;document.getElementById("msr-another-btn")?.addEventListener("click",f),document.getElementById("msr-back-to-1-result")?.addEventListener("click",()=>E(1)),document.getElementById("msr-switch-mode-btn")?.addEventListener("click",async r=>{let t=r.currentTarget.dataset.mode,n=r.currentTarget;n&&(n.disabled=!0,n.textContent="Wisselen\u2026");try{await q(t),c=t,x=[],v=[],f()}catch(s){n&&(n.disabled=!1),V(`Modus wisselen mislukt: ${s.message}`)}}),c==="library"?re(e):ne(e)}function re(e){document.getElementById("msr-play-btn")?.addEventListener("click",async()=>{let r=document.getElementById("msr-client-select")?.value;if(!r)return;let t=document.getElementById("msr-play-btn"),n=document.getElementById("msr-play-status");t&&(t.disabled=!0,t.textContent="Bezig\u2026");try{let s=O(e);if(!s.length)throw new Error("Geen trackinformatie beschikbaar");await z(s,r),t&&(t.disabled=!1,t.textContent="\u2713 Afspelen"),n&&(n.textContent="\u2713 Gestart")}catch(s){t&&(t.disabled=!1,t.textContent="\u25B6 Album afspelen"),n&&(n.textContent=`Mislukt: ${s.message}`)}}),document.getElementById("msr-queue-btn")?.addEventListener("click",async()=>{let r=document.getElementById("msr-client-select")?.value;if(!r)return;let t=document.getElementById("msr-queue-btn"),n=document.getElementById("msr-play-status");t&&(t.disabled=!0,t.textContent="Toevoegen\u2026");try{let s=O(e);if(!s.length)throw new Error("Geen trackinformatie beschikbaar");await z(s,r,!0),t&&(t.disabled=!1,t.textContent="\u2713 Toegevoegd"),n&&(n.textContent="\u2713 Aan wachtrij toegevoegd")}catch(s){t&&(t.disabled=!1,t.textContent="+ Aan wachtrij"),n&&(n.textContent=`Mislukt: ${s.message}`)}})}function ne(e){document.getElementById("msr-tidarr-btn")?.addEventListener("click",async r=>{let t=r.currentTarget.dataset.q,n=r.currentTarget;n&&(n.disabled=!0,n.textContent="Zoeken\u2026");try{let s=await $(`/api/tidarr/search?q=${encodeURIComponent(t)}`);x=Array.isArray(s)?s:s?.results||s?.items||[];let i=document.getElementById("msr-tidarr-results-wrap");i&&(x.length?(i.innerHTML=`<div class="msr-tidarr-results">
            ${x.map(a=>{let d=a.title||a.name||a.album||"Onbekend",g=a.artist||a.artistName||"";return`
                <div class="msr-tidarr-row">
                  <div class="msr-tidarr-info">
                    <div class="msr-tidarr-title">${o(d)}</div>
                    <div class="msr-tidarr-artist">${o(g)}</div>
                  </div>
                  <button class="ms-btn ms-btn-primary" style="padding:6px 12px;font-size:12px"
                    data-tidarr-id="${o(String(a.id||""))}"
                    data-tidarr-title="${o(d)}"
                    data-tidarr-artist="${o(g)}">
                    \u2193 Download
                  </button>
                </div>
              `}).join("")}
          </div>`,i.querySelectorAll("[data-tidarr-id]").forEach(a=>{a.addEventListener("click",async()=>{let d=a.dataset.tidarrId,g=a.dataset.tidarrTitle;a.disabled=!0,a.textContent="Bezig\u2026";try{await $("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:d,title:g})}),a.textContent="\u2713 Toegevoegd"}catch(w){a.disabled=!1,a.textContent="\u2193 Download";let k=document.getElementById("msr-disc-status");k&&(k.textContent=`Mislukt: ${w.message}`)}})})):i.innerHTML='<div style="padding:10px;font-size:13px;color:var(--color-text-secondary)">Geen resultaten gevonden</div>')}catch(s){let i=document.getElementById("msr-disc-status");i&&(i.textContent=`Zoeken mislukt: ${s.message}`)}finally{n&&(n.disabled=!1,n.textContent="\u{1F3B5} Zoek in Tidarr")}}),document.getElementById("msr-wishlist-btn")?.addEventListener("click",async r=>{let t=r.currentTarget.dataset.album,n=r.currentTarget.dataset.artist,s=r.currentTarget,i=document.getElementById("msr-disc-status");s&&(s.disabled=!0,s.textContent="Toevoegen\u2026");try{await $("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"album",name:t,artist:n})}),s&&(s.textContent="\u2665 Opgeslagen"),i&&(i.textContent="\u2713 Toegevoegd aan Listen Later")}catch(a){s&&(s.disabled=!1,s.textContent="\u2661 Listen Later"),i&&(i.textContent=`Mislukt: ${a.message}`)}})}function O(e){return e?e.ratingKey||e.rating_key?[e.ratingKey||e.rating_key]:Array.isArray(e.tracks)?e.tracks.map(r=>r.ratingKey||r.rating_key).filter(Boolean):[]:[]}function V(e){let r=document.getElementById("msr-body");if(!r)return;let t=r.querySelector(".error-box.msr-injected");t&&t.remove();let n=document.createElement("div");n.className="error-box msr-injected",n.style.margin="0 20px 14px",n.textContent=`\u26A0 ${e}`,r.insertBefore(n,r.firstChild)}export{ce as loadMediaSageRecommend};
