import{i as y,n as v}from"./chunk-DNLDPMEE.js";import{A as z,e as x,g as E,h as _,i as n,k}from"./chunk-G2KURTNZ.js";var h=null,g=null,m="",b="artist",d="grid",L=null,C=0,I=210,H=3;function p(){return document.getElementById("content")}function R(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}function D(t){if(!t)return"-";let e=Math.floor(t/60),s=t%60;return`${e}:${s.toString().padStart(2,"0")}`}async function K(t){L=t;let e=p();if(!e)return;C=e.scrollTop||0,await P()}function B(){L=null;let t=p();if(t){let e=S(h||[]);t.innerHTML=`
      <div style="display: flex; gap: 8px; flex: 1;">
        <div style="flex: 1;" id="albums-container"></div>
        <div id="albums-az-rail" class="albums-az-rail"></div>
      </div>
    `;let s=t.querySelector("#albums-container");s&&T(s,e).then(()=>{setTimeout(()=>{t.scrollTop=C},0)})}}async function P(){let t=p();if(!t||!L)return;let e=L,s=e.thumb?x(e.thumb,320):null,a=y(),l=[];try{let r=await z(`/api/plex/album/${e.ratingKey}/tracks`);r&&Array.isArray(r.tracks)&&(l=r.tracks)}catch(r){console.error("Error loading album tracks:",r)}let i=l.length?`<div class="album-detail-tracks">
         <h2 style="margin: 32px 0 20px 0; font-family: Georgia, serif; font-size: 20px; font-weight: 400;">Nummers</h2>
         <div class="album-detail-tracklist">
           ${l.map((r,c)=>`
             <div class="album-track" data-rating-key="${n(r.ratingKey)}">
               <div class="album-track-num">${c+1}</div>
               <div class="album-track-title">${n(r.title)}</div>
               <div class="album-track-duration">${D(r.duration)}</div>
               <button class="album-track-play" title="Play track">\u25B6</button>
             </div>
           `).join("")}
         </div>
       </div>`:"";t.innerHTML=`
    <div class="album-detail-view">
      <!-- Header: Back button -->
      <button class="album-detail-back" title="Terug naar albums">\u2190 Alle albums</button>

      <!-- Hero Section -->
      <div class="album-detail-hero">
        <div class="album-detail-cover-wrapper">
          ${s?`<img src="${n(s)}" alt="${n(e.album)}" class="album-detail-cover">`:`<div class="album-detail-cover-ph" style="background:${k(e.album)}">${E(e.album)}</div>`}
        </div>
        <div class="album-detail-info">
          <h1>${n(e.album)}</h1>
          <button class="album-detail-artist-link" data-artist="${n(e.artist)}">${n(e.artist)}</button>
          <div class="album-detail-buttons">
            <button class="album-detail-play-btn">\u25B6 Speel album af</button>
            ${a?'<button class="album-detail-plex-btn">\u{1F50A} Speel op Plex</button>':""}
          </div>
        </div>
      </div>

      <!-- Tracklist -->
      ${i}
    </div>
  `,q(e,l)}function q(t,e){let s=p();if(!s)return;s.querySelectorAll(".album-track").forEach(r=>{r.addEventListener("mouseenter",()=>{let c=r.querySelector(".album-track-num"),u=r.querySelector(".album-track-play");c&&(c.style.opacity="0"),u&&(u.style.opacity="1")}),r.addEventListener("mouseleave",()=>{let c=r.querySelector(".album-track-num"),u=r.querySelector(".album-track-play");c&&(c.style.opacity="1"),u&&(u.style.opacity="0")})});let l=s.querySelector(".album-detail-play-btn"),i=s.querySelector(".album-detail-plex-btn");l&&l.addEventListener("click",async()=>{y()&&await v(t.ratingKey,"music")}),i&&i.addEventListener("click",async()=>{y()&&await v(t.ratingKey,"music")})}function S(t){let e=t;if(m.trim()){let a=m.toLowerCase();e=e.filter(l=>l.artist.toLowerCase().includes(a)||l.album.toLowerCase().includes(a))}let s=[...e];switch(b){case"artist-za":s.sort((a,l)=>{let i=l.artist.localeCompare(a.artist);return i!==0?i:l.album.localeCompare(a.album)});break;case"album":s.sort((a,l)=>a.album.localeCompare(l.album));break;case"album-za":s.sort((a,l)=>l.album.localeCompare(a.album));break;case"recent":s.sort((a,l)=>(l.addedAt||0)-(a.addedAt||0));break;case"artist":default:s.sort((a,l)=>{let i=a.artist.localeCompare(l.artist);return i!==0?i:a.album.localeCompare(l.album)});break}return s}async function Z(){if(h)return h;try{let t=await z("/api/plex/library/all");return!t||!t.library?(console.warn("Albums API response is null/undefined:",t),[]):Array.isArray(t.library)?t.library.length?(h=t.library.map(([e,s,a,l,i])=>({artist:e||"",album:s||"",ratingKey:a||"",thumb:l||"",addedAt:i||0})),h):[]:(console.warn("Library is not an array:",t.library),[])}catch(t){return console.error("Error loading albums:",t),[]}}function F(t){let e=new Map;for(let s of t){let a=(s.artist[0]||"#").toUpperCase(),l=/[A-Z]/.test(a)?a:"#";e.has(l)||e.set(l,[]),e.get(l).push(s)}return e}function G(t){let e=t.thumb?x(t.thumb,240):null,s=e?`<img src="${n(e)}" alt="${n(t.album)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="albums-cover-ph" style="display:none;background:${k(t.album)}">${E(t.album)}</div>`:`<div class="albums-cover-ph" style="background:${k(t.album)}">${E(t.album)}</div>`;return`<div class="albums-album"
    data-rating-key="${n(t.ratingKey)}"
    data-album="${n(t.album)}"
    data-artist="${n(t.artist)}"
    data-thumb="${n(t.thumb||"")}">
    <div class="albums-cover">
      ${s}
      <div class="albums-play-overlay"><button class="albums-play-btn" title="Play">\u25B6</button></div>
    </div>
    <div class="albums-album-title" title="${n(t.album)}">${n(t.album)}</div>
    <button class="albums-artist-btn" title="${n(t.artist)}">${n(t.artist)}</button>
  </div>`}var A=class{constructor(e,s){this.container=e,this.items=s,this.cols=R(),this.rowH=I,this.lastStart=-1,this.lastEnd=-1,this.groups=F(s),this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=p()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let e=[],s=0;if(this.groups)for(let[a,l]of this.groups){e.push({type:"header",letter:a,height:40,offset:s}),s+=40;for(let i=0;i<l.length;i+=this.cols)e.push({type:"items",items:l.slice(i,i+this.cols),height:this.rowH,offset:s}),s+=this.rowH}else for(let a=0;a<this.items.length;a+=this.cols)e.push({type:"items",items:this.items.slice(a,a+this.cols),height:this.rowH,offset:s}),s+=this.rowH;return this.totalHeight=s,e}_createDOM(){this.container.innerHTML=`<div class="albums-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="albums-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".albums-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let e=R();if(e!==this.cols){this.cols=e,this.flatRows=this._buildFlatRows();let s=this.container.querySelector(".albums-virtual-container");s&&(s.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let e=this._getScrollTop(),s=this._getViewHeight(),a=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),l=e-a,i=H*this.rowH,r=0,c=this.flatRows.length-1;for(let o=0;o<this.flatRows.length;o++){let f=this.flatRows[o];if(f.offset+f.height>=l-i){r=Math.max(0,o-H);break}}for(let o=r;o<this.flatRows.length;o++)if(this.flatRows[o].offset>l+s+i){c=o;break}if(r===this.lastStart&&c===this.lastEnd)return;this.lastStart=r,this.lastEnd=c;let u="";for(let o=r;o<=c&&o<this.flatRows.length;o++){let f=this.flatRows[o];if(f.type==="header")u+=`<div class="albums-letter-header" style="height:${f.height}px">${n(f.letter)}</div>`;else{u+=`<div class="albums-grid" style="--album-cols:${this.cols}">`;for(let M of f.items)u+=G(M);u+="</div>"}}this.winEl.style.top=(this.flatRows[r]?.offset||0)+"px",this.winEl.innerHTML=u}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(e){for(let s of this.flatRows)if(s.type==="header"&&s.letter===e){let a=this._scrollEl;if(a!==window)a.scrollTop=s.offset;else{let l=this.container.getBoundingClientRect().top+window.scrollY+s.offset-120;window.scrollTo({top:l,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(e=>e.type==="header").map(e=>e.letter))}};function V(t){let e=document.getElementById("albums-az-rail");if(!e)return;let s=d==="grid"&&b.startsWith("artist")&&!m.trim();if(e.style.display=s?"flex":"none",!s){e.innerHTML="";return}let a=t.getAvailableLetters();e.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(l=>`<button class="albums-az-btn${a.has(l)?"":" disabled"}" data-letter="${l}">${l}</button>`).join(""),e.addEventListener("click",l=>{let i=l.target.closest(".albums-az-btn");i&&!i.classList.contains("disabled")&&t.scrollToLetter(i.dataset.letter)})}function O(t){let e=document.getElementById("albums-count");e&&(e.textContent=`${_(t)} albums`)}function $(){let t=document.getElementById("view-toolbar");if(!t)return;let e=S(h||[]).length;t.innerHTML=`
    <div class="albums-toolbar-header">
      <div>
        <h1 style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 32px; font-weight: 400;">My Albums</h1>
        <p style="margin: 0; font-size: 13px; color: var(--text-muted);" id="albums-count">${_(e)} albums</p>
      </div>
    </div>
    <div class="albums-toolbar">
      <input class="albums-search" id="albums-search" type="text"
        placeholder="\u{1F50D} Zoek artiest of album\u2026" autocomplete="off"
        value="${n(m)}">

      <div class="albums-toolbar-sep"></div>

      <div class="albums-view-toggle" role="group" aria-label="Weergavemodus">
        <button class="albums-pill${d==="grid"?" active":""}" id="albums-btn-grid"
                title="Grid weergave" aria-pressed="${d==="grid"}">\u229E</button>
        <button class="albums-pill${d==="list"?" active":""}" id="albums-btn-list"
                title="Lijst weergave" aria-pressed="${d==="list"}">\u2630</button>
      </div>

      <select class="albums-sort-select" id="albums-sort-select" aria-label="Sortering">
        <option value="artist"${b==="artist"?" selected":""}>Artiest A\u2013Z</option>
        <option value="artist-za"${b==="artist-za"?" selected":""}>Artiest Z\u2013A</option>
        <option value="album"${b==="album"?" selected":""}>Album A\u2013Z</option>
        <option value="album-za"${b==="album-za"?" selected":""}>Album Z\u2013A</option>
        <option value="recent"${b==="recent"?" selected":""}>Recent toegevoegd</option>
      </select>
    </div>
  `,U()}function U(){document.getElementById("albums-search")?.addEventListener("input",t=>{m=t.target.value,w()}),document.getElementById("albums-btn-grid")?.addEventListener("click",()=>{d!=="grid"&&(d="grid",$(),w())}),document.getElementById("albums-btn-list")?.addEventListener("click",()=>{d!=="list"&&(d="list",$(),w())}),document.getElementById("albums-sort-select")?.addEventListener("change",t=>{b=t.target.value,$(),w()})}function w(){let t=document.getElementById("albums-container");if(t){let e=S(h||[]);T(t,e)}}async function T(t,e){g&&(g.destroy(),g=null);let s=e||S(h||[]);if(O(s.length),!s.length){t.innerHTML=`
      <div class="albums-empty">
        <div class="albums-empty-icon">\u{1F3B5}</div>
        <h3>${m?"Geen resultaten gevonden":"No albums found"}</h3>
        <p>${m?"Probeer een ander zoekterm":"Plex library is empty or not yet synchronized."}</p>
      </div>`;return}g=new A(t,s),V(g)}async function Q(t){let e=t.target.closest(".albums-album");if(e&&!t.target.closest(".albums-play-btn")){let i={ratingKey:e.dataset.ratingKey,album:e.dataset.album,artist:e.dataset.artist,thumb:e.dataset.thumb};return await K(i),!0}let s=t.target.closest(".albums-play-btn");if(s){let i=s.closest(".albums-album");if(i){t.stopPropagation();let r=i.dataset.ratingKey;y()&&await v(r,"music")}return!0}if(t.target.closest(".album-detail-back"))return B(),!0;let a=t.target.closest(".album-detail-artist-link");if(a){m=a.dataset.artist,B();let i=document.getElementById("albums-search");return i&&(i.value=m),$(),w(),!0}let l=t.target.closest(".album-track-play");if(l){let i=l.closest(".album-track");if(i){t.stopPropagation();let r=i.dataset.ratingKey;await v(r,"music")}return!0}return!1}async function X(){let t=p();if(!t)return;document.title="Muziek \xB7 Albums";let e=await Z();if($(),t.innerHTML=`
    <div style="display: flex; gap: 8px; flex: 1;">
      <div style="flex: 1;" id="albums-container"></div>
      <div id="albums-az-rail" class="albums-az-rail"></div>
    </div>
  `,e&&e.length>0){let s=document.getElementById("albums-container");s&&await T(s)}else t.innerHTML=`
      <div class="albums-empty">
        <div class="albums-empty-icon">\u{1F3B5}</div>
        <h3>No albums found</h3>
        <p>Plex library is empty or not yet synchronized.</p>
      </div>`;}export{Q as handleAlbumsClick,X as loadAlbums};
