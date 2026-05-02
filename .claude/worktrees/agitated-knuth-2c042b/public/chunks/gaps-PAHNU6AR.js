import{t as T}from"./chunk-DQFF3B3K.js";import"./chunk-2UCV5F4T.js";import{d as w,f as $,h as l,j as f,k as L,l as P,n as S,o as q,t as y,u as C,v as B,w as I,x,z as k}from"./chunk-HCN2ZK5I.js";import{a as u}from"./chunk-2BMKGNH5.js";var p=null,m="missing",h="",b=new Set;function O(t){let e=0,s=0,a=-1,n=-1,i=null,r=null;for(let d of t){let c=d.missing?.length||0,v=d.ownedCount||0,g=c+v;e+=c,s+=v,c>a&&(a=c,i=d.title);let E=g?v/g:0;E>n&&(n=E,r=d.title)}let o=e+s;return{totalMissing:e,completePct:o?Math.round(s/o*100):100,mostMissing:i,mostComplete:r}}function F(t){let{totalMissing:e,completePct:s,mostMissing:a,mostComplete:n}=O(t);return`
    <div class="gaps-hero">
      <div class="gaps-hero-stats">
        <div class="gaps-hero-stat">
          <span class="gaps-hero-num">${e}</span>
          <span class="gaps-hero-label">ontbrekende albums</span>
        </div>
        <div class="gaps-hero-stat">
          <span class="gaps-hero-num">${t.length}</span>
          <span class="gaps-hero-label">artiesten</span>
        </div>
      </div>
      <div class="gaps-hero-progress">
        <div class="gaps-hero-bar">
          <div class="gaps-hero-bar-fill" style="width:${s}%"></div>
        </div>
        <span class="gaps-hero-pct">${s}% van je collectie compleet</span>
      </div>
      <div class="gaps-hero-qs">
        ${a?`<span class="gaps-hero-qs-item">Meeste gaps: <strong>${l(a)}</strong></span>`:""}
        ${n?`<span class="gaps-hero-qs-item">Meest compleet: <strong>${l(n)}</strong></span>`:""}
      </div>
    </div>`}function A(t,e){let s=f(t.title||""),a=t.releaseDate?t.releaseDate.slice(0,4):"\u2014",n=t.albumType||"Album",i=e?q(e,t.title||""):!1,r=(u.tidarrOk||u.orpheusConnected)&&!t.inPlex,o=t.image?w(t.image,160):null,d=t.inPlex?'<span class="gaps-album-badge own">\u2713 In Plex</span>':'<span class="gaps-album-badge miss">\u2726 Ontbreekt</span>',c=r&&e?i?`<button class="gaps-album-dl dl-done" data-dlartist="${l(e)}" data-dlalbum="${l(t.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="gaps-album-dl download-btn" data-dlartist="${l(e)}" data-dlalbum="${l(t.title||"")}" title="Download">\u2B07</button>`:"";return`
    <div class="gaps-album-card${t.inPlex?" is-owned":""}">
      <div class="gaps-album-cover" style="background:${s}">
        <div class="gaps-album-ph">${$(t.title||"?")}</div>
        ${o?`<img src="${l(o)}" alt="" loading="lazy" decoding="async" onload="this.style.opacity='1'" onerror="this.remove()" style="opacity:0;transition:opacity 0.3s">`:""}
        ${c}
      </div>
      <div class="gaps-album-info">
        <div class="gaps-album-title" title="${l(t.title)}">${l(t.title)}</div>
        <div class="gaps-album-year">${a} \xB7 <span class="gaps-type-badge">${l(n)}</span></div>
        ${d}
      </div>
    </div>`}function H(t){let e=t.missing||[],s=t.owned||[],a=e.length,n=t.totalCount||a+(t.ownedCount||0),i=t.ownedCount||0,r=n?Math.round(i/n*100):100,o=b.has(t.artistId),d=(u.tidarrOk||u.orpheusConnected)&&a>0,c=t.thumb?`<img src="${l(w(t.thumb,80))}" class="gaps-row-photo" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",v=`<div class="gaps-row-photo-ph" style="background:${f(t.title)};${t.thumb?"display:none":""}">${$(t.title)}</div>`;return`
    <div class="gaps-row${o?" expanded":""}" data-id="${l(t.artistId)}">
      <div class="gaps-row-header">
        <div class="gaps-row-left">
          ${c}${v}
          <div class="gaps-row-meta">
            <div class="gaps-row-name">
              <a href="#" class="artist-link" data-artist-detail="${l(t.title)}">${l(t.title)}</a>
              ${L(t.country)}
            </div>
            <div class="gaps-row-tags">${P(t.genres?.slice(0,3)||[])}</div>
          </div>
        </div>
        <div class="gaps-row-center">
          <div class="gaps-row-bar"><div class="gaps-row-bar-fill" style="width:${r}%"></div></div>
          <span class="gaps-row-pct">${i}/${n}</span>
        </div>
        <div class="gaps-row-right">
          ${S("artist",t.title,t.title,t.thumb||"")}
          ${d?`<button class="gaps-dl-all download-btn" data-dlartist="${l(t.title)}" data-dl-all-gaps="true" title="Download alle ${a} ontbrekende albums">\u2B07 ${a}</button>`:""}
          <button class="gaps-row-toggle" data-id="${l(t.artistId)}">${o?"\u25BC":"\u25B6"} <span>${a} ontbreken</span></button>
        </div>
      </div>
      <div class="gaps-row-body">
        <div class="gaps-row-body-inner">
          ${a>0?`
            <div class="gaps-section-label">Ontbrekende albums</div>
            <div class="gaps-album-grid">
              ${e.map(g=>A(g,t.title)).join("")}
            </div>`:""}
          ${s.length>0?`
            <details class="gaps-owned-details">
              <summary>Al in collectie (${s.length})</summary>
              <div class="gaps-album-grid gaps-album-grid--owned">
                ${s.map(g=>A(g,t.title)).join("")}
              </div>
            </details>`:""}
        </div>
      </div>
    </div>`}function j(){let t=p?.gaps||[];if(h){let e=h.toLowerCase();t=t.filter(s=>s.title.toLowerCase().includes(e))}return m==="missing"?t=[...t].sort((e,s)=>(s.missing?.length||0)-(e.missing?.length||0)):m==="name"?t=[...t].sort((e,s)=>e.title.localeCompare(s.title)):m==="complete"?t=[...t].sort((e,s)=>{let a=e.totalCount?e.ownedCount/e.totalCount:0;return(s.totalCount?s.ownedCount/s.totalCount:0)-a}):m==="least"&&(t=[...t].sort((e,s)=>{let a=e.totalCount?e.ownedCount/e.totalCount:0,n=s.totalCount?s.ownedCount/s.totalCount:0;return a-n})),t}function M(){let t=document.getElementById("content"),e=j(),s=document.getElementById("gaps-badge");if(s){let a=e.reduce((n,i)=>n+(i.missing?.length||0),0);s.textContent=`${a} gaps \xB7 ${e.length} artiesten`}t.innerHTML=F(e)+`<div class="gaps-list">${e.map(H).join("")}</div>`,G(t.querySelector(".gaps-list"))}function z(){let t=document.getElementById("view-toolbar");t&&(t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten\u2026" class="toolbar-input" value="${l(h)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing">Meeste ontbrekend</option>
        <option value="least">Minst compleet</option>
        <option value="name">Naam A-Z</option>
        <option value="complete">Meest compleet</option>
      </select>
      <button id="gaps-refresh" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
    <span class="toolbar-badge" id="gaps-badge"></span>`,t.querySelector("#gaps-sort").value=m,t.querySelector("#gaps-search").addEventListener("input",e=>{h=e.target.value,M()}),t.querySelector("#gaps-sort").addEventListener("change",e=>{m=e.target.value,M()}),t.querySelector("#gaps-refresh").addEventListener("click",async()=>{C();try{await k("/api/gaps/refresh",{method:"POST"}),x("gaps"),p=null,b.clear(),await D()}catch(e){y("Kan gaps niet verversen: "+e.message)}}))}function G(t){t&&t.addEventListener("click",async e=>{let s=e.target.closest(".gaps-row-toggle");if(s){e.preventDefault();let n=s.dataset.id,i=t.querySelector(`.gaps-row[data-id="${n}"]`);if(!i)return;let r=i.classList.toggle("expanded"),o=s.querySelector("span");s.firstChild.textContent=r?"\u25BC ":"\u25B6 ",r?b.add(n):b.delete(n);return}let a=e.target.closest("[data-dl-all-gaps]");if(a){e.stopPropagation();let n=a.dataset.dlartist,i=p.gaps.find(o=>o.title===n);if(!i?.missing?.length)return;let r=i.missing.filter(o=>!o.inPlex);if(!r.length||!confirm(`Download ${r.length} ontbrekende album${r.length!==1?"s":""} van ${n}?`))return;a.disabled=!0,a.textContent="Bezig\u2026";try{let o=await import("./downloads-4PGNC24K.js");for(let d of r)u.downloadEngine==="orpheus"?await o.triggerOrpheusDownload(n,d.title,null):await o.triggerTidarrDownload(n,d.title,null);a.textContent="\u2713 Klaar"}catch(o){a.textContent="\u26A0 Fout",a.disabled=!1,console.error("Bulk download mislukt:",o)}}})}async function D(){let t=document.getElementById("content");try{if(!p){C();let e=B("gaps",300*1e3);if(e?.gaps?.length>0&&!("artistId"in e.gaps[0])&&(x("gaps"),e=null),e||(e=await k("/api/gaps"),I("gaps",e)),p=e,p.status==="building"){t.innerHTML='<div class="loading-state"><p>Gaps-scanning lopend\u2026</p></div>',setTimeout(()=>{p=null,D()},15e3);return}}z(),M()}catch(e){y("Kan gaps niet laden: "+e.message)}}async function J(){T(),await D()}export{J as loadGaps};
