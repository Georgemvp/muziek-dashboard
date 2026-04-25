import{p as C}from"./chunk-NE65XLZW.js";import{A as h,e as b,i as p,k as f,l as w,m as $,o as y,s as m,u,v as d,w as I,x as L,y as v}from"./chunk-G2KURTNZ.js";var n=null,r="missing",c="",o=new Set;function E(){let t=document.getElementById("view-toolbar"),a=n?new Set(n.gaps.map(e=>e.artistId)).size:0,i=n?n.gaps.length:0;t.innerHTML=`
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
  `,document.getElementById("gaps-search").addEventListener("input",e=>{c=e.target.value,l()}),document.getElementById("gaps-sort").addEventListener("change",e=>{r=e.target.value,l()}),document.getElementById("gaps-refresh").addEventListener("click",async()=>{d();try{await h("/api/gaps/refresh",{method:"POST"}),v("gaps"),n=null,o.clear(),await l()}catch(e){u("Kan gaps niet verversen: "+e.message)}})}function k(t){let a=o.has(t.artistId),i=t.missing?.length||0,e=Math.round(t.ownedCount/(t.ownedCount+i)*100),s=`
    <div class="gaps-artist-card" data-artist-id="${t.artistId}">
      <div class="gaps-artist-header">
        <div class="gaps-artist-info">
          ${t.thumb?`<img src="${b(t.thumb)}" class="gaps-artist-photo" alt="">`:`<div class="gaps-artist-photo" style="background:${f(t.title)}"></div>`}
          <div class="gaps-artist-meta">
            <h3><a href="#" class="artist-link" data-id="${t.artistId}">${p(t.title)}</a></h3>
            <div class="gaps-artist-tags">${w(t.country)} ${$(t.genres?.slice(0,3)||[])}</div>
          </div>
        </div>
        <div class="gaps-artist-actions">
          ${y("artist",t.title,t.title,t.thumb||"")}
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
        ${(t.missing||[]).map(g=>m(g)).join("")}
      </div>`,t.owned&&t.owned.length>0&&(s+=`
        <details class="gaps-owned-details">
          <summary>Albums die je al hebt (${t.owned?.length||0})</summary>
          <div class="gaps-albums-grid">
            ${(t.owned||[]).map(g=>m(g)).join("")}
          </div>
        </details>`),s+="</div>"),s+="</div>",s}async function l(){let t=document.getElementById("content");try{if(!n){d();let e=I("gaps",300*1e3);if(e?.gaps&&e.gaps.length>0&&!("artistId"in e.gaps[0])&&(v("gaps"),e=null),e||(e=await h("/api/gaps"),L("gaps",e)),n=e,n.status==="building"){t.innerHTML=`<div class="loading-state"><p>Gaps-scanning lopend...</p>${d()}</div>`,setTimeout(()=>{n=null,l()},15e3);return}}E();let a=n.gaps||[];c&&(a=a.filter(e=>e.title.toLowerCase().includes(c.toLowerCase()))),r==="missing"?a.sort((e,s)=>(s.missing?.length||0)-(e.missing?.length||0)):a.sort((e,s)=>e.title.localeCompare(s.title)),t.innerHTML='<div class="gaps-container"></div>';let i=t.querySelector(".gaps-container");a.forEach(e=>{i.innerHTML+=k(e)}),i.addEventListener("click",e=>{if(e.target.classList.contains("gaps-toggle-btn")){e.preventDefault();let s=e.target.dataset.id;o.has(s)?o.delete(s):o.add(s),l()}e.target.classList.contains("artist-link")&&(e.preventDefault(),window.showArtistPanel?.(e.target.dataset.id))})}catch(a){u("Kan gaps niet laden: "+a.message)}}async function D(){C(),await l()}export{D as loadGaps};
