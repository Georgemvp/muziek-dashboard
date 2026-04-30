import{n as L}from"./chunk-L7FPKZB5.js";import{a as B}from"./chunk-7IFMWBGT.js";import{G as H,H as T,d as v,g as f,h as l,j as k,k as w,l as E,n as x,q as y,t as b,z as d}from"./chunk-HCN2ZK5I.js";import{a as r}from"./chunk-2BMKGNH5.js";var p=null;async function I(){let t=r.viewParams?.name;if(!t){b("Geen artiest geselecteerd");return}p=t;try{let e=await d(`/api/artist/${encodeURIComponent(t)}/info`);C(t,e),A(t,e)}catch(e){b(`Kan artiest niet laden: ${e.message}`)}}function C(t,e){let i=document.getElementById("content"),a=v(e.imageXl||e.image,600)||e.imageXl||e.image,s=a?`background-image: url('${l(a)}'); background-size: cover; background-position: center;`:`background: ${k(t)};`,o=[];e.country&&o.push(`${w(e.country)} ${l(e.country)}`),e.startYear&&o.push(`Actief sinds ${e.startYear}`),r.plexOk&&e.inPlex&&o.push("\u25B6 In je Plex bibliotheek");let n=o.length>0?`<div class="detail-meta">${o.join(" \xB7 ")}</div>`:"",c="";e.tags&&e.tags.length>0&&(c=`<div class="detail-tags">${E(e.tags,8)}</div>`);let u=r.previousView?`
    <button class="detail-back-btn" data-previous-view="${l(r.previousView)}" title="Terug">
      \u2190 Terug
    </button>
  `:"",g=`
    <div class="detail-hero" style="${s}">
      <div class="detail-hero-overlay"></div>
      ${u}
      <div class="detail-hero-content">
        <h1 class="detail-artist-name">${l(t)}</h1>
        ${n}
        ${c}
        <div class="detail-hero-actions">
          ${x("artist",t,"",e.image||"")}
        </div>
      </div>
    </div>
  `,m="";if(e.albums&&e.albums.length>0){let h=e.albums.filter($=>$.inPlex);h.length>0&&(m=`
        <section class="detail-section" id="section-albums">
          <div class="section-header">
            <h2>Albums die je hebt</h2>
            <span class="section-count">${h.length}</span>
          </div>
          <div class="detail-grid">
            ${h.map($=>D(t,$)).join("")}
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
  `,document.title=`Muziek \xB7 ${t}`,O()}async function A(t,e){let[i,a,s,o]=await Promise.allSettled([d(`/api/artist/${encodeURIComponent(t)}/wikipedia`).catch(()=>null),d(`/api/artist/${encodeURIComponent(t)}/similar`).catch(()=>null),d(`/api/gaps/${encodeURIComponent(t)}`).catch(()=>null),d(`/api/artist/${encodeURIComponent(t)}/tracks`).catch(()=>null)]);if(r.activeView==="artist-detail"&&p===t){let n=i.status==="fulfilled"?i.value:null;n?S(n):document.getElementById("section-wikipedia").innerHTML=""}if(r.activeView==="artist-detail"&&p===t){let n=o.status==="fulfilled"?o.value:null;n&&Array.isArray(n)&&n.length>0?M(t,n):document.getElementById("section-tracks").innerHTML=""}if(r.activeView==="artist-detail"&&p===t){let n=s.status==="fulfilled"?s.value:null;n&&n.missing&&n.missing.length>0?P(t,n):document.getElementById("section-gaps").innerHTML=""}if(r.activeView==="artist-detail"&&p===t){let n=a.status==="fulfilled"?a.value:null;if(n&&(n.similar||n.artists)){let c=n.similar||n.artists||[];c.length>0?j(c):document.getElementById("section-similar").innerHTML=""}else document.getElementById("section-similar").innerHTML=""}}function S(t){let e=document.getElementById("section-wikipedia");if(!t||!t.extract){e.innerHTML="";return}let i=t.extract.split(`
`).filter(s=>s.trim().length>0).slice(0,3).map(s=>`<p>${l(s)}</p>`).join(""),a=t.lang?`<span class="wiki-lang-badge">${t.lang.toUpperCase()}</span>`:"";e.innerHTML=`
    <div class="section-header">
      <h2>Over deze artiest</h2>
      ${a}
    </div>
    <div class="detail-bio">
      ${i}
    </div>
    ${t.url?`<a href="${l(t.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia \u2192</a>`:""}
  `}function M(t,e){let i=document.getElementById("section-tracks");if(!e||e.length===0){i.innerHTML="";return}i.innerHTML=`
    <div class="section-header">
      <h2>Populairste nummers</h2>
      <span class="section-count">${e.length}</span>
    </div>
    <div class="detail-tracks-list">
      ${e.map((a,s)=>z(t,a,s+1)).join("")}
    </div>
  `}function P(t,e){let i=document.getElementById("section-gaps");if(!e||!e.missing||e.missing.length===0){i.innerHTML="";return}let s=`<span class="section-badge" title="Discografie compleet">${e.completeness||0}%</span>`;i.innerHTML=`
    <div class="section-header">
      <h2>Ontbrekende albums</h2>
      <span class="section-count">${e.missing.length}</span>
      ${s}
    </div>
    <div class="detail-grid">
      ${e.missing.map(o=>R(t,o)).join("")}
    </div>
  `,V(i)}function V(t){t.querySelectorAll(".panel-orpheus-btn").forEach(e=>{e.addEventListener("click",async i=>{i.stopPropagation();let a=e.dataset.ophArtist,s=e.dataset.ophAlbum,o=e.textContent;e.disabled=!0,e.textContent="\u2026";try{let c=(await H(`${a} ${s}`,"all","album"))?.results||[];if(!c.length||!c[0]?.url)throw new Error("Geen resultaten gevonden in OrpheusDL");let u=c[0],g=localStorage.getItem("orpheusQuality")||"hifi",m=await T(u.url,g,u.title||s,u.artist||a);if(!m?.ok)throw new Error(m?.error||"Download mislukt");e.textContent="\u2713 Gestart",setTimeout(()=>{e.disabled=!1,e.textContent=o},3e3)}catch(n){e.disabled=!1,e.textContent=o;let c=document.createElement("div");c.style.cssText="color:var(--color-error,#e05a2b);font-size:10px;margin-top:2px",c.textContent="\u26A0 "+n.message,e.parentNode.appendChild(c),setTimeout(()=>c.remove(),4e3)}})})}function j(t){let e=document.getElementById("section-similar");if(!t||t.length===0){e.innerHTML="";return}e.innerHTML=`
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
  `,document.querySelectorAll(".detail-similar-chip").forEach(i=>{i.addEventListener("click",async a=>{a.preventDefault();let s=i.dataset.artistDetail;s&&(r.previousView=r.activeView,r.viewParams={name:s},await I())})})}function O(){let t=document.getElementById("content"),e=t.querySelector(".detail-back-btn");e&&e.addEventListener("click",async i=>{i.preventDefault();let a=r.previousView||"home";await B(a)}),t.querySelectorAll(".detail-album-play-btn").forEach(i=>{i.addEventListener("click",async a=>{a.stopPropagation();let s=i.dataset.ratingKey;if(s){i.disabled=!0;let o=i.textContent;i.textContent="\u2026";let n=await L(s,"music");i.disabled=!1,i.textContent=n?"\u25B6 Speelt af":o,n&&setTimeout(()=>{i.textContent=o},3e3)}})})}function D(t,e){let i=v(e.image,120)||e.image,a=i?`<img src="${l(i)}" alt="${l(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',s=r.plexOk&&e.inPlex&&e.ratingKey?`<button class="detail-album-play-btn" data-rating-key="${l(e.ratingKey)}" title="Speel af op Plex">\u25B6</button>`:"",o=e.playcount>0?`<div class="album-playcount" title="${e.playcount} keer beluisterd">${f(e.playcount)} \xD7 \u266A</div>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${a}
        ${s}
      </div>
      <div class="album-info">
        <div class="album-name">${l(e.name)}</div>
        ${o}
        ${y(t,e.name,e.inPlex)}
      </div>
    </div>
  `}function R(t,e){let i=v(e.image,120)||e.image,a=i?`<img src="${l(i)}" alt="${l(e.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',s=e.albumType||"Album",o=e.releaseDate?`<div class="album-year">${e.releaseDate.slice(0,4)}</div>`:"",n=y(t,e.name,!1),c=`<button class="panel-orpheus-btn"
    data-oph-artist="${l(t)}"
    data-oph-album="${l(e.name)}"
    title="Zoeken en downloaden via OrpheusDL">\u2B07 Orpheus</button>`;return`
    <div class="album-card">
      <div class="album-cover">
        ${a}
      </div>
      <div class="album-info">
        <div class="album-name">${l(e.name)}</div>
        <div class="album-meta">${s} ${o.trim()}</div>
        <div class="album-dl-actions">
          ${n}
          ${c}
        </div>
      </div>
    </div>
  `}function z(t,e,i){let a=e.playcount>0?`<span class="track-playcount" title="${e.playcount} keer beluisterd">${f(e.playcount)} \xD7 \u266A</span>`:"",s=`
    <button class="track-play-btn" data-artist="${l(t)}" data-track="${l(e.name)}" title="Speel voorbeeld af">
      \u25B6
    </button>
  `;return`
    <div class="track-row">
      <div class="track-rank">${i}</div>
      <div class="track-info">
        <div class="track-name">${l(e.name)}</div>
        ${a}
      </div>
      <div class="track-actions">
        ${s}
      </div>
    </div>
  `}export{I as loadArtistDetail};
