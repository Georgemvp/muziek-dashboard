import{A as v,e as h,g as $,h as A,i as o,k as w,m as E,o as L,u as k,v as C,w as B,x as T}from"./chunk-GHKYA3ZE.js";var c=null,g="",p="name",f=null,I=0;function b(){return document.getElementById("content")}function M(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}function D(){let t=document.getElementById("view-toolbar");if(!t)return;let e=c?c.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="artists-search" placeholder="Filter artiesten..." class="toolbar-input" value="${o(g)}">
      <select id="artists-sort" class="toolbar-select">
        <option value="name" ${p==="name"?"selected":""}>Naam A-Z</option>
        <option value="playcount" ${p==="playcount"?"selected":""}>Meest beluisterd</option>
        <option value="recent" ${p==="recent"?"selected":""}>Recent toegevoegd</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${e} artiesten</span>
    </div>
  `,document.getElementById("artists-search").addEventListener("input",n=>{g=n.target.value,y()}),document.getElementById("artists-sort").addEventListener("change",n=>{p=n.target.value,y()})}function N(t){let e=t.thumb?h(t.thumb,200):null,n=w(t.name||"?"),a=t.playcount?`<span class="artist-playcount-badge">${A(t.playcount)} plays</span>`:"";return`
    <div class="artist-card" data-artist-name="${o(t.name)}" title="${o(t.name)}">
      <div class="artist-cover">
        ${e?`<img src="${o(e)}" alt="${o(t.name)}" class="artist-photo" loading="lazy" decoding="async">`:`<div class="artist-photo-ph" style="background:${n}">${$(t.name)}</div>`}
        <div class="artist-overlay">
          <button class="artist-detail-btn" data-artist-detail="${o(t.name)}" title="Bekijk details">\u2192</button>
        </div>
      </div>
      <div class="artist-info">
        <div class="artist-name">${o(t.name)}</div>
        ${t.genres&&t.genres.length>0?E(t.genres.slice(0,2),2):""}
        ${a}
      </div>
      <div class="artist-actions">
        ${L("artist",t.name,t.name,t.thumb||"")}
      </div>
    </div>
  `}function S(t){let e=[...t];if(g){let n=g.toLowerCase();e=e.filter(a=>a.name.toLowerCase().includes(n)||a.genres&&a.genres.some(i=>i.toLowerCase().includes(n)))}return p==="playcount"?e.sort((n,a)=>(a.playcount||0)-(n.playcount||0)):p==="recent"?e.sort((n,a)=>(a.addedAt||0)-(n.addedAt||0)):e.sort((n,a)=>n.name.localeCompare(a.name)),e}async function H(t){f=t;let e=b();e&&(I=e.scrollTop||0,await R())}function q(){f=null;let t=b();if(t){let e=S(c||[]);y().then(()=>{setTimeout(()=>{t.scrollTop=I},0)})}}async function R(){let t=b();if(!t||!f)return;let e=f,n=e.thumb?h(e.thumb,320):null,a={genres:e.genres||[],bio:""};try{let l=await v(`/api/artist/${encodeURIComponent(e.name)}/info`);l&&(a={genres:l.genres||e.genres||[],bio:l.bio||"",playcount:l.playcount||e.playcount||0})}catch(l){console.warn("Error loading artist info:",l)}let i=a.bio?`<div class="artist-detail-bio" style="margin: 24px 0; font-size: 14px; line-height: 1.6; color: var(--text-secondary);">
         ${o(a.bio.substring(0,300))}${a.bio.length>300?"...":""}
       </div>`:"",u=a.genres&&a.genres.length>0?`<div style="margin: 12px 0;">${E(a.genres.slice(0,5),5)}</div>`:"";t.innerHTML=`
    <div class="artist-detail-view">
      <!-- Header: Back button -->
      <button class="artist-detail-back" title="Terug naar artiesten">\u2190 Alle artiesten</button>

      <!-- Hero Section -->
      <div class="artist-detail-hero">
        <div class="artist-detail-cover-wrapper">
          ${n?`<img src="${o(n)}" alt="${o(e.name)}" class="artist-detail-cover">`:`<div class="artist-detail-cover-ph" style="background:${w(e.name)}">${$(e.name)}</div>`}
        </div>
        <div class="artist-detail-info">
          <h1>${o(e.name)}</h1>
          ${u}
          <div class="artist-detail-stats">
            ${a.playcount?`<span>${A(a.playcount)} plays</span>`:""}
          </div>
          <div class="artist-detail-actions">
            ${L("artist",e.name,e.name,e.thumb||"")}
          </div>
        </div>
      </div>

      <!-- Bio -->
      ${i}
    </div>
  `,t.querySelector(".artist-detail-back")?.addEventListener("click",q)}async function y(){let t=b();if(t)try{if(!c){C();let i=[];try{let s=await v("/api/plex/library/all");if(s?.library&&Array.isArray(s.library)){let r=new Map;s.library.forEach(d=>{let x=d[0]||"",m=x.toLowerCase();r.has(m)?(r.get(m).albumCount++,(d[4]||0)>r.get(m).addedAt&&(r.get(m).addedAt=d[4]||0),!r.get(m).thumb&&d[3]&&(r.get(m).thumb=d[3])):r.set(m,{name:x,thumb:d[3]||"",addedAt:d[4]||0,playcount:0,albumCount:1})}),i=Array.from(r.values())}}catch(s){console.error("Error loading Plex library:",s),k("Kan Plex-bibliotheek niet laden: "+s.message);return}let u={};try{let s=await v("/api/top/artists?period=overall");s&&Array.isArray(s)&&s.forEach(r=>{u[r.name.toLowerCase()]={playcount:parseInt(r.playcount,10)||0,genres:r.tags||[],url:r.url}})}catch(s){console.warn("Error loading Last.fm data:",s)}c=i.map(s=>({...s,...u[s.name.toLowerCase()]||{}})),T("artists",c)}D();let e=S(c),a=`
      <div class="artists-grid" style="display: grid; grid-template-columns: repeat(${M()}, minmax(150px, 1fr)); gap: var(--grid-gap); padding: 16px 0;">
        ${e.map(i=>N(i)).join("")}
      </div>
    `;t.innerHTML=a,t.querySelectorAll(".artist-detail-btn").forEach(i=>{i.addEventListener("click",u=>{u.preventDefault();let s=i.closest(".artist-card")?.dataset.artistName;if(s){let r=c.find(d=>d.name===s);r&&H(r)}})}),t.querySelectorAll(".artist-card").forEach(i=>{i.addEventListener("click",u=>{if(u.target.closest(".artist-actions, .artist-detail-btn"))return;let l=i.dataset.artistName;if(l){let s=c.find(r=>r.name===l);s&&H(s)}})})}catch(e){k("Error: "+e.message)}}async function G(){document.title="Muziek \xB7 Artists",g="",p="name",f=null;let t=B("artists",1800*1e3);t?c=t:c=null,await y()}export{G as loadArtists};
