import{b as te}from"./chunk-72UF5DHK.js";import"./chunk-JZFIZ5V4.js";import{t as se}from"./chunk-22OPLRLQ.js";import{a as D}from"./chunk-VN7UFMTG.js";import{a as G,c as k,d as x,f as u,g as J,h as a,j as m,k as W,l as O,m as R,n as X,q as w,r as K,s as y,t as B,v as T,w as S,x as H,y as ee,z as b}from"./chunk-FUEEWMYC.js";import{a as v}from"./chunk-GRRN6U7X.js";var L=localStorage.getItem("ontdekTab")||"recs";var C=null,A=null,I=null,F="all",N="all",ae="date",_="all";async function Ee(){try{let e=await b("/api/spotify/status");v.spotifyEnabled=!!e.enabled}catch{v.spotifyEnabled=!1}}function ve(e,s){let l=e.image?`<img src="${a(e.image)}" alt="${a(e.name)} by ${a(e.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',r=e.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${a(e.preview_url)}"
         data-artist="${a(e.artist)}" data-track="${a(e.name)}"
         id="spbtn-${s}" title="Luister preview">\u25B6</button>`:"",o=e.spotify_url?`<a class="spotify-link-btn" href="${a(e.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`<div class="spotify-card">
      <div class="spotify-cover">${l}${r}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${s}"></div></div></div>
      <div class="spotify-info">
        <div class="spotify-track" title="${a(e.name)}">${a(e.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${a(e.artist)}">${a(e.artist)}</div>
        <div class="spotify-album" title="${a(e.album)}">${a(e.album)}</div>${o}</div></div>`}async function ne(e){let s=document.getElementById("spotify-recs-section");if(!s)return;let l={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};s.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let r=`spotify:${e}`,o=T(r,300*1e3);if(o||(o=await b(`/api/spotify/recs?mood=${encodeURIComponent(e)}`),S(r,o)),!o.length){s.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden.</div>';return}let t=`<div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${a(l[e]||e)}</div><div class="spotify-grid">`;o.forEach((n,i)=>{t+=ve(n,i)}),s.innerHTML=t+"</div>"}catch{s.innerHTML=""}}function Te(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.addEventListener("click",e=>{let s=e.target.closest(".spotify-play-btn");if(!s)return;let l=v.playerState;if(!l)return;e.stopPropagation();let r=s.dataset.spotifyPreview;if(r){if(l.previewBtn===s){l.previewAudio.paused?(l.previewAudio.play(),s.textContent="\u23F8",s.classList.add("playing")):(l.previewAudio.pause(),s.textContent="\u25B6",s.classList.remove("playing"));return}if(l.previewBtn){l.previewAudio.pause(),l.previewBtn.textContent="\u25B6",l.previewBtn.classList.remove("playing");let o=l.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||l.previewBtn.closest(".card")?.querySelector(".play-bar-fill");o&&(o.style.width="0%")}l.previewBtn=s,l.previewAudio.src=r,l.previewAudio.currentTime=0,l.previewAudio.play().then(()=>{s.textContent="\u23F8",s.classList.add("playing")}).catch(()=>{s.textContent="\u25B6",l.previewBtn=null})}},!0);async function ie(e){L=e,localStorage.setItem("ontdekTab",e),document.querySelectorAll(".ontdek-tab-btn").forEach(s=>{s.classList.toggle("active",s.dataset.tab===e)}),k.style.opacity="0",k.style.transform="translateY(10px)",setTimeout(()=>{window.scrollTo(0,0),k.style.opacity="1",k.style.transform=""},0),e==="recs"?await re():e==="releases"?await P():e==="discover"?await z():e==="verkenner"&&await oe()}function le(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let s=e.dataset.inplex==="true",l=!0;F==="new"&&(l=!s),F==="plex"&&(l=s),e.classList.toggle("hidden",!l)})}async function re(){y(D(4,2));try{if(!C){let i=T("recs",3e5);if(i||(i=await ee("/api/recs"),S("recs",i)),C=i,v.plexOk=i.plexConnected||v.plexOk,v.lastRecs=i,i.plexConnected&&i.plexArtistCount){let d=document.getElementById("plex-dot");d&&d.classList.add("connected")}}let{recommendations:e=[],albumRecs:s=[],trackRecs:l=[]}=C;if(!e.length){y('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let r=e.filter(i=>!i.inPlex).length,o=e.filter(i=>i.inPlex).length,t=`<div class="spotify-section" id="spotify-recs-section"></div>
      <div class="section-title">Gebaseerd op jouw smaak: ${(C.basedOn||[]).slice(0,3).join(", ")}
      ${v.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${r} nieuw</span> \xB7 <span style="color:var(--plex)">${o} in Plex</span>`:""}</div>
      <div class="rec-grid">`;e.forEach((i,d)=>{let c=Math.round(i.match*100);t+=`<div class="rec-card" data-inplex="${i.inPlex}" id="rc-${d}">
        <div class="rec-photo artist-link" id="rph-${d}" data-artist="${a(i.name)}" title="${a(i.name)} openen" style="cursor:pointer">
          <div class="rec-photo-ph skeleton" style="background:${m(i.name)}">${u(i.name)}</div></div>
        <div class="rec-body">
          <div class="rec-header">
            <div class="rec-title-row">
              <span class="rec-name artist-link" data-artist="${a(i.name)}">${a(i.name)}</span>${R(i.inPlex)}</div>
            <span class="rec-match">${c}%</span></div>
          <div class="rec-reason">Vergelijkbaar met ${a(i.reason)}</div>
          <div id="rtags-${d}"><div class="skeleton" style="height:24px;border-radius:4px"></div></div>
          <div id="ralb-${d}"><div class="skeleton" style="height:80px;border-radius:4px;margin-top:8px"></div></div></div></div>`}),t+="</div>",s.length&&(t+='<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div><div class="albrec-grid">',s.forEach(i=>{let d=x(i.image,80)||i.image,c=d?`<img class="albrec-img" src="${a(d)}" alt="${a(i.album)} by ${a(i.artist)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="albrec-ph" style="display:none;background:${m(i.album)}">${u(i.album)}</div>`:`<div class="albrec-ph" style="background:${m(i.album)}">${u(i.album)}</div>`,p=v.plexOk&&(i.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>')||"";t+=`<div class="albrec-card"><div class="albrec-cover">${c}</div><div class="albrec-info">
          <div class="albrec-title">${a(i.album)}</div><div class="albrec-artist artist-link" data-artist="${a(i.artist)}">${a(i.artist)}</div>
          <div class="albrec-reason">via ${a(i.reason)}</div>${p}${w(i.artist,i.album,i.inPlex)}</div></div>`}),t+="</div>"),l.length&&(t+='<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div><div class="trackrec-list">',l.forEach(i=>{let d=i.playcount>0?`<span class="trackrec-plays">${J(i.playcount)}\xD7</span>`:"",c=i.url?`<a class="trackrec-link" href="${a(i.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";t+=`<div class="trackrec-row"><div class="trackrec-info">
          <div class="trackrec-title">${a(i.track)}</div><div class="trackrec-artist artist-link" data-artist="${a(i.artist)}">${a(i.artist)}</div>
          <div class="trackrec-reason">via ${a(i.reason)}</div></div><div class="trackrec-meta">${d}${c}</div></div>`}),t+="</div>"),y(t,()=>{v.activeMood&&ne(v.activeMood)}),le(),(await Promise.allSettled(e.map((i,d)=>b(`/api/artist/${encodeURIComponent(i.name)}/info`).then(c=>({i:d,info:c}))))).forEach(i=>{if(i.status==="fulfilled"){let{i:d,info:c}=i.value,p=e[d],f=document.getElementById(`rph-${d}`);f&&c.image&&(f.setAttribute("data-artist",p.name),f.style.cursor="pointer",f.innerHTML=`<img src="${x(c.image,120)||c.image}" alt="${a(p.name)}" loading="lazy" decoding="async"
            onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${m(p.name)}\\'>${u(p.name)}</div>'">`);let $=document.getElementById(`rtags-${d}`);$&&($.innerHTML=O(c.tags,3)+'<div style="height:6px"></div>');let g=document.getElementById(`ralb-${d}`);if(g&&c.albums?.length){let E='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';c.albums.slice(0,4).forEach(h=>{let de=h.image?`<img class="rec-album-img" src="${x(h.image,48)||h.image}" alt="${a(h.name)}" loading="lazy" decoding="async">`:'<div class="rec-album-ph">\u266A</div>',ce=v.plexOk&&h.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";E+=`<div class="rec-album-row">${de}<span class="rec-album-name">${a(h.name)}</span>${ce}${w(p.name,h.name,h.inPlex)}</div>`}),g.innerHTML=E+"</div>"}}})}catch(e){e.name!=="AbortError"&&B(e.message)}}function pe(e){if(!e)return"";let s=new Date(e),r=Math.floor((new Date-s)/864e5);return r===0?"vandaag":r===1?"gisteren":r<7?`${r} dagen geleden`:s.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function P(){y(D(4,2));try{if(!A){let n=T("releases",3e5);if(!n){if(n=await b("/api/releases"),n.status==="building"){y(`<div class="loading"><div class="spinner"></div><div>${a(n.message)}</div>
            <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{v.activeView==="ontdek"&&P()},5e3);return}S("releases",n)}A=n}let e=A.releases||[];v.newReleaseIds=new Set(A.newReleaseIds||[]);let s=e;if(N!=="all"&&(s=e.filter(n=>(n.type||"album").toLowerCase()===N)),ae==="listening"?s=[...s].sort((n,i)=>(i.artistPlaycount||0)-(n.artistPlaycount||0)||new Date(i.releaseDate)-new Date(n.releaseDate)):s=[...s].sort((n,i)=>new Date(i.releaseDate)-new Date(n.releaseDate)),!s.length){y('<div class="empty">Geen releases voor dit filter.</div>');return}let l=n=>({album:"Album",single:"Single",ep:"EP"})[n?.toLowerCase()]||"Album",r=n=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[n?.toLowerCase()]||"rel-type-album",o=`<div class="section-title">${s.length} release${s.length!==1?"s":""} in de afgelopen 30 dagen</div><div class="releases-grid">`;s.forEach(n=>{let i=v.newReleaseIds.has(`${n.artist}::${n.album}`),d=n.image?`<img class="rel-img" src="${a(n.image)}" alt="${a(n.album)} by ${a(n.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="rel-ph" style="display:none;background:${m(n.album)}">${u(n.album)}</div>`:`<div class="rel-ph" style="background:${m(n.album)}">${u(n.album)}</div>`,c=n.releaseDate?new Date(n.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",p=pe(n.releaseDate),f=c?`<div class="rel-date">${c} <span class="rel-date-rel">(${p})</span></div>`:"",$=v.plexOk&&(n.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':n.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"")||"",g=n.deezerUrl?`<a class="rel-deezer-link" href="${a(n.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";o+=`<div class="rel-card${i?" rel-card-new":""}"><div class="rel-cover">${d}</div><div class="rel-info">
        <span class="rel-type-badge ${r(n.type)}">${l(n.type)}</span>
        <div class="rel-album">${a(n.album)}</div><div class="rel-artist artist-link" data-artist="${a(n.artist)}">${a(n.artist)}</div>
        ${f}<div class="rel-footer">${$}${g}${w(n.artist,n.album,n.inPlex)}</div></div></div>`}),y(o+"</div>");let t=e.map(n=>`${n.artist}::${n.album}`);localStorage.setItem("seenReleaseIds",JSON.stringify(t)),v.newReleaseCount=0,te("ontdek",0)}catch(e){e.name!=="AbortError"&&B(e.message)}}async function z(){y(D(4,2));try{if(!I){let t=T("discover",3e5);if(!t){if(t=await b("/api/discover"),t.status==="building"){y(`<div class="loading"><div class="spinner"></div><div>${a(t.message)}</div>
            <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{v.activeView==="ontdek"&&z()},2e4);return}S("discover",t)}I=t,t.plexConnected&&(v.plexOk=!0)}let{artists:e,basedOn:s}=I,l=e;if(_==="new"&&(l=e.filter(t=>!t.inPlex)),_==="partial"&&(l=e.filter(t=>t.inPlex&&t.missingCount>0)),!l.length){y('<div class="empty">Geen artiesten voor dit filter.</div>');return}let r=l.reduce((t,n)=>t+n.missingCount,0),o=`<div class="section-title">Gebaseerd op: ${(s||[]).slice(0,3).join(", ")}
      &nbsp;\xB7&nbsp; <span style="color:var(--new)">${r} albums te ontdekken</span></div><div class="discover-grid">`;l.forEach((t,n)=>{let i=Math.round(t.match*100),d=[W(t.country),t.country,t.startYear?`Actief vanaf ${t.startYear}`:null,t.totalAlbums?`${t.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),c=x(t.image,120)||t.image,p=c?`<img class="discover-photo" src="${a(c)}" alt="${a(t.name)}" loading="lazy" decoding="async"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${m(t.name,!0)}">${u(t.name)}</div>`:`<div class="discover-photo-ph" style="background:${m(t.name,!0)}">${u(t.name)}</div>`,f=t.albums?.length||0,$=`${f} album${f!==1?"s":""}`;o+=`<div class="discover-section collapsed" id="disc-${n}">
        <div class="discover-card discover-card-toggle">
          <div class="discover-card-top">${p}<div class="discover-card-info">
            <div class="discover-card-name"><span class="artist-link" data-artist="${a(t.name)}">${a(t.name)}</span>${R(t.inPlex)}</div>
            <div class="discover-card-sub">Vergelijkbaar met <strong>${a(t.reason)}</strong></div></div>
            <span class="discover-match">${i}%</span>${X("artist",t.name,"",t.image||"")}</div>
          ${d?`<div class="discover-meta">${a(d)}</div>`:""}${O(t.tags,3)}
          ${t.missingCount>0?`<div class="discover-missing">\u2726 ${t.missingCount} ${t.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${n}" data-album-count="${f}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${$}</button>
          ${t.albums?.length?`<div class="discover-preview-row">${t.albums.slice(0,5).map(g=>{let E=m(g.title||"");return g.coverUrl?`<img class="discover-preview-thumb" src="${a(g.coverUrl)}" alt="${a(g.title)}" loading="lazy" decoding="async"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
               <div class="discover-preview-ph" style="display:none;background:${E}">${u(g.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${E}">${u(g.title||"?")}</div>`}).join("")}${t.albums.length>5?`<div class="discover-preview-more">+${t.albums.length-5}</div>`:""}</div>`:""}</div>
        <div class="discover-albums-wrap">`,t.albums?.length?(o+='<div class="album-grid">',t.albums.forEach(g=>{o+=K(g,!0,t.name)}),o+="</div>"):o+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar.</div>',o+="</div></div>"}),y(o+"</div>"),k.addEventListener("click",t=>{let n=t.target.closest(".disc-toggle-btn");if(!n)return;t.stopPropagation();let i=n.closest(".discover-section");if(!i)return;let d=i.id,c=i.classList.contains("collapsed");i.classList.toggle("collapsed"),n.classList.toggle("collapsed",!c),n.classList.toggle("expanded",c);let p=n.dataset.albumCount;n.textContent=c?`Verberg ${p} album${p!=1?"s":""}`:`Toon ${p} album${p!=1?"s":""}`})}catch(e){e.name!=="AbortError"&&B(e.message)}}function Z(e,s=!0){let{artist:l="",title:r="",year:o="",coverUrl:t=null,genre:n=null}=e,i=m(r),d=t?`<img class="vk-cover-img" src="${a(t)}" alt="${a(r)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="vk-cover-ph" style="display:none;background:${i}">${u(r)}</div>`:`<div class="vk-cover-ph" style="background:${i}">${u(r)}</div>`,c=s?`<div class="vk-card-artist artist-link" data-artist="${a(l)}">${a(l)}</div>`:"",p=n?`<span class="vk-genre-tag">${a(n)}</span>`:"";return`<div class="vk-album-card">
    <div class="vk-cover">${d}</div>
    <div class="vk-card-body">
      ${p}
      <div class="vk-card-title" title="${a(r)}">${a(r)}</div>
      ${c}
      ${o?`<div class="vk-card-year">${a(String(o))}</div>`:""}
      ${w(l,r,!1)}
    </div>
  </div>`}function j(e){return`<div class="vk-building">
    <div class="spinner" style="margin-bottom:12px"></div>
    <div class="vk-building-title">${a(e)} wordt opgebouwd</div>
    <div class="vk-building-sub">De eerste keer duurt dit even \u2014 data wordt geladen uit de SQLite-cache.<br>
      Pagina ververst automatisch over 15 seconden.</div>
  </div>`}function M(e,s,l){return`<div class="vk-section-header">
    <span class="vk-section-emoji">${s}</span>
    <span class="vk-section-title">${a(e)}</span>
    <button class="vk-section-refresh tool-btn" data-vk-refresh="${a(l)}" title="Sectie vernieuwen">\u21BB</button>
  </div>`}async function V(e){e.innerHTML=j("Undiscovered Albums");try{let s=await b("/api/discover/undiscovered?limit=30");if(s.status==="building"){setTimeout(()=>V(e),15e3);return}let l=s.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen ontbrekende albums gevonden. Breid je MusicBrainz-cache uit door artiesten op te zoeken.</div>';return}let r='<div class="vk-scroll-row">';l.forEach(o=>{r+=Z(o,!0)}),r+="</div>",e.innerHTML=r}catch(s){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${a(s.message)}</div>`}}async function U(e){e.innerHTML=j("Nieuw in jouw genres");try{let s=await b("/api/discover/genres-new?limit=30");if(s.status==="building"){setTimeout(()=>U(e),15e3);return}let l=s.items||[];if(!l.length){e.innerHTML=`<div class="vk-empty">Geen resultaten \u2014 bezoek meer artiestpagina's om je genre-cache op te bouwen.</div>`;return}let r='<div class="vk-grid">';l.forEach(o=>{r+=Z(o,!0)}),r+="</div>",e.innerHTML=r}catch(s){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${a(s.message)}</div>`}}async function q(e){e.innerHTML=j("Van jouw labels");try{let s=await b("/api/discover/labels?limit=20");if(s.status==="building"){setTimeout(()=>q(e),15e3);return}let l=s.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen label-data gevonden. Zorg dat je artiesten MusicBrainz-tags hebben.</div>';return}let r="";l.forEach(o=>{r+=`<div class="vk-label-group">
        <div class="vk-label-name"># ${a(o.label)}</div>
        <div class="vk-scroll-row">`,(o.albums||[]).forEach(t=>{r+=Z(t,!0)}),r+="</div></div>"}),e.innerHTML=r}catch(s){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${a(s.message)}</div>`}}async function Y(e){e.innerHTML=j("Deep Cuts");try{let s=await b("/api/discover/deep-cuts?limit=30");if(s.status==="building"){setTimeout(()=>Y(e),15e3);return}let l=s.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen deep cuts gevonden. Luister meer muziek zodat je recente-scrobbles-cache wordt gevuld.</div>';return}let r='<div class="vk-track-list">';l.forEach(({artist:o,album:t,year:n,coverUrl:i})=>{let d=m(t),c=i?`<img class="vk-track-img" src="${a(i)}" alt="${a(t)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="vk-track-ph" style="display:none;background:${d}">${u(t)}</div>`:`<div class="vk-track-ph" style="background:${d}">${u(t)}</div>`;r+=`<div class="vk-track-row">
        <div class="vk-track-thumb">${c}</div>
        <div class="vk-track-info">
          <div class="vk-track-album">${a(t)}</div>
          <div class="vk-track-artist artist-link" data-artist="${a(o)}">${a(o)}</div>
          ${n?`<div class="vk-track-year">${a(String(n))}</div>`:""}
        </div>
        <div class="vk-track-actions">${w(o,t,!0)}</div>
      </div>`}),r+="</div>",e.innerHTML=r}catch(s){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${a(s.message)}</div>`}}async function Q(e){e.innerHTML=j("Genre Explorer");try{let s=await b("/api/discover/genre-explorer");if(s.status==="building"){setTimeout(()=>Q(e),15e3);return}let l=s.items||[];if(!l.length){e.innerHTML='<div class="vk-empty">Geen genre-data gevonden. Zorg dat Plex gesynchroniseerd is.</div>';return}let r='<div class="vk-genre-grid">';l.forEach(({genre:o,artistCount:t,sampleArtists:n})=>{let i=m(o);r+=`<button class="vk-genre-pill" data-genre="${a(o)}" style="--pill-color:${i}">
        <span class="vk-genre-pill-name">${a(o)}</span>
        <span class="vk-genre-pill-count">${t} artiest${t!==1?"en":""}</span>
        ${n?.length?`<span class="vk-genre-pill-sample">${n.map(d=>a(d)).join(", ")}</span>`:""}
      </button>`}),r+="</div>",e.innerHTML=r,e.addEventListener("click",o=>{let t=o.target.closest(".vk-genre-pill");t&&ue(t.dataset.genre,l)})}catch(s){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${a(s.message)}</div>`}}function ue(e,s){let l=s.find(o=>o.genre===e);if(!l)return;document.getElementById("vk-genre-modal")?.remove();let r=document.createElement("div");r.id="vk-genre-modal",r.className="vk-modal-overlay",r.innerHTML=`
    <div class="vk-modal">
      <div class="vk-modal-header">
        <span class="vk-modal-title"># ${a(l.genre)}</span>
        <span class="vk-modal-count">${l.artistCount} artiest${l.artistCount!==1?"en":""}</span>
        <button class="vk-modal-close" id="vk-modal-close">\u2715</button>
      </div>
      <div class="vk-modal-body">
        <div class="vk-modal-loading"><div class="spinner"></div></div>
      </div>
    </div>`,document.body.appendChild(r),document.getElementById("vk-modal-close").addEventListener("click",()=>r.remove()),r.addEventListener("click",o=>{o.target===r&&r.remove()}),b(`/api/plex/genre/${encodeURIComponent(e)}`).then(o=>{let t=o.artists||o||[],n=r.querySelector(".vk-modal-body");if(!t.length){n.innerHTML='<div class="vk-empty">Geen artiesten voor dit genre.</div>';return}let i='<div class="vk-modal-artist-grid">';t.forEach(d=>{let c=d.name||d,p=m(c),f=d.image?`<img class="vk-modal-artist-img" src="${a(x(d.image,80)||d.image)}" alt="${a(c)}" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="vk-modal-artist-ph" style="display:none;background:${p}">${u(c)}</div>`:`<div class="vk-modal-artist-ph" style="background:${p}">${u(c)}</div>`;i+=`<div class="vk-modal-artist-card artist-link" data-artist="${a(c)}">
          <div class="vk-modal-artist-thumb">${f}</div>
          <div class="vk-modal-artist-name">${a(c)}</div>
        </div>`}),n.innerHTML=i+"</div>"}).catch(()=>{let o=r.querySelector(".vk-modal-body");o.innerHTML=`<div class="vk-modal-artist-grid">${(l.sampleArtists||[]).map(t=>`<div class="vk-modal-artist-card artist-link" data-artist="${a(t)}">
            <div class="vk-modal-artist-ph" style="background:${m(t)}">${u(t)}</div>
            <div class="vk-modal-artist-name">${a(t)}</div>
          </div>`).join("")}</div>`})}async function oe(){let e=`
  <div class="vk-page">

    <!-- Sectie 1: Undiscovered Albums -->
    <div class="vk-section" id="vk-undiscovered">
      ${M("Ontbrekende Albums","\u{1F4C0}","undiscovered")}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="vk-body-undiscovered"></div>
    </div>

    <!-- Sectie 2: New In Your Genres -->
    <div class="vk-section" id="vk-genres-new">
      ${M("Nieuw in jouw genres","\u{1F3B8}","genres_new")}
      <p class="vk-section-desc">Albums die passen bij de genres die je al in Plex hebt, maar die je nog mist.</p>
      <div class="vk-section-body" id="vk-body-genres-new"></div>
    </div>

    <!-- Sectie 3: From Your Labels -->
    <div class="vk-section" id="vk-labels">
      ${M("Van jouw labels / tags","\u{1F3F7}\uFE0F","labels")}
      <p class="vk-section-desc">Gegroepeerd op muzikale stijl: releases die bij jouw collectie-DNA passen.</p>
      <div class="vk-section-body" id="vk-body-labels"></div>
    </div>

    <!-- Sectie 4: Deep Cuts -->
    <div class="vk-section" id="vk-deep-cuts">
      ${M("Deep Cuts","\u{1F3B5}","deep_cuts")}
      <p class="vk-section-desc">Albums van artiesten die je luistert, maar die je waarschijnlijk al een tijdje niet gehoord hebt.</p>
      <div class="vk-section-body" id="vk-body-deep-cuts"></div>
    </div>

    <!-- Sectie 5: Genre Explorer -->
    <div class="vk-section vk-section--hero" id="vk-genre-explorer">
      ${M("Genre Explorer","\u{1F5FA}\uFE0F","genre_explorer")}
      <p class="vk-section-desc">Alle genres in je bibliotheek. Klik op een genre om de artiesten te bekijken.</p>
      <div class="vk-section-body" id="vk-body-genre-explorer"></div>
    </div>

  </div>`;y(e),await Promise.allSettled([V(document.getElementById("vk-body-undiscovered")),U(document.getElementById("vk-body-genres-new")),q(document.getElementById("vk-body-labels")),Y(document.getElementById("vk-body-deep-cuts")),Q(document.getElementById("vk-body-genre-explorer"))]),k.addEventListener("click",async s=>{let l=s.target.closest(".vk-section-refresh");if(!l)return;let r=l.dataset.vkRefresh;try{await b("/api/discover/cache-refresh",{method:"POST"})}catch{}let o={undiscovered:["vk-body-undiscovered",V],genres_new:["vk-body-genres-new",U],labels:["vk-body-labels",q],deep_cuts:["vk-body-deep-cuts",Y],genre_explorer:["vk-body-genre-explorer",Q]};if(o[r]){let[t,n]=o[r],i=document.getElementById(t);i&&await n(i)}})}async function Se(){v.activeView="ontdek",se();let e=`<div class="ontdek-controls" style="padding:12px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <div style="display:flex;gap:4px">
      <button class="ontdek-tab-btn active" data-tab="recs" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F3AF} Aanbevelingen</button>
      <button class="ontdek-tab-btn" data-tab="releases" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F4BF} Releases</button>
      <button class="ontdek-tab-btn" data-tab="discover" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F52D} Ontdek</button>
      <button class="ontdek-tab-btn" data-tab="verkenner" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F50D} Verkenner</button>
    </div>`;v.spotifyEnabled&&(e+=`<span style="flex:1"></span><span style="font-size:12px;color:var(--muted)">Mood:</span>
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
  </div>`,k.innerHTML=e,k.style.opacity="1",k.style.transform="",k.addEventListener("click",async s=>{let l=s.target.closest(".ontdek-tab-btn");if(l){s.preventDefault(),await ie(l.dataset.tab);return}let r=s.target.closest(".ontdek-filter");if(r){let t=r.dataset.for,n=r.dataset.filter;t==="recs"?(F=n,le()):t==="releases"?(N=n,P()):t==="discover"&&(_=n,z()),document.querySelectorAll(`.ontdek-filter[data-for="${t}"]`).forEach(i=>i.classList.toggle("active",i===r));return}let o=s.target.closest(".ontdek-sort");if(o){ae=o.dataset.sort,P(),document.querySelectorAll(".ontdek-sort").forEach(t=>t.classList.toggle("active",t===o));return}if(s.target.id==="ontdek-refresh"){if(L==="recs")H("recs"),C=null,re();else if(L==="releases"){H("releases"),A=null;try{await G("/api/releases/refresh",{method:"POST"})}catch{}P()}else if(L==="discover"){H("discover"),I=null;try{await G("/api/discover/refresh",{method:"POST"})}catch{}z()}else if(L==="verkenner"){try{await b("/api/discover/cache-refresh",{method:"POST"})}catch{}oe()}}}),document.querySelectorAll(".mood-btn").forEach(s=>{s.addEventListener("click",async()=>{document.querySelectorAll(".mood-btn").forEach(l=>l.classList.remove("active")),s.classList.add("active"),v.activeMood=s.dataset.mood,await ne(v.activeMood)})}),await ie(L)}export{Ee as checkSpotifyStatus,Te as clearSpotifyRecs,Se as loadOntdek,ne as loadSpotifyRecs,ve as spotifyCard};
