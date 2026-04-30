import{n as I}from"./chunk-L7FPKZB5.js";import{a as C}from"./chunk-3JSBPE5U.js";import{G as B,H as L,d as v,g as y,h as o,j as E,k as x,l as H,n as T,q as b,t as k,z as m}from"./chunk-HCN2ZK5I.js";import{a as r}from"./chunk-2BMKGNH5.js";var g=null;async function M(){let t=r.viewParams?.name;if(!t){k("Geen artiest geselecteerd");return}g=t;try{let e=await m(`/api/artist/${encodeURIComponent(t)}/info`);P(t,e),V(t,e)}catch(e){k(`Kan artiest niet laden: ${e.message}`)}}function P(t,e){let i=document.getElementById("content"),a=v(e.imageXl||e.image,600)||e.imageXl||e.image,s=a?`background-image: url('${o(a)}'); background-size: cover; background-position: center;`:`background: ${E(t)};`,l=[];e.country&&l.push(`${x(e.country)} ${o(e.country)}`),e.startYear&&l.push(`Actief sinds ${e.startYear}`),r.plexOk&&e.inPlex&&l.push("\u25B6 In je Plex bibliotheek");let n=l.length>0?`<div class="detail-meta">${l.join(" \xB7 ")}</div>`:"",c="";e.tags&&e.tags.length>0&&(c=`<div class="detail-tags">${H(e.tags,8)}</div>`);let p=r.previousView?`
    <button class="detail-back-btn" data-previous-view="${o(r.previousView)}" title="Terug">
      \u2190 Terug
    </button>
  `:"",h=`
    <div class="detail-hero" style="${s}">
      <div class="detail-hero-overlay"></div>
      ${p}
      <div class="detail-hero-content">
        <h1 class="detail-artist-name">${o(t)}</h1>
        ${n}
        ${c}
        <div class="detail-hero-actions">
          ${T("artist",t,"",e.image||"")}
        </div>
      </div>
    </div>
  `,u="";if(e.albums&&e.albums.length>0){let $=e.albums.filter(d=>d.inPlex),f=e.albums.filter(d=>!d.inPlex);$.length>0&&(u+=`
        <section class="detail-section" id="section-albums">
          <div class="section-header">
            <h2>Albums die je hebt</h2>
            <span class="section-count">${$.length}</span>
          </div>
          <div class="detail-grid">
            ${$.map(d=>z(t,d)).join("")}
          </div>
        </section>
      `),f.length>0&&(u+=`
        <section class="detail-section" id="section-quick-download">
          <div class="section-header">
            <h2>Nog niet gedownload</h2>
            <span class="section-count">${f.length}</span>
          </div>
          <div class="detail-grid">
            ${f.map(d=>S(t,d)).join("")}
          </div>
        </section>
      `)}i.innerHTML=`
    <article class="detail-page">
      ${h}
      <div class="detail-content">
        ${u}

        <!-- Loading placeholders for sections to be filled later -->
        <section class="detail-section" id="section-wikipedia">
          <div class="section-loading">Biografie laden...</div>
        </section>
        <section class="detail-section" id="section-tracks">
          <div class="section-loading">Populaire nummers laden...</div>
        </section>
        <section class="detail-section" id="section-gaps">
          <div class="section-loading">Ontbrekende albums scannen...</div>
        </section>
        <section class="detail-section" id="section-similar">
          <div class="section-loading">Vergelijkbare artiesten laden...</div>
        </section>
      </div>
    </article>
  `,document.title=`Muziek \xB7 ${t}`;let w=document.getElementById("section-quick-download");w&&A(w),q()}async function V(t,e){let[i,a,s,l]=await Promise.allSettled([m(`/api/artist/${encodeURIComponent(t)}/wikipedia`).catch(()=>null),m(`/api/artist/${encodeURIComponent(t)}/similar`).catch(()=>null),m(`/api/gaps/${encodeURIComponent(t)}`).catch(()=>null),m(`/api/artist/${encodeURIComponent(t)}/tracks`).catch(()=>null)]);if(r.activeView==="artist-detail"&&g===t){let n=i.status==="fulfilled"?i.value:null;n?j(n):document.getElementById("section-wikipedia").innerHTML=""}if(r.activeView==="artist-detail"&&g===t){let n=l.status==="fulfilled"?l.value:null;n&&Array.isArray(n)&&n.length>0?O(t,n):document.getElementById("section-tracks").innerHTML=""}if(r.activeView==="artist-detail"&&g===t){let n=s.status==="fulfilled"?s.value:null;n&&n.missing&&n.missing.length>0?D(t,n):document.getElementById("section-gaps").innerHTML=""}if(r.activeView==="artist-detail"&&g===t){let n=a.status==="fulfilled"?a.value:null;if(n&&(n.similar||n.artists)){let c=n.similar||n.artists||[];c.length>0?R(c):document.getElementById("section-similar").innerHTML=""}else document.getElementById("section-similar").innerHTML=""}}function j(t){let e=document.getElementById("section-wikipedia");if(!t||!t.extract){e.innerHTML="";return}let i=t.extract.split(`
`).filter(s=>s.trim().length>0).slice(0,3).map(s=>`<p>${o(s)}</p>`).join(""),a=t.lang?`<span class="wiki-lang-badge">${t.lang.toUpperCase()}</span>`:"";e.innerHTML=`
    <div class="section-header">
      <h2>Over deze artiest</h2>
      ${a}
    </div>
    <div class="detail-bio">
      ${i}
    </div>
    ${t.url?`<a href="${o(t.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia \u2192</a>`:""}
  `}function O(t,e){let i=document.getElementById("section-tracks");if(!e||e.length===0){i.innerHTML="";return}i.innerHTML=`
    <div class="section-header">
      <h2>Populairste nummers</h2>
      <span class="section-count">${e.length}</span>
    </div>
    <div class="detail-tracks-list">
      ${e.map((a,s)=>U(t,a,s+1)).join("")}
    </div>
  `}function D(t,e){let i=document.getElementById("section-gaps");if(!e||!e.missing||e.missing.length===0){i.innerHTML="";return}let s=`<span class="section-badge" title="Discografie compleet">${e.completeness||0}%</span>`;i.innerHTML=`
    <div class="section-header">
      <h2>Ontbrekende albums</h2>
      <span class="section-count">${e.missing.length}</span>
      ${s}
    </div>
    <div class="detail-grid">
      ${e.missing.map(l=>S(t,l)).join("")}
    </div>
  `,A(i)}function A(t){t.querySelectorAll(".panel-orpheus-btn").forEach(e=>{e.addEventListener("click",async i=>{i.stopPropagation();let a=e.dataset.ophArtist,s=e.dataset.ophAlbum,l=e.textContent;e.disabled=!0,e.textContent="\u2026";try{let c=(await B(`${a} ${s}`,"all","album"))?.results||[];if(!c.length||!c[0]?.url)throw new Error("Geen resultaten gevonden in OrpheusDL");let p=c[0],h=localStorage.getItem("orpheusQuality")||"hifi",u=await L(p.url,h,p.title||s,p.artist||a);if(!u?.ok)throw new Error(u?.error||"Download mislukt");e.textContent="\u2713 Gestart",setTimeout(()=>{e.disabled=!1,e.textContent=l},3e3)}catch(n){e.disabled=!1,e.textContent=l;let c=document.createElement("div");c.style.cssText="color:var(--color-error,#e05a2b);font-size:10px;margin-top:2px",c.textContent="\u26A0 "+n.message,e.parentNode.appendChild(c),setTimeout(()=>c.remove(),4e3)}})})}function R(t){let e=document.getElementById("section-similar");if(!t||t.length===0){e.innerHTML="";return}e.innerHTML=`
    <div class="section-header">
      <h2>Vergelijkbare artiesten</h2>
    </div>
    <div class="detail-similar-row">
      ${t.map(i=>`
        <button class="detail-similar-chip" data-artist-detail="${o(i.name)}">
          ${o(i.name)}
        </button>
      `).join("")}
    </div>
  `,document.querySelectorAll(".detail-similar-chip").forEach(i=>{i.addEventListener("click",async a=>{a.preventDefault();let s=i.dataset.artistDetail;s&&(r.previousView=r.activeView,r.viewParams={name:s},await M())})})}function q(){let t=document.getElementById("content"),e=t.querySelector(".detail-back-btn");e&&e.addEventListener("click",async i=>{i.preventDefault();let a=r.previousView||"home";await C(a)}),t.querySelectorAll(".detail-album-play-btn").forEach(i=>{i.addEventListener("click",async a=>{a.stopPropagation();let s=i.dataset.ratingKey;if(s){i.disabled=!0;let l=i.textContent;i.textContent="\u2026";let n=await I(s,"music");i.disabled=!1,i.textContent=n?"\u25B6 Speelt af":l,n&&setTimeout(()=>{i.textContent=l},3e3)}})})}function z(t,e){let i=v(e.image,120)||e.image,a=i?`<img src="${o(i)}" alt="${o(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',s=r.plexOk&&e.inPlex&&e.ratingKey?`<button class="detail-album-play-btn" data-rating-key="${o(e.ratingKey)}" title="Speel af op Plex">\u25B6</button>`:"",l=e.playcount>0?`<div class="album-playcount" title="${e.playcount} keer beluisterd">${y(e.playcount)} \xD7 \u266A</div>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${a}
        ${s}
      </div>
      <div class="album-info">
        <div class="album-name">${o(e.name)}</div>
        ${l}
        ${b(t,e.name,e.inPlex)}
      </div>
    </div>
  `}function S(t,e){let i=v(e.image,120)||e.image,a=i?`<img src="${o(i)}" alt="${o(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',s=e.albumType||"Album",l=e.releaseDate?`<div class="album-year">${e.releaseDate.slice(0,4)}</div>`:"",n=b(t,e.name,!1),c=`<button class="panel-orpheus-btn"
    data-oph-artist="${o(t)}"
    data-oph-album="${o(e.name)}"
    title="Zoeken en downloaden via OrpheusDL">\u2B07 Orpheus</button>`;return`
    <div class="album-card">
      <div class="album-cover">
        ${a}
      </div>
      <div class="album-info">
        <div class="album-name">${o(e.name)}</div>
        <div class="album-meta">${s} ${l.trim()}</div>
        <div class="album-dl-actions">
          ${n}
          ${c}
        </div>
      </div>
    </div>
  `}function U(t,e,i){let a=e.playcount>0?`<span class="track-playcount" title="${e.playcount} keer beluisterd">${y(e.playcount)} \xD7 \u266A</span>`:"",s=e.album?.cover_medium,l=s?`<img class="track-cover" src="${o(v(s,40)||s)}" alt="" loading="lazy" decoding="async">`:'<div class="track-cover-ph">\u266A</div>',n=`
    <button class="track-play-btn" data-artist="${o(t)}" data-track="${o(e.name)}" title="Speel voorbeeld af">
      \u25B6
    </button>
  `;return`
    <div class="track-row">
      <div class="track-rank">${i}</div>
      ${l}
      <div class="track-info">
        <div class="track-name">${o(e.name)}</div>
        ${a}
      </div>
      <div class="track-actions">
        ${n}
      </div>
    </div>
  `}export{M as loadArtistDetail};
