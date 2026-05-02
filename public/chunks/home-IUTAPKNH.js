import{a as $}from"./chunk-SQDKFCHB.js";import{a as F,c as Z}from"./chunk-2UCV5F4T.js";import{d as S,h as o,j as J,y as p}from"./chunk-QMWFWNFX.js";import{a as G}from"./chunk-2BMKGNH5.js";var M=["#1a237e","#283593","#3949ab","#5c6bc0","#7986cb","#9fa8da"],q=null;function st(e){let a=[...e];for(let s=a.length-1;s>0;s--){let t=Math.floor(Math.random()*(s+1));[a[s],a[t]]=[a[t],a[s]]}return a}typeof window<"u"&&!window._imgFb&&(window._imgFb=function(e,a){if(!e._d){e._d=1;var s=e.getAttribute("data-fb");if(s){e.src=s;return}}e.style.display="none",e.insertAdjacentHTML("afterend",'<div class="home-recent-cover-ph">'+(a||"\u266A")+"</div>")});function P(e,a,s,t,i,n){t=t||120,i=i||"\u266A";let r=e?S(e,t):null,c=a?"/api/imageproxy/artist/"+encodeURIComponent(a):null,d=r||c;if(!d)return'<div class="home-recent-cover-ph">'+i+"</div>";let y=n?' class="'+o(n)+'"':"",m=s?' alt="'+o(s)+'"':"",g=r&&c?' data-fb="'+o(c)+'"':"",h="_imgFb(this,'"+i+"')";return'<img src="'+o(d)+'"'+m+y+g+' loading="lazy" onerror="'+o(h)+'">'}function it(e){return!e||!Array.isArray(e)?{topartists:{artist:[]}}:{topartists:{artist:e.map(a=>({name:a.name,playcount:String(a.playcount||0),image:[null,null,{"#text":a.thumb||""},{"#text":a.thumb||""}],topTag:a.genre||null}))}}}function nt(e){return!e||!Array.isArray(e)?{toptracks:{track:[]}}:{toptracks:{track:e.map(a=>({name:a.title,playcount:String(a.playcount||0),artist:{name:a.artist,"#text":a.artist},album:{"#text":a.album,name:a.album},image:[null,null,{"#text":a.thumb||""}]}))}}}function U(e){return!e||!Array.isArray(e)?[]:e.map(a=>({name:a.title,artist:{"#text":a.artist},album:{"#text":a.album},image:[null,null,{"#text":a.thumb||""}],date:{uts:String(a.viewedAt)}}))}function T(e){return e==null||isNaN(e)?"\u2014":Number(e).toLocaleString("nl-NL")}function tt(e){if(!e)return"";let a=new Date(e),s=Date.now()-a.getTime(),t=Math.floor(s/864e5);return t<1?"Vandaag":t===1?"Gisteren":t<7?`${t}d geleden`:t<31?`${Math.floor(t/7)}w geleden`:`${Math.floor(t/30)}mo geleden`}function C(e,a=120){return e?S(e,a):null}function bt(e,a,s){let t=e||"Muzikant",i=a?.artists??a?.artistCount??"\u2026",n=a?.albums??a?.albumCount??"\u2026",r=a?.tracks??a?.trackCount??"\u2026",c=a?.composers??a?.composerCount??"\u2014",d='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',y='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>',m='<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',g='<svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>',h=s?.ok?`<span style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; display: inline-block; margin-left: 8px; title='Last.fm connected'"></span>`:`<span style="width: 8px; height: 8px; background: #f44336; border-radius: 50%; display: inline-block; margin-left: 8px;" title='Last.fm unavailable'></span>`;return`
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${o(t)}${h}</div>

      <div class="home-stat-cards">
        <div class="home-stat-card">
          <div class="home-stat-icon">${d}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-artists">${T(i)}</div>
            <div class="home-stat-label">Artists</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${y}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-albums">${T(n)}</div>
            <div class="home-stat-label">Albums</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${m}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-tracks">${T(r)}</div>
            <div class="home-stat-label">Tracks</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${g}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-composers">${T(c)}</div>
            <div class="home-stat-label">Composers</div>
          </div>
        </div>
      </div>
    </div>`}function ft(){return`
    <div class="live-radio-bar">
      <div class="live-radio-badge">
        <span class="live-radio-dot"></span>
        <span class="live-radio-name">NPO Radio 2</span>
      </div>
      <div class="live-radio-info">NPO Radio 2 \u2014 Hilversum, Netherlands, 92.6 FM</div>
      <a href="#" class="live-radio-more" onclick="return false">More live radio</a>
    </div>`}function wt(e){if(!e||e<1)return"0m";if(e<60)return`${Math.round(e)}m`;let a=Math.floor(e/60),s=Math.round(e%60);return s>0?`${a}h ${s}m`:`${a}h`}function rt(e,a){let s={};if(a&&Array.isArray(a))for(let h of a)h.date!=null&&(s[h.date]=h.minutes||(h.count?h.count*3.5:0));else for(let h of e||[]){let v=h.date?.uts;if(!v)continue;let b=new Date(parseInt(v,10)*1e3).toISOString().slice(0,10);s[b]=(s[b]||0)+3.5}let t=new Date,i=t.getDay(),n=new Date(t);n.setDate(t.getDate()-(i+6)%7),n.setHours(0,0,0,0);let r=[];for(let h=0;h<4;h++){let v=new Date(n);v.setDate(n.getDate()-h*7);let k=[];for(let b=0;b<7;b++){let L=new Date(v);L.setDate(v.getDate()+b);let B=L.toISOString().slice(0,10);k.push({key:B,minutes:s[B]||0})}r.push({days:k,totalMinutes:k.reduce((b,L)=>b+L.minutes,0)})}let c=Math.max(...r.map(h=>h.totalMinutes),1),d=Math.max(...r.flatMap(h=>h.days.map(v=>v.minutes)),1);function y(h){if(!h)return"width:6px;height:6px;background:#e0e0e0;";let v=h/d;return v<.25?"width:10px;height:10px;background:var(--accent);opacity:0.4;":v<.6?"width:16px;height:16px;background:var(--accent);opacity:0.7;":"width:24px;height:24px;background:var(--accent);opacity:1;"}let m=r.map(h=>{let v=h.totalMinutes>0?Math.round(h.totalMinutes/c*100):0,k=h.days.map(b=>`<div class="activity-dot-cell"><div class="activity-dot" style="${y(b.minutes)}" title="${b.key}: ${Math.round(b.minutes)}min"></div></div>`).join("");return`
      <div class="activity-bar-wrap">
        <div class="activity-bar" style="width:${v}%"></div>
        <span class="activity-bar-label">${wt(h.totalMinutes)}</span>
      </div>
      ${k}`}).join("");return`
    <div class="home-wylbt-card activity-matrix-card">
      <div class="home-wylbt-card-header" style="margin-bottom:16px">
        <div class="home-wylbt-card-title">Recent listening</div>
      </div>
      <div class="activity-grid">
        <!-- Header row -->
        <div class="activity-grid-label-header">Last 4 weeks</div>
        ${["M","T","W","T","F","S","S"].map(h=>`<div class="activity-day-label">${h}</div>`).join("")}
        <!-- Week rows -->
        ${m}
      </div>
    </div>`}function R(e,a="played"){return e?.length?e.slice(0,8).map(t=>{let i=typeof t.artist=="object"?t.artist?.["#text"]||t.artist?.name||"":t.artist||"",n=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",r=P(n,i,t.name,140,"\u266A"),c="";if(a==="added"&&t.addedAt)c=tt(t.addedAt);else if(a==="played"&&t.date?.uts){let d=new Date(parseInt(t.date.uts,10)*1e3);c=tt(d.toISOString())}return`
      <div class="home-recent-cover">
        ${r}
        ${c?`<div class="home-recent-cover-date">${c}</div>`:""}
        <div class="home-recent-cover-title" title="${o(t.name)}">${o(t.name)}</div>
        <div class="home-recent-cover-artist" title="${o(i)}" data-artist="${o(i)}">${o(i)}</div>
      </div>`}).join(""):'<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>'}function $t(e){return`
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Recent activity</div>
        <div class="home-recent-tabs">
          <button class="home-recent-tab active" data-recent-tab="played">PLAYED</button>
          <button class="home-recent-tab" data-recent-tab="added">ADDED</button>
        </div>
        <button class="home-recent-more" id="home-recent-more">MORE</button>
      </div>
      <!-- Now Playing indicator \u2014 gevuld door plex-np-update event -->
      <div id="home-np-indicator" style="display:none" title="Ga naar Nu-view">
        <span class="home-np-dot"></span>
        <span class="home-np-label">Nu: </span>
        <span class="home-np-track"></span>
      </div>
      <div class="home-recent-row">
        <button class="home-recent-nav" id="home-recent-prev" aria-label="Vorige">&#8249;</button>
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-recent-covers">
            ${R(e,"played")}
          </div>
        </div>
        <button class="home-recent-nav" id="home-recent-next" aria-label="Volgende">&#8250;</button>
      </div>
    </div>`}function xt(e){let a=st(e||[]).slice(0,8);return a.length?`
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Loved Tracks</div>
        <button class="home-recent-more" id="home-loved-more">MORE</button>
      </div>
      <div class="home-recent-row">
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-loved-covers">
            ${a.map(t=>{let i=t.artist?.name||t.artist?.["#text"]||(typeof t.artist=="string"?t.artist:""),n=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",r=P(n,i,t.name,140,"\u2665");return`
      <div class="home-recent-cover" data-track="${o(t.name)}" data-artist="${o(i)}">
        ${r}
        <button class="home-loved-play-btn" title="Afspelen in Plex" aria-label="Afspelen">&#9654;</button>
        <div class="home-recent-cover-title" title="${o(t.name)}">${o(t.name)}</div>
        <div class="home-recent-cover-artist" title="${o(i)}">${o(i)}</div>
      </div>`}).join("")}
          </div>
        </div>
      </div>
    </div>`:""}function kt(e){let a=(e||[]).slice(0,4);return a.length?`
    <div class="home-section-header">
      <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-listen-later-grid">${a.map(t=>{let i=C(t.image,96);return`
      <div class="home-listen-later-item">
        ${i?`<img class="home-listen-later-img" src="${o(i)}" alt="${o(t.name)}" loading="lazy">`:'<div class="home-listen-later-ph">\u266B</div>'}
        <div class="home-listen-later-info">
          <div class="home-listen-later-name" title="${o(t.name)}">${o(t.name)}</div>
          <div class="home-listen-later-artist" title="${o(t.artist||"")}" data-artist="${o(t.artist||"")}">${o(t.artist||"")}</div>
        </div>
        <div class="home-listen-later-type">${o(t.type||"album")}</div>
      </div>`}).join("")}</div>`:`
      <div class="home-section-header">
        <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
        <button class="home-more-btn" data-switch="albums">MORE</button>
      </div>
      <div class="home-listen-later-grid">
        <div class="home-listen-later-empty">Je wishlist is leeg. Voeg albums toe via de zoekfunctie.</div>
      </div>`}async function Et(){let e=document.querySelectorAll("#home-loved-covers .home-recent-cover");if(!e.length)return;let a=new Set;if(e.forEach(t=>{let n=t.querySelector(".home-recent-cover-artist")?.textContent?.trim();n&&n!=="[object Object]"&&a.add(n)}),!a.size)return;let s=new Map;await Promise.allSettled([...a].slice(0,8).map(async t=>{try{let i=await p(`/api/plex/tracks?artist=${encodeURIComponent(t)}&limit=0`);for(let n of i?.tracks||[])n.thumb&&s.set(`${n.artist.toLowerCase()}||${n.title.toLowerCase()}`,n.thumb)}catch{}})),s.size&&e.forEach(t=>{let i=t.querySelector(".home-recent-cover-ph");if(!i)return;let n=t.querySelector(".home-recent-cover-title"),r=t.querySelector(".home-recent-cover-artist"),c=n?.textContent?.trim()?.toLowerCase(),d=r?.textContent?.trim()?.toLowerCase();if(!c||!d)return;let y=s.get(`${d}||${c}`);if(y){let m=document.createElement("img");m.src=y,m.alt=n.textContent,m.loading="lazy",m.onerror=()=>{},i.replaceWith(m)}})}async function Lt(e){let a=(e?.topartists?.artist||[]).slice(0,10);if(!a.length)return"";let s=null;try{let r=sessionStorage.getItem("featuredArtistName");r&&(s=a.find(c=>c.name===r))}catch{}if(!s){let r=Math.floor(Math.random()*a.length);s=a[r];try{sessionStorage.setItem("featuredArtistName",s.name)}catch{}}let t=[];try{let c=((await p(`/api/plex/library?q=${encodeURIComponent(s.name)}&sort=addedAt:desc&limit=20`))?.library||[]).filter(d=>d.artist?.toLowerCase()===s.name.toLowerCase());if(c.length>0){let d=new Set,y=[];for(let m of c)d.has(m.album)||(d.add(m.album),y.push(m));t=y.slice(0,3).map(m=>({name:m.album,artist:{name:m.artist},_plexThumb:m.thumb}))}}catch{}if(!t.length)try{let r=await p(`/api/artist/${encodeURIComponent(s.name)}`);t=(r?.topalbums?.album||r?.albums||[]).slice(0,3)}catch{}let i=J(s.name),n=t.map(r=>{let c=r.artist?.name||r.artist||s.name,d;if(r._plexThumb)d=`<img src="${o(r._plexThumb)}" alt="${o(r.name||"")}" class="featured-album-img" loading="lazy" onerror="this.style.display='none'">`;else{let y=r.image?.[2]?.["#text"]||r.image?.[1]?.["#text"]||"";d=P(y,c,r.name,80,"\u266B","featured-album-img")}return`
      <div class="featured-album-card">
        ${d}
        <div class="featured-album-info">
          <div class="featured-album-artist" data-artist="${o(r.artist?.name||r.artist||"")}">${o(r.artist?.name||r.artist||"")}</div>
          <div class="featured-album-title">${o(r.name||"")}</div>
        </div>
      </div>`}).join("");return`
    <div class="home-featured-banner" style="background: ${i}">
      <div class="featured-content-left">
        <div class="featured-label">PERFORMING THE MUSIC OF</div>
        <div class="featured-name">${o(s.name)}</div>
        <button class="featured-play" id="featured-play-btn" data-artist="${o(s.name)}">
          <span class="featured-play-icon">\u25B6</span>
          <span class="featured-play-text">PLAY TRACKS</span>
        </button>
      </div>
      <div class="featured-albums">
        ${n}
      </div>
    </div>`}function At(e){let a=(e?.topartists?.artist||[]).slice(0,5);return a.length?`
    <div class="home-section-header">
      <div class="home-section-title">Your recent artists</div>
      <div class="home-recent-artists-nav">
        <button class="home-recent-artists-btn" id="home-artists-prev" aria-label="Vorige">&#8249;</button>
        <button class="home-recent-artists-btn" id="home-artists-next" aria-label="Volgende">&#8250;</button>
      </div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-recent-artists-wrap">
      <div class="home-recent-artists" id="home-recent-artists">${a.map(t=>{let i=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",n=P(i,t.name,t.name,200,"\u266A","home-artist-circle-img");return`
      <div class="home-artist-circle-item" data-artist="${o(t.name)}">
        <div class="home-artist-circle">${n}</div>
        <div class="home-artist-circle-name">${o(t.name)}</div>
      </div>`}).join("")}</div>
    </div>`:""}async function It(e){try{let a=(e?.topartists?.artist||e||[]).slice(0,5);if(!a.length)return"";let s=[];try{let i=await p("/api/discover");i?.artists&&Array.isArray(i.artists)&&(s=i.artists.slice(0,5))}catch{}if(s.length===0){let i=a.slice(0,3).map(async c=>{try{let d=await p(`/api/artist/${encodeURIComponent(c.name)}/similar`,{signal:AbortSignal.timeout(5e3)});return{source:c.name,similar:(d?.similarartists?.artist||d?.similar||[]).slice(0,5)}}catch{return{source:c.name,similar:[]}}}),n=await Promise.all(i),r=new Set(a.map(c=>c.name.toLowerCase()));for(let c of n)for(let d of c.similar){let y=(d.name||d).toLowerCase();!r.has(y)&&s.length<5&&(r.add(y),s.push({name:d.name||d,image:d.image,sources:[c.source]}))}}return s.length?`
      <div class="home-section-header">
        <div class="home-section-title" style="font-family: Georgia, serif; font-size: 20px">Recommended artists</div>
        <div class="home-rec-artists-nav">
          <button class="home-rec-artists-btn" id="home-rec-artists-prev" aria-label="Vorige">&#8249;</button>
          <button class="home-rec-artists-btn" id="home-rec-artists-next" aria-label="Volgende">&#8250;</button>
        </div>
        <button class="home-more-btn" data-switch="ontdek">MORE</button>
      </div>
      <div class="home-recommended-artists-wrap">
        <div class="home-recommended-artists" id="home-recommended-artists">
          ${s.map(i=>{let n=typeof i=="string"?i:i.name,r=i.image,c=i.sources||[],d=typeof i!="string"&&(i.image?.[3]?.["#text"]||i.image?.[2]?.["#text"]||i.thumb)||"",y=P(d,n,n,120,"\u266A","home-rec-artist-img"),m="";if(c.length>0){let g=c.slice(0,2);g.length===1?m=`If you like ${g[0]}`:m=`If you like ${g.join(" and ")}`}return`
        <div class="home-rec-artist" data-artist="${o(n)}">
          <div class="home-rec-artist-img-wrap">${y}</div>
          <div class="home-rec-artist-name">${o(n)}</div>
          ${m?`<div class="home-rec-artist-reason">${o(m)}</div>`:""}
        </div>`}).join("")}
        </div>
      </div>`:""}catch(a){return console.warn("Recommended artists render mislukt:",a),""}}async function Tt(){try{let e=await p("/api/plex/playlists"),a=(e?.playlists||e||[]).slice(0,5);return a.length?`
      <div class="home-playlists-section">
        <div class="home-playlists-header">
          <div class="home-playlists-title">Your Playlists</div>
          <div class="home-playlists-nav">
            <button class="home-playlist-nav-btn" id="home-playlists-prev" aria-label="Vorige">&#8249;</button>
            <button class="home-playlist-nav-btn" id="home-playlists-next" aria-label="Volgende">&#8250;</button>
          </div>
          <button class="home-more-btn" data-switch="playlists">MORE</button>
        </div>
        <div class="home-playlists" id="home-playlists">
          ${a.map(t=>{let i="",n="";return t.thumb?(i=S(t.thumb,360),n=`background: url('${o(i)}'); background-size: cover; background-position: center;`):n="background: linear-gradient(135deg, rgba(40,60,140,0.8), rgba(60,30,100,0.8));",`
        <div class="home-playlist-card" data-playlist-id="${o(t.ratingKey||t.key||t.id||"")}" data-playlist-title="${o(t.title||"")}" data-playlist-name="${o(t.title||"")}">
          ${i?`<img class="home-playlist-card-img" src="${o(i)}" alt="${o(t.title||"")}" loading="lazy">`:'<div class="home-playlist-card-ph">\u266B</div>'}
          <div class="home-playlist-name">${o(t.title||"Playlist")}</div>
        </div>`}).join("")}
        </div>
      </div>`:""}catch(e){return console.warn("Playlists render mislukt:",e),""}}function St(e){let s=(e?.topartists?.artist||[]).slice(0,2).map((t,i)=>{let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=n?S(n,400):"";return`
      <div class="home-mix-card" data-switch="ontdek" style="${r?`background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${o(r)}'); background-size: cover; background-position: center;`:"background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7));"}">
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">${o(t.name)} Mix</div>
          <div class="home-mix-featuring" id="home-mix-featuring-${i}">Laden\u2026</div>
        </div>
      </div>`});for(;s.length<2;){let t=s.length+1;s.push(`
      <div class="home-mix-card" data-switch="ontdek" style="background: var(--bg-tertiary);">
        <div class="home-mix-ph">\u266A</div>
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">Laden\u2026</div>
          <div class="home-mix-featuring"></div>
        </div>
      </div>`)}return`
    <div class="home-section-header">
      <div class="home-section-title">Your Daily Mixes</div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>
    <div class="home-daily-mixes">${s.join("")}</div>`}async function Mt(e){let a=(e?.topartists?.artist||[]).slice(0,2);for(let s=0;s<a.length;s++){let t=a[s],i=document.getElementById(`home-mix-featuring-${s}`);if(i)try{let n=new AbortController,r=setTimeout(()=>n.abort(),5e3);try{let c=await p(`/api/artist/${encodeURIComponent(t.name)}/similar`,{signal:n.signal});clearTimeout(r);let d=(c?.similarartists?.artist||c?.similar||[]).slice(0,3);d.length?i.textContent=`Featuring ${d.map(y=>y.name||y).join(", ")} and more`:i.textContent=""}catch{clearTimeout(r),i.textContent=""}}catch{i.textContent=""}}}function Ct(e){if(e?.genres&&Array.isArray(e.genres))return e.genres.map((t,i)=>({name:t.name,count:t.count,pct:t.pct||Math.round(t.count/e.genres.reduce((n,r)=>n+r.count,0)*100),color:M[i%M.length]})).slice(0,6);let a=e?.topartists?.artist||[],s={};for(let t of a){let i=t.topTag;if(!i||i.toLowerCase()==="other")continue;let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=n?S(n,400):null;s[i]||(s[i]={name:i,count:0,artistImage:r}),s[i].count+=parseInt(t.playcount,10)||0,!s[i].artistImage&&r&&(s[i].artistImage=r)}return Object.values(s).sort((t,i)=>i.count-t.count).slice(0,6)}function Rt(e){if(!e?.length)return"";let a=i=>{let n=i.artistImage?`background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${o(i.artistImage)}'); background-size: cover; background-position: center;`:"background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));";return`
      <div class="genre-card" data-genre="${o(i.name)}" style="${n}" role="button" tabindex="0">
        <span class="genre-card-name">${o(i.name)}</span>
      </div>`},s=e.slice(0,3),t=e.slice(3,6);return`
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${s.map(a).join("")}</div>
      <div class="genres-grid-row">${t.map(a).join("")}</div>
    </div>`}function ot(e,a){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(v=>(v.type||"album").toLowerCase()!=="single"),i=s.filter(v=>(v.type||"").toLowerCase()==="single"),n=(a==="singles"?i:t).slice(0,3);if(!n.length)return'<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>';let[r,...c]=n,d=C(r.image||r.thumb,400),y=d?`<img src="${o(d)}" alt="${o(r.title||r.album||"")}" loading="lazy">`:'<div class="releases-main-ph">\u266B</div>',m=r.description||r.bio||"",g=`
    <div class="releases-main-card">
      ${y}
      <div class="releases-main-info">
        <div class="releases-main-artist"${r.artist?` data-artist="${o(r.artist)}"`:""}>${o(r.artist||"\u2014")}</div>
        <div class="releases-main-title">${o(r.title||r.album||"\u2014")}</div>
        <div class="releases-main-date">${o(r.date||r.releaseDate||"")}</div>
        ${m?`<div class="releases-main-desc">${o(m)}</div>`:""}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`,h=c.slice(0,2).map((v,k)=>{let b=C(v.image||v.thumb,160);return`
      <div class="releases-small-card">
        ${b?`<img src="${o(b)}" alt="${o(v.title||v.album||"")}" loading="lazy">`:'<div class="releases-small-ph">\u266B</div>'}
        <div class="releases-small-info">
          <div class="releases-small-artist"${v.artist?` data-artist="${o(v.artist)}"`:""}>${o(v.artist||"\u2014")}</div>
          <div class="releases-small-title">${o(v.title||v.album||"\u2014")}</div>
          <div class="releases-small-date">${o(v.date||v.releaseDate||"")}</div>
          <div class="releases-plex-badge" id="plex-badge-${k+1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`}).join("");return`
    <div class="releases-preview">
      ${g}
      <div class="releases-stack">${h}</div>
    </div>`}function Pt(e,a="albums"){return`
    ${`
    <div class="home-section-header">
      <div class="home-section-title">New releases for you</div>
      <div class="home-tabs">
        <button class="home-tab home-tab--releases ${a==="albums"?"active":""}" data-releases-tab="albums">ALBUMS</button>
        <button class="home-tab home-tab--releases ${a==="singles"?"active":""}" data-releases-tab="singles">SINGLES</button>
      </div>
      <button class="home-more-btn" data-switch="releases">MORE</button>
    </div>`}
    <div id="releases-body">
      ${ot(e,a)}
    </div>`}async function et(e,a){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(c=>(c.type||"album").toLowerCase()!=="single"),i=s.filter(c=>(c.type||"").toLowerCase()==="single"),n=(a==="singles"?i:t).slice(0,3);if(!n.length)return;let r=n.map(c=>({artist:c.artist||"",album:c.title||c.album||""}));try{let c=await fetch("/api/plex/check-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:r})});if(!c.ok)throw new Error(`HTTP ${c.status}`);let y=(await c.json()).results||{};r.forEach((m,g)=>{let h=`${m.artist}||${m.album}`,v=document.getElementById(`plex-badge-${g}`);v&&y[h]&&(v.style.display="inline-flex")})}catch(c){console.warn("Plex check-batch aanroep mislukt:",c)}}function Bt(e){let a=document.getElementById("home-donut-chart");!a||!window.Chart||(q&&(q.destroy(),q=null),q=new window.Chart(a,{type:"doughnut",data:{labels:e.map(s=>s.name),datasets:[{data:e.map(s=>s.count),backgroundColor:e.map(s=>s.color),borderWidth:0,hoverOffset:4}]},options:{cutout:"65%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:s=>` ${s.label}: ${T(s.parsed)} plays`}}},animation:{duration:400}}}))}async function ct(e){let a=document.getElementById("home-genres-legend");try{let s=null;try{let t=await p(`/api/plex/stats?period=${e}`);if(t&&t.source==="plex"&&t.genres&&Array.isArray(t.genres)&&t.genres.length>0){let i=t.genres.reduce((n,r)=>n+r.count,0)||1;s=t.genres.map((n,r)=>({name:n.name,count:n.count,pct:Math.round(n.count/i*100),color:M[r%M.length]})).slice(0,6)}}catch{}if(!s){let i=((await p(`/api/top/artists?period=${e}`))?.topartists?.artist||[]).slice(0,8),n={};for(let m of i){let g=m.topTag||"Other",h=parseInt(m.playcount,10)||0;n[g]=(n[g]||0)+h}let r=Object.entries(n).sort((m,g)=>g[1]-m[1]),c=r.slice(0,6),d=r.slice(6).reduce((m,[,g])=>m+g,0);if(d>0){let m=c.findIndex(([g])=>g==="Other");m>=0?c[m][1]+=d:c.push(["Other",d])}let y=c.reduce((m,[,g])=>m+g,0)||1;s=c.map(([m,g],h)=>({name:m,count:g,pct:Math.round(g/y*100),color:M[h%M.length]}))}a&&(a.innerHTML=s.map(t=>`
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${t.color}"></div>
          <div class="home-genres-legend-name">${o(t.name)}</div>
        </div>`).join("")),Bt(s)}catch(s){console.warn("Genre chart mislukt:",s),a&&(a.innerHTML='<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>')}}function lt(e){let a=(e?.topartists?.artist||[]).slice(0,4);if(!a.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=parseInt(a[0]?.playcount,10)||1;return a.map(t=>{let i=Math.round((parseInt(t.playcount,10)||0)/s*100),n=C(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72),r=n?`<img class="home-wylbt-artist-img" src="${o(n)}" alt="${o(t.name)}" loading="lazy">`:'<div class="home-wylbt-artist-ph">\u266A</div>';return`
      <div class="home-wylbt-artist-item" data-artist="${o(t.name)}">
        ${r}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${o(t.name)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${i}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${T(parseInt(t.playcount,10)||0)}</div>
      </div>`}).join("")}function Ht(e){let a={};for(let s of e?.toptracks?.track||[]){let t=s.album?.["#text"]||s.album?.name||null,i=s.artist?.name||s.artist?.["#text"]||(typeof s.artist=="string"?s.artist:"");if(!t)continue;let n=`${t}|||${i}`;a[n]||(a[n]={album:t,artist:i,playcount:0,image:s.image}),a[n].playcount+=parseInt(s.playcount,10)||0}return Object.values(a).sort((s,t)=>t.playcount-s.playcount).slice(0,4)}function dt(e){let a=Ht(e);if(!a.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=a[0]?.playcount||1;return a.map(t=>{let i=Math.round(t.playcount/s*100),n=C(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72);return`
      <div class="home-wylbt-release-item">
        ${n?`<img class="home-wylbt-release-img" src="${o(n)}" alt="${o(t.album)}" loading="lazy">`:'<div class="home-wylbt-release-ph">\u266B</div>'}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${o(t.album)}</div>
          <div class="home-wylbt-item-sub">${o(t.artist)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${i}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${T(t.playcount)}</div>
      </div>`}).join("")}function Dt(e,a){return`
    <div class="home-wylbt-header">
      <div class="home-wylbt-title">What you've been listening to</div>
    </div>

    <div class="home-wylbt-blocks">

      <!-- Blok 1: Genres donut -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Genres</div>
          <button class="home-more-btn">MORE</button>
        </div>
        <div class="home-genres-body">
          <div class="home-genres-chart-wrap">
            <canvas id="home-donut-chart" width="160" height="160"></canvas>
          </div>
          <div class="home-genres-legend" id="home-genres-legend">
            <div style="color:var(--text-muted);font-size:13px">Laden\u2026</div>
          </div>
        </div>
      </div>

      <!-- Blok 2: Top Artists -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Your top artists</div>
          <button class="home-more-btn" data-switch="albums">MORE</button>
        </div>
        <div id="home-wylbt-artists-list">
          ${lt(e)}
        </div>
      </div>

      <!-- Blok 3: Top Releases -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Your top releases</div>
          <button class="home-more-btn">MORE</button>
        </div>
        <div id="home-wylbt-releases-list">
          ${dt(a)}
        </div>
      </div>

    </div>`}function qt(){let e=document.getElementById("home-recent-covers"),a=document.getElementById("home-recent-prev"),s=document.getElementById("home-recent-next");if(!e||!a||!s)return;let t=0,i=160;function n(){let r=Math.max(0,e.scrollWidth-e.parentElement.offsetWidth);t=Math.max(0,Math.min(t,r)),e.style.transform=`translateX(-${t}px)`,a.disabled=t<=0,s.disabled=t>=r}a.addEventListener("click",()=>{t=Math.max(0,t-i),n()}),s.addEventListener("click",()=>{t+=i,n()}),n()}async function Ot(e){let a,s;try{let n=await p(`/api/plex/stats?period=${e}`);n&&n.source==="plex"?(a=it(n.topArtists),s=nt(n.topTracks)):[a,s]=await Promise.all([p(`/api/topartists?period=${e}`).catch(()=>null),p(`/api/toptracks?period=${e}`).catch(()=>null)])}catch{[a,s]=await Promise.all([p(`/api/topartists?period=${e}`).catch(()=>null),p(`/api/toptracks?period=${e}`).catch(()=>null)])}let t=document.getElementById("home-wylbt-artists-list");t&&(t.innerHTML=lt(a));let i=document.getElementById("home-wylbt-releases-list");i&&(i.innerHTML=dt(s)),t?.querySelectorAll("[data-artist]").forEach(n=>{n.addEventListener("click",()=>$("artist-detail",{name:n.dataset.artist}))}),await ct(e)}async function jt(e){localStorage.setItem("homePeriod",e),document.querySelectorAll(".home-period-pill").forEach(a=>{a.classList.toggle("active",a.dataset.period===e)});try{let a=null,s=[],t=await p(`/api/plex/stats?period=${e}`);if(t?.dailyPlays?.some(n=>n.minutes>0||n.count>0))a=t.dailyPlays,s=t.recentTracks||[];else{let n=await p(`/api/activity?period=${e}`);n?.dailyPlays?.some(r=>r.minutes>0||r.count>0)&&(a=n.dailyPlays,s=n.recentTracks||[])}let i=document.querySelector(".activity-matrix-card");if(i){let n=s.length?U(s):[];i.outerHTML=rt(n,a)}}catch(a){console.warn("Activity matrix herlaad mislukt:",a)}if(e==="today")try{let a=new Date;a.setHours(0,0,0,0);let s=Math.floor(a.getTime()/1e3),i=((await p("/api/plex/stats?period=today"))?.recentTracks||[]).filter(r=>parseInt(r.date?.uts||0,10)>=s),n=document.getElementById("home-recent-covers");n&&(n.innerHTML=R(i))}catch(a){console.warn("Recent activity herlaad mislukt:",a)}else try{let s=(await p(`/api/plex/stats?period=${e}`))?.recentTracks||[],t=document.getElementById("home-recent-covers");t&&(t.innerHTML=R(s))}catch(a){console.warn("Recent activity herlaad mislukt:",a)}await Ot(e);try{let s=(await p(`/api/plex/stats?period=${e}`))?.topArtists||[],t=document.getElementById("home-recent-artists");if(t){let i=s.slice(0,5);if(i.length){let n=i.map(r=>{let c=r.thumb||r.image?.[3]?.["#text"]||r.image?.[2]?.["#text"],d=C(c,200),y=d?`<img class="home-artist-circle-img" src="${o(d)}" alt="${o(r.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
            <div class="home-artist-circle-item" data-artist="${o(r.name)}">
              <div class="home-artist-circle">${y}</div>
              <div class="home-artist-circle-name">${o(r.name)}</div>
            </div>`}).join("");t.innerHTML=n,t.querySelectorAll(".home-artist-circle-item").forEach(r=>{r.addEventListener("click",()=>{let c=r.dataset.artist;c&&$("artist-detail",{name:c})})})}}}catch(a){console.warn("Recent artists herlaad mislukt:",a)}}async function zt(){if(G.user?.name)return G.user.name;try{let e=await p("/api/user");return e?.user?.name||e?.name||null}catch{return null}}function mt(e){if(!e)return{};let a={...e};return e.artists!==void 0&&e.artistCount===void 0&&(a.artistCount=e.artists),e.albums!==void 0&&e.albumCount===void 0&&(a.albumCount=e.albums),e.tracks!==void 0&&e.trackCount===void 0&&(a.trackCount=e.tracks),a.artistCount!==void 0?a:e.library?mt(e.library):e.stats?e.stats:a}async function Qt(){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="home-page" aria-busy="true" aria-label="Laden\u2026">
      ${Z()}
      ${F(6,1)}
      ${F(4,2)}
    </div>`;let[a,s,t,i,n,r,c]=await Promise.all([zt().catch(()=>null),p("/api/plex/status").catch(()=>null),p("/api/plex/stats?period=7day").catch(()=>null),p("/api/wishlist").catch(()=>null),p("/api/releases").catch(()=>null),p("/api/user").catch(()=>null),p("/api/loved").catch(()=>null)]),d,y,m;t&&t.source==="plex"?(d=it(t.topArtists),y=nt(t.topTracks),m={recenttracks:{track:U(t.recentTracks)}}):[d,y,m]=await Promise.all([p("/api/topartists?period=7day").catch(()=>null),p("/api/toptracks?period=7day").catch(()=>null),p("/api/recent?limit=200").catch(()=>null)]);let g={ok:r&&!r._stale,user:r?.user?.name||null},h=mt(s),v=m?.recenttracks?.track||[],k=i?.wishlist||i||[],b=n,L=c?.lovedtracks?.track||[],B=Ct(d),ut=await Lt(d).catch(()=>""),ht=await It(d).catch(()=>""),vt=await Tt().catch(()=>""),j=v,z=null;if(t?.source==="plex"&&t?.dailyPlays?.some(l=>l.minutes>0||l.count>0))z=t.dailyPlays;else try{let l=await p("/api/activity?period=1month");l?.dailyPlays?.some(u=>u.minutes>0||u.count>0)&&(z=l.dailyPlays,l.recentTracks?.length&&(j=U(l.recentTracks)))}catch{try{j=(await p("/api/recent?limit=200"))?.recenttracks?.track||v}catch{}}e.innerHTML=`
    <div class="home-page">

      <!-- 1. Greeting + Stats + Last.fm Status -->
      ${bt(a,h,g)}

      <!-- 1b. Live Radio Bar -->
      ${ft()}

      <!-- 1c. Recent Listening Activity Matrix -->
      ${rt(j,z)}

      <!-- 2. Recent Activity -->
      ${$t(v)}

      <!-- 2b. Loved Tracks -->
      ${xt(L)}

      <!-- 2c. Featured Artist Banner -->
      ${ut}

      <!-- 3. Listen Later -->
      <div>${kt(k)}</div>

      <!-- 3b. Recent Artists -->
      <div>${At(d)}</div>

      <!-- 3c. Recommended Artists -->
      <div>${ht}</div>

      <!-- 3d. Your Playlists -->
      <div id="home-playlists-container">${vt}</div>

      <!-- 4. Daily Mixes -->
      <div>${St(d)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${Rt(B)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${Pt(b)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${Dt(d,y)}
      </div>

      <!-- 7. Enrichment Pipeline Widget -->
      <div id="home-enrichment-section">${Nt()}</div>

    </div>`;let pt=localStorage.getItem("homePeriod")||"7day";e.querySelectorAll(".home-period-pill").forEach(l=>{l.classList.toggle("active",l.dataset.period===pt)}),e.querySelectorAll(".home-period-pill").forEach(l=>{l.addEventListener("click",async()=>{let u=l.dataset.period;u&&await jt(u)})}),qt(),Et().catch(()=>{}),ct("7day"),W().catch(()=>{}),document.getElementById("enrichment-queue-all")?.addEventListener("click",async l=>{let u=l.currentTarget;u.disabled=!0,u.textContent="Bezig\u2026";try{let w=await(await fetch("/api/enrichment/queue/all",{method:"POST"})).json();u.textContent=`${w.queued||0} items toegevoegd`,setTimeout(()=>W().catch(()=>{}),1e3)}catch{u.textContent="Fout!"}setTimeout(()=>{u.disabled=!1,u.textContent="Queue Alles"},3e3)}),e.querySelectorAll("[data-switch]").forEach(l=>{l.addEventListener("click",()=>$(l.dataset.switch))}),e.querySelectorAll("#home-wylbt-artists-list [data-artist]").forEach(l=>{l.addEventListener("click",()=>$("artist-detail",{name:l.dataset.artist}))}),document.getElementById("home-recent-more")?.addEventListener("click",()=>{$("albums")}),document.getElementById("home-loved-more")?.addEventListener("click",()=>{$("listen-later")}),e.querySelectorAll(".genre-card").forEach(l=>{l.addEventListener("click",()=>$("ontdek")),l.addEventListener("keydown",u=>{(u.key==="Enter"||u.key===" ")&&$("ontdek")})});let H="albums";e.querySelectorAll("[data-releases-tab]").forEach(l=>{l.addEventListener("click",()=>{H=l.dataset.releasesTab,e.querySelectorAll("[data-releases-tab]").forEach(f=>f.classList.toggle("active",f===l));let u=document.getElementById("releases-body");u&&(u.innerHTML=ot(b,H),et(b,H))})});let Y="played";e.querySelectorAll("[data-recent-tab]").forEach(l=>{l.addEventListener("click",async()=>{e.querySelectorAll("[data-recent-tab]").forEach(f=>f.classList.toggle("active",f===l)),Y=l.dataset.recentTab;let u=document.getElementById("home-recent-covers");if(u)if(Y==="added")try{let w=((await p("/api/plex/library?sort=addedAt:desc&limit=8"))?.library||[]).map(x=>({name:x.album,artist:{"#text":x.artist},image:x.thumb?[null,null,{"#text":x.thumb}]:[null,null,{"#text":""}],addedAt:new Date(x.addedAt*1e3).toISOString()}));u.innerHTML=R(w,"added")}catch(f){console.warn("Failed to load added items:",f),u.innerHTML='<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Fout bij laden van recent toegevoegde albums</div>'}else u.innerHTML=R(v,"played")})}),e.querySelectorAll(".home-artist-circle-item").forEach(l=>{l.addEventListener("click",()=>{let u=l.dataset.artist;u&&$("artist-detail",{name:u})})});let A=document.getElementById("featured-play-btn");A&&A.addEventListener("click",async()=>{let l=A.dataset.artist;if(l){A.disabled=!0,A.textContent="\u2026";try{let u=await p(`/api/plex/search?q=${encodeURIComponent(l)}&limit=3`),f=(u?.artists||[]).find(D=>D.title?.toLowerCase()===l.toLowerCase())||u?.artists?.[0];if(!f?.ratingKey){O(`"${l}" niet gevonden in Plex`,"#e05a2b");return}let x=(await p(`/api/plex/artists/${f.ratingKey}`))?.artist?.albums||[];if(!x.length){O("Geen albums gevonden in Plex","#e05a2b");return}let I=st(x),{playOnZone:Q}=await import("./plexRemote-2DR6GV2U.js");await Q(I[0].ratingKey,"music")}catch(u){console.error("Featured artist play mislukt:",u),O("Afspelen mislukt","#e05a2b")}finally{A.disabled=!1,A.innerHTML='<span class="featured-play-icon">\u25B6</span><span class="featured-play-text">PLAY TRACKS</span>'}}}),e.querySelectorAll(".home-loved-play-btn").forEach(l=>{l.addEventListener("click",async u=>{u.stopPropagation();let f=l.closest("[data-track]"),w=f?.dataset.track||"",x=f?.dataset.artist||"";if(w){l.textContent="\u2026";try{let I=encodeURIComponent(`${w} ${x}`.trim()),D=(await p(`/api/plex/search?q=${I}&limit=5`))?.tracks||[],X=D.find(gt=>gt.title?.toLowerCase()===w.toLowerCase())||D[0];if(!X?.ratingKey){O(`"${w}" niet gevonden in Plex`,"#e05a2b");return}let{playOnZone:yt}=await import("./plexRemote-2DR6GV2U.js");await yt(X.ratingKey,"music")}catch(I){console.error("Loved track play mislukt:",I)}finally{l.textContent="\u25B6"}}})});let V=document.getElementById("home-np-indicator");V&&(fetch("/api/plex/nowplaying").then(l=>l.json()).then(l=>at(l)).catch(()=>{}),V.addEventListener("click",()=>$("nu")));let K=l=>{document.getElementById("home-np-indicator")?at(l.detail):window.removeEventListener("plex-np-update",K)};window.addEventListener("plex-np-update",K);let N=document.getElementById("home-recent-artists");N&&(document.getElementById("home-artists-prev")?.addEventListener("click",()=>{N.scrollBy({left:-256,behavior:"smooth"})}),document.getElementById("home-artists-next")?.addEventListener("click",()=>{N.scrollBy({left:256,behavior:"smooth"})}));let _=document.getElementById("home-recommended-artists");_&&(document.getElementById("home-rec-artists-prev")?.addEventListener("click",()=>{_.scrollBy({left:-320,behavior:"smooth"})}),document.getElementById("home-rec-artists-next")?.addEventListener("click",()=>{_.scrollBy({left:320,behavior:"smooth"})})),e.querySelectorAll(".home-rec-artist").forEach(l=>{l.addEventListener("click",()=>{let u=l.dataset.artist;u&&$("artist-detail",{name:u})})});let E=document.getElementById("home-playlists");if(E){let u=document.getElementById("home-playlists-prev"),f=document.getElementById("home-playlists-next"),w=()=>{let x=E.scrollLeft<=0,I=E.scrollLeft>=E.scrollWidth-E.clientWidth-10;u?.toggleAttribute("disabled",x),f?.toggleAttribute("disabled",I)};u?.addEventListener("click",()=>{E.scrollBy({left:-400,behavior:"smooth"}),setTimeout(w,400)}),f?.addEventListener("click",()=>{E.scrollBy({left:400,behavior:"smooth"}),setTimeout(w,400)}),E.addEventListener("scroll",w),w()}e.querySelectorAll(".home-playlist-card").forEach(l=>{l.addEventListener("click",()=>{let u=l.dataset.playlistId,f=l.dataset.playlistTitle||l.dataset.playlistName||"Afspeellijst";u&&$("playlist-detail",{id:u,title:f})})}),Mt(d),et(b,H)}function Nt(){return`
    <section class="home-section enrichment-widget" id="enrichment-widget">
      <div class="home-section-header">
        <h2 class="home-section-title">Metadata Enrichment</h2>
        <div class="enrichment-header-actions">
          <button class="enrichment-queue-all-btn home-more-btn" id="enrichment-queue-all">
            Queue Alles
          </button>
        </div>
      </div>
      <div class="enrichment-workers" id="enrichment-workers">
        <div class="enrichment-loading">Laden\u2026</div>
      </div>
    </section>`}function _t(e){return!e||!Object.keys(e).length?'<div class="enrichment-empty">Geen enrichment workers geconfigureerd.</div>':Object.entries(e).map(([a,s])=>{let t=(s.queue.pending||0)+(s.queue.processing||0)+(s.queue.done||0)+(s.queue.error||0),i=s.queue.done||0,n=t>0?Math.round(i/t*100):0,r=s.paused,c=(s.stats.errors||0)>0,d=r?'<span class="enrichment-dot enrichment-dot--paused" title="Gepauzeerd">\u23F8</span>':c?'<span class="enrichment-dot enrichment-dot--error" title="Fouten">\u26A0</span>':s.enabled?'<span class="enrichment-dot enrichment-dot--running" title="Actief">\u25CF</span>':'<span class="enrichment-dot enrichment-dot--disabled" title="Uitgeschakeld">\u25CB</span>',y=s.stats.lastSuccess?new Date(s.stats.lastSuccess).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"}):"\u2014",m=r?"Hervatten":"Pauzeren",g=r?"resume":"pause";return`
      <div class="enrichment-worker-card" data-source="${o(a)}">
        <div class="enrichment-worker-header">
          ${d}
          <span class="enrichment-worker-label">${o(s.label||a)}</span>
          <button class="enrichment-pause-btn" data-action="${o(g)}" data-source="${o(a)}">${o(m)}</button>
        </div>
        <div class="enrichment-worker-stats">
          <span class="enrichment-stat" title="In wachtrij">${s.queue.pending||0} wachtend</span>
          <span class="enrichment-stat">${s.queue.done||0} klaar</span>
          <span class="enrichment-stat ${c?"enrichment-stat--error":""}">${s.stats.errors||0} fouten</span>
          <span class="enrichment-stat enrichment-stat--muted">Laatste: ${o(y)}</span>
        </div>
        <div class="enrichment-progress-bar">
          <div class="enrichment-progress-fill" style="width:${n}%"></div>
        </div>
        <div class="enrichment-progress-label">${n}% (${i}/${t})</div>
      </div>`}).join("")}async function W(){let e=document.getElementById("enrichment-workers");if(e)try{let a=await p("/api/enrichment/status");e.innerHTML=_t(a),e.querySelectorAll(".enrichment-pause-btn").forEach(s=>{s.addEventListener("click",async()=>{let{action:t,source:i}=s.dataset;s.disabled=!0;try{await fetch(`/api/enrichment/${t}/${i}`,{method:"POST"}),await W()}catch{s.disabled=!1}})})}catch{e.innerHTML='<div class="enrichment-error">Enrichment status niet beschikbaar.</div>'}}function at(e){let a=document.getElementById("home-np-indicator");a&&(e?.playing&&e.track?(a.querySelector(".home-np-track").textContent=`${e.track}${e.artist?" \u2014 "+e.artist:""}`,a.style.display="flex"):a.style.display="none")}function O(e,a){a=a||"#333";let s=document.getElementById("home-toast");s&&s.remove();let t=document.createElement("div");t.id="home-toast",t.textContent=e,t.style.cssText=`
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:${a};color:#fff;padding:10px 18px;border-radius:6px;
    font-size:13px;z-index:9999;pointer-events:none;
    animation:fadeInUp .2s ease;
  `,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}export{Qt as loadHome};
