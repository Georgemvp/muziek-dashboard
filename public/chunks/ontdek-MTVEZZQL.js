import{b as te}from"./chunk-3L6EEGPA.js";import"./chunk-PFDR24EZ.js";import{t as ie}from"./chunk-32VUYSGQ.js";import{a as U}from"./chunk-2UCV5F4T.js";import{a as M,c as f,d as w,f as m,g as ee,h as n,j as g,l as j,m as F,p as S,q as $,r as N,t as z,u as G,v as P,w as se,x as b}from"./chunk-NGNPS5HK.js";import{a as p}from"./chunk-2BMKGNH5.js";var T=localStorage.getItem("ontdekTab")||"discover";var C=null,B=null,V=null,q="all",Y="all",re="date",ge="all";async function Oe(){try{let e=await b("/api/spotify/status");p.spotifyEnabled=!!e.enabled}catch{p.spotifyEnabled=!1}}function be(e,i){let d=e.image?`<img src="${n(e.image)}" alt="${n(e.name)} by ${n(e.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',l=e.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${n(e.preview_url)}"
         data-artist="${n(e.artist)}" data-track="${n(e.name)}"
         id="spbtn-${i}" title="Luister preview">\u25B6</button>`:"",t=e.spotify_url?`<a class="spotify-link-btn" href="${n(e.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`<div class="spotify-card">
      <div class="spotify-cover">${d}${l}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${i}"></div></div></div>
      <div class="spotify-info">
        <div class="spotify-track" title="${n(e.name)}">${n(e.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${n(e.artist)}">${n(e.artist)}</div>
        <div class="spotify-album" title="${n(e.album)}">${n(e.album)}</div>${t}</div></div>`}async function oe(e){let i=document.getElementById("spotify-recs-section");if(!i)return;let d={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};i.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let l=`spotify:${e}`,t=z(l,300*1e3);if(t||(t=await b(`/api/spotify/recs?mood=${encodeURIComponent(e)}`),G(l,t)),!t.length){i.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden.</div>';return}let r=`<div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${n(d[e]||e)}</div><div class="spotify-grid">`;t.forEach((s,a)=>{r+=be(s,a)}),i.innerHTML=r+"</div>"}catch{i.innerHTML=""}}function Re(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.addEventListener("click",e=>{let i=e.target.closest(".spotify-play-btn");if(!i)return;let d=p.playerState;if(!d)return;e.stopPropagation();let l=i.dataset.spotifyPreview;if(l){if(d.previewBtn===i){d.previewAudio.paused?(d.previewAudio.play(),i.textContent="\u23F8",i.classList.add("playing")):(d.previewAudio.pause(),i.textContent="\u25B6",i.classList.remove("playing"));return}if(d.previewBtn){d.previewAudio.pause(),d.previewBtn.textContent="\u25B6",d.previewBtn.classList.remove("playing");let t=d.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||d.previewBtn.closest(".card")?.querySelector(".play-bar-fill");t&&(t.style.width="0%")}d.previewBtn=i,d.previewAudio.src=l,d.previewAudio.currentTime=0,d.previewAudio.play().then(()=>{i.textContent="\u23F8",i.classList.add("playing")}).catch(()=>{i.textContent="\u25B6",d.previewBtn=null})}},!0);async function ae(e){T=e,localStorage.setItem("ontdekTab",e),document.querySelectorAll(".ontdek-tab-btn").forEach(i=>{i.classList.toggle("active",i.dataset.tab===e)}),f.style.opacity="0",f.style.transform="translateY(10px)",setTimeout(()=>{window.scrollTo(0,0),f.style.opacity="1",f.style.transform=""},0),e==="recs"?await ve():e==="releases"?await _():e==="discover"?await I():e==="verkenner"&&await ue()}function ce(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let i=e.dataset.inplex==="true",d=!0;q==="new"&&(d=!i),q==="plex"&&(d=i),e.classList.toggle("hidden",!d)})}async function ve(){$(U(4,2));try{if(!C){let a=z("recs",3e5);if(a||(a=await se("/api/recs"),G("recs",a)),C=a,p.plexOk=a.plexConnected||p.plexOk,p.lastRecs=a,a.plexConnected&&a.plexArtistCount){let o=document.getElementById("plex-dot");o&&o.classList.add("connected")}}let{recommendations:e=[],albumRecs:i=[],trackRecs:d=[]}=C;if(!e.length){$('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let l=e.filter(a=>!a.inPlex).length,t=e.filter(a=>a.inPlex).length,r=`<div class="spotify-section" id="spotify-recs-section"></div>
      <div class="section-title">Gebaseerd op jouw smaak: ${(C.basedOn||[]).slice(0,3).join(", ")}
      ${p.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${l} nieuw</span> \xB7 <span style="color:var(--plex)">${t} in Plex</span>`:""}</div>
      <div class="rec-grid">`;e.forEach((a,o)=>{let c=Math.round(a.match*100);r+=`<div class="rec-card" data-inplex="${a.inPlex}" id="rc-${o}">
        <div class="rec-photo artist-link" id="rph-${o}" data-artist="${n(a.name)}" title="${n(a.name)} openen" style="cursor:pointer">
          <div class="rec-photo-ph skeleton" style="background:${g(a.name)}">${m(a.name)}</div></div>
        <div class="rec-body">
          <div class="rec-header">
            <div class="rec-title-row">
              <span class="rec-name artist-link" data-artist="${n(a.name)}">${n(a.name)}</span>${F(a.inPlex)}</div>
            <span class="rec-match">${c}%</span></div>
          <div class="rec-reason">Vergelijkbaar met ${n(a.reason)}</div>
          <div id="rtags-${o}"><div class="skeleton" style="height:24px;border-radius:4px"></div></div>
          <div id="ralb-${o}"><div class="skeleton" style="height:80px;border-radius:4px;margin-top:8px"></div></div></div></div>`}),r+="</div>",i.length&&(r+='<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div><div class="albrec-grid">',i.forEach(a=>{let o=w(a.image,80)||a.image,c=o?`<img class="albrec-img" src="${n(o)}" alt="${n(a.album)} by ${n(a.artist)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="albrec-ph" style="display:none;background:${g(a.album)}">${m(a.album)}</div>`:`<div class="albrec-ph" style="background:${g(a.album)}">${m(a.album)}</div>`,v=p.plexOk&&(a.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>')||"";r+=`<div class="albrec-card"><div class="albrec-cover">${c}</div><div class="albrec-info">
          <div class="albrec-title">${n(a.album)}</div><div class="albrec-artist artist-link" data-artist="${n(a.artist)}">${n(a.artist)}</div>
          <div class="albrec-reason">via ${n(a.reason)}</div>${v}${S(a.artist,a.album,a.inPlex)}</div></div>`}),r+="</div>"),d.length&&(r+='<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div><div class="trackrec-list">',d.forEach(a=>{let o=a.playcount>0?`<span class="trackrec-plays">${ee(a.playcount)}\xD7</span>`:"",c=a.url?`<a class="trackrec-link" href="${n(a.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";r+=`<div class="trackrec-row"><div class="trackrec-info">
          <div class="trackrec-title">${n(a.track)}</div><div class="trackrec-artist artist-link" data-artist="${n(a.artist)}">${n(a.artist)}</div>
          <div class="trackrec-reason">via ${n(a.reason)}</div></div><div class="trackrec-meta">${o}${c}</div></div>`}),r+="</div>"),$(r,()=>{p.activeMood&&oe(p.activeMood)}),ce(),(await Promise.allSettled(e.map((a,o)=>b(`/api/artist/${encodeURIComponent(a.name)}/info`).then(c=>({i:o,info:c}))))).forEach(a=>{if(a.status==="fulfilled"){let{i:o,info:c}=a.value,v=e[o],u=document.getElementById(`rph-${o}`);u&&c.image&&(u.setAttribute("data-artist",v.name),u.style.cursor="pointer",u.innerHTML=`<img src="${w(c.image,120)||c.image}" alt="${n(v.name)}" loading="lazy" decoding="async"
            onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${g(v.name)}\\'>${m(v.name)}</div>'">`);let y=document.getElementById(`rtags-${o}`);y&&(y.innerHTML=j(c.tags,3)+'<div style="height:6px"></div>');let x=document.getElementById(`ralb-${o}`);if(x&&c.albums?.length){let E='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';c.albums.slice(0,4).forEach(h=>{let R=h.image?`<img class="rec-album-img" src="${w(h.image,48)||h.image}" alt="${n(h.name)}" loading="lazy" decoding="async">`:'<div class="rec-album-ph">\u266A</div>',me=p.plexOk&&h.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";E+=`<div class="rec-album-row">${R}<span class="rec-album-name">${n(h.name)}</span>${me}${S(v.name,h.name,h.inPlex)}</div>`}),x.innerHTML=E+"</div>"}}})}catch(e){e.name!=="AbortError"&&N(e.message)}}function K(e){if(!e)return"";let i=new Date(e),l=Math.floor((new Date-i)/864e5);return l===0?"vandaag":l===1?"gisteren":l<7?`${l} dagen geleden`:i.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function _(){$(U(4,2));try{if(!B){let s=z("releases",3e5);if(!s){if(s=await b("/api/releases"),s.status==="building"){$(`<div class="loading"><div class="spinner"></div><div>${n(s.message)}</div>
            <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{p.activeView==="ontdek"&&_()},5e3);return}G("releases",s)}B=s}let e=B.releases||[];p.newReleaseIds=new Set(B.newReleaseIds||[]);let i=e;if(Y!=="all"&&(i=e.filter(s=>(s.type||"album").toLowerCase()===Y)),re==="listening"?i=[...i].sort((s,a)=>(a.artistPlaycount||0)-(s.artistPlaycount||0)||new Date(a.releaseDate)-new Date(s.releaseDate)):i=[...i].sort((s,a)=>new Date(a.releaseDate)-new Date(s.releaseDate)),!i.length){$('<div class="empty">Geen releases voor dit filter.</div>');return}let d=s=>({album:"Album",single:"Single",ep:"EP"})[s?.toLowerCase()]||"Album",l=s=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[s?.toLowerCase()]||"rel-type-album",t=`<div class="section-title">${i.length} release${i.length!==1?"s":""} in de afgelopen 30 dagen</div><div class="releases-grid">`;i.forEach(s=>{let a=p.newReleaseIds.has(`${s.artist}::${s.album}`),o=s.image?`<img class="rel-img" src="${n(s.image)}" alt="${n(s.album)} by ${n(s.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="rel-ph" style="display:none;background:${g(s.album)}">${m(s.album)}</div>`:`<div class="rel-ph" style="background:${g(s.album)}">${m(s.album)}</div>`,c=s.releaseDate?new Date(s.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",v=K(s.releaseDate),u=c?`<div class="rel-date">${c} <span class="rel-date-rel">(${v})</span></div>`:"",y=p.plexOk&&(s.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':s.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"")||"",x=s.deezerUrl?`<a class="rel-deezer-link" href="${n(s.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";t+=`<div class="rel-card${a?" rel-card-new":""}"><div class="rel-cover">${o}</div><div class="rel-info">
        <span class="rel-type-badge ${l(s.type)}">${d(s.type)}</span>
        <div class="rel-album">${n(s.album)}</div><div class="rel-artist artist-link" data-artist="${n(s.artist)}">${n(s.artist)}</div>
        ${u}<div class="rel-footer">${y}${x}${S(s.artist,s.album,s.inPlex)}</div></div></div>`}),$(t+"</div>");let r=e.map(s=>`${s.artist}::${s.album}`);localStorage.setItem("seenReleaseIds",JSON.stringify(r)),p.newReleaseCount=0,te("ontdek",0)}catch(e){e.name!=="AbortError"&&N(e.message)}}var ye={discovery_weekly:"\u{1F52D}",release_radar:"\u{1F4E1}",daily_mix:"\u{1F3A7}",forgotten_favorites:"\u{1F4AB}",hidden_gems:"\u{1F48E}",popular_picks:"\u{1F525}",discovery_shuffle:"\u{1F3B2}",familiar_favorites:"\u2764\uFE0F",seasonal:"\u{1F338}",decade:"\u{1F4C5}",genre:"\u{1F3B8}"};function L(e,i,d,l=""){let t=l?`<span class="dsc-section-meta" id="dsc-meta-${l}"></span>`:'<span class="dsc-section-meta"></span>';return`<div class="vk-section-header">
    <span class="vk-section-emoji">${e}</span>
    <span class="vk-section-title">${n(i)}</span>
    ${t}
    <button class="vk-section-refresh tool-btn" data-dsc-refresh="${n(d)}" title="Vernieuwen">\u21BB</button>
  </div>`}function k(){return'<div class="dsc-building-badge"><div class="dsc-spin"></div> Wordt opgebouwd\u2026</div>'}function O(e=6){return`<div class="vk-scroll-row">${`<div class="vk-album-card" style="min-width:140px"><div class="vk-cover skeleton"></div>
    <div class="vk-card-body"><div class="skeleton" style="height:12px;width:80%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:10px;width:55%;border-radius:2px"></div></div></div>`.repeat(e)}</div>`}function ke(e=8){return`<div class="vk-grid">${`<div class="vk-album-card"><div class="vk-cover skeleton"></div>
    <div class="vk-card-body"><div class="skeleton" style="height:12px;width:80%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:10px;width:55%;border-radius:2px"></div></div></div>`.repeat(e)}</div>`}function ne(e=6){return`<div class="dsc-similar-grid">${`<div class="dsc-similar-card">
    <div class="dsc-similar-ph skeleton" style="width:52px;height:52px;border-radius:50%;flex-shrink:0"></div>
    <div style="flex:1"><div class="skeleton" style="height:14px;width:65%;border-radius:2px;margin-bottom:6px"></div>
    <div class="skeleton" style="height:11px;width:45%;border-radius:2px;margin-bottom:8px"></div>
    <div class="skeleton" style="height:3px;width:100%;border-radius:2px"></div></div></div>`.repeat(e)}</div>`}function le(e,i){if(!i||i.status==="building"){e.innerHTML=`<div class="vk-empty">${n(i?.message||"Genre-data wordt opgebouwd\u2026")}</div>`;return}let d=(i.genres||[]).slice(0,8);if(!d.length){e.innerHTML='<div class="vk-empty">Nog geen genre-data beschikbaar.</div>';return}let l='<div class="dsc-genre-pills">';d.forEach(t=>{let r=t.color||"var(--accent)",s=(t.topArtists||[]).slice(0,2).map(a=>n(a.name)).join(", ");l+=`<button class="dsc-genre-pill" data-genre="${n(t.genre)}" style="--pill-bg:${n(r)}">
      <span class="dsc-genre-name">${n(t.genre)}</span>
      <span class="dsc-genre-count">${t.count} artiesten</span>
      ${s?`<span class="dsc-genre-sample">${s}</span>`:""}
    </button>`}),l+="</div>",e.innerHTML=l,e.addEventListener("click",t=>{let r=t.target.closest(".dsc-genre-pill");r&&pe(r.dataset.genre,d.map(s=>({genre:s.genre,artistCount:s.count,sampleArtists:(s.topArtists||[]).map(a=>a.name)})))})}function fe(e,i,d){if(!i.length){e.innerHTML=(d?k():"")+'<div class="vk-empty">Geen ontbrekende albums gevonden. Verken artiesten om de MusicBrainz-cache te vullen.</div>';return}let l=d?k():"";l+='<div class="vk-scroll-row">',i.forEach(t=>{l+=H(t,!0)}),l+="</div>",e.innerHTML=l}function he(e,i,d){if(!i.length){e.innerHTML=(d?k():"")+`<div class="vk-empty">Nog geen releases. Bezoek artiestpagina's om de genre-cache te vullen.</div>`;return}let l=new Map;i.forEach(r=>{l.has(r.genre)||l.set(r.genre,[]),l.get(r.genre).push(r)});let t=d?k():"";l.forEach((r,s)=>{t+=`<div class="dsc-genre-group">
      <div class="dsc-genre-group-label">${n(s)}</div>
      <div class="vk-scroll-row">`,r.forEach(a=>{t+=H({title:a.title,artist:a.artist,year:K(a.releaseDate)||(a.releaseDate||"").slice(0,4),coverUrl:a.coverUrl,genre:a.primaryType||null},!0)}),t+="</div></div>"}),e.innerHTML=t}function $e(e,i,d,l){if(!i.length){e.innerHTML=(l?k():"")+'<div class="vk-empty">Geen aanbevelingen beschikbaar.</div>';return}let t=document.getElementById("dsc-meta-similar");t&&d?.length&&(t.textContent=`Op basis van: ${d.slice(0,3).join(", ")}`);let r=l?k():"";r+='<div class="dsc-similar-grid">',i.slice(0,24).forEach(s=>{let a=Math.round(s.match*100),o=w(s.image,120)||s.image,c=o?`<img class="dsc-similar-photo" src="${n(o)}" alt="${n(s.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-similar-ph" style="display:none;background:${g(s.name,!0)}">${m(s.name)}</div>`:`<div class="dsc-similar-ph" style="background:${g(s.name,!0)}">${m(s.name)}</div>`;r+=`<div class="dsc-similar-card artist-link" data-artist="${n(s.name)}">
      ${c}
      <div class="dsc-similar-info">
        <div class="dsc-similar-name">${n(s.name)}${F(s.inPlex)}</div>
        <div class="dsc-similar-reason">Vergelijkbaar met <strong>${n(s.reason)}</strong></div>
        ${j(s.tags,3)}
        <div class="dsc-pop-bar" title="${a}% match">
          <div class="dsc-pop-fill" style="width:${a}%"></div>
        </div>
      </div>
      <span class="dsc-similar-match">${a}%</span>
    </div>`}),r+="</div>",e.innerHTML=r}function xe(e,i,d){if(!i.length){e.innerHTML=(d?k():"")+'<div class="vk-empty">Geen label-data gevonden. Zorg dat artiesten Discogs-tags hebben.</div>';return}let l=new Map;i.forEach(r=>{let s=r.label||"Overig";l.has(s)||l.set(s,[]),l.get(s).push(r)});let t=d?k():"";l.forEach((r,s)=>{t+=`<div class="dsc-label-group">
      <div class="dsc-label-name"># ${n(s)} <span>${r.length} release${r.length!==1?"s":""}</span></div>
      <div class="vk-scroll-row">`,r.forEach(a=>{t+=H({title:a.title,artist:a.artist,year:(a.releaseDate||"").slice(0,4),coverUrl:a.coverUrl},!0)}),t+="</div></div>"}),e.innerHTML=t}function we(e,i,d){if(!i.length){e.innerHTML=(d?k():"")+'<div class="vk-empty">Geen deep cuts gevonden. Verken meer artiesten.</div>';return}let l=d?k():"";l+='<div class="dsc-deepcuts-list">',i.slice(0,15).forEach(t=>{let r=w(t.image,80)||t.image,s=r?`<img class="dsc-deepcuts-photo" src="${n(r)}" alt="${n(t.artist)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-deepcuts-ph" style="display:none;background:${g(t.artist)}">${m(t.artist)}</div>`:`<div class="dsc-deepcuts-ph" style="background:${g(t.artist)}">${m(t.artist)}</div>`,a=t.popularity!=null?`Pop. ${t.popularity}/100`:"Laag bereik";l+=`<div class="dsc-deepcuts-artist">
      <div class="dsc-deepcuts-header">
        ${s}
        <span class="dsc-deepcuts-name artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</span>
        ${j(t.tags,2)}
        <span class="dsc-pop-label">\u{1F52D} ${n(a)}</span>
      </div>
      ${(t.tracks||[]).length?`<div class="dsc-tracks-mini">${t.tracks.map(o=>`<div class="dsc-track-mini-row"><span style="opacity:.5">\u266B</span><span>${n(o.title||"")}</span></div>`).join("")}</div>`:""}
    </div>`}),l+="</div>",e.innerHTML=l}function Le(e,i,d){if(!i.length){e.innerHTML=(d?k():"")+'<div class="vk-empty">Geen vergeten favorieten gevonden.</div>';return}let l=d?k():"";l+='<div class="dsc-hiddengems-grid">',i.forEach(t=>{let r=w(t.image,120)||t.image,s=r?`<img class="dsc-hidden-photo" src="${n(r)}" alt="${n(t.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-hidden-ph" style="display:none;background:${g(t.name)}">${m(t.name)}</div>`:`<div class="dsc-hidden-ph" style="background:${g(t.name)}">${m(t.name)}</div>`;l+=`<div class="dsc-hidden-card artist-link" data-artist="${n(t.name)}">
      ${s}
      <div class="dsc-hidden-name">${n(t.name)}</div>
      ${j(t.tags,2)}
    </div>`}),l+="</div>",e.innerHTML=l}function de(e,i){if(!i?.catalog?.length){e.innerHTML='<div class="vk-empty">Geen playlists. Ga naar de Playlists-tab om te genereren.</div>';return}let d=i.catalog.filter(t=>["discovery_weekly","release_radar","daily_mix","forgotten_favorites","hidden_gems","popular_picks"].includes(t.type));if(!d.length){e.innerHTML='<div class="vk-empty">Geen playlist-types geconfigureerd.</div>';return}let l='<div class="dsc-playlist-grid">';d.forEach(t=>{let r=ye[t.type]||"\u{1F3B5}",s=(t.tracks||[]).filter(c=>c.image).slice(0,4),a=s.length>=2?`<div class="dsc-playlist-mosaic">${s.map(c=>`<img src="${n(w(c.image,100)||c.image)}" alt="" loading="lazy" decoding="async">`).join("")}</div>`:`<div class="dsc-playlist-mosaic-single">${r}</div>`,o=t.generated_at?K(new Date(t.generated_at*1e3).toISOString()):"";l+=`<div class="dsc-playlist-card" data-playlist-type="${n(t.type)}">
      ${a}
      <div class="dsc-playlist-body">
        <div class="dsc-playlist-name">${n(t.name)}</div>
        <div class="dsc-playlist-meta">${t.cached?`${t.track_count} tracks${o?` \xB7 ${o}`:""}`:"Nog niet gegenereerd"}</div>
        <button class="dsc-playlist-btn">${t.cached?"\u25B6 Bekijk":"\u26A1 Genereer"}</button>
      </div>
    </div>`}),l+="</div>",e.innerHTML=l,e.addEventListener("click",()=>{location.hash="#/playlists"})}function Ee(e,i,d){if(!d?.enabled){i.style.display="none";return}i.style.display="";let l=d.artists||[];if(!l.length){e.innerHTML=`<div class="vk-empty">Geen aanbevelingen van ListenBrainz voor ${n(d.username||"")}.</div>`;return}let t='<div class="dsc-lb-grid">';l.slice(0,24).forEach(r=>{let s=w(r.image,80)||r.image,a=s?`<img class="dsc-lb-photo" src="${n(s)}" alt="${n(r.name)}" loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="dsc-lb-ph" style="display:none;background:${g(r.name)}">${m(r.name)}</div>`:`<div class="dsc-lb-ph" style="background:${g(r.name)}">${m(r.name)}</div>`;t+=`<div class="dsc-lb-card artist-link" data-artist="${n(r.name)}">
      ${a}
      <div class="dsc-lb-info">
        <div class="dsc-lb-name">${n(r.name)}</div>
        <div class="dsc-lb-meta">${r.inPlex?"\u25B6 In Plex":"\u2726 Nieuw"}${r.genres?.length?` \xB7 ${n(r.genres[0])}`:""}</div>
      </div>
    </div>`}),t+="</div>",e.innerHTML=t}async function I(){let e=Array(5).fill(`<div class="vk-track-row">
    <div class="vk-track-thumb skeleton"></div>
    <div style="flex:1"><div class="skeleton" style="height:13px;width:60%;border-radius:2px;margin-bottom:4px"></div>
    <div class="skeleton" style="height:11px;width:40%;border-radius:2px"></div></div></div>`).join(""),i=`<div class="vk-page" id="dsc-page">

    <div class="vk-section vk-section--hero">
      ${L("\u{1F9EC}","Jouw Muziek DNA","genres")}
      <p class="vk-section-desc">Jouw top-genres op basis van Plex-bibliotheek. Klik op een genre om artiesten te verkennen.</p>
      <div class="vk-section-body" id="dsc-body-hero">
        <div class="dsc-genre-pills">${Array(6).fill('<div class="dsc-genre-pill skeleton" style="min-width:140px;height:76px"></div>').join("")}</div>
      </div>
    </div>

    <div class="vk-section">
      ${L("\u{1F4C0}","Ontbrekende Albums","discover")}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="dsc-body-undiscovered">${O()}</div>
    </div>

    <div class="vk-section">
      ${L("\u{1F3B8}","Nieuw in jouw genres","discover")}
      <p class="vk-section-desc">Recente releases die passen bij jouw top-genres.</p>
      <div class="vk-section-body" id="dsc-body-new-genres">${O()}</div>
    </div>

    <div class="vk-section">
      ${L("\u{1F52D}","Ontdek Nieuwe Artiesten","discover","similar")}
      <p class="vk-section-desc">Vergelijkbare artiesten op basis van jouw luistergedrag.</p>
      <div class="vk-section-body" id="dsc-body-similar">${ne()}</div>
    </div>

    <div class="vk-section">
      ${L("\u{1F3F7}\uFE0F","Van jouw labels","discover")}
      <p class="vk-section-desc">Recente releases van labels die jouw favoriete artiesten uitbrengen.</p>
      <div class="vk-section-body" id="dsc-body-labels">${O()}</div>
    </div>

    <div class="vk-section">
      ${L("\u{1F3B5}","Deep Cuts","discover")}
      <p class="vk-section-desc">Artiesten in je bibliotheek met een laag bereik \u2014 muziek dat je waarschijnlijk nog niet kent.</p>
      <div class="vk-section-body" id="dsc-body-deepcuts"><div class="vk-track-list">${e}</div></div>
    </div>

    <div class="vk-section">
      ${L("\u{1F48E}","Vergeten Favorieten","discover")}
      <p class="vk-section-desc">Je luisterde vroeger veel naar deze artiesten, maar al een tijdje niet meer.</p>
      <div class="vk-section-body" id="dsc-body-hiddengems">${ke(6)}</div>
    </div>

    <div class="vk-section">
      ${L("\u{1F3A7}","Discovery Playlists","playlists")}
      <p class="vk-section-desc">Automatisch gegenereerde playlists op basis van jouw luisterdata.</p>
      <div class="vk-section-body" id="dsc-body-playlists">${O(4)}</div>
    </div>

    <div class="vk-section" id="dsc-lb-section" style="display:none">
      ${L("\u{1F4FB}","ListenBrainz Aanbevelingen","lb")}
      <p class="vk-section-desc">Aanbevolen artiesten op basis van jouw ListenBrainz-profiel.</p>
      <div class="vk-section-body" id="dsc-body-lb">${ne(4)}</div>
    </div>

  </div>`;$(i);let[d,l,t,r]=await Promise.allSettled([b("/api/discover"),b("/api/genres"),b("/api/playlists"),b("/api/listenbrainz/recommendations")]),s=v=>document.getElementById(`dsc-body-${v}`);le(s("hero"),l.status==="fulfilled"?l.value:null),de(s("playlists"),t.status==="fulfilled"?t.value:null);let a=document.getElementById("dsc-lb-section");if(a&&Ee(s("lb"),a,r.status==="fulfilled"?r.value:null),d.status!=="fulfilled"){let v='<div class="vk-empty">Discover-data kon niet worden geladen.</div>';["undiscovered","new-genres","similar","labels","deepcuts","hiddengems"].forEach(u=>{let y=s(u);y&&(y.innerHTML=v)});return}let o=d.value;if(o.status==="building"){let v=`<div class="vk-building">
      <div class="spinner" style="margin-bottom:10px"></div>
      <div class="vk-building-title">Muziekontdekkingen worden geanalyseerd</div>
      <div class="vk-building-sub">${n(o.message||"")}<br>Pagina ververst over 20 seconden.</div>
    </div>`;["undiscovered","new-genres","similar","labels","deepcuts","hiddengems"].forEach(u=>{let y=s(u);y&&(y.innerHTML=v)}),setTimeout(()=>{p.activeView==="ontdek"&&T==="discover"&&I()},2e4);return}o.plexConnected&&(p.plexOk=!0),V=o;let c=o.building||{};fe(s("undiscovered"),o.undiscoveredAlbums||[],c.undiscovered),he(s("new-genres"),o.newInGenres||[],c.newInGenres),$e(s("similar"),o.similarArtists||[],o.basedOn||[],c.similar),xe(s("labels"),o.fromYourLabels||[],c.fromLabels),we(s("deepcuts"),o.deepCuts||[],c.deepCuts),Le(s("hiddengems"),o.hiddenGems||[],c.hiddenGems),f.addEventListener("click",async v=>{if(T!=="discover")return;let u=v.target.closest(".vk-section-refresh[data-dsc-refresh]");if(!u)return;let y=u.dataset.dscRefresh,x=u.closest(".vk-section")?.querySelector(".vk-section-body")?.id;if(!x)return;let E=document.getElementById(x);if(E){u.disabled=!0,u.textContent="\u23F3";try{if(y==="genres")await M("/api/genres/refresh",{method:"POST"}).catch(()=>{}),le(E,await b("/api/genres"));else if(y==="playlists")de(E,await b("/api/playlists"));else if(y==="discover"){await M("/api/discover/refresh",{method:"POST"}).catch(()=>{}),V=null,P("discover"),I();return}}catch{}u.disabled=!1,u.textContent="\u21BB"}})}function H(e,i=!0){let{artist:d="",title:l="",year:t="",coverUrl:r=null,genre:s=null}=e,a=g(l),o=r?`<img class="vk-cover-img" src="${n(r)}" alt="${n(l)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="vk-cover-ph" style="display:none;background:${a}">${m(l)}</div>`:`<div class="vk-cover-ph" style="background:${a}">${m(l)}</div>`,c=i?`<div class="vk-card-artist artist-link" data-artist="${n(d)}">${n(d)}</div>`:"",v=s?`<span class="vk-genre-tag">${n(s)}</span>`:"";return`<div class="vk-album-card">
    <div class="vk-cover">${o}</div>
    <div class="vk-card-body">
      ${v}
      <div class="vk-card-title" title="${n(l)}">${n(l)}</div>
      ${c}
      ${t?`<div class="vk-card-year">${n(String(t))}</div>`:""}
      ${S(d,l,!1)}
    </div>
  </div>`}function D(e){return`<div class="vk-building">
    <div class="spinner" style="margin-bottom:12px"></div>
    <div class="vk-building-title">${n(e)} wordt opgebouwd</div>
    <div class="vk-building-sub">De eerste keer duurt dit even \u2014 data wordt geladen uit de SQLite-cache.<br>
      Pagina ververst automatisch over 15 seconden.</div>
  </div>`}function A(e,i,d){return`<div class="vk-section-header">
    <span class="vk-section-emoji">${i}</span>
    <span class="vk-section-title">${n(e)}</span>
    <button class="vk-section-refresh tool-btn" data-vk-refresh="${n(d)}" title="Sectie vernieuwen">\u21BB</button>
  </div>`}async function J(e){e.innerHTML=D("Undiscovered Albums");try{let i=await b("/api/discover/undiscovered?limit=30");if(i.status==="building"){setTimeout(()=>J(e),15e3);return}let d=i.items||[];if(!d.length){e.innerHTML='<div class="vk-empty">Geen ontbrekende albums gevonden. Breid je MusicBrainz-cache uit door artiesten op te zoeken.</div>';return}let l='<div class="vk-scroll-row">';d.forEach(t=>{l+=H(t,!0)}),l+="</div>",e.innerHTML=l}catch(i){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${n(i.message)}</div>`}}async function Z(e){e.innerHTML=D("Nieuw in jouw genres");try{let i=await b("/api/discover/genres-new?limit=30");if(i.status==="building"){setTimeout(()=>Z(e),15e3);return}let d=i.items||[];if(!d.length){e.innerHTML=`<div class="vk-empty">Geen resultaten \u2014 bezoek meer artiestpagina's om je genre-cache op te bouwen.</div>`;return}let l='<div class="vk-grid">';d.forEach(t=>{l+=H(t,!0)}),l+="</div>",e.innerHTML=l}catch(i){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${n(i.message)}</div>`}}async function Q(e){e.innerHTML=D("Van jouw labels");try{let i=await b("/api/discover/labels?limit=20");if(i.status==="building"){setTimeout(()=>Q(e),15e3);return}let d=i.items||[];if(!d.length){e.innerHTML='<div class="vk-empty">Geen label-data gevonden. Zorg dat je artiesten MusicBrainz-tags hebben.</div>';return}let l="";d.forEach(t=>{l+=`<div class="vk-label-group">
        <div class="vk-label-name"># ${n(t.label)}</div>
        <div class="vk-scroll-row">`,(t.albums||[]).forEach(r=>{l+=H(r,!0)}),l+="</div></div>"}),e.innerHTML=l}catch(i){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${n(i.message)}</div>`}}async function W(e){e.innerHTML=D("Deep Cuts");try{let i=await b("/api/discover/deep-cuts?limit=30");if(i.status==="building"){setTimeout(()=>W(e),15e3);return}let d=i.items||[];if(!d.length){e.innerHTML='<div class="vk-empty">Geen deep cuts gevonden. Luister meer muziek zodat je recente-scrobbles-cache wordt gevuld.</div>';return}let l='<div class="vk-track-list">';d.forEach(({artist:t,album:r,year:s,coverUrl:a})=>{let o=g(r),c=a?`<img class="vk-track-img" src="${n(a)}" alt="${n(r)}" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="vk-track-ph" style="display:none;background:${o}">${m(r)}</div>`:`<div class="vk-track-ph" style="background:${o}">${m(r)}</div>`;l+=`<div class="vk-track-row">
        <div class="vk-track-thumb">${c}</div>
        <div class="vk-track-info">
          <div class="vk-track-album">${n(r)}</div>
          <div class="vk-track-artist artist-link" data-artist="${n(t)}">${n(t)}</div>
          ${s?`<div class="vk-track-year">${n(String(s))}</div>`:""}
        </div>
        <div class="vk-track-actions">${S(t,r,!0)}</div>
      </div>`}),l+="</div>",e.innerHTML=l}catch(i){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${n(i.message)}</div>`}}async function X(e){e.innerHTML=D("Genre Explorer");try{let i=await b("/api/discover/genre-explorer");if(i.status==="building"){setTimeout(()=>X(e),15e3);return}let d=i.items||[];if(!d.length){e.innerHTML='<div class="vk-empty">Geen genre-data gevonden. Zorg dat Plex gesynchroniseerd is.</div>';return}let l='<div class="vk-genre-grid">';d.forEach(({genre:t,artistCount:r,sampleArtists:s})=>{let a=g(t);l+=`<button class="vk-genre-pill" data-genre="${n(t)}" style="--pill-color:${a}">
        <span class="vk-genre-pill-name">${n(t)}</span>
        <span class="vk-genre-pill-count">${r} artiest${r!==1?"en":""}</span>
        ${s?.length?`<span class="vk-genre-pill-sample">${s.map(o=>n(o)).join(", ")}</span>`:""}
      </button>`}),l+="</div>",e.innerHTML=l,e.addEventListener("click",t=>{let r=t.target.closest(".vk-genre-pill");r&&pe(r.dataset.genre,d)})}catch(i){e.innerHTML=`<div class="vk-empty">Fout bij laden: ${n(i.message)}</div>`}}function pe(e,i){let d=i.find(s=>s.genre===e);if(!d)return;document.getElementById("vk-genre-modal")?.remove();let l=document.createElement("div");l.id="vk-genre-modal",l.className="vk-modal-overlay",l.innerHTML=`
    <div class="vk-modal vk-modal--genre">
      <div class="vk-modal-header">
        <div>
          <span class="vk-modal-title"># ${n(d.genre)}</span>
          <span class="vk-modal-count">${d.artistCount} artiest${d.artistCount!==1?"en":""}</span>
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
    </div>`,document.body.appendChild(l),document.getElementById("vk-modal-close").addEventListener("click",()=>l.remove()),l.addEventListener("click",s=>{s.target===l&&l.remove()});let t=document.getElementById("vk-genre-gen-btn");t?.addEventListener("click",async()=>{t.disabled=!0,t.textContent="\u23F3 Genereren\u2026";try{let a=(await b(`/api/playlists/generate/genre?force=true&genre=${encodeURIComponent(e)}`)).tracks||[];t.textContent=`\u2705 ${a.length} tracks`,setTimeout(()=>{t.disabled=!1,t.innerHTML="\u{1F3B5} Genereer Playlist"},3e3)}catch{t.textContent="\u274C Mislukt",t.disabled=!1,setTimeout(()=>{t.innerHTML="\u{1F3B5} Genereer Playlist"},2e3)}});let r=document.getElementById("vk-genre-modal-body");b(`/api/discover/genre-detail/${encodeURIComponent(e)}`).then(s=>{let a=s.artists||[];if(!a.length){r.innerHTML='<div class="vk-empty">Geen artiesten voor dit genre gevonden in je bibliotheek.</div>';return}let o=a.reduce((v,u)=>v+(u.playcount||0),0),c=`
        <div class="vk-genre-stats">
          <div class="vk-genre-stat"><span class="vk-gs-num">${a.length}</span><span class="vk-gs-lbl">Artiesten</span></div>
          <div class="vk-genre-stat"><span class="vk-gs-num">${o.toLocaleString()}</span><span class="vk-gs-lbl">Totale Plays</span></div>
        </div>
        <div class="vk-genre-artist-list">`;a.forEach(v=>{let u=g(v.name),y=v.coverUrl?`<img class="vk-ga-img" src="${n(v.coverUrl)}" alt="${n(v.name)}" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",x=`<div class="vk-ga-ph" style="${v.coverUrl?"display:none;":""}background:${u}">${m(v.name)}</div>`,E=(v.albums||[]).slice(0,4).map(R=>`<span class="vk-ga-album">${n(R.title)}</span>`).join(""),h=v.playcount?`<div class="vk-ga-playbar" title="${v.playcount.toLocaleString()} plays">
               <div class="vk-ga-playbar-fill" style="width:${Math.min(100,Math.round(v.playcount/Math.max(1,a[0].playcount)*100))}%"></div>
             </div>`:"";c+=`<div class="vk-genre-artist-row artist-link" data-artist="${n(v.name)}">
          <div class="vk-ga-thumb">${y}${x}</div>
          <div class="vk-ga-info">
            <div class="vk-ga-name">${n(v.name)}</div>
            <div class="vk-ga-albums">${E}</div>
            ${h}
          </div>
          <div class="vk-ga-plays">${v.playcount?v.playcount.toLocaleString():"\u2014"}</div>
        </div>`}),r.innerHTML=c+"</div>"}).catch(()=>{r.innerHTML=`<div class="vk-modal-artist-grid">${(d.sampleArtists||[]).map(s=>`<div class="vk-modal-artist-card artist-link" data-artist="${n(s)}">
            <div class="vk-modal-artist-ph" style="background:${g(s)}">${m(s)}</div>
            <div class="vk-modal-artist-name">${n(s)}</div>
          </div>`).join("")}</div>`})}async function ue(){let e=`
  <div class="vk-page">

    <!-- Sectie 1: Undiscovered Albums -->
    <div class="vk-section" id="vk-undiscovered">
      ${A("Ontbrekende Albums","\u{1F4C0}","undiscovered")}
      <p class="vk-section-desc">Albums van jouw top-artiesten die in MusicBrainz staan maar niet in je Plex-bibliotheek.</p>
      <div class="vk-section-body" id="vk-body-undiscovered"></div>
    </div>

    <!-- Sectie 2: New In Your Genres -->
    <div class="vk-section" id="vk-genres-new">
      ${A("Nieuw in jouw genres","\u{1F3B8}","genres_new")}
      <p class="vk-section-desc">Albums die passen bij de genres die je al in Plex hebt, maar die je nog mist.</p>
      <div class="vk-section-body" id="vk-body-genres-new"></div>
    </div>

    <!-- Sectie 3: From Your Labels -->
    <div class="vk-section" id="vk-labels">
      ${A("Van jouw labels / tags","\u{1F3F7}\uFE0F","labels")}
      <p class="vk-section-desc">Gegroepeerd op muzikale stijl: releases die bij jouw collectie-DNA passen.</p>
      <div class="vk-section-body" id="vk-body-labels"></div>
    </div>

    <!-- Sectie 4: Deep Cuts -->
    <div class="vk-section" id="vk-deep-cuts">
      ${A("Deep Cuts","\u{1F3B5}","deep_cuts")}
      <p class="vk-section-desc">Albums van artiesten die je luistert, maar die je waarschijnlijk al een tijdje niet gehoord hebt.</p>
      <div class="vk-section-body" id="vk-body-deep-cuts"></div>
    </div>

    <!-- Sectie 5: Genre Explorer -->
    <div class="vk-section vk-section--hero" id="vk-genre-explorer">
      ${A("Genre Explorer","\u{1F5FA}\uFE0F","genre_explorer")}
      <p class="vk-section-desc">Alle genres in je bibliotheek. Klik op een genre om de artiesten te bekijken.</p>
      <div class="vk-section-body" id="vk-body-genre-explorer"></div>
    </div>

  </div>`;$(e),await Promise.allSettled([J(document.getElementById("vk-body-undiscovered")),Z(document.getElementById("vk-body-genres-new")),Q(document.getElementById("vk-body-labels")),W(document.getElementById("vk-body-deep-cuts")),X(document.getElementById("vk-body-genre-explorer"))]),f.addEventListener("click",async i=>{let d=i.target.closest(".vk-section-refresh");if(!d)return;let l=d.dataset.vkRefresh;try{await b("/api/discover/cache-refresh",{method:"POST"})}catch{}let t={undiscovered:["vk-body-undiscovered",J],genres_new:["vk-body-genres-new",Z],labels:["vk-body-labels",Q],deep_cuts:["vk-body-deep-cuts",W],genre_explorer:["vk-body-genre-explorer",X]};if(t[l]){let[r,s]=t[l],a=document.getElementById(r);a&&await s(a)}})}async function Fe(){p.activeView="ontdek",ie();let e=`<div class="ontdek-controls" style="padding:12px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <div style="display:flex;gap:4px">
      <button class="ontdek-tab-btn active" data-tab="recs" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F3AF} Aanbevelingen</button>
      <button class="ontdek-tab-btn" data-tab="releases" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F4BF} Releases</button>
      <button class="ontdek-tab-btn" data-tab="discover" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F52D} Ontdek</button>
      <button class="ontdek-tab-btn" data-tab="verkenner" style="padding:8px 16px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid transparent">\u{1F50D} Verkenner</button>
    </div>`;p.spotifyEnabled&&(e+=`<span style="flex:1"></span><span style="font-size:12px;color:var(--muted)">Mood:</span>
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
  </div>`,f.innerHTML=e,f.style.opacity="1",f.style.transform="",f.addEventListener("click",async i=>{let d=i.target.closest(".ontdek-tab-btn");if(d){i.preventDefault(),await ae(d.dataset.tab);return}let l=i.target.closest(".ontdek-filter");if(l){let r=l.dataset.for,s=l.dataset.filter;r==="recs"?(q=s,ce()):r==="releases"?(Y=s,_()):r==="discover"&&(ge=s,I()),document.querySelectorAll(`.ontdek-filter[data-for="${r}"]`).forEach(a=>a.classList.toggle("active",a===l));return}let t=i.target.closest(".ontdek-sort");if(t){re=t.dataset.sort,_(),document.querySelectorAll(".ontdek-sort").forEach(r=>r.classList.toggle("active",r===t));return}if(i.target.id==="ontdek-refresh"){if(T==="recs")P("recs"),C=null,ve();else if(T==="releases"){P("releases"),B=null;try{await M("/api/releases/refresh",{method:"POST"})}catch{}_()}else if(T==="discover"){P("discover"),V=null;try{await Promise.allSettled([M("/api/discover/refresh",{method:"POST"}),M("/api/genres/refresh",{method:"POST"})])}catch{}I()}else if(T==="verkenner"){try{await b("/api/discover/cache-refresh",{method:"POST"})}catch{}ue()}}}),document.querySelectorAll(".mood-btn").forEach(i=>{i.addEventListener("click",async()=>{document.querySelectorAll(".mood-btn").forEach(d=>d.classList.remove("active")),i.classList.add("active"),p.activeMood=i.dataset.mood,await oe(p.activeMood)})}),await ae(T)}export{Oe as checkSpotifyStatus,Re as clearSpotifyRecs,Fe as loadOntdek,oe as loadSpotifyRecs,be as spotifyCard};
