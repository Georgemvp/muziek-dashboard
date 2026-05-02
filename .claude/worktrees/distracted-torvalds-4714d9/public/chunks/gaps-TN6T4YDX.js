import{t as A}from"./chunk-AP2PRKJF.js";import"./chunk-2UCV5F4T.js";import{d as $,f as C,h as l,j as f,k as D,l as E,n as I,o as L,t as w,u as v,v as T,w as x,x as y,z as k}from"./chunk-HCN2ZK5I.js";import{a as c}from"./chunk-2BMKGNH5.js";var o=null,b="missing",h="",u=new Set;function B(t,s=""){let n=f(t.title||""),e=t.releaseDate?t.releaseDate.slice(0,4):"\u2014",a=t.albumType||"Album",d=s?L(s,t.title||""):!1,r=(c.tidarrOk||c.orpheusConnected)&&s&&!t.inPlex?d?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${l(s)}" data-dlalbum="${l(t.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${l(s)}" data-dlalbum="${l(t.title||"")}" title="Download via Tidarr">\u2B07</button>`:"",i=t.image?$(t.image,120):null,m=i?`<img src="${l(i)}" alt="${l(t.title)}" loading="lazy" decoding="async" style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1" onload="this.style.opacity='1'" onerror="this.remove()">`:"";return`
    <div class="album-card missing" title="${l(t.title)}${e!=="\u2014"?" ("+e+")":""}">
      <div class="album-cover" style="background:${n}">
        <div class="album-cover-ph">${C(t.title||"?")}</div>
        ${m}
        ${r}
      </div>
      <div class="album-info">
        <div class="album-title">${l(t.title)}</div>
        <div class="album-year">${e} \xB7 ${a}</div>
        <span class="album-status miss">\u2726 Ontbreekt</span>
      </div>
    </div>`}function H(){let t=document.getElementById("view-toolbar"),s=o?new Set(o.gaps.map(e=>e.artistId)).size:0,n=o?o.gaps.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten..." class="toolbar-input" value="${l(h)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing" ${b==="missing"?"selected":""}>Meeste ontbrekend</option>
        <option value="name" ${b==="name"?"selected":""}>Naam A-Z</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${n} ontbrekende albums bij ${s} artiesten</span>
      <button id="gaps-refresh" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
  `,document.getElementById("gaps-search").addEventListener("input",e=>{h=e.target.value,g()}),document.getElementById("gaps-sort").addEventListener("change",e=>{b=e.target.value,g()}),document.getElementById("gaps-refresh").addEventListener("click",async()=>{v();try{await k("/api/gaps/refresh",{method:"POST"}),y("gaps"),o=null,u.clear(),await g()}catch(e){w("Kan gaps niet verversen: "+e.message)}})}function G(t){let s=u.has(t.artistId),n=t.missing?.length||0,e=Math.round(t.ownedCount/(t.ownedCount+n)*100),a=`
    <div class="gaps-artist-card" data-artist-id="${t.artistId}">
      <div class="gaps-artist-header">
        <div class="gaps-artist-info">
          ${t.thumb?`<img src="${$(t.thumb)}" class="gaps-artist-photo" alt="" loading="lazy" decoding="async">`:`<div class="gaps-artist-photo" style="background:${f(t.title)}"></div>`}
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-artist-detail="${l(t.title)}">${l(t.title)}</a></h3>
            <div class="gaps-artist-tags">${D(t.country)} ${E(t.genres?.slice(0,3)||[])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${I("artist",t.title,t.title,t.thumb||"")}
          ${(c.tidarrOk||c.orpheusConnected)&&n>0?`<button class="gaps-dl-all-btn download-btn" data-dlartist="${l(t.title)}" data-dl-all-gaps="true" title="Download alle ${n} ontbrekende albums">\u2B07 Alles (${n})</button>`:""}
          <button class="gaps-toggle-btn" data-id="${t.artistId}">
            ${s?"\u25BC":"\u25B6"} ${n} ontbreken
          </button>
        </div>
      </div>
      <div class="gaps-completeness">
        <div class="completeness-bar"><div class="bar-fill" style="width: ${e}%"></div></div>
        <span>${t.ownedCount}/${t.ownedCount+n} albums</span>
      </div>
  `;return s&&n>0&&(a+=`<div class="gaps-albums-section">
      <h4>Ontbrekende albums</h4>
      <div class="gaps-albums-grid">
        ${(t.missing||[]).map(d=>B(d,t.title)).join("")}
      </div>`,t.owned&&t.owned.length>0&&(a+=`
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${t.owned?.length||0})</summary>
          <div class="gaps-albums-grid">
            ${(t.owned||[]).map(d=>B(d,t.title)).join("")}
          </div>
        </details>`),a+="</div>"),a+="</div>",a}async function g(){let t=document.getElementById("content");try{if(!o){v();let e=T("gaps",300*1e3);if(e?.gaps&&e.gaps.length>0&&!("artistId"in e.gaps[0])&&(y("gaps"),e=null),e||(e=await k("/api/gaps"),x("gaps",e)),o=e,o.status==="building"){t.innerHTML=`<div class="loading-state"><p>Gaps-scanning lopend...</p>${v()}</div>`,setTimeout(()=>{o=null,g()},15e3);return}}H();let s=o.gaps||[];h&&(s=s.filter(e=>e.title.toLowerCase().includes(h.toLowerCase()))),b==="missing"?s.sort((e,a)=>(a.missing?.length||0)-(e.missing?.length||0)):s.sort((e,a)=>e.title.localeCompare(a.title)),t.innerHTML='<div class="gaps-container"></div>';let n=t.querySelector(".gaps-container");s.forEach(e=>{n.innerHTML+=G(e)}),n.addEventListener("click",async e=>{if(e.target.classList.contains("gaps-toggle-btn")){e.preventDefault();let a=e.target.dataset.id;u.has(a)?u.delete(a):u.add(a),g();return}if(e.target.dataset.dlAllGaps){e.stopPropagation();let a=e.target.dataset.dlartist,d=o.gaps.find(i=>i.title===a);if(!d||!d.missing?.length)return;let p=d.missing.filter(i=>!i.inPlex);if(!p.length||!confirm(`Download ${p.length} ontbrekende album${p.length!==1?"s":""} van ${a}?`))return;let r=e.target;r.disabled=!0,r.textContent="Bezig\u2026";try{let i=await import("./downloads-G7H5KNHU.js");for(let m of p)c.downloadEngine==="orpheus"?await i.triggerOrpheusDownload(a,m.title,null):await i.triggerTidarrDownload(a,m.title,null);r.textContent="\u2713 Klaar"}catch(i){r.textContent="\u26A0 Fout",r.disabled=!1,console.error("Bulk download mislukt:",i)}return}})}catch(s){w("Kan gaps niet laden: "+s.message)}}async function V(){A(),await g()}export{V as loadGaps};
