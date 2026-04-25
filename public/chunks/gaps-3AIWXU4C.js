import{p as D}from"./chunk-3WLZX6H4.js";import"./chunk-2UCV5F4T.js";import{A as y,a as b,e as h,g as k,i,k as $,l as C,m as I,o as L,p as T,u as f,v as u,w as x,x as E,y as w}from"./chunk-LCSFBDUL.js";var l=null,m="missing",v="",p=new Set;function A(t,s=""){let n=$(t.title||""),e=t.releaseDate?t.releaseDate.slice(0,4):"\u2014",a=t.albumType||"Album",o=s?T(s,t.title||""):!1,c=b.tidarrOk&&s&&!t.inPlex?o?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${i(s)}" data-dlalbum="${i(t.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${i(s)}" data-dlalbum="${i(t.title||"")}" title="Download via Tidarr">\u2B07</button>`:"",r=t.image?h(t.image,120):null,d=r?`<img src="${i(r)}" alt="${i(t.title)}" loading="lazy" decoding="async" style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1" onload="this.style.opacity='1'" onerror="this.remove()">`:"";return`
    <div class="album-card missing" title="${i(t.title)}${e!=="\u2014"?" ("+e+")":""}">
      <div class="album-cover" style="background:${n}">
        <div class="album-cover-ph">${k(t.title||"?")}</div>
        ${d}
        ${c}
      </div>
      <div class="album-info">
        <div class="album-title">${i(t.title)}</div>
        <div class="album-year">${e} \xB7 ${a}</div>
        <span class="album-status miss">\u2726 Ontbreekt</span>
      </div>
    </div>`}function H(){let t=document.getElementById("view-toolbar"),s=l?new Set(l.gaps.map(e=>e.artistId)).size:0,n=l?l.gaps.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten..." class="toolbar-input" value="${i(v)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing" ${m==="missing"?"selected":""}>Meeste ontbrekend</option>
        <option value="name" ${m==="name"?"selected":""}>Naam A-Z</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${n} ontbrekende albums bij ${s} artiesten</span>
      <button id="gaps-refresh" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
  `,document.getElementById("gaps-search").addEventListener("input",e=>{v=e.target.value,g()}),document.getElementById("gaps-sort").addEventListener("change",e=>{m=e.target.value,g()}),document.getElementById("gaps-refresh").addEventListener("click",async()=>{u();try{await y("/api/gaps/refresh",{method:"POST"}),w("gaps"),l=null,p.clear(),await g()}catch(e){f("Kan gaps niet verversen: "+e.message)}})}function G(t){let s=p.has(t.artistId),n=t.missing?.length||0,e=Math.round(t.ownedCount/(t.ownedCount+n)*100),a=`
    <div class="gaps-artist-card" data-artist-id="${t.artistId}">
      <div class="gaps-artist-header">
        <div class="gaps-artist-info">
          ${t.thumb?`<img src="${h(t.thumb)}" class="gaps-artist-photo" alt="">`:`<div class="gaps-artist-photo" style="background:${$(t.title)}"></div>`}
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-artist-detail="${i(t.title)}">${i(t.title)}</a></h3>
            <div class="gaps-artist-tags">${C(t.country)} ${I(t.genres?.slice(0,3)||[])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${L("artist",t.title,t.title,t.thumb||"")}
          ${b.tidarrOk&&n>0?`<button class="gaps-dl-all-btn download-btn" data-dlartist="${i(t.title)}" data-dl-all-gaps="true" title="Download alle ${n} ontbrekende albums">\u2B07 Alles (${n})</button>`:""}
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
        ${(t.missing||[]).map(o=>A(o,t.title)).join("")}
      </div>`,t.owned&&t.owned.length>0&&(a+=`
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${t.owned?.length||0})</summary>
          <div class="gaps-albums-grid">
            ${(t.owned||[]).map(o=>A(o,t.title)).join("")}
          </div>
        </details>`),a+="</div>"),a+="</div>",a}async function g(){let t=document.getElementById("content");try{if(!l){u();let e=x("gaps",300*1e3);if(e?.gaps&&e.gaps.length>0&&!("artistId"in e.gaps[0])&&(w("gaps"),e=null),e||(e=await y("/api/gaps"),E("gaps",e)),l=e,l.status==="building"){t.innerHTML=`<div class="loading-state"><p>Gaps-scanning lopend...</p>${u()}</div>`,setTimeout(()=>{l=null,g()},15e3);return}}H();let s=l.gaps||[];v&&(s=s.filter(e=>e.title.toLowerCase().includes(v.toLowerCase()))),m==="missing"?s.sort((e,a)=>(a.missing?.length||0)-(e.missing?.length||0)):s.sort((e,a)=>e.title.localeCompare(a.title)),t.innerHTML='<div class="gaps-container"></div>';let n=t.querySelector(".gaps-container");s.forEach(e=>{n.innerHTML+=G(e)}),n.addEventListener("click",async e=>{if(e.target.classList.contains("gaps-toggle-btn")){e.preventDefault();let a=e.target.dataset.id;p.has(a)?p.delete(a):p.add(a),g();return}if(e.target.dataset.dlAllGaps){e.stopPropagation();let a=e.target.dataset.dlartist,o=l.gaps.find(d=>d.title===a);if(!o||!o.missing?.length)return;let c=o.missing.filter(d=>!d.inPlex);if(!c.length||!confirm(`Download ${c.length} ontbrekende album${c.length!==1?"s":""} van ${a}?`))return;let r=e.target;r.disabled=!0,r.textContent="Bezig\u2026";try{let{triggerTidarrDownload:d}=await import("./downloads-HQF7EKPP.js");for(let B of c)await d(a,B.title,null);r.textContent="\u2713 Klaar"}catch(d){r.textContent="\u26A0 Fout",r.disabled=!1,console.error("Bulk download mislukt:",d)}return}})}catch(s){f("Kan gaps niet laden: "+s.message)}}async function V(){D(),await g()}export{V as loadGaps};
