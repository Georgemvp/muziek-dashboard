import{p as W}from"./chunk-XXMQU7A4.js";import{A as I,B as L,C as B,D as P,E as J,F as $,a as t,b as M,e as S,f as E,h as u,i as R,j as o,m as b,n as q,o as T,p as F,q as G,t as C,v as U,w as h,x as A,y as D,z}from"./chunk-K5NRXECC.js";async function be(){try{let l=await $("/api/spotify/status");t.spotifyEnabled=!!l.enabled;let e=document.getElementById("tb-mood");t.spotifyEnabled&&t.activeView==="ontdek"?(e.style.display="",e.classList.add("visible")):t.spotifyEnabled&&(e.style.display="")}catch{t.spotifyEnabled=!1}}function te(l,e){let s=l.image?`<img src="${o(l.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',r=l.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${o(l.preview_url)}"
         data-artist="${o(l.artist)}" data-track="${o(l.name)}"
         id="spbtn-${e}" title="Luister preview">\u25B6</button>`:"",d=l.spotify_url?`<a class="spotify-link-btn" href="${o(l.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`
    <div class="spotify-card">
      <div class="spotify-cover">
        ${s}${r}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${e}"></div>
        </div>
      </div>
      <div class="spotify-info">
        <div class="spotify-track" title="${o(l.name)}">${o(l.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${o(l.artist)}">${o(l.artist)}</div>
        <div class="spotify-album" title="${o(l.album)}">${o(l.album)}</div>
        ${d}
      </div>
    </div>`}async function X(l){let e=document.getElementById("spotify-recs-section");if(!e)return;let s={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};e.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let r=`spotify:${l}`,d=L(r,300*1e3);if(d||(d=await $(`/api/spotify/recs?mood=${encodeURIComponent(l)}`),B(r,d)),!d.length){e.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let c=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${o(s[l]||l)}</div>
      <div class="spotify-grid">`;d.forEach((m,a)=>{c+=te(m,a)}),c+="</div>",e.innerHTML=c}catch{e.innerHTML=""}}function N(){let l=document.getElementById("spotify-recs-section");l&&(l.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(l=>{l.addEventListener("click",async()=>{let e=l.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(s=>s.classList.remove("sel-mood","loading")),t.activeMood===e){t.activeMood=null,N(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}t.activeMood=e,l.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await X(e),l.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{t.activeMood=null,document.querySelectorAll(".mood-btn").forEach(l=>l.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",N()});document.addEventListener("click",l=>{let e=l.target.closest(".spotify-play-btn");if(!e)return;let s=t.playerState;if(!s)return;l.stopPropagation();let r=e.dataset.spotifyPreview;if(r){if(s.previewBtn===e){s.previewAudio.paused?(s.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(s.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let d=s.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");d&&(d.style.width="0%")}s.previewBtn=e,s.previewAudio.src=r,s.previewAudio.currentTime=0,s.previewAudio.play().then(()=>{e.textContent="\u23F8",e.classList.add("playing")}).catch(()=>{e.textContent="\u25B6",s.previewBtn=null})}},!0);async function Y(){D();let l=t.tabAbort?.signal;try{let e=L("recs",3e5);if(!(e!==null)){if(e=await J("/api/recs"),l?.aborted)return;B("recs",e)}let r=e.recommendations||[],d=e.albumRecs||[],c=e.trackRecs||[];if(t.plexOk=e.plexConnected||t.plexOk,t.lastRecs=e,e.plexConnected&&e.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${R(e.plexArtistCount)} artiesten`),!r.length){h('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let m=r.filter(n=>!n.inPlex).length,a=r.filter(n=>n.inPlex).length,i=document.getElementById("hdr-title-recs");i&&(i.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${r.length} artiesten`);let y='<div class="spotify-section" id="spotify-recs-section"></div>';y+=`<div class="section-title">Gebaseerd op jouw smaak: ${(e.basedOn||[]).slice(0,3).join(", ")}
      ${t.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${m} nieuw</span> \xB7 <span style="color:var(--plex)">${a} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let n=0;n<r.length;n++){let p=r[n],v=Math.round(p.match*100);y+=`
        <div class="rec-card" data-inplex="${p.inPlex}" id="rc-${n}">
          <div class="rec-photo" id="rph-${n}">
            <div class="rec-photo-ph" style="background:${b(p.name)}">${u(p.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${o(p.name)}">${o(p.name)}</span>
                ${F(p.inPlex)}
              </div>
              <span class="rec-match">${v}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${o(p.reason)}</div>
            <div id="rtags-${n}"></div>
            <div id="ralb-${n}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`}if(y+="</div>",d.length){y+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let n of d){let p=E(n.image,80)||n.image,v=p?`<img class="albrec-img" src="${o(p)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${b(n.album)}">${u(n.album)}</div>`:`<div class="albrec-ph" style="background:${b(n.album)}">${u(n.album)}</div>`,f=t.plexOk?n.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";y+=`
          <div class="albrec-card">
            <div class="albrec-cover">${v}</div>
            <div class="albrec-info">
              <div class="albrec-title">${o(n.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${o(n.artist)}">${o(n.artist)}</div>
              <div class="albrec-reason">via ${o(n.reason)}</div>
              ${f}${C(n.artist,n.album,n.inPlex)}
            </div>
          </div>`}y+="</div>"}if(c.length){y+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let n of c){let p=n.playcount>0?`<span class="trackrec-plays">${R(n.playcount)}\xD7</span>`:"",v=n.url?`<a class="trackrec-link" href="${o(n.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";y+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${o(n.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${o(n.artist)}">${o(n.artist)}</div>
              <div class="trackrec-reason">via ${o(n.reason)}</div>
            </div>
            <div class="trackrec-meta">${p}${v}</div>
          </div>`}y+="</div>"}h(y,()=>{t.activeMood&&X(t.activeMood)}),se();let w=document.getElementById("sec-recs-preview");if(w){let n=r.slice(0,8);w.innerHTML=`<div class="collapsed-thumbs">${n.map((p,v)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${v}" style="background:${b(p.name)}">
          <span class="collapsed-thumb-ph">${u(p.name)}</span>
        </div>`).join("")}${r.length>8?`<span class="collapsed-thumbs-more">+${r.length-8}</span>`:""}</div>`,n.forEach(async(p,v)=>{try{let f=await $(`/api/artist/${encodeURIComponent(p.name)}/info`),g=document.getElementById(`recs-thumb-${v}`);g&&f.image&&(g.innerHTML=`<img src="${o(E(f.image,48)||f.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}r.forEach(async(n,p)=>{try{let v=await $(`/api/artist/${encodeURIComponent(n.name)}/info`),f=document.getElementById(`rph-${p}`);f&&v.image&&(f.innerHTML=`<img src="${E(v.image,120)||v.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${b(n.name)}\\'>${u(n.name)}</div>'">`);let g=document.getElementById(`rtags-${p}`);g&&(g.innerHTML=T(v.tags,3)+'<div style="height:6px"></div>');let k=document.getElementById(`ralb-${p}`);if(k){let V=(v.albums||[]).slice(0,4);if(V.length){let _='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let x of V){let K=x.image?`<img class="rec-album-img" src="${E(x.image,48)||x.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',ee=t.plexOk&&x.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";_+=`<div class="rec-album-row">${K}<span class="rec-album-name">${o(x.name)}</span>${ee}${C(n.name,x.name,x.inPlex)}</div>`}k.innerHTML=_+"</div>"}else k.innerHTML=""}}catch{let v=document.getElementById(`ralb-${p}`);v&&(v.innerHTML="")}})}catch(e){if(e.name==="AbortError")return;A(e.message)}}function se(){document.querySelectorAll(".rec-card[data-inplex]").forEach(l=>{let e=l.dataset.inplex==="true",s=!0;t.recsFilter==="new"&&(s=!e),t.recsFilter==="plex"&&(s=e),l.classList.toggle("hidden",!s)})}function Z(l){let e=document.getElementById("badge-releases");e&&(l>0?(e.textContent=l,e.style.display=""):e.style.display="none")}function le(l){if(!l)return"";let e=new Date(l),r=Math.floor((new Date-e)/864e5);return r===0?"vandaag":r===1?"gisteren":r<7?`${r} dagen geleden`:e.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function H(){D();let l=t.tabAbort?.signal;try{let e=L("releases",3e5);if(!e){if(e=await $("/api/releases",{signal:l}),l?.aborted)return;B("releases",e)}if(e.status==="building"){h(`<div class="loading"><div class="spinner"></div>
        <div>${o(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{t.activeView==="ontdek"&&H()},5e3);return}t.lastReleases=e.releases||[],t.newReleaseIds=new Set(e.newReleaseIds||[]),Z(e.newCount||0),ae()}catch(e){if(e.name==="AbortError")return;A(e.message)}}function ae(){let l=t.lastReleases||[];if(!l.length){h('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let e=l;if(t.releasesFilter!=="all"&&(e=l.filter(a=>(a.type||"album").toLowerCase()===t.releasesFilter)),!e.length){h(`<div class="empty">Geen ${t.releasesFilter==="ep"?"EP's":t.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}t.releasesSort==="listening"?e=[...e].sort((a,i)=>(i.artistPlaycount||0)-(a.artistPlaycount||0)||new Date(i.releaseDate)-new Date(a.releaseDate)):e=[...e].sort((a,i)=>new Date(i.releaseDate)-new Date(a.releaseDate));let s=document.getElementById("hdr-title-releases");s&&(s.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${e.length} release${e.length!==1?"s":""}`);let r=a=>({album:"Album",single:"Single",ep:"EP"})[a?.toLowerCase()]||a||"Album",d=a=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[a?.toLowerCase()]||"rel-type-album",c=`<div class="section-title">${e.length} release${e.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let a of e){let i=t.newReleaseIds.has(`${a.artist}::${a.album}`),y=a.image?`<img class="rel-img" src="${o(a.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${b(a.album)}">${u(a.album)}</div>`:`<div class="rel-ph" style="background:${b(a.album)}">${u(a.album)}</div>`,w=a.releaseDate?new Date(a.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",n=le(a.releaseDate),p=w?`<div class="rel-date">${w} <span class="rel-date-rel">(${n})</span></div>`:"",v=t.plexOk?a.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':a.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",f=a.deezerUrl?`<a class="rel-deezer-link" href="${o(a.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";c+=`
      <div class="rel-card${i?" rel-card-new":""}">
        <div class="rel-cover">${y}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${d(a.type)}">${r(a.type)}</span>
          <div class="rel-album">${o(a.album)}</div>
          <div class="rel-artist artist-link" data-artist="${o(a.artist)}">${o(a.artist)}</div>
          ${p}
          <div class="rel-footer">${v}${f}${C(a.artist,a.album,a.inPlex)}</div>
        </div>
      </div>`}h(c+"</div>");let m=document.getElementById("sec-releases-preview");if(m){let a=e.slice(0,8);m.innerHTML=`<div class="collapsed-thumbs">${a.map(i=>i.image?`<div class="collapsed-thumb">
          <img src="${o(i.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(i.album)}">${u(i.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${b(i.album)}"><span class="collapsed-thumb-ph">${u(i.album)}</span></div>`).join("")}${e.length>8?`<span class="collapsed-thumbs-more">+${e.length-8}</span>`:""}</div>`}}async function j(){D("Ontdekkingen ophalen...");let l=t.tabAbort?.signal;try{let e=L("discover",3e5);if(!e){if(e=await $("/api/discover",{signal:l}),l?.aborted)return;B("discover",e)}if(e.status==="building"){h(`<div class="loading"><div class="spinner"></div>
        <div>${o(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{t.activeView==="ontdek"&&j()},2e4);return}t.lastDiscover=e,e.plexConnected&&(t.plexOk=!0),ie()}catch(e){if(e.name==="AbortError")return;A(e.message)}}function ie(){if(!t.lastDiscover)return;let{artists:l,basedOn:e}=t.lastDiscover;if(!l?.length){h('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let s=l;if(t.discFilter==="new"&&(s=l.filter(a=>!a.inPlex)),t.discFilter==="partial"&&(s=l.filter(a=>a.inPlex&&a.missingCount>0)),!s.length){h('<div class="empty">Geen artiesten voor dit filter.</div>');return}let r=document.getElementById("hdr-title-discover");r&&(r.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${s.length} artiesten`);let d=s.reduce((a,i)=>a+i.missingCount,0),c=`<div class="section-title">Gebaseerd op: ${(e||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${d} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let a=0;a<s.length;a++){let i=s[a],y=Math.round(i.match*100),w=[q(i.country),i.country,i.startYear?`Actief vanaf ${i.startYear}`:null,i.totalAlbums?`${i.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),n=E(i.image,120)||i.image,p=n?`<img class="discover-photo" src="${o(n)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${b(i.name,!0)}">${u(i.name)}</div>`:`<div class="discover-photo-ph" style="background:${b(i.name,!0)}">${u(i.name)}</div>`,v=i.albums?.length||0,f=`${v} album${v!==1?"s":""}`;if(c+=`
      <div class="discover-section collapsed" id="disc-${a}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${a}">
          <div class="discover-card-top">
            ${p}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${o(i.name)}">${o(i.name)}</span>
                ${F(i.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${o(i.reason)}</strong></div>
            </div>
            <span class="discover-match">${y}%</span>
            ${G("artist",i.name,"",i.image||"")}
          </div>
          ${w?`<div class="discover-meta">${o(w)}</div>`:""}
          ${T(i.tags,3)}
          ${i.missingCount>0?`<div class="discover-missing">\u2726 ${i.missingCount} ${i.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${a}" data-album-count="${v}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${f}</button>
          ${i.albums?.length?`<div class="discover-preview-row">${i.albums.slice(0,5).map(g=>{let k=b(g.title||"");return g.coverUrl?`<img class="discover-preview-thumb" src="${o(g.coverUrl)}" alt="${o(g.title)}" loading="lazy"
                   title="${o(g.title)}${g.year?" ("+g.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${k}">${u(g.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${k}">${u(g.title||"?")}</div>`}).join("")}${i.albums.length>5?`<div class="discover-preview-more">+${i.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,i.albums?.length){c+='<div class="album-grid">';for(let g of i.albums)c+=U(g,!0,i.name);c+="</div>"}else c+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';c+="</div></div>"}c+="</div>",h(c);let m=document.getElementById("sec-discover-preview");if(m){let a=s.slice(0,8);m.innerHTML=`<div class="collapsed-thumbs">${a.map(i=>i.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${o(i.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(i.name)}">${u(i.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(i.name)}"><span class="collapsed-thumb-ph">${u(i.name)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`}}function ne(){try{let l=localStorage.getItem("ontdek-sections");l&&Object.assign(t.collapsibleSections,JSON.parse(l))}catch{}}function oe(){try{localStorage.setItem("ontdek-sections",JSON.stringify(t.collapsibleSections))}catch{}}function Q(l,e){l.classList.remove("expanded","collapsed"),l.classList.add(e?"collapsed":"expanded")}function O(l,e){let s=document.querySelector(`[data-section="${l}"]`);if(!s)return;let r=s.querySelector(".section-toggle-btn");r&&(Q(r,t.collapsibleSections[e]),r.addEventListener("click",d=>{d.preventDefault(),d.stopPropagation(),t.collapsibleSections[e]=!t.collapsibleSections[e],oe(),Q(r,t.collapsibleSections[e]),s.classList.toggle("collapsed")}),t.collapsibleSections[e]&&s.classList.add("collapsed"))}async function re(){ne(),t.activeView="bibliotheek",W();let l=t.spotifyEnabled?`
    <div class="section-block sec-mood-block">
      <div class="inline-toolbar">
        <span class="toolbar-label spotify-label">\u{1F3AF} Spotify mood</span>
        <span class="toolbar-sep"></span>
        <button class="tool-btn${t.activeMood==="energiek"?" sel-mood":""}" data-mood="energiek">\u26A1 Energiek</button>
        <button class="tool-btn${t.activeMood==="chill"?" sel-mood":""}" data-mood="chill">\u{1F30A} Chill</button>
        <button class="tool-btn${t.activeMood==="melancholisch"?" sel-mood":""}" data-mood="melancholisch">\u{1F327} Melancholisch</button>
        <button class="tool-btn${t.activeMood==="experimenteel"?" sel-mood":""}" data-mood="experimenteel">\u{1F52C} Experimenteel</button>
        <button class="tool-btn${t.activeMood==="feest"?" sel-mood":""}" data-mood="feest">\u{1F389} Feest</button>
        ${t.activeMood?'<span class="toolbar-sep"></span><button class="tool-btn" id="btn-clear-mood-inline">\u2715 Wis mood</button>':""}
      </div>
    </div>`:"";S.innerHTML=`
    <div class="ontdek-layout">
      ${l}

      <div class="section-block" data-section="recs">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-recs">\u{1F3AF} Aanbevelingen</span>
          <div class="inline-toolbar">
            <button class="tool-btn${t.recsFilter==="all"?" sel-def":""}" data-filter="all">Alle</button>
            <button class="tool-btn${t.recsFilter==="new"?" sel-new":""}" data-filter="new">\u2726 Nieuw voor mij</button>
            <button class="tool-btn${t.recsFilter==="plex"?" sel-plex":""}" data-filter="plex">\u25B6 Al in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-recs-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-recs-preview"></div>
        <div class="section-content" id="sec-recs-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>

      <div class="ontdek-divider">Nieuwe Releases</div>
      <div class="section-block" data-section="releases">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-releases">\u{1F4BF} Nieuwe Releases</span>
          <div class="inline-toolbar">
            <button class="tool-btn${t.releasesFilter==="all"?" sel-def":""}" data-rtype="all">Alle</button>
            <button class="tool-btn${t.releasesFilter==="album"?" sel-def":""}" data-rtype="album">Albums</button>
            <button class="tool-btn${t.releasesFilter==="single"?" sel-def":""}" data-rtype="single">Singles</button>
            <button class="tool-btn${t.releasesFilter==="ep"?" sel-def":""}" data-rtype="ep">EP's</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn${t.releasesSort==="listening"?" sel-def":""}" data-rsort="listening">Op luistergedrag</button>
            <button class="tool-btn${t.releasesSort==="date"?" sel-def":""}" data-rsort="date">Op datum</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-releases-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-releases-preview"></div>
        <div class="section-content" id="sec-releases-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>

      <div class="ontdek-divider">Ontdek Artiesten</div>
      <div class="section-block" data-section="discover">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-discover">\u{1F52D} Ontdek Artiesten</span>
          <div class="inline-toolbar">
            <button class="tool-btn${t.discFilter==="all"?" sel-def":""}" data-dfilter="all">Alle artiesten</button>
            <button class="tool-btn${t.discFilter==="new"?" sel-new":""}" data-dfilter="new">\u2726 Nieuw voor mij</button>
            <button class="tool-btn${t.discFilter==="partial"?" sel-miss":""}" data-dfilter="partial">\u25B6 Gedeeltelijk in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-discover-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-discover-preview"></div>
        <div class="section-content" id="sec-discover-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`,S.style.opacity="1",S.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{P("recs"),await I(document.getElementById("sec-recs-content"),Y)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{t.lastReleases=null,P("releases");try{await M("/api/releases/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}await I(document.getElementById("sec-releases-content"),H)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{t.lastDiscover=null,P("discover");try{await M("/api/discover/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}await I(document.getElementById("sec-discover-content"),j)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{t.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood","loading")),N(),re()});{let e=document.getElementById("sec-recs-content");t.sectionContainerEl=e,await Y(),t.sectionContainerEl===e&&(t.sectionContainerEl=null)}(async()=>{try{if(!t.lastReleases){let s=await $("/api/releases");if(s.status==="building")return;t.lastReleases=s.releases||[],t.newReleaseIds=new Set(s.newReleaseIds||[]),Z(s.newCount||0)}let e=document.getElementById("sec-releases-preview");if(e&&t.lastReleases.length){let s=t.lastReleases;t.releasesFilter!=="all"&&(s=t.lastReleases.filter(c=>(c.type||"album").toLowerCase()===t.releasesFilter)),t.releasesSort==="listening"?s=[...s].sort((c,m)=>(m.artistPlaycount||0)-(c.artistPlaycount||0)||new Date(m.releaseDate)-new Date(c.releaseDate)):s=[...s].sort((c,m)=>new Date(m.releaseDate)-new Date(c.releaseDate));let r=s.slice(0,8);e.innerHTML=`<div class="collapsed-thumbs">${r.map(c=>c.image?`<div class="collapsed-thumb">
              <img src="${o(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(c.album)}">${u(c.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${b(c.album)}"><span class="collapsed-thumb-ph">${u(c.album)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-releases");d&&(d.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${s.length} release${s.length!==1?"s":""}`)}}catch{}})(),z(document.getElementById("sec-releases-content"),()=>{let e=document.getElementById("sec-releases-content");return I(e,H)}),(async()=>{try{if(!t.lastDiscover){let d=await $("/api/discover");if(d.status==="building")return;t.lastDiscover=d,d.plexConnected&&(t.plexOk=!0)}let{artists:e}=t.lastDiscover;if(!e?.length)return;let s=e;t.discFilter==="new"&&(s=e.filter(d=>!d.inPlex)),t.discFilter==="partial"&&(s=e.filter(d=>d.inPlex&&d.missingCount>0));let r=document.getElementById("sec-discover-preview");if(r&&s.length){let d=s.slice(0,8);r.innerHTML=`<div class="collapsed-thumbs">${d.map(m=>m.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${o(m.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(m.name)}">${u(m.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(m.name)}"><span class="collapsed-thumb-ph">${u(m.name)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`;let c=document.getElementById("hdr-title-discover");c&&(c.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${s.length} artiesten`)}}catch{}})(),z(document.getElementById("sec-discover-content"),()=>{let e=document.getElementById("sec-discover-content");return I(e,j)}),O("recs","recs"),O("releases","releases"),O("discover","discover")}export{se as applyRecsFilter,be as checkSpotifyStatus,N as clearSpotifyRecs,ne as loadCollapsibleState,j as loadDiscover,re as loadOntdek,Y as loadRecs,H as loadReleases,X as loadSpotifyRecs,le as relativeDate,ie as renderDiscover,ae as renderReleases,oe as saveCollapsibleState,O as setupSectionToggle,te as spotifyCard,Z as updateReleasesBadge,Q as updateToggleButtonState};
