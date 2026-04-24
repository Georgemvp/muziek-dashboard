import{d as ct}from"./chunk-M4SWOCXN.js";import{a as X,j as tt,o as L}from"./chunk-SKRCWY6J.js";import{p as dt}from"./chunk-ENY6TNDU.js";import{A as Z,D as y,F as ot,a as B,b as W,e as x,f as J,g as k,h as K,i as s,j as Y,k as st,l as g,q as nt,t as Q,v as M,w as $,x as _,y as rt,z as F}from"./chunk-OMN3JMHQ.js";async function et(t){try{let e=X.getRecent();if(!e||e.length===0){t.innerHTML=`
        <div style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
          <p style="font-size: 14px; margin: 0;">Geen recent afgespeelde nummers</p>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
            Nummers verschijnen hier nadat je ze hebt afgespeeld
          </p>
        </div>
      `;return}let i=`
      <div class="recent-tracks-list">
        <div class="recent-header">
          <button class="recent-clear-btn" id="recent-clear">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Wis geschiedenis
          </button>
        </div>
        <div class="recent-items">
          ${e.map((l,n)=>wt(l,n)).join("")}
        </div>
      </div>
    `;t.innerHTML=i,rt();let a=t.querySelector("#recent-clear");a&&a.addEventListener("click",()=>{confirm("Geschiedenis wissen?")&&(X.clearRecent(),et(t))}),t.querySelectorAll(".recent-item").forEach(l=>{l.addEventListener("click",async n=>{n.preventDefault();let r={ratingKey:l.dataset.ratingKey,title:l.dataset.title,artist:l.dataset.artist,album:l.dataset.album,thumb:l.dataset.thumb,duration:l.dataset.duration?parseInt(l.dataset.duration):0};try{let d=await fetch("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:"__web__",ratingKey:r.ratingKey})}),b=await d.json();if(d.ok&&b.ok){let{playWebStream:c,playerState:o}=await import("./player-VIGJJRQW.js");await c(b.webStream);let p=document.getElementById("player-title"),m=document.getElementById("player-artist"),w=document.getElementById("player-art"),T=document.getElementById("player-play");p&&(p.textContent=r.title),m&&(m.textContent=r.artist),w&&(r.thumb||b.thumb)&&(w.src=r.thumb||b.thumb),T&&(T.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>')}}catch(d){console.error("Fout bij afspelen:",d)}})})}catch(e){console.error("Fout bij laden recent tracks:",e),t.innerHTML='<div style="color: var(--text-muted); padding: 20px;">Fout bij laden</div>'}}function wt(t,e){let i=t.thumb?x(t.thumb,120):null,a=i?`<img src="${s(i)}" alt="${s(t.title)}" loading="lazy" decoding="async"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",l=`<div class="recent-ph" style="background:${g(t.title)}">${k(t.title)}</div>`,n=t.playedAt?new Date(t.playedAt):null,r=n?Et(n):"";return`
    <div class="recent-item"
         data-rating-key="${s(t.ratingKey)}"
         data-title="${s(t.title)}"
         data-artist="${s(t.artist)}"
         data-album="${s(t.album||"")}"
         data-thumb="${s(t.thumb||"")}"
         data-duration="${t.duration||0}">
      <div class="recent-cover">
        ${a}
        ${l}
      </div>
      <div class="recent-info">
        <div class="recent-title">${s(t.title)}</div>
        <div class="recent-artist">${s(t.artist)}</div>
        <div class="recent-time">${r}</div>
      </div>
      <button class="recent-play-btn" aria-label="Afspelen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </button>
    </div>
  `}function Et(t){let i=new Date-t,a=Math.floor(i/6e4),l=Math.floor(i/36e5),n=Math.floor(i/864e5);return a<1?"Net gespeeld":a<60?`${a}m geleden`:l<24?`${l}u geleden`:n<7?`${n}d geleden`:t.toLocaleDateString("nl-NL")}var j=null,v="artist",C="",h="grid",f=null,H="grid",at=null,u=null,U=null,A=localStorage.getItem("blibCurrentTab")||"albums",R=null,z=null,P=null,D=null,N="",O="",I=[],xt=210,Lt=62,bt=3;function E(){return document.getElementById("content")}function ut(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}async function pt(){if(j)return j;try{let t=await y("/api/plex/library/all");return!t||!t.library?(console.warn("Bibliotheek response is null/undefined:",t),[]):Array.isArray(t.library)?t.library.length?(j=t.library.map(([e,i,a,l,n])=>({artist:e||"",album:i||"",ratingKey:a||"",thumb:l||"",addedAt:n||0})),j):[]:(console.warn("Bibliotheek is niet een array:",t.library),[])}catch(t){return console.error("Fout bij laden bibliotheek:",t),[]}}function Tt(){let t=j||[];f&&(t=t.filter(i=>i.artist===f));let e=C.toLowerCase().trim();return e&&(t=t.filter(i=>i.artist.toLowerCase().includes(e)||i.album.toLowerCase().includes(e))),v==="artist"?t=[...t].sort((i,a)=>i.artist.localeCompare(a.artist,"nl",{sensitivity:"base"})||i.album.localeCompare(a.album,"nl",{sensitivity:"base"})):v==="artist-za"?t=[...t].sort((i,a)=>a.artist.localeCompare(i.artist,"nl",{sensitivity:"base"})||a.album.localeCompare(i.album,"nl",{sensitivity:"base"})):v==="album"?t=[...t].sort((i,a)=>i.album.localeCompare(a.album,"nl",{sensitivity:"base"})):v==="album-za"?t=[...t].sort((i,a)=>a.album.localeCompare(i.album,"nl",{sensitivity:"base"})):v==="recent"&&(t=[...t].sort((i,a)=>(a.addedAt||0)-(i.addedAt||0))),t}function At(t){let e=new Map;for(let i of t){let a=(i.artist[0]||"#").toUpperCase(),l=/[A-Z]/.test(a)?a:"#";e.has(l)||e.set(l,[]),e.get(l).push(i)}return e}function St(t){let e=t.thumb?x(t.thumb,240):null,i=e?`<img src="${s(e)}" alt="${s(t.album)} by ${s(t.artist)}" loading="lazy" decoding="async"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${g(t.album)}">${k(t.album)}</div>`:`<div class="blib-cover-ph" style="background:${g(t.album)}">${k(t.album)}</div>`;return h==="list"?`<div class="blib-album blib-album-list"
      data-rating-key="${s(t.ratingKey)}"
      data-album="${s(t.album)}"
      data-artist="${s(t.artist)}"
      data-thumb="${s(t.thumb||"")}">
      <div class="blib-cover blib-cover-sm">${i}</div>
      <div class="blib-list-info">
        <div class="blib-album-title" title="${s(t.album)}">${s(t.album)}</div>
        <button class="blib-artist-filter-btn" data-artist-filter="${s(t.artist)}">${s(t.artist)}</button>
      </div>
      <button class="blib-play-btn" title="Afspelen">\u25B6</button>
    </div>`:`<div class="blib-album"
    data-rating-key="${s(t.ratingKey)}"
    data-album="${s(t.album)}"
    data-artist="${s(t.artist)}"
    data-thumb="${s(t.thumb||"")}">
    <div class="blib-cover">
      ${i}
      <div class="blib-play-overlay"><button class="blib-play-btn" title="Afspelen">\u25B6</button></div>
    </div>
    <div class="blib-album-title" title="${s(t.album)}">${s(t.album)}</div>
    <button class="blib-artist-filter-btn" data-artist-filter="${s(t.artist)}">${s(t.artist)}</button>
  </div>`}var it=class{constructor(e,i){this.container=e,this.items=i,this.cols=h==="list"?1:ut(),this.rowH=h==="list"?Lt:xt,this.lastStart=-1,this.lastEnd=-1;let a=v==="artist"&&!C&&!f&&h==="grid";this.groups=a?At(i):null,this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=E()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let e=[],i=0;if(this.groups)for(let[a,l]of this.groups){e.push({type:"header",letter:a,height:56,offset:i}),i+=56;for(let n=0;n<l.length;n+=this.cols)e.push({type:"items",items:l.slice(n,n+this.cols),height:this.rowH,offset:i}),i+=this.rowH}else for(let a=0;a<this.items.length;a+=this.cols)e.push({type:"items",items:this.items.slice(a,a+this.cols),height:this.rowH,offset:i}),i+=this.rowH;return this.totalHeight=i,e}_createDOM(){this.container.innerHTML=`<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".blib-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let e=h==="list"?1:ut();if(e!==this.cols){this.cols=e,this.flatRows=this._buildFlatRows();let i=this.container.querySelector(".blib-virtual-container");i&&(i.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let e=this._getScrollTop(),i=this._getViewHeight(),a=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),l=e-a,n=bt*this.rowH,r=0,d=this.flatRows.length-1;for(let c=0;c<this.flatRows.length;c++){let o=this.flatRows[c];if(o.offset+o.height>=l-n){r=Math.max(0,c-bt);break}}for(let c=r;c<this.flatRows.length;c++)if(this.flatRows[c].offset>l+i+n){d=c;break}if(r===this.lastStart&&d===this.lastEnd)return;this.lastStart=r,this.lastEnd=d;let b="";for(let c=r;c<=d&&c<this.flatRows.length;c++){let o=this.flatRows[c];if(o.type==="header")b+=`<div class="blib-letter-header" style="height:${o.height}px">${s(o.letter)}</div>`;else{b+=`<div class="${h==="list"?"blib-list-rows":"blib-grid"}">`;for(let m of o.items)b+=St(m);b+="</div>"}}this.winEl.style.top=(this.flatRows[r]?.offset||0)+"px",this.winEl.innerHTML=b}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(e){for(let i of this.flatRows)if(i.type==="header"&&i.letter===e){let a=this._scrollEl;if(a!==window)a.scrollTop=i.offset;else{let l=this.container.getBoundingClientRect().top+window.scrollY+i.offset-120;window.scrollTo({top:l,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(e=>e.type==="header").map(e=>e.letter))}};function Bt(t){let e=document.getElementById("blib-az-rail");if(!e)return;let i=t.getAvailableLetters();e.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(a=>`<button class="blib-az-btn${i.has(a)?"":" disabled"}" data-letter="${a}">${a}</button>`).join(""),e.addEventListener("click",a=>{let l=a.target.closest(".blib-az-btn");l&&!l.classList.contains("disabled")&&t.scrollToLetter(l.dataset.letter)})}function It(t){let e=document.getElementById("blib-count");e&&(e.textContent=`${K(t)} albums`)}async function G(t){u&&(u.destroy(),u=null);let e=Tt();if(It(e.length),!e.length){t.innerHTML=`
      <div class="blib-empty">
        <div class="blib-empty-icon">\u{1F3B5}</div>
        <h3>Geen albums gevonden</h3>
        <p>${C?`Geen resultaten voor "<strong>${s(C)}</strong>"`:f?`Geen albums van <strong>${s(f)}</strong> in bibliotheek.`:"Plex bibliotheek is leeg of nog niet gesynchroniseerd."}</p>
      </div>`;return}if(u=new it(t,e),v==="artist"&&!C&&!f&&h==="grid")Bt(u);else{let i=document.getElementById("blib-az-rail");i&&(i.innerHTML="")}}function vt(){S()}async function V(t){if(A===t)return;A=t,localStorage.setItem("blibCurrentTab",t),C="",N="",O="",vt();let e=E();if(e)switch(e.scrollTop=0,t){case"albums":S(),await q(e);break;case"artists":await ht(e);break;case"tracks":await Pt(e);break;case"genres":await kt(e);break;case"playlists":await Ft(e);break;case"recent":await Ot(e);break}}function S(){let t=document.getElementById("view-toolbar");if(!t)return;let e=["Albums","Artiesten","Nummers","Genres","Playlists","Recent"],i=["albums","artists","tracks","genres","playlists","recent"],a=`<div class="blib-tab-bar" id="blib-tab-bar">
    ${e.map((n,r)=>{let d=i[r];return`<button class="blib-tab-btn${A===d?" active":""}" data-tab="${d}">${n}</button>`}).join("")}
  </div>`,l="";A==="albums"?l=`
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-search" type="text"
          placeholder="\u{1F50D} Zoek artiest of album\u2026" autocomplete="off"
          value="${s(C)}">

        <div class="blib-toolbar-sep"></div>

        <div class="blib-view-toggle" role="group" aria-label="Weergavemodus">
          <button class="blib-pill${h==="grid"?" active":""}" id="blib-btn-grid"
                  title="Grid weergave" aria-pressed="${h==="grid"}">\u229E</button>
          <button class="blib-pill${h==="list"?" active":""}" id="blib-btn-list"
                  title="Lijst weergave" aria-pressed="${h==="list"}">\u2630</button>
        </div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="artist"${v==="artist"?" selected":""}>Artiest A\u2013Z</option>
          <option value="artist-za"${v==="artist-za"?" selected":""}>Artiest Z\u2013A</option>
          <option value="album"${v==="album"?" selected":""}>Album A\u2013Z</option>
          <option value="album-za"${v==="album-za"?" selected":""}>Album Z\u2013A</option>
          <option value="recent"${v==="recent"?" selected":""}>Recent toegevoegd</option>
          <option value="year-new"${v==="year-new"?" selected":""}>Jaar (nieuwste eerst)</option>
          <option value="year-old"${v==="year-old"?" selected":""}>Jaar (oudste eerst)</option>
        </select>

        <span class="blib-count" id="blib-count"></span>

        <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
      </div>
      <div class="blib-az-rail" id="blib-az-rail"></div>`:A==="artists"?l=`
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-artist-search" type="text"
          placeholder="\u{1F50D} Zoek artiest\u2026" autocomplete="off"
          value="${s(O)}">

        <div class="blib-toolbar-sep"></div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="artist"${v==="artist"?" selected":""}>Naam A\u2013Z</option>
          <option value="artist-za"${v==="artist-za"?" selected":""}>Naam Z\u2013A</option>
          <option value="albums"${v==="albums"?" selected":""}>Aantal albums (meeste eerst)</option>
        </select>

        <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
      </div>`:A==="tracks"?l=`
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-track-search" type="text"
          placeholder="\u{1F50D} Zoek nummer\u2026" autocomplete="off"
          value="${s(N)}">

        <div class="blib-toolbar-sep"></div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="title"${v==="title"?" selected":""}>Titel A\u2013Z</option>
          <option value="artist"${v==="artist"?" selected":""}>Artiest A\u2013Z</option>
          <option value="album"${v==="album"?" selected":""}>Album A\u2013Z</option>
          <option value="duration"${v==="duration"?" selected":""}>Duur (kortste eerst)</option>
          <option value="duration-long"${v==="duration-long"?" selected":""}>Duur (langste eerst)</option>
        </select>

        <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
      </div>`:l=`
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-search" type="text"
          placeholder="\u{1F50D} Zoeken\u2026" autocomplete="off"
          value="">
        <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
      </div>`,t.innerHTML=a+l,document.querySelectorAll("#blib-tab-bar .blib-tab-btn").forEach(n=>{n.addEventListener("click",()=>{let r=n.dataset.tab;V(r)})}),Ct()}function Ct(){let t=()=>E();document.getElementById("blib-search")?.addEventListener("input",e=>{if(C=e.target.value,f&&(f=null,H="grid"),t()){let a=document.getElementById("blib-grid-wrap");a&&G(a)}}),document.getElementById("blib-artist-search")?.addEventListener("input",e=>{O=e.target.value;let i=document.getElementById("blib-artists-grid");i&&gt(R||[],i)}),document.getElementById("blib-track-search")?.addEventListener("input",e=>{N=e.target.value;let i=document.getElementById("blib-tracks-list");i&&ft(z||[],i)}),document.getElementById("blib-btn-grid")?.addEventListener("click",()=>{if(h==="grid")return;h="grid",document.getElementById("blib-btn-grid")?.classList.add("active"),document.getElementById("blib-btn-list")?.classList.remove("active");let e=document.getElementById("blib-grid-wrap");e&&G(e)}),document.getElementById("blib-btn-list")?.addEventListener("click",()=>{if(h==="list")return;h="list",document.getElementById("blib-btn-list")?.classList.add("active"),document.getElementById("blib-btn-grid")?.classList.remove("active");let e=document.getElementById("blib-grid-wrap");e&&G(e)}),document.getElementById("blib-sort-select")?.addEventListener("change",e=>{v=e.target.value;let i=document.getElementById("blib-grid-wrap");i&&G(i)}),document.getElementById("btn-sync-plex-blib")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex-blib");if(!e)return;let i=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{try{await W("/api/plex/refresh",{method:"POST"})}catch(a){if(a.name!=="AbortError")throw a}await ot(),j=null,R=null,z=null,P=null,D=null,await V(A)}catch{}finally{e.disabled=!1,e.textContent=i}})}async function q(t){if(!t)return;H="grid",at=null,U=null,t.scrollTop=0,t.innerHTML='<div id="blib-grid-wrap"></div>';let e=document.getElementById("blib-grid-wrap");await G(e)}async function mt(t){H="detail",at=t;let e=E();if(!e)return;u&&(u.destroy(),u=null),e.scrollTop=0;let i=t.thumb?x(t.thumb,320):null,a=i?`<img src="${s(i)}" alt="${s(t.album)} by ${s(t.artist)}" loading="lazy" decoding="async"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${g(t.album)}">${k(t.album)}</div>`:`<div class="blib-detail-cover-ph" style="background:${g(t.album)}">${k(t.album)}</div>`,l=tt(),n=f?`<button class="blib-back-btn blib-back-artist" id="blib-back-to-artist">
         \u2190 ${s(f)}
       </button>`:"";if(e.innerHTML=`
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-back-to-grid">\u2190 Alle albums</button>
        ${n}
      </div>

      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${a}</div>
        <div class="blib-detail-info">
          <div class="blib-detail-label">Album</div>
          <h1 class="blib-detail-title">${s(t.album)}</h1>
          <div class="blib-detail-artist-wrap">
            <button class="blib-artist-filter-btn blib-detail-artist-btn"
                    data-artist-filter="${s(t.artist)}">${s(t.artist)}</button>
          </div>
          <div class="blib-detail-actions">
            <button class="blib-action-btn blib-action-primary" id="blib-play-all">
              \u25B6 Speel album af
            </button>
            ${l?`<button class="blib-action-btn" id="blib-play-plex" title="Speel op Plex: ${s(l)}">
                   \u{1F50A} Speel op Plex
                 </button>`:""}
          </div>
        </div>
      </div>

      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div>Tracks laden\u2026</div>
      </div>
    </div>`,document.getElementById("blib-back-to-grid")?.addEventListener("click",()=>{f=null,S(),q(E())}),document.getElementById("blib-back-to-artist")?.addEventListener("click",()=>{let r=f;S(),lt(r)}),document.getElementById("blib-play-all")?.addEventListener("click",()=>{t.ratingKey&&L(t.ratingKey,"music")}),document.getElementById("blib-play-plex")?.addEventListener("click",async()=>{if(t.ratingKey)try{await W("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ratingKey:t.ratingKey})})}catch(r){r.name!=="AbortError"&&$("Afspelen mislukt: "+r.message)}}),!t.ratingKey){let r=document.getElementById("blib-tracklist");r&&(r.innerHTML='<div class="blib-empty"><p>Geen ratingKey beschikbaar.</p></div>');return}try{let r=await y(`/api/plex/album/${encodeURIComponent(t.ratingKey)}/tracks`),d=document.getElementById("blib-tracklist");if(!d)return;let b=r.tracks||[];if(!b.length){d.innerHTML='<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';return}d.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+b.map((c,o)=>{let p=c.duration?Math.floor(c.duration/1e3):0,m=Math.floor(p/60),w=String(p%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${s(c.ratingKey||"")}"
            data-track-title="${s(c.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${o+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${s(c.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">${s(c.title||"Onbekend")}</div>
          <div class="blib-track-duration">${p?`${m}:${w}`:""}</div>
        </div>`}).join(""),d.addEventListener("click",c=>{let o=c.target.closest(".blib-track-play-btn"),p=(o?o.closest(".blib-track-row"):null)||c.target.closest(".blib-track-row");p?.dataset.trackKey&&L(p.dataset.trackKey,"music")})}catch{let d=document.getElementById("blib-tracklist");d&&(d.innerHTML='<div class="blib-empty"><p>Tracks laden mislukt.</p></div>')}}async function lt(t){H="artist",f=t;let e=E();if(!e)return;u&&(u.destroy(),u=null),e.scrollTop=0,C="";let i=document.getElementById("blib-search");i&&(i.value=""),e.innerHTML=`
    <div class="blib-artist-view">
      <div class="blib-artist-header">
        <button class="blib-back-btn" id="blib-artist-back">\u2190 Alle albums</button>
        <h2 class="blib-artist-title">Alle albums van ${s(t)}</h2>
      </div>
      <div id="blib-grid-wrap"></div>
    </div>`,document.getElementById("blib-artist-back")?.addEventListener("click",()=>{f=null,H="grid",S(),q(E())});let a=document.getElementById("blib-grid-wrap");a&&await G(a)}async function Ht(){let t=document.getElementById("sidebar-playlists");if(t){t.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let e=await y("/api/plex/playlists"),i=e.playlists||e||[];if(!i.length){t.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}t.innerHTML=i.map(a=>{let l=s(a.ratingKey||a.key||""),n=s(a.title||"Playlist"),r=a.leafCount||a.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${l}" data-playlist-title="${n}"
                aria-label="Afspeellijst ${n}">
        <svg class="sidebar-playlist-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <span class="sidebar-playlist-name">${n}</span>
        ${r?`<span class="sidebar-playlist-count">${r}</span>`:""}
      </button>`}).join(""),t.addEventListener("click",a=>{let l=a.target.closest(".sidebar-playlist-item");l&&(t.querySelectorAll(".sidebar-playlist-item").forEach(n=>n.classList.toggle("active",n===l)),yt(l.dataset.playlistKey,l.dataset.playlistTitle))})}catch(e){e.name!=="AbortError"&&(t.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}async function yt(t,e){H="playlist",U=t;let i=E();if(i){u&&(u.destroy(),u=null),i.scrollTop=0,i.innerHTML=`
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-playlist-back">\u2190 Bibliotheek</button>
      </div>
      <div class="blib-playlist-header">
        <div class="blib-playlist-cover">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </div>
        <div class="blib-detail-info">
          <div class="blib-detail-label">Afspeellijst</div>
          <h1 class="blib-detail-title">${s(e)}</h1>
          <div class="blib-detail-actions">
            <button class="blib-action-btn blib-action-primary" id="blib-playlist-play-all">
              \u25B6 Speel alles af
            </button>
          </div>
        </div>
      </div>
      <div class="blib-tracklist" id="blib-playlist-tracks">
        <div class="loading"><div class="spinner"></div>Laden\u2026</div>
      </div>
    </div>`,document.getElementById("blib-playlist-back")?.addEventListener("click",()=>{document.querySelectorAll(".sidebar-playlist-item").forEach(a=>a.classList.remove("active")),H="grid",U=null,q(E())});try{let a=await y(`/api/plex/playlists/${encodeURIComponent(t)}/tracks`),l=document.getElementById("blib-playlist-tracks");if(!l)return;let n=a.tracks||[];if(!n.length){l.innerHTML='<div class="blib-empty"><p>Geen nummers in deze afspeellijst.</p></div>';return}document.getElementById("blib-playlist-play-all")?.addEventListener("click",()=>{n[0]?.ratingKey&&L(n[0].ratingKey,"music")}),l.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+n.map((r,d)=>{let b=r.duration?Math.floor(r.duration/1e3):0,c=Math.floor(b/60),o=String(b%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${s(r.ratingKey||"")}"
            data-track-title="${s(r.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${d+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${s(r.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">
            <div>${s(r.title||"Onbekend")}</div>
            ${r.artist?`<div class="blib-track-artist">${s(r.artist)}</div>`:""}
          </div>
          <div class="blib-track-duration">${b?`${c}:${o}`:""}</div>
        </div>`}).join(""),l.addEventListener("click",r=>{let d=r.target.closest(".blib-track-play-btn"),b=(d?d.closest(".blib-track-row"):null)||r.target.closest(".blib-track-row");b?.dataset.trackKey&&L(b.dataset.trackKey,"music")})}catch{let l=document.getElementById("blib-playlist-tracks");l&&(l.innerHTML='<div class="blib-empty"><p>Laden mislukt.</p></div>')}}}async function Mt(){if(R)return R;try{let t=await y("/api/plex/artists");return t?(R=Array.isArray(t.artists)?t.artists:[],R):(console.warn("Artists response is null/undefined"),[])}catch(t){return t.name!=="AbortError"&&$("Artiesten laden mislukt: "+t.message),[]}}function Kt(t){let e=O.toLowerCase().trim();return e?t.filter(i=>(i.title||"").toLowerCase().includes(e)):t}function gt(t,e){let i=Kt(t);if(!i.length){e.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3A4}</div>
      <h3>Geen artiesten gevonden</h3>
      <p>${O?"Geen resultaten voor je zoekopdracht":"Geen artiesten in bibliotheek"}</p>
    </div>`;return}e.innerHTML=`<div class="blib-artists-container">
    ${i.map(a=>{let l=a.thumb?x(a.thumb,200):null,n=l?`<img src="${s(l)}" alt="${s(a.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",r=`<div class="blib-artist-ph" style="display:${l?"none":"flex"};background:${g(a.title)}">${k(a.title)}</div>`;return`<div class="blib-artist-card" data-artist-name="${s(a.title)}">
        <div class="blib-artist-photo">
          ${n}
          ${r}
        </div>
        <div class="blib-artist-name">${s(a.title)}</div>
      </div>`}).join("")}
  </div>`,e.addEventListener("click",a=>{let l=a.target.closest(".blib-artist-card");if(l){let n=l.dataset.artistName;n&&lt(n)}})}async function ht(t){u&&(u.destroy(),u=null),S(),t.innerHTML='<div class="loading"><div class="spinner"></div>Artiesten laden\u2026</div>';let e=await Mt();R=e,t.innerHTML='<div id="blib-artists-grid" class="blib-grid-wrap"></div>';let i=document.getElementById("blib-artists-grid");i&&gt(e,i)}async function Rt(){if(z)return z;try{let t=await y("/api/plex/tracks?limit=100");return t?(z=Array.isArray(t.tracks)?t.tracks:[],z):(console.warn("Tracks response is null/undefined"),[])}catch(t){return t.name!=="AbortError"&&$("Nummers laden mislukt: "+t.message),[]}}function zt(t){let e=N.toLowerCase().trim();return e?t.filter(i=>(i.title||"").toLowerCase().includes(e)||(i.artist||"").toLowerCase().includes(e)||(i.album||"").toLowerCase().includes(e)):t}function ft(t,e){let i=zt(t);if(!i.length){e.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3B5}</div>
      <h3>Geen nummers gevonden</h3>
      <p>${N?"Geen resultaten voor je zoekopdracht":"Geen nummers in bibliotheek"}</p>
    </div>`;return}e.innerHTML=`<div class="blib-track-header">
    <span class="blib-track-col-num">#</span>
    <span class="blib-track-col-title">Titel</span>
    <span class="blib-track-col-artist">Artiest</span>
    <span class="blib-track-col-album">Album</span>
    <span class="blib-track-col-dur">Duur</span>
  </div>`+i.map((a,l)=>{let n=a.duration?Math.floor(a.duration/1e3):0,r=Math.floor(n/60),d=String(n%60).padStart(2,"0");return`<div class="blib-track-row" data-track-key="${s(a.ratingKey||"")}">
      <div class="blib-track-num">
        <span class="blib-track-num-text">${l+1}</span>
        <button class="blib-track-play-btn" aria-label="Speel ${s(a.title||"")} af">\u25B6</button>
      </div>
      <div class="blib-track-title">${s(a.title||"Onbekend")}</div>
      <div class="blib-track-artist">${s(a.artist||"\u2014")}</div>
      <div class="blib-track-album">${s(a.album||"\u2014")}</div>
      <div class="blib-track-duration">${n?`${r}:${d}`:""}</div>
    </div>`}).join(""),e.addEventListener("click",a=>{let l=a.target.closest(".blib-track-play-btn"),n=(l?l.closest(".blib-track-row"):null)||a.target.closest(".blib-track-row");n?.dataset.trackKey&&L(n.dataset.trackKey,"music")})}async function Pt(t){u&&(u.destroy(),u=null),S(),t.innerHTML='<div class="loading"><div class="spinner"></div>Nummers laden\u2026</div>';let e=await Rt();z=e,t.innerHTML='<div id="blib-tracks-list" class="blib-grid-wrap"></div>';let i=document.getElementById("blib-tracks-list");i&&ft(e,i)}function Gt(t){let e=0;for(let n=0;n<t.length;n++)e=(e<<5)-e+t.charCodeAt(n),e=e&e;let i=Math.abs(e)%360,a=65+Math.abs(e)%20,l=50+Math.abs(e)%15;return`hsl(${i}, ${a}%, ${l}%)`}async function _t(){if(P)return P;try{let t=await y("/api/plex/genres");return t?(P=Array.isArray(t.genres)?t.genres:[],P):(console.warn("Genres response is null/undefined"),[])}catch(t){return t.name!=="AbortError"&&$("Genres laden mislukt: "+t.message),[]}}async function kt(t){u&&(u.destroy(),u=null),S(),t.innerHTML='<div class="loading"><div class="spinner"></div>Genres laden\u2026</div>';let e=await _t();if(P=e,!e.length){t.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3BC}</div>
      <h3>Geen genres gevonden</h3>
    </div>`;return}t.innerHTML=`<div class="blib-genres-grid">
    ${e.map(i=>{let a=Gt(i.genre),l=i.artistCount||0;return`<div class="blib-genre-card" data-genre="${s(i.genre)}" style="background: ${a}">
        <div class="blib-genre-name">${s(i.genre)}</div>
        <div class="blib-genre-count">${l} artiest${l!==1?"en":""}</div>
      </div>`}).join("")}
  </div>`,t.addEventListener("click",i=>{let a=i.target.closest(".blib-genre-card");if(a){let l=a.dataset.genre;$t(l,e)}})}async function $t(t,e){u&&(u.destroy(),u=null);let i=E();if(!i)return;I.push({view:"genres",data:{}}),i.scrollTop=0;let a=e.find(n=>n.genre===t);if(!a){i.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3BC}</div>
      <h3>Genre niet gevonden</h3>
    </div>`;return}let l=a.artists||[];i.innerHTML=`
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-genre-back">\u2190 Genres</button>
      </div>
      <div class="blib-genre-detail-header">
        <div class="blib-genre-detail-title">${s(t)}</div>
        <div class="blib-genre-detail-count">${l.length} artiest${l.length!==1?"en":""}</div>
      </div>
      <div class="blib-genre-artists-grid">
        ${l.map(n=>{let r=n.thumb?x(n.thumb,200):null,d=r?`<img src="${s(r)}" alt="${s(n.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",b=`<div class="blib-artist-ph" style="display:${r?"none":"flex"};background:${g(n.title)}">${k(n.title)}</div>`;return`<div class="blib-genre-artist-card" data-artist-rating-key="${s(n.ratingKey)}">
            <div class="blib-artist-photo">
              ${d}
              ${b}
            </div>
            <div class="blib-artist-name">${s(n.title)}</div>
          </div>`}).join("")}
      </div>
    </div>`,document.getElementById("blib-genre-back")?.addEventListener("click",()=>{I.pop(),kt(i)}),i.addEventListener("click",n=>{let r=n.target.closest(".blib-genre-artist-card");if(r){let d=r.dataset.artistRatingKey;d&&jt(d)}})}async function jt(t){u&&(u.destroy(),u=null);let e=E();if(e){I.push({view:"artist-detail",data:{ratingKey:t}}),e.scrollTop=0,e.innerHTML=`<div class="blib-detail-view">
    <div class="loading"><div class="spinner"></div>Artiest laden\u2026</div>
  </div>`;try{let i=await y(`/api/plex/artists/${encodeURIComponent(t)}`);if(!i.artist){e.innerHTML='<div class="blib-empty"><p>Artiest niet gevonden.</p></div>';return}let a=i.artist,l=tt(),n=[];try{let o=await y("/api/plex/tracks?limit=500");o.tracks&&(n=o.tracks.filter(p=>p.artist&&p.artist.toLowerCase()===a.title.toLowerCase()).slice(0,10))}catch{}let r=a.thumb?x(a.thumb,320):null,d=r?`<img src="${s(r)}" alt="${s(a.title)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="blib-artist-detail-ph" style="background:${g(a.title)};display:none;width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px">${k(a.title)}</div>`:`<div class="blib-artist-detail-ph" style="background:${g(a.title)};width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px">${k(a.title)}</div>`,c=(I.length>1?I[I.length-2]:null)?.view==="genre"?"\u2190 Genres":"\u2190 Artiesten";e.innerHTML=`
      <div class="blib-detail-view">
        <div class="blib-detail-topbar">
          <button class="blib-back-btn" id="blib-artist-detail-back">${c}</button>
        </div>

        <div class="blib-artist-detail-hero">
          <div class="blib-artist-detail-photo">${d}</div>
          <div class="blib-detail-info">
            <div class="blib-detail-label">Artiest</div>
            <h1 class="blib-detail-title">${s(a.title)}</h1>
            ${a.genres.length>0?`<div class="blib-detail-genres">
              ${a.genres.map(o=>`<span class="blib-genre-tag">${s(o)}</span>`).join("")}
            </div>`:""}
            <div class="blib-artist-stats">
              <div class="blib-stat-item">
                <span class="blib-stat-label">Albums</span>
                <span class="blib-stat-value">${K(a.albums.length)}</span>
              </div>
              <div class="blib-stat-item">
                <span class="blib-stat-label">Nummers</span>
                <span class="blib-stat-value">${K(a.totalTracks)}</span>
              </div>
            </div>
            <div class="blib-detail-actions">
              <button class="blib-action-btn blib-action-primary" id="blib-artist-play-all">
                \u25B6 Speel alles af
              </button>
              ${l?`<button class="blib-action-btn" id="blib-artist-play-plex" title="Speel op Plex: ${s(l)}">
                \u{1F50A} Speel op Plex
              </button>`:""}
              <button class="blib-action-btn" id="blib-artist-shuffle">
                \u{1F500} Shuffle
              </button>
            </div>
          </div>
        </div>

        <div class="blib-artist-sections">
          ${a.albums.length>0?`
            <div class="blib-section">
              <h2 class="blib-section-title">Albums (${K(a.albums.length)})</h2>
              <div class="blib-albums-grid">
                ${a.albums.map(o=>{let p=o.thumb?x(o.thumb,200):null,m=p?`<img src="${s(p)}" alt="${s(o.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",w=`<div class="blib-cover-ph" style="display:${p?"none":"flex"};background:${g(o.title)}">${k(o.title)}</div>`;return`<div class="blib-album-detail-card" data-album-rating-key="${s(o.ratingKey)}">
                    <div class="blib-album-detail-cover">
                      ${m}
                      ${w}
                    </div>
                    <div class="blib-album-detail-info">
                      <div class="blib-album-detail-title" title="${s(o.title)}">${s(o.title)}</div>
                      ${o.year?`<div class="blib-album-detail-year">${o.year}</div>`:""}
                      <div class="blib-album-detail-count">${o.trackCount} nummer${o.trackCount!==1?"s":""}</div>
                    </div>
                  </div>`}).join("")}
              </div>
            </div>
          `:""}

          ${n.length>0?`
            <div class="blib-section">
              <h2 class="blib-section-title">Populaire nummers</h2>
              <div class="blib-track-header">
                <span class="blib-track-col-num">#</span>
                <span class="blib-track-col-title">Titel</span>
                <span class="blib-track-col-album">Album</span>
                <span class="blib-track-col-dur">Duur</span>
              </div>
              ${n.map((o,p)=>{let m=o.duration?Math.floor(o.duration/1e3):0,w=Math.floor(m/60),T=String(m%60).padStart(2,"0");return`<div class="blib-track-row" data-track-key="${s(o.ratingKey||"")}">
                  <div class="blib-track-num">
                    <span class="blib-track-num-text">${p+1}</span>
                    <button class="blib-track-play-btn" aria-label="Speel ${s(o.title||"")} af">\u25B6</button>
                  </div>
                  <div class="blib-track-title">${s(o.title||"Onbekend")}</div>
                  <div class="blib-track-album">${s(o.album||"\u2014")}</div>
                  <div class="blib-track-duration">${m?w+":"+T:""}</div>
                </div>`}).join("")}
            </div>
          `:""}
        </div>
      </div>`,document.getElementById("blib-artist-detail-back")?.addEventListener("click",()=>{I.pop();let o=I[I.length-1];o?.view==="genre"?$t(o.data.genre,P):ht(e)}),document.getElementById("blib-artist-play-all")?.addEventListener("click",()=>{a.albums[0]?.ratingKey&&L(a.albums[0].ratingKey,"music")}),document.getElementById("blib-artist-play-plex")?.addEventListener("click",async()=>{if(a.albums[0]?.ratingKey)try{await W("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ratingKey:a.albums[0].ratingKey})})}catch(o){o.name!=="AbortError"&&$("Afspelen mislukt: "+o.message)}}),document.getElementById("blib-artist-shuffle")?.addEventListener("click",()=>{if(a.albums.length>0){let o=a.albums[Math.floor(Math.random()*a.albums.length)];L(o.ratingKey,"music")}}),e.addEventListener("click",o=>{let p=o.target.closest(".blib-album-detail-card");if(p){let T=p.dataset.albumRatingKey;T&&mt({ratingKey:T,album:"",artist:a.title,thumb:""})}let m=o.target.closest(".blib-track-play-btn");if(m){o.stopPropagation();let T=m.closest(".blib-track-row");T?.dataset.trackKey&&L(T.dataset.trackKey,"music")}let w=o.target.closest(".blib-track-row");w?.dataset.trackKey&&!o.target.closest(".blib-track-play-btn")&&L(w.dataset.trackKey,"music")})}catch(i){i.name!=="AbortError"&&(e.innerHTML=`<div class="blib-empty"><p>Laden mislukt: ${s(i.message)}</p></div>`)}}}async function Dt(){if(D)return D;try{return D=(await y("/api/plex/playlists")).playlists||[],D}catch(t){return t.name!=="AbortError"&&$("Playlists laden mislukt: "+t.message),[]}}async function Ft(t){u&&(u.destroy(),u=null),S(),t.innerHTML='<div class="loading"><div class="spinner"></div>Playlists laden\u2026</div>';let e=await Dt();if(D=e,!e.length){t.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F399}\uFE0F</div>
      <h3>Geen playlists gevonden</h3>
    </div>`;return}t.innerHTML=`<div class="blib-playlists-grid">
    ${e.map(i=>{let a=i.thumb?x(i.thumb,200):null,l=i.leafCount||i.trackCount||0,n=a?`<img src="${s(a)}" alt="${s(i.title||"Playlist")}" loading="lazy" decoding="async">`:`<div class="blib-playlist-ph" style="background:${g(i.title||"Playlist")}">\u{1F399}\uFE0F</div>`;return`<div class="blib-playlist-card" data-playlist-key="${s(i.ratingKey||i.key||"")}">
        <div class="blib-playlist-cover">${n}</div>
        <div class="blib-playlist-info">
          <div class="blib-playlist-title">${s(i.title||"Playlist")}</div>
          <div class="blib-playlist-count">${l} numm${l!==1?"ers":"er"}</div>
        </div>
      </div>`}).join("")}
  </div>`,t.addEventListener("click",i=>{let a=i.target.closest(".blib-playlist-card");if(a){let l=a.dataset.playlistKey,n=a.querySelector(".blib-playlist-title")?.textContent||"Playlist";l&&yt(l,n)}})}function fe(t,e){return""}function ke(t){let e=t.target.closest(".blib-play-btn");if(e){t.stopPropagation();let n=e.closest(".blib-album");return n?.dataset.ratingKey&&L(n.dataset.ratingKey,"music"),!0}let i=t.target.closest(".blib-track-play-btn");if(i){t.stopPropagation();let n=i.closest(".blib-track-row");return n?.dataset.trackKey&&L(n.dataset.trackKey,"music"),!0}let a=t.target.closest(".blib-artist-filter-btn");if(a){t.stopPropagation();let n=a.dataset.artistFilter;return n&&lt(n),!0}let l=t.target.closest(".blib-album");return l?.dataset.ratingKey?(mt({ratingKey:l.dataset.ratingKey,album:l.dataset.album,artist:l.dataset.artist,thumb:l.dataset.thumb}),!0):!!(t.target.closest("#blib-back-to-grid")||t.target.closest("#blib-artist-back")||t.target.closest("#blib-playlist-back")||t.target.closest("#blib-back-to-artist"))}async function $e(){try{if(await pt(),H==="grid"){let t=document.getElementById("blib-grid-wrap");t&&G(t)}}catch(t){t.name!=="AbortError"&&$(t.message)}}async function Zt(){dt(),H="grid",f=null,at=null,U=null,vt(),S(),Ht().catch(()=>{});let t=E();if(t){t.scrollTop=0,t.innerHTML=`<div class="loading" role="status">
    <div class="spinner" aria-hidden="true"></div>Bibliotheek laden\u2026
  </div>`;try{A==="albums"?(await pt(),await q(t)):await V(A)}catch(e){e.name!=="AbortError"&&$(e.message)}}}async function we(t){if(B.bibSubTab=t,t==="collectie")await Zt();else if(t==="lijst"){let e=E();if(e){B.sectionContainerEl=e;try{await ct()}finally{B.sectionContainerEl===e&&(B.sectionContainerEl=null)}}}}async function Ee(t){_();let e=B.tabAbort?.signal;try{let i=`topartists:${t}`,a=F(i,300*1e3);if(!a){if(a=await y(`/api/topartists?period=${t}`,{signal:e}),e?.aborted)return;Z(i,a)}let l=a.topartists?.artist||[];if(!l.length){M('<div class="empty">Geen data.</div>');return}let n=parseInt(l[0]?.playcount||1),r=`<div class="section-title">Top artiesten \xB7 ${Y(t)}</div><div class="artist-grid">`;for(let b=0;b<l.length;b++){let c=l[b],o=Math.round(parseInt(c.playcount)/n*100),p=J(c.image,"large")||J(c.image),m=x(p,120)||p,w=m?`<img src="${m}" alt="${s(c.name)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${g(c.name,!0)}">${k(c.name)}</div>`:`<div class="ag-photo-ph" style="background:${g(c.name,!0)}">${k(c.name)}</div>`;r+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${b}" style="view-transition-name: artist-${nt(c.name)}">${w}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${s(c.name)}">${s(c.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${o}%"></div></div>
          <div class="ag-plays">${K(c.playcount)} plays</div>
        </div></div>`}M(r+"</div>");let d=l.map((b,c)=>y(`/api/artist/${encodeURIComponent(b.name)}/info`).then(o=>{if(o.image){let p=document.getElementById(`agp-${c}`);p&&(p.innerHTML=`<img src="${x(o.image,120)||o.image}" alt="${s(b.name)}" loading="lazy" decoding="async" onerror="this.style.display='none'">`)}return!0}).catch(()=>!0));Promise.allSettled(d)}catch(i){if(i.name==="AbortError")return;$(i.message)}}async function xe(t){_();let e=B.tabAbort?.signal;try{let i=`toptracks:${t}`,a=F(i,300*1e3);if(!a){if(a=await y(`/api/toptracks?period=${t}`,{signal:e}),e?.aborted)return;Z(i,a)}let l=a.toptracks?.track||[];if(!l.length){M('<div class="empty">Geen data.</div>');return}let n=parseInt(l[0]?.playcount||1),r=`<div class="section-title">Top nummers \xB7 ${Y(t)}</div><div class="card-list">`;for(let d of l){let b=Math.round(parseInt(d.playcount)/n*100);r+=`<div class="card">${Q(d.image)}<div class="card-info">
        <div class="card-title">${s(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${s(d.artist?.name||"")}">${s(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${b}%"></div></div>
        </div><div class="card-meta">${K(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${s(d.artist?.name||"")}" data-track="${s(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}M(r+"</div>")}catch(i){if(i.name==="AbortError")return;$(i.message)}}async function Le(){_();let t=B.tabAbort?.signal;try{let e=F("loved",6e5);if(!e){if(e=await y("/api/loved",{signal:t}),t?.aborted)return;Z("loved",e)}let i=e.lovedtracks?.track||[];if(!i.length){M('<div class="empty">Geen geliefde nummers.</div>');return}let a='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let l of i){let n=l.date?.uts?st(parseInt(l.date.uts)):"";a+=`<div class="card">${Q(l.image)}<div class="card-info">
        <div class="card-title">${s(l.name)}</div>
        <div class="card-sub artist-link" data-artist="${s(l.artist?.name||"")}">${s(l.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${s(l.artist?.name||"")}" data-track="${s(l.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}M(a+"</div>")}catch(e){if(e.name==="AbortError")return;$(e.message)}}async function Te(){_("Statistieken ophalen...");let t=B.tabAbort?.signal;try{let e=F("stats",6e5);if(!e){if(e=await y("/api/stats",{signal:t}),t?.aborted)return;Z("stats",e)}M(`
      <div class="stats-grid">
        <div class="stats-card full">
          <div class="stats-card-title">Scrobbles afgelopen 7 dagen</div>
          <div class="chart-wrap"><canvas id="chart-daily"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Top artiesten deze maand</div>
          <div class="chart-wrap" style="max-height:320px"><canvas id="chart-top"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Genre verdeling</div>
          <div class="chart-wrap"><canvas id="chart-genres"></canvas></div>
        </div>
      </div>`,()=>Nt(e))}catch(e){if(e.name==="AbortError")return;$(e.message)}}function Nt(t){if(typeof Chart>"u")return;let e=!window.matchMedia("(prefers-color-scheme: light)").matches,i=e?"#2c2c2c":"#ddd",a=e?"#888":"#777",l=e?"#efefef":"#111";Chart.defaults.color=a,Chart.defaults.borderColor=i;let n=document.getElementById("chart-daily");n&&new Chart(n,{type:"bar",data:{labels:t.dailyScrobbles.map(b=>new Date(b.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:t.dailyScrobbles.map(b=>b.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:b=>`${b.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:a}},y:{grid:{color:i},ticks:{color:a},beginAtZero:!0}}}});let r=document.getElementById("chart-top");r&&t.topArtists?.length&&new Chart(r,{type:"bar",data:{labels:t.topArtists.map(b=>b.name),datasets:[{data:t.topArtists.map(b=>b.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:b=>`${b.raw} plays`}}},scales:{x:{grid:{color:i},ticks:{color:a},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:l,font:{size:11}}}}}});let d=document.getElementById("chart-genres");if(d&&t.genres?.length){let b=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(d,{type:"doughnut",data:{labels:t.genres.map(c=>c.name),datasets:[{data:t.genres.map(c=>c.count),backgroundColor:b.slice(0,t.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:a,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function Ot(t){try{_(t);let e=document.getElementById("view-toolbar");e&&(e.innerHTML=`<div class="blib-tab-bar" id="blib-tab-bar">
        ${"Albums,Artiesten,Nummers,Genres,Playlists,Recent".split(",").map((i,a)=>{let n=["albums","artists","tracks","genres","playlists","recent"][a];return`<button class="blib-tab-btn${A===n?" active":""}" data-tab="${n}">${i.trim()}</button>`}).join("")}
      </div>`,e.addEventListener("click",i=>{let a=i.target.closest(".blib-tab-btn");a&&V(a.dataset.tab)})),t.innerHTML="",await et(t)}catch(e){console.error("Fout bij laden recent tracks:",e),$("Fout bij laden van recente nummers",t)}}export{fe as buildPlexLibraryHtml,ke as handlePlexLibraryClick,Zt as loadBibliotheek,Le as loadLoved,$e as loadPlexLibrary,Ht as loadSidebarPlaylists,Te as loadStats,Ee as loadTopArtists,xe as loadTopTracks,yt as openSidebarPlaylist,Nt as renderStatsCharts,we as switchBibSubTab};
