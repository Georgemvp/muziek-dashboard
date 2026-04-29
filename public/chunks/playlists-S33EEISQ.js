import{a as h}from"./chunk-7FXT553B.js";import{d as u,g,h as t,z as v}from"./chunk-HCN2ZK5I.js";import{a as c}from"./chunk-2BMKGNH5.js";function f(i){if(!i)return"\u2014";let l=Math.floor(i/1e3),e=Math.floor(l/60),d=l%60;return`${e}:${d.toString().padStart(2,"0")}`}function $(i){return i?`${Math.round(i/6e4)} min`:""}async function T(){let i=document.getElementById("content");if(i){i.innerHTML=`
    <div class="playlists-page">
      <div class="playlists-toolbar">
        <h1 class="playlists-title">Afspeellijsten</h1>
      </div>
      <div class="playlists-grid" id="playlists-grid">
        <div class="playlists-loading">
          <div class="spinner-sm"></div>
          <span>Laden\u2026</span>
        </div>
      </div>
    </div>`;try{let l=await v("/api/plex/playlists",{signal:c.tabAbort?.signal}),e=l?.playlists||l||[],d=document.getElementById("playlists-grid");if(!d)return;if(!e.length){d.innerHTML='<div class="playlists-empty">Geen afspeellijsten gevonden in Plex.</div>';return}d.innerHTML=e.map(s=>{let n=s.thumb?u(s.thumb,300):null,o=s.trackCount||0,p=$(s.duration);return`
        <button class="playlist-card"
                data-playlist-id="${t(s.ratingKey)}"
                data-playlist-title="${t(s.title)}"
                aria-label="Open afspeellijst ${t(s.title)}">
          <div class="playlist-card-art">
            ${n?`<img src="${t(n)}" alt="${t(s.title)}" loading="lazy">`:'<div class="playlist-card-ph">\u266B</div>'}
            ${s.smart?'<span class="playlist-smart-badge">SMART</span>':""}
          </div>
          <div class="playlist-card-info">
            <div class="playlist-card-title">${t(s.title)}</div>
            <div class="playlist-card-meta">
              ${o?`${g(o)} nummers`:""}${o&&p?" \xB7 ":""}${p}
            </div>
          </div>
        </button>`}).join("")}catch(l){if(l.name==="AbortError")return;let e=document.getElementById("playlists-grid");e&&(e.innerHTML=`<div class="playlists-empty">Laden mislukt: ${t(l.message)}</div>`)}}}async function A(){let i=document.getElementById("content");if(!i)return;let l=c.viewParams?.id,e=c.viewParams?.title||"Afspeellijst";if(!l){i.innerHTML='<div class="error-box">\u26A0\uFE0F Geen afspeellijst geselecteerd.</div>';return}let d=c.previousView||"playlists";i.innerHTML=`
    <div class="playlist-detail-page">
      <div class="playlist-detail-header">
        <button class="album-detail-back" id="playlist-back-btn">\u2190 Terug</button>
        <div class="playlist-detail-meta">
          <div class="playlist-detail-art-wrap" id="playlist-detail-art">
            <div class="playlist-card-ph">\u266B</div>
          </div>
          <div class="playlist-detail-info">
            <div class="playlist-detail-label">AFSPEELLIJST</div>
            <h1 class="playlist-detail-title">${t(e)}</h1>
            <div class="playlist-detail-sub" id="playlist-detail-sub">Laden\u2026</div>
            <div class="playlist-detail-actions">
              <button class="play-all-btn" id="playlist-play-all" disabled>\u25B6 Afspelen</button>
            </div>
          </div>
        </div>
      </div>
      <div class="playlist-track-list" id="playlist-tracks">
        <div class="playlists-loading">
          <div class="spinner-sm"></div>
          <span>Nummers laden\u2026</span>
        </div>
      </div>
    </div>`,document.getElementById("playlist-back-btn")?.addEventListener("click",()=>{h(d)});try{let n=(await v(`/api/plex/playlists/${encodeURIComponent(l)}/tracks`,{signal:c.tabAbort?.signal}))?.tracks||[],o=document.getElementById("playlist-detail-sub");if(o){let a=n.reduce((r,m)=>r+(m.duration||0),0),y=Math.round(a/6e4);o.textContent=`${g(n.length)} nummers \xB7 ${y} min`}let p=document.getElementById("playlist-play-all");p&&(p.disabled=!1,p.setAttribute("data-playlist-id",l));try{let a=await v("/api/plex/playlists",{signal:c.tabAbort?.signal}),r=(a?.playlists||a||[]).find(m=>String(m.ratingKey)===String(l));if(r?.thumb){let m=document.getElementById("playlist-detail-art");m&&(m.innerHTML=`<img src="${t(u(r.thumb,240))}" alt="${t(e)}" class="playlist-detail-art-img">`)}}catch{}let b=document.getElementById("playlist-tracks");if(!b)return;if(!n.length){b.innerHTML='<div class="playlists-empty">Deze afspeellijst bevat geen nummers.</div>';return}b.innerHTML=`
      <table class="playlist-track-table">
        <thead>
          <tr>
            <th class="plt-num">#</th>
            <th class="plt-title">Titel</th>
            <th class="plt-artist">Artiest</th>
            <th class="plt-album">Album</th>
            <th class="plt-dur">Duur</th>
          </tr>
        </thead>
        <tbody>
          ${n.map((a,y)=>{let r=a.thumb?u(a.thumb,48):null;return`
              <tr class="playlist-track-row">
                <td class="plt-num">${y+1}</td>
                <td class="plt-title">
                  <div class="plt-title-inner">
                    ${r?`<img src="${t(r)}" alt="" class="plt-thumb" loading="lazy">`:'<div class="plt-thumb plt-thumb-ph"></div>'}
                    <span>${t(a.title)}</span>
                  </div>
                </td>
                <td class="plt-artist">
                  ${a.artist?`<button class="plt-artist-link" data-artist="${t(a.artist)}">${t(a.artist)}</button>`:"\u2014"}
                </td>
                <td class="plt-album">${t(a.album||"\u2014")}</td>
                <td class="plt-dur">${f(a.duration)}</td>
              </tr>`}).join("")}
        </tbody>
      </table>`}catch(s){if(s.name==="AbortError")return;let n=document.getElementById("playlist-tracks");n&&(n.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${t(s.message)}</div>`)}}export{A as loadPlaylistDetail,T as loadPlaylists};
