import{a as it,e as C}from"./chunk-HNNUXXVH.js";import{A as M,B as _,E as g,G as X,X as tt,a as b,b as I,c as q,f as S,g as G,h as y,i as R,j as l,k as j,l as N,m as f,n as V,o as Y,q as J,r as Q,t as O,u as F,v as m,w,x as L}from"./chunk-ANAONK2Y.js";async function rt(){try{let t=await g("/api/wishlist");b.wishlistMap.clear();for(let i of t)b.wishlistMap.set(`${i.type}:${i.name}`,i.id);D()}catch{}}function D(){let t=document.getElementById("badge-wishlist");t&&(t.textContent=b.wishlistMap.size||"0")}async function Bt(t,i,e,s){let a=`${t}:${i}`;if(b.wishlistMap.has(a)){try{await I(`/api/wishlist/${b.wishlistMap.get(a)}`,{method:"DELETE"})}catch(n){if(n.name!=="AbortError")throw n}return b.wishlistMap.delete(a),D(),!1}else{let o=await(await I("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:t,name:i,artist:e,image:s})})).json();return b.wishlistMap.set(a,o.id),D(),!0}}async function et(){L(),await rt();try{let t=await g("/api/wishlist");if(!t.length){m('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let i=`<div class="section-title">${t.length} opgeslagen</div><div class="wishlist-grid">`;for(let e of t){let s=e.image?`<img src="${l(e.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";i+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${f(e.name)}">
            ${s}
            <div class="wish-ph">${y(e.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${l(e.name)}">${l(e.name)}</div>
              ${e.artist?`<div class="wish-sub">${l(e.artist)}</div>`:""}
              <div class="wish-type">${e.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${e.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}m(i+"</div>")}catch(t){w(t.message)}}var A=null,E="artist",T="",p="grid",v=null,x="grid",Z=null,h=null,K=null,ot=210,ct=62,at=3;function $(){return document.getElementById("content")}function st(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}async function U(){if(A)return A;let t=await g("/api/plex/library/all");return!t.ok||!t.library?.length?[]:(A=t.library.map(([i,e,s,a])=>({artist:i,album:e,ratingKey:s,thumb:a})),A)}function dt(){let t=A||[];v&&(t=t.filter(e=>e.artist===v));let i=T.toLowerCase().trim();return i&&(t=t.filter(e=>e.artist.toLowerCase().includes(i)||e.album.toLowerCase().includes(i))),E==="artist"?t=[...t].sort((e,s)=>e.artist.localeCompare(s.artist,"nl",{sensitivity:"base"})||e.album.localeCompare(s.album,"nl",{sensitivity:"base"})):E==="album"?t=[...t].sort((e,s)=>e.album.localeCompare(s.album,"nl",{sensitivity:"base"})):E==="recent"&&(t=[...t].reverse()),t}function bt(t){let i=new Map;for(let e of t){let s=(e.artist[0]||"#").toUpperCase(),a=/[A-Z]/.test(s)?s:"#";i.has(a)||i.set(a,[]),i.get(a).push(e)}return i}function ut(t){let i=t.thumb?S(t.thumb,240):null,e=i?`<img src="${l(i)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${f(t.album)}">${y(t.album)}</div>`:`<div class="blib-cover-ph" style="background:${f(t.album)}">${y(t.album)}</div>`;return p==="list"?`<div class="blib-album blib-album-list"
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
  </div>`}var W=class{constructor(i,e){this.container=i,this.items=e,this.cols=p==="list"?1:st(),this.rowH=p==="list"?ct:ot,this.lastStart=-1,this.lastEnd=-1;let s=E==="artist"&&!T&&!v&&p==="grid";this.groups=s?bt(e):null,this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=$()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let i=[],e=0;if(this.groups)for(let[s,a]of this.groups){i.push({type:"header",letter:s,height:56,offset:e}),e+=56;for(let n=0;n<a.length;n+=this.cols)i.push({type:"items",items:a.slice(n,n+this.cols),height:this.rowH,offset:e}),e+=this.rowH}else for(let s=0;s<this.items.length;s+=this.cols)i.push({type:"items",items:this.items.slice(s,s+this.cols),height:this.rowH,offset:e}),e+=this.rowH;return this.totalHeight=e,i}_createDOM(){this.container.innerHTML=`<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".blib-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let i=p==="list"?1:st();if(i!==this.cols){this.cols=i,this.flatRows=this._buildFlatRows();let e=this.container.querySelector(".blib-virtual-container");e&&(e.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let i=this._getScrollTop(),e=this._getViewHeight(),s=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),a=i-s,n=at*this.rowH,o=0,d=this.flatRows.length-1;for(let c=0;c<this.flatRows.length;c++){let u=this.flatRows[c];if(u.offset+u.height>=a-n){o=Math.max(0,c-at);break}}for(let c=o;c<this.flatRows.length;c++)if(this.flatRows[c].offset>a+e+n){d=c;break}if(o===this.lastStart&&d===this.lastEnd)return;this.lastStart=o,this.lastEnd=d;let r="";for(let c=o;c<=d&&c<this.flatRows.length;c++){let u=this.flatRows[c];if(u.type==="header")r+=`<div class="blib-letter-header" style="height:${u.height}px">${l(u.letter)}</div>`;else{r+=`<div class="${p==="list"?"blib-list-rows":"blib-grid"}">`;for(let H of u.items)r+=ut(H);r+="</div>"}}this.winEl.style.top=(this.flatRows[o]?.offset||0)+"px",this.winEl.innerHTML=r}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(i){for(let e of this.flatRows)if(e.type==="header"&&e.letter===i){let s=this._scrollEl;if(s!==window)s.scrollTop=e.offset;else{let a=this.container.getBoundingClientRect().top+window.scrollY+e.offset-120;window.scrollTo({top:a,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(i=>i.type==="header").map(i=>i.letter))}};function pt(t){let i=document.getElementById("blib-az-rail");if(!i)return;let e=t.getAvailableLetters();i.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(s=>`<button class="blib-az-btn${e.has(s)?"":" disabled"}" data-letter="${s}">${s}</button>`).join(""),i.addEventListener("click",s=>{let a=s.target.closest(".blib-az-btn");a&&!a.classList.contains("disabled")&&t.scrollToLetter(a.dataset.letter)})}function vt(t){let i=document.getElementById("blib-count");i&&(i.textContent=`${R(t)} albums`)}async function B(t){h&&(h.destroy(),h=null);let i=dt();if(vt(i.length),!i.length){t.innerHTML=`
      <div class="blib-empty">
        <div class="blib-empty-icon">\u{1F3B5}</div>
        <h3>Geen albums gevonden</h3>
        <p>${T?`Geen resultaten voor "<strong>${l(T)}</strong>"`:v?`Geen albums van <strong>${l(v)}</strong> in bibliotheek.`:"Plex bibliotheek is leeg of nog niet gesynchroniseerd."}</p>
      </div>`;return}if(h=new W(t,i),E==="artist"&&!T&&!v&&p==="grid")pt(h);else{let e=document.getElementById("blib-az-rail");e&&(e.innerHTML="")}}function P(){let t=document.getElementById("view-toolbar");t&&(t.innerHTML=`
    <div class="blib-toolbar">
      <input class="blib-search" id="blib-search" type="text"
        placeholder="\u{1F50D} Zoek artiest of album\u2026" autocomplete="off"
        value="${l(T)}">

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
    <div class="blib-az-rail" id="blib-az-rail"></div>`,mt())}function mt(){let t=()=>$();document.getElementById("blib-search")?.addEventListener("input",i=>{if(T=i.target.value,v&&(v=null,x="grid"),t()){let s=document.getElementById("blib-grid-wrap");s&&B(s)}}),document.getElementById("blib-btn-grid")?.addEventListener("click",()=>{if(p==="grid")return;p="grid",document.getElementById("blib-btn-grid")?.classList.add("active"),document.getElementById("blib-btn-list")?.classList.remove("active");let i=document.getElementById("blib-grid-wrap");i&&B(i)}),document.getElementById("blib-btn-list")?.addEventListener("click",()=>{if(p==="list")return;p="list",document.getElementById("blib-btn-list")?.classList.add("active"),document.getElementById("blib-btn-grid")?.classList.remove("active");let i=document.getElementById("blib-grid-wrap");i&&B(i)}),document.getElementById("blib-sort-select")?.addEventListener("change",i=>{E=i.target.value;let e=document.getElementById("blib-grid-wrap");e&&B(e)}),document.getElementById("btn-sync-plex-blib")?.addEventListener("click",async()=>{let i=document.getElementById("btn-sync-plex-blib");if(!i)return;let e=i.textContent;i.disabled=!0,i.textContent="\u21BB Bezig\u2026";try{try{await I("/api/plex/refresh",{method:"POST"})}catch(a){if(a.name!=="AbortError")throw a}await X(),A=null,await U();let s=document.getElementById("blib-grid-wrap");s&&B(s)}catch{}finally{i.disabled=!1,i.textContent=e}})}async function z(t){if(!t)return;x="grid",Z=null,K=null,t.scrollTop=0,t.innerHTML='<div id="blib-grid-wrap"></div>';let i=document.getElementById("blib-grid-wrap");await B(i)}async function gt(t){x="detail",Z=t;let i=$();if(!i)return;h&&(h.destroy(),h=null),i.scrollTop=0;let e=t.thumb?S(t.thumb,320):null,s=e?`<img src="${l(e)}" alt="${l(t.album)}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${f(t.album)}">${y(t.album)}</div>`:`<div class="blib-detail-cover-ph" style="background:${f(t.album)}">${y(t.album)}</div>`,a=it(),n=v?`<button class="blib-back-btn blib-back-artist" id="blib-back-to-artist">
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
            ${a?`<button class="blib-action-btn" id="blib-play-plex" title="Speel op Plex: ${l(a)}">
                   \u{1F50A} Speel op Plex
                 </button>`:""}
          </div>
        </div>
      </div>

      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div>Tracks laden\u2026</div>
      </div>
    </div>`,document.getElementById("blib-back-to-grid")?.addEventListener("click",()=>{v=null,P(),z($())}),document.getElementById("blib-back-to-artist")?.addEventListener("click",()=>{let o=v;P(),lt(o)}),document.getElementById("blib-play-all")?.addEventListener("click",()=>{t.ratingKey&&C(t.ratingKey,"music")}),document.getElementById("blib-play-plex")?.addEventListener("click",async()=>{if(t.ratingKey)try{await I("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ratingKey:t.ratingKey})})}catch(o){o.name!=="AbortError"&&w("Afspelen mislukt: "+o.message)}}),!t.ratingKey){let o=document.getElementById("blib-tracklist");o&&(o.innerHTML='<div class="blib-empty"><p>Geen ratingKey beschikbaar.</p></div>');return}try{let o=await g(`/api/plex/album/${encodeURIComponent(t.ratingKey)}/tracks`),d=document.getElementById("blib-tracklist");if(!d)return;let r=o.tracks||[];if(!r.length){d.innerHTML='<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';return}d.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+r.map((c,u)=>{let k=c.duration?Math.floor(c.duration/1e3):0,H=Math.floor(k/60),nt=String(k%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${l(c.ratingKey||"")}"
            data-track-title="${l(c.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${u+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${l(c.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">${l(c.title||"Onbekend")}</div>
          <div class="blib-track-duration">${k?`${H}:${nt}`:""}</div>
        </div>`}).join(""),d.addEventListener("click",c=>{let u=c.target.closest(".blib-track-play-btn"),k=(u?u.closest(".blib-track-row"):null)||c.target.closest(".blib-track-row");k?.dataset.trackKey&&C(k.dataset.trackKey,"music")})}catch{let d=document.getElementById("blib-tracklist");d&&(d.innerHTML='<div class="blib-empty"><p>Tracks laden mislukt.</p></div>')}}async function lt(t){x="artist",v=t;let i=$();if(!i)return;h&&(h.destroy(),h=null),i.scrollTop=0,T="";let e=document.getElementById("blib-search");e&&(e.value=""),i.innerHTML=`
    <div class="blib-artist-view">
      <div class="blib-artist-header">
        <button class="blib-back-btn" id="blib-artist-back">\u2190 Alle albums</button>
        <h2 class="blib-artist-title">Alle albums van ${l(t)}</h2>
      </div>
      <div id="blib-grid-wrap"></div>
    </div>`,document.getElementById("blib-artist-back")?.addEventListener("click",()=>{v=null,x="grid",P(),z($())});let s=document.getElementById("blib-grid-wrap");s&&await B(s)}async function ht(){let t=document.getElementById("sidebar-playlists");if(t){t.innerHTML='<div class="blib-sidebar-loading"><div class="spinner-sm"></div></div>';try{let i=await g("/api/plex/playlists"),e=i.playlists||i||[];if(!e.length){t.innerHTML='<div class="sidebar-empty">Geen afspeellijsten</div>';return}t.innerHTML=e.map(s=>{let a=l(s.ratingKey||s.key||""),n=l(s.title||"Playlist"),o=s.leafCount||s.trackCount||"";return`<button class="sidebar-playlist-item" role="listitem"
                data-playlist-key="${a}" data-playlist-title="${n}"
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
        ${o?`<span class="sidebar-playlist-count">${o}</span>`:""}
      </button>`}).join(""),t.addEventListener("click",s=>{let a=s.target.closest(".sidebar-playlist-item");a&&(t.querySelectorAll(".sidebar-playlist-item").forEach(n=>n.classList.toggle("active",n===a)),yt(a.dataset.playlistKey,a.dataset.playlistTitle))})}catch(i){i.name!=="AbortError"&&(t.innerHTML='<div class="sidebar-empty">Laden mislukt</div>')}}}async function yt(t,i){x="playlist",K=t;let e=$();if(e){h&&(h.destroy(),h=null),e.scrollTop=0,e.innerHTML=`
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
    </div>`,document.getElementById("blib-playlist-back")?.addEventListener("click",()=>{document.querySelectorAll(".sidebar-playlist-item").forEach(s=>s.classList.remove("active")),x="grid",K=null,z($())});try{let s=await g(`/api/plex/playlists/${encodeURIComponent(t)}/tracks`),a=document.getElementById("blib-playlist-tracks");if(!a)return;let n=s.tracks||[];if(!n.length){a.innerHTML='<div class="blib-empty"><p>Geen nummers in deze afspeellijst.</p></div>';return}document.getElementById("blib-playlist-play-all")?.addEventListener("click",()=>{n[0]?.ratingKey&&C(n[0].ratingKey,"music")}),a.innerHTML=`
      <div class="blib-track-header">
        <span class="blib-track-col-num">#</span>
        <span class="blib-track-col-title">Titel</span>
        <span class="blib-track-col-dur">Duur</span>
      </div>`+n.map((o,d)=>{let r=o.duration?Math.floor(o.duration/1e3):0,c=Math.floor(r/60),u=String(r%60).padStart(2,"0");return`<div class="blib-track-row"
            data-track-key="${l(o.ratingKey||"")}"
            data-track-title="${l(o.title||"")}">
          <div class="blib-track-num">
            <span class="blib-track-num-text">${d+1}</span>
            <button class="blib-track-play-btn" aria-label="Speel ${l(o.title||"")} af">\u25B6</button>
          </div>
          <div class="blib-track-title">
            <div>${l(o.title||"Onbekend")}</div>
            ${o.artist?`<div class="blib-track-artist">${l(o.artist)}</div>`:""}
          </div>
          <div class="blib-track-duration">${r?`${c}:${u}`:""}</div>
        </div>`}).join(""),a.addEventListener("click",o=>{let d=o.target.closest(".blib-track-play-btn"),r=(d?d.closest(".blib-track-row"):null)||o.target.closest(".blib-track-row");r?.dataset.trackKey&&C(r.dataset.trackKey,"music")})}catch{let a=document.getElementById("blib-playlist-tracks");a&&(a.innerHTML='<div class="blib-empty"><p>Laden mislukt.</p></div>')}}}function Ft(t,i){return""}function Dt(t){let i=t.target.closest(".blib-play-btn");if(i){t.stopPropagation();let n=i.closest(".blib-album");return n?.dataset.ratingKey&&C(n.dataset.ratingKey,"music"),!0}let e=t.target.closest(".blib-track-play-btn");if(e){t.stopPropagation();let n=e.closest(".blib-track-row");return n?.dataset.trackKey&&C(n.dataset.trackKey,"music"),!0}let s=t.target.closest(".blib-artist-filter-btn");if(s){t.stopPropagation();let n=s.dataset.artistFilter;return n&&lt(n),!0}let a=t.target.closest(".blib-album");return a?.dataset.ratingKey?(gt({ratingKey:a.dataset.ratingKey,album:a.dataset.album,artist:a.dataset.artist,thumb:a.dataset.thumb}),!0):!!(t.target.closest("#blib-back-to-grid")||t.target.closest("#blib-artist-back")||t.target.closest("#blib-playlist-back")||t.target.closest("#blib-back-to-artist"))}async function Wt(){try{if(await U(),x==="grid"){let t=document.getElementById("blib-grid-wrap");t&&B(t)}}catch(t){t.name!=="AbortError"&&w(t.message)}}async function ft(){tt(),x="grid",v=null,Z=null,K=null,P(),ht().catch(()=>{});let t=$();if(t){t.scrollTop=0,t.innerHTML=`<div class="loading" role="status">
    <div class="spinner" aria-hidden="true"></div>Bibliotheek laden\u2026
  </div>`;try{await U(),await z(t)}catch(i){i.name!=="AbortError"&&w(i.message)}}}async function Zt(t){if(b.bibSubTab=t,t==="collectie")await ft();else if(t==="lijst"){let i=$();if(i){b.sectionContainerEl=i;try{await et()}finally{b.sectionContainerEl===i&&(b.sectionContainerEl=null)}}}}async function Ut(t){L();let i=b.tabAbort?.signal;try{let e=`topartists:${t}`,s=M(e,300*1e3);if(!s){if(s=await g(`/api/topartists?period=${t}`,{signal:i}),i?.aborted)return;_(e,s)}let a=s.topartists?.artist||[];if(!a.length){m('<div class="empty">Geen data.</div>');return}let n=parseInt(a[0]?.playcount||1),o=`<div class="section-title">Top artiesten \xB7 ${j(t)}</div><div class="artist-grid">`;for(let d=0;d<a.length;d++){let r=a[d],c=Math.round(parseInt(r.playcount)/n*100),u=G(r.image,"large")||G(r.image),k=S(u,120)||u,H=k?`<img src="${k}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${f(r.name,!0)}">${y(r.name)}</div>`:`<div class="ag-photo-ph" style="background:${f(r.name,!0)}">${y(r.name)}</div>`;o+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${d}" style="view-transition-name: artist-${Q(r.name)}">${H}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${l(r.name)}">${l(r.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${c}%"></div></div>
          <div class="ag-plays">${R(r.playcount)} plays</div>
        </div></div>`}m(o+"</div>"),await q(a.map((d,r)=>async()=>{try{let c=await g(`/api/artist/${encodeURIComponent(d.name)}/info`);if(c.image){let u=document.getElementById(`agp-${r}`);u&&(u.innerHTML=`<img src="${S(c.image,120)||c.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}}),4)}catch(e){if(e.name==="AbortError")return;w(e.message)}}async function qt(t){L();let i=b.tabAbort?.signal;try{let e=`toptracks:${t}`,s=M(e,300*1e3);if(!s){if(s=await g(`/api/toptracks?period=${t}`,{signal:i}),i?.aborted)return;_(e,s)}let a=s.toptracks?.track||[];if(!a.length){m('<div class="empty">Geen data.</div>');return}let n=parseInt(a[0]?.playcount||1),o=`<div class="section-title">Top nummers \xB7 ${j(t)}</div><div class="card-list">`;for(let d of a){let r=Math.round(parseInt(d.playcount)/n*100);o+=`<div class="card">${O(d.image)}<div class="card-info">
        <div class="card-title">${l(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(d.artist?.name||"")}">${l(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${r}%"></div></div>
        </div><div class="card-meta">${R(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${l(d.artist?.name||"")}" data-track="${l(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}m(o+"</div>")}catch(e){if(e.name==="AbortError")return;w(e.message)}}async function Nt(){L();let t=b.tabAbort?.signal;try{let i=M("loved",6e5);if(!i){if(i=await g("/api/loved",{signal:t}),t?.aborted)return;_("loved",i)}let e=i.lovedtracks?.track||[];if(!e.length){m('<div class="empty">Geen geliefde nummers.</div>');return}let s='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let a of e){let n=a.date?.uts?N(parseInt(a.date.uts)):"";s+=`<div class="card">${O(a.image)}<div class="card-info">
        <div class="card-title">${l(a.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(a.artist?.name||"")}">${l(a.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${l(a.artist?.name||"")}" data-track="${l(a.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}m(s+"</div>")}catch(i){if(i.name==="AbortError")return;w(i.message)}}async function Vt(){L("Statistieken ophalen...");let t=b.tabAbort?.signal;try{let i=M("stats",6e5);if(!i){if(i=await g("/api/stats",{signal:t}),t?.aborted)return;_("stats",i)}m(`
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
      </div>`,()=>wt(i))}catch(i){if(i.name==="AbortError")return;w(i.message)}}function wt(t){if(typeof Chart>"u")return;let i=!window.matchMedia("(prefers-color-scheme: light)").matches,e=i?"#2c2c2c":"#ddd",s=i?"#888":"#777",a=i?"#efefef":"#111";Chart.defaults.color=s,Chart.defaults.borderColor=e;let n=document.getElementById("chart-daily");n&&new Chart(n,{type:"bar",data:{labels:t.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:t.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:s}},y:{grid:{color:e},ticks:{color:s},beginAtZero:!0}}}});let o=document.getElementById("chart-top");o&&t.topArtists?.length&&new Chart(o,{type:"bar",data:{labels:t.topArtists.map(r=>r.name),datasets:[{data:t.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:e},ticks:{color:s},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:a,font:{size:11}}}}}});let d=document.getElementById("chart-genres");if(d&&t.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(d,{type:"doughnut",data:{labels:t.genres.map(c=>c.name),datasets:[{data:t.genres.map(c=>c.count),backgroundColor:r.slice(0,t.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:s,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function kt(){L("Collectiegaten zoeken...");let t=b.tabAbort?.signal;try{let i=await g("/api/gaps",{signal:t});if(t?.aborted)return;if(i.status==="building"&&(!i.artists||!i.artists.length)){m(`<div class="loading"><div class="spinner"></div>
        <div>${l(i.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{b.activeSubTab==="gaten"&&kt()},2e4);return}if(b.lastGaps=i,$t(),i.builtAt&&Date.now()-i.builtAt>864e5){let e=document.createElement("div");e.className="refresh-banner",e.textContent="\u21BB Gaps worden op de achtergrond ververst...";let s=b.sectionContainerEl||document.getElementById("content");s&&s.prepend(e),fetch("/api/gaps/refresh",{method:"POST"}).catch(()=>{})}}catch(i){if(i.name==="AbortError")return;w(i.message)}}function At(t){let i=Math.max(0,Number(t.ownedCount)||0),e=Math.max(0,Number(t.missingCount??t.missingAlbums?.length)||0),s=Math.max(i+e,1),a=Math.round(i/s*100),n=S(t.image,64)||t.image,o=n?`<img class="gaps-photo" src="${l(n)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${f(t.name)}">${y(t.name)}</div>`:`<div class="gaps-photo-ph" style="background:${f(t.name)}">${y(t.name)}</div>`,d=t.missingAlbums||[],r=d.map(c=>{let u=S(c.image,160)||c.image,h=u?`<img class="gaps-album-cover" src="${l(u)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="gaps-album-cover gaps-album-cover-ph">♪</div>';return`<article class="gaps-album-card">
          <div class="gaps-album-art">${h}</div>
          <div class="gaps-album-title" title="${l(c.album||'')} ">${l(c.album||'')}</div>
          <div class="gaps-album-year">${c.year?l(String(c.year)):''}</div>
          <button class="tool-btn gaps-download-btn download-btn" data-dlartist="${l(t.name)}" data-dlalbum="${l(c.album||'')}" type="button">Download</button>
        </article>`}).join('');
return`<details class="gaps-artist-row">
      <summary class="gaps-row-summary">
        <div class="gaps-row-left">${o}
          <div class="gaps-row-main">
            <div class="gaps-row-title"><span class="gaps-artist-name artist-link" data-artist="${l(t.name)}">${l(t.name)}</span></div>
            <div class="gaps-row-meta">${i} van ${s} albums</div>
            <div class="gaps-progress" aria-label="${i} van ${s} albums">
              <div class="gaps-progress-owned" style="width:${a}%"></div>
            </div>
          </div>
        </div>
        <button class="tool-btn gaps-download-all" data-artist="${l(t.name)}" type="button">Download alle gaps van ${l(t.name)}</button>
      </summary>
      <div class="gaps-row-body">
        <div class="gaps-album-grid">${r}</div>
      </div>
    </details>`}
function $t(){if(!b.lastGaps)return;let t=[...b.lastGaps.artists||[]],i=(document.getElementById("gaps-search")?.value||"").toLowerCase().trim();i&&(t=t.filter(n=>String(n.name||"").toLowerCase().includes(i))),b.gapsSort==="name"?t.sort((n,o)=>String(n.name||"").localeCompare(String(o.name||""),"nl",{sensitivity:"base"})):t.sort((n,o)=>(o.missingCount??o.missingAlbums?.length??0)-(n.missingCount??n.missingAlbums?.length??0));let e=t.reduce((n,o)=>n+(o.missingCount??o.missingAlbums?.length??0),0),s=document.getElementById("badge-gaps");if(s&&(s.textContent=e),!t.length){m('<div class="empty">Geen collectiegaten gevonden voor deze filter.</div>');return}let a=`<div class="gaps-view-head">
      <div>
        <div class="section-title">${e} ontbrekende albums bij ${t.length} artiesten</div>
      </div>
      <div class="inline-toolbar gaps-inline-toolbar">
        <input id="gaps-search" class="gaps-search" type="search" placeholder="Zoek artiest…" value="${l(i)}" />
        <button class="tool-btn${b.gapsSort==="missing"?" sel-def":""}" data-gsort="missing">Meest ontbrekend</button>
        <button class="tool-btn${b.gapsSort==="name"?" sel-def":""}" data-gsort="name">A-Z</button>
        <button class="tool-btn" id="gaps-refresh-btn">↻ Vernieuwen</button>
      </div>
    </div>
    <div class="gaps-list">${t.map(At).join("")}</div>`;m(a);let n=document.getElementById("gaps-search");n&&n.addEventListener("input",()=>{$t()}),document.getElementById("gaps-refresh-btn")?.addEventListener("click",async()=>{b.lastGaps=null;try{await I("/api/gaps/refresh",{method:"POST"})}catch(o){if(o.name!=="AbortError")throw o}await kt()});let o=document.querySelectorAll(".gaps-download-all");o.forEach(d=>{d.addEventListener("click",async r=>{r.preventDefault(),r.stopPropagation();let c=d.dataset.artist||"",u=t.find(H=>H.name===c);if(!u?.missingAlbums?.length)return;d.disabled=!0;let h=d.textContent;d.textContent="⬇ Bezig...";for(let H of u.missingAlbums){let P=document.querySelector(`.gaps-download-btn[data-dlartist="${CSS.escape(c)}"][data-dlalbum="${CSS.escape(H.album||'')}"]`);if(P&&!P.classList.contains("dl-done")){P.textContent="⬇ Bezig...";P.disabled=!0;await j(c,H.album||"",P);P.textContent=P.classList.contains("dl-done")?"✓ Toegevoegd":"Download";P.disabled=!1}}d.textContent="✓ Toegevoegd"})})}}export{rt as a,D as b,Bt as c,et as d,Ft as e,Dt as f,Wt as g,ft as h,Zt as i,Ut as j,qt as k,Nt as l,Vt as m,wt as n,kt as o,$t as p};
