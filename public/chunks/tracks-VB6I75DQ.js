import{i as L,n as z}from"./chunk-P4AK6SM6.js";import{a as H}from"./chunk-NJVQXPXI.js";import{d as S,g as C,h as u,t as p,u as B,z as w}from"./chunk-E2KQEDIW.js";import{a as c}from"./chunk-2GHQROOJ.js";var i=null,I="",f="artist",m="asc",R="all";var b=0,E=0,x=!1,F=200,v=48,D=5,k=new Intl.Collator("nl",{sensitivity:"base"}),T=null;function A(){return document.getElementById("content")}function j(){return document.getElementById("view-toolbar")}function q(t){if(!t)return"-";let e=Math.floor(t/1e3),o=Math.floor(e/60),s=e%60;return`${o}:${s.toString().padStart(2,"0")}`}function V(){let t=A();if(!t)return 20;let e=t.clientHeight-100;return Math.ceil(e/v)+D*2}function g(t){return(t||"").toLowerCase().replace(/\(.*?\)/g,"").replace(/\[.*?\]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}function N(t,e){let o=new Map;(e||[]).forEach(r=>{let l=typeof r.artist=="object"?r.artist.name:r.artist,d=g(`${r.name}|${l}`);o.set(d,{...r,artist:l})});let s=new Set;(t||[]).forEach(r=>{let l=g(`${r.title}|${r.artist}`);s.add(l)});let a=(t||[]).map(r=>{let l=g(`${r.title}|${r.artist}`),d=o.get(l);return{...r,source:"plex",plays:d?.playcount||0,url:d?.url||null,inPlex:!0,sortKey:null}}),n=(e||[]).filter(r=>{let l=typeof r.artist=="object"?r.artist.name:r.artist,d=g(`${r.name}|${l}`);return!s.has(d)}).map(r=>{let l=typeof r.artist=="object"?r.artist.name:r.artist;return{ratingKey:null,title:r.name,artist:l,album:r.album||"",duration:0,thumb:null,source:"lastfm",plays:r.playcount,url:r.url,inPlex:!1,sortKey:null}});return{plex:a,lastfm:n,all:[...a,...n]}}function O(t){t.forEach(e=>{e.sortKey||(e.sortKey={artist:(e.artist||"").toLowerCase(),album:(e.album||"").toLowerCase(),title:(e.title||"").toLowerCase(),duration:e.duration||0})})}function _(t){let e=t.filter(a=>R==="plex-only"?a.inPlex:R==="lastfm-only"?!a.inPlex:!0);if(I){let a=I.toLowerCase().trim();e=e.filter(n=>n.title.toLowerCase().includes(a)||n.artist.toLowerCase().includes(a)||n.album.toLowerCase().includes(a))}O(e);let o=m==="asc",s=(a,n)=>{let r=0;switch(f){case"artist":r=k.compare(a.sortKey.artist,n.sortKey.artist)||k.compare(a.sortKey.album,n.sortKey.album)||k.compare(a.sortKey.title,n.sortKey.title);break;case"album":r=k.compare(a.sortKey.album,n.sortKey.album)||k.compare(a.sortKey.artist,n.sortKey.artist)||k.compare(a.sortKey.title,n.sortKey.title);break;case"length":r=a.sortKey.duration-n.sortKey.duration;break;case"track":default:r=k.compare(a.sortKey.title,n.sortKey.title)}return o?r:-r};return e.sort(s),e}function G(){let t=j(),e=i?.all?.length||0;t.innerHTML=`
    <div class="tracks-roon-header">
      <!-- Title & count -->
      <div class="tracks-roon-title">
        <h1>My Tracks</h1>
        <span class="tracks-roon-count">${C(e)} tracks</span>
      </div>

      <!-- Left actions: Focus + Heart -->
      <div class="tracks-roon-left-actions">
        <button class="tracks-focus-btn" title="Focus">
          Focus <span class="tracks-focus-arrow">\u203A</span>
        </button>
        <button class="tracks-heart-btn" title="Favorite">\u2661</button>
      </div>

      <!-- Right actions: Play now dropdown -->
      <button class="tracks-play-now-btn">
        \u25B6 Play now <span class="tracks-dropdown-arrow">\u25BC</span>
      </button>
    </div>
  `,t.querySelector(".tracks-focus-btn")?.addEventListener("click",()=>{}),t.querySelector(".tracks-heart-btn")?.addEventListener("click",()=>{}),t.querySelector(".tracks-play-now-btn")?.addEventListener("click",()=>{if(!L()){p("Selecteer eerst een Plex zone");return}})}async function M(){let t=A();if(!t||!i)return;G();let e=_(i.all);if(e.length===0){t.innerHTML=`
      <div class="tracks-empty">
        <div class="tracks-empty-icon">\u266A</div>
        <div class="tracks-empty-message">Geen sporen gevonden</div>
        <div class="tracks-empty-hint">Probeer andere zoekopdracht of filters</div>
      </div>
    `;return}t.innerHTML=`
    <div class="tracks-roon-container" id="tracks-roon-container" style="overflow-y: auto; position: relative; height: 100%; display: flex; flex-direction: column;">
      <div class="tracks-roon-header-wrapper" style="position: sticky; top: 0; z-index: 10; background: var(--bg-color, white);">
        <div class="tracks-roon-column-headers" style="display: grid; grid-template-columns: 3rem 4rem 1fr 2rem 4rem 8rem 10rem 2rem; gap: 0.5rem; padding: 0.5rem 1rem; border-bottom: 1px solid var(--border-color, #e0e0e0); font-weight: 500; font-size: 0.875rem;">
          <div class="tracks-col-num">#</div>
          <div class="tracks-col-art"></div>
          <div class="tracks-col-title" data-sort="track" style="cursor: pointer;">
            Track ${f==="track"?`<span class="tracks-sort-arrow">${m==="asc"?"\u2191":"\u2193"}</span>`:""}
          </div>
          <div class="tracks-col-heart">\u2661</div>
          <div class="tracks-col-length" data-sort="length" style="cursor: pointer;">
            Length ${f==="length"?`<span class="tracks-sort-arrow">${m==="asc"?"\u2191":"\u2193"}</span>`:""}
          </div>
          <div class="tracks-col-artist" data-sort="artist" style="cursor: pointer;">
            Artist ${f==="artist"?`<span class="tracks-sort-arrow">${m==="asc"?"\u2191":"\u2193"}</span>`:""}
          </div>
          <div class="tracks-col-album" data-sort="album" style="cursor: pointer;">
            Album ${f==="album"?`<span class="tracks-sort-arrow">${m==="asc"?"\u2191":"\u2193"}</span>`:""}
          </div>
          <div class="tracks-col-menu">\u2699\uFE0F</div>
        </div>
      </div>

      <div class="tracks-virtual-scroller" id="tracks-virtual-scroller" style="position: relative; flex: 1; overflow-y: auto;">
        <div class="tracks-virtual-spacer" id="tracks-virtual-spacer" style="position: relative; width: 100%;"></div>
        <div class="tracks-rows-container" id="tracks-rows-container" style="position: absolute; top: 0; left: 0; right: 0; width: 100%;"></div>
      </div>

      <div class="tracks-load-more-container" id="tracks-load-more-container" style="padding: 1rem; text-align: center; display: none;">
        <button class="tracks-load-more-btn" id="tracks-load-more-btn" style="padding: 0.5rem 1rem; cursor: pointer;">Load More Tracks</button>
      </div>
    </div>
  `;let o=document.getElementById("tracks-virtual-scroller"),s=document.getElementById("tracks-rows-container"),a=document.getElementById("tracks-virtual-spacer"),n=document.getElementById("tracks-roon-container"),r=e.length*v;a.style.height=r+"px";let l=t.querySelector(".tracks-roon-header-wrapper");l&&l.addEventListener("click",$=>{let y=$.target.closest("[data-sort]");if(y){let h=y.getAttribute("data-sort");f===h?m=m==="asc"?"desc":"asc":(f=h,m="asc"),M()}});function d(){let $=o.scrollTop,y=Math.max(0,Math.floor($/v)-D),h=Math.min(e.length,y+V());s.innerHTML=Z(e,y,h),s.style.transform=`translateY(${y*v}px)`,W(s,e)}d(),o.addEventListener("scroll",()=>{T&&cancelAnimationFrame(T),T=requestAnimationFrame(()=>{d()})});let P=document.getElementById("tracks-load-more-btn");P&&P.addEventListener("click",()=>{Q()}),K()}function Z(t,e,o=null){return o===null&&(o=Math.min(t.length,e+V())),t.slice(e,o).map((s,a)=>{let n=e+a,r=s.thumb?S(s.thumb,40):null,l=s.inPlex?'<span class="tracks-plex-pin" title="In Plex">\u{1F4CC}</span>':"";return`
      <div class="tracks-roon-row"
        data-idx="${n}"
        data-rating-key="${s.ratingKey||""}"
        data-track-idx="${n}"
        style="
          display: grid;
          grid-template-columns: 3rem 4rem 1fr 2rem 4rem 8rem 10rem 2rem;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          align-items: center;
          height: ${v}px;
          cursor: pointer;
        ">
        <div class="tracks-col-num">${n+1}</div>
        <div class="tracks-col-art">
          ${r?`<img src="${u(r)}" alt="album art" class="tracks-thumb" style="width: 100%; height: 100%; border-radius: 2px;">`:'<div class="tracks-thumb-placeholder">\u266A</div>'}
        </div>
        <div class="tracks-col-title">
          <span class="tracks-title-text">${u(s.title)}</span>
          ${l}
        </div>
        <div class="tracks-col-heart">
          <button class="tracks-heart-toggle" data-track-id="${u(s.title)}" title="Add to favorites" style="background: none; border: none; cursor: pointer; font-size: 1rem;">\u2661</button>
        </div>
        <div class="tracks-col-length">${q(s.duration)}</div>
        <div class="tracks-col-artist">
          <span class="tracks-artist-link" data-artist="${u(s.artist)}" style="cursor: pointer; text-decoration: underline;">${u(s.artist)}</span>
        </div>
        <div class="tracks-col-album">
          <span class="tracks-album-link" data-album="${u(s.album)}" style="cursor: pointer; text-decoration: underline;">${u(s.album)}</span>
        </div>
        <div class="tracks-col-menu">
          <button class="tracks-menu-btn" title="More options" style="background: none; border: none; cursor: pointer;">\u22EF</button>
        </div>
      </div>
    `}).join("")}function W(t,e){t.addEventListener("click",U,{capture:!1}),t.addEventListener("dblclick",Y,{capture:!1})}async function U(t){if(!t.target.closest(".tracks-roon-row"))return;let o=t.target.closest(".tracks-artist-link");if(o){t.stopPropagation();let r=o.getAttribute("data-artist");r&&H("artist-detail",{name:r});return}if(t.target.closest(".tracks-album-link")){t.stopPropagation();return}let a=t.target.closest(".tracks-heart-toggle");if(a){t.stopPropagation(),a.classList.toggle("loved");return}if(t.target.closest(".tracks-menu-btn")){t.stopPropagation();return}}async function Y(t){let e=t.target.closest(".tracks-roon-row");if(!e)return;t.preventDefault();let o=e.getAttribute("data-rating-key");if(!o)return;if(!L()){p("Selecteer eerst een Plex zone");return}try{await z(o,"music")}catch(a){p("Kan nummer niet afspelen: "+a.message)}}async function J(){c.tabAbort&&c.tabAbort.abort(),c.tabAbort=new AbortController;try{let[t,e]=await Promise.allSettled([w(`/api/plex/tracks?limit=${F}&offset=0`,{signal:c.tabAbort.signal}),w("/api/top/tracks?period=overall",{signal:c.tabAbort.signal})]);if(c.activeView!=="tracks")return;let o=t.status==="fulfilled"?t.value:{tracks:[],total:0},s=o.tracks||[];b=o.tracks?.length||0,E=o.total||0;let a=e.status==="fulfilled"?e.value?.toptracks?.track||e.value?.track||[]:[];if(i=N(s,a),i.all.length===0){p("Geen sporen gevonden. Controleer of Plex en Last.fm geconfigureerd zijn.");return}await M(),document.title="Muziek \xB7 Tracks"}catch(t){t.name!=="AbortError"&&p("Kan tracks niet laden: "+t.message)}}async function Q(){if(!(x||b>=E)){x=!0,c.tabAbort&&c.tabAbort.abort(),c.tabAbort=new AbortController;try{let t=await w(`/api/plex/tracks?limit=${F}&offset=${b}`,{signal:c.tabAbort.signal});if(c.activeView!=="tracks")return;let e=t.tracks||[];if(e.length===0){x=!1,K();return}let o=new Map;(i.lastfm||[]).forEach(a=>{let n=typeof a.artist=="object"?a.artist.name:a.artist,r=g(`${a.title}|${n}`);o.set(r,a)});let s=e.map(a=>{let n=g(`${a.title}|${a.artist}`),r=o.get(n);return{...a,source:"plex",plays:r?.playcount||0,url:r?.url||null,inPlex:!0,sortKey:null}});i.plex.push(...s),i.all=[...i.plex,...i.lastfm],b+=e.length,await M(),K()}catch(t){t.name!=="AbortError"&&p("Kan meer tracks niet laden: "+t.message)}finally{x=!1}}}function K(){let t=document.getElementById("tracks-load-more-container");t&&(b<E?t.style.display="block":t.style.display="none")}async function st(){A()&&(B(),await J())}export{st as loadTracks};
