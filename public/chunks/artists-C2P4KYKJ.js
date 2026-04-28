import{a as v}from"./chunk-NJVQXPXI.js";import{d as A,f as $,g as w,h as i,j as E,l as C,n as L,t as f,u as x,v as k,w as B,z as y}from"./chunk-E2KQEDIW.js";import"./chunk-2GHQROOJ.js";var l=null,p="",u="name";function I(){return document.getElementById("content")}function M(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}function N(){let t=document.getElementById("view-toolbar");if(!t)return;let a=l?l.length:0;t.innerHTML=`
    <div class="toolbar-group">
      <input type="text" id="artists-search" placeholder="Filter artiesten..." class="toolbar-input" value="${i(p)}">
      <select id="artists-sort" class="toolbar-select">
        <option value="name" ${u==="name"?"selected":""}>Naam A-Z</option>
        <option value="playcount" ${u==="playcount"?"selected":""}>Meest beluisterd</option>
        <option value="recent" ${u==="recent"?"selected":""}>Recent toegevoegd</option>
      </select>
    </div>
    <div class="toolbar-group">
      <span class="toolbar-badge">${a} artiesten</span>
    </div>
  `,document.getElementById("artists-search").addEventListener("input",r=>{p=r.target.value,h()}),document.getElementById("artists-sort").addEventListener("change",r=>{u=r.target.value,h()})}function S(t){let a=t.thumb?A(t.thumb,200):null,r=E(t.name||"?"),s=t.playcount?`<span class="artist-playcount-badge">${w(t.playcount)} plays</span>`:"";return`
    <div class="artist-card" data-artist-name="${i(t.name)}" title="${i(t.name)}">
      <div class="artist-cover">
        ${a?`<img src="${i(a)}" alt="${i(t.name)}" class="artist-photo" loading="lazy" decoding="async">`:`<div class="artist-photo-ph" style="background:${r}">${$(t.name)}</div>`}
        <div class="artist-overlay">
          <button class="artist-detail-btn" data-artist-detail="${i(t.name)}" title="Bekijk details">\u2192</button>
        </div>
      </div>
      <div class="artist-info">
        <div class="artist-name">${i(t.name)}</div>
        ${t.genres&&t.genres.length>0?C(t.genres.slice(0,2),2):""}
        ${s}
      </div>
      <div class="artist-actions">
        ${L("artist",t.name,t.name,t.thumb||"")}
      </div>
    </div>
  `}function T(t){let a=[...t];if(p){let r=p.toLowerCase();a=a.filter(s=>s.name.toLowerCase().includes(r)||s.genres&&s.genres.some(o=>o.toLowerCase().includes(r)))}return u==="playcount"?a.sort((r,s)=>(s.playcount||0)-(r.playcount||0)):u==="recent"?a.sort((r,s)=>(s.addedAt||0)-(r.addedAt||0)):a.sort((r,s)=>r.name.localeCompare(s.name)),a}async function h(){let t=I();if(t)try{if(!l){x();let o=[];try{let e=await y("/api/plex/library/all");if(e?.library&&Array.isArray(e.library)){let n=new Map;e.library.forEach(c=>{let b=c[0]||"",d=b.toLowerCase();n.has(d)?(n.get(d).albumCount++,(c[4]||0)>n.get(d).addedAt&&(n.get(d).addedAt=c[4]||0),!n.get(d).thumb&&c[3]&&(n.get(d).thumb=c[3])):n.set(d,{name:b,thumb:c[3]||"",addedAt:c[4]||0,playcount:0,albumCount:1})}),o=Array.from(n.values())}}catch(e){console.error("Error loading Plex library:",e),f("Kan Plex-bibliotheek niet laden: "+e.message);return}let m={};try{let e=await y("/api/top/artists?period=overall");e&&Array.isArray(e)&&e.forEach(n=>{m[n.name.toLowerCase()]={playcount:parseInt(n.playcount,10)||0,genres:n.tags||[],url:n.url}})}catch(e){console.warn("Error loading Last.fm data:",e)}l=o.map(e=>({...e,...m[e.name.toLowerCase()]||{}})),B("artists",l)}N();let a=T(l),s=`
      <div class="artists-grid" style="display: grid; grid-template-columns: repeat(${M()}, minmax(150px, 1fr)); gap: var(--grid-gap); padding: 16px 0;">
        ${a.map(o=>S(o)).join("")}
      </div>
    `;t.innerHTML=s,t.querySelectorAll(".artist-detail-btn").forEach(o=>{o.addEventListener("click",m=>{m.preventDefault();let e=o.closest(".artist-card")?.dataset.artistName;e&&v("artist-detail",{name:e})})}),t.querySelectorAll(".artist-card").forEach(o=>{o.addEventListener("click",m=>{if(m.target.closest(".artist-actions, .artist-detail-btn"))return;let g=o.dataset.artistName;g&&v("artist-detail",{name:g})})})}catch(a){f("Error: "+a.message)}}async function D(){document.title="Muziek \xB7 Artists",p="",u="name";let t=k("artists",1800*1e3);t?l=t:l=null,await h()}export{D as loadArtists};
