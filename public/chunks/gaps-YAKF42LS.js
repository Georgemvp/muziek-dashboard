import{p as T}from"./chunk-DZQFIMVI.js";import{A as h,a as f,e as m,g as y,i as n,k as u,l as w,m as k,o as C,p as I,u as v,v as c,w as L,x as E,y as b}from"./chunk-LCSFBDUL.js";var l=null,g="missing",p="",r=new Set;function x(t,a=""){let i=u(t.title||""),e=t.releaseDate?t.releaseDate.slice(0,4):"\u2014",s=t.albumType||"Album",d=a?I(a,t.title||""):!1,A=f.tidarrOk&&a&&!t.inPlex?d?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${n(a)}" data-dlalbum="${n(t.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${n(a)}" data-dlalbum="${n(t.title||"")}" title="Download via Tidarr">\u2B07</button>`:"",$=t.image?m(t.image,120):null,B=$?`<img src="${n($)}" alt="${n(t.title)}" loading="lazy" decoding="async" style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1" onload="this.style.opacity='1'" onerror="this.remove()">`:"";return`
    <div class="album-card missing" title="${n(t.title)}${e!=="\u2014"?" ("+e+")":""}">
      <div class="album-cover" style="background:${i}">
        <div class="album-cover-ph">${y(t.title||"?")}</div>
        ${B}
        ${A}
      </div>
      <div class="album-info">
        <div class="album-title">${n(t.title)}</div>
        <div class="album-year">${e} \xB7 ${s}</div>
        <span class="album-status miss">\u2726 Ontbreekt</span>
      </div>
    </div>`}function D(){let t=document.getElementById("view-toolbar"),a=l?new Set(l.gaps.map(e=>e.artistId)).size:0,i=l?l.gaps.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten..." class="toolbar-input" value="${n(p)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing" ${g==="missing"?"selected":""}>Meeste ontbrekend</option>
        <option value="name" ${g==="name"?"selected":""}>Naam A-Z</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${i} ontbrekende albums bij ${a} artiesten</span>
      <button id="gaps-refresh" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
  `,document.getElementById("gaps-search").addEventListener("input",e=>{p=e.target.value,o()}),document.getElementById("gaps-sort").addEventListener("change",e=>{g=e.target.value,o()}),document.getElementById("gaps-refresh").addEventListener("click",async()=>{c();try{await h("/api/gaps/refresh",{method:"POST"}),b("gaps"),l=null,r.clear(),await o()}catch(e){v("Kan gaps niet verversen: "+e.message)}})}function H(t){let a=r.has(t.artistId),i=t.missing?.length||0,e=Math.round(t.ownedCount/(t.ownedCount+i)*100),s=`
    <div class="gaps-artist-card" data-artist-id="${t.artistId}">
      <div class="gaps-artist-header">
        <div class="gaps-artist-info">
          ${t.thumb?`<img src="${m(t.thumb)}" class="gaps-artist-photo" alt="">`:`<div class="gaps-artist-photo" style="background:${u(t.title)}"></div>`}
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-artist-detail="${n(t.title)}">${n(t.title)}</a></h3>
            <div class="gaps-artist-tags">${w(t.country)} ${k(t.genres?.slice(0,3)||[])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${C("artist",t.title,t.title,t.thumb||"")}
          <button class="gaps-toggle-btn" data-id="${t.artistId}">
            ${a?"\u25BC":"\u25B6"} ${i} ontbreken
          </button>
        </div>
      </div>
      <div class="gaps-completeness">
        <div class="completeness-bar"><div class="bar-fill" style="width: ${e}%"></div></div>
        <span>${t.ownedCount}/${t.ownedCount+i} albums</span>
      </div>
  `;return a&&i>0&&(s+=`<div class="gaps-albums-section">
      <h4>Ontbrekende albums</h4>
      <div class="gaps-albums-grid">
        ${(t.missing||[]).map(d=>x(d,t.title)).join("")}
      </div>`,t.owned&&t.owned.length>0&&(s+=`
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${t.owned?.length||0})</summary>
          <div class="gaps-albums-grid">
            ${(t.owned||[]).map(d=>x(d,t.title)).join("")}
          </div>
        </details>`),s+="</div>"),s+="</div>",s}async function o(){let t=document.getElementById("content");try{if(!l){c();let e=L("gaps",300*1e3);if(e?.gaps&&e.gaps.length>0&&!("artistId"in e.gaps[0])&&(b("gaps"),e=null),e||(e=await h("/api/gaps"),E("gaps",e)),l=e,l.status==="building"){t.innerHTML=`<div class="loading-state"><p>Gaps-scanning lopend...</p>${c()}</div>`,setTimeout(()=>{l=null,o()},15e3);return}}D();let a=l.gaps||[];p&&(a=a.filter(e=>e.title.toLowerCase().includes(p.toLowerCase()))),g==="missing"?a.sort((e,s)=>(s.missing?.length||0)-(e.missing?.length||0)):a.sort((e,s)=>e.title.localeCompare(s.title)),t.innerHTML='<div class="gaps-container"></div>';let i=t.querySelector(".gaps-container");a.forEach(e=>{i.innerHTML+=H(e)}),i.addEventListener("click",e=>{if(e.target.classList.contains("gaps-toggle-btn")){e.preventDefault();let s=e.target.dataset.id;r.has(s)?r.delete(s):r.add(s),o()}})}catch(a){v("Kan gaps niet laden: "+a.message)}}async function Q(){T(),await o()}export{Q as loadGaps};
