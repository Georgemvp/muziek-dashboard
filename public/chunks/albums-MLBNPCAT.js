import{i as T,n as y}from"./chunk-C6ZPWJ3O.js";import{A as k,e as S,g as $,h as _,i as n,k as E}from"./chunk-GHKYA3ZE.js";var h=null,g=null,m="",b="artist",d="grid",x=null,C=0,I=210,z=3;function f(){return document.getElementById("content")}function H(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}function D(t){if(!t)return"-";let e=Math.floor(t/60),s=t%60;return`${e}:${s.toString().padStart(2,"0")}`}async function K(t){x=t;let e=f();if(!e)return;C=e.scrollTop||0,await P()}function B(){x=null;let t=f();if(t){let e=L(h||[]);t.innerHTML=`
      <div style="display: flex; gap: 8px; flex: 1;">
        <div style="flex: 1;" id="albums-container"></div>
        <div id="albums-az-rail" class="albums-az-rail"></div>
      </div>
    `;let s=t.querySelector("#albums-container");s&&R(s,e).then(()=>{setTimeout(()=>{t.scrollTop=C},0)})}}async function P(){let t=f();if(!t||!x)return;let e=x,s=e.thumb?S(e.thumb,320):null,l=T(),a=[];try{let r=await k(`/api/plex/album/${e.ratingKey}/tracks`);r&&Array.isArray(r.tracks)&&(a=r.tracks)}catch(r){console.error("Error loading album tracks:",r)}let i=a.length?`<div class="album-detail-tracks">
         <h2 style="margin: 32px 0 20px 0; font-family: Georgia, serif; font-size: 20px; font-weight: 400;">Nummers</h2>
         <div class="album-detail-tracklist">
           ${a.map((r,o)=>`
             <div class="album-track" data-rating-key="${n(r.ratingKey)}">
               <div class="album-track-num">${o+1}</div>
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
          ${s?`<img src="${n(s)}" alt="${n(e.album)}" class="album-detail-cover">`:`<div class="album-detail-cover-ph" style="background:${E(e.album)}">${$(e.album)}</div>`}
        </div>
        <div class="album-detail-info">
          <h1>${n(e.album)}</h1>
          <button class="album-detail-artist-link" data-artist="${n(e.artist)}">${n(e.artist)}</button>
          <div class="album-detail-buttons">
            <button class="album-detail-play-btn">\u25B6 Speel album af</button>
            ${l?'<button class="album-detail-plex-btn">\u{1F50A} Speel op Plex</button>':""}
          </div>
        </div>
      </div>

      <!-- Tracklist -->
      ${i}
    </div>
  `,q(e,a)}function q(t,e){let s=f();if(!s)return;s.querySelectorAll(".album-track").forEach(r=>{r.addEventListener("mouseenter",()=>{let o=r.querySelector(".album-track-num"),u=r.querySelector(".album-track-play");o&&(o.style.opacity="0"),u&&(u.style.opacity="1")}),r.addEventListener("mouseleave",()=>{let o=r.querySelector(".album-track-num"),u=r.querySelector(".album-track-play");o&&(o.style.opacity="1"),u&&(u.style.opacity="0")})});let a=s.querySelector(".album-detail-play-btn"),i=s.querySelector(".album-detail-plex-btn");a&&a.addEventListener("click",async()=>{await y(t.ratingKey,"music")}),i&&i.addEventListener("click",async()=>{await y(t.ratingKey,"music")})}function L(t){let e=t;if(m.trim()){let l=m.toLowerCase();e=e.filter(a=>a.artist.toLowerCase().includes(l)||a.album.toLowerCase().includes(l))}let s=[...e];switch(b){case"artist-za":s.sort((l,a)=>{let i=a.artist.localeCompare(l.artist);return i!==0?i:a.album.localeCompare(l.album)});break;case"album":s.sort((l,a)=>l.album.localeCompare(a.album));break;case"album-za":s.sort((l,a)=>a.album.localeCompare(l.album));break;case"recent":s.sort((l,a)=>(a.addedAt||0)-(l.addedAt||0));break;case"artist":default:s.sort((l,a)=>{let i=l.artist.localeCompare(a.artist);return i!==0?i:l.album.localeCompare(a.album)});break}return s}async function Z(){if(h)return h;try{let t=await k("/api/plex/library/all");if(!t||!t.library)return console.warn("Albums API response is null/undefined:",t),[];if(!Array.isArray(t.library))return console.warn("Library is not an array:",t.library),[];if(!t.library.length)return[];let e=t.library.map(([l,a,i,r,o])=>({artist:l||"",album:a||"",ratingKey:i||"",thumb:r||"",addedAt:o||0,playcount:0})),s={};try{let l=await k("/api/top/albums?period=overall");l?.topalbums?.album&&l.topalbums.album.forEach(a=>{let i=`${(a.artist||"").toLowerCase()}|${(a.name||"").toLowerCase()}`;s[i]={playcount:a.playcount||0}})}catch(l){console.warn("Error loading Last.fm albums:",l)}return h=e.map(l=>{let a=`${l.artist.toLowerCase()}|${l.album.toLowerCase()}`,i=s[a];return{...l,playcount:i?.playcount||0}}),h}catch(t){return console.error("Error loading albums:",t),[]}}function F(t){let e=new Map;for(let s of t){let l=(s.artist[0]||"#").toUpperCase(),a=/[A-Z]/.test(l)?l:"#";e.has(a)||e.set(a,[]),e.get(a).push(s)}return e}function G(t){let e=t.thumb?S(t.thumb,240):null,s=e?`<img src="${n(e)}" alt="${n(t.album)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="albums-cover-ph" style="display:none;background:${E(t.album)}">${$(t.album)}</div>`:`<div class="albums-cover-ph" style="background:${E(t.album)}">${$(t.album)}</div>`,l=t.playcount&&t.playcount>0?`<span class="album-playcount-badge" style="position:absolute;top:8px;right:8px;background:var(--accent);color:white;font-size:11px;padding:4px 8px;border-radius:4px;font-weight:600;">${t.playcount}</span>`:"";return`<div class="albums-album"
    data-rating-key="${n(t.ratingKey)}"
    data-album="${n(t.album)}"
    data-artist="${n(t.artist)}"
    data-thumb="${n(t.thumb||"")}">
    <div class="albums-cover">
      ${s}
      ${l}
      <div class="albums-play-overlay"><button class="albums-play-btn" title="Play">\u25B6</button></div>
    </div>
    <div class="albums-album-title" title="${n(t.album)}">${n(t.album)}</div>
    <button class="albums-artist-btn" title="${n(t.artist)}">${n(t.artist)}</button>
  </div>`}var A=class{constructor(e,s){this.container=e,this.items=s,this.cols=H(),this.rowH=I,this.lastStart=-1,this.lastEnd=-1,this.groups=F(s),this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=f()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let e=[],s=0;if(this.groups)for(let[l,a]of this.groups){e.push({type:"header",letter:l,height:40,offset:s}),s+=40;for(let i=0;i<a.length;i+=this.cols)e.push({type:"items",items:a.slice(i,i+this.cols),height:this.rowH,offset:s}),s+=this.rowH}else for(let l=0;l<this.items.length;l+=this.cols)e.push({type:"items",items:this.items.slice(l,l+this.cols),height:this.rowH,offset:s}),s+=this.rowH;return this.totalHeight=s,e}_createDOM(){this.container.innerHTML=`<div class="albums-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="albums-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".albums-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let e=H();if(e!==this.cols){this.cols=e,this.flatRows=this._buildFlatRows();let s=this.container.querySelector(".albums-virtual-container");s&&(s.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let e=this._getScrollTop(),s=this._getViewHeight(),l=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),a=e-l,i=z*this.rowH,r=0,o=this.flatRows.length-1;for(let c=0;c<this.flatRows.length;c++){let p=this.flatRows[c];if(p.offset+p.height>=a-i){r=Math.max(0,c-z);break}}for(let c=r;c<this.flatRows.length;c++)if(this.flatRows[c].offset>a+s+i){o=c;break}if(r===this.lastStart&&o===this.lastEnd)return;this.lastStart=r,this.lastEnd=o;let u="";for(let c=r;c<=o&&c<this.flatRows.length;c++){let p=this.flatRows[c];if(p.type==="header")u+=`<div class="albums-letter-header" style="height:${p.height}px">${n(p.letter)}</div>`;else{u+=`<div class="albums-grid" style="--album-cols:${this.cols}">`;for(let M of p.items)u+=G(M);u+="</div>"}}this.winEl.style.top=(this.flatRows[r]?.offset||0)+"px",this.winEl.innerHTML=u}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(e){for(let s of this.flatRows)if(s.type==="header"&&s.letter===e){let l=this._scrollEl;if(l!==window)l.scrollTop=s.offset;else{let a=this.container.getBoundingClientRect().top+window.scrollY+s.offset-120;window.scrollTo({top:a,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(e=>e.type==="header").map(e=>e.letter))}};function V(t){let e=document.getElementById("albums-az-rail");if(!e)return;let s=d==="grid"&&b.startsWith("artist")&&!m.trim();if(e.style.display=s?"flex":"none",!s){e.innerHTML="";return}let l=t.getAvailableLetters();e.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(a=>`<button class="albums-az-btn${l.has(a)?"":" disabled"}" data-letter="${a}">${a}</button>`).join(""),e.addEventListener("click",a=>{let i=a.target.closest(".albums-az-btn");i&&!i.classList.contains("disabled")&&t.scrollToLetter(i.dataset.letter)})}function O(t){let e=document.getElementById("albums-count");e&&(e.textContent=`${_(t)} albums`)}function w(){let t=document.getElementById("view-toolbar");if(!t)return;let e=L(h||[]).length;t.innerHTML=`
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
  `,U()}function U(){document.getElementById("albums-search")?.addEventListener("input",t=>{m=t.target.value,v()}),document.getElementById("albums-btn-grid")?.addEventListener("click",()=>{d!=="grid"&&(d="grid",w(),v())}),document.getElementById("albums-btn-list")?.addEventListener("click",()=>{d!=="list"&&(d="list",w(),v())}),document.getElementById("albums-sort-select")?.addEventListener("change",t=>{b=t.target.value,w(),v()})}function v(){let t=document.getElementById("albums-container");if(t){let e=L(h||[]);R(t,e)}}async function R(t,e){g&&(g.destroy(),g=null);let s=e||L(h||[]);if(O(s.length),!s.length){t.innerHTML=`
      <div class="albums-empty">
        <div class="albums-empty-icon">\u{1F3B5}</div>
        <h3>${m?"Geen resultaten gevonden":"No albums found"}</h3>
        <p>${m?"Probeer een ander zoekterm":"Plex library is empty or not yet synchronized."}</p>
      </div>`;return}g=new A(t,s),V(g)}async function Q(t){let e=t.target.closest(".albums-album");if(e&&!t.target.closest(".albums-play-btn")){let i={ratingKey:e.dataset.ratingKey,album:e.dataset.album,artist:e.dataset.artist,thumb:e.dataset.thumb};return await K(i),!0}let s=t.target.closest(".albums-play-btn");if(s){let i=s.closest(".albums-album");if(i){t.stopPropagation();let r=i.dataset.ratingKey;try{await y(r,"music")}catch(o){console.error("Error playing album:",o)}}return!0}if(t.target.closest(".album-detail-back"))return B(),!0;let l=t.target.closest(".album-detail-artist-link");if(l){m=l.dataset.artist,B();let i=document.getElementById("albums-search");return i&&(i.value=m),w(),v(),!0}let a=t.target.closest(".album-track-play");if(a){let i=a.closest(".album-track");if(i){t.stopPropagation();let r=i.dataset.ratingKey;try{await y(r,"music")}catch(o){console.error("Error playing track:",o)}}return!0}return!1}async function X(){let t=f();if(!t)return;document.title="Muziek \xB7 Albums";let e=await Z();if(w(),t.innerHTML=`
    <div style="display: flex; gap: 8px; flex: 1;">
      <div style="flex: 1;" id="albums-container"></div>
      <div id="albums-az-rail" class="albums-az-rail"></div>
    </div>
  `,e&&e.length>0){let s=document.getElementById("albums-container");s&&await R(s)}else t.innerHTML=`
      <div class="albums-empty">
        <div class="albums-empty-icon">\u{1F3B5}</div>
        <h3>No albums found</h3>
        <p>Plex library is empty or not yet synchronized.</p>
      </div>`;}export{Q as handleAlbumsClick,X as loadAlbums};
