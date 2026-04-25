import{n as E}from"./chunk-VSDYBKX3.js";import{a as H}from"./chunk-6N34G4LY.js";import{A as d,a as o,e as u,h as g,i as l,k as y,l as f,m as b,o as k,r as w,u as $}from"./chunk-LCSFBDUL.js";var m=null;async function L(){let t=o.viewParams?.name;if(!t){$("Geen artiest geselecteerd");return}m=t;try{let e=await d(`/api/artist/${encodeURIComponent(t)}/info`);I(t,e),x(t,e)}catch(e){$(`Kan artiest niet laden: ${e.message}`)}}function I(t,e){let i=document.getElementById("content"),s=u(e.imageXl||e.image,600)||e.imageXl||e.image,a=s?`background-image: url('${l(s)}'); background-size: cover; background-position: center;`:`background: ${y(t)};`,c=[];e.country&&c.push(`${f(e.country)} ${l(e.country)}`),e.startYear&&c.push(`Actief sinds ${e.startYear}`),o.plexOk&&e.inPlex&&c.push("\u25B6 In je Plex bibliotheek");let n=c.length>0?`<div class="detail-meta">${c.join(" \xB7 ")}</div>`:"",r="";e.tags&&e.tags.length>0&&(r=`<div class="detail-tags">${b(e.tags,8)}</div>`);let B=o.previousView?`
    <button class="detail-back-btn" data-previous-view="${l(o.previousView)}" title="Terug">
      \u2190 Terug
    </button>
  `:"",T=`
    <div class="detail-hero" style="${a}">
      <div class="detail-hero-overlay"></div>
      ${B}
      <div class="detail-hero-content">
        <h1 class="detail-artist-name">${l(t)}</h1>
        ${n}
        ${r}
        <div class="detail-hero-actions">
          ${k("artist",t,"",e.image||"")}
        </div>
      </div>
    </div>
  `,h="";if(e.albums&&e.albums.length>0){let v=e.albums.filter(p=>p.inPlex);v.length>0&&(h=`
        <section class="detail-section" id="section-albums">
          <div class="section-header">
            <h2>Albums die je hebt</h2>
            <span class="section-count">${v.length}</span>
          </div>
          <div class="detail-grid">
            ${v.map(p=>P(t,p)).join("")}
          </div>
        </section>
      `)}i.innerHTML=`
    <article class="detail-page">
      ${T}
      <div class="detail-content">
        ${h}

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
  `,document.title=`Muziek \xB7 ${t}`,V()}async function x(t,e){let[i,s,a,c]=await Promise.allSettled([d(`/api/artist/${encodeURIComponent(t)}/wikipedia`).catch(()=>null),d(`/api/artist/${encodeURIComponent(t)}/similar`).catch(()=>null),d(`/api/gaps/${encodeURIComponent(t)}`).catch(()=>null),d(`/api/artist/${encodeURIComponent(t)}/tracks`).catch(()=>null)]);if(o.activeView==="artist-detail"&&m===t){let n=i.status==="fulfilled"?i.value:null;n?M(n):document.getElementById("section-wikipedia").innerHTML=""}if(o.activeView==="artist-detail"&&m===t){let n=c.status==="fulfilled"?c.value:null;n&&Array.isArray(n)&&n.length>0?A(t,n):document.getElementById("section-tracks").innerHTML=""}if(o.activeView==="artist-detail"&&m===t){let n=a.status==="fulfilled"?a.value:null;n&&n.missing&&n.missing.length>0?C(t,n):document.getElementById("section-gaps").innerHTML=""}if(o.activeView==="artist-detail"&&m===t){let n=s.status==="fulfilled"?s.value:null;if(n&&(n.similar||n.artists)){let r=n.similar||n.artists||[];r.length>0?S(r):document.getElementById("section-similar").innerHTML=""}else document.getElementById("section-similar").innerHTML=""}}function M(t){let e=document.getElementById("section-wikipedia");if(!t||!t.extract){e.innerHTML="";return}let i=t.extract.split(`
`).filter(a=>a.trim().length>0).slice(0,3).map(a=>`<p>${l(a)}</p>`).join(""),s=t.lang?`<span class="wiki-lang-badge">${t.lang.toUpperCase()}</span>`:"";e.innerHTML=`
    <div class="section-header">
      <h2>Over deze artiest</h2>
      ${s}
    </div>
    <div class="detail-bio">
      ${i}
    </div>
    ${t.url?`<a href="${l(t.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia \u2192</a>`:""}
  `}function A(t,e){let i=document.getElementById("section-tracks");if(!e||e.length===0){i.innerHTML="";return}i.innerHTML=`
    <div class="section-header">
      <h2>Populairste nummers</h2>
      <span class="section-count">${e.length}</span>
    </div>
    <div class="detail-tracks-list">
      ${e.map((s,a)=>D(t,s,a+1)).join("")}
    </div>
  `}function C(t,e){let i=document.getElementById("section-gaps");if(!e||!e.missing||e.missing.length===0){i.innerHTML="";return}let a=`<span class="section-badge" title="Discografie compleet">${e.completeness||0}%</span>`;i.innerHTML=`
    <div class="section-header">
      <h2>Ontbrekende albums</h2>
      <span class="section-count">${e.missing.length}</span>
      ${a}
    </div>
    <div class="detail-grid">
      ${e.missing.map(c=>j(t,c)).join("")}
    </div>
  `}function S(t){let e=document.getElementById("section-similar");if(!t||t.length===0){e.innerHTML="";return}e.innerHTML=`
    <div class="section-header">
      <h2>Vergelijkbare artiesten</h2>
    </div>
    <div class="detail-similar-row">
      ${t.map(i=>`
        <button class="detail-similar-chip" data-artist-detail="${l(i.name)}">
          ${l(i.name)}
        </button>
      `).join("")}
    </div>
  `,document.querySelectorAll(".detail-similar-chip").forEach(i=>{i.addEventListener("click",async s=>{s.preventDefault();let a=i.dataset.artistDetail;a&&(o.previousView=o.activeView,o.viewParams={name:a},await L())})})}function V(){let t=document.getElementById("content"),e=t.querySelector(".detail-back-btn");e&&e.addEventListener("click",async i=>{i.preventDefault();let s=o.previousView||"home";await H(s)}),t.querySelectorAll(".detail-album-play-btn").forEach(i=>{i.addEventListener("click",async s=>{s.stopPropagation();let a=i.dataset.ratingKey;if(a){i.disabled=!0;let c=i.textContent;i.textContent="\u2026";let n=await E(a,"music");i.disabled=!1,i.textContent=n?"\u25B6 Speelt af":c,n&&setTimeout(()=>{i.textContent=c},3e3)}})})}function P(t,e){let i=u(e.image,120)||e.image,s=i?`<img src="${l(i)}" alt="${l(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',a=o.plexOk&&e.inPlex&&e.ratingKey?`<button class="detail-album-play-btn" data-rating-key="${l(e.ratingKey)}" title="Speel af op Plex">\u25B6</button>`:"",c=e.playcount>0?`<div class="album-playcount" title="${e.playcount} keer beluisterd">${g(e.playcount)} \xD7 \u266A</div>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${s}
        ${a}
      </div>
      <div class="album-info">
        <div class="album-name">${l(e.name)}</div>
        ${c}
        ${w(t,e.name,e.inPlex)}
      </div>
    </div>
  `}function j(t,e){let i=u(e.image,120)||e.image,s=i?`<img src="${l(i)}" alt="${l(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',a=e.albumType||"Album",c=e.releaseDate?`<div class="album-year">${e.releaseDate.slice(0,4)}</div>`:"",n=e.url?`<button class="tidal-dl-btn" data-dlurl="${l(e.url)}" title="Download via Tidarr">\u2B07</button>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${s}
        ${n}
      </div>
      <div class="album-info">
        <div class="album-name">${l(e.name)}</div>
        <div class="album-meta">${a} ${c.trim()}</div>
      </div>
    </div>
  `}function D(t,e,i){let s=e.playcount>0?`<span class="track-playcount" title="${e.playcount} keer beluisterd">${g(e.playcount)} \xD7 \u266A</span>`:"",a=`
    <button class="track-play-btn" data-artist="${l(t)}" data-track="${l(e.name)}" title="Speel voorbeeld af">
      \u25B6
    </button>
  `;return`
    <div class="track-row">
      <div class="track-rank">${i}</div>
      <div class="track-info">
        <div class="track-name">${l(e.name)}</div>
        ${s}
      </div>
      <div class="track-actions">
        ${a}
      </div>
    </div>
  `}export{L as loadArtistDetail};
