import{b as L,n as B}from"./chunk-ODXHRBJF.js";import{a as C}from"./chunk-XRQN57E4.js";import{E as H,F as T,d as p,g as y,h as o,j as k,k as w,l as E,n as x,p as f,r as b,x as u}from"./chunk-OJFTIB2W.js";import{a as r}from"./chunk-2BMKGNH5.js";var v=null;async function A(){let t=r.viewParams?.name;if(!t){b("Geen artiest geselecteerd");return}v=t;try{let e=await u(`/api/core/artist/${encodeURIComponent(t)}/info`);S(t,e),M(t,e)}catch(e){b(`Kan artiest niet laden: ${e.message}`)}}function S(t,e){let i=document.getElementById("content"),s=p(e.imageXl||e.image,600)||e.imageXl||e.image,a=s?`background-image: url('${o(s)}'); background-size: cover; background-position: center;`:`background: ${k(t)};`,l=[];e.country&&l.push(`${w(e.country)} ${o(e.country)}`),e.startYear&&l.push(`Actief sinds ${e.startYear}`),r.plexOk&&e.inPlex&&l.push("\u25B6 In je Plex bibliotheek");let n=l.length>0?`<div class="detail-meta">${l.join(" \xB7 ")}</div>`:"",c="";e.tags&&e.tags.length>0&&(c=`<div class="detail-tags">${E(e.tags,8)}</div>`);let d=r.previousView?`
    <button class="detail-back-btn" data-previous-view="${o(r.previousView)}" title="Terug">
      \u2190 Terug
    </button>
  `:"",g=`
    <div class="detail-hero" style="${a}">
      <div class="detail-hero-overlay"></div>
      ${d}
      <div class="detail-hero-content">
        <h1 class="detail-artist-name">${o(t)}</h1>
        ${n}
        ${c}
        <div class="detail-hero-actions">
          ${x("artist",t,"",e.image||"")}
        </div>
      </div>
    </div>
  `,m="";if(e.albums&&e.albums.length>0){let h=e.albums.filter($=>$.inPlex);h.length>0&&(m+=`
        <section class="detail-section" id="section-albums">
          <div class="section-header">
            <h2>Albums die je hebt</h2>
            <span class="section-count">${h.length}</span>
          </div>
          <div class="detail-grid">
            ${h.map($=>R(t,$)).join("")}
          </div>
        </section>
      `)}i.innerHTML=`
    <article class="detail-page">
      ${g}
      <div class="detail-content">
        ${m}

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
  `,document.title=`Muziek \xB7 ${t}`,O()}async function M(t,e){let[i,s,a,l]=await Promise.allSettled([u(`/api/artist/${encodeURIComponent(t)}/wikipedia`).catch(()=>null),u(`/api/core/artist/${encodeURIComponent(t)}/similar`).catch(()=>null),u(`/api/gaps/${encodeURIComponent(t)}`).catch(()=>null),u(`/api/artist/${encodeURIComponent(t)}/tracks`).catch(()=>null)]);if(r.activeView==="artist-detail"&&v===t){let n=i.status==="fulfilled"?i.value:null;n?P(n):document.getElementById("section-wikipedia").innerHTML=""}if(r.activeView==="artist-detail"&&v===t){let n=l.status==="fulfilled"?l.value:null;n&&Array.isArray(n)&&n.length>0?V(t,n):document.getElementById("section-tracks").innerHTML=""}if(r.activeView==="artist-detail"&&v===t){let n=a.status==="fulfilled"?a.value:null;n&&n.missing&&n.missing.length>0?j(t,n):document.getElementById("section-gaps").innerHTML=""}if(r.activeView==="artist-detail"&&v===t){let n=s.status==="fulfilled"?s.value:null;if(n&&(n.similar||n.artists)){let c=n.similar||n.artists||[];c.length>0?D(c):document.getElementById("section-similar").innerHTML=""}else document.getElementById("section-similar").innerHTML=""}}function P(t){let e=document.getElementById("section-wikipedia");if(!t||!t.extract){e.innerHTML="";return}let i=t.extract.split(`
`).filter(a=>a.trim().length>0).slice(0,3).map(a=>`<p>${o(a)}</p>`).join(""),s=t.lang?`<span class="wiki-lang-badge">${t.lang.toUpperCase()}</span>`:"";e.innerHTML=`
    <div class="section-header">
      <h2>Over deze artiest</h2>
      ${s}
    </div>
    <div class="detail-bio">
      ${i}
    </div>
    ${t.url?`<a href="${o(t.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia \u2192</a>`:""}
  `}function V(t,e){let i=document.getElementById("section-tracks");if(!e||e.length===0){i.innerHTML="";return}i.innerHTML=`
    <div class="section-header">
      <h2>Populairste nummers</h2>
      <span class="section-count">${e.length}</span>
    </div>
    <div class="detail-tracks-list">
      ${e.map((s,a)=>q(t,s,a+1)).join("")}
    </div>
  `,i.querySelectorAll(".track-play-btn").forEach(s=>{s.addEventListener("click",a=>{a.stopPropagation(),L(s,s.dataset.artist,s.dataset.track)})}),I(i)}function j(t,e){let i=document.getElementById("section-gaps");if(!e||!e.missing||e.missing.length===0){i.innerHTML="";return}let a=`<span class="section-badge" title="Discografie compleet">${e.completeness||0}%</span>`;i.innerHTML=`
    <div class="section-header">
      <h2>Ontbrekende albums</h2>
      <span class="section-count">${e.missing.length}</span>
      ${a}
    </div>
    <div class="detail-grid">
      ${e.missing.map(l=>z(t,l)).join("")}
    </div>
  `,I(i)}function I(t){t.querySelectorAll(".panel-orpheus-btn").forEach(e=>{e.addEventListener("click",async i=>{i.stopPropagation();let s=e.dataset.ophArtist,a=e.dataset.ophAlbum,l=e.textContent;e.disabled=!0,e.textContent="\u2026";try{let c=(await H(`${s} ${a}`,"all"))?.results||[];if(!c.length||!c[0]?.url)throw new Error("Geen resultaten gevonden in OrpheusDL");let d=c[0],g=localStorage.getItem("orpheusQuality")||"hifi",m=await T(d.url,g,d.title||a,d.artist||s);if(!m?.ok)throw new Error(m?.error||"Download mislukt");e.textContent="\u2713 Gestart",setTimeout(()=>{e.disabled=!1,e.textContent=l},3e3)}catch(n){e.disabled=!1,e.textContent=l;let c=document.createElement("div");c.style.cssText="color:var(--color-error,#e05a2b);font-size:10px;margin-top:2px",c.textContent="\u26A0 "+n.message,e.parentNode.appendChild(c),setTimeout(()=>c.remove(),4e3)}})})}function D(t){let e=document.getElementById("section-similar");if(!t||t.length===0){e.innerHTML="";return}e.innerHTML=`
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
  `,document.querySelectorAll(".detail-similar-chip").forEach(i=>{i.addEventListener("click",async s=>{s.preventDefault();let a=i.dataset.artistDetail;a&&(r.previousView=r.activeView,r.viewParams={name:a},await A())})})}function O(){let t=document.getElementById("content"),e=t.querySelector(".detail-back-btn");e&&e.addEventListener("click",async i=>{i.preventDefault();let s=r.previousView||"home";await C(s)}),t.querySelectorAll(".detail-album-play-btn").forEach(i=>{i.addEventListener("click",async s=>{s.stopPropagation();let a=i.dataset.ratingKey;if(a){i.disabled=!0;let l=i.textContent;i.textContent="\u2026";let n=await B(a,"music");i.disabled=!1,i.textContent=n?"\u25B6 Speelt af":l,n&&setTimeout(()=>{i.textContent=l},3e3)}})})}function R(t,e){let i=p(e.image,120)||e.image,s=i?`<img src="${o(i)}" alt="${o(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',a=r.plexOk&&e.inPlex&&e.ratingKey?`<button class="detail-album-play-btn" data-rating-key="${o(e.ratingKey)}" title="Speel af op Plex">\u25B6</button>`:"",l=e.playcount>0?`<div class="album-playcount" title="${e.playcount} keer beluisterd">${y(e.playcount)} \xD7 \u266A</div>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${s}
        ${a}
      </div>
      <div class="album-info">
        <div class="album-name">${o(e.name)}</div>
        ${l}
        ${f(t,e.name,e.inPlex)}
      </div>
    </div>
  `}function z(t,e){let i=p(e.image,120)||e.image,s=i?`<img src="${o(i)}" alt="${o(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',a=e.albumType||"Album",l=e.releaseDate?`<div class="album-year">${e.releaseDate.slice(0,4)}</div>`:"",n=f(t,e.name,!1);return`
    <div class="album-card">
      <div class="album-cover">
        ${s}
      </div>
      <div class="album-info">
        <div class="album-name">${o(e.name)}</div>
        <div class="album-meta">${a} ${l.trim()}</div>
        <div class="album-dl-actions">
          ${n}
        </div>
      </div>
    </div>
  `}function q(t,e,i){let s=e.playcount>0?`<span class="track-playcount" title="${e.playcount} keer beluisterd">${y(e.playcount)} \xD7 \u266A</span>`:"",a=e.album?.cover_medium,l=a?`<img class="track-cover" src="${o(p(a,40)||a)}" alt="" loading="lazy" decoding="async">`:'<div class="track-cover-ph">\u266A</div>',n=`
    <button class="track-play-btn" data-artist="${o(t)}" data-track="${o(e.name)}" title="Speel voorbeeld af">
      \u25B6
    </button>
  `,c=e.album?.title||e.name,d=`<button class="panel-orpheus-btn track-dl-btn"
    data-oph-artist="${o(t)}"
    data-oph-album="${o(c)}"
    title="Download via OrpheusDL">\u2B07</button>`;return`
    <div class="track-row">
      <div class="track-rank">${i}</div>
      ${l}
      <div class="track-info">
        <div class="track-name">${o(e.name)}</div>
        ${s}
      </div>
      <div class="track-actions">
        ${n}
        ${d}
      </div>
    </div>
  `}export{A as loadArtistDetail};
