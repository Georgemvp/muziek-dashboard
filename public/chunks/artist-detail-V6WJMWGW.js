import"./chunk-N2OPSRFD.js";import{n as E}from"./chunk-C6ZPWJ3O.js";import{A as D,a as v,e as u,h as x,i,k as C,l as H,m as A,o as P,r as j,u as g,v as B}from"./chunk-GHKYA3ZE.js";var K=null,N=null;async function O(){B();let o=v.viewParams?.name;if(!o){g("Geen artiest geselecteerd");return}K=o;try{let t=await D(`/api/artist/${encodeURIComponent(o)}/full`);N=t,T(t)}catch(t){g(`Kan artiest niet laden: ${t.message}`)}}function T(o){let t=document.getElementById("content"),{name:s,info:a,wikipedia:n,similar:c,gaps:d}=o,p=u(a.image,600)||a.image,L=p?`background-image: url('${i(p)}'); background-size: cover; background-position: center;`:`background: ${C(s)};`,m=[];a.country&&m.push(`${H(a.country)} ${i(a.country)}`),a.startYear&&m.push(`Actief sinds ${a.startYear}`),v.plexOk&&a.inPlex&&m.push("\u25B6 In je Plex bibliotheek");let I=m.length>0?`<div class="detail-meta">${m.join(" \xB7 ")}</div>`:"",$="";a.tags&&a.tags.length>0&&($=`<div class="detail-tags">${A(a.tags,8)}</div>`);let z=`
    <div class="detail-hero" style="${L}">
      <div class="detail-hero-overlay"></div>
      <div class="detail-hero-content">
        <h1 class="detail-artist-name">${i(s)}</h1>
        ${I}
        ${$}
        <div class="detail-hero-actions">
          ${P("artist",s,"",a.image||"")}
        </div>
      </div>
    </div>
  `,h="";if(n&&n.extract){let e=n.extract.split(`
`).filter(r=>r.trim().length>0).slice(0,3).map(r=>`<p>${i(r)}</p>`).join("");h=`
      <section class="detail-section">
        <div class="section-header">
          <h2>Over deze artiest</h2>
          ${n.lang?`<span class="wiki-lang-badge">${n.lang.toUpperCase()}</span>`:""}
        </div>
        <div class="detail-bio">
          ${e}
        </div>
        ${n.url?`<a href="${i(n.url)}" target="_blank" rel="noopener" class="detail-link">Lees meer op Wikipedia \u2192</a>`:""}
      </section>
    `}let f="";if(a.albums&&a.albums.length>0){let e=a.albums.filter(l=>l.inPlex);e.length>0&&(f=`
        <section class="detail-section">
          <div class="section-header">
            <h2>Albums die je hebt</h2>
            <span class="section-count">${e.length}</span>
          </div>
          <div class="detail-grid">
            ${e.map(l=>S(s,l)).join("")}
          </div>
        </section>
      `)}let y="";if(d&&d.gaps&&d.gaps.length>0){let e=d.gaps.filter(l=>l.artistName&&l.artistName.toLowerCase()===s.toLowerCase());e.length>0&&(y=`
        <section class="detail-section">
          <div class="section-header">
            <h2>Ontbrekende albums</h2>
            <span class="section-count">${e.length}</span>
          </div>
          <div class="detail-grid">
            ${e.map(l=>F(s,l)).join("")}
          </div>
        </section>
      `)}let b="";c&&c.artists&&c.artists.length>0&&(b=`
      <section class="detail-section">
        <div class="section-header">
          <h2>Vergelijkbare artiesten</h2>
        </div>
        <div class="detail-similar-row">
          ${c.artists.map(e=>`
            <button class="detail-similar-chip" data-artist-detail="${i(e.name)}">
              ${i(e.name)}
            </button>
          `).join("")}
        </div>
      </section>
    `),t.innerHTML=`
    <article class="detail-page">
      ${z}
      <div class="detail-content">
        ${h}
        ${f}
        ${y}
        ${b}
      </div>
    </article>
  `,document.title=`Muziek \xB7 ${s}`,t.querySelectorAll(".detail-album-play-btn").forEach(e=>{e.addEventListener("click",async l=>{l.stopPropagation();let r=e.dataset.ratingKey;if(r){e.disabled=!0;let k=e.textContent;e.textContent="\u2026";let w=await E(r,"music");e.disabled=!1,e.textContent=w?"\u25B6 Speelt af":k,w&&setTimeout(()=>{e.textContent=k},3e3)}})}),t.querySelectorAll(".detail-similar-chip").forEach(e=>{e.addEventListener("click",async l=>{l.preventDefault();let r=e.dataset.artistDetail;r&&(v.viewParams={name:r},await O())})})}function S(o,t){let s=u(t.image,120)||t.image,a=s?`<img src="${i(s)}" alt="${i(t.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',n=v.plexOk&&t.inPlex&&t.ratingKey?`<button class="detail-album-play-btn" data-rating-key="${i(t.ratingKey)}" title="Speel af op Plex">\u25B6</button>`:"",c=t.playcount>0?`<div class="album-playcount" title="${t.playcount} keer beluisterd">${x(t.playcount)} \xD7 \u266A</div>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${a}
        ${n}
      </div>
      <div class="album-info">
        <div class="album-name">${i(t.name)}</div>
        ${c}
        ${j(o,t.name,t.inPlex)}
      </div>
    </div>
  `}function F(o,t){let s=u(t.image,120)||t.image,a=s?`<img src="${i(s)}" alt="${i(t.name)}" loading="lazy" decoding="async">`:'<div class="album-ph">\u266A</div>',n=t.albumType||"Album",c=t.releaseDate?`<div class="album-year">${t.releaseDate.slice(0,4)}</div>`:"",d=t.url?`<button class="tidal-dl-btn" data-dlurl="${i(t.url)}" title="Download via Tidarr">\u2B07</button>`:"";return`
    <div class="album-card">
      <div class="album-cover">
        ${a}
        ${d}
      </div>
      <div class="album-info">
        <div class="album-name">${i(t.name)}</div>
        <div class="album-meta">${n} ${c.trim()}</div>
      </div>
    </div>
  `}export{O as loadArtistDetail};
