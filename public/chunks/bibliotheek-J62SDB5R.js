import{a as X,b as I,g as tt}from"./chunk-HYLFKVW7.js";import{p as it}from"./chunk-4Q7IW62X.js";import{B as H,C as _,F as y,H as Q,a as u,b as z,c as U,f as T,g as G,h as w,i as M,j as l,k as j,l as q,m as k,n as N,o as V,q as Y,r as J,u as D,v as F,w as m,x as $,y as C}from"./chunk-OXJVLDHB.js";var S=null,E="artist",B="",p="grid",v=null,x="grid",Z=null,g=null,R=null,nt=210,rt=62,et=3;function f(){return document.getElementById("content")}function at(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}async function W(){if(S)return S;let t=await y("/api/plex/library/all");return!t.ok||!t.library?.length?[]:(S=t.library.map(([i,a,s,e])=>({artist:i,album:a,ratingKey:s,thumb:e})),S)}function ot(){let t=S||[];v&&(t=t.filter(a=>a.artist===v));let i=B.toLowerCase().trim();return i&&(t=t.filter(a=>a.artist.toLowerCase().includes(i)||a.album.toLowerCase().includes(i))),E==="artist"?t=[...t].sort((a,s)=>a.artist.localeCompare(s.artist,"nl",{sensitivity:"base"})||a.album.localeCompare(s.album,"nl",{sensitivity:"base"})):E==="album"?t=[...t].sort((a,s)=>a.album.localeCompare(s.album,"nl",{sensitivity:"base"})):E==="recent"&&(t=[...t].reverse()),t}function ct(t){let i=new Map;for(let a of t){let s=(a.artist[0]||"#").toUpperCase(),e=/[A-Z]/.test(s)?s:"#";i.has(e)||i.set(e,[]),i.get(e).push(a)}return i}function dt(t){let i=t.thumb?T(t.thumb,240):null,a=i?`<img src="${l(i)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${k(t.album)}">${w(t.album)}</div>`:`<div class="blib-cover-ph" style="background:${k(t.album)}">${w(t.album)}</div>`;return p==="list"?`<div class="blib-album blib-album-list"
      data-rating-key="${l(t.ratingKey)}"
      data-album="${l(t.album)}"
      data-artist="${l(t.artist)}"
      data-thumb="${l(t.thumb||"")}">
      <div class="blib-cover blib-cover-sm">${a}</div>
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
      ${a}
      <div class="blib-play-overlay"><button class="blib-play-btn" title="Afspelen">\u25B6</button></div>
    </div>
    <div class="blib-album-title" title="${l(t.album)}">${l(t.album)}</div>
    <button class="blib-artist-filter-btn" data-artist-filter="${l(t.artist)}">${l(t.artist)}</button>
  </div>`}var O=class{constructor(i,a){this.container=i,this.items=a,this.cols=p==="list"?1:at(),this.rowH=p==="list"?rt:nt,this.lastStart=-1,this.lastEnd=-1;let s=E==="artist"&&!B&&!v&&p==="grid";this.groups=s?ct(a):null,this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=f()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let i=[],a=0;if(this.groups)for(let[s,e]of this.groups){i.push({type:"header",letter:s,height:56,offset:a}),a+=56;for(let n=0;n<e.length;n+=this.cols)i.push({type:"items",items:e.slice(n,n+this.cols),height:this.rowH,offset:a}),a+=this.rowH}else for(let s=0;s<this.items.length;s+=this.cols)i.push({type:"items",items:this.items.slice(s,s+this.cols),height:this.rowH,offset:a}),a+=this.rowH;return this.totalHeight=a,i}_createDOM(){this.container.innerHTML=`<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".blib-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let i=p==="list"?1:at();if(i!==this.cols){this.cols=i,this.flatRows=this._buildFlatRows();let a=this.container.querySelector(".blib-virtual-container");a&&(a.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let i=this._getScrollTop(),a=this._getViewHeight(),s=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),e=i-s,n=et*this.rowH,c=0,d=this.flatRows.length-1;for(let o=0;o<this.flatRows.length;o++){let b=this.flatRows[o];if(b.offset+b.height>=e-n){c=Math.max(0,o-et);break}}for(let o=c;o<this.flatRows.length;o++)if(this.flatRows[o].offset>e+a+n){d=o;break}if(c===this.lastStart&&d===this.lastEnd)return;this.lastStart=c,this.lastEnd=d;let r="";for(let o=c;o<=d&&o<this.flatRows.length;o++){let b=this.flatRows[o];if(b.type==="header")r+=`<div class="blib-letter-header" style="height:${b.height}px">${l(b.letter)}</div>`;else{r+=`<div class="${p==="list"?"blib-list-rows":"blib-grid"}">`;for(let A of b.items)r+=dt(A);r+="</div>"}}this.winEl.style.top=(this.flatRows[c]?.offset||0)+"px",this.winEl.innerHTML=r}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(i){for(let a of this.flatRows)if(a.type==="header"&&a.letter===i){let s=this._scrollEl;if(s!==window)s.scrollTop=a.offset;else{let e=this.container.getBoundingClientRect().top+window.scrollY+a.offset-120;window.scrollTo({top:e,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(i=>i.type==="header").map(i=>i.letter))}};function bt(t){let i=document.getElementById("blib-az-rail");if(!i)return;let a=t.getAvailableLetters();i.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(s=>`<button class="blib-az-btn${a.has(s)?"":" disabled"}" data-letter="${s}">${s}</button>`).join(""),i.addEventListener("click",s=>{let e=s.target.closest(".blib-az-btn");e&&!e.classList.contains("disabled")&&t.scrollToLetter(e.dataset.letter)})}function ut(t){let i=document.getElementById("blib-count");i&&(i.textContent=`${M(t)} albums`)}async function L(t){g&&(g.destroy(),g=null);let i=ot();if(ut(i.length),!i.length){t.innerHTML=`
      <div class="blib-empty">
        <div class="blib-empty-icon">\u{1F3B5}</div>
        <h3>Geen albums gevonden</h3>
        <p>${B?`Geen resultaten voor "<strong>${l(B)}</strong>"`:v?`Geen albums van <strong>${l(v)}</strong> in bibliotheek.`:"Plex bibliotheek is leeg of nog niet gesynchroniseerd."}</p>
      </div>`;return}if(g=new O(t,i),E==="artist"&&!B&&!v&&p==="grid")bt(g);else{let a=document.getElementById("blib-az-rail");a&&(a.innerHTML="")}}function K(){let t=document.getElementById("view-toolbar");t&&(t.innerHTML=`
    <div class="blib-toolbar">
      <input class="blib-search" id="blib-search" type="text"
        placeholder="\u{1F50D} Zoek artiest of album\u2026" autocomplete="off"
        value="${l(B)}">

      <div class="blib-toolbar-sep"></div>

      <div class="blib-view-toggle" role="group" aria-label="Weergavemodus">
        <button class="blib-pill${p==="grid"?" active":""}" id="blib-btn-grid"
                title="Grid weergave" aria-pressed="${p==="grid"}">\u229E</button>
        <button class="blib-pill${p==="list"?" active":""}" id="blib-btn-list"
                title="Lijst weergave" aria-pressed="${p==="list"}">\u2630</button>
      </div>

      <select class="blib-sort-select" id="blib-sort-select" aria-label="Sortering">
        <option value="artist"${E==="artist"?" selected":""}>Artiest A\u2013Z</option>
        <option value="album"${E==="album"?" selected":""}>Album A\u2013Z</option>
        <option value="recent"${E==="recent"?" selected":""}>Recent toegevoegd</option>
      </select>

      <span class="blib-count" id="blib-count"></span>

      <button class="tool-btn" id="btn-sync-plex-blib">\u21BB Sync Plex</button>
    </div>
    <div class="blib-az-rail" id="blib-az-rail"></div>`,pt())}function pt(){let t=()=>f();document.getElementById("blib-search")?.addEventListener("input",i=>{if(B=i.target.value,v&&(v=null,x="grid"),t()){let s=document.getElementById("blib-grid-wrap");s&&L(s)}}),document.getElementById("blib-btn-grid")?.addEventListener("click",()=>{if(p==="grid")return;p="grid",document.getElementById("blib-btn-grid")?.classList.add("active"),document.getElementById("blib-btn-list")?.classList.remove("active");let i=document.getElementById("blib-grid-wrap");i&&L(i)}),document.getElementById("blib-btn-list")?.addEventListener("click",()=>{if(p==="list")return;p="list",document.getElementById("blib-btn-list")?.classList.add("active"),document.getElementById("blib-btn-grid")?.classList.remove("active");let i=document.getElementById("blib-grid-wrap");i&&L(i)}),document.getElementById("blib-sort-select")?.addEventListener("change",i=>{E=i.target.value;let a=document.getElementById("blib-grid-wrap");a&&L(a)}),document.getElementById("btn-sync-plex-blib")?.addEventListener("click",async()=>{let i=document.getElementById("btn-sync-plex-blib");if(!i)return;let a=i.textContent;i.disabled=!0,i.textContent="\u21BB Bezig\u2026";try{try{await z("/api/plex/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}await Q(),S=null,await W();let s=document.getElementById("blib-grid-wrap");s&&L(s)}catch{}finally{i.disabled=!1,i.textContent=a}})}async function P(t){if(!t)return;x="grid",Z=null,R=null,t.scrollTop=0,t.innerHTML='<div id="blib-grid-wrap"></div>';let i=document.getElementById("blib-grid-wrap");await L(i)}async function vt(t){x="detail",Z=t;let i=f();if(!i)return;g&&(g.destroy(),g=null),i.scrollTop=0;let a=t.thumb?T(t.thumb,320):null,s=a?`<img src="${l(a)}" alt="${l(t.album)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${k(t.album)}">${w(t.album)}</div>`:`<div class="blib-detail-cover-ph" style="background:${k(t.album)}">${w(t.album)}</div>`,e=X(),n=v?`<button class="blib-back-btn blib-back-artist" id="blib-back-to-artist">
         \u2190 ${l(v)}
       </button>`:"";if(i.innerHTML=`
    <div class="blib-detail-view">
      <div class="blib-detail-topbar">
        <button class="blib-back-btn" id="blib-back-to-grid">\u2190 Alle albums</button>
        ${n}
      </div>

      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${s}</div>
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
            ${e?`<button class="blib-action-btn" id="blib-play-plex" title="Speel op Plex: ${l(e)}">
                   \u{1F50A} Speel op Plex
                 </button>`:""}
          </div>
        </div>
      </div>

      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div>Tracks laden\u2026</div>
      </div>
    </div>`,document.getElementById("blib-back-to-grid")?.addEventListener("click",()=>{v=null,K(),P(f())}),document.getElementById("blib-back-to-artist")?.addEventListener("click",()=>{let c=v;K(),st(c)}),document.getElementById("blib-play-all")?.addEventListener("click",()=>{t.ratingKey&&I(t.ratingKey,"music")}),document.getElementById("blib-play-plex")?.addEventListener("click",async()=>{if(t.ratingKey)try{await z("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ratingKey:t.ratingKey})})}catch(c){c.name!=="AbortError"&&$("Afspelen mislukt: "+c.message)}}),!t.ratingKey){let c=document.getElementById("blib-tracklist");c&&(c.innerHTML='<div class="blib-empty"><p>Geen ratingKey beschikbaar.</p></div>');return}try{let c=await y(`/api/plex/album/${encodeURIComponent(t.ratingKey)}/tracks`),d=document.getElementById("blib-tracklist");if(!d)return;let r=c.tracks||[];if(!r.length){d.innerHTML='<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';return}d.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+r.map((o,b)=>{let h=o.duration?Math.floor(o.duration/1e3):0,A=Math.floor(h/60),lt=String(h%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${l(o.ratingKey||"")}"
            data-track-title="${l(o.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${b+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${l(o.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">${l(o.title||"Onbekend")}</div>
          <div class="blib-track-duration">${h?`${A}:${lt}`:""}</div>
        </div>`}).join(""),d.addEventListener("click",o=>{let b=o.target.closest(".blib-track-play-btn"),h=(b?b.closest(".blib-track-row"):null)||o.target.closest(".blib-track-row");h?.dataset.trackKey&&I(h.dataset.trackKey,"music")})}catch{let d=document.getElementById("blib-tracklist");d&&(d.innerHTML='<div class="blib-empty"><p>Tracks laden mislukt.</p></div>')}}async function st(t){x="artist",v=t;let i=f();if(!i)return;g&&(g.destroy(),g=null),i.scrollTop=0,B="";let a=document.getElementById("blib-search");a&&(a.value=""),i.innerHTML=`
    <div class="blib-artist-view">
      <div class="blib-artist-header">
        <button class="blib-back-btn" id="blib-artist-back">\u2190 Alle albums</button>
        <h2 class="blib-artist-title">Alle albums van ${l(t)}</h2>
      </div>
      <div id="blib-grid-wrap"></div>
    </div>`,document.getElementById("blib-artist-back")?.addEventListener("click",()=>{v=null,x="grid",K(),P(f())});let s=document.getElementById("blib-grid-wrap");s&&await L(s)}async function gt(){let t=document.getElementById("sidebar-playlists");if(t){t.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let i=await y("/api/plex/playlists"),a=i.playlists||i||[];if(!a.length){t.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}t.innerHTML=a.map(s=>{let e=l(s.ratingKey||s.key||""),n=l(s.title||"Playlist"),c=s.leafCount||s.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${e}" data-playlist-title="${n}"
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
        ${c?`<span class="sidebar-playlist-count">${c}</span>`:""}
      </button>`}).join(""),t.addEventListener("click",s=>{let e=s.target.closest(".sidebar-playlist-item");e&&(t.querySelectorAll(".sidebar-playlist-item").forEach(n=>n.classList.toggle("active",n===e)),mt(e.dataset.playlistKey,e.dataset.playlistTitle))})}catch(i){i.name!=="AbortError"&&(t.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}async function mt(t,i){x="playlist",R=t;let a=f();if(a){g&&(g.destroy(),g=null),a.scrollTop=0,a.innerHTML=`
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
    </div>`,document.getElementById("blib-playlist-back")?.addEventListener("click",()=>{document.querySelectorAll(".sidebar-playlist-item").forEach(s=>s.classList.remove("active")),x="grid",R=null,P(f())});try{let s=await y(`/api/plex/playlists/${encodeURIComponent(t)}/tracks`),e=document.getElementById("blib-playlist-tracks");if(!e)return;let n=s.tracks||[];if(!n.length){e.innerHTML='<div class="blib-empty"><p>Geen nummers in deze afspeellijst.</p></div>';return}document.getElementById("blib-playlist-play-all")?.addEventListener("click",()=>{n[0]?.ratingKey&&I(n[0].ratingKey,"music")}),e.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+n.map((c,d)=>{let r=c.duration?Math.floor(c.duration/1e3):0,o=Math.floor(r/60),b=String(r%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${l(c.ratingKey||"")}"
            data-track-title="${l(c.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${d+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${l(c.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">
            <div>${l(c.title||"Onbekend")}</div>
            ${c.artist?`<div class="blib-track-artist">${l(c.artist)}</div>`:""}
          </div>
          <div class="blib-track-duration">${r?`${o}:${b}`:""}</div>
        </div>`}).join(""),e.addEventListener("click",c=>{let d=c.target.closest(".blib-track-play-btn"),r=(d?d.closest(".blib-track-row"):null)||c.target.closest(".blib-track-row");r?.dataset.trackKey&&I(r.dataset.trackKey,"music")})}catch{let e=document.getElementById("blib-playlist-tracks");e&&(e.innerHTML='<div class="blib-empty"><p>Laden mislukt.</p></div>')}}}function Rt(t,i){return""}function Kt(t){let i=t.target.closest(".blib-play-btn");if(i){t.stopPropagation();let n=i.closest(".blib-album");return n?.dataset.ratingKey&&I(n.dataset.ratingKey,"music"),!0}let a=t.target.closest(".blib-track-play-btn");if(a){t.stopPropagation();let n=a.closest(".blib-track-row");return n?.dataset.trackKey&&I(n.dataset.trackKey,"music"),!0}let s=t.target.closest(".blib-artist-filter-btn");if(s){t.stopPropagation();let n=s.dataset.artistFilter;return n&&st(n),!0}let e=t.target.closest(".blib-album");return e?.dataset.ratingKey?(vt({ratingKey:e.dataset.ratingKey,album:e.dataset.album,artist:e.dataset.artist,thumb:e.dataset.thumb}),!0):!!(t.target.closest("#blib-back-to-grid")||t.target.closest("#blib-artist-back")||t.target.closest("#blib-playlist-back")||t.target.closest("#blib-back-to-artist"))}async function Pt(){try{if(await W(),x==="grid"){let t=document.getElementById("blib-grid-wrap");t&&L(t)}}catch(t){t.name!=="AbortError"&&$(t.message)}}async function yt(){it(),x="grid",v=null,Z=null,R=null,K(),gt().catch(()=>{});let t=f();if(t){t.scrollTop=0,t.innerHTML=`<div class="loading" role="status">
    <div class="spinner" aria-hidden="true"></div>Bibliotheek laden\u2026
  </div>`;try{await W(),await P(t)}catch(i){i.name!=="AbortError"&&$(i.message)}}}async function zt(t){if(u.bibSubTab=t,t==="collectie")await yt();else if(t==="lijst"){let i=f();if(i){u.sectionContainerEl=i;try{await tt()}finally{u.sectionContainerEl===i&&(u.sectionContainerEl=null)}}}}async function Gt(t){C();let i=u.tabAbort?.signal;try{let a=`topartists:${t}`,s=H(a,300*1e3);if(!s){if(s=await y(`/api/topartists?period=${t}`,{signal:i}),i?.aborted)return;_(a,s)}let e=s.topartists?.artist||[];if(!e.length){m('<div class="empty">Geen data.</div>');return}let n=parseInt(e[0]?.playcount||1),c=`<div class="section-title">Top artiesten \xB7 ${j(t)}</div><div class="artist-grid">`;for(let d=0;d<e.length;d++){let r=e[d],o=Math.round(parseInt(r.playcount)/n*100),b=G(r.image,"large")||G(r.image),h=T(b,120)||b,A=h?`<img src="${h}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${k(r.name,!0)}">${w(r.name)}</div>`:`<div class="ag-photo-ph" style="background:${k(r.name,!0)}">${w(r.name)}</div>`;c+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${d}" style="view-transition-name: artist-${J(r.name)}">${A}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${l(r.name)}">${l(r.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${o}%"></div></div>
          <div class="ag-plays">${M(r.playcount)} plays</div>
        </div></div>`}m(c+"</div>"),await U(e.map((d,r)=>async()=>{try{let o=await y(`/api/artist/${encodeURIComponent(d.name)}/info`);if(o.image){let b=document.getElementById(`agp-${r}`);b&&(b.innerHTML=`<img src="${T(o.image,120)||o.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}}),4)}catch(a){if(a.name==="AbortError")return;$(a.message)}}async function jt(t){C();let i=u.tabAbort?.signal;try{let a=`toptracks:${t}`,s=H(a,300*1e3);if(!s){if(s=await y(`/api/toptracks?period=${t}`,{signal:i}),i?.aborted)return;_(a,s)}let e=s.toptracks?.track||[];if(!e.length){m('<div class="empty">Geen data.</div>');return}let n=parseInt(e[0]?.playcount||1),c=`<div class="section-title">Top nummers \xB7 ${j(t)}</div><div class="card-list">`;for(let d of e){let r=Math.round(parseInt(d.playcount)/n*100);c+=`<div class="card">${D(d.image)}<div class="card-info">
        <div class="card-title">${l(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(d.artist?.name||"")}">${l(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${r}%"></div></div>
        </div><div class="card-meta">${M(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${l(d.artist?.name||"")}" data-track="${l(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}m(c+"</div>")}catch(a){if(a.name==="AbortError")return;$(a.message)}}async function Dt(){C();let t=u.tabAbort?.signal;try{let i=H("loved",6e5);if(!i){if(i=await y("/api/loved",{signal:t}),t?.aborted)return;_("loved",i)}let a=i.lovedtracks?.track||[];if(!a.length){m('<div class="empty">Geen geliefde nummers.</div>');return}let s='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let e of a){let n=e.date?.uts?q(parseInt(e.date.uts)):"";s+=`<div class="card">${D(e.image)}<div class="card-info">
        <div class="card-title">${l(e.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(e.artist?.name||"")}">${l(e.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${l(e.artist?.name||"")}" data-track="${l(e.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}m(s+"</div>")}catch(i){if(i.name==="AbortError")return;$(i.message)}}async function Ft(){C("Statistieken ophalen...");let t=u.tabAbort?.signal;try{let i=H("stats",6e5);if(!i){if(i=await y("/api/stats",{signal:t}),t?.aborted)return;_("stats",i)}m(`
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
      </div>`,()=>ht(i))}catch(i){if(i.name==="AbortError")return;$(i.message)}}function ht(t){if(typeof Chart>"u")return;let i=!window.matchMedia("(prefers-color-scheme: light)").matches,a=i?"#2c2c2c":"#ddd",s=i?"#888":"#777",e=i?"#efefef":"#111";Chart.defaults.color=s,Chart.defaults.borderColor=a;let n=document.getElementById("chart-daily");n&&new Chart(n,{type:"bar",data:{labels:t.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:t.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:s}},y:{grid:{color:a},ticks:{color:s},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&t.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:t.topArtists.map(r=>r.name),datasets:[{data:t.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:a},ticks:{color:s},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:e,font:{size:11}}}}}});let d=document.getElementById("chart-genres");if(d&&t.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(d,{type:"doughnut",data:{labels:t.genres.map(o=>o.name),datasets:[{data:t.genres.map(o=>o.count),backgroundColor:r.slice(0,t.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:s,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function ft(){C("Collectiegaten zoeken...");let t=u.tabAbort?.signal;try{let i=await y("/api/gaps",{signal:t});if(t?.aborted)return;if(i.status==="building"&&(!i.artists||!i.artists.length)){m(`<div class="loading"><div class="spinner"></div>
        <div>${l(i.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{u.activeView==="gaps"&&ft()},2e4);return}if(u.lastGaps=i,wt(),i.builtAt&&Date.now()-i.builtAt>864e5){let a=document.createElement("div");a.className="refresh-banner",a.textContent="\u21BB Gaps worden op de achtergrond ververst...";let s=u.sectionContainerEl||document.getElementById("content");s&&s.prepend(a),fetch("/api/gaps/refresh",{method:"POST"}).catch(()=>{})}}catch(i){if(i.name==="AbortError")return;$(i.message)}}function wt(){if(!u.lastGaps)return;let t=[...u.lastGaps.artists||[]];if(!t.length){m('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>');let e=document.getElementById("badge-gaps");e&&(e.textContent="0");return}u.gapsSort==="missing"&&t.sort((e,n)=>n.missingAlbums.length-e.missingAlbums.length),u.gapsSort==="name"&&t.sort((e,n)=>e.name.localeCompare(n.name));let i=t.reduce((e,n)=>e+n.missingAlbums.length,0),a=document.getElementById("badge-gaps");a&&(a.textContent=i);let s=`<div class="section-title">${i} ontbrekende albums bij ${t.length} artiesten die je al hebt</div>`;for(let e of t){let n=Math.round(e.ownedCount/e.totalCount*100),c=[N(e.country),e.country,e.startYear].filter(Boolean).join(" \xB7 "),d=T(e.image,56)||e.image,r=d?`<img class="gaps-photo" src="${l(d)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${k(e.name)}">${w(e.name)}</div>`:`<div class="gaps-photo-ph" style="background:${k(e.name)}">${w(e.name)}</div>`;s+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${r}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${l(e.name)}">${l(e.name)}</div>
              ${Y("artist",e.name,"",e.image||"")}
            </div>
            <div class="gaps-artist-meta">${l(c)}</div>
            ${V(e.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${e.ownedCount} van ${e.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${e.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let o of e.missingAlbums)s+=F(o,!1,e.name);s+="</div>",e.allAlbums?.filter(o=>o.inPlex).length>0&&(s+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${e.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${e.allAlbums.filter(o=>o.inPlex).map(o=>F(o,!1,e.name)).join("")}
        </div>
      </details>`),s+="</div>"}m(s)}export{Rt as buildPlexLibraryHtml,Kt as handlePlexLibraryClick,yt as loadBibliotheek,ft as loadGaps,Dt as loadLoved,Pt as loadPlexLibrary,gt as loadSidebarPlaylists,Ft as loadStats,Gt as loadTopArtists,jt as loadTopTracks,mt as openSidebarPlaylist,wt as renderGaps,ht as renderStatsCharts,zt as switchBibSubTab};
