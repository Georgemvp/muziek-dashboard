import{i as z,n as y}from"./chunk-L7FPKZB5.js";import{a as A}from"./chunk-WPZHVBO7.js";import{d as S,f as v,g as _,h as o,j as w,z as $}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var b=null,g=null,h="",m="artist",d="grid",x=null,C=0,D=210,H=3;function f(){return document.getElementById("content")}function B(){let t=window.innerWidth;return t>=1600?8:t>=1300?7:t>=1050?6:t>=850?5:t>=650?4:t>=480?3:2}function I(t){if(!t)return"-";let e=Math.floor(t/60),a=t%60;return`${e}:${a.toString().padStart(2,"0")}`}async function K(t){x=t;let e=f();if(!e)return;C=e.scrollTop||0,await q()}function P(){x=null;let t=f();if(t){let e=L(b||[]);t.innerHTML=`
      <div style="display: flex; gap: 8px; flex: 1;">
        <div style="flex: 1;" id="albums-container"></div>
        <div id="albums-az-rail" class="albums-az-rail"></div>
      </div>
    `;let a=t.querySelector("#albums-container");a&&T(a,e).then(()=>{setTimeout(()=>{t.scrollTop=C},0)})}}async function q(){let t=f();if(!t||!x)return;let e=x,a=e.thumb?S(e.thumb,320):null,l=z(),s=[];try{let i=await $(`/api/plex/album/${e.ratingKey}/tracks`);i&&Array.isArray(i.tracks)&&(s=i.tracks)}catch(i){console.error("Error loading album tracks:",i)}let r=s.length?`<div class="album-detail-tracks">
         <h2 style="margin: 32px 0 20px 0; font-family: Georgia, serif; font-size: 20px; font-weight: 400;">Nummers</h2>
         <div class="album-detail-tracklist">
           ${s.map((i,n)=>`
             <div class="album-track" data-rating-key="${o(i.ratingKey)}">
               <div class="album-track-num">${n+1}</div>
               <div class="album-track-title">${o(i.title)}</div>
               <div class="album-track-duration">${I(i.duration)}</div>
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
          ${a?`<img src="${o(a)}" alt="${o(e.album)}" class="album-detail-cover" loading="lazy" decoding="async">`:`<div class="album-detail-cover-ph" style="background:${w(e.album)}">${v(e.album)}</div>`}
        </div>
        <div class="album-detail-info">
          <h1>${o(e.album)}</h1>
          <button class="album-detail-artist-link" data-artist="${o(e.artist)}">${o(e.artist)}</button>
          <div class="album-detail-buttons">
            <button class="album-detail-play-btn">\u25B6 Speel album af</button>
            ${l?'<button class="album-detail-plex-btn">\u{1F50A} Speel op Plex</button>':""}
          </div>
        </div>
      </div>

      <!-- Tracklist -->
      ${r}
    </div>
  `,Z(e,s)}function Z(t,e){let a=f();if(!a)return;a.querySelectorAll(".album-track").forEach(i=>{i.addEventListener("mouseenter",()=>{let n=i.querySelector(".album-track-num"),c=i.querySelector(".album-track-play");n&&(n.style.opacity="0"),c&&(c.style.opacity="1")}),i.addEventListener("mouseleave",()=>{let n=i.querySelector(".album-track-num"),c=i.querySelector(".album-track-play");n&&(n.style.opacity="1"),c&&(c.style.opacity="0")})});let s=a.querySelector(".album-detail-play-btn"),r=a.querySelector(".album-detail-plex-btn");s&&s.addEventListener("click",async()=>{await y(t.ratingKey,"music")}),r&&r.addEventListener("click",async()=>{await y(t.ratingKey,"music")})}function L(t){let e=t;if(h.trim()){let l=h.toLowerCase();e=e.filter(s=>s.artist.toLowerCase().includes(l)||s.album.toLowerCase().includes(l))}let a=[...e];switch(m){case"artist-za":a.sort((l,s)=>{let r=s.artist.localeCompare(l.artist);return r!==0?r:s.album.localeCompare(l.album)});break;case"album":a.sort((l,s)=>l.album.localeCompare(s.album));break;case"album-za":a.sort((l,s)=>s.album.localeCompare(l.album));break;case"recent":a.sort((l,s)=>(s.addedAt||0)-(l.addedAt||0));break;case"artist":default:a.sort((l,s)=>{let r=l.artist.localeCompare(s.artist);return r!==0?r:l.album.localeCompare(s.album)});break}return a}async function F(){if(b)return b;try{let t=await $("/api/plex/library/all");if(!t||!t.library)return console.warn("Albums API response is null/undefined:",t),[];if(!Array.isArray(t.library))return console.warn("Library is not an array:",t.library),[];if(!t.library.length)return[];let e=t.library.map(([l,s,r,i,n])=>({artist:l||"",album:s||"",ratingKey:r||"",thumb:i||"",addedAt:n||0,playcount:0})),a={};try{let l=await $("/api/top/albums?period=overall");l?.topalbums?.album&&l.topalbums.album.forEach(s=>{let r=`${(s.artist||"").toLowerCase()}|${(s.name||"").toLowerCase()}`;a[r]={playcount:s.playcount||0}})}catch(l){console.warn("Error loading Last.fm albums:",l)}return b=e.map(l=>{let s=`${l.artist.toLowerCase()}|${l.album.toLowerCase()}`,r=a[s];return{...l,playcount:r?.playcount||0}}),b}catch(t){return console.error("Error loading albums:",t),[]}}function V(t){let e=new Map;for(let a of t){let l=(a.artist[0]||"#").toUpperCase(),s=/[A-Z]/.test(l)?l:"#";e.has(s)||e.set(s,[]),e.get(s).push(a)}return e}function G(t){let e=t.thumb?S(t.thumb,240):null,a=e?`<img src="${o(e)}" alt="${o(t.album)} by ${o(t.artist)}" loading="lazy" decoding="async"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="albums-cover-ph" style="display:none;background:${w(t.album)}">${v(t.album)}</div>`:`<div class="albums-cover-ph" style="background:${w(t.album)}">${v(t.album)}</div>`,l=t.playcount&&t.playcount>0?`<span class="album-playcount-badge" style="position:absolute;top:8px;right:8px;background:var(--accent);color:white;font-size:11px;padding:4px 8px;border-radius:4px;font-weight:600;">${t.playcount}</span>`:"";return`<div class="albums-album"
    data-rating-key="${o(t.ratingKey)}"
    data-album="${o(t.album)}"
    data-artist="${o(t.artist)}"
    data-thumb="${o(t.thumb||"")}">
    <div class="albums-cover">
      ${a}
      ${l}
      <div class="albums-play-overlay"><button class="albums-play-btn" title="Play">\u25B6</button></div>
    </div>
    <div class="albums-album-title" title="${o(t.album)}">${o(t.album)}</div>
    <button class="albums-artist-btn" title="${o(t.artist)}">${o(t.artist)}</button>
  </div>`}var R=class{constructor(e,a){this.container=e,this.items=a,this.cols=B(),this.rowH=D,this.lastStart=-1,this.lastEnd=-1,this.groups=V(a),this.flatRows=this._buildFlatRows(),this._createDOM(),this._scrollEl=f()||window,this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),this._scrollEl.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let e=[],a=0;if(this.groups)for(let[l,s]of this.groups){e.push({type:"header",letter:l,height:40,offset:a}),a+=40;for(let r=0;r<s.length;r+=this.cols)e.push({type:"items",items:s.slice(r,r+this.cols),height:this.rowH,offset:a}),a+=this.rowH}else for(let l=0;l<this.items.length;l+=this.cols)e.push({type:"items",items:this.items.slice(l,l+this.cols),height:this.rowH,offset:a}),a+=this.rowH;return this.totalHeight=a,e}_createDOM(){this.container.innerHTML=`<div class="albums-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="albums-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".albums-virtual-window")}_getScrollTop(){return this._scrollEl===window?window.scrollY||document.documentElement.scrollTop:this._scrollEl.scrollTop}_getViewHeight(){return this._scrollEl===window?window.innerHeight:this._scrollEl.clientHeight}_onScroll(){this.render()}_onResize(){let e=B();if(e!==this.cols){this.cols=e,this.flatRows=this._buildFlatRows();let a=this.container.querySelector(".albums-virtual-container");a&&(a.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let e=this._getScrollTop(),a=this._getViewHeight(),l=this.container.getBoundingClientRect().top+(this._scrollEl===window?window.scrollY:this._scrollEl.getBoundingClientRect().top+this._scrollEl.scrollTop),s=e-l,r=H*this.rowH,i=0,n=this.flatRows.length-1;for(let u=0;u<this.flatRows.length;u++){let p=this.flatRows[u];if(p.offset+p.height>=s-r){i=Math.max(0,u-H);break}}for(let u=i;u<this.flatRows.length;u++)if(this.flatRows[u].offset>s+a+r){n=u;break}if(i===this.lastStart&&n===this.lastEnd)return;this.lastStart=i,this.lastEnd=n;let c="";for(let u=i;u<=n&&u<this.flatRows.length;u++){let p=this.flatRows[u];if(p.type==="header")c+=`<div class="albums-letter-header" style="height:${p.height}px">${o(p.letter)}</div>`;else{c+=`<div class="albums-grid" style="--album-cols:${this.cols}">`;for(let M of p.items)c+=G(M);c+="</div>"}}this.winEl.style.top=(this.flatRows[i]?.offset||0)+"px",this.winEl.innerHTML=c}destroy(){this._scrollEl.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(e){for(let a of this.flatRows)if(a.type==="header"&&a.letter===e){let l=this._scrollEl;if(l!==window)l.scrollTop=a.offset;else{let s=this.container.getBoundingClientRect().top+window.scrollY+a.offset-120;window.scrollTo({top:s,behavior:"smooth"})}return}}getAvailableLetters(){return new Set(this.flatRows.filter(e=>e.type==="header").map(e=>e.letter))}};function N(t){let e=document.getElementById("albums-az-rail");if(!e)return;let a=d==="grid"&&m.startsWith("artist")&&!h.trim();if(e.style.display=a?"flex":"none",!a){e.innerHTML="";return}let l=t.getAvailableLetters();e.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(s=>`<button class="albums-az-btn${l.has(s)?"":" disabled"}" data-letter="${s}">${s}</button>`).join(""),e.addEventListener("click",s=>{let r=s.target.closest(".albums-az-btn");r&&!r.classList.contains("disabled")&&t.scrollToLetter(r.dataset.letter)})}function O(t){let e=document.getElementById("albums-count");e&&(e.textContent=`${_(t)} albums`)}function k(){let t=document.getElementById("view-toolbar");if(!t)return;let e=L(b||[]).length;t.innerHTML=`
    <div class="albums-toolbar-header">
      <div>
        <h1 style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 32px; font-weight: 400;">My Albums</h1>
        <p style="margin: 0; font-size: 13px; color: var(--text-muted);" id="albums-count">${_(e)} albums</p>
      </div>
    </div>
    <div class="albums-toolbar">
      <input class="albums-search" id="albums-search" type="text"
        placeholder="\u{1F50D} Zoek artiest of album\u2026" autocomplete="off"
        value="${o(h)}">

      <div class="albums-toolbar-sep"></div>

      <div class="albums-view-toggle" role="group" aria-label="Weergavemodus">
        <button class="albums-pill${d==="grid"?" active":""}" id="albums-btn-grid"
                title="Grid weergave" aria-pressed="${d==="grid"}">\u229E</button>
        <button class="albums-pill${d==="list"?" active":""}" id="albums-btn-list"
                title="Lijst weergave" aria-pressed="${d==="list"}">\u2630</button>
      </div>

      <select class="albums-sort-select" id="albums-sort-select" aria-label="Sortering">
        <option value="artist"${m==="artist"?" selected":""}>Artiest A\u2013Z</option>
        <option value="artist-za"${m==="artist-za"?" selected":""}>Artiest Z\u2013A</option>
        <option value="album"${m==="album"?" selected":""}>Album A\u2013Z</option>
        <option value="album-za"${m==="album-za"?" selected":""}>Album Z\u2013A</option>
        <option value="recent"${m==="recent"?" selected":""}>Recent toegevoegd</option>
      </select>
    </div>
  `,U()}function U(){document.getElementById("albums-search")?.addEventListener("input",t=>{h=t.target.value,E()}),document.getElementById("albums-btn-grid")?.addEventListener("click",()=>{d!=="grid"&&(d="grid",k(),E())}),document.getElementById("albums-btn-list")?.addEventListener("click",()=>{d!=="list"&&(d="list",k(),E())}),document.getElementById("albums-sort-select")?.addEventListener("change",t=>{m=t.target.value,k(),E()})}function E(){let t=document.getElementById("albums-container");if(t){let e=L(b||[]);T(t,e)}}async function T(t,e){g&&(g.destroy(),g=null);let a=e||L(b||[]);if(O(a.length),!a.length){t.innerHTML=`
      <div class="albums-empty">
        <div class="albums-empty-icon">\u{1F3B5}</div>
        <h3>${h?"Geen resultaten gevonden":"No albums found"}</h3>
        <p>${h?"Probeer een ander zoekterm":"Plex library is empty or not yet synchronized."}</p>
      </div>`;return}g=new R(t,a),N(g)}async function tt(t){let e=t.target.closest(".albums-artist-btn");if(e){t.stopPropagation();let n=e.closest(".albums-album")?.dataset.artist||e.title;return n&&A("artist-detail",{name:n}),!0}let a=t.target.closest(".albums-album");if(a&&!t.target.closest(".albums-play-btn")&&!t.target.closest(".albums-artist-btn")){let i={ratingKey:a.dataset.ratingKey,album:a.dataset.album,artist:a.dataset.artist,thumb:a.dataset.thumb};return await K(i),!0}let l=t.target.closest(".albums-play-btn");if(l){let i=l.closest(".albums-album");if(i){t.stopPropagation();let n=i.dataset.ratingKey;try{await y(n,"music")}catch(c){console.error("Error playing album:",c)}}return!0}if(t.target.closest(".album-detail-back"))return P(),!0;let s=t.target.closest(".album-detail-artist-link");if(s){let i=s.dataset.artist;return i&&A("artist-detail",{name:i}),!0}let r=t.target.closest(".album-track-play");if(r){let i=r.closest(".album-track");if(i){t.stopPropagation();let n=i.dataset.ratingKey;try{await y(n,"music")}catch(c){console.error("Error playing track:",c)}}return!0}return!1}async function et(){let t=f();if(!t)return;document.title="Muziek \xB7 Albums";let e=await F();if(k(),t.innerHTML=`
    <div style="display: flex; gap: 8px; flex: 1;">
      <div style="flex: 1;" id="albums-container"></div>
      <div id="albums-az-rail" class="albums-az-rail"></div>
    </div>
  `,e&&e.length>0){let a=document.getElementById("albums-container");a&&await T(a)}else t.innerHTML=`
      <div class="albums-empty">
        <div class="albums-empty-icon">\u{1F3B5}</div>
        <h3>No albums found</h3>
        <p>Plex library is empty or not yet synchronized.</p>
      </div>`;}export{tt as handleAlbumsClick,et as loadAlbums};
