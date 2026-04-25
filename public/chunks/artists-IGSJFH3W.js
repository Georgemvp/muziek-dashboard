import{A as g,e as y,g as b,h,i as o,k as $,m as A,o as w,u as E,v as x,w as L,x as k}from"./chunk-GHKYA3ZE.js";var c=null,m="",u="name",p=null,B=0;function f(){return document.getElementById("content")}function I(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}function S(){let t=document.getElementById("view-toolbar");if(!t)return;let e=c?c.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="artists-search" placeholder="Filter artiesten..." class="toolbar-input" value="${o(m)}">
      <select id="artists-sort" class="toolbar-select">
        <option value="name" ${u==="name"?"selected":""}>Naam A-Z</option>
        <option value="playcount" ${u==="playcount"?"selected":""}>Meest beluisterd</option>
        <option value="recent" ${u==="recent"?"selected":""}>Recent toegevoegd</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${e} artiesten</span>
    </div>
  `,document.getElementById("artists-search").addEventListener("input",s=>{m=s.target.value,v()}),document.getElementById("artists-sort").addEventListener("change",s=>{u=s.target.value,v()})}function D(t){let e=t.thumb?y(t.thumb,200):null,s=$(t.name||"?"),a=t.playcount?`<span class="artist-playcount-badge">${h(t.playcount)} plays</span>`:"";return`
    <div class="artist-card" data-artist-name="${o(t.name)}" title="${o(t.name)}">
      <div class="artist-cover">
        ${e?`<img src="${o(e)}" alt="${o(t.name)}" class="artist-photo" loading="lazy" decoding="async">`:`<div class="artist-photo-ph" style="background:${s}">${b(t.name)}</div>`}
        <div class="artist-overlay">
          <button class="artist-detail-btn" data-artist-detail="${o(t.name)}" title="Bekijk details">\u2192</button>
        </div>
      </div>
      <div class="artist-info">
        <div class="artist-name">${o(t.name)}</div>
        ${t.genres&&t.genres.length>0?A(t.genres.slice(0,2),2):""}
        ${a}
      </div>
      <div class="artist-actions">
        ${w("artist",t.name,t.name,t.thumb||"")}
      </div>
    </div>
  `}function T(t){let e=[...t];if(m){let s=m.toLowerCase();e=e.filter(a=>a.name.toLowerCase().includes(s)||a.genres&&a.genres.some(r=>r.toLowerCase().includes(s)))}return u==="playcount"?e.sort((s,a)=>(a.playcount||0)-(s.playcount||0)):u==="recent"?e.sort((s,a)=>(a.addedAt||0)-(s.addedAt||0)):e.sort((s,a)=>s.name.localeCompare(a.name)),e}async function C(t){p=t;let e=f();e&&(B=e.scrollTop||0,await N())}function M(){p=null;let t=f();if(t){let e=T(c||[]);v().then(()=>{setTimeout(()=>{t.scrollTop=B},0)})}}async function N(){let t=f();if(!t||!p)return;let e=p,s=e.thumb?y(e.thumb,320):null,a={genres:e.genres||[],bio:""};try{let l=await g(`/api/artist/${encodeURIComponent(e.name)}/info`);l&&(a={genres:l.genres||e.genres||[],bio:l.bio||"",playcount:l.playcount||e.playcount||0})}catch(l){console.warn("Error loading artist info:",l)}let r=a.bio?`<div class="artist-detail-bio" style="margin: 24px 0; font-size: 14px; line-height: 1.6; color: var(--text-secondary);">
         ${o(a.bio.substring(0,300))}${a.bio.length>300?"...":""}
       </div>`:"",d=a.genres&&a.genres.length>0?`<div style="margin: 12px 0;">${A(a.genres.slice(0,5),5)}</div>`:"";t.innerHTML=`
    <div class="artist-detail-view">
      <!-- Header: Back button -->
      <button class="artist-detail-back" title="Terug naar artiesten">\u2190 Alle artiesten</button>

      <!-- Hero Section -->
      <div class="artist-detail-hero">
        <div class="artist-detail-cover-wrapper">
          ${s?`<img src="${o(s)}" alt="${o(e.name)}" class="artist-detail-cover">`:`<div class="artist-detail-cover-ph" style="background:${$(e.name)}">${b(e.name)}</div>`}
        </div>
        <div class="artist-detail-info">
          <h1>${o(e.name)}</h1>
          ${d}
          <div class="artist-detail-stats">
            ${a.playcount?`<span>${h(a.playcount)} plays</span>`:""}
          </div>
          <div class="artist-detail-actions">
            ${w("artist",e.name,e.name,e.thumb||"")}
          </div>
        </div>
      </div>

      <!-- Bio -->
      ${r}
    </div>
  `,t.querySelector(".artist-detail-back")?.addEventListener("click",M)}async function v(){let t=f();if(t)try{if(!c){x();let r=[];try{let n=await g("/api/plex/library");n&&Array.isArray(n)&&(r=n.map(i=>({name:i.title,thumb:i.thumb,addedAt:i.addedAt||0,playcount:0})))}catch(n){console.error("Error loading Plex library:",n),E("Kan Plex-bibliotheek niet laden: "+n.message);return}let d={};try{let n=await g("/api/top/artists?period=overall");n&&Array.isArray(n)&&n.forEach(i=>{d[i.name.toLowerCase()]={playcount:parseInt(i.playcount,10)||0,genres:i.tags||[],url:i.url}})}catch(n){console.warn("Error loading Last.fm data:",n)}c=r.map(n=>({...n,...d[n.name.toLowerCase()]||{}})),k("artists",c)}S();let e=T(c),a=`
      <div class="artists-grid" style="display: grid; grid-template-columns: repeat(${I()}, minmax(150px, 1fr)); gap: var(--grid-gap); padding: 16px 0;">
        ${e.map(r=>D(r)).join("")}
      </div>
    `;t.innerHTML=a,t.querySelectorAll(".artist-detail-btn").forEach(r=>{r.addEventListener("click",d=>{d.preventDefault();let n=r.closest(".artist-card")?.dataset.artistName;if(n){let i=c.find(H=>H.name===n);i&&C(i)}})}),t.querySelectorAll(".artist-card").forEach(r=>{r.addEventListener("click",d=>{if(d.target.closest(".artist-actions, .artist-detail-btn"))return;let l=r.dataset.artistName;if(l){let n=c.find(i=>i.name===l);n&&C(n)}})})}catch(e){E("Error: "+e.message)}}async function j(){document.title="Muziek \xB7 Artists",m="",u="name",p=null;let t=L("artists",1800*1e3);t?c=t:c=null,await v()}export{j as loadArtists};
