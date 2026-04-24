import{p as L}from"./chunk-ENY6TNDU.js";import{A as y,B as I,D as v,e as h,i as p,m as b,n as f,p as w,u as m,w as u,x as d,z as $}from"./chunk-OMN3JMHQ.js";var n=null,r="missing",c="",l=new Set;function C(){let t=document.getElementById("view-toolbar"),a=n?new Set(n.gaps.map(e=>e.artistId)).size:0,i=n?n.gaps.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="gaps-search" placeholder="Filter artiesten..." class="toolbar-input" value="${p(c)}">
      <select id="gaps-sort" class="toolbar-select">
        <option value="missing" ${r==="missing"?"selected":""}>Meeste ontbrekend</option>
        <option value="name" ${r==="name"?"selected":""}>Naam A-Z</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${i} ontbrekende albums bij ${a} artiesten</span>
      <button id="gaps-refresh" class="toolbar-btn">\u21BB Vernieuwen</button>
    </div>
  `,document.getElementById("gaps-search").addEventListener("input",e=>{c=e.target.value,o()}),document.getElementById("gaps-sort").addEventListener("change",e=>{r=e.target.value,o()}),document.getElementById("gaps-refresh").addEventListener("click",async()=>{d();try{await v("/api/gaps/refresh",{method:"POST"}),I("gaps"),n=null,l.clear(),await o()}catch(e){u("Kan gaps niet verversen: "+e.message)}})}function E(t){let a=l.has(t.artistId),i=t.missing?.length||0,e=Math.round(t.ownedCount/(t.ownedCount+i)*100),s=`
    <div class="gaps-artist-card" data-artist-id="${t.artistId}">
      <div class="gaps-artist-header">
        <div class="gaps-artist-info">
          <img src="${h(t.thumb)}" class="gaps-artist-photo" alt="">
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-id="${t.artistId}">${p(t.title)}</a></h3>
            <div class="gaps-artist-tags">${b(t.country)} ${f(t.genres?.slice(0,3)||[])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${w(t.artistId,t.wishedFor)}
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
        ${t.missing.map(g=>m(g)).join("")}
      </div>`,t.owned?.length>0&&(s+=`
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${t.owned.length})</summary>
          <div class="gaps-albums-grid">
            ${t.owned.map(g=>m(g)).join("")}
          </div>
        </details>`),s+="</div>"),s+="</div>",s}async function o(){let t=document.getElementById("content");try{if(!n){d();let e=$("gaps",300*1e3);if(e||(e=await v("/api/gaps"),y("gaps",e)),n=e,n.status==="building"){t.innerHTML=`<div class="loading-state"><p>Gaps-scanning lopend...</p>${d()}</div>`,setTimeout(()=>{n=null,o()},15e3);return}}C();let a=n.gaps||[];c&&(a=a.filter(e=>e.title.toLowerCase().includes(c.toLowerCase()))),r==="missing"?a.sort((e,s)=>(s.missing?.length||0)-(e.missing?.length||0)):a.sort((e,s)=>e.title.localeCompare(s.title)),t.innerHTML='<div class="gaps-container"></div>';let i=t.querySelector(".gaps-container");a.forEach(e=>{i.innerHTML+=E(e)}),i.addEventListener("click",e=>{if(e.target.classList.contains("gaps-toggle-btn")){e.preventDefault();let s=parseInt(e.target.dataset.id);l.has(s)?l.delete(s):l.add(s),o()}e.target.classList.contains("artist-link")&&(e.preventDefault(),window.showArtistPanel?.(e.target.dataset.id))})}catch(a){u("Kan gaps niet laden: "+a.message)}}async function D(){L(),await o()}export{D as loadGaps};
