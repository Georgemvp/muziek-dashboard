var s="/audiomuse",i=null,o=0,u=8e3;async function g(){let r=Date.now();if(i&&r-o<u)return i;try{let t=await fetch(`${s}/analysis_status`,{signal:AbortSignal.timeout(3e3)});return t.ok?(i=await t.json(),o=r,i):(i=null,o=r,null)}catch{return i=null,o=r,null}}async function y(r,t){try{let n=encodeURIComponent(`${r} ${t}`),a=await fetch(`${s}/search?search_query=${n}`,{signal:AbortSignal.timeout(8e3)});if(!a.ok)return null;let e=await a.json(),l=Array.isArray(e)?e:e.results||[];return l.length>0?l[0]:null}catch{return null}}async function m(r,t=20){try{let n=await fetch(`${s}/similar?item_id=${r}&limit=${t}`,{signal:AbortSignal.timeout(1e4)});if(!n.ok)return[];let a=await n.json();return Array.isArray(a)?a:a.results||a.tracks||[]}catch{return[]}}async function h(r,t,n=20){let a=await y(r,t);if(!a||a.item_id==null)return null;let e=await m(a.item_id,n);return{source:a,similar:e}}async function f(r,t=20){try{let n=encodeURIComponent(r),a=await fetch(`${s}/clap_search?query=${n}&limit=${t}`,{signal:AbortSignal.timeout(15e3)});if(!a.ok)return[];let e=await a.json();return Array.isArray(e)?e:e.results||e.tracks||[]}catch{return[]}}async function $(){try{let r=await fetch(`${s}/playlists`,{signal:AbortSignal.timeout(1e4)});if(!r.ok)return[];let t=await r.json();return Array.isArray(t)?t:t.playlists||[]}catch{return[]}}async function k(r){try{let t=await fetch(`${s}/playlist/${r}/tracks`,{signal:AbortSignal.timeout(1e4)});if(!t.ok)return[];let n=await t.json();return Array.isArray(n)?n:n.tracks||[]}catch{return[]}}function p(r,t){let n=(r||"").replace(/"/g,"&quot;"),a=(t||"").replace(/"/g,"&quot;");return`<button
    class="am-similar-btn"
    data-am-artist="${n}"
    data-am-title="${a}"
    title="Vind vergelijkbare nummers via AudioMuse"
    aria-label="Vind vergelijkbare nummers voor ${n} - ${a}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  </button>`}function b(r){return!r||r.length===0?'<div class="am-empty">Geen nummers gevonden</div>':r.map(t=>{let n=t.artist||t.album_artist||"",a=t.title||t.name||"",e=t.album||"",l=t.score!=null?`<span class="am-score">${(t.score*100).toFixed(0)}%</span>`:"",c=t.plex_rating_key||t.rating_key||"";return`
      <div class="am-track-item">
        ${c?`<button class="am-play-btn" data-play-ratingkey="${c}"
           title="Afspelen via Plex" aria-label="Speel af: ${a}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
             <polygon points="5 3 19 12 5 21 5 3"/>
           </svg>
         </button>`:`<button class="am-play-btn am-play-search" data-am-artist="${(n||"").replace(/"/g,"&quot;")}" data-am-title="${(a||"").replace(/"/g,"&quot;")}"
           title="Zoek en speel af via Plex" aria-label="Zoek en speel af: ${a}">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
             <polygon points="5 3 19 12 5 21 5 3"/>
           </svg>
         </button>`}
        <div class="am-track-info">
          <span class="am-track-title">${a}</span>
          <span class="am-track-artist">${n}${e?` \xB7 ${e}`:""}</span>
        </div>
        ${l}
        ${p(n,a)}
      </div>`}).join("")}export{g as a,y as b,m as c,h as d,f as e,$ as f,k as g,p as h,b as i};
