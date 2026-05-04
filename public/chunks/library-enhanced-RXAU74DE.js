import{h as n,x as u}from"./chunk-OJFTIB2W.js";import"./chunk-2BMKGNH5.js";var C=[],$=[],z="name",S=1,q="",f=null,p=null,h="lastfm",x=null,T={},j=!1,I={artist_separator:", ",feat_to_title:!1},w=!1,U=["lastfm","musicbrainz","spotify","deezer","audiodb","discogs","itunes","tidal","qobuz","genius"],A={lastfm:"Last.fm",musicbrainz:"MusicBrainz",spotify:"Spotify",deezer:"Deezer",audiodb:"AudioDB",discogs:"Discogs",itunes:"iTunes",tidal:"Tidal",qobuz:"Qobuz",genius:"Genius"},W={lastfm:"\u{1F3B5}",musicbrainz:"\u{1F3BC}",spotify:"\u{1F49A}",deezer:"\u{1F3B6}",audiodb:"\u{1F3B8}",discogs:"\u{1F4BF}",itunes:"\u{1F34E}",tidal:"\u{1F30A}",qobuz:"\u{1F3B9}",genius:"\u{1F4DD}",manual:"\u270F\uFE0F"};function Y(){if(j||document.getElementById("libmgr-css")){j=!0;return}j=!0;let r=document.createElement("style");r.id="libmgr-css",r.textContent=`
/* \u2500\u2500 Enhanced Library Manager \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.libmgr { display:flex; flex-direction:column; height:calc(100vh - var(--player-height,76px) - 56px); overflow:hidden; background:var(--bg-primary); }
.libmgr-header { display:flex; align-items:center; gap:12px; padding:14px 20px 10px; border-bottom:1px solid var(--border); flex-shrink:0; flex-wrap:wrap; }
.libmgr-title { font-size:var(--text-lg); font-weight:600; color:var(--text-primary); margin:0; white-space:nowrap; }
.libmgr-mode-group { display:flex; border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
.libmgr-mode-btn { padding:5px 14px; font-size:var(--text-sm); background:none; border:none; cursor:pointer; color:var(--text-secondary); transition:background .15s; white-space:nowrap; }
.libmgr-mode-btn:hover { background:var(--bg-secondary); }
.libmgr-mode-btn.active { background:var(--accent); color:#fff; }
.libmgr-search { flex:1; min-width:160px; max-width:320px; padding:6px 10px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-secondary); color:var(--text-primary); font-size:var(--text-sm); }
.libmgr-search:focus { outline:none; border-color:var(--accent); }
.libmgr-stats { font-size:var(--text-xs); color:var(--text-muted); white-space:nowrap; }
.libmgr-settings-btn { padding:5px 10px; font-size:var(--text-sm); background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; color:var(--text-secondary); transition:background .15s; }
.libmgr-settings-btn:hover { background:var(--bg-tertiary); }
.libmgr-settings-btn.active { background:var(--accent-light); border-color:var(--accent); color:var(--accent); }

/* Settings dropdown */
.libmgr-settings-panel { background:var(--bg-primary); border:1px solid var(--border); border-radius:var(--radius-lg); padding:16px; width:320px; position:absolute; right:16px; top:56px; z-index:200; box-shadow:var(--shadow-lg); }
.libmgr-settings-panel h4 { margin:0 0 12px; font-size:var(--text-sm); color:var(--text-primary); }
.libmgr-settings-row { display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:var(--text-sm); }
.libmgr-settings-row label { flex:1; color:var(--text-secondary); }
.libmgr-settings-row input, .libmgr-settings-row select { padding:4px 8px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--bg-secondary); color:var(--text-primary); font-size:var(--text-sm); }
.libmgr-settings-save { width:100%; padding:7px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-md); cursor:pointer; font-size:var(--text-sm); margin-top:4px; }

/* Main layout */
.libmgr-body { display:flex; flex:1; overflow:hidden; position:relative; }
.libmgr-table-wrap { flex:1; overflow-y:auto; overflow-x:auto; }
.libmgr-panel-open .libmgr-table-wrap { flex:0 0 55%; }

/* Table */
.libmgr-table { width:100%; border-collapse:collapse; font-size:var(--text-sm); }
.libmgr-table thead th { position:sticky; top:0; background:var(--bg-secondary); border-bottom:2px solid var(--border); padding:9px 12px; text-align:left; font-weight:600; color:var(--text-secondary); font-size:var(--text-xs); text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; z-index:2; }
.libmgr-table thead th.sortable { cursor:pointer; user-select:none; }
.libmgr-table thead th.sortable:hover { color:var(--text-primary); }
.libmgr-table thead th.sort-active { color:var(--accent); }
.libmgr-table tbody tr { border-bottom:1px solid var(--border); transition:background .1s; cursor:pointer; }
.libmgr-table tbody tr:hover { background:var(--bg-secondary); }
.libmgr-table tbody tr.selected { background:var(--accent-light) !important; }
.libmgr-table td { padding:8px 12px; vertical-align:middle; }
.libmgr-td-thumb { width:40px; }
.libmgr-thumb { width:36px; height:36px; border-radius:3px; object-fit:cover; background:var(--bg-tertiary); }
.libmgr-name-cell { font-weight:500; color:var(--text-primary); }
.libmgr-album-count { color:var(--text-muted); font-size:var(--text-xs); }
.libmgr-genre-tag { display:inline-block; padding:1px 7px; background:var(--accent-muted); color:var(--accent); border-radius:10px; font-size:11px; margin:1px 2px 1px 0; }
.libmgr-actions { display:flex; gap:4px; opacity:0; transition:opacity .15s; }
tr:hover .libmgr-actions, tr.selected .libmgr-actions { opacity:1; }
.libmgr-action-btn { padding:3px 8px; font-size:11px; background:var(--bg-tertiary); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; color:var(--text-secondary); }
.libmgr-action-btn:hover { background:var(--border); color:var(--text-primary); }

/* Enrichment coverage ring */
.libmgr-ring { display:block; }
.libmgr-ring-wrap { display:flex; align-items:center; gap:6px; }
.libmgr-ring-label { font-size:11px; color:var(--text-muted); }

/* Detail panel */
.libmgr-panel { width:45%; flex-shrink:0; border-left:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; background:var(--bg-primary); transform:translateX(100%); transition:transform .25s ease; position:absolute; right:0; top:0; bottom:0; }
.libmgr-panel-open .libmgr-panel { transform:translateX(0); position:relative; }
.libmgr-panel-header { display:flex; align-items:center; gap:12px; padding:14px 16px; border-bottom:1px solid var(--border); flex-shrink:0; }
.libmgr-panel-thumb { width:56px; height:56px; border-radius:4px; object-fit:cover; background:var(--bg-tertiary); flex-shrink:0; }
.libmgr-panel-info { flex:1; overflow:hidden; }
.libmgr-panel-name { margin:0 0 3px; font-size:var(--text-lg); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text-primary); }
.libmgr-panel-meta { font-size:var(--text-xs); color:var(--text-muted); }
.libmgr-panel-close { padding:4px 8px; background:none; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; font-size:16px; color:var(--text-muted); flex-shrink:0; }
.libmgr-panel-close:hover { background:var(--bg-secondary); }
.libmgr-panel-actions { display:flex; gap:8px; padding:10px 16px; border-bottom:1px solid var(--border); flex-shrink:0; flex-wrap:wrap; }
.libmgr-panel-btn { padding:5px 12px; font-size:var(--text-xs); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; background:var(--bg-secondary); color:var(--text-secondary); white-space:nowrap; }
.libmgr-panel-btn:hover { background:var(--bg-tertiary); color:var(--text-primary); }
.libmgr-panel-btn.primary { background:var(--accent); border-color:var(--accent); color:#fff; }
.libmgr-panel-btn.primary:hover { background:var(--accent-hover); }

/* Source tabs */
.libmgr-source-tabs { display:flex; gap:2px; padding:8px 12px 0; border-bottom:1px solid var(--border); flex-shrink:0; overflow-x:auto; scrollbar-width:none; }
.libmgr-source-tabs::-webkit-scrollbar { display:none; }
.libmgr-source-tab { padding:5px 10px; font-size:11px; border:1px solid transparent; border-bottom:none; border-radius:4px 4px 0 0; cursor:pointer; background:none; color:var(--text-muted); white-space:nowrap; position:relative; bottom:-1px; }
.libmgr-source-tab:hover { color:var(--text-primary); background:var(--bg-secondary); }
.libmgr-source-tab.active { background:var(--bg-primary); border-color:var(--border); color:var(--text-primary); font-weight:600; }
.libmgr-source-tab .tab-dot { width:6px; height:6px; border-radius:50%; display:inline-block; margin-right:4px; vertical-align:middle; }
.libmgr-source-tab .tab-dot.has-data { background:var(--green); }
.libmgr-source-tab .tab-dot.no-data { background:var(--border); }

/* Source content */
.libmgr-source-content { flex:1; overflow-y:auto; padding:14px 16px; }
.libmgr-source-empty { color:var(--text-muted); font-size:var(--text-sm); padding:20px 0; text-align:center; }
.libmgr-field-grid { display:grid; gap:8px; }
.libmgr-field-row { display:grid; grid-template-columns:120px 1fr; gap:8px; align-items:start; }
.libmgr-field-key { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.04em; padding-top:2px; }
.libmgr-field-val { font-size:var(--text-sm); color:var(--text-primary); word-break:break-word; }
.libmgr-field-val.editable { cursor:text; border-radius:var(--radius-sm); padding:1px 4px; margin:-1px -4px; }
.libmgr-field-val.editable:hover { background:var(--bg-secondary); outline:1px solid var(--border); }
.libmgr-field-val.editable:focus { background:var(--bg-primary); outline:2px solid var(--accent); }
.libmgr-field-val[contenteditable="true"] { background:var(--bg-secondary); outline:2px solid var(--accent); border-radius:var(--radius-sm); padding:2px 6px; }
.libmgr-tags-wrap { display:flex; flex-wrap:wrap; gap:4px; }
.libmgr-tag { padding:2px 8px; background:var(--accent-muted); color:var(--accent); border-radius:10px; font-size:11px; }
.libmgr-bio { font-size:var(--text-sm); color:var(--text-secondary); line-height:1.6; max-height:120px; overflow:hidden; position:relative; }
.libmgr-bio::after { content:''; position:absolute; bottom:0; left:0; right:0; height:32px; background:linear-gradient(transparent, var(--bg-primary)); }
.libmgr-bio.expanded { max-height:none; }
.libmgr-bio.expanded::after { display:none; }
.libmgr-bio-toggle { font-size:11px; color:var(--accent); cursor:pointer; margin-top:4px; display:inline-block; }
.libmgr-albums-section { margin-top:12px; border-top:1px solid var(--border); padding-top:12px; }
.libmgr-albums-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; }
.libmgr-album-row { display:flex; align-items:center; gap:8px; padding:5px 0; border-bottom:1px solid var(--bg-secondary); }
.libmgr-album-thumb { width:32px; height:32px; border-radius:2px; object-fit:cover; background:var(--bg-tertiary); }
.libmgr-album-name { flex:1; font-size:var(--text-sm); }
.libmgr-album-write { padding:2px 7px; font-size:11px; background:none; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; color:var(--text-muted); }
.libmgr-album-write:hover { background:var(--accent-light); border-color:var(--accent); color:var(--accent); }

/* Diff modal */
.libmgr-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000; display:flex; align-items:center; justify-content:center; }
.libmgr-modal { background:var(--bg-primary); border-radius:var(--radius-xl); box-shadow:var(--shadow-lg); width:min(720px,96vw); max-height:85vh; display:flex; flex-direction:column; overflow:hidden; }
.libmgr-modal-hdr { display:flex; align-items:center; padding:14px 18px; border-bottom:1px solid var(--border); flex-shrink:0; }
.libmgr-modal-hdr h3 { flex:1; margin:0; font-size:var(--text-base); font-weight:600; }
.libmgr-modal-src { font-size:11px; color:var(--text-muted); margin-right:12px; }
.libmgr-modal-close { padding:3px 9px; background:none; border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; font-size:16px; color:var(--text-muted); }
.libmgr-modal-close:hover { background:var(--bg-secondary); }
.libmgr-diff-table { width:100%; border-collapse:collapse; overflow-y:auto; flex:1; display:block; }
.libmgr-diff-table thead { display:table; width:100%; table-layout:fixed; }
.libmgr-diff-table tbody { display:block; max-height:420px; overflow-y:auto; }
.libmgr-diff-table tr { display:table; width:100%; table-layout:fixed; }
.libmgr-diff-table th { padding:8px 12px; background:var(--bg-secondary); border-bottom:2px solid var(--border); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); text-align:left; }
.libmgr-diff-table td { padding:8px 12px; font-size:var(--text-sm); border-bottom:1px solid var(--border); vertical-align:top; }
.diff-row-changed { background:rgba(245,158,11,.06); }
.diff-row-same    { opacity:.55; }
.diff-cur  { color:var(--text-secondary); }
.diff-new  { color:var(--green); font-weight:500; }
.diff-tag  { display:inline-block; padding:1px 6px; border-radius:8px; font-size:11px; margin:1px; }
.diff-tag-added   { background:var(--green-bg); color:var(--green); }
.diff-tag-removed { background:var(--red-bg); color:var(--red); text-decoration:line-through; }
.diff-tag-same    { background:var(--bg-secondary); color:var(--text-muted); }
.diff-check { width:16px; height:16px; cursor:pointer; }
.libmgr-modal-ftr { display:flex; justify-content:flex-end; gap:8px; padding:12px 18px; border-top:1px solid var(--border); flex-shrink:0; }
.libmgr-modal-cancel  { padding:7px 16px; background:var(--bg-secondary); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; font-size:var(--text-sm); }
.libmgr-modal-confirm { padding:7px 16px; background:var(--accent); color:#fff; border:none; border-radius:var(--radius-md); cursor:pointer; font-size:var(--text-sm); }
.libmgr-modal-confirm:disabled { opacity:.5; cursor:not-allowed; }

/* Loading / empty states */
.libmgr-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; gap:10px; color:var(--text-muted); font-size:var(--text-sm); }
.libmgr-spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:libmgr-spin .7s linear infinite; }
@keyframes libmgr-spin { to { transform:rotate(360deg); } }
`,document.head.appendChild(r)}async function he(){Y();let r=document.getElementById("content");r.innerHTML=Z(),ge(),await Promise.all([ee(),te()])}function Z(){return`
<div class="libmgr" id="libmgr-root">
  <div class="libmgr-header">
    <h2 class="libmgr-title">\u{1F4DA} Library Manager</h2>
    <div class="libmgr-mode-group">
      <button class="libmgr-mode-btn" data-mode="standard">Standaard</button>
      <button class="libmgr-mode-btn active" data-mode="enhanced">Uitgebreid</button>
    </div>
    <input class="libmgr-search" id="libmgr-search" type="search" placeholder="Zoek artiest\u2026" autocomplete="off">
    <span class="libmgr-stats" id="libmgr-stats"></span>
    <button class="libmgr-settings-btn" id="libmgr-settings-btn" title="Instellingen">\u2699 Instellingen</button>
  </div>

  <div id="libmgr-settings-panel" style="display:none;position:relative;">
    <div class="libmgr-settings-panel">
      <h4>Multi-artiest instellingen</h4>
      <div class="libmgr-settings-row">
        <label>Artiest-separator</label>
        <select id="libmgr-sep">
          <option value=", ">Komma (, )</option>
          <option value="; ">Puntkomma (; )</option>
          <option value=" / ">Slash ( / )</option>
        </select>
      </div>
      <div class="libmgr-settings-row">
        <label>Featured artiest naar titel verplaatsen</label>
        <input type="checkbox" id="libmgr-feat">
      </div>
      <button class="libmgr-settings-save" id="libmgr-settings-save">Opslaan</button>
    </div>
  </div>

  <div class="libmgr-body" id="libmgr-body">
    <div class="libmgr-table-wrap">
      <table class="libmgr-table">
        <thead>
          <tr>
            <th class="libmgr-td-thumb"></th>
            <th class="sortable sort-active" data-col="name">Artiest <span id="libmgr-sort-name">\u2191</span></th>
            <th class="sortable" data-col="albumCount">Albums <span id="libmgr-sort-albumCount"></span></th>
            <th>Genres</th>
            <th class="sortable" data-col="enrichmentCoverage">Coverage <span id="libmgr-sort-enrichmentCoverage"></span></th>
            <th>Acties</th>
          </tr>
        </thead>
        <tbody id="libmgr-tbody">
          <tr><td colspan="6"><div class="libmgr-loading"><div class="libmgr-spinner"></div><span>Bibliotheek laden\u2026</span></div></td></tr>
        </tbody>
      </table>
    </div>

    <div class="libmgr-panel" id="libmgr-panel">
      <div class="libmgr-panel-header">
        <img class="libmgr-panel-thumb" id="libmgr-panel-thumb" src="" alt="">
        <div class="libmgr-panel-info">
          <div class="libmgr-panel-name" id="libmgr-panel-name"></div>
          <div class="libmgr-panel-meta" id="libmgr-panel-meta"></div>
        </div>
        <button class="libmgr-panel-close" id="libmgr-panel-close">\xD7</button>
      </div>
      <div class="libmgr-panel-actions">
        <button class="libmgr-panel-btn primary" id="libmgr-btn-enrich">\u{1F504} Herverrijk artiest</button>
        <button class="libmgr-panel-btn" id="libmgr-btn-save-manual">\u{1F4BE} Handmatige edit opslaan</button>
      </div>
      <div class="libmgr-source-tabs" id="libmgr-source-tabs"></div>
      <div class="libmgr-source-content" id="libmgr-source-content">
        <div class="libmgr-source-empty">Selecteer een artiest om de details te zien.</div>
      </div>
    </div>
  </div>

  <div class="libmgr-overlay" id="libmgr-overlay" style="display:none;">
    <div class="libmgr-modal">
      <div class="libmgr-modal-hdr">
        <h3>Tags Preview</h3>
        <span class="libmgr-modal-src" id="libmgr-modal-src"></span>
        <button class="libmgr-modal-close" id="libmgr-modal-close">\xD7</button>
      </div>
      <table class="libmgr-diff-table">
        <thead><tr>
          <th style="width:20%">Veld</th>
          <th style="width:33%">Huidig</th>
          <th style="width:33%">Voorgesteld</th>
          <th style="width:14%">Accepteren</th>
        </tr></thead>
        <tbody id="libmgr-diff-tbody"></tbody>
      </table>
      <div class="libmgr-modal-ftr">
        <button class="libmgr-modal-cancel" id="libmgr-modal-cancel">Annuleren</button>
        <button class="libmgr-modal-confirm" id="libmgr-modal-confirm">Tags Schrijven</button>
      </div>
    </div>
  </div>
</div>`}async function ee(){try{C=(await u("/api/library/artists")).artists||[],K()}catch(r){let e=document.getElementById("libmgr-tbody");e&&(e.innerHTML=`<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--red)">Fout bij laden: ${n(r.message)}</td></tr>`)}}async function te(){try{I=await u("/api/library/settings");let r=document.getElementById("libmgr-sep"),e=document.getElementById("libmgr-feat");r&&(r.value=I.artist_separator||", "),e&&(e.checked=!!I.feat_to_title)}catch{}}async function N(r){let e=document.getElementById("libmgr-source-content");e&&(e.innerHTML='<div class="libmgr-loading"><div class="libmgr-spinner"></div><span>Laden\u2026</span></div>');try{p=await u(`/api/library/artist/${encodeURIComponent(r)}`),h=U.find(t=>p.enrichmentData?.[t])||"lastfm",ae()}catch(t){e&&(e.innerHTML=`<div class="libmgr-source-empty">Fout: ${n(t.message)}</div>`)}}function K(){let r=q.toLowerCase().trim();$=r?C.filter(e=>e.name.toLowerCase().includes(r)):[...C],G(),J(),re()}function G(){$.sort((r,e)=>{let t=r[z]??"",i=e[z]??"";return typeof t=="number"?(t-i)*S:String(t).localeCompare(String(i),"nl",{sensitivity:"base"})*S})}function re(){let r=document.getElementById("libmgr-stats");r&&(r.textContent=`${$.length} artiesten \xB7 ${C.reduce((e,t)=>e+t.albumCount,0)} albums`)}function J(){let r=document.getElementById("libmgr-tbody");if(!r)return;if(!$.length){r.innerHTML='<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--text-muted)">Geen artiesten gevonden.</td></tr>';return}let e=$.map(t=>{let i=t.name===f,d=t.thumb?`/api/plex/thumb?path=${encodeURIComponent(t.thumb)}`:"",l=d?`<img class="libmgr-thumb" src="${n(d)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'<div class="libmgr-thumb" style="background:var(--bg-tertiary)"></div>',c=t.genres.map(m=>`<span class="libmgr-genre-tag">${n(m)}</span>`).join(""),a=ie(t.enrichmentCoverage,t.enrichmentTotal);return`
<tr class="${i?"selected":""}" data-artist="${n(t.name)}">
  <td class="libmgr-td-thumb">${l}</td>
  <td>
    <div class="libmgr-name-cell">${n(t.name)}</div>
    <div class="libmgr-album-count">${t.albumCount} album${t.albumCount!==1?"s":""}</div>
  </td>
  <td>${t.albumCount}</td>
  <td>${c||'<span style="color:var(--text-muted);font-size:11px">\u2014</span>'}</td>
  <td>
    <div class="libmgr-ring-wrap">
      ${a}
      <span class="libmgr-ring-label">${t.enrichmentCoverage}/${t.enrichmentTotal}</span>
    </div>
  </td>
  <td>
    <div class="libmgr-actions">
      <button class="libmgr-action-btn" data-action="enrich" data-artist="${n(t.name)}" title="Herverrijk">\u{1F504}</button>
    </div>
  </td>
</tr>`});r.innerHTML=e.join("")}function ie(r,e){let t=e>0?r/e:0,i=14,d=2*Math.PI*i,l=d*t,c=t>=.7?"var(--green)":t>=.4?"#f59e0b":t>0?"var(--accent)":"var(--border)";return`<svg class="libmgr-ring" width="36" height="36" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="${i}" fill="none" stroke="var(--border)" stroke-width="3"/>
  <circle cx="18" cy="18" r="${i}" fill="none" stroke="${c}" stroke-width="3"
    stroke-dasharray="${l.toFixed(2)} ${(d-l).toFixed(2)}"
    stroke-linecap="round" transform="rotate(-90 18 18)"/>
  <text x="18" y="22" text-anchor="middle" font-size="9" fill="currentColor">${Math.round(t*100)}%</text>
</svg>`}function ae(){if(!p)return;let{name:r,albums:e,enrichmentData:t}=p,i=document.getElementById("libmgr-panel-thumb"),d=document.getElementById("libmgr-panel-name"),l=document.getElementById("libmgr-panel-meta");d&&(d.textContent=r),l&&(l.textContent=`${e.length} album${e.length!==1?"s":""}`);let c=e.find(a=>a.thumb)?.thumb;i&&(i.src=c?`/api/plex/thumb?path=${encodeURIComponent(c)}`:"",i.style.display=c?"":"none"),V(t),X(t)}function V(r){let e=document.getElementById("libmgr-source-tabs");if(!e)return;let t=[...U,"manual"];e.innerHTML=t.map(i=>{let d=!!r?.[i],l=A[i]||"Handmatig",c=W[i]||"\u270F\uFE0F";return`<button class="libmgr-source-tab${i===h?" active":""}"
      data-source="${n(i)}">
      <span class="tab-dot ${d?"has-data":"no-data"}"></span>
      ${c} ${n(l)}
    </button>`}).join("")}function X(r){let e=document.getElementById("libmgr-source-content");if(!e)return;let t=r?.[h];if(h==="manual"){e.innerHTML=ne(t,r);return}if(!t){e.innerHTML=`<div class="libmgr-source-empty">Geen data beschikbaar voor ${n(A[h]||h)}.<br><br>
      <button class="libmgr-panel-btn" data-action="enrich" data-artist="${n(f)}">\u{1F504} Verrijken via deze bron</button></div>`;return}let i=de();e.innerHTML=le(t)+i}function ne(r,e){let t=oe(e),i=r||{};return`<div style="padding:4px 0">
    <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:12px">
      Handmatige velden overschrijven alle andere bronnen. Dubbelklik op een veld om te bewerken.
    </p>
    <div class="libmgr-field-grid">
      ${[{key:"name",label:"Naam",val:i.name||t.name||""},{key:"genres",label:"Genres",val:(i.genres||t.genres||[]).join(", ")},{key:"tags",label:"Tags",val:(i.tags||t.tags||[]).join(", ")},{key:"summary",label:"Biografie",val:i.summary||t.summary||""},{key:"country",label:"Land",val:i.country||t.country||""},{key:"formed",label:"Opgericht",val:i.formed||t.formed||""}].map(l=>`
        <div class="libmgr-field-row">
          <div class="libmgr-field-key">${n(l.label)}</div>
          <div class="libmgr-field-val editable" contenteditable="false"
            data-edit-key="${n(l.key)}" data-edit-original="${n(l.val)}"
          >${n(l.val)||'<span style="color:var(--text-muted);font-style:italic">Leeg</span>'}</div>
        </div>`).join("")}
    </div>
  </div>`}function oe(r){let e={};for(let t of["musicbrainz","lastfm","audiodb","discogs","deezer","spotify"]){let i=r?.[t];if(!i)continue;!e.name&&i.name&&(e.name=i.name),!e.summary&&(i.summary||i.biography||i.bio?.content)&&(e.summary=i.summary||i.biography||i.bio?.content),!e.country&&i.country&&(e.country=i.country),!e.formed&&(i.formed||i.beginDate)&&(e.formed=i.formed||i.beginDate);let d=i.genres||i.tags||[];!e.genres&&d.length&&(e.genres=(Array.isArray(d)?d:[]).map(l=>typeof l=="string"?l:l.name||l.tag||"").filter(Boolean))}return e}function le(r){if(!r||typeof r!="object")return'<div class="libmgr-source-empty">Geen data</div>';let e=["_updatedAt","_stale","id","mbid","url","image","images","similar"],t=[],i=["name","country","formed","disbanded","genres","tags","style","mood","listeners","playcount","popularity","followers"],d=Object.keys(r),l=[...new Set([...i.filter(m=>d.includes(m)),...d])];for(let m of l){if(e.includes(m))continue;let g=r[m];if(g==null||g==="")continue;let k=m.replace(/_/g," ").replace(/\b\w/g,_=>_.toUpperCase());t.push(`<div class="libmgr-field-row">
      <div class="libmgr-field-key">${n(k)}</div>
      <div class="libmgr-field-val">${se(m,g)}</div>
    </div>`)}let c=r.biography||r.bio?.content||r.summary||r.profile,a=c?`
    <div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">
      <div class="libmgr-field-key" style="margin-bottom:6px">Biografie</div>
      <div class="libmgr-bio" id="libmgr-bio">${n(ce(c)).replace(/\n/g,"<br>")}</div>
      <span class="libmgr-bio-toggle" id="libmgr-bio-toggle">Meer tonen \u25BE</span>
    </div>`:"";return`<div class="libmgr-field-grid">${t.join("")}</div>${a}`}function se(r,e){if(Array.isArray(e)){if(!e.length)return'<span style="color:var(--text-muted)">\u2014</span>';let t=e.map(i=>typeof i=="string"?i:i.name||i.tag||i.title||JSON.stringify(i)).filter(Boolean);return["genres","tags","styles","moods"].includes(r)?`<div class="libmgr-tags-wrap">${t.map(i=>`<span class="libmgr-tag">${n(i)}</span>`).join("")}</div>`:n(t.slice(0,8).join(", "))}return typeof e=="object"?n(JSON.stringify(e).slice(0,120)):typeof e=="number"&&e>1e6?n(e.toLocaleString("nl")):n(String(e))}function de(){if(!p?.albums?.length)return"";let r=p.albums.slice(0,12).map(e=>{let t=e.thumb?`/api/plex/thumb?path=${encodeURIComponent(e.thumb)}`:"";return`<div class="libmgr-album-row">
      ${t?`<img class="libmgr-album-thumb" src="${n(t)}" alt="" loading="lazy" onerror="this.style.display='none'">`:'<div class="libmgr-album-thumb"></div>'}
      <div class="libmgr-album-name">${n(e.album)}</div>
      ${e.ratingKey?`<button class="libmgr-album-write" data-action="tag-preview" data-key="${n(e.ratingKey)}" data-type="album" title="Tags bekijken">\u{1F3F7} Tags</button>`:""}
    </div>`});return`<div class="libmgr-albums-section">
    <div class="libmgr-albums-title">Albums in Plex (${p.albums.length})</div>
    ${r.join("")}
  </div>`}function ce(r){return String(r).replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim().slice(0,1500)}async function P(r,e="album"){let t=document.getElementById("libmgr-overlay"),i=document.getElementById("libmgr-diff-tbody"),d=document.getElementById("libmgr-modal-src"),l=document.getElementById("libmgr-modal-confirm");if(!(!t||!i)){t.style.display="flex",i.innerHTML='<tr><td colspan="4" style="padding:20px;text-align:center"><div class="libmgr-spinner" style="margin:auto"></div></td></tr>',l&&(l.disabled=!0);try{let c=await u(`/api/library/tag-preview/${r}?type=${e}`);x={ratingKey:r,type:e,diff:c.diff,proposed:c.proposed},T={},c.diff.forEach(a=>{T[a.field]=a.changed}),d&&c.proposedSource&&(d.textContent=`Bron: ${A[c.proposedSource]||c.proposedSource}`),i.innerHTML=c.diff.map(a=>{let m=a.changed?"diff-row-changed":"diff-row-same",g=a.field==="genres"?be(a.current,a.proposed):a.changed?`<span class="diff-new">${n(a.proposed)||"\u2014"}</span>`:n(a.current)||"\u2014";return`<tr class="${m}">
        <td><strong>${n(a.label)}</strong></td>
        <td class="diff-cur">${n(a.current)||"\u2014"}</td>
        <td>${g}</td>
        <td><input type="checkbox" class="diff-check" data-field="${n(a.field)}"
          ${T[a.field]?"checked":""} ${a.changed?"":"disabled"}></td>
      </tr>`}).join(""),l&&(l.disabled=!1)}catch(c){i.innerHTML=`<tr><td colspan="4" style="padding:16px;color:var(--red)">Fout: ${n(c.message)}</td></tr>`}}}function be(r,e){let t=r.split(",").map(a=>a.trim()).filter(Boolean),i=e.split(",").map(a=>a.trim()).filter(Boolean),d=new Set(t),l=new Set(i);return[...new Set([...t,...i])].map(a=>`<span class="diff-tag ${d.has(a)?l.has(a)?"diff-tag-same":"diff-tag-removed":"diff-tag-added"}">${n(a)}</span>`).join("")}async function me(){if(!x)return;let r=document.getElementById("libmgr-modal-confirm");r&&(r.disabled=!0,r.textContent="Bezig\u2026");let e={};if(document.querySelectorAll(".diff-check").forEach(t=>{if(t.checked&&x.proposed){let i=t.dataset.field,d=x.proposed[i];d!==void 0&&(e[i]=d)}}),!Object.keys(e).length){E();return}try{let t=x.type==="album"?`/api/library/album/${x.ratingKey}/retag`:`/api/library/track/${x.ratingKey}/retag`;await u(t,{method:"POST",body:JSON.stringify({fields:e}),headers:{"Content-Type":"application/json"}}),E(),y("Tags succesvol geschreven \u2713")}catch(t){y(`Fout: ${t.message}`,"error"),r&&(r.disabled=!1,r.textContent="Tags Schrijven")}}function E(){let r=document.getElementById("libmgr-overlay");r&&(r.style.display="none"),x=null}function ge(){let r=document.getElementById("libmgr-root");if(!r)return;r.querySelectorAll(".libmgr-mode-btn").forEach(s=>{s.addEventListener("click",()=>{s.dataset.mode==="standard"&&(window.location.hash="bibliotheek")})});let e=document.getElementById("libmgr-search");e&&e.addEventListener("input",s=>{q=s.target.value,K()});let t=document.getElementById("libmgr-tbody");t&&t.addEventListener("click",async s=>{let o=s.target.closest("[data-action]");if(o){let{action:v,artist:B,key:F,type:Q}=o.dataset;v==="enrich"&&B?await M(B):v==="tag-preview"&&F&&await P(F,Q||"album");return}let b=s.target.closest("tr[data-artist]");b&&pe(b.dataset.artist)});let i=document.getElementById("libmgr-panel-close");i&&i.addEventListener("click",ue);let d=document.getElementById("libmgr-source-tabs");d&&d.addEventListener("click",s=>{let o=s.target.closest("[data-source]");o&&(h=o.dataset.source,V(p?.enrichmentData),X(p?.enrichmentData))});let l=document.getElementById("libmgr-btn-enrich");l&&l.addEventListener("click",()=>f&&M(f));let c=document.getElementById("libmgr-btn-save-manual");c&&c.addEventListener("click",fe);let a=document.getElementById("libmgr-source-content");a&&(a.addEventListener("click",async s=>{if(s.target.id==="libmgr-bio-toggle"){let b=document.getElementById("libmgr-bio");b&&(b.classList.toggle("expanded"),s.target.textContent=b.classList.contains("expanded")?"Minder tonen \u25B4":"Meer tonen \u25BE")}let o=s.target.closest("[data-action]");if(o){let{action:b,key:v,type:B}=o.dataset;b==="tag-preview"&&v&&await P(v,B||"album"),b==="enrich"&&o.dataset.artist&&await M(o.dataset.artist)}}),a.addEventListener("dblclick",s=>{let o=s.target.closest("[data-edit-key]");if(o){o.contentEditable="true",o.focus();let b=document.createRange();b.selectNodeContents(o);let v=window.getSelection();v?.removeAllRanges(),v?.addRange(b)}}),a.addEventListener("keydown",s=>{if(s.key==="Escape"){let o=s.target.closest('[contenteditable="true"]');o&&(o.contentEditable="false",o.textContent=o.dataset.editOriginal||"")}s.key==="Enter"&&!s.shiftKey&&(s.preventDefault(),s.target.closest('[contenteditable="true"]')?.blur())}),a.addEventListener("blur",s=>{let o=s.target.closest("[data-edit-key]");o&&o.contentEditable==="true"&&(o.contentEditable="false",o.dataset.editOriginal=o.textContent)},!0));let m=r.querySelector("thead");m&&m.addEventListener("click",s=>{let o=s.target.closest("[data-col]");if(!o)return;let b=o.dataset.col;z===b?S*=-1:(z=b,S=1),ve(),G(),J()});let g=document.getElementById("libmgr-settings-btn"),k=document.getElementById("libmgr-settings-panel");g&&k&&g.addEventListener("click",()=>{w=!w,k.style.display=w?"block":"none",g.classList.toggle("active",w)});let _=document.getElementById("libmgr-settings-save");_&&_.addEventListener("click",async()=>{let s=document.getElementById("libmgr-sep")?.value,o=document.getElementById("libmgr-feat")?.checked;try{await u("/api/library/settings",{method:"POST",body:JSON.stringify({artist_separator:s,feat_to_title:o}),headers:{"Content-Type":"application/json"}}),I={artist_separator:s,feat_to_title:o},y("Instellingen opgeslagen \u2713"),k&&(k.style.display="none"),w=!1}catch(b){y(`Fout: ${b.message}`,"error")}});let O=document.getElementById("libmgr-modal-close"),H=document.getElementById("libmgr-modal-cancel"),D=document.getElementById("libmgr-modal-confirm");O&&O.addEventListener("click",E),H&&H.addEventListener("click",E),D&&D.addEventListener("click",me);let L=document.getElementById("libmgr-overlay");L&&L.addEventListener("click",s=>{s.target===L&&E()})}function pe(r){f=r,document.querySelectorAll("#libmgr-tbody tr").forEach(t=>{t.classList.toggle("selected",t.dataset.artist===r)});let e=document.getElementById("libmgr-body");e&&e.classList.add("libmgr-panel-open"),N(r)}function ue(){f=null,p=null;let r=document.getElementById("libmgr-body");r&&r.classList.remove("libmgr-panel-open"),document.querySelectorAll("#libmgr-tbody tr").forEach(e=>e.classList.remove("selected"))}async function M(r){try{await u(`/api/core/enrichment/queue/artist/${encodeURIComponent(r)}`,{method:"POST"}),y(`${r} toegevoegd aan enrichment-queue \u2713`)}catch(e){y(`Fout: ${e.message}`,"error")}}async function fe(){if(!f)return;let r={};if(document.querySelectorAll("[data-edit-key]").forEach(e=>{let t=e.textContent.trim();t&&(r[e.dataset.editKey]=t)}),!!Object.keys(r).length)try{await u(`/api/library/artist/${encodeURIComponent(f)}/edit`,{method:"POST",body:JSON.stringify(r),headers:{"Content-Type":"application/json"}}),y("Handmatige edit opgeslagen \u2713"),await N(f)}catch(e){y(`Fout: ${e.message}`,"error")}}function ve(){["name","albumCount","enrichmentCoverage"].forEach(r=>{let e=document.getElementById(`libmgr-sort-${r}`),t=document.querySelector(`[data-col="${r}"]`);e&&(r===z?(e.textContent=S===1?"\u2191":"\u2193",t?.classList.add("sort-active")):(e.textContent="",t?.classList.remove("sort-active")))})}var R;function y(r,e="ok"){let t=document.getElementById("libmgr-toast");t||(t=document.createElement("div"),t.id="libmgr-toast",t.style.cssText="position:fixed;bottom:24px;right:24px;padding:10px 18px;border-radius:6px;font-size:13px;z-index:9999;transition:opacity .3s;pointer-events:none;",document.body.appendChild(t)),t.textContent=r,t.style.background=e==="error"?"var(--red)":"var(--green)",t.style.color="#fff",t.style.opacity="1",clearTimeout(R),R=setTimeout(()=>{t.style.opacity="0"},3e3)}export{he as loadLibraryEnhanced};
