import{a as $}from"./chunk-6YLQFTAJ.js";import{i as k,n as w}from"./chunk-C6ZPWJ3O.js";import{A as b,e as y,h as v,i,u,v as h}from"./chunk-GHKYA3ZE.js";var m=null,E="",p="artist",o="asc",L="all";var f=48,T=5;function g(){return document.getElementById("content")}function M(){return document.getElementById("view-toolbar")}function z(e){if(!e)return"-";let r=Math.floor(e/1e3),c=Math.floor(r/60),s=r%60;return`${c}:${s.toString().padStart(2,"0")}`}function P(){let e=g();if(!e)return 20;let r=e.clientHeight-100;return Math.ceil(r/f)+T*2}function d(e){return(e||"").toLowerCase().replace(/\(.*?\)/g,"").replace(/\[.*?\]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}function H(e,r){let c=new Map;(r||[]).forEach(t=>{let n=typeof t.artist=="object"?t.artist.name:t.artist,l=d(`${t.name}|${n}`);c.set(l,{...t,artist:n})});let s=(e||[]).map(t=>{let n=d(`${t.title}|${t.artist}`),l=c.get(n);return{...t,source:"plex",plays:l?.playcount||0,url:l?.url||null,inPlex:!0}}),a=(r||[]).filter(t=>{let n=typeof t.artist=="object"?t.artist.name:t.artist;return!e.find(l=>d(l.title)===d(t.name)&&d(l.artist)===d(n))}).map(t=>{let n=typeof t.artist=="object"?t.artist.name:t.artist;return{ratingKey:null,title:t.name,artist:n,album:t.album||"",duration:0,thumb:null,source:"lastfm",plays:t.playcount,url:t.url,inPlex:!1}});return{plex:s,lastfm:a,all:[...s,...a]}}function q(e){let r=e.filter(a=>L==="plex-only"?a.inPlex:L==="lastfm-only"?!a.inPlex:!0);if(E){let a=E.toLowerCase().trim();r=r.filter(t=>t.title.toLowerCase().includes(a)||t.artist.toLowerCase().includes(a)||t.album.toLowerCase().includes(a))}let c=o==="asc",s=(a,t)=>{let n=0;switch(p){case"artist":n=(a.artist||"").localeCompare(t.artist||"")||(a.album||"").localeCompare(t.album||"")||(a.title||"").localeCompare(t.title||"");break;case"album":n=(a.album||"").localeCompare(t.album||"")||(a.artist||"").localeCompare(t.artist||"")||(a.title||"").localeCompare(t.title||"");break;case"length":n=(a.duration||0)-(t.duration||0);break;case"track":default:n=(a.title||"").localeCompare(t.title||"")}return c?n:-n};return r.sort(s),r}function R(){let e=M(),r=m?.all?.length||0;e.innerHTML=`
    <div class="tracks-roon-header">
      <!-- Title & count -->
      <div class="tracks-roon-title">
        <h1>My Tracks</h1>
        <span class="tracks-roon-count">${v(r)} tracks</span>
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
  `,e.querySelector(".tracks-focus-btn")?.addEventListener("click",()=>{}),e.querySelector(".tracks-heart-btn")?.addEventListener("click",()=>{}),e.querySelector(".tracks-play-now-btn")?.addEventListener("click",()=>{if(!k()){u("Selecteer eerst een Plex zone");return}})}async function A(){let e=g();if(!e||!m)return;R();let r=q(m.all),c=k();if(r.length===0){e.innerHTML=`
      <div class="tracks-empty">
        <div class="tracks-empty-icon">\u266A</div>
        <div class="tracks-empty-message">Geen sporen gevonden</div>
        <div class="tracks-empty-hint">Probeer andere zoekopdracht of filters</div>
      </div>
    `;return}e.innerHTML=`
    <div class="tracks-roon-table-wrapper">
      <table class="tracks-roon-table">
        <thead class="tracks-roon-thead">
          <tr>
            <th class="tracks-col-num">#</th>
            <th class="tracks-col-art"></th>
            <th class="tracks-col-title">
              <span>Track</span>
              <span class="tracks-search-icon">\u{1F50D}</span>
            </th>
            <th class="tracks-col-heart">\u2661</th>
            <th class="tracks-col-length" data-sort="length">
              <span>Length</span>
              ${p==="length"?`<span class="tracks-sort-arrow ${o}">${o==="asc"?"\u2191":"\u2193"}</span>`:""}
            </th>
            <th class="tracks-col-artist" data-sort="artist">
              <span>Album artist</span>
              ${p==="artist"?`<span class="tracks-sort-arrow ${o}">${o==="asc"?"\u2191":"\u2193"}</span>`:""}
              <span class="tracks-search-icon">\u{1F50D}</span>
            </th>
            <th class="tracks-col-album" data-sort="album">
              <span>Album</span>
              ${p==="album"?`<span class="tracks-sort-arrow ${o}">${o==="asc"?"\u2191":"\u2193"}</span>`:""}
              <span class="tracks-search-icon">\u{1F50D}</span>
            </th>
            <th class="tracks-col-menu">\u2699\uFE0F</th>
          </tr>
        </thead>
        <tbody id="tracks-tbody" class="tracks-roon-tbody">
          ${S(r,0)}
        </tbody>
      </table>
      <div class="tracks-virtual-spacer" id="tracks-virtual-spacer"></div>
    </div>
  `;let s=r.length*f;document.getElementById("tracks-virtual-spacer").style.height=s+"px",x(e,r,c),e.addEventListener("scroll",()=>{let a=e.scrollTop,t=Math.max(0,Math.floor(a/f)-T),n=Math.min(r.length,t+P()),l=document.getElementById("tracks-tbody");l&&(l.innerHTML=S(r,t,n),l.style.transform=`translateY(${t*f}px)`,x(e,r,c))})}function S(e,r,c=null){c===null&&(c=Math.min(e.length,r+P()));let s=k();return e.slice(r,c).map((a,t)=>{let n=r+t,l=a.thumb?y(a.thumb,40):null,C=a.inPlex?'<span class="tracks-plex-pin" title="In Plex">\u{1F4CC}</span>':"";return`
      <tr class="tracks-roon-row" data-idx="${n}" data-rating-key="${a.ratingKey||""}">
        <td class="tracks-col-num">${n+1}</td>
        <td class="tracks-col-art">
          ${l?`<img src="${i(l)}" alt="album art" class="tracks-thumb">`:'<div class="tracks-thumb-placeholder">\u266A</div>'}
        </td>
        <td class="tracks-col-title">
          <span class="tracks-title-text">${i(a.title)}</span>
          ${C}
        </td>
        <td class="tracks-col-heart">
          <button class="tracks-heart-toggle" data-track-id="${i(a.title)}" title="Add to favorites">\u2661</button>
        </td>
        <td class="tracks-col-length">${z(a.duration)}</td>
        <td class="tracks-col-artist">
          <span class="tracks-artist-link" data-artist="${i(a.artist)}">${i(a.artist)}</span>
        </td>
        <td class="tracks-col-album">
          <span class="tracks-album-link" data-album="${i(a.album)}">${i(a.album)}</span>
        </td>
        <td class="tracks-col-menu">
          <button class="tracks-menu-btn" title="More options">\u22EF</button>
        </td>
      </tr>
    `}).join("")}function x(e,r,c){e.querySelectorAll(".tracks-roon-thead th[data-sort]").forEach(s=>{s.style.cursor="pointer",s.addEventListener("click",()=>{let a=s.getAttribute("data-sort");p===a?o=o==="asc"?"desc":"asc":(p=a,o="asc"),A()})}),e.querySelectorAll(".tracks-artist-link").forEach(s=>{s.style.cursor="pointer",s.addEventListener("click",a=>{a.stopPropagation();let t=s.getAttribute("data-artist");t&&$(t)})}),e.querySelectorAll(".tracks-album-link").forEach(s=>{s.style.cursor="pointer",s.addEventListener("click",a=>{a.stopPropagation();let t=s.getAttribute("data-album")})}),e.querySelectorAll(".tracks-roon-row").forEach(s=>{let a=s.getAttribute("data-rating-key");a&&(s.style.cursor="pointer",s.addEventListener("dblclick",async t=>{if(t.preventDefault(),!c){u("Selecteer eerst een Plex zone");return}try{await w(a,"music")}catch(n){u("Kan nummer niet afspelen: "+n.message)}}))}),e.querySelectorAll(".tracks-heart-toggle").forEach(s=>{s.addEventListener("click",async a=>{a.stopPropagation(),s.classList.toggle("loved")})}),e.querySelectorAll(".tracks-menu-btn").forEach(s=>{s.addEventListener("click",a=>{a.stopPropagation()})})}async function F(){h();try{let[e,r]=await Promise.allSettled([b("/api/plex/tracks"),b("/api/top/tracks?period=overall")]),c=e.status==="fulfilled"?e.value.tracks||[]:[],s=r.status==="fulfilled"?r.value?.toptracks?.track||r.value?.track||[]:[];if(m=H(c,s),m.all.length===0){u("Geen sporen gevonden. Controleer of Plex en Last.fm geconfigureerd zijn.");return}await A(),document.title="Muziek \xB7 Tracks"}catch(e){u("Kan tracks niet laden: "+e.message)}}async function G(){g()&&(h(),await F())}export{G as loadTracks};
