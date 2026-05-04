import{b as ce}from"./chunk-GIM6KKN7.js";import"./chunk-JVAXILKZ.js";import{t as ve}from"./chunk-ZJS5BHPP.js";import{a as Q}from"./chunk-2UCV5F4T.js";import{a as I,c as w,d as T,f as g,g as re,h as d,j as b,l as A,m as J,p as C,q as L,r as Z,t as R,u as F,v as _,w as oe,x as p}from"./chunk-OJFTIB2W.js";import{a as u}from"./chunk-2BMKGNH5.js";var H=localStorage.getItem("ontdekTab")||"discover";var D=null,G=null,j=null,S=null,Me=300*1e3,ee="all",se="all",ge="date",Se="all";async function qe(){try{let e=await p("/api/core/spotify/status");u.spotifyEnabled=!!e.enabled}catch{u.spotifyEnabled=!1}}function He(e,n){let l=e.image?`<img src="${d(e.image)}" alt="${d(e.name)} by ${d(e.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',t=e.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${d(e.preview_url)}"
         data-artist="${d(e.artist)}" data-track="${d(e.name)}"
         id="spbtn-${n}" title="Luister preview">\u25B6</button>`:"",s=e.spotify_url?`<a class="spotify-link-btn" href="${d(e.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`<div class="spotify-card">
      <div class="spotify-cover">${l}${t}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${n}"></div></div></div>
      <div class="spotify-info">
        <div class="spotify-track" title="${d(e.name)}">${d(e.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${d(e.artist)}">${d(e.artist)}</div>
        <div class="spotify-album" title="${d(e.album)}">${d(e.album)}</div>${s}</div></div>`}async function be(e){let n=document.getElementById("spotify-recs-section");if(!n)return;let l={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};n.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let t=`spotify:${e}`,s=R(t,300*1e3);if(s||(s=await p(`/api/core/spotify/recs?mood=${encodeURIComponent(e)}`),F(t,s)),!s.length){n.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden.</div>';return}let r=`<div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${d(l[e]||e)}</div><div class="spotify-grid">`;s.forEach((i,a)=>{r+=He(i,a)}),n.innerHTML=r+"</div>"}catch{n.innerHTML=""}}function Ye(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.addEventListener("click",e=>{let n=e.target.closest(".spotify-play-btn");if(!n)return;let l=u.playerState;if(!l)return;e.stopPropagation();let t=n.dataset.spotifyPreview;if(t){if(l.previewBtn===n){l.previewAudio.paused?(l.previewAudio.play(),n.textContent="\u23F8",n.classList.add("playing")):(l.previewAudio.pause(),n.textContent="\u25B6",n.classList.remove("playing"));return}if(l.previewBtn){l.previewAudio.pause(),l.previewBtn.textContent="\u25B6",l.previewBtn.classList.remove("playing");let s=l.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||l.previewBtn.closest(".card")?.querySelector(".play-bar-fill");s&&(s.style.width="0%")}l.previewBtn=n,l.previewAudio.src=t,l.previewAudio.currentTime=0,l.previewAudio.play().then(()=>{n.textContent="\u23F8",n.classList.add("playing")}).catch(()=>{n.textContent="\u25B6",l.previewBtn=null})}},!0);async function pe(e){H=e,localStorage.setItem("ontdekTab",e),document.querySelectorAll(".ontdek-tab-btn").forEach(n=>{n.classList.toggle("active",n.dataset.tab===e)}),w.style.opacity="0",w.style.transform="translateY(10px)",setTimeout(()=>{window.scrollTo(0,0),w.style.opacity="1",w.style.transform=""},0),e==="recs"?await ke():e==="releases"?await z():e==="discover"?await Y():e==="verkenner"&&await Te()}function ye(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let n=e.dataset.inplex==="true",l=!0;ee==="new"&&(l=!n),ee==="plex"&&(l=n),e.classList.toggle("hidden",!l)})}async function ke(){L(Q(4,2));try{if(!D){let a=R("recs",3e5);if(a||(a=await oe("/api/recs"),F("recs",a)),D=a,u.plexOk=a.plexConnected||u.plexOk,u.lastRecs=a,a.plexConnected&&a.plexArtistCount){let o=document.getElementById("plex-dot");o&&o.classList.add("connected")}}let{recommendations:e=[],albumRecs:n=[],trackRecs:l=[]}=D;if(!e.length){L('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let t=e.filter(a=>!a.inPlex).length,s=e.filter(a=>a.inPlex).length,r=`<div class="spotify-section" id="spotify-recs-section"></div>
      <div class="section-title">Gebaseerd op jouw smaak: ${(D.basedOn||[]).slice(0,3).join(", ")}
      ${u.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${t} nieuw</span> \xB7 <span style="color:var(--plex)">${s} in Plex</span>`:""}</div>
      <div class="rec-grid">`;e.forEach((a,o)=>{let c=Math.round(a.match*100);r+=`<div class="rec-card" data-inplex="${a.inPlex}" id="rc-${o}">
        <div class="rec-photo artist-link" id="rph-${o}" data-artist="${d(a.name)}" title="${d(a.name)} openen" style="cursor:pointer">
          <div class="rec-photo-ph skeleton" style="background:${b(a.name)}">${g(a.name)}</div></div>
        <div class="rec-body">
          <div class="rec-header">
            <div class="rec-title-row">
              <span class="rec-name artist-link" data-artist="${d(a.name)}">${d(a.name)}</span>${J(a.inPlex)}</div>
            <span class="rec-match">${c}%</span></div>
          <div class="rec-reason">Vergelijkbaar met ${d(a.reason)}</div>
          <div id="rtags-${o}"><div class="skeleton" style="height:24px;border-radius:4px"></div></div>
          <div id="ralb-${o}"><div class="skeleton" style="height:80px;border-radius:4px;margin-top:8px"></div></div></div></div>`}),r+="</div>",n.length&&(r+='<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div><div class="albrec-grid">',n.forEach(a=>{let o=T(a.image,80)||a.image,c=o?`<img class="albrec-img" src="${d(o)}" alt="${d(a.album)} by ${d(a.artist)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="albrec-ph" style="display:none;background:${b(a.album)}">${g(a.album)}</div>`:`<div class="albrec-ph" style="background:${b(a.album)}">${g(a.album)}</div>`,v=u.plexOk&&(a.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>')||"";r+=`<div class="albrec-card"><div class="albrec-cover">${c}</div><div class="albrec-info">
          <div class="albrec-title">${d(a.album)}</div><div class="albrec-artist artist-link" data-artist="${d(a.artist)}">${d(a.artist)}</div>
          <div class="albrec-reason">via ${d(a.reason)}</div>${v}${C(a.artist,a.album,a.inPlex)}</div></div>`}),r+="</div>"),l.length&&(r+='<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div><div class="trackrec-list">',l.forEach(a=>{let o=a.playcount>0?`<span class="trackrec-plays">${re(a.playcount)}\xD7</span>`:"",c=a.url?`<a class="trackrec-link" href="${d(a.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";r+=`<div class="trackrec-row"><div class="trackrec-info">
          <div class="trackrec-title">${d(a.track)}</div><div class="trackrec-artist artist-link" data-artist="${d(a.artist)}">${d(a.artist)}</div>
          <div class="trackrec-reason">via ${d(a.reason)}</div></div><div class="trackrec-meta">${o}${c}</div></div>`}),r+="</div>"),L(r,()=>{u.activeMood&&be(u.activeMood)}),ye(),(await Promise.allSettled(e.map((a,o)=>p(`/api/core/artist/${encodeURIComponent(a.name)}/info`).then(c=>({i:o,info:c}))))).forEach(a=>{if(a.status==="fulfilled"){let{i:o,info:c}=a.value,v=e[o],k=document.getElementById(`rph-${o}`);k&&c.image&&(k.setAttribute("data-artist",v.name),k.style.cursor="pointer",k.innerHTML=`<img src="${T(c.image,120)||c.image}" alt="${d(v.name)}" loading="lazy" decoding="async"
            onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${b(v.name)}\\'>${g(v.name)}</div>'">`);let y=document.getElementById(`rtags-${o}`);y&&(y.innerHTML=A(c.tags,3)+'<div style="height:6px"></div>');let m=document.getElementById(`ralb-${o}`);if(m&&c.albums?.length){let f='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';c.albums.slice(0,4).forEach(h=>{let x=h.image?`<img class="rec-album-img" src="${T(h.image,48)||h.image}" alt="${d(h.name)}" loading="lazy" decoding="async">`:'<div class="rec-album-ph">\u266A</div>',E=u.plexOk&&h.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";f+=`<div class="rec-album-row">${x}<span class="rec-album-name">${d(h.name)}</span>${E}${C(v.name,h.name,h.inPlex)}</div>`}),m.innerHTML=f+"</div>"}}})}catch(e){e.name!=="AbortError"&&Z(e.message)}}function de(e){if(!e)return"";let n=new Date(e),t=Math.floor((new Date-n)/864e5);return t===0?"vandaag":t===1?"gisteren":t<7?`${t} dagen geleden`:n.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function z(){L(Q(4,2));try{if(!G){let i=R("releases",3e5);if(!i){if(i=await p("/api/core/releases"),i.status==="building"){L(`<div class="loading"><div class="spinner"></div><div>${d(i.message)}</div>
            <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{u.activeView==="ontdek"&&z()},5e3);return}F("releases",i)}G=i}let e=G.releases||[];u.newReleaseIds=new Set(G.newReleaseIds||[]);let n=e;if(se!=="all"&&(n=e.filter(i=>(i.type||"album").toLowerCase()===se)),ge==="listening"?n=[...n].sort((i,a)=>(a.artistPlaycount||0)-(i.artistPlaycount||0)||new Date(a.releaseDate)-new Date(i.releaseDate)):n=[...n].sort((i,a)=>new Date(a.releaseDate)-new Date(i.releaseDate)),!n.length){L('<div class="empty">Geen releases voor dit filter.</div>');return}let l=i=>({album:"Album",single:"Single",ep:"EP"})[i?.toLowerCase()]||"Album",t=i=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[i?.toLowerCase()]||"rel-type-album",s=`<div class="section-title">${n.length} release${n.length!==1?"s":""} in de afgelopen 30 dagen</div><div class="releases-grid">`;n.forEach(i=>{let a=u.newReleaseIds.has(`${i.artist}::${i.album}`),o=i.image?`<img class="rel-img" src="${d(i.image)}" alt="${d(i.album)} by ${d(i.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="rel-ph" style="display:none;background:${b(i.album)}">${g(i.album)}</div>`:`<div class="rel-ph" style="background:${b(i.album)}">${g(i.album)}</div>`,c=i.releaseDate?new Date(i.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",v=de(i.releaseDate),k=c?`<div class="rel-date">${c} <span class="rel-date-rel">(${v})</span></div>`:"",y=u.plexOk&&(i.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':i.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"")||"",m=i.deezerUrl?`<a class="rel-deezer-link" href="${d(i.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";s+=`<div class="rel-card${a?" rel-card-new":""}"><div class="rel-cover">${o}</div><div class="rel-info">
        <span class="rel-type-badge ${t(i.type)}">${l(i.type)}</span>
        <div class="rel-album">${d(i.album)}</div><div class="rel-artist artist-link" data-artist="${d(i.artist)}">${d(i.artist)}</div>
        ${k}<div class="rel-footer">${y}${m}${C(i.artist,i.album,i.inPlex)}</div></div></div>`}),L(s+"</div>");let r=e.map(i=>`${i.artist}::${i.album}`);localStorage.setItem("seenReleaseIds",JSON.stringify(r)),u.newReleaseCount=0,ce("ontdek",0)}catch(e){e.name!=="AbortError"&&Z(e.message)}}var je={discovery_weekly:"\u{1F52D}",release_radar:"\u{1F4E1}",daily_mix:"\u{1F3A7}",forgotten_favorites:"\u{1F4AB}",hidden_gems:"\u{1F48E}",popular_picks:"\u{1F525}",discovery_shuffle:"\u{1F3B2}",familiar_favorites:"\u2764\uFE0F",seasonal:"\u{1F338}",decade:"\u{1F4C5}",genre:"\u{1F3B8}"};function M(e,n,l,t=""){let s=t?`<span class="dsc-section-meta" id="dsc-meta-${t}"></span>`:'<span class="dsc-section-meta"></span>';return`<div class="vk-section-header">
    <span class="vk-section-emoji">${e}</span>
    <span class="vk-section-title">${d(n)}</span>
    ${s}
    <button class="vk-section-refresh tool-btn" data-dsc-refresh="${d(l)}" title="Vernieuwen">\u21BB</button>
  </div>`}function $(){return'<div class="dsc-building-badge"><div class="dsc-spin"></div> Wordt opgebouwd\u2026</div>'}function N(e=6){return`<div class="vk-scroll-row">${`<div class="vk-album-card" style="min-width:140px"><div class="vk-cover skeleton"></div>
    <div class="vk-card-body"><div class="skeleton" style="height:12px;width:80%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:10px;width:55%;border-radius:2px"></div></div></div>`.repeat(e)}</div>`}function Ce(e=8){return`<div class="vk-grid">${`<div class="vk-album-card"><div class="vk-cover skeleton"></div>
    <div class="vk-card-body"><div class="skeleton" style="height:12px;width:80%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:10px;width:55%;border-radius:2px"></div></div></div>`.repeat(e)}</div>`}function ue(e=6){return`<div class="dsc-similar-grid">${`<div class="dsc-similar-card">
    <div class="dsc-similar-ph skeleton" style="width:52px;height:52px;border-radius:50%;flex-shrink:0"></div>
    <div style="flex:1"><div class="skeleton" style="height:14px;width:65%;border-radius:2px;margin-bottom:6px"></div>
    <div class="skeleton" style="height:11px;width:45%;border-radius:2px;margin-bottom:8px"></div>
    <div class="skeleton" style="height:3px;width:100%;border-radius:2px"></div></div></div>`.repeat(e)}</div>`}function W(e,n){if(!n||n.status==="building"){e.innerHTML=`<div class="vk-empty">${d(n?.message||"Genre-data wordt opgebouwd\u2026")}</div>`;return}let l=(n.genres||[]).slice(0,8);if(!l.length){e.innerHTML='<div class="vk-empty">Nog geen genre-data beschikbaar.</div>';return}let t='<div class="dsc-genre-pills">';l.forEach(s=>{let r=s.color||"var(--accent)",i=(s.topArtists||[]).slice(0,2).map(a=>d(a.name)).join(", ");t+=`<button class="dsc-genre-pill" data-genre="${d(s.genre)}" style="--pill-bg:${d(r)}">
      <span class="dsc-genre-name">${d(s.genre)}</span>
      <span class="dsc-genre-count">${s.count} artiesten</span>
      ${i?`<span class="dsc-genre-sample">${i}</span>`:""}
    </button>`}),t+="</div>",e.innerHTML=t,e.addEventListener("click",s=>{let r=s.target.closest(".dsc-genre-pill");r&&Ee(r.dataset.genre,l.map(i=>({genre:i.genre,artistCount:i.count,sampleArtists:(i.topArtists||[]).map(a=>a.name)})))})}function fe(e,n,l){if(!n.length){e.innerHTML=(l?$():"")+'<div class="vk-empty">Geen ontbrekende albums gevonden. Verken artiesten om de MusicBrainz-cache te vullen.</div>';return}let t=l?$():"";t+='<div class="vk-scroll-row">',n.forEach(s=>{t+=P(s,!0)}),t+="</div>",e.innerHTML=t}function he(e,n,l){if(!n.length){e.innerHTML=(l?$():"")+`<div class="vk-empty">Nog geen releases. Bezoek artiestpagina's om de genre-cache te vullen.</div>`;return}let t=new Map;n.forEach(r=>{t.has(r.genre)||t.set(r.genre,[]),t.get(r.genre).push(r)});let s=l?$():"";t.forEach((r,i)=>{s+=`<div class="dsc-genre-group">
      <div class="dsc-genre-group-label">${d(i)}</div>
      <div class="vk-scroll-row">`,r.forEach(a=>{s+=P({title:a.title,artist:a.artist,year:de(a.releaseDate)||(a.releaseDate||"").slice(0,4),coverUrl:a.coverUrl,genre:a.primaryType||null},!0)}),s+="</div></div>"}),e.innerHTML=s}function $e(e,n,l,t){if(!n.length){e.innerHTML=(t?$():"")+'<div class="vk-empty">Geen aanbevelingen beschikbaar.</div>';return}let s=document.getElementById("dsc-meta-similar");s&&l?.length&&(s.textContent=`Op basis van: ${l.slice(0,3).join(", ")}`);let r=t?$():"";r+='<div class="dsc-similar-grid">',n.slice(0,24).forEach(i=>{let a=Math.round(i.match*100),o=T(i.image,120)||i.image,c=o?`<img class="dsc-similar-photo" src="${d(o)}" alt="${d(i.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-similar-ph" style="display:none;background:${b(i.name,!0)}">${g(i.name)}</div>`:`<div class="dsc-similar-ph" style="background:${b(i.name,!0)}">${g(i.name)}</div>`;r+=`<div class="dsc-similar-card artist-link" data-artist="${d(i.name)}">
      ${c}
      <div class="dsc-similar-info">
        <div class="dsc-similar-name">${d(i.name)}${J(i.inPlex)}</div>
        <div class="dsc-similar-reason">Vergelijkbaar met <strong>${d(i.reason)}</strong></div>
        ${A(i.tags,3)}
        <div class="dsc-pop-bar" title="${a}% match">
          <div class="dsc-pop-fill" style="width:${a}%"></div>
        </div>
      </div>
      <span class="dsc-similar-match">${a}%</span>
    </div>`}),r+="</div>",e.innerHTML=r}function we(e,n,l){if(!n.length){e.innerHTML=(l?$():"")+'<div class="vk-empty">Geen label-data gevonden. Zorg dat artiesten Discogs-tags hebben.</div>';return}let t=new Map;n.forEach(r=>{let i=r.label||"Overig";t.has(i)||t.set(i,[]),t.get(i).push(r)});let s=l?$():"";t.forEach((r,i)=>{s+=`<div class="dsc-label-group">
      <div class="dsc-label-name"># ${d(i)} <span>${r.length} release${r.length!==1?"s":""}</span></div>
      <div class="vk-scroll-row">`,r.forEach(a=>{s+=P({title:a.title,artist:a.artist,year:(a.releaseDate||"").slice(0,4),coverUrl:a.coverUrl},!0)}),s+="</div></div>"}),e.innerHTML=s}function xe(e,n,l){if(!n.length){e.innerHTML=(l?$():"")+'<div class="vk-empty">Geen deep cuts gevonden. Verken meer artiesten.</div>';return}let t=l?$():"";t+='<div class="dsc-deepcuts-list">',n.slice(0,15).forEach(s=>{let r=T(s.image,80)||s.image,i=r?`<img class="dsc-deepcuts-photo" src="${d(r)}" alt="${d(s.artist)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-deepcuts-ph" style="display:none;background:${b(s.artist)}">${g(s.artist)}</div>`:`<div class="dsc-deepcuts-ph" style="background:${b(s.artist)}">${g(s.artist)}</div>`,a=s.popularity!=null?`Pop. ${s.popularity}/100`:"Laag bereik";t+=`<div class="dsc-deepcuts-artist">
      <div class="dsc-deepcuts-header">
        ${i}
        <span class="dsc-deepcuts-name artist-link" data-artist="${d(s.artist)}">${d(s.artist)}</span>
        ${A(s.tags,2)}
        <span class="dsc-pop-label">\u{1F52D} ${d(a)}</span>
      </div>
      ${(s.tracks||[]).length?`<div class="dsc-tracks-mini">${s.tracks.map(o=>`<div class="dsc-track-mini-row"><span style="opacity:.5">\u266B</span><span>${d(o.title||"")}</span></div>`).join("")}</div>`:""}
    </div>`}),t+="</div>",e.innerHTML=t}function Le(e,n,l){if(!n.length){e.innerHTML=(l?$():"")+'<div class="vk-empty">Geen vergeten favorieten gevonden.</div>';return}let t=l?$():"";t+='<div class="dsc-hiddengems-grid">',n.forEach(s=>{let r=T(s.image,120)||s.image,i=r?`<img class="dsc-hidden-photo" src="${d(r)}" alt="${d(s.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-hidden-ph" style="display:none;background:${b(s.name)}">${g(s.name)}</div>`:`<div class="dsc-hidden-ph" style="background:${b(s.name)}">${g(s.name)}</div>`;t+=`<div class="dsc-hidden-card artist-link" data-artist="${d(s.name)}">
      ${i}
      <div class="dsc-hidden-name">${d(s.name)}</div>
      ${A(s.tags,2)}
    </div>`}),t+="</div>",e.innerHTML=t}function X(e,n){if(!n?.catalog?.length){e.innerHTML='<div class="vk-empty">Geen playlists. Ga naar de Playlists-tab om te genereren.</div>';return}let l=n.catalog.filter(s=>["discovery_weekly","release_radar","daily_mix","forgotten_favorites","hidden_gems","popular_picks"].includes(s.type));if(!l.length){e.innerHTML='<div class="vk-empty">Geen playlist-types geconfigureerd.</div>';return}let t='<div class="dsc-playlist-grid">';l.forEach(s=>{let r=je[s.type]||"\u{1F3B5}",i=(s.tracks||[]).filter(c=>c.image).slice(0,4),a=i.length>=2?`<div class="dsc-playlist-mosaic">${i.map(c=>`<img src="${d(T(c.image,100)||c.image)}" alt="" loading="lazy" decoding="async">`).join("")}</div>`:`<div class="dsc-playlist-mosaic-single">${r}</div>`,o=s.generated_at?de(new Date(s.generated_at*1e3).toISOString()):"";t+=`<div class="dsc-playlist-card" data-playlist-type="${d(s.type)}">
      ${a}
      <div class="dsc-playlist-body">
        <div class="dsc-playlist-name">${d(s.name)}</div>
        <div class="dsc-playlist-meta">${s.cached?`${s.track_count} tracks${o?` \xB7 ${o}`:""}`:"Nog niet gegenereerd"}</div>
        <button class="dsc-playlist-btn">${s.cached?"\u25B6 Bekijk":"\u26A1 Genereer"}</button>
      </div>
    </div>`}),t+="</div>",e.innerHTML=t,e.addEventListener("click",()=>{location.hash="#/playlists"})}function me(e,n,l){if(!l?.enabled){n.style.display="none";return}n.style.display="";let t=l.artists||[];if(!t.length){e.innerHTML=`<div class="vk-empty">Geen aanbevelingen van ListenBrainz voor ${d(l.username||"")}.</div>`;return}let s='<div class="dsc-lb-grid">';t.slice(0,24).forEach(r=>{let i=T(r.image,80)||r.image,a=i?`<img class="dsc-lb-photo" src="${d(i)}" alt="${d(r.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-lb-ph" style="display:none;background:${b(r.name)}">${g(r.name)}</div>`:`<div class="dsc-lb-ph" style="background:${b(r.name)}">${g(r.name)}</div>`;s+=`<div class="dsc-lb-card artist-link" data-artist="${d(r.name)}">
      ${a}
      <div class="dsc-lb-info">
        <div class="dsc-lb-name">${d(r.name)}</div>
        <div class="dsc-lb-meta">${r.inPlex?"\u25B6 In Plex":"\u2726 Nieuw"}${r.genres?.length?` \xB7 ${d(r.genres[0])}`:""}</div>
      </div>
    </div>`}),s+="</div>",e.innerHTML=s}var V=null;function q(){V&&(clearInterval(V),V=null)}function K(e){if(q(),!Object.values(e).some(Boolean))return;let n={...e};V=setInterval(async()=>{if(u.activeView!=="ontdek"||H!=="discover"){q();return}try{let l=await p("/api/core/discover/status"),t=Object.keys(n).filter(s=>n[s]&&l[s]&&!l[s].building&&l[s].ready);if(t.length){let s=await p("/api/core/discover");if(s.status==="ok"){S={data:s,at:Date.now()},j=s;let r=s.building||{},i=a=>document.getElementById(`dsc-body-${a}`);t.includes("undiscovered")&&i("undiscovered")&&fe(i("undiscovered"),s.undiscoveredAlbums||[],r.undiscovered),t.includes("newInGenres")&&i("new-genres")&&he(i("new-genres"),s.newInGenres||[],r.newInGenres),t.includes("similar")&&i("similar")&&$e(i("similar"),s.similarArtists||[],s.basedOn||[],r.similar),t.includes("fromLabels")&&i("labels")&&we(i("labels"),s.fromYourLabels||[],r.fromLabels),t.includes("deepCuts")&&i("deepcuts")&&xe(i("deepcuts"),s.deepCuts||[],r.deepCuts),t.includes("hiddenGems")&&i("hiddengems")&&Le(i("hiddengems"),s.hiddenGems||[],r.hiddenGems),n={...r}}}Object.values(l).some(s=>s.building)||q()}catch{}},5e3)}function U(e,n){let l=n||e.building||{},t=s=>document.getElementById(`dsc-body-${s}`);t("undiscovered")&&fe(t("undiscovered"),e.undiscoveredAlbums||[],l.undiscovered),t("new-genres")&&he(t("new-genres"),e.newInGenres||[],l.newInGenres),t("similar")&&$e(t("similar"),e.similarArtists||[],e.basedOn||[],l.similar),t("labels")&&we(t("labels"),e.fromYourLabels||[],l.fromLabels),t("deepcuts")&&xe(t("deepcuts"),e.deepCuts||[],l.deepCuts),t("hiddengems")&&Le(t("hiddengems"),e.hiddenGems||[],l.hiddenGems)}async function Y(){let e=Array(5).fill(`<div class="vk-track-row">
    <div class="vk-track-thumb skeleton"></div>
    <div style="flex:1"><div class="skeleton" style="height:13px;width:60%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:11px;width:40%;border-radius:2px"></div></div></div>`).join(""),n=`<div class="vk-page" id="dsc-page">

    <div class="vk-section vk-section--hero">
      ${M("\u{1F9EC}","Jouw Muziek DNA","genres")}
      <p class="vk-section-desc">Jouw top-genres op basis van Plex-bibliotheek. Klik op een genre om artiesten te verkennen.</p>
      <div class="vk-section-body" id="dsc-body-hero">
        <div class="dsc-genre-pills">${Array(6).fill('<div class="dsc-genre-pill skeleton" style="min-width:140px;height:76px"></div>').join("")}</div>
      </div>
    </div>

    <div class="vk-section">
      ${M("\u{1F4C0}","Ontbrekende Albums","discover")}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="dsc-body-undiscovered">${N()}</div>
    </div>

    <div class="vk-section">
      ${M("\u{1F3B8}","Nieuw in jouw genres","discover")}
      <p class="vk-section-desc">Recente releases die passen bij jouw top-genres.</p>
      <div class="vk-section-body" id="dsc-body-new-genres">${N()}</div>
    </div>

    <div class="vk-section">
      ${M("\u{1F52D}","Ontdek Nieuwe Artiesten","discover","similar")}
      <p class="vk-section-desc">Vergelijkbare artiesten op basis van jouw luistergedrag.</p>
      <div class="vk-section-body" id="dsc-body-similar">${ue()}</div>
    </div>

    <div class="vk-section">
      ${M("\u{1F3F7}\uFE0F","Van jouw labels","discover")}
      <p class="vk-section-desc">Recente releases van labels die jouw favoriete artiesten uitbrengen.</p>
      <div class="vk-section-body" id="dsc-body-labels">${N()}</div>
    </div>

    <div class="vk-section">
      ${M("\u{1F3B5}","Deep Cuts","discover")}
      <p class="vk-section-desc">Artiesten in je bibliotheek met een laag bereik \u2014 muziek dat je waarschijnlijk nog niet kent.</p>
      <div class="vk-section-body" id="dsc-body-deepcuts"><div class="vk-track-list">${e}</div></div>
    </div>

    <div class="vk-section">
      ${M("\u{1F48E}","Vergeten Favorieten","discover")}
      <p class="vk-section-desc">Je luisterde vroeger veel naar deze artiesten, maar al een tijdje niet meer.</p>
      <div class="vk-section-body" id="dsc-body-hiddengems">${Ce(6)}</div>
    </div>

    <div class="vk-section">
      ${M("\u{1F3A7}","Discovery Playlists","playlists")}
      <p class="vk-section-desc">Automatisch gegenereerde playlists op basis van jouw luisterdata.</p>
      <div class="vk-section-body" id="dsc-body-playlists">${N(4)}</div>
    </div>

    <div class="vk-section" id="dsc-lb-section" style="display:none">
      ${M("\u{1F4FB}","ListenBrainz Aanbevelingen","lb")}
      <p class="vk-section-desc">Aanbevolen artiesten op basis van jouw ListenBrainz-profiel.</p>
      <div class="vk-section-body" id="dsc-body-lb">${ue(4)}</div>
    </div>

  </div>`,l=Date.now(),t=S&&S.data.status==="ok"?S:null,s=t&&l-t.at<Me;if(L(n),s){t.data.plexConnected&&(u.plexOk=!0),j=t.data,U(t.data);let[y,m,f]=await Promise.allSettled([p("/api/genres"),p("/api/playlists"),p("/api/listenbrainz/recommendations")]),h=E=>document.getElementById(`dsc-body-${E}`);W(h("hero"),y.status==="fulfilled"?y.value:null),X(h("playlists"),m.status==="fulfilled"?m.value:null);let x=document.getElementById("dsc-lb-section");x&&me(h("lb"),x,f.status==="fulfilled"?f.value:null),p("/api/core/discover").then(E=>{E.status==="ok"&&(S={data:E,at:Date.now()},j=E,U(E),K(E.building||{}))}).catch(()=>{});return}let[r,i,a,o]=await Promise.allSettled([p("/api/core/discover"),p("/api/genres"),p("/api/playlists"),p("/api/listenbrainz/recommendations")]),c=y=>document.getElementById(`dsc-body-${y}`);W(c("hero"),i.status==="fulfilled"?i.value:null),X(c("playlists"),a.status==="fulfilled"?a.value:null);let v=document.getElementById("dsc-lb-section");if(v&&me(c("lb"),v,o.status==="fulfilled"?o.value:null),r.status!=="fulfilled"){let y='<div class="vk-empty">Discover-data kon niet worden geladen.</div>';["undiscovered","new-genres","similar","labels","deepcuts","hiddengems"].forEach(m=>{let f=c(m);f&&(f.innerHTML=y)});return}let k=r.value;if(k.status==="building"){if(t){t.data.plexConnected&&(u.plexOk=!0),j=t.data;let y={similar:!0,undiscovered:!0,newInGenres:!0,fromLabels:!0,deepCuts:!0,hiddenGems:!0};U(t.data,y)}else{let y=`<div class="vk-building">
        <div class="spinner" style="margin-bottom:10px"></div>
        <div class="vk-building-title">Muziekontdekkingen worden geanalyseerd</div>
        <div class="vk-building-sub">${d(k.message||"")}<br>Pagina ververst over 20 seconden.</div>
      </div>`;["undiscovered","new-genres","similar","labels","deepcuts","hiddengems"].forEach(m=>{let f=c(m);f&&(f.innerHTML=y)})}K({similar:!0,undiscovered:!0,newInGenres:!0,fromLabels:!0,deepCuts:!0,hiddenGems:!0});return}k.plexConnected&&(u.plexOk=!0),j=k,S={data:k,at:Date.now()},U(k),K(k.building||{}),w.addEventListener("click",async y=>{if(H!=="discover")return;let m=y.target.closest(".vk-section-refresh[data-dsc-refresh]");if(!m)return;let f=m.dataset.dscRefresh,h=m.closest(".vk-section")?.querySelector(".vk-section-body")?.id;if(!h)return;let x=document.getElementById(h);if(x){m.disabled=!0,m.textContent="\u23F3";try{if(f==="genres")await I("/api/genres/refresh",{method:"POST"}).catch(()=>{}),W(x,await p("/api/genres"));else if(f==="playlists")X(x,await p("/api/playlists"));else if(f==="discover"){await I("/api/core/discover/refresh",{method:"POST"}).catch(()=>{}),j=null,S=null,_("discover"),Y();return}}catch{}m.disabled=!1,m.textContent="\u21BB"}})}function P(e,n=!0){let{artist:l="",title:t="",year:s="",coverUrl:r=null,genre:i=null}=e,a=b(t),o=r?`<img class="vk-cover-img" src="${d(r)}" alt="${d(t)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="vk-cover-ph" style="display:none;background:${a}">${g(t)}</div>`:`<div class="vk-cover-ph" style="background:${a}">${g(t)}</div>`,c=n?`<div class="vk-card-artist artist-link" data-artist="${d(l)}">${d(l)}</div>`:"",v=i?`<span class="vk-genre-tag">${d(i)}</span>`:"";return`<div class="vk-album-card">
    <div class="vk-cover">${o}</div>
    <div class="vk-card-body">
      ${v}
      <div class="vk-card-title" title="${d(t)}">${d(t)}</div>
      ${c}
      ${s?`<div class="vk-card-year">${d(String(s))}</div>`:""}
      ${C(l,t,!1)}
    </div>
  </div>`}function O(e){return`<div class="vk-building">
    <div class="spinner" style="margin-bottom:12px"></div>
    <div class="vk-building-title">${d(e)} wordt opgebouwd</div>
    <div class="vk-building-sub">De eerste keer duurt dit even \u2014 data wordt geladen uit de SQLite-cache.<br>
      Pagina ververst automatisch over 15 seconden.</div>
  </div>`}function B(e,n,l){return`<div class="vk-section-header">
    <span class="vk-section-emoji">${n}</span>
    <span class="vk-section-title">${d(e)}</span>
    <button class="vk-section-refresh tool-btn" data-vk-refresh="${d(l)}" title="Sectie vernieuwen">\u21BB</button>
  </div>`}async function te(e){e.innerHTML=O("Undiscovered Albums");try{let n=await p("/api/discover/undiscovered?limit=30");if(n.status==="building"){setTimeout(()=>te(e),15e3);return}let l=n.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen ontbrekende albums gevonden. Breid je MusicBrainz-cache uit door artiesten op te zoeken.</div>';return}let t='<div class="vk-scroll-row">';l.forEach(s=>{t+=P(s,!0)}),t+="</div>",e.innerHTML=t}catch(n){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${d(n.message)}</div>`}}async function ie(e){e.innerHTML=O("Nieuw in jouw genres");try{let n=await p("/api/discover/genres-new?limit=30");if(n.status==="building"){setTimeout(()=>ie(e),15e3);return}let l=n.items||[];if(!l.length){e.innerHTML=`<div class="vk-empty">Geen resultaten \u2014 bezoek meer artiestpagina's om je genre-cache op te bouwen.</div>`;return}let t='<div class="vk-grid">';l.forEach(s=>{t+=P(s,!0)}),t+="</div>",e.innerHTML=t}catch(n){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${d(n.message)}</div>`}}async function ne(e){e.innerHTML=O("Van jouw labels");try{let n=await p("/api/discover/labels?limit=20");if(n.status==="building"){setTimeout(()=>ne(e),15e3);return}let l=n.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen label-data gevonden. Zorg dat je artiesten MusicBrainz-tags hebben.</div>';return}let t="";l.forEach(s=>{t+=`<div class="vk-label-group">
        <div class="vk-label-name"># ${d(s.label)}</div>
        <div class="vk-scroll-row">`,(s.albums||[]).forEach(r=>{t+=P(r,!0)}),t+="</div></div>"}),e.innerHTML=t}catch(n){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${d(n.message)}</div>`}}async function ae(e){e.innerHTML=O("Deep Cuts");try{let n=await p("/api/discover/deep-cuts?limit=30");if(n.status==="building"){setTimeout(()=>ae(e),15e3);return}let l=n.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen deep cuts gevonden. Luister meer muziek zodat je recente-scrobbles-cache wordt gevuld.</div>';return}let t='<div class="vk-track-list">';l.forEach(({artist:s,album:r,year:i,coverUrl:a})=>{let o=b(r),c=a?`<img class="vk-track-img" src="${d(a)}" alt="${d(r)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="vk-track-ph" style="display:none;background:${o}">${g(r)}</div>`:`<div class="vk-track-ph" style="background:${o}">${g(r)}</div>`;t+=`<div class="vk-track-row">
        <div class="vk-track-thumb">${c}</div>
        <div class="vk-track-info">
          <div class="vk-track-album">${d(r)}</div>
          <div class="vk-track-artist artist-link" data-artist="${d(s)}">${d(s)}</div>
          ${i?`<div class="vk-track-year">${d(String(i))}</div>`:""}
        </div>
        <div class="vk-track-actions">${C(s,r,!0)}</div>
      </div>`}),t+="</div>",e.innerHTML=t}catch(n){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${d(n.message)}</div>`}}async function le(e){e.innerHTML=O("Genre Explorer");try{let n=await p("/api/discover/genre-explorer");if(n.status==="building"){setTimeout(()=>le(e),15e3);return}let l=n.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen genre-data gevonden. Zorg dat Plex gesynchroniseerd is.</div>';return}let t='<div class="vk-genre-grid">';l.forEach(({genre:s,artistCount:r,sampleArtists:i})=>{let a=b(s);t+=`<button class="vk-genre-pill" data-genre="${d(s)}" style="--pill-color:${a}">
        <span class="vk-genre-pill-name">${d(s)}</span>
        <span class="vk-genre-pill-count">${r} artiest${r!==1?"en":""}</span>
        ${i?.length?`<span class="vk-genre-pill-sample">${i.map(o=>d(o)).join(", ")}</span>`:""}
      </button>`}),t+="</div>",e.innerHTML=t,e.addEventListener("click",s=>{let r=s.target.closest(".vk-genre-pill");r&&Ee(r.dataset.genre,l)})}catch(n){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${d(n.message)}</div>`}}function Ee(e,n){let l=n.find(i=>i.genre===e);if(!l)return;document.getElementById("vk-genre-modal")?.remove();let t=document.createElement("div");t.id="vk-genre-modal",t.className="vk-modal-overlay",t.innerHTML=`
    <div class="vk-modal vk-modal--genre">
      <div class="vk-modal-header">
        <div>
          <span class="vk-modal-title"># ${d(l.genre)}</span>
          <span class="vk-modal-count">${l.artistCount} artiest${l.artistCount!==1?"en":""}</span>
        </div>
        <div class="vk-modal-header-acts">
          <button class="vk-genre-gen-btn" id="vk-genre-gen-btn" title="Genereer playlist voor dit genre">
            \u{1F3B5} Genereer Playlist
          </button>
          <button class="vk-modal-close" id="vk-modal-close">\u2715</button>
        </div>
      </div>
      <div class="vk-modal-body" id="vk-genre-modal-body">
        <div class="vk-modal-loading"><div class="spinner"></div> Laden\u2026</div>
      </div>
    </div>`,document.body.appendChild(t),document.getElementById("vk-modal-close").addEventListener("click",()=>t.remove()),t.addEventListener("click",i=>{i.target===t&&t.remove()});let s=document.getElementById("vk-genre-gen-btn");s?.addEventListener("click",async()=>{s.disabled=!0,s.textContent="\u23F3 Genereren\u2026";try{let a=(await p(`/api/playlists/generate/genre?force=true&genre=${encodeURIComponent(e)}`)).tracks||[];s.textContent=`\u2705 ${a.length} tracks`,setTimeout(()=>{s.disabled=!1,s.innerHTML="\u{1F3B5} Genereer Playlist"},3e3)}catch{s.textContent="\u274C Mislukt",s.disabled=!1,setTimeout(()=>{s.innerHTML="\u{1F3B5} Genereer Playlist"},2e3)}});let r=document.getElementById("vk-genre-modal-body");p(`/api/discover/genre-detail/${encodeURIComponent(e)}`).then(i=>{let a=i.artists||[];if(!a.length){r.innerHTML='<div class="vk-empty">Geen artiesten voor dit genre gevonden in je bibliotheek.</div>';return}let o=a.reduce((v,k)=>v+(k.playcount||0),0),c=`
        <div class="vk-genre-stats">
          <div class="vk-genre-stat"><span class="vk-gs-num">${a.length}</span><span class="vk-gs-lbl">Artiesten</span></div>
          <div class="vk-genre-stat"><span class="vk-gs-num">${o.toLocaleString()}</span><span class="vk-gs-lbl">Totale Plays</span></div>
        </div>
        <div class="vk-genre-artist-list">`;a.forEach(v=>{let k=b(v.name),y=v.coverUrl?`<img class="vk-ga-img" src="${d(v.coverUrl)}" alt="${d(v.name)}" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",m=`<div class="vk-ga-ph" style="${v.coverUrl?"display:none;":""}background:${k}">${g(v.name)}</div>`,f=(v.albums||[]).slice(0,4).map(x=>`<span class="vk-ga-album">${d(x.title)}</span>`).join(""),h=v.playcount?`<div class="vk-ga-playbar" title="${v.playcount.toLocaleString()} plays">
               <div class="vk-ga-playbar-fill" style="width:${Math.min(100,Math.round(v.playcount/Math.max(1,a[0].playcount)*100))}%"></div>
             </div>`:"";c+=`<div class="vk-genre-artist-row artist-link" data-artist="${d(v.name)}">
          <div class="vk-ga-thumb">${y}${m}</div>
          <div class="vk-ga-info">
            <div class="vk-ga-name">${d(v.name)}</div>
            <div class="vk-ga-albums">${f}</div>
            ${h}
          </div>
          <div class="vk-ga-plays">${v.playcount?v.playcount.toLocaleString():"\u2014"}</div>
        </div>`}),r.innerHTML=c+"</div>"}).catch(()=>{r.innerHTML=`<div class="vk-modal-artist-grid">${(l.sampleArtists||[]).map(i=>`<div class="vk-modal-artist-card artist-link" data-artist="${d(i)}">
            <div class="vk-modal-artist-ph" style="background:${b(i)}">${g(i)}</div>
            <div class="vk-modal-artist-name">${d(i)}</div>
          </div>`).join("")}</div>`})}async function Te(){let e=`
  <div class="vk-page">

    <!-- Sectie 1: Undiscovered Albums -->
    <div class="vk-section" id="vk-undiscovered">
      ${B("Ontbrekende Albums","\u{1F4C0}","undiscovered")}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="vk-body-undiscovered"></div>
    </div>

    <!-- Sectie 2: New In Your Genres -->
    <div class="vk-section" id="vk-genres-new">
      ${B("Nieuw in jouw genres","\u{1F3B8}","genres_new")}
      <p class="vk-section-desc">Albums die passen bij de genres die je al in Plex hebt, maar die je nog mist.</p>
      <div class="vk-section-body" id="vk-body-genres-new"></div>
    </div>

    <!-- Sectie 3: From Your Labels -->
    <div class="vk-section" id="vk-labels">
      ${B("Van jouw labels / tags","\u{1F3F7}\uFE0F","labels")}
      <p class="vk-section-desc">Gegroepeerd op muzikale stijl: releases die bij jouw collectie-DNA passen.</p>
      <div class="vk-section-body" id="vk-body-labels"></div>
    </div>

    <!-- Sectie 4: Deep Cuts -->
    <div class="vk-section" id="vk-deep-cuts">
      ${B("Deep Cuts","\u{1F3B5}","deep_cuts")}
      <p class="vk-section-desc">Albums van artiesten die je luistert, maar die je waarschijnlijk al een tijdje niet gehoord hebt.</p>
      <div class="vk-section-body" id="vk-body-deep-cuts"></div>
    </div>

    <!-- Sectie 5: Genre Explorer -->
    <div class="vk-section vk-section--hero" id="vk-genre-explorer">
      ${B("Genre Explorer","\u{1F5FA}\uFE0F","genre_explorer")}
      <p class="vk-section-desc">Alle genres in je bibliotheek. Klik op een genre om de artiesten te bekijken.</p>
      <div class="vk-section-body" id="vk-body-genre-explorer"></div>
    </div>

  </div>`;L(e),await Promise.allSettled([te(document.getElementById("vk-body-undiscovered")),ie(document.getElementById("vk-body-genres-new")),ne(document.getElementById("vk-body-labels")),ae(document.getElementById("vk-body-deep-cuts")),le(document.getElementById("vk-body-genre-explorer"))]),w.addEventListener("click",async n=>{let l=n.target.closest(".vk-section-refresh");if(!l)return;let t=l.dataset.vkRefresh;try{await p("/api/discover/cache-refresh",{method:"POST"})}catch{}let s={undiscovered:["vk-body-undiscovered",te],genres_new:["vk-body-genres-new",ie],labels:["vk-body-labels",ne],deep_cuts:["vk-body-deep-cuts",ae],genre_explorer:["vk-body-genre-explorer",le]};if(s[t]){let[r,i]=s[t],a=document.getElementById(r);a&&await i(a)}})}async function Je(){u.activeView="ontdek",ve();let e=`<div class="ontdek-controls" style="padding:12px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <div style="display:flex;gap:4px">
      <button class="ontdek-tab-btn active" data-tab="recs" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F3AF} Aanbevelingen</button>
      <button class="ontdek-tab-btn" data-tab="releases" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F4BF} Releases</button>
      <button class="ontdek-tab-btn" data-tab="discover" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F52D} Ontdek</button>
      <button class="ontdek-tab-btn" data-tab="verkenner" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F50D} Verkenner</button>
    </div>`;u.spotifyEnabled&&(e+=`<span style="flex:1"></span><span style="font-size:12px;color:var(--muted)">Mood:</span>
      <button class="mood-btn" data-mood="energiek" style="padding:6px 12px">\u26A1</button>
      <button class="mood-btn" data-mood="chill" style="padding:6px 12px">\u{1F30A}</button>
      <button class="mood-btn" data-mood="melancholisch" style="padding:6px 12px">\u{1F327}</button>
      <button class="mood-btn" data-mood="experimenteel" style="padding:6px 12px">\u{1F52C}</button>
      <button class="mood-btn" data-mood="feest" style="padding:6px 12px">\u{1F389}</button>`),e+=`</div><div style="padding:12px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;flex-wrap:wrap">
    <button class="tool-btn ontdek-filter" data-filter="all" data-for="recs" style="display:none">Alle</button>
    <button class="tool-btn ontdek-filter" data-filter="new" data-for="recs" style="display:none">\u2726 Nieuw</button>
    <button class="tool-btn ontdek-filter" data-filter="plex" data-for="recs" style="display:none">\u25B6 In Plex</button>
    <button class="tool-btn ontdek-filter" data-filter="all" data-for="releases" style="display:none">Alle</button>
    <button class="tool-btn ontdek-filter" data-filter="album" data-for="releases" style="display:none">Albums</button>
    <button class="tool-btn ontdek-filter" data-filter="single" data-for="releases" style="display:none">Singles</button>
    <button class="tool-btn ontdek-filter" data-filter="ep" data-for="releases" style="display:none">EP's</button>
    <button class="tool-btn ontdek-sort" data-sort="date" data-for="releases" style="display:none">Datum</button>
    <button class="tool-btn ontdek-sort" data-sort="listening" data-for="releases" style="display:none">Luistergedrag</button>
    <button class="tool-btn ontdek-filter" data-filter="all" data-for="discover" style="display:none">Alle</button>
    <button class="tool-btn ontdek-filter" data-filter="new" data-for="discover" style="display:none">\u2726 Nieuw</button>
    <button class="tool-btn ontdek-filter" data-filter="partial" data-for="discover" style="display:none">Gedeeltelijk</button>
    <span style="flex:1"></span>
    <button class="tool-btn refresh-btn" id="ontdek-refresh" style="padding:8px 12px">\u21BB Vernieuwen</button>
  </div>`,w.innerHTML=e,w.style.opacity="1",w.style.transform="",w.addEventListener("click",async n=>{let l=n.target.closest(".ontdek-tab-btn");if(l){n.preventDefault(),await pe(l.dataset.tab);return}let t=n.target.closest(".ontdek-filter");if(t){let r=t.dataset.for,i=t.dataset.filter;r==="recs"?(ee=i,ye()):r==="releases"?(se=i,z()):r==="discover"&&(Se=i,Y()),document.querySelectorAll(`.ontdek-filter[data-for="${r}"]`).forEach(a=>a.classList.toggle("active",a===t));return}let s=n.target.closest(".ontdek-sort");if(s){ge=s.dataset.sort,z(),document.querySelectorAll(".ontdek-sort").forEach(r=>r.classList.toggle("active",r===s));return}if(n.target.id==="ontdek-refresh"){if(H==="recs")_("recs"),D=null,ke();else if(H==="releases")_("releases"),G=null,z();else if(H==="discover"){_("discover"),j=null,S=null,q();try{await Promise.allSettled([I("/api/core/discover/refresh",{method:"POST"}),I("/api/genres/refresh",{method:"POST"})])}catch{}Y()}else if(H==="verkenner"){try{await p("/api/discover/cache-refresh",{method:"POST"})}catch{}Te()}}}),document.querySelectorAll(".mood-btn").forEach(n=>{n.addEventListener("click",async()=>{document.querySelectorAll(".mood-btn").forEach(l=>l.classList.remove("active")),n.classList.add("active"),u.activeMood=n.dataset.mood,await be(u.activeMood)})}),await pe(H)}export{qe as checkSpotifyStatus,Ye as clearSpotifyRecs,Je as loadOntdek,be as loadSpotifyRecs,He as spotifyCard};
