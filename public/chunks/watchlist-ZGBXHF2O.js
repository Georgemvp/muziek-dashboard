import"./chunk-JLD3JF2U.js";import{f as y,h as s,j as b,z as i}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var f=[],p=[],k=null,u=new Set;function I(e){if(!e)return"\u2014";let a=new Date(e*1e3);return isNaN(a)?"\u2014":a.toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"})}function L(e){if(!e)return"\u2014";let a=new Date(e);if(isNaN(a))return e;let l=Math.floor((new Date-a)/864e5);return l<0?`Over ${Math.abs(l)}d`:l===0?"Vandaag":l===1?"Gisteren":l<7?`${l}d geleden`:l<30?`${Math.floor(l/7)}w geleden`:a.toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"})}function B(e){switch((e||"").toLowerCase()){case"single":return"Single";case"ep":return"EP";default:return"Album"}}function q(e){switch((e||"").toLowerCase()){case"single":return"wl-badge-single";case"ep":return"wl-badge-ep";default:return"wl-badge-album"}}function S(e){switch(e){case"downloaded":return"\u2193 Gedownload";case"skipped":return"\u2717 Overgeslagen";case"in_library":return"\u2713 In bibliotheek";default:return"\u25CF Nieuw"}}function E(e){switch(e){case"downloaded":return"wl-status-downloaded";case"skipped":return"wl-status-skipped";case"in_library":return"wl-status-library";default:return"wl-status-new"}}async function w(){try{f=(await i("/api/watchlist")).items||[],A()}catch(e){N("Kon watchlist niet laden: "+e.message)}}async function C(e){try{return(await i(`/api/watchlist/${e}/releases`)).releases||[]}catch{return[]}}async function T(e){try{p=(await i(`/api/watchlist/search?q=${encodeURIComponent(e)}`)).results||[],$()}catch{p=[],$()}}function j(){return document.getElementById("watchlist-view")}function N(e){let a=document.getElementById("wl-error");a&&(a.textContent=e,a.hidden=!1)}function A(){let e=document.getElementById("wl-list");if(e){if(f.length===0){e.innerHTML=`
      <div class="wl-empty">
        <div class="wl-empty-icon">\u{1F441}</div>
        <p>Je watchlist is leeg.</p>
        <p>Zoek een artiest hierboven om te beginnen.</p>
      </div>`;return}e.innerHTML=f.map(a=>O(a)).join(""),u.forEach(a=>{let t=document.getElementById(`wl-detail-${a}`);t&&(t.hidden=!1)})}}function O(e){let a=e.new_release_count||0,t=u.has(e.id),l=[e.watch_albums?"Albums":null,e.watch_eps?"EPs":null,e.watch_singles?"Singles":null].filter(Boolean).join(", ")||"Niets",o=[e.exclude_live?"live":null,e.exclude_remixes?"remixes":null,e.exclude_compilations?"compilaties":null].filter(Boolean);return`
    <div class="wl-card" id="wl-card-${e.id}" data-id="${e.id}">
      <div class="wl-card-header">
        <div class="wl-artist-thumb">
          <div class="wl-artist-initial" style="background:${b(e.artist_name)}">
            ${s(y(e.artist_name))}
          </div>
        </div>
        <div class="wl-card-info">
          <div class="wl-artist-name">${s(e.artist_name)}</div>
          <div class="wl-config-summary">${s(l)}${o.length?` \xB7 geen ${o.join(", ")}`:""}</div>
          <div class="wl-meta">
            Gescand: ${e.last_scanned?I(e.last_scanned):"Nog niet"}
            ${e.auto_download?' \xB7 <span class="wl-auto-dl">\u2193 Auto-download</span>':""}
          </div>
        </div>
        <div class="wl-card-actions">
          ${a>0?`<span class="wl-new-badge">${a} nieuw</span>`:'<span class="wl-uptodate">Up to date</span>'}
          <button class="wl-btn-sm wl-btn-expand" data-id="${e.id}" title="${t?"Inklappen":"Uitklappen"}">
            ${t?"\u25B2":"\u25BC"}
          </button>
          <button class="wl-btn-sm wl-btn-edit" data-id="${e.id}" title="Bewerken">\u270E</button>
          <button class="wl-btn-sm wl-btn-scan" data-id="${e.id}" title="Nu scannen">\u21BB</button>
          <button class="wl-btn-sm wl-btn-delete wl-btn-danger" data-id="${e.id}" title="Verwijderen">\u2715</button>
        </div>
      </div>
      <div class="wl-card-detail" id="wl-detail-${e.id}" ${t?"":"hidden"}>
        <div class="wl-releases-loading" id="wl-releases-loading-${e.id}">Releases laden\u2026</div>
        <div class="wl-releases-list" id="wl-releases-list-${e.id}"></div>
      </div>
    </div>`}async function z(e){let a=document.getElementById(`wl-releases-list-${e}`),t=document.getElementById(`wl-releases-loading-${e}`);if(!a)return;t&&(t.hidden=!1);let l=await C(e);if(t&&(t.hidden=!0),l.length===0){a.innerHTML='<div class="wl-releases-empty">Geen releases gevonden.</div>';return}a.innerHTML=`
    <div class="wl-releases-grid">
      ${l.map(o=>`
        <div class="wl-release-item ${o.status==="in_library"?"wl-release-in-library":""}" data-release-id="${o.id}">
          <div class="wl-release-cover">
            ${o.cover_url?`<img src="${s(o.cover_url)}" alt="${s(o.release_title)}" loading="lazy" onerror="this.style.display='none'">`:`<div class="wl-release-cover-ph" style="background:${b(o.release_title)}">\u266B</div>`}
          </div>
          <div class="wl-release-info">
            <div class="wl-release-title">${s(o.release_title)}</div>
            <div class="wl-release-meta">
              <span class="wl-badge ${q(o.release_type)}">${B(o.release_type)}</span>
              <span class="wl-release-date">${L(o.release_date)}</span>
            </div>
            <div class="wl-release-status">
              <span class="wl-status-dot ${E(o.status)}">${S(o.status)}</span>
            </div>
          </div>
          <div class="wl-release-actions">
            ${o.status==="new"?`<button class="wl-btn-sm wl-btn-skip" data-release-id="${o.id}" title="Overslaan">\u2717</button>`:""}
            ${o.status!=="in_library"&&o.status!=="downloaded"?`<button class="wl-btn-sm wl-btn-download-release" data-release-id="${o.id}" data-title="${s(o.release_title)}" title="Downloaden">\u2193</button>`:""}
          </div>
        </div>`).join("")}
    </div>`}function $(){let e=document.getElementById("wl-search-dropdown");if(e){if(p.length===0){e.hidden=!0;return}e.innerHTML=p.map(a=>`
    <button class="wl-search-result" data-name="${s(a.name)}">
      <span class="wl-search-result-icon">${a.source==="plex"?"\u{1F4DA}":"\u266B"}</span>
      <span class="wl-search-result-name">${s(a.name)}</span>
      <span class="wl-search-result-source">${a.source==="plex"?"Plex":"Last.fm"}</span>
    </button>`).join(""),e.hidden=!1}}function D(e){let a=document.getElementById("wl-config-modal");a&&a.remove();let t=document.createElement("div");t.id="wl-config-modal",t.className="wl-modal-overlay",t.innerHTML=`
    <div class="wl-modal">
      <div class="wl-modal-header">
        <h2 class="wl-modal-title">Instellingen \u2014 ${s(e.artist_name)}</h2>
        <button class="wl-modal-close" id="wl-modal-close">\u2715</button>
      </div>
      <div class="wl-modal-body">
        <div class="wl-config-section">
          <div class="wl-config-label">Release-types monitoren</div>
          <div class="wl-toggles">
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-albums" ${e.watch_albums?"checked":""}>
              <span class="wl-toggle-track"></span>
              Albums
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-eps" ${e.watch_eps?"checked":""}>
              <span class="wl-toggle-track"></span>
              EPs
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-singles" ${e.watch_singles?"checked":""}>
              <span class="wl-toggle-track"></span>
              Singles
            </label>
          </div>
        </div>
        <div class="wl-config-section">
          <div class="wl-config-label">Uitsluitingen</div>
          <div class="wl-toggles">
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-excl-live" ${e.exclude_live?"checked":""}>
              <span class="wl-toggle-track"></span>
              Live-albums uitsluiten
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-excl-remix" ${e.exclude_remixes?"checked":""}>
              <span class="wl-toggle-track"></span>
              Remixes uitsluiten
            </label>
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-excl-comp" ${e.exclude_compilations?"checked":""}>
              <span class="wl-toggle-track"></span>
              Compilaties uitsluiten
            </label>
          </div>
        </div>
        <div class="wl-config-section">
          <div class="wl-config-label">Automatisch downloaden</div>
          <div class="wl-toggles">
            <label class="wl-toggle">
              <input type="checkbox" id="cfg-auto-dl" ${e.auto_download?"checked":""}>
              <span class="wl-toggle-track"></span>
              Nieuwe releases automatisch downloaden
            </label>
          </div>
          <div class="wl-config-row" id="cfg-quality-row" ${e.auto_download?"":"hidden"}>
            <label class="wl-config-sublabel" for="cfg-quality">Download-kwaliteit</label>
            <select id="cfg-quality" class="wl-select">
              ${["flac","hifi","lossless","high","low","atmos"].map(l=>`<option value="${l}" ${e.download_quality===l?"selected":""}>${l.toUpperCase()}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="wl-config-section">
          <div class="wl-config-label">Scan-interval</div>
          <div class="wl-config-row">
            <select id="cfg-interval" class="wl-select">
              ${[6,12,24,48,168].map(l=>`<option value="${l}" ${e.scan_interval_hours===l?"selected":""}>${l>=168?"1 week":l+" uur"}</option>`).join("")}
            </select>
          </div>
        </div>
        <div class="wl-config-section">
          <label class="wl-config-label" for="cfg-notes">Notities</label>
          <textarea id="cfg-notes" class="wl-textarea" rows="2" placeholder="Optionele notities...">${s(e.notes||"")}</textarea>
        </div>
      </div>
      <div class="wl-modal-footer">
        <button class="wl-btn wl-btn-secondary" id="wl-modal-cancel">Annuleren</button>
        <button class="wl-btn wl-btn-primary" id="wl-modal-save" data-id="${e.id}">Opslaan</button>
      </div>
    </div>`,document.body.appendChild(t),t.querySelector("#cfg-auto-dl").addEventListener("change",l=>{t.querySelector("#cfg-quality-row").hidden=!l.target.checked}),t.querySelector("#wl-modal-close").addEventListener("click",()=>t.remove()),t.querySelector("#wl-modal-cancel").addEventListener("click",()=>t.remove()),t.addEventListener("click",l=>{l.target===t&&t.remove()}),t.querySelector("#wl-modal-save").addEventListener("click",async()=>{let l={watch_albums:t.querySelector("#cfg-albums").checked?1:0,watch_eps:t.querySelector("#cfg-eps").checked?1:0,watch_singles:t.querySelector("#cfg-singles").checked?1:0,exclude_live:t.querySelector("#cfg-excl-live").checked?1:0,exclude_remixes:t.querySelector("#cfg-excl-remix").checked?1:0,exclude_compilations:t.querySelector("#cfg-excl-comp").checked?1:0,auto_download:t.querySelector("#cfg-auto-dl").checked?1:0,download_quality:t.querySelector("#cfg-quality").value,scan_interval_hours:parseInt(t.querySelector("#cfg-interval").value,10),notes:t.querySelector("#cfg-notes").value};try{await i(`/api/watchlist/${e.id}`,{method:"PUT",body:JSON.stringify(l)}),t.remove(),await w()}catch(o){alert("Opslaan mislukt: "+o.message)}})}async function _(e){let a=document.getElementById("wl-search-input"),t=document.getElementById("wl-search-dropdown");try{await i("/api/watchlist",{method:"POST",body:JSON.stringify({artist:e})}),a&&(a.value=""),t&&(t.hidden=!0),p=[],await w(),d(`${e} toegevoegd aan watchlist`)}catch(l){d(l.message||"Toevoegen mislukt","error")}}async function M(e){let a=document.querySelector(`.wl-btn-scan[data-id="${e}"]`);a&&(a.disabled=!0,a.textContent="\u2026");try{let t=await i(`/api/watchlist/${e}/scan`,{method:"POST"}),l=t.newReleases?.length?`${t.newReleases.length} nieuwe releases gevonden!`:"Geen nieuwe releases gevonden";d(l),await w(),u.has(e)&&await z(e)}catch(t){d("Scan mislukt: "+t.message,"error")}finally{a&&(a.disabled=!1,a.textContent="\u21BB")}}async function P(){let e=document.getElementById("wl-btn-scan-all");e&&(e.disabled=!0,e.textContent="Bezig\u2026");try{await i("/api/watchlist/scan-all",{method:"POST"}),d("Scan gestart op achtergrond"),setTimeout(()=>w(),3e3)}catch(a){d("Scan mislukt: "+a.message,"error")}finally{e&&(e.disabled=!1,e.textContent="Scan alles")}}function d(e,a="info"){let t=document.getElementById("wl-toast");t||(t=document.createElement("div"),t.id="wl-toast",t.className="wl-toast",document.body.appendChild(t)),t.textContent=e,t.className=`wl-toast wl-toast-${a} wl-toast-visible`,clearTimeout(t._timer),t._timer=setTimeout(()=>{t.className="wl-toast"},3e3)}function R(){let e=j();if(!e)return;let a=e.querySelector("#wl-search-input");a&&(a.addEventListener("input",()=>{clearTimeout(k);let l=a.value.trim();if(l.length<2){p=[];let o=document.getElementById("wl-search-dropdown");o&&(o.hidden=!0);return}k=setTimeout(()=>T(l),300)}),a.addEventListener("keydown",l=>{if(l.key==="Enter"){let o=a.value.trim();o.length>=2&&_(o)}if(l.key==="Escape"){let o=document.getElementById("wl-search-dropdown");o&&(o.hidden=!0)}}),document.addEventListener("click",l=>{let o=document.getElementById("wl-search-dropdown");o&&!o.contains(l.target)&&l.target!==a&&(o.hidden=!0)},{capture:!0})),e.addEventListener("click",l=>{let o=l.target.closest(".wl-search-result");if(o){_(o.dataset.name);return}let m=l.target.closest(".wl-btn-expand");if(m){let r=parseInt(m.dataset.id,10),n=document.getElementById(`wl-detail-${r}`);if(!n)return;let c=n.hidden;n.hidden=!c,m.textContent=c?"\u25B2":"\u25BC",c?(u.add(r),z(r)):u.delete(r);return}let h=l.target.closest(".wl-btn-edit");if(h){let r=parseInt(h.dataset.id,10),n=f.find(c=>c.id===r);n&&D(n);return}let v=l.target.closest(".wl-btn-scan");if(v){M(parseInt(v.dataset.id,10));return}let x=l.target.closest(".wl-btn-delete");if(x){let r=parseInt(x.dataset.id,10),n=f.find(c=>c.id===r);n&&confirm(`"${n.artist_name}" verwijderen uit watchlist?`)&&i(`/api/watchlist/${r}`,{method:"DELETE"}).then(()=>{u.delete(r),w()}).catch(c=>d("Verwijderen mislukt: "+c.message,"error"));return}let g=l.target.closest(".wl-btn-skip");if(g){let r=parseInt(g.dataset.releaseId,10);i(`/api/watchlist/releases/${r}`,{method:"PUT",body:JSON.stringify({status:"skipped"})}).then(()=>{g.closest(".wl-release-item").querySelector(".wl-status-dot").textContent=S("skipped"),g.closest(".wl-release-item").querySelector(".wl-status-dot").className=`wl-status-dot ${E("skipped")}`,g.remove(),w()}).catch(n=>d("Overslaan mislukt: "+n.message,"error"));return}});let t=document.getElementById("wl-btn-scan-all");t&&t.addEventListener("click",P)}function H(){if(document.getElementById("wl-styles"))return;let e=document.createElement("style");e.id="wl-styles",e.textContent=`
    /* \u2500\u2500 Watchlist layout \u2500\u2500 */
    .wl-view { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .wl-header { display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .wl-title { font-size: 1.5rem; font-weight: 700; color: var(--color-text); margin: 0; }
    .wl-header-actions { display: flex; gap: 8px; }

    /* \u2500\u2500 Zoekbalk \u2500\u2500 */
    .wl-search-wrap { position: relative; margin-bottom: 20px; }
    .wl-search-input {
      width: 100%; padding: 10px 16px; border-radius: 10px; border: 1.5px solid var(--color-border);
      background: var(--color-surface); color: var(--color-text); font-size: 0.95rem;
      outline: none; transition: border-color 0.15s;
    }
    .wl-search-input:focus { border-color: var(--color-accent, #6c63ff); }
    .wl-search-dropdown {
      position: absolute; top: calc(100% + 4px); left: 0; right: 0;
      background: var(--color-surface); border: 1.5px solid var(--color-border);
      border-radius: 10px; z-index: 200; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.15);
    }
    .wl-search-result {
      display: flex; align-items: center; gap: 10px; width: 100%;
      padding: 10px 14px; border: none; background: none; color: var(--color-text);
      cursor: pointer; text-align: left; font-size: 0.92rem;
    }
    .wl-search-result:hover { background: var(--color-hover, rgba(108,99,255,.08)); }
    .wl-search-result-source { margin-left: auto; font-size: 0.78rem; color: var(--color-text-muted); }

    /* \u2500\u2500 Artiest-kaart \u2500\u2500 */
    .wl-list { display: flex; flex-direction: column; gap: 12px; }
    .wl-card {
      background: var(--color-surface); border-radius: 14px;
      border: 1.5px solid var(--color-border); overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .wl-card:hover { border-color: var(--color-accent, #6c63ff); box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    .wl-card-header {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; cursor: default;
    }
    .wl-artist-thumb { flex-shrink: 0; }
    .wl-artist-initial {
      width: 48px; height: 48px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; font-weight: 700; color: #fff; user-select: none;
    }
    .wl-card-info { flex: 1; min-width: 0; }
    .wl-artist-name { font-weight: 600; font-size: 1rem; color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wl-config-summary { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px; }
    .wl-meta { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 2px; }
    .wl-auto-dl { color: var(--color-accent, #6c63ff); }

    .wl-card-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .wl-new-badge {
      background: var(--color-accent, #6c63ff); color: #fff;
      border-radius: 999px; padding: 2px 10px; font-size: 0.78rem; font-weight: 600;
    }
    .wl-uptodate { font-size: 0.78rem; color: var(--color-text-muted); }

    /* \u2500\u2500 Knoppen \u2500\u2500 */
    .wl-btn {
      padding: 8px 16px; border-radius: 8px; border: none; font-size: 0.88rem;
      font-weight: 600; cursor: pointer; transition: opacity 0.15s, background 0.15s;
    }
    .wl-btn:disabled { opacity: .5; cursor: default; }
    .wl-btn-primary { background: var(--color-accent, #6c63ff); color: #fff; }
    .wl-btn-primary:hover:not(:disabled) { opacity: .85; }
    .wl-btn-secondary { background: var(--color-border); color: var(--color-text); }
    .wl-btn-secondary:hover:not(:disabled) { opacity: .8; }
    .wl-btn-sm {
      width: 30px; height: 30px; border-radius: 8px; border: 1.5px solid var(--color-border);
      background: none; color: var(--color-text); cursor: pointer; font-size: 0.85rem;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.12s, border-color 0.12s;
    }
    .wl-btn-sm:hover { background: var(--color-hover, rgba(108,99,255,.08)); border-color: var(--color-accent, #6c63ff); }
    .wl-btn-danger { color: #e55; border-color: #e55; }
    .wl-btn-danger:hover { background: rgba(238,85,85,.1); }

    /* \u2500\u2500 Detail / releases \u2500\u2500 */
    .wl-card-detail { border-top: 1.5px solid var(--color-border); padding: 16px; }
    .wl-releases-loading { color: var(--color-text-muted); font-size: 0.88rem; }
    .wl-releases-empty { color: var(--color-text-muted); font-size: 0.88rem; }
    .wl-releases-grid { display: flex; flex-direction: column; gap: 8px; }
    .wl-release-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      background: var(--color-bg, #f9f9f9); border-radius: 10px;
      border: 1px solid transparent; transition: border-color 0.12s;
    }
    .wl-release-item:hover { border-color: var(--color-border); }
    .wl-release-in-library { opacity: 0.6; }
    .wl-release-cover { width: 44px; height: 44px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
    .wl-release-cover img { width: 100%; height: 100%; object-fit: cover; }
    .wl-release-cover-ph {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.7); font-size: 1.1rem;
    }
    .wl-release-info { flex: 1; min-width: 0; }
    .wl-release-title { font-weight: 600; font-size: 0.92rem; color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wl-release-meta { display: flex; align-items: center; gap: 8px; margin-top: 3px; }
    .wl-release-date { font-size: 0.78rem; color: var(--color-text-muted); }
    .wl-release-status { margin-top: 2px; }
    .wl-release-actions { display: flex; gap: 4px; flex-shrink: 0; }

    /* \u2500\u2500 Badges \u2500\u2500 */
    .wl-badge { font-size: 0.72rem; font-weight: 700; padding: 1px 7px; border-radius: 999px; }
    .wl-badge-album  { background: rgba(108,99,255,.15); color: var(--color-accent, #6c63ff); }
    .wl-badge-ep     { background: rgba(30,200,120,.15); color: #1ec878; }
    .wl-badge-single { background: rgba(255,180,0,.15);  color: #e6a800; }

    /* \u2500\u2500 Status \u2500\u2500 */
    .wl-status-dot { font-size: 0.75rem; font-weight: 600; }
    .wl-status-new        { color: var(--color-accent, #6c63ff); }
    .wl-status-downloaded { color: #1ec878; }
    .wl-status-skipped    { color: var(--color-text-muted); }
    .wl-status-library    { color: #1ec878; }

    /* \u2500\u2500 Leeg state \u2500\u2500 */
    .wl-empty { text-align: center; padding: 60px 20px; color: var(--color-text-muted); }
    .wl-empty-icon { font-size: 3rem; margin-bottom: 16px; }
    .wl-empty p { margin: 4px 0; }

    /* \u2500\u2500 Modal \u2500\u2500 */
    .wl-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .wl-modal {
      background: var(--color-surface); border-radius: 16px; width: 100%; max-width: 480px;
      max-height: 85vh; overflow-y: auto; box-shadow: 0 16px 48px rgba(0,0,0,.2);
    }
    .wl-modal-header { display: flex; align-items: center; justify-content: space-between;
      padding: 20px 20px 0; }
    .wl-modal-title { font-size: 1.1rem; font-weight: 700; margin: 0; color: var(--color-text); }
    .wl-modal-close { width: 32px; height: 32px; border: none; background: none;
      cursor: pointer; color: var(--color-text-muted); font-size: 1.1rem; border-radius: 8px; }
    .wl-modal-close:hover { background: var(--color-hover, rgba(0,0,0,.06)); }
    .wl-modal-body { padding: 16px 20px; }
    .wl-modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 20px 20px; }
    .wl-config-section { margin-bottom: 20px; }
    .wl-config-label { font-size: 0.85rem; font-weight: 600; color: var(--color-text-muted);
      margin-bottom: 10px; text-transform: uppercase; letter-spacing: .04em; }
    .wl-config-sublabel { font-size: 0.85rem; color: var(--color-text-muted); }
    .wl-config-row { display: flex; align-items: center; justify-content: space-between;
      margin-top: 10px; }
    .wl-toggles { display: flex; flex-direction: column; gap: 10px; }
    .wl-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer;
      font-size: 0.9rem; color: var(--color-text); user-select: none; }
    .wl-toggle input[type=checkbox] { appearance: none; -webkit-appearance: none;
      width: 36px; height: 20px; border-radius: 999px; background: var(--color-border);
      cursor: pointer; transition: background 0.2s; position: relative; flex-shrink: 0; }
    .wl-toggle input[type=checkbox]::after {
      content: ''; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%; background: #fff;
      transition: transform 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .wl-toggle input[type=checkbox]:checked { background: var(--color-accent, #6c63ff); }
    .wl-toggle input[type=checkbox]:checked::after { transform: translateX(16px); }
    .wl-toggle-track { display: none; }
    .wl-select {
      padding: 6px 10px; border-radius: 8px; border: 1.5px solid var(--color-border);
      background: var(--color-surface); color: var(--color-text); font-size: 0.9rem; cursor: pointer;
    }
    .wl-textarea {
      width: 100%; padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--color-border);
      background: var(--color-surface); color: var(--color-text); font-size: 0.9rem;
      resize: vertical; box-sizing: border-box; font-family: inherit;
    }

    /* \u2500\u2500 Toast \u2500\u2500 */
    .wl-toast {
      position: fixed; bottom: -60px; left: 50%; transform: translateX(-50%);
      background: var(--color-surface); border: 1.5px solid var(--color-border);
      color: var(--color-text); padding: 10px 20px; border-radius: 999px;
      font-size: 0.88rem; font-weight: 600; z-index: 2000; box-shadow: 0 4px 16px rgba(0,0,0,.15);
      transition: bottom 0.25s; pointer-events: none; white-space: nowrap;
    }
    .wl-toast-visible { bottom: 24px; }
    .wl-toast-error { border-color: #e55; color: #e55; }

    @media (max-width: 600px) {
      .wl-card-header { flex-wrap: wrap; }
      .wl-card-actions { flex-wrap: wrap; }
    }
  `,document.head.appendChild(e)}function U(){return`
    <div class="wl-view" id="watchlist-view">
      <div class="wl-header">
        <h1 class="wl-title">\u{1F441} Watchlist</h1>
        <div class="wl-header-actions">
          <button class="wl-btn wl-btn-secondary" id="wl-btn-scan-all">Scan alles</button>
        </div>
      </div>

      <div id="wl-error" class="wl-error" hidden style="color:#e55;margin-bottom:12px;"></div>

      <div class="wl-search-wrap">
        <input
          type="search"
          id="wl-search-input"
          class="wl-search-input"
          placeholder="Zoek artiest om toe te voegen (Plex + Last.fm)\u2026"
          autocomplete="off"
        >
        <div class="wl-search-dropdown" id="wl-search-dropdown" hidden></div>
      </div>

      <div class="wl-list" id="wl-list">
        <div style="color:var(--color-text-muted);padding:24px;text-align:center">Laden\u2026</div>
      </div>
    </div>`}async function Z(e){H(),e.innerHTML=U(),R(),await w()}export{Z as loadWatchlistView};
