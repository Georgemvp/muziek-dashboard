import{p as X}from"./chunk-F6KLCAYJ.js";import{A as B,B as C,C as R,D as Q,E as h,a as t,b as F,d as A,e as k,g as u,h as z,i as a,l as b,m as J,n as O,o as H,p as W,s as P,u as Y,v as f,w as D,x as M,y as j,z as I}from"./chunk-SOIVDCO5.js";async function fe(){try{let s=await h("/api/spotify/status");t.spotifyEnabled=!!s.enabled;let e=document.getElementById("tb-mood");t.spotifyEnabled&&t.activeView==="ontdek"?(e.style.display="",e.classList.add("visible")):t.spotifyEnabled&&(e.style.display="")}catch{t.spotifyEnabled=!1}}function ae(s,e){let l=s.image?`<img src="${a(s.image)}" alt="${a(s.name)} by ${a(s.artist)}" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',r=s.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${a(s.preview_url)}"
         data-artist="${a(s.artist)}" data-track="${a(s.name)}"
         id="spbtn-${e}" title="Luister preview">\u25B6</button>`:"",m=s.spotify_url?`<a class="spotify-link-btn" href="${a(s.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`
    <div class="spotify-card">
      <div class="spotify-cover">
        ${l}${r}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${e}"></div>
        </div>
      </div>
      <div class="spotify-info">
        <div class="spotify-track" title="${a(s.name)}">${a(s.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${a(s.artist)}">${a(s.artist)}</div>
        <div class="spotify-album" title="${a(s.album)}">${a(s.album)}</div>
        ${m}
      </div>
    </div>`}async function ee(s){let e=document.getElementById("spotify-recs-section");if(!e)return;let l={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};e.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let r=`spotify:${s}`,m=B(r,300*1e3);if(m||(m=await h(`/api/spotify/recs?mood=${encodeURIComponent(s)}`),C(r,m)),!m.length){e.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let p=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${a(l[s]||s)}</div>
      <div class="spotify-grid">`;m.forEach((v,n)=>{p+=ae(v,n)}),p+="</div>",e.innerHTML=p}catch{e.innerHTML=""}}function _(){let s=document.getElementById("spotify-recs-section");s&&(s.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(s=>{s.addEventListener("click",async()=>{let e=s.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(l=>l.classList.remove("sel-mood","loading")),t.activeMood===e){t.activeMood=null,_(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}t.activeMood=e,s.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await ee(e),s.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{t.activeMood=null,document.querySelectorAll(".mood-btn").forEach(s=>s.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",_()});document.addEventListener("click",s=>{let e=s.target.closest(".spotify-play-btn");if(!e)return;let l=t.playerState;if(!l)return;s.stopPropagation();let r=e.dataset.spotifyPreview;if(r){if(l.previewBtn===e){l.previewAudio.paused?(l.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(l.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(l.previewBtn){l.previewAudio.pause(),l.previewBtn.textContent="\u25B6",l.previewBtn.classList.remove("playing");let m=l.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||l.previewBtn.closest(".card")?.querySelector(".play-bar-fill");m&&(m.style.width="0%")}l.previewBtn=e,l.previewAudio.src=r,l.previewAudio.currentTime=0,l.previewAudio.play().then(()=>{e.textContent="\u23F8",e.classList.add("playing")}).catch(()=>{e.textContent="\u25B6",l.previewBtn=null})}},!0);async function Z(){M();let s=t.tabAbort?.signal;try{let e=B("recs",3e5);if(!(e!==null)){if(e=await Q("/api/recs"),s?.aborted)return;C("recs",e)}let r=e.recommendations||[],m=e.albumRecs||[],p=e.trackRecs||[];if(t.plexOk=e.plexConnected||t.plexOk,t.lastRecs=e,e.plexConnected&&e.plexArtistCount){let o=document.getElementById("plex-dot"),d=document.getElementById("plex-status-text");o&&o.classList.toggle("connected",!0),d&&(d.textContent=`Plex \xB7 ${z(e.plexArtistCount)} artiesten`)}if(!r.length){f('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let v=r.filter(o=>!o.inPlex).length,n=r.filter(o=>o.inPlex).length,i=document.getElementById("hdr-title-recs");i&&(i.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${r.length} artiesten`);let y='<div class="spotify-section" id="spotify-recs-section"></div>';y+=`<div class="section-title">Gebaseerd op jouw smaak: ${(e.basedOn||[]).slice(0,3).join(", ")}
      ${t.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${v} nieuw</span> \xB7 <span style="color:var(--plex)">${n} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let o=0;o<r.length;o++){let d=r[o],c=Math.round(d.match*100);y+=`
        <div class="rec-card" data-inplex="${d.inPlex}" id="rc-${o}">
          <div class="rec-photo" id="rph-${o}">
            <div class="rec-photo-ph skeleton" style="background:${b(d.name)}">${u(d.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${a(d.name)}">${a(d.name)}</span>
                ${H(d.inPlex)}
              </div>
              <span class="rec-match">${c}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${a(d.reason)}</div>
            <div id="rtags-${o}"><div class="skeleton" style="height:24px;border-radius:4px"></div></div>
            <div id="ralb-${o}"><div class="skeleton" style="height:80px;border-radius:4px;margin-top:8px"></div></div>
          </div>
        </div>`}if(y+="</div>",m.length){y+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let o of m){let d=k(o.image,80)||o.image,c=d?`<img class="albrec-img" src="${a(d)}" alt="${a(o.album)} by ${a(o.artist)}" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${b(o.album)}">${u(o.album)}</div>`:`<div class="albrec-ph" style="background:${b(o.album)}">${u(o.album)}</div>`,g=t.plexOk?o.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";y+=`
          <div class="albrec-card">
            <div class="albrec-cover">${c}</div>
            <div class="albrec-info">
              <div class="albrec-title">${a(o.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${a(o.artist)}">${a(o.artist)}</div>
              <div class="albrec-reason">via ${a(o.reason)}</div>
              ${g}${P(o.artist,o.album,o.inPlex)}
            </div>
          </div>`}y+="</div>"}if(p.length){y+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let o of p){let d=o.playcount>0?`<span class="trackrec-plays">${z(o.playcount)}\xD7</span>`:"",c=o.url?`<a class="trackrec-link" href="${a(o.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";y+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${a(o.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${a(o.artist)}">${a(o.artist)}</div>
              <div class="trackrec-reason">via ${a(o.reason)}</div>
            </div>
            <div class="trackrec-meta">${d}${c}</div>
          </div>`}y+="</div>"}f(y,()=>{t.activeMood&&ee(t.activeMood)}),ie();let $=document.getElementById("sec-recs-preview");if($){let o=r.slice(0,8);$.innerHTML=`<div class="collapsed-thumbs">${o.map((d,c)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${c}" style="background:${b(d.name)}">
          <span class="collapsed-thumb-ph">${u(d.name)}</span>
        </div>`).join("")}${r.length>8?`<span class="collapsed-thumbs-more">+${r.length-8}</span>`:""}</div>`,o.forEach(async(d,c)=>{try{let g=await h(`/api/artist/${encodeURIComponent(d.name)}/info`),w=document.getElementById(`recs-thumb-${c}`);w&&g.image&&(w.innerHTML=`<img src="${a(k(g.image,48)||g.image)}" alt="${a(d.name)}" loading="lazy" onerror="this.remove()">`)}catch{}})}let E=r.map((o,d)=>h(`/api/artist/${encodeURIComponent(o.name)}/info`).then(c=>({success:!0,i:d,info:c})).catch(c=>({success:!1,i:d,error:c}))),L=await Promise.allSettled(E);for(let o of L)if(o.status==="fulfilled"&&o.value.success){let{i:d,info:c}=o.value,g=r[d],w=document.getElementById(`rph-${d}`);w&&c.image&&(w.innerHTML=`<img src="${k(c.image,120)||c.image}" alt="${a(g.name)}" loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${b(g.name)}\\'>${u(g.name)}</div>'">`);let S=document.getElementById(`rtags-${d}`);S&&(S.innerHTML=O(c.tags,3)+'<div style="height:6px"></div>');let T=document.getElementById(`ralb-${d}`);if(T){let U=(c.albums||[]).slice(0,4);if(U.length){let G='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let x of U){let se=x.image?`<img class="rec-album-img" src="${k(x.image,48)||x.image}" alt="${a(x.name)}" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',le=t.plexOk&&x.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";G+=`<div class="rec-album-row">${se}<span class="rec-album-name">${a(x.name)}</span>${le}${P(g.name,x.name,x.inPlex)}</div>`}T.innerHTML=G+"</div>"}else T.innerHTML=""}}else if(o.status==="fulfilled"&&!o.value.success){let{i:d}=o.value,c=document.getElementById(`ralb-${d}`);c&&(c.innerHTML="")}if($){let d=r.slice(0,8).map((c,g)=>h(`/api/artist/${encodeURIComponent(c.name)}/info`).then(w=>{let S=document.getElementById(`recs-thumb-${g}`);return S&&w.image&&(S.innerHTML=`<img src="${a(k(w.image,48)||w.image)}" alt="${a(c.name)}" loading="lazy" onerror="this.remove()">`),!0}).catch(()=>!0));Promise.allSettled(d)}}catch(e){if(e.name==="AbortError")return;D(e.message)}}function ie(){document.querySelectorAll(".rec-card[data-inplex]").forEach(s=>{let e=s.dataset.inplex==="true",l=!0;t.recsFilter==="new"&&(l=!e),t.recsFilter==="plex"&&(l=e),s.classList.toggle("hidden",!l)})}function te(s){let e=document.getElementById("badge-releases");e&&(s>0?(e.textContent=s,e.style.display=""):e.style.display="none")}function ne(s){if(!s)return"";let e=new Date(s),r=Math.floor((new Date-e)/864e5);return r===0?"vandaag":r===1?"gisteren":r<7?`${r} dagen geleden`:e.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function q(){M();let s=t.tabAbort?.signal;try{let e=B("releases",3e5);if(!e){if(e=await h("/api/releases",{signal:s}),s?.aborted)return;C("releases",e)}if(e.status==="building"){f(`<div class="loading"><div class="spinner"></div>
        <div>${a(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{t.activeView==="ontdek"&&q()},5e3);return}t.lastReleases=e.releases||[],t.newReleaseIds=new Set(e.newReleaseIds||[]),te(e.newCount||0),oe()}catch(e){if(e.name==="AbortError")return;D(e.message)}}function oe(){let s=t.lastReleases||[];if(!s.length){f('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let e=s;if(t.releasesFilter!=="all"&&(e=s.filter(n=>(n.type||"album").toLowerCase()===t.releasesFilter)),!e.length){f(`<div class="empty">Geen ${t.releasesFilter==="ep"?"EP's":t.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}t.releasesSort==="listening"?e=[...e].sort((n,i)=>(i.artistPlaycount||0)-(n.artistPlaycount||0)||new Date(i.releaseDate)-new Date(n.releaseDate)):e=[...e].sort((n,i)=>new Date(i.releaseDate)-new Date(n.releaseDate));let l=document.getElementById("hdr-title-releases");l&&(l.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${e.length} release${e.length!==1?"s":""}`);let r=n=>({album:"Album",single:"Single",ep:"EP"})[n?.toLowerCase()]||n||"Album",m=n=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[n?.toLowerCase()]||"rel-type-album",p=`<div class="section-title">${e.length} release${e.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let n of e){let i=t.newReleaseIds.has(`${n.artist}::${n.album}`),y=n.image?`<img class="rel-img" src="${a(n.image)}" alt="${a(n.album)} by ${a(n.artist)}" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${b(n.album)}">${u(n.album)}</div>`:`<div class="rel-ph" style="background:${b(n.album)}">${u(n.album)}</div>`,$=n.releaseDate?new Date(n.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",E=ne(n.releaseDate),L=$?`<div class="rel-date">${$} <span class="rel-date-rel">(${E})</span></div>`:"",o=t.plexOk?n.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':n.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",d=n.deezerUrl?`<a class="rel-deezer-link" href="${a(n.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";p+=`
      <div class="rel-card${i?" rel-card-new":""}">
        <div class="rel-cover">${y}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${m(n.type)}">${r(n.type)}</span>
          <div class="rel-album">${a(n.album)}</div>
          <div class="rel-artist artist-link" data-artist="${a(n.artist)}">${a(n.artist)}</div>
          ${L}
          <div class="rel-footer">${o}${d}${P(n.artist,n.album,n.inPlex)}</div>
        </div>
      </div>`}f(p+"</div>");let v=document.getElementById("sec-releases-preview");if(v){let n=e.slice(0,8);v.innerHTML=`<div class="collapsed-thumbs">${n.map(i=>i.image?`<div class="collapsed-thumb">
          <img src="${a(i.image)}" alt="${a(i.album)} by ${a(i.artist)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(i.album)}">${u(i.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${b(i.album)}"><span class="collapsed-thumb-ph">${u(i.album)}</span></div>`).join("")}${e.length>8?`<span class="collapsed-thumbs-more">+${e.length-8}</span>`:""}</div>`}}async function V(){M("Ontdekkingen ophalen...");let s=t.tabAbort?.signal;try{let e=B("discover",3e5);if(!e){if(e=await h("/api/discover",{signal:s}),s?.aborted)return;C("discover",e)}if(e.status==="building"){f(`<div class="loading"><div class="spinner"></div>
        <div>${a(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{t.activeView==="ontdek"&&V()},2e4);return}t.lastDiscover=e,e.plexConnected&&(t.plexOk=!0),re()}catch(e){if(e.name==="AbortError")return;D(e.message)}}function re(){if(!t.lastDiscover)return;let{artists:s,basedOn:e}=t.lastDiscover;if(!s?.length){f('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let l=s;if(t.discFilter==="new"&&(l=s.filter(n=>!n.inPlex)),t.discFilter==="partial"&&(l=s.filter(n=>n.inPlex&&n.missingCount>0)),!l.length){f('<div class="empty">Geen artiesten voor dit filter.</div>');return}let r=document.getElementById("hdr-title-discover");r&&(r.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${l.length} artiesten`);let m=l.reduce((n,i)=>n+i.missingCount,0),p=`<div class="section-title">Gebaseerd op: ${(e||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${m} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let n=0;n<l.length;n++){let i=l[n],y=Math.round(i.match*100),$=[J(i.country),i.country,i.startYear?`Actief vanaf ${i.startYear}`:null,i.totalAlbums?`${i.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),E=k(i.image,120)||i.image,L=E?`<img class="discover-photo" src="${a(E)}" alt="${a(i.name)}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${b(i.name,!0)}">${u(i.name)}</div>`:`<div class="discover-photo-ph" style="background:${b(i.name,!0)}">${u(i.name)}</div>`,o=i.albums?.length||0,d=`${o} album${o!==1?"s":""}`;if(p+=`
      <div class="discover-section collapsed" id="disc-${n}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${n}">
          <div class="discover-card-top">
            ${L}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${a(i.name)}">${a(i.name)}</span>
                ${H(i.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${a(i.reason)}</strong></div>
            </div>
            <span class="discover-match">${y}%</span>
            ${W("artist",i.name,"",i.image||"")}
          </div>
          ${$?`<div class="discover-meta">${a($)}</div>`:""}
          ${O(i.tags,3)}
          ${i.missingCount>0?`<div class="discover-missing">\u2726 ${i.missingCount} ${i.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${n}" data-album-count="${o}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${d}</button>
          ${i.albums?.length?`<div class="discover-preview-row">${i.albums.slice(0,5).map(c=>{let g=b(c.title||"");return c.coverUrl?`<img class="discover-preview-thumb" src="${a(c.coverUrl)}" alt="${a(c.title)}${c.year?" ("+c.year+")":""}" loading="lazy"
                   title="${a(c.title)}${c.year?" ("+c.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${g}">${u(c.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${g}">${u(c.title||"?")}</div>`}).join("")}${i.albums.length>5?`<div class="discover-preview-more">+${i.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,i.albums?.length){p+='<div class="album-grid">';for(let c of i.albums)p+=Y(c,!0,i.name);p+="</div>"}else p+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';p+="</div></div>"}p+="</div>",f(p);let v=document.getElementById("sec-discover-preview");if(v){let n=l.slice(0,8);v.innerHTML=`<div class="collapsed-thumbs">${n.map(i=>i.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${a(i.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(i.name)}">${u(i.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(i.name)}"><span class="collapsed-thumb-ph">${u(i.name)}</span></div>`).join("")}${l.length>8?`<span class="collapsed-thumbs-more">+${l.length-8}</span>`:""}</div>`}}function ce(){try{let s=localStorage.getItem("ontdek-sections");s&&Object.assign(t.collapsibleSections,JSON.parse(s))}catch{}}function de(){try{localStorage.setItem("ontdek-sections",JSON.stringify(t.collapsibleSections))}catch{}}function K(s,e){s.classList.remove("expanded","collapsed"),s.classList.add(e?"collapsed":"expanded")}function N(s,e){let l=document.querySelector(`[data-section="${s}"]`);if(!l)return;let r=l.querySelector(".section-toggle-btn");r&&(K(r,t.collapsibleSections[e]),r.addEventListener("click",m=>{m.preventDefault(),m.stopPropagation(),t.collapsibleSections[e]=!t.collapsibleSections[e],de(),K(r,t.collapsibleSections[e]),l.classList.toggle("collapsed")}),t.collapsibleSections[e]&&l.classList.add("collapsed"))}async function pe(){ce(),t.activeView="ontdek",X();let s=t.spotifyEnabled?`
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
    </div>`:"";A.innerHTML=`
    <div class="ontdek-layout">
      ${s}

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
    </div>`,A.style.opacity="1",A.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{R("recs"),await I(document.getElementById("sec-recs-content"),Z)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{t.lastReleases=null,R("releases");try{await F("/api/releases/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}await I(document.getElementById("sec-releases-content"),q)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{t.lastDiscover=null,R("discover");try{await F("/api/discover/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}await I(document.getElementById("sec-discover-content"),V)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{t.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood","loading")),_(),pe()});{let e=document.getElementById("sec-recs-content");t.sectionContainerEl=e,await Z(),t.sectionContainerEl===e&&(t.sectionContainerEl=null)}(async()=>{try{if(!t.lastReleases){let l=await h("/api/releases");if(l.status==="building")return;t.lastReleases=l.releases||[],t.newReleaseIds=new Set(l.newReleaseIds||[]),te(l.newCount||0)}let e=document.getElementById("sec-releases-preview");if(e&&t.lastReleases.length){let l=t.lastReleases;t.releasesFilter!=="all"&&(l=t.lastReleases.filter(p=>(p.type||"album").toLowerCase()===t.releasesFilter)),t.releasesSort==="listening"?l=[...l].sort((p,v)=>(v.artistPlaycount||0)-(p.artistPlaycount||0)||new Date(v.releaseDate)-new Date(p.releaseDate)):l=[...l].sort((p,v)=>new Date(v.releaseDate)-new Date(p.releaseDate));let r=l.slice(0,8);e.innerHTML=`<div class="collapsed-thumbs">${r.map(p=>p.image?`<div class="collapsed-thumb">
              <img src="${a(p.image)}" alt="${a(p.album)} by ${a(p.artist)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(p.album)}">${u(p.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${b(p.album)}"><span class="collapsed-thumb-ph">${u(p.album)}</span></div>`).join("")}${l.length>8?`<span class="collapsed-thumbs-more">+${l.length-8}</span>`:""}</div>`;let m=document.getElementById("hdr-title-releases");m&&(m.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${l.length} release${l.length!==1?"s":""}`)}}catch{}})(),j(document.getElementById("sec-releases-content"),()=>{let e=document.getElementById("sec-releases-content");return I(e,q)}),(async()=>{try{if(!t.lastDiscover){let m=await h("/api/discover");if(m.status==="building")return;t.lastDiscover=m,m.plexConnected&&(t.plexOk=!0)}let{artists:e}=t.lastDiscover;if(!e?.length)return;let l=e;t.discFilter==="new"&&(l=e.filter(m=>!m.inPlex)),t.discFilter==="partial"&&(l=e.filter(m=>m.inPlex&&m.missingCount>0));let r=document.getElementById("sec-discover-preview");if(r&&l.length){let m=l.slice(0,8);r.innerHTML=`<div class="collapsed-thumbs">${m.map(v=>v.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${a(v.image)}" alt="${a(v.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(v.name)}">${u(v.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(v.name)}"><span class="collapsed-thumb-ph">${u(v.name)}</span></div>`).join("")}${l.length>8?`<span class="collapsed-thumbs-more">+${l.length-8}</span>`:""}</div>`;let p=document.getElementById("hdr-title-discover");p&&(p.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${l.length} artiesten`)}}catch{}})(),j(document.getElementById("sec-discover-content"),()=>{let e=document.getElementById("sec-discover-content");return I(e,V)}),N("recs","recs"),N("releases","releases"),N("discover","discover")}export{ie as applyRecsFilter,fe as checkSpotifyStatus,_ as clearSpotifyRecs,ce as loadCollapsibleState,V as loadDiscover,pe as loadOntdek,Z as loadRecs,q as loadReleases,ee as loadSpotifyRecs,ne as relativeDate,re as renderDiscover,oe as renderReleases,de as saveCollapsibleState,N as setupSectionToggle,ae as spotifyCard,te as updateReleasesBadge,K as updateToggleButtonState};
