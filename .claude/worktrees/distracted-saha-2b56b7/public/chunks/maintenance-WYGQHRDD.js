import{h as o,y as d}from"./chunk-QMWFWNFX.js";import"./chunk-2BMKGNH5.js";var $={dead_files:"Dead Files",orphan_files:"Orphan Files",duplicates:"Duplicaten",metadata_gaps:"Metadata Gaps",album_completeness:"Album Compleetheid",missing_covers:"Ontbrekende Covers",fake_lossless:"Fake Lossless",track_numbers:"Tracknummers",mbid_mismatch:"MBID Mismatch",empty_folders:"Lege Mappen"},T={dead_files:"\u{1F480}",orphan_files:"\u{1F47B}",duplicates:"\u{1F4CB}",metadata_gaps:"\u{1F3F7}\uFE0F",album_completeness:"\u{1F4BF}",missing_covers:"\u{1F5BC}\uFE0F",fake_lossless:"\u{1F3AD}",track_numbers:"\u{1F522}",mbid_mismatch:"\u{1F517}",empty_folders:"\u{1F4C1}"},B={error:"#e53e3e",warning:"#dd6b20",info:"#3182ce"},c={},k={},g=new Set,x=null,h="open";function M(t){return t===0?"var(--color-success, #38a169)":t<=10?"var(--color-warning, #dd6b20)":"var(--color-danger, #e53e3e)"}function A(t){return`<span class="maint-severity" style="background:${B[t]||"#718096"}">${o(t)}</span>`}function L(t){return`<span class="maint-status-badge" style="background:${{open:"#3182ce",fixed:"#38a169",ignored:"#718096"}[t]||"#718096"}">${o(t)}</span>`}function O(t){if(!t)return"\u2014";let a=Math.floor(Date.now()/1e3-t);return a<60?"zojuist":a<3600?`${Math.floor(a/60)}m geleden`:a<86400?`${Math.floor(a/3600)}u geleden`:`${Math.floor(a/86400)}d geleden`}function C(t){return t?t<1e3?`${t}ms`:t<6e4?`${(t/1e3).toFixed(1)}s`:`${Math.floor(t/6e4)}m ${Math.floor(t%6e4/1e3)}s`:""}function m(){return`
    <div class="maint-cards">
      ${Object.keys($).map(a=>{let n=c[a]||{},i=n.open||0,s=n.fixed||0,p=n.ignored||0,r=n.active,w=n.lastRun,y=M(i),S=r?.status==="running"||r?.status==="queued";return`
          <div class="maint-card" data-scan="${o(a)}">
            <div class="maint-card-header">
              <span class="maint-card-icon">${T[a]||"\u{1F50D}"}</span>
              <span class="maint-card-title">${o($[a]||a)}</span>
            </div>
            <div class="maint-card-count" style="color:${y}">${i}</div>
            <div class="maint-card-sub">
              ${i>0?`<span class="maint-card-open">${i} open</span>`:'<span class="maint-card-ok">\u2713 Alles OK</span>'}
              ${s>0?`<span class="maint-card-fixed">${s} gefixt</span>`:""}
              ${p>0?`<span class="maint-card-ignored">${p} genegeerd</span>`:""}
            </div>
            <div class="maint-card-meta">
              ${w?`Laatste scan: ${O(w.created_at)} \xB7 ${C(w.duration_ms)}`:"Nog niet gescand"}
            </div>
            ${S?`
              <div class="maint-card-progress">
                <div class="maint-progress-bar">
                  <div class="maint-progress-fill maint-progress-indeterminate"></div>
                </div>
                <span class="maint-progress-label">
                  ${r.status==="queued"?"In wachtrij\u2026":r.progress?`${r.progress.checked} / ${r.progress.total}`:"Bezig\u2026"}
                </span>
              </div>`:`
            <button class="maint-scan-btn" data-scan="${o(a)}">
              \u{1F50D} Scan
            </button>`}
          </div>`}).join("")}
    </div>`}function _(t){let a=$[t]||t,e=k[t]||[],i=(c[t]||{}).open||0,s=g.has(t);if(e.length===0&&!s)return"";let p=e.filter(r=>r.auto_fixable&&r.status==="open");return`
    <div class="maint-section" id="maint-section-${o(t)}">
      <button class="maint-section-toggle" data-toggle="${o(t)}" aria-expanded="${s}">
        <span class="maint-section-icon">${T[t]||"\u{1F50D}"}</span>
        <span class="maint-section-label">${o(a)}</span>
        <span class="maint-section-count ${i>0?i>10?"high":"med":"ok"}">${i}</span>
        <span class="maint-section-chevron">${s?"\u25B2":"\u25BC"}</span>
      </button>

      ${s?`
      <div class="maint-section-body">
        <div class="maint-section-toolbar">
          <div class="maint-filter-group">
            <span class="maint-filter-label">Filter:</span>
            ${["open","fixed","ignored","all"].map(r=>`
              <button class="maint-filter-btn ${h===r?"active":""}"
                data-filter-status="${r}" data-filter-type="${o(t)}">${r}</button>`).join("")}
          </div>
          ${p.length>0?`
            <button class="maint-fix-all-btn" data-fix-all="${o(t)}">
              \u26A1 Fix Alles (${p.length})
            </button>`:""}
        </div>

        ${e.length===0?'<p class="maint-empty">Geen findings. Scan eerst dit type.</p>':`<div class="maint-table-wrap">
              <table class="maint-table">
                <thead>
                  <tr>
                    <th>Bestand / Info</th>
                    <th>Artiest</th>
                    <th>Album</th>
                    <th>Probleem</th>
                    <th>Ernst</th>
                    <th>Status</th>
                    <th>Acties</th>
                  </tr>
                </thead>
                <tbody>
                  ${e.map(r=>j(r)).join("")}
                </tbody>
              </table>
            </div>`}
      </div>`:""}
    </div>`}function j(t){let a=(t.file_path||"").split("/"),e=a[a.length-1]||t.file_path||"\u2014",n=a.length>1?a.slice(0,-1).join("/"):"";return`
    <tr class="maint-row ${t.status}" data-finding-id="${t.id}">
      <td class="maint-td-file" title="${o(t.file_path||"")}">
        <span class="maint-filename">${o(e)}</span>
        ${n?`<span class="maint-filedir">${o(n)}</span>`:""}
      </td>
      <td class="maint-td">${o(t.artist||"\u2014")}</td>
      <td class="maint-td">${o(t.album||"\u2014")}</td>
      <td class="maint-td-issue">
        <span class="maint-issue-text">${o(t.issue)}</span>
        ${t.suggested_fix?`<span class="maint-suggested-fix" title="${o(t.suggested_fix)}">\u{1F4A1} ${o(t.suggested_fix.slice(0,60))}${t.suggested_fix.length>60?"\u2026":""}</span>`:""}
      </td>
      <td class="maint-td">${A(t.severity)}</td>
      <td class="maint-td">${L(t.status)}</td>
      <td class="maint-td-actions">
        ${t.auto_fixable&&t.status==="open"?`<button class="maint-fix-btn" data-fix-id="${t.id}" title="Fix automatisch">\u26A1 Fix</button>`:""}
        ${t.status==="open"?`<button class="maint-ignore-btn" data-ignore-id="${t.id}" title="Negeer">\u{1F6AB} Negeer</button>`:t.status==="ignored"?`<button class="maint-reopen-btn" data-reopen-id="${t.id}" title="Opnieuw openen">\u21A9 Heropenen</button>`:""}
      </td>
    </tr>`}function H(){let t=document.getElementById("content");if(!t)return;let a=Object.keys($);t.innerHTML=`
    <div class="maint-root">
      <div class="maint-header">
        <div class="maint-title-row">
          <h1 class="maint-title">\u{1F527} Bibliotheek Onderhoud</h1>
          <div class="maint-header-actions">
            <button class="maint-scan-all-btn" id="maint-scan-all-btn">
              \u{1F50D} Scan Alles
            </button>
            <button class="maint-refresh-btn" id="maint-refresh-summary-btn" title="Ververs">\u21BB</button>
          </div>
        </div>
        <p class="maint-subtitle">
          Scant je muziekbibliotheek op problemen: dead files, duplicaten, ontbrekende metadata, fake lossless en meer.
        </p>
      </div>

      <div id="maint-cards-container">
        ${m()}
      </div>

      <div class="maint-divider"></div>

      <div class="maint-findings-header">
        <h2 class="maint-findings-title">Findings</h2>
        <div class="maint-global-filter">
          <span>Toon:</span>
          ${["open","fixed","ignored","all"].map(e=>`
            <button class="maint-filter-btn global-filter ${h===e?"active":""}"
              data-global-filter="${e}">${e}</button>`).join("")}
        </div>
      </div>

      <div id="maint-sections-container">
        ${a.map(e=>_(e)).join("")}
      </div>
    </div>

    <style>
      .maint-root {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }
      .maint-header { margin-bottom: 24px; }
      .maint-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }
      .maint-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0;
        color: var(--color-text, #1a202c);
      }
      .maint-subtitle {
        margin: 6px 0 0;
        color: var(--color-muted, #718096);
        font-size: 0.9rem;
      }
      .maint-header-actions { display: flex; gap: 8px; align-items: center; }

      /* \u2500\u2500 Scan-all knop \u2500\u2500 */
      .maint-scan-all-btn {
        background: var(--color-accent, #4a90d9);
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 8px 18px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity .15s;
      }
      .maint-scan-all-btn:hover { opacity: .85; }
      .maint-scan-all-btn:disabled { opacity: .5; cursor: default; }
      .maint-refresh-btn {
        background: var(--color-surface2, #edf2f7);
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 1rem;
        cursor: pointer;
        color: var(--color-text, #1a202c);
      }
      .maint-refresh-btn:hover { opacity: .8; }

      /* \u2500\u2500 Kaarten \u2500\u2500 */
      .maint-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 14px;
        margin-bottom: 24px;
      }
      .maint-card {
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 12px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        transition: box-shadow .15s;
      }
      .maint-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
      .maint-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .maint-card-icon { font-size: 1.1rem; }
      .maint-card-title {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--color-muted, #718096);
        text-transform: uppercase;
        letter-spacing: .04em;
        line-height: 1.2;
      }
      .maint-card-count {
        font-size: 2.2rem;
        font-weight: 800;
        line-height: 1;
      }
      .maint-card-sub {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        font-size: 0.78rem;
      }
      .maint-card-open    { color: var(--color-danger,  #e53e3e); font-weight: 600; }
      .maint-card-ok      { color: var(--color-success, #38a169); font-weight: 600; }
      .maint-card-fixed   { color: var(--color-success, #38a169); }
      .maint-card-ignored { color: var(--color-muted,   #718096); }
      .maint-card-meta {
        font-size: 0.73rem;
        color: var(--color-muted, #718096);
        margin-top: auto;
      }
      .maint-scan-btn {
        background: var(--color-surface2, #edf2f7);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 0.8rem;
        cursor: pointer;
        color: var(--color-text, #1a202c);
        margin-top: 4px;
        transition: background .12s;
      }
      .maint-scan-btn:hover { background: var(--color-border, #e2e8f0); }

      /* \u2500\u2500 Progress bar \u2500\u2500 */
      .maint-card-progress { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
      .maint-progress-bar {
        height: 4px;
        background: var(--color-border, #e2e8f0);
        border-radius: 2px;
        overflow: hidden;
      }
      .maint-progress-fill {
        height: 100%;
        background: var(--color-accent, #4a90d9);
        border-radius: 2px;
        transition: width .3s;
      }
      @keyframes maint-indeterminate {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }
      .maint-progress-indeterminate {
        width: 30%;
        animation: maint-indeterminate 1.2s ease-in-out infinite;
      }
      .maint-progress-label { font-size: 0.73rem; color: var(--color-muted, #718096); }

      /* \u2500\u2500 Divider \u2500\u2500 */
      .maint-divider {
        height: 1px;
        background: var(--color-border, #e2e8f0);
        margin: 8px 0 20px;
      }

      /* \u2500\u2500 Findings-header \u2500\u2500 */
      .maint-findings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .maint-findings-title {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
      }
      .maint-global-filter {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.82rem;
        color: var(--color-muted, #718096);
      }

      /* \u2500\u2500 Sections \u2500\u2500 */
      .maint-section {
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 10px;
        margin-bottom: 10px;
        overflow: hidden;
        background: var(--color-surface, #fff);
      }
      .maint-section-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        color: var(--color-text, #1a202c);
        font-size: 0.95rem;
      }
      .maint-section-toggle:hover { background: var(--color-surface2, #f7fafc); }
      .maint-section-icon { font-size: 1rem; }
      .maint-section-label { font-weight: 600; flex: 1; }
      .maint-section-count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 22px;
        padding: 0 7px;
        border-radius: 11px;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .maint-section-count.ok  { background: #c6f6d5; color: #276749; }
      .maint-section-count.med { background: #feebc8; color: #7b341e; }
      .maint-section-count.high { background: #fed7d7; color: #822727; }
      .maint-section-chevron { color: var(--color-muted, #718096); font-size: 0.75rem; }
      .maint-section-body { padding: 0 16px 16px; }

      /* \u2500\u2500 Toolbar \u2500\u2500 */
      .maint-section-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
      }
      .maint-filter-group { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
      .maint-filter-label { font-size: 0.8rem; color: var(--color-muted, #718096); }
      .maint-filter-btn {
        background: var(--color-surface2, #edf2f7);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 5px;
        padding: 3px 9px;
        font-size: 0.78rem;
        cursor: pointer;
        color: var(--color-text, #1a202c);
        transition: background .1s, border-color .1s;
      }
      .maint-filter-btn.active {
        background: var(--color-accent, #4a90d9);
        border-color: var(--color-accent, #4a90d9);
        color: #fff;
      }
      .maint-fix-all-btn {
        background: var(--color-success, #38a169);
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 5px 12px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: opacity .15s;
      }
      .maint-fix-all-btn:hover { opacity: .85; }

      /* \u2500\u2500 Tabel \u2500\u2500 */
      .maint-table-wrap { overflow-x: auto; }
      .maint-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
      }
      .maint-table th {
        text-align: left;
        padding: 8px 10px;
        background: var(--color-surface2, #f7fafc);
        color: var(--color-muted, #718096);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: .04em;
        border-bottom: 1px solid var(--color-border, #e2e8f0);
        white-space: nowrap;
      }
      .maint-row { border-bottom: 1px solid var(--color-border, #e2e8f0); }
      .maint-row:last-child { border-bottom: none; }
      .maint-row.fixed   { opacity: .55; }
      .maint-row.ignored { opacity: .4; }
      .maint-row:hover { background: var(--color-surface2, #f7fafc); }
      .maint-td, .maint-td-file, .maint-td-issue, .maint-td-actions {
        padding: 9px 10px;
        vertical-align: top;
        color: var(--color-text, #1a202c);
      }
      .maint-td-file { max-width: 220px; }
      .maint-filename {
        display: block;
        font-family: monospace;
        font-size: 0.8rem;
        word-break: break-all;
      }
      .maint-filedir {
        display: block;
        font-size: 0.7rem;
        color: var(--color-muted, #718096);
        word-break: break-all;
      }
      .maint-td-issue { max-width: 300px; }
      .maint-issue-text { display: block; }
      .maint-suggested-fix {
        display: block;
        font-size: 0.75rem;
        color: var(--color-muted, #718096);
        margin-top: 3px;
        font-style: italic;
      }
      .maint-severity {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 10px;
        color: #fff;
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
      }
      .maint-status-badge {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 10px;
        color: #fff;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .maint-td-actions {
        white-space: nowrap;
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .maint-fix-btn, .maint-ignore-btn, .maint-reopen-btn {
        border: none;
        border-radius: 5px;
        padding: 3px 8px;
        font-size: 0.75rem;
        cursor: pointer;
        white-space: nowrap;
        transition: opacity .12s;
      }
      .maint-fix-btn    { background: var(--color-success, #38a169); color: #fff; }
      .maint-ignore-btn { background: var(--color-surface2, #edf2f7); color: var(--color-muted, #718096); }
      .maint-reopen-btn { background: var(--color-surface2, #edf2f7); color: var(--color-text, #1a202c); }
      .maint-fix-btn:hover, .maint-ignore-btn:hover, .maint-reopen-btn:hover { opacity: .8; }

      /* \u2500\u2500 Empty state \u2500\u2500 */
      .maint-empty {
        text-align: center;
        color: var(--color-muted, #718096);
        padding: 20px;
        font-size: 0.85rem;
      }

      /* \u2500\u2500 Toast \u2500\u2500 */
      .maint-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: 10px;
        padding: 12px 18px;
        font-size: 0.88rem;
        box-shadow: 0 4px 16px rgba(0,0,0,.12);
        z-index: 9999;
        animation: maint-toast-in .2s ease;
      }
      @keyframes maint-toast-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      @media (max-width: 700px) {
        .maint-root { padding: 14px; }
        .maint-cards { grid-template-columns: repeat(2, 1fr); }
        .maint-table th, .maint-td, .maint-td-file,
        .maint-td-issue, .maint-td-actions { padding: 6px; }
      }
    </style>`}function l(t,a=3e3){let e=document.querySelector(".maint-toast");e&&e.remove();let n=document.createElement("div");n.className="maint-toast",n.textContent=t,document.body.appendChild(n),setTimeout(()=>n.remove(),a)}async function b(){try{c=(await d("/api/maintenance/summary")).summary||{}}catch(t){console.warn("Maintenance summary laden mislukt:",t)}}async function f(t){try{let a=h==="all"?"":`&status=${h}`,e=await d(`/api/maintenance/findings?type=${t}${a}`);k[t]=e.findings||[]}catch(a){console.warn("Findings laden mislukt:",a,t),k[t]=[]}}async function F(){try{let a=(await d("/api/maintenance/status")).active||{},e=!1;for(let[i,s]of Object.entries(a))(s.status==="running"||s.status==="queued")&&(e=!0),c[i]?c[i].active=s:c[i]={active:s},s.status==="completed"&&c[i]?.active?.status!=="completed"&&(await b(),g.has(i)&&await f(i));let n=document.getElementById("maint-cards-container");n&&(n.innerHTML=m()),e?x=setTimeout(F,1500):(await b(),n&&(n.innerHTML=m()))}catch{}}function z(){x&&clearTimeout(x),x=setTimeout(F,1500)}async function q(t){try{await d(`/api/maintenance/scan/${t}`,{method:"POST"}),l(`Scan "${$[t]||t}" gestart\u2026`),z(),c[t]&&(c[t].active={status:"running",startedAt:Date.now()});let a=document.getElementById("maint-cards-container");a&&(a.innerHTML=m())}catch(a){l(`Fout: ${a.message}`)}}async function P(){try{let t=document.getElementById("maint-scan-all-btn");t&&(t.disabled=!0,t.textContent="\u23F3 Bezig\u2026"),await d("/api/maintenance/scan/all",{method:"POST"}),l("Alle scans gestart \u2014 dit kan enkele minuten duren\u2026",5e3),z();for(let e of Object.keys($))c[e]||(c[e]={}),c[e].active={status:"queued"};let a=document.getElementById("maint-cards-container");a&&(a.innerHTML=m())}catch(t){l(`Fout: ${t.message}`);let a=document.getElementById("maint-scan-all-btn");a&&(a.disabled=!1,a.textContent="\u{1F50D} Scan Alles")}}async function R(t){g.has(t)?g.delete(t):(g.add(t),k[t]||await f(t));let a=document.getElementById(`maint-section-${t}`);if(a){let e=document.createElement("div");e.innerHTML=_(t);let n=e.firstElementChild;n&&a.replaceWith(n)}}async function N(t){try{let a=await d(`/api/maintenance/fix/${t}`,{method:"POST"});l(a.status==="fixed"?"\u2713 Gefixt!":`Overgeslagen: ${a.reason||""}`);let n=document.querySelector(`[data-finding-id="${t}"]`)?.closest(".maint-section")?.id?.replace("maint-section-","");if(n){await f(n),await b(),v(n);let i=document.getElementById("maint-cards-container");i&&(i.innerHTML=m())}}catch(a){l(`Fout: ${a.message}`)}}async function D(t){try{await d(`/api/maintenance/ignore/${t}`,{method:"POST"}),l("Finding genegeerd");let e=document.querySelector(`[data-finding-id="${t}"]`)?.closest(".maint-section")?.id?.replace("maint-section-","");if(e){await f(e),await b(),v(e);let n=document.getElementById("maint-cards-container");n&&(n.innerHTML=m())}}catch(a){l(`Fout: ${a.message}`)}}async function G(t){try{await d(`/api/maintenance/reopen/${t}`,{method:"POST"}),l("Finding heropend");let e=document.querySelector(`[data-finding-id="${t}"]`)?.closest(".maint-section")?.id?.replace("maint-section-","");e&&(await f(e),await b(),v(e))}catch(a){l(`Fout: ${a.message}`)}}async function V(t){try{let a=document.querySelector(`[data-fix-all="${t}"]`);a&&(a.disabled=!0,a.textContent="\u23F3 Bezig\u2026");let e=await d(`/api/maintenance/fix-all/${t}`,{method:"POST"});l(`\u2713 ${e.fixed} gefixt, ${e.skipped} overgeslagen, ${e.errors} fouten`),await f(t),await b(),v(t);let n=document.getElementById("maint-cards-container");n&&(n.innerHTML=m())}catch(a){l(`Fout: ${a.message}`)}}function v(t){let a=document.getElementById(`maint-section-${t}`);if(!a)return;let e=document.createElement("div");e.innerHTML=_(t);let n=e.firstElementChild;n&&a.replaceWith(n)}function Y(t){t.addEventListener("click",async a=>{let e=a.target.closest("[data-scan]"),n=a.target.closest("[data-toggle]"),i=a.target.closest("[data-fix-id]"),s=a.target.closest("[data-ignore-id]"),p=a.target.closest("[data-reopen-id]"),r=a.target.closest("[data-fix-all]"),w=a.target.closest("[data-filter-status]"),y=a.target.closest("[data-global-filter]"),S=a.target.closest("#maint-scan-all-btn"),I=a.target.closest("#maint-refresh-summary-btn");if(S)return P();if(I)return K();if(e?.classList.contains("maint-scan-btn"))return q(e.dataset.scan);if(n)return R(n.dataset.toggle);if(i)return N(parseInt(i.dataset.fixId,10));if(s)return D(parseInt(s.dataset.ignoreId,10));if(p)return G(parseInt(p.dataset.reopenId,10));if(r)return V(r.dataset.fixAll);if(w){let{filterStatus:E,filterType:u}=w.dataset;h=E,await f(u),v(u)}if(y){h=y.dataset.globalFilter;let E=[...g].map(async u=>{await f(u),v(u)});await Promise.all(E),document.querySelectorAll("[data-global-filter]").forEach(u=>{u.classList.toggle("active",u.dataset.globalFilter===h)})}})}async function K(){await b();let t=document.getElementById("maint-cards-container");t&&(t.innerHTML=m());for(let a of g)await f(a),v(a);l("Vernieuwd")}async function U(){g.clear(),x&&(clearTimeout(x),x=null);let t=document.getElementById("content");if(!t)return;t.innerHTML=`<div style="padding:40px;text-align:center;color:var(--color-muted,#718096)">
    \u23F3 Onderhoud laden\u2026
  </div>`,await b(),H();let a=document.querySelector(".maint-root");a&&Y(a),Object.values(c).some(n=>n.active?.status==="running"||n.active?.status==="queued")&&z()}export{U as loadMaintenance};
