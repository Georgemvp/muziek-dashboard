import{d as dt}from"./chunk-5KR35WTL.js";import{i as X,n as x}from"./chunk-AVXKTVQZ.js";import{p as bt}from"./chunk-F6KLCAYJ.js";import{A as O,B as F,E as m,G as ot,a as p,b as U,e as L,f as W,g as k,h as K,i as l,j as Y,k as st,l as y,m as lt,n as nt,p as rt,q as ct,t as J,u as Q,v as T,w as $,x as z}from"./chunk-SOIVDCO5.js";var j=null,B="artist",I="",h="grid",f=null,H="grid",it=null,u=null,V=null,w=localStorage.getItem("blibCurrentTab")||"albums",P=null,R=null,G=null,D=null,Z="",N="",C=[],Et=210,xt=62,ut=3;function E(){return document.getElementById("content")}function vt(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}async function pt(){if(j)return j;try{let t=await m("/api/plex/library/all");return!t||!t.library?[]:t.library.length?(j=t.library.map(([i,e,a,s])=>({artist:i,album:e,ratingKey:a,thumb:s})),j):[]}catch(t){return console.error("Fout bij laden bibliotheek:",t),[]}}function Lt(){let t=j||[];f&&(t=t.filter(e=>e.artist===f));let i=I.toLowerCase().trim();return i&&(t=t.filter(e=>e.artist.toLowerCase().includes(i)||e.album.toLowerCase().includes(i))),B==="artist"?t=[...t].sort((e,a)=>e.artist.localeCompare(a.artist,"nl",{sensitivity:"base"})||e.album.localeCompare(a.album,"nl",{sensitivity:"base"})):B==="album"?t=[...t].sort((e,a)=>e.album.localeCompare(a.album,"nl",{sensitivity:"base"})):B==="recent"&&(t=[...t].reverse()),t}function Tt(t){let i=new Map;for(let e of t){let a=(e.artist[0]||"#").toUpperCase(),s=/[A-Z]/.test(a)?a:"#";i.has(s)||i.set(s,[]),i.get(s).push(e)}return i}function St(t){let i=t.thumb?L(t.thumb,240):null,e=i?`<img src="${l(i)}" alt="${l(t.album)} by ${l(t.artist)}" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${y(t.album)}">${k(t.album)}</div>`:`<div class="blib-cover-ph" style="background:${y(t.album)}">${k(t.album)}</div>`;return h==="list"?`<div class="blib-album blib-album-list"
      data-rating-key="${l(t.ratingKey)}"
      data-album="${l(t.album)}"
      data-artist="${l(t.artist)}"
      data-thumb="${l(t.thumb||"")}">
      <div class="blib-cover blib-cover-sm">${e}</div>
      <div class="blib-list-info">
        <div class="blib-album-title" title="${l(t.album)}">${l(t.album)}</div>
        <button class="blib-artist-filter-btn" data-artist-filter="${l(t.artist)}">${l(t.artist)}</button>
      </div>
      <button class="blib-play-btn" title="Afspelen">\u25B6</button>
    </div>`:`<div class="blib-album"
    data-rating-key="${l(t.ratingKey)}"
    data-album="${l(t.album)}"
    data-artist="${l(t.artist)}"
    data-thumb="${l(t.thumb||"")}">
    <div class="blib-cover">
      ${e}
      <div class="blib-play-overlay"><button class="blib-play-btn" title="Afspelen">\u25B6</button></div>
    </div>
    <div class="blib-album-title" title="${l(t.album)}">${l(t.album)}</div>
    <button class="blib-artist-filter-btn" data-artist-filter="${l(t.artist)}">${l(t.artist)}</button>
  </div>`}var tt=class{constructor(i,e){this.container=i,this.items=e,this.cols=h==="list"?1:vt(),this.rowH=h==="list"?xt:Et,this.lastStart=-1,this.lastEnd=-1;let a=B==="artist"&&!I&&!f&&h==="grid";this.groups=a?Tt(e):null,this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=E()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let i=[],e=0;if(this.groups)for(let[a,s]of this.groups){i.push({type:"header",letter:a,height:56,offset:e}),e+=56;for(let n=0;n<s.length;n+=this.cols)i.push({type:"items",items:s.slice(n,n+this.cols),height:this.rowH,offset:e}),e+=this.rowH}else for(let a=0;a<this.items.length;a+=this.cols)i.push({type:"items",items:this.items.slice(a,a+this.cols),height:this.rowH,offset:e}),e+=this.rowH;return this.totalHeight=e,i}_createDOM(){this.container.innerHTML=`<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".blib-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let i=h==="list"?1:vt();if(i!==this.cols){this.cols=i,this.flatRows=this._buildFlatRows();let e=this.container.querySelector(".blib-virtual-container");e&&(e.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let i=this._getScrollTop(),e=this._getViewHeight(),a=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),s=i-a,n=ut*this.rowH,r=0,d=this.flatRows.length-1;for(let o=0;o<this.flatRows.length;o++){let c=this.flatRows[o];if(c.offset+c.height>=s-n){r=Math.max(0,o-ut);break}}for(let o=r;o<this.flatRows.length;o++)if(this.flatRows[o].offset>s+e+n){d=o;break}if(r===this.lastStart&&d===this.lastEnd)return;this.lastStart=r,this.lastEnd=d;let b="";for(let o=r;o<=d&&o<this.flatRows.length;o++){let c=this.flatRows[o];if(c.type==="header")b+=`<div class="blib-letter-header" style="height:${c.height}px">${l(c.letter)}</div>`;else{b+=`<div class="${h==="list"?"blib-list-rows":"blib-grid"}">`;for(let g of c.items)b+=St(g);b+="</div>"}}this.winEl.style.top=(this.flatRows[r]?.offset||0)+"px",this.winEl.innerHTML=b}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(i){for(let e of this.flatRows)if(e.type==="header"&&e.letter===i){let a=this._scrollEl;if(a!==window)a.scrollTop=e.offset;else{let s=this.container.getBoundingClientRect().top+window.scrollY+e.offset-120;window.scrollTo({top:s,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(i=>i.type==="header").map(i=>i.letter))}};function At(t){let i=document.getElementById("blib-az-rail");if(!i)return;let e=t.getAvailableLetters();i.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(a=>`<button class="blib-az-btn${e.has(a)?"":" disabled"}" data-letter="${a}">${a}</button>`).join(""),i.addEventListener("click",a=>{let s=a.target.closest(".blib-az-btn");s&&!s.classList.contains("disabled")&&t.scrollToLetter(s.dataset.letter)})}function Ct(t){let i=document.getElementById("blib-count");i&&(i.textContent=`${K(t)} albums`)}async function _(t){u&&(u.destroy(),u=null);let i=Lt();if(Ct(i.length),!i.length){t.innerHTML=`
      <div class="blib-empty">
        <div class="blib-empty-icon">\u{1F3B5}</div>
        <h3>Geen albums gevonden</h3>
        <p>${I?`Geen resultaten voor "<strong>${l(I)}</strong>"`:f?`Geen albums van <strong>${l(f)}</strong> in bibliotheek.`:"Plex bibliotheek is leeg of nog niet gesynchroniseerd."}</p>
      </div>`;return}if(u=new tt(t,i),B==="artist"&&!I&&!f&&h==="grid")At(u);else{let e=document.getElementById("blib-az-rail");e&&(e.innerHTML="")}}function mt(){A()}async function et(t){if(w===t)return;w=t,localStorage.setItem("blibCurrentTab",t),I="",Z="",N="",mt();let i=E();if(i)switch(i.scrollTop=0,t){case"albums":A(),await q(i);break;case"artists":await ft(i);break;case"tracks":await Rt(i);break;case"genres":await $t(i);break;case"playlists":await Dt(i);break}}function A(){let t=document.getElementById("view-toolbar");if(!t)return;let i=["Albums","Artiesten","Nummers","Genres","Playlists"],e=["albums","artists","tracks","genres","playlists"],a=`<div class="blib-tab-bar" id="blib-tab-bar">
    ${i.map((n,r)=>{let d=e[r];return`<button class="blib-tab-btn${w===d?" active":""}" data-tab="${d}">${n}</button>`}).join("")}
  </div>`,s="";w==="albums"?s=`
      <div class="blib-toolbar">
        <input class="blib-search" id="blib-search" type="text"
          placeholder="\u{1F50D} Zoek artiest of album\u2026" autocomplete="off"
          value="${l(I)}">

        <div class="blib-toolbar-sep"></div>

        <div class="blib-view-toggle" role="group" aria-label="Weergavemodus">
          <button class="blib-pill${h==="grid"?" active":""}" id="blib-btn-grid"
                  title="Grid weergave" aria-pressed="${h==="grid"}">\u229E</button>
          <button class="blib-pill${h==="list"?" active":""}" id="blib-btn-list"
                  title="Lijst weergave" aria-pressed="${h==="list"}">\u2630</button>
        </div>

        <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
          <option value="artist"${B==="artist"?" selected":""}>Artiest A\u2013Z</option>
          <option value="album"${B==="album"?" selected":""}>Album A\u2013Z</option>
          <option value="recent"${B==="recent"?" selected":""}>Recent toegevoegd</option>
        </select>

        <span class="blib-count" id="blib-count"></span>

        <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
      </div>
      <div class="blib-az-rail" id="blib-az-rail"></div>`:s=`
      <div class="blib-toolbar">
        <input class="blib-search" id="${w==="artists"?"blib-artist-search":w==="tracks"?"blib-track-search":"blib-search"}" type="text"
          placeholder="${w==="artists"?"\u{1F50D} Zoek artiest\u2026":w==="tracks"?"\u{1F50D} Zoek nummer\u2026":"\u{1F50D} Zoeken\u2026"}" autocomplete="off"
          value="${l(w==="artists"?N:w==="tracks"?Z:"")}">
        <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
      </div>`,t.innerHTML=a+s,document.querySelectorAll("#blib-tab-bar .blib-tab-btn").forEach(n=>{n.addEventListener("click",()=>{let r=n.dataset.tab;et(r)})}),Bt()}function Bt(){let t=()=>E();document.getElementById("blib-search")?.addEventListener("input",i=>{if(I=i.target.value,f&&(f=null,H="grid"),t()){let a=document.getElementById("blib-grid-wrap");a&&_(a)}}),document.getElementById("blib-artist-search")?.addEventListener("input",i=>{N=i.target.value;let e=document.getElementById("blib-artists-grid");e&&ht(P||[],e)}),document.getElementById("blib-track-search")?.addEventListener("input",i=>{Z=i.target.value;let e=document.getElementById("blib-tracks-list");e&&kt(R||[],e)}),document.getElementById("blib-btn-grid")?.addEventListener("click",()=>{if(h==="grid")return;h="grid",document.getElementById("blib-btn-grid")?.classList.add("active"),document.getElementById("blib-btn-list")?.classList.remove("active");let i=document.getElementById("blib-grid-wrap");i&&_(i)}),document.getElementById("blib-btn-list")?.addEventListener("click",()=>{if(h==="list")return;h="list",document.getElementById("blib-btn-list")?.classList.add("active"),document.getElementById("blib-btn-grid")?.classList.remove("active");let i=document.getElementById("blib-grid-wrap");i&&_(i)}),document.getElementById("blib-sort-select")?.addEventListener("change",i=>{B=i.target.value;let e=document.getElementById("blib-grid-wrap");e&&_(e)}),document.getElementById("btn-sync-plex-blib")?.addEventListener("click",async()=>{let i=document.getElementById("btn-sync-plex-blib");if(!i)return;let e=i.textContent;i.disabled=!0,i.textContent="\u21BB Bezig\u2026";try{try{await U("/api/plex/refresh",{method:"POST"})}catch(a){if(a.name!=="AbortError")throw a}await ot(),j=null,P=null,R=null,G=null,D=null,await et(w)}catch{}finally{i.disabled=!1,i.textContent=e}})}async function q(t){if(!t)return;H="grid",it=null,V=null,t.scrollTop=0,t.innerHTML='<div id="blib-grid-wrap"></div>';let i=document.getElementById("blib-grid-wrap");await _(i)}async function gt(t){H="detail",it=t;let i=E();if(!i)return;u&&(u.destroy(),u=null),i.scrollTop=0;let e=t.thumb?L(t.thumb,320):null,a=e?`<img src="${l(e)}" alt="${l(t.album)} by ${l(t.artist)}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${y(t.album)}">${k(t.album)}</div>`:`<div class="blib-detail-cover-ph" style="background:${y(t.album)}">${k(t.album)}</div>`,s=X(),n=f?`<button class="blib-back-btn blib-back-artist" id="blib-back-to-artist">
         \u2190 ${l(f)}
       </button>`:"";if(i.innerHTML=`
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-back-to-grid">\u2190 Alle albums</button>
        ${n}
      </div>

      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${a}</div>
        <div class="blib-detail-info">
          <div class="blib-detail-label">Album</div>
          <h1 class="blib-detail-title">${l(t.album)}</h1>
          <div class="blib-detail-artist-wrap">
            <button class="blib-artist-filter-btn blib-detail-artist-btn"
                    data-artist-filter="${l(t.artist)}">${l(t.artist)}</button>
          </div>
          <div class="blib-detail-actions">
            <button class="blib-action-btn blib-action-primary" id="blib-play-all">
              \u25B6 Speel album af
            </button>
            ${s?`<button class="blib-action-btn" id="blib-play-plex" title="Speel op Plex: ${l(s)}">
                   \u{1F50A} Speel op Plex
                 </button>`:""}
          </div>
        </div>
      </div>

      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div>Tracks laden\u2026</div>
      </div>
    </div>`,document.getElementById("blib-back-to-grid")?.addEventListener("click",()=>{f=null,A(),q(E())}),document.getElementById("blib-back-to-artist")?.addEventListener("click",()=>{let r=f;A(),at(r)}),document.getElementById("blib-play-all")?.addEventListener("click",()=>{t.ratingKey&&x(t.ratingKey,"music")}),document.getElementById("blib-play-plex")?.addEventListener("click",async()=>{if(t.ratingKey)try{await U("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ratingKey:t.ratingKey})})}catch(r){r.name!=="AbortError"&&$("Afspelen mislukt: "+r.message)}}),!t.ratingKey){let r=document.getElementById("blib-tracklist");r&&(r.innerHTML='<div class="blib-empty"><p>Geen ratingKey beschikbaar.</p></div>');return}try{let r=await m(`/api/plex/album/${encodeURIComponent(t.ratingKey)}/tracks`),d=document.getElementById("blib-tracklist");if(!d)return;let b=r.tracks||[];if(!b.length){d.innerHTML='<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';return}d.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+b.map((o,c)=>{let v=o.duration?Math.floor(o.duration/1e3):0,g=Math.floor(v/60),S=String(v%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${l(o.ratingKey||"")}"
            data-track-title="${l(o.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${c+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${l(o.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">${l(o.title||"Onbekend")}</div>
          <div class="blib-track-duration">${v?`${g}:${S}`:""}</div>
        </div>`}).join(""),d.addEventListener("click",o=>{let c=o.target.closest(".blib-track-play-btn"),v=(c?c.closest(".blib-track-row"):null)||o.target.closest(".blib-track-row");v?.dataset.trackKey&&x(v.dataset.trackKey,"music")})}catch{let d=document.getElementById("blib-tracklist");d&&(d.innerHTML='<div class="blib-empty"><p>Tracks laden mislukt.</p></div>')}}async function at(t){H="artist",f=t;let i=E();if(!i)return;u&&(u.destroy(),u=null),i.scrollTop=0,I="";let e=document.getElementById("blib-search");e&&(e.value=""),i.innerHTML=`
    <div class="blib-artist-view">
      <div class="blib-artist-header">
        <button class="blib-back-btn" id="blib-artist-back">\u2190 Alle albums</button>
        <h2 class="blib-artist-title">Alle albums van ${l(t)}</h2>
      </div>
      <div id="blib-grid-wrap"></div>
    </div>`,document.getElementById("blib-artist-back")?.addEventListener("click",()=>{f=null,H="grid",A(),q(E())});let a=document.getElementById("blib-grid-wrap");a&&await _(a)}async function It(){let t=document.getElementById("sidebar-playlists");if(t){t.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let i=await m("/api/plex/playlists"),e=i.playlists||i||[];if(!e.length){t.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}t.innerHTML=e.map(a=>{let s=l(a.ratingKey||a.key||""),n=l(a.title||"Playlist"),r=a.leafCount||a.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${s}" data-playlist-title="${n}"
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
      </button>`}).join(""),t.addEventListener("click",a=>{let s=a.target.closest(".sidebar-playlist-item");s&&(t.querySelectorAll(".sidebar-playlist-item").forEach(n=>n.classList.toggle("active",n===s)),yt(s.dataset.playlistKey,s.dataset.playlistTitle))})}catch(i){i.name!=="AbortError"&&(t.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}async function yt(t,i){H="playlist",V=t;let e=E();if(e){u&&(u.destroy(),u=null),e.scrollTop=0,e.innerHTML=`
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
          <h1 class="blib-detail-title">${l(i)}</h1>
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
    </div>`,document.getElementById("blib-playlist-back")?.addEventListener("click",()=>{document.querySelectorAll(".sidebar-playlist-item").forEach(a=>a.classList.remove("active")),H="grid",V=null,q(E())});try{let a=await m(`/api/plex/playlists/${encodeURIComponent(t)}/tracks`),s=document.getElementById("blib-playlist-tracks");if(!s)return;let n=a.tracks||[];if(!n.length){s.innerHTML='<div class="blib-empty"><p>Geen nummers in deze afspeellijst.</p></div>';return}document.getElementById("blib-playlist-play-all")?.addEventListener("click",()=>{n[0]?.ratingKey&&x(n[0].ratingKey,"music")}),s.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+n.map((r,d)=>{let b=r.duration?Math.floor(r.duration/1e3):0,o=Math.floor(b/60),c=String(b%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${l(r.ratingKey||"")}"
            data-track-title="${l(r.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${d+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${l(r.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">
            <div>${l(r.title||"Onbekend")}</div>
            ${r.artist?`<div class="blib-track-artist">${l(r.artist)}</div>`:""}
          </div>
          <div class="blib-track-duration">${b?`${o}:${c}`:""}</div>
        </div>`}).join(""),s.addEventListener("click",r=>{let d=r.target.closest(".blib-track-play-btn"),b=(d?d.closest(".blib-track-row"):null)||r.target.closest(".blib-track-row");b?.dataset.trackKey&&x(b.dataset.trackKey,"music")})}catch{let s=document.getElementById("blib-playlist-tracks");s&&(s.innerHTML='<div class="blib-empty"><p>Laden mislukt.</p></div>')}}}async function Ht(){if(P)return P;try{return P=(await m("/api/plex/artists")).artists||[],P}catch(t){return t.name!=="AbortError"&&$("Artiesten laden mislukt: "+t.message),[]}}function Mt(t){let i=N.toLowerCase().trim();return i?t.filter(e=>(e.name||"").toLowerCase().includes(i)):t}function ht(t,i){let e=Mt(t);if(!e.length){i.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3A4}</div>
      <h3>Geen artiesten gevonden</h3>
      <p>${N?"Geen resultaten voor je zoekopdracht":"Geen artiesten in bibliotheek"}</p>
    </div>`;return}i.innerHTML=`<div class="blib-artists-container">
    ${e.map(a=>{let s=a.thumb?L(a.thumb,200):null,n=s?`<img src="${l(s)}" alt="${l(a.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",r=`<div class="blib-artist-ph" style="display:${s?"none":"flex"};background:${y(a.name)}">${k(a.name)}</div>`;return`<div class="blib-artist-card" data-artist-name="${l(a.name)}">
        <div class="blib-artist-photo">
          ${n}
          ${r}
        </div>
        <div class="blib-artist-name">${l(a.name)}</div>
      </div>`}).join("")}
  </div>`,i.addEventListener("click",a=>{let s=a.target.closest(".blib-artist-card");if(s){let n=s.dataset.artistName;n&&at(n)}})}async function ft(t){u&&(u.destroy(),u=null),A(),t.innerHTML='<div class="loading"><div class="spinner"></div>Artiesten laden\u2026</div>';let i=await Ht();P=i,t.innerHTML='<div id="blib-artists-grid" class="blib-grid-wrap"></div>';let e=document.getElementById("blib-artists-grid");e&&ht(i,e)}async function Kt(){if(R)return R;try{return R=(await m("/api/plex/tracks?limit=100")).tracks||[],R}catch(t){return t.name!=="AbortError"&&$("Nummers laden mislukt: "+t.message),[]}}function Pt(t){let i=Z.toLowerCase().trim();return i?t.filter(e=>(e.title||"").toLowerCase().includes(i)||(e.artist||"").toLowerCase().includes(i)||(e.album||"").toLowerCase().includes(i)):t}function kt(t,i){let e=Pt(t);if(!e.length){i.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3B5}</div>
      <h3>Geen nummers gevonden</h3>
      <p>${Z?"Geen resultaten voor je zoekopdracht":"Geen nummers in bibliotheek"}</p>
    </div>`;return}i.innerHTML=`<div class="blib-track-header">
    <span class="blib-track-col-num">#</span>
    <span class="blib-track-col-title">Titel</span>
    <span class="blib-track-col-artist">Artiest</span>
    <span class="blib-track-col-album">Album</span>
    <span class="blib-track-col-dur">Duur</span>
  </div>`+e.map((a,s)=>{let n=a.duration?Math.floor(a.duration/1e3):0,r=Math.floor(n/60),d=String(n%60).padStart(2,"0");return`<div class="blib-track-row" data-track-key="${l(a.ratingKey||"")}">
      <div class="blib-track-num">
        <span class="blib-track-num-text">${s+1}</span>
        <button class="blib-track-play-btn" aria-label="Speel ${l(a.title||"")} af">\u25B6</button>
      </div>
      <div class="blib-track-title">${l(a.title||"Onbekend")}</div>
      <div class="blib-track-artist">${l(a.artist||"\u2014")}</div>
      <div class="blib-track-album">${l(a.album||"\u2014")}</div>
      <div class="blib-track-duration">${n?`${r}:${d}`:""}</div>
    </div>`}).join(""),i.addEventListener("click",a=>{let s=a.target.closest(".blib-track-play-btn"),n=(s?s.closest(".blib-track-row"):null)||a.target.closest(".blib-track-row");n?.dataset.trackKey&&x(n.dataset.trackKey,"music")})}async function Rt(t){u&&(u.destroy(),u=null),A(),t.innerHTML='<div class="loading"><div class="spinner"></div>Nummers laden\u2026</div>';let i=await Kt();R=i,t.innerHTML='<div id="blib-tracks-list" class="blib-grid-wrap"></div>';let e=document.getElementById("blib-tracks-list");e&&kt(i,e)}function Gt(t){let i=0;for(let n=0;n<t.length;n++)i=(i<<5)-i+t.charCodeAt(n),i=i&i;let e=Math.abs(i)%360,a=65+Math.abs(i)%20,s=50+Math.abs(i)%15;return`hsl(${e}, ${a}%, ${s}%)`}async function _t(){if(G)return G;try{return G=(await m("/api/plex/genres")).genres||[],G}catch(t){return t.name!=="AbortError"&&$("Genres laden mislukt: "+t.message),[]}}async function $t(t){u&&(u.destroy(),u=null),A(),t.innerHTML='<div class="loading"><div class="spinner"></div>Genres laden\u2026</div>';let i=await _t();if(G=i,!i.length){t.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3BC}</div>
      <h3>Geen genres gevonden</h3>
    </div>`;return}t.innerHTML=`<div class="blib-genres-grid">
    ${i.map(e=>{let a=Gt(e.name),s=e.artistCount||0;return`<div class="blib-genre-card" data-genre="${l(e.name)}" style="background: ${a}">
        <div class="blib-genre-name">${l(e.name)}</div>
        <div class="blib-genre-count">${s} artiest${s!==1?"en":""}</div>
      </div>`}).join("")}
  </div>`,t.addEventListener("click",e=>{let a=e.target.closest(".blib-genre-card");if(a){let s=a.dataset.genre;wt(s,i)}})}async function wt(t,i){u&&(u.destroy(),u=null);let e=E();if(!e)return;C.push({view:"genres",data:{}}),e.scrollTop=0;let a=i.find(n=>n.genre===t);if(!a){e.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F3BC}</div>
      <h3>Genre niet gevonden</h3>
    </div>`;return}let s=a.artists||[];e.innerHTML=`
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-genre-back">\u2190 Genres</button>
      </div>
      <div class="blib-genre-detail-header">
        <div class="blib-genre-detail-title">${l(t)}</div>
        <div class="blib-genre-detail-count">${s.length} artiest${s.length!==1?"en":""}</div>
      </div>
      <div class="blib-genre-artists-grid">
        ${s.map(n=>{let r=n.thumb?L(n.thumb,200):null,d=r?`<img src="${l(r)}" alt="${l(n.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",b=`<div class="blib-artist-ph" style="display:${r?"none":"flex"};background:${y(n.title)}">${k(n.title)}</div>`;return`<div class="blib-genre-artist-card" data-artist-rating-key="${l(n.ratingKey)}">
            <div class="blib-artist-photo">
              ${d}
              ${b}
            </div>
            <div class="blib-artist-name">${l(n.title)}</div>
          </div>`}).join("")}
      </div>
    </div>`,document.getElementById("blib-genre-back")?.addEventListener("click",()=>{C.pop(),$t(e)}),e.addEventListener("click",n=>{let r=n.target.closest(".blib-genre-artist-card");if(r){let d=r.dataset.artistRatingKey;d&&zt(d)}})}async function zt(t){u&&(u.destroy(),u=null);let i=E();if(i){C.push({view:"artist-detail",data:{ratingKey:t}}),i.scrollTop=0,i.innerHTML=`<div class="blib-detail-view">
    <div class="loading"><div class="spinner"></div>Artiest laden\u2026</div>
  </div>`;try{let e=await m(`/api/plex/artists/${encodeURIComponent(t)}`);if(!e.artist){i.innerHTML='<div class="blib-empty"><p>Artiest niet gevonden.</p></div>';return}let a=e.artist,s=X(),n=[];try{let c=await m("/api/plex/tracks?limit=500");c.tracks&&(n=c.tracks.filter(v=>v.artist&&v.artist.toLowerCase()===a.title.toLowerCase()).slice(0,10))}catch{}let r=a.thumb?L(a.thumb,320):null,d=r?`<img src="${l(r)}" alt="${l(a.title)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="blib-artist-detail-ph" style="background:${y(a.title)};display:none;width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px">${k(a.title)}</div>`:`<div class="blib-artist-detail-ph" style="background:${y(a.title)};width:200px;height:200px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px">${k(a.title)}</div>`,o=(C.length>1?C[C.length-2]:null)?.view==="genre"?"\u2190 Genres":"\u2190 Artiesten";i.innerHTML=`
      <div class="blib-detail-view">
        <div class="blib-detail-topbar">
          <button class="blib-back-btn" id="blib-artist-detail-back">${o}</button>
        </div>

        <div class="blib-artist-detail-hero">
          <div class="blib-artist-detail-photo">${d}</div>
          <div class="blib-detail-info">
            <div class="blib-detail-label">Artiest</div>
            <h1 class="blib-detail-title">${l(a.title)}</h1>
            ${a.genres.length>0?`<div class="blib-detail-genres">
              ${a.genres.map(c=>`<span class="blib-genre-tag">${l(c)}</span>`).join("")}
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
              ${s?`<button class="blib-action-btn" id="blib-artist-play-plex" title="Speel op Plex: ${l(s)}">
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
                ${a.albums.map(c=>{let v=c.thumb?L(c.thumb,200):null,g=v?`<img src="${l(v)}" alt="${l(c.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",S=`<div class="blib-cover-ph" style="display:${v?"none":"flex"};background:${y(c.title)}">${k(c.title)}</div>`;return`<div class="blib-album-detail-card" data-album-rating-key="${l(c.ratingKey)}">
                    <div class="blib-album-detail-cover">
                      ${g}
                      ${S}
                    </div>
                    <div class="blib-album-detail-info">
                      <div class="blib-album-detail-title" title="${l(c.title)}">${l(c.title)}</div>
                      ${c.year?`<div class="blib-album-detail-year">${c.year}</div>`:""}
                      <div class="blib-album-detail-count">${c.trackCount} nummer${c.trackCount!==1?"s":""}</div>
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
              ${n.map((c,v)=>{let g=c.duration?Math.floor(c.duration/1e3):0,S=Math.floor(g/60),M=String(g%60).padStart(2,"0");return`<div class="blib-track-row" data-track-key="${l(c.ratingKey||"")}">
                  <div class="blib-track-num">
                    <span class="blib-track-num-text">${v+1}</span>
                    <button class="blib-track-play-btn" aria-label="Speel ${l(c.title||"")} af">\u25B6</button>
                  </div>
                  <div class="blib-track-title">${l(c.title||"Onbekend")}</div>
                  <div class="blib-track-album">${l(c.album||"\u2014")}</div>
                  <div class="blib-track-duration">${g?S+":"+M:""}</div>
                </div>`}).join("")}
            </div>
          `:""}
        </div>
      </div>`,document.getElementById("blib-artist-detail-back")?.addEventListener("click",()=>{C.pop();let c=C[C.length-1];c?.view==="genre"?wt(c.data.genre,G):ft(i)}),document.getElementById("blib-artist-play-all")?.addEventListener("click",()=>{a.albums[0]?.ratingKey&&x(a.albums[0].ratingKey,"music")}),document.getElementById("blib-artist-play-plex")?.addEventListener("click",async()=>{if(a.albums[0]?.ratingKey)try{await U("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ratingKey:a.albums[0].ratingKey})})}catch(c){c.name!=="AbortError"&&$("Afspelen mislukt: "+c.message)}}),document.getElementById("blib-artist-shuffle")?.addEventListener("click",()=>{if(a.albums.length>0){let c=a.albums[Math.floor(Math.random()*a.albums.length)];x(c.ratingKey,"music")}}),i.addEventListener("click",c=>{let v=c.target.closest(".blib-album-detail-card");if(v){let M=v.dataset.albumRatingKey;M&&gt({ratingKey:M,album:"",artist:a.title,thumb:""})}let g=c.target.closest(".blib-track-play-btn");if(g){c.stopPropagation();let M=g.closest(".blib-track-row");M?.dataset.trackKey&&x(M.dataset.trackKey,"music")}let S=c.target.closest(".blib-track-row");S?.dataset.trackKey&&!c.target.closest(".blib-track-play-btn")&&x(S.dataset.trackKey,"music")})}catch(e){e.name!=="AbortError"&&(i.innerHTML=`<div class="blib-empty"><p>Laden mislukt: ${l(e.message)}</p></div>`)}}}async function jt(){if(D)return D;try{return D=(await m("/api/plex/playlists")).playlists||[],D}catch(t){return t.name!=="AbortError"&&$("Playlists laden mislukt: "+t.message),[]}}async function Dt(t){u&&(u.destroy(),u=null),A(),t.innerHTML='<div class="loading"><div class="spinner"></div>Playlists laden\u2026</div>';let i=await jt();if(D=i,!i.length){t.innerHTML=`<div class="blib-empty">
      <div class="blib-empty-icon">\u{1F399}\uFE0F</div>
      <h3>Geen playlists gevonden</h3>
    </div>`;return}t.innerHTML=`<div class="blib-playlists-grid">
    ${i.map(e=>{let a=e.thumb?L(e.thumb,200):null,s=e.leafCount||e.trackCount||0,n=a?`<img src="${l(a)}" alt="${l(e.title||"Playlist")}" loading="lazy">`:`<div class="blib-playlist-ph" style="background:${y(e.title||"Playlist")}">\u{1F399}\uFE0F</div>`;return`<div class="blib-playlist-card" data-playlist-key="${l(e.ratingKey||e.key||"")}">
        <div class="blib-playlist-cover">${n}</div>
        <div class="blib-playlist-info">
          <div class="blib-playlist-title">${l(e.title||"Playlist")}</div>
          <div class="blib-playlist-count">${s} numm${s!==1?"ers":"er"}</div>
        </div>
      </div>`}).join("")}
  </div>`,t.addEventListener("click",e=>{let a=e.target.closest(".blib-playlist-card");if(a){let s=a.dataset.playlistKey,n=a.querySelector(".blib-playlist-title")?.textContent||"Playlist";s&&yt(s,n)}})}function ri(t,i){return""}function ci(t){let i=t.target.closest(".blib-play-btn");if(i){t.stopPropagation();let n=i.closest(".blib-album");return n?.dataset.ratingKey&&x(n.dataset.ratingKey,"music"),!0}let e=t.target.closest(".blib-track-play-btn");if(e){t.stopPropagation();let n=e.closest(".blib-track-row");return n?.dataset.trackKey&&x(n.dataset.trackKey,"music"),!0}let a=t.target.closest(".blib-artist-filter-btn");if(a){t.stopPropagation();let n=a.dataset.artistFilter;return n&&at(n),!0}let s=t.target.closest(".blib-album");return s?.dataset.ratingKey?(gt({ratingKey:s.dataset.ratingKey,album:s.dataset.album,artist:s.dataset.artist,thumb:s.dataset.thumb}),!0):!!(t.target.closest("#blib-back-to-grid")||t.target.closest("#blib-artist-back")||t.target.closest("#blib-playlist-back")||t.target.closest("#blib-back-to-artist"))}async function oi(){try{if(await pt(),H==="grid"){let t=document.getElementById("blib-grid-wrap");t&&_(t)}}catch(t){t.name!=="AbortError"&&$(t.message)}}async function Ot(){bt(),H="grid",f=null,it=null,V=null,mt(),A(),It().catch(()=>{});let t=E();if(t){t.scrollTop=0,t.innerHTML=`<div class="loading" role="status">
    <div class="spinner" aria-hidden="true"></div>Bibliotheek laden\u2026
  </div>`;try{w==="albums"?(await pt(),await q(t)):await et(w)}catch(i){i.name!=="AbortError"&&$(i.message)}}}async function di(t){if(p.bibSubTab=t,t==="collectie")await Ot();else if(t==="lijst"){let i=E();if(i){p.sectionContainerEl=i;try{await dt()}finally{p.sectionContainerEl===i&&(p.sectionContainerEl=null)}}}}async function bi(t){z();let i=p.tabAbort?.signal;try{let e=`topartists:${t}`,a=O(e,300*1e3);if(!a){if(a=await m(`/api/topartists?period=${t}`,{signal:i}),i?.aborted)return;F(e,a)}let s=a.topartists?.artist||[];if(!s.length){T('<div class="empty">Geen data.</div>');return}let n=parseInt(s[0]?.playcount||1),r=`<div class="section-title">Top artiesten \xB7 ${Y(t)}</div><div class="artist-grid">`;for(let b=0;b<s.length;b++){let o=s[b],c=Math.round(parseInt(o.playcount)/n*100),v=W(o.image,"large")||W(o.image),g=L(v,120)||v,S=g?`<img src="${g}" alt="${l(o.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${y(o.name,!0)}">${k(o.name)}</div>`:`<div class="ag-photo-ph" style="background:${y(o.name,!0)}">${k(o.name)}</div>`;r+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${b}" style="view-transition-name: artist-${ct(o.name)}">${S}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${l(o.name)}">${l(o.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${c}%"></div></div>
          <div class="ag-plays">${K(o.playcount)} plays</div>
        </div></div>`}T(r+"</div>");let d=s.map((b,o)=>m(`/api/artist/${encodeURIComponent(b.name)}/info`).then(c=>{if(c.image){let v=document.getElementById(`agp-${o}`);v&&(v.innerHTML=`<img src="${L(c.image,120)||c.image}" alt="${l(b.name)}" loading="lazy" onerror="this.style.display='none'">`)}return!0}).catch(()=>!0));Promise.allSettled(d)}catch(e){if(e.name==="AbortError")return;$(e.message)}}async function ui(t){z();let i=p.tabAbort?.signal;try{let e=`toptracks:${t}`,a=O(e,300*1e3);if(!a){if(a=await m(`/api/toptracks?period=${t}`,{signal:i}),i?.aborted)return;F(e,a)}let s=a.toptracks?.track||[];if(!s.length){T('<div class="empty">Geen data.</div>');return}let n=parseInt(s[0]?.playcount||1),r=`<div class="section-title">Top nummers \xB7 ${Y(t)}</div><div class="card-list">`;for(let d of s){let b=Math.round(parseInt(d.playcount)/n*100);r+=`<div class="card">${J(d.image)}<div class="card-info">
        <div class="card-title">${l(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(d.artist?.name||"")}">${l(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${b}%"></div></div>
        </div><div class="card-meta">${K(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${l(d.artist?.name||"")}" data-track="${l(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}T(r+"</div>")}catch(e){if(e.name==="AbortError")return;$(e.message)}}async function vi(){z();let t=p.tabAbort?.signal;try{let i=O("loved",6e5);if(!i){if(i=await m("/api/loved",{signal:t}),t?.aborted)return;F("loved",i)}let e=i.lovedtracks?.track||[];if(!e.length){T('<div class="empty">Geen geliefde nummers.</div>');return}let a='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let s of e){let n=s.date?.uts?st(parseInt(s.date.uts)):"";a+=`<div class="card">${J(s.image)}<div class="card-info">
        <div class="card-title">${l(s.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(s.artist?.name||"")}">${l(s.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${l(s.artist?.name||"")}" data-track="${l(s.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}T(a+"</div>")}catch(i){if(i.name==="AbortError")return;$(i.message)}}async function pi(){z("Statistieken ophalen...");let t=p.tabAbort?.signal;try{let i=O("stats",6e5);if(!i){if(i=await m("/api/stats",{signal:t}),t?.aborted)return;F("stats",i)}T(`
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
      </div>`,()=>Ft(i))}catch(i){if(i.name==="AbortError")return;$(i.message)}}function Ft(t){if(typeof Chart>"u")return;let i=!window.matchMedia("(prefers-color-scheme: light)").matches,e=i?"#2c2c2c":"#ddd",a=i?"#888":"#777",s=i?"#efefef":"#111";Chart.defaults.color=a,Chart.defaults.borderColor=e;let n=document.getElementById("chart-daily");n&&new Chart(n,{type:"bar",data:{labels:t.dailyScrobbles.map(b=>new Date(b.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:t.dailyScrobbles.map(b=>b.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:b=>`${b.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:a}},y:{grid:{color:e},ticks:{color:a},beginAtZero:!0}}}});let r=document.getElementById("chart-top");r&&t.topArtists?.length&&new Chart(r,{type:"bar",data:{labels:t.topArtists.map(b=>b.name),datasets:[{data:t.topArtists.map(b=>b.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:b=>`${b.raw} plays`}}},scales:{x:{grid:{color:e},ticks:{color:a},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:s,font:{size:11}}}}}});let d=document.getElementById("chart-genres");if(d&&t.genres?.length){let b=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(d,{type:"doughnut",data:{labels:t.genres.map(o=>o.name),datasets:[{data:t.genres.map(o=>o.count),backgroundColor:b.slice(0,t.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:a,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function Zt(){z("Collectiegaten zoeken...");let t=p.tabAbort?.signal;try{let i=await m("/api/gaps",{signal:t});if(t?.aborted)return;if(i.status==="building"&&(!i.artists||!i.artists.length)){T(`<div class="loading"><div class="spinner"></div>
        <div>${l(i.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{p.activeView==="gaps"&&Zt()},2e4);return}if(p.lastGaps=i,Nt(),i.builtAt&&Date.now()-i.builtAt>864e5){let e=document.createElement("div");e.className="refresh-banner",e.textContent="\u21BB Gaps worden op de achtergrond ververst...";let a=p.sectionContainerEl||document.getElementById("content");a&&a.prepend(e),fetch("/api/gaps/refresh",{method:"POST"}).catch(()=>{})}}catch(i){if(i.name==="AbortError")return;$(i.message)}}function Nt(){if(!p.lastGaps)return;let t=[...p.lastGaps.artists||[]];if(!t.length){T('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>');let s=document.getElementById("badge-gaps");s&&(s.textContent="0");return}p.gapsSort==="missing"&&t.sort((s,n)=>n.missingAlbums.length-s.missingAlbums.length),p.gapsSort==="name"&&t.sort((s,n)=>s.name.localeCompare(n.name));let i=t.reduce((s,n)=>s+n.missingAlbums.length,0),e=document.getElementById("badge-gaps");e&&(e.textContent=i);let a=`<div class="section-title">${i} ontbrekende albums bij ${t.length} artiesten die je al hebt</div>`;for(let s of t){let n=Math.round(s.ownedCount/s.totalCount*100),r=[lt(s.country),s.country,s.startYear].filter(Boolean).join(" \xB7 "),d=L(s.image,56)||s.image,b=d?`<img class="gaps-photo" src="${l(d)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${y(s.name)}">${k(s.name)}</div>`:`<div class="gaps-photo-ph" style="background:${y(s.name)}">${k(s.name)}</div>`;a+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${b}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${l(s.name)}">${l(s.name)}</div>
              ${rt("artist",s.name,"",s.image||"")}
            </div>
            <div class="gaps-artist-meta">${l(r)}</div>
            ${nt(s.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${s.ownedCount} van ${s.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${s.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let o of s.missingAlbums)a+=Q(o,!1,s.name);a+="</div>",s.allAlbums?.filter(o=>o.inPlex).length>0&&(a+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${s.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${s.allAlbums.filter(o=>o.inPlex).map(o=>Q(o,!1,s.name)).join("")}
        </div>
      </details>`),a+="</div>"}T(a)}export{ri as buildPlexLibraryHtml,ci as handlePlexLibraryClick,Ot as loadBibliotheek,Zt as loadGaps,vi as loadLoved,oi as loadPlexLibrary,It as loadSidebarPlaylists,pi as loadStats,bi as loadTopArtists,ui as loadTopTracks,yt as openSidebarPlaylist,Nt as renderGaps,Ft as renderStatsCharts,di as switchBibSubTab};
