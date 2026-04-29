import{a as w}from"./chunk-O3CMCOSC.js";import{a as F,c as Q}from"./chunk-2UCV5F4T.js";import{d as M,h as o,j as J,z as v}from"./chunk-HCN2ZK5I.js";import{a as G}from"./chunk-2BMKGNH5.js";var S=["#1a237e","#283593","#3949ab","#5c6bc0","#7986cb","#9fa8da"],O=null;function at(e){let a=[...e];for(let s=a.length-1;s>0;s--){let t=Math.floor(Math.random()*(s+1));[a[s],a[t]]=[a[t],a[s]]}return a}typeof window<"u"&&!window._imgFb&&(window._imgFb=function(e,a){if(!e._d){e._d=1;var s=e.getAttribute("data-fb");if(s){e.src=s;return}}e.style.display="none",e.insertAdjacentHTML("afterend",'<div class="home-recent-cover-ph">'+(a||"\u266A")+"</div>")});function P(e,a,s,t,i,n){t=t||120,i=i||"\u266A";let r=e?M(e,t):null,l=a?"/api/imageproxy/artist/"+encodeURIComponent(a):null,d=r||l;if(!d)return'<div class="home-recent-cover-ph">'+i+"</div>";let y=n?' class="'+o(n)+'"':"",m=s?' alt="'+o(s)+'"':"",g=r&&l?' data-fb="'+o(l)+'"':"",u="_imgFb(this,'"+i+"')";return'<img src="'+o(d)+'"'+m+y+g+' loading="lazy" onerror="'+o(u)+'">'}function st(e){return!e||!Array.isArray(e)?{topartists:{artist:[]}}:{topartists:{artist:e.map(a=>({name:a.name,playcount:String(a.playcount||0),image:[null,null,{"#text":a.thumb||""},{"#text":a.thumb||""}],topTag:a.genre||null}))}}}function it(e){return!e||!Array.isArray(e)?{toptracks:{track:[]}}:{toptracks:{track:e.map(a=>({name:a.title,playcount:String(a.playcount||0),artist:{name:a.artist,"#text":a.artist},album:{"#text":a.album,name:a.album},image:[null,null,{"#text":a.thumb||""}]}))}}}function U(e){return!e||!Array.isArray(e)?[]:e.map(a=>({name:a.title,artist:{"#text":a.artist},album:{"#text":a.album},image:[null,null,{"#text":a.thumb||""}],date:{uts:String(a.viewedAt)}}))}function T(e){return e==null||isNaN(e)?"\u2014":Number(e).toLocaleString("nl-NL")}function Z(e){if(!e)return"";let a=new Date(e),s=Date.now()-a.getTime(),t=Math.floor(s/864e5);return t<1?"Vandaag":t===1?"Gisteren":t<7?`${t}d geleden`:t<31?`${Math.floor(t/7)}w geleden`:`${Math.floor(t/30)}mo geleden`}function C(e,a=120){return e?M(e,a):null}function gt(e,a,s){let t=e||"Muzikant",i=a?.artists??a?.artistCount??"\u2026",n=a?.albums??a?.albumCount??"\u2026",r=a?.tracks??a?.trackCount??"\u2026",l=a?.composers??a?.composerCount??"\u2014",d='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',y='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>',m='<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',g='<svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>',u=s?.ok?`<span style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; display: inline-block; margin-left: 8px; title='Last.fm connected'"></span>`:`<span style="width: 8px; height: 8px; background: #f44336; border-radius: 50%; display: inline-block; margin-left: 8px;" title='Last.fm unavailable'></span>`;return`
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${o(t)}${u}</div>

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
            <div class="home-stat-value" id="hstat-composers">${T(l)}</div>
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
    </div>`}function bt(e){if(!e||e<1)return"0m";if(e<60)return`${Math.round(e)}m`;let a=Math.floor(e/60),s=Math.round(e%60);return s>0?`${a}h ${s}m`:`${a}h`}function nt(e,a){let s={};if(a&&Array.isArray(a))for(let u of a)u.date!=null&&(s[u.date]=u.minutes||(u.count?u.count*3.5:0));else for(let u of e||[]){let h=u.date?.uts;if(!h)continue;let f=new Date(parseInt(h,10)*1e3).toISOString().slice(0,10);s[f]=(s[f]||0)+3.5}let t=new Date,i=t.getDay(),n=new Date(t);n.setDate(t.getDate()-(i+6)%7),n.setHours(0,0,0,0);let r=[];for(let u=0;u<4;u++){let h=new Date(n);h.setDate(n.getDate()-u*7);let k=[];for(let f=0;f<7;f++){let L=new Date(h);L.setDate(h.getDate()+f);let B=L.toISOString().slice(0,10);k.push({key:B,minutes:s[B]||0})}r.push({days:k,totalMinutes:k.reduce((f,L)=>f+L.minutes,0)})}let l=Math.max(...r.map(u=>u.totalMinutes),1),d=Math.max(...r.flatMap(u=>u.days.map(h=>h.minutes)),1);function y(u){if(!u)return"width:6px;height:6px;background:#e0e0e0;";let h=u/d;return h<.25?"width:10px;height:10px;background:var(--accent);opacity:0.4;":h<.6?"width:16px;height:16px;background:var(--accent);opacity:0.7;":"width:24px;height:24px;background:var(--accent);opacity:1;"}let m=r.map(u=>{let h=u.totalMinutes>0?Math.round(u.totalMinutes/l*100):0,k=u.days.map(f=>`<div class="activity-dot-cell"><div class="activity-dot" style="${y(f.minutes)}" title="${f.key}: ${Math.round(f.minutes)}min"></div></div>`).join("");return`
      <div class="activity-bar-wrap">
        <div class="activity-bar" style="width:${h}%"></div>
        <span class="activity-bar-label">${bt(u.totalMinutes)}</span>
      </div>
      ${k}`}).join("");return`
    <div class="home-wylbt-card activity-matrix-card">
      <div class="home-wylbt-card-header" style="margin-bottom:16px">
        <div class="home-wylbt-card-title">Recent listening</div>
      </div>
      <div class="activity-grid">
        <!-- Header row -->
        <div class="activity-grid-label-header">Last 4 weeks</div>
        ${["M","T","W","T","F","S","S"].map(u=>`<div class="activity-day-label">${u}</div>`).join("")}
        <!-- Week rows -->
        ${m}
      </div>
    </div>`}function R(e,a="played"){return e?.length?e.slice(0,8).map(t=>{let i=typeof t.artist=="object"?t.artist?.["#text"]||t.artist?.name||"":t.artist||"",n=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",r=P(n,i,t.name,140,"\u266A"),l="";if(a==="added"&&t.addedAt)l=Z(t.addedAt);else if(a==="played"&&t.date?.uts){let d=new Date(parseInt(t.date.uts,10)*1e3);l=Z(d.toISOString())}return`
      <div class="home-recent-cover">
        ${r}
        ${l?`<div class="home-recent-cover-date">${l}</div>`:""}
        <div class="home-recent-cover-title" title="${o(t.name)}">${o(t.name)}</div>
        <div class="home-recent-cover-artist" title="${o(i)}">${o(i)}</div>
      </div>`}).join(""):'<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>'}function wt(e){return`
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
    </div>`}function xt(e){let a=at(e||[]).slice(0,8);return a.length?`
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
    </div>`:""}function $t(e){let a=(e||[]).slice(0,4);return a.length?`
    <div class="home-section-header">
      <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-listen-later-grid">${a.map(t=>{let i=C(t.image,96);return`
      <div class="home-listen-later-item">
        ${i?`<img class="home-listen-later-img" src="${o(i)}" alt="${o(t.name)}" loading="lazy">`:'<div class="home-listen-later-ph">\u266B</div>'}
        <div class="home-listen-later-info">
          <div class="home-listen-later-name" title="${o(t.name)}">${o(t.name)}</div>
          <div class="home-listen-later-artist" title="${o(t.artist||"")}">${o(t.artist||"")}</div>
        </div>
        <div class="home-listen-later-type">${o(t.type||"album")}</div>
      </div>`}).join("")}</div>`:`
      <div class="home-section-header">
        <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
        <button class="home-more-btn" data-switch="albums">MORE</button>
      </div>
      <div class="home-listen-later-grid">
        <div class="home-listen-later-empty">Je wishlist is leeg. Voeg albums toe via de zoekfunctie.</div>
      </div>`}async function kt(){let e=document.querySelectorAll("#home-loved-covers .home-recent-cover");if(!e.length)return;let a=new Set;if(e.forEach(t=>{let n=t.querySelector(".home-recent-cover-artist")?.textContent?.trim();n&&n!=="[object Object]"&&a.add(n)}),!a.size)return;let s=new Map;await Promise.allSettled([...a].slice(0,8).map(async t=>{try{let i=await v(`/api/plex/tracks?artist=${encodeURIComponent(t)}&limit=0`);for(let n of i?.tracks||[])n.thumb&&s.set(`${n.artist.toLowerCase()}||${n.title.toLowerCase()}`,n.thumb)}catch{}})),s.size&&e.forEach(t=>{let i=t.querySelector(".home-recent-cover-ph");if(!i)return;let n=t.querySelector(".home-recent-cover-title"),r=t.querySelector(".home-recent-cover-artist"),l=n?.textContent?.trim()?.toLowerCase(),d=r?.textContent?.trim()?.toLowerCase();if(!l||!d)return;let y=s.get(`${d}||${l}`);if(y){let m=document.createElement("img");m.src=y,m.alt=n.textContent,m.loading="lazy",m.onerror=()=>{},i.replaceWith(m)}})}async function Et(e){let a=(e?.topartists?.artist||[]).slice(0,10);if(!a.length)return"";let s=null;try{let r=sessionStorage.getItem("featuredArtistName");r&&(s=a.find(l=>l.name===r))}catch{}if(!s){let r=Math.floor(Math.random()*a.length);s=a[r];try{sessionStorage.setItem("featuredArtistName",s.name)}catch{}}let t=[];try{let l=((await v(`/api/plex/library?q=${encodeURIComponent(s.name)}&sort=addedAt:desc&limit=20`))?.library||[]).filter(d=>d.artist?.toLowerCase()===s.name.toLowerCase());if(l.length>0){let d=new Set,y=[];for(let m of l)d.has(m.album)||(d.add(m.album),y.push(m));t=y.slice(0,3).map(m=>({name:m.album,artist:{name:m.artist},_plexThumb:m.thumb}))}}catch{}if(!t.length)try{let r=await v(`/api/artist/${encodeURIComponent(s.name)}`);t=(r?.topalbums?.album||r?.albums||[]).slice(0,3)}catch{}let i=J(s.name),n=t.map(r=>{let l=r.artist?.name||r.artist||s.name,d;if(r._plexThumb)d=`<img src="${o(r._plexThumb)}" alt="${o(r.name||"")}" class="featured-album-img" loading="lazy" onerror="this.style.display='none'">`;else{let y=r.image?.[2]?.["#text"]||r.image?.[1]?.["#text"]||"";d=P(y,l,r.name,80,"\u266B","featured-album-img")}return`
      <div class="featured-album-card">
        ${d}
        <div class="featured-album-info">
          <div class="featured-album-artist">${o(r.artist?.name||r.artist||"")}</div>
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
    </div>`}function Lt(e){let a=(e?.topartists?.artist||[]).slice(0,5);return a.length?`
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
    </div>`:""}async function At(e){try{let a=(e?.topartists?.artist||e||[]).slice(0,5);if(!a.length)return"";let s=[];try{let i=await v("/api/discover");i?.artists&&Array.isArray(i.artists)&&(s=i.artists.slice(0,5))}catch{}if(s.length===0){let i=a.slice(0,3).map(async l=>{try{let d=await v(`/api/artist/${encodeURIComponent(l.name)}/similar`,{signal:AbortSignal.timeout(5e3)});return{source:l.name,similar:(d?.similarartists?.artist||d?.similar||[]).slice(0,5)}}catch{return{source:l.name,similar:[]}}}),n=await Promise.all(i),r=new Set(a.map(l=>l.name.toLowerCase()));for(let l of n)for(let d of l.similar){let y=(d.name||d).toLowerCase();!r.has(y)&&s.length<5&&(r.add(y),s.push({name:d.name||d,image:d.image,sources:[l.source]}))}}return s.length?`
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
          ${s.map(i=>{let n=typeof i=="string"?i:i.name,r=i.image,l=i.sources||[],d=typeof i!="string"&&(i.image?.[3]?.["#text"]||i.image?.[2]?.["#text"]||i.thumb)||"",y=P(d,n,n,120,"\u266A","home-rec-artist-img"),m="";if(l.length>0){let g=l.slice(0,2);g.length===1?m=`If you like ${g[0]}`:m=`If you like ${g.join(" and ")}`}return`
        <div class="home-rec-artist" data-artist="${o(n)}">
          <div class="home-rec-artist-img-wrap">${y}</div>
          <div class="home-rec-artist-name">${o(n)}</div>
          ${m?`<div class="home-rec-artist-reason">${o(m)}</div>`:""}
        </div>`}).join("")}
        </div>
      </div>`:""}catch(a){return console.warn("Recommended artists render mislukt:",a),""}}async function It(){try{let e=await v("/api/plex/playlists"),a=(e?.playlists||e||[]).slice(0,5);return a.length?`
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
          ${a.map(t=>{let i="",n="";return t.thumb?(i=M(t.thumb,360),n=`background: url('${o(i)}'); background-size: cover; background-position: center;`):n="background: linear-gradient(135deg, rgba(40,60,140,0.8), rgba(60,30,100,0.8));",`
        <div class="home-playlist-card" data-playlist-id="${o(t.ratingKey||t.key||t.id||"")}" data-playlist-title="${o(t.title||"")}" data-playlist-name="${o(t.title||"")}">
          ${i?`<img class="home-playlist-card-img" src="${o(i)}" alt="${o(t.title||"")}" loading="lazy">`:'<div class="home-playlist-card-ph">\u266B</div>'}
          <div class="home-playlist-name">${o(t.title||"Playlist")}</div>
        </div>`}).join("")}
        </div>
      </div>`:""}catch(e){return console.warn("Playlists render mislukt:",e),""}}function Tt(e){let s=(e?.topartists?.artist||[]).slice(0,2).map((t,i)=>{let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=n?M(n,400):"";return`
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
    <div class="home-daily-mixes">${s.join("")}</div>`}async function Mt(e){let a=(e?.topartists?.artist||[]).slice(0,2);for(let s=0;s<a.length;s++){let t=a[s],i=document.getElementById(`home-mix-featuring-${s}`);if(i)try{let n=new AbortController,r=setTimeout(()=>n.abort(),5e3);try{let l=await v(`/api/artist/${encodeURIComponent(t.name)}/similar`,{signal:n.signal});clearTimeout(r);let d=(l?.similarartists?.artist||l?.similar||[]).slice(0,3);d.length?i.textContent=`Featuring ${d.map(y=>y.name||y).join(", ")} and more`:i.textContent=""}catch{clearTimeout(r),i.textContent=""}}catch{i.textContent=""}}}function St(e){if(e?.genres&&Array.isArray(e.genres))return e.genres.map((t,i)=>({name:t.name,count:t.count,pct:t.pct||Math.round(t.count/e.genres.reduce((n,r)=>n+r.count,0)*100),color:S[i%S.length]})).slice(0,6);let a=e?.topartists?.artist||[],s={};for(let t of a){let i=t.topTag;if(!i||i.toLowerCase()==="other")continue;let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=n?M(n,400):null;s[i]||(s[i]={name:i,count:0,artistImage:r}),s[i].count+=parseInt(t.playcount,10)||0,!s[i].artistImage&&r&&(s[i].artistImage=r)}return Object.values(s).sort((t,i)=>i.count-t.count).slice(0,6)}function Ct(e){if(!e?.length)return"";let a=i=>{let n=i.artistImage?`background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${o(i.artistImage)}'); background-size: cover; background-position: center;`:"background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));";return`
      <div class="genre-card" data-genre="${o(i.name)}" style="${n}" role="button" tabindex="0">
        <span class="genre-card-name">${o(i.name)}</span>
      </div>`},s=e.slice(0,3),t=e.slice(3,6);return`
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${s.map(a).join("")}</div>
      <div class="genres-grid-row">${t.map(a).join("")}</div>
    </div>`}function rt(e,a){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(h=>(h.type||"album").toLowerCase()!=="single"),i=s.filter(h=>(h.type||"").toLowerCase()==="single"),n=(a==="singles"?i:t).slice(0,3);if(!n.length)return'<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>';let[r,...l]=n,d=C(r.image||r.thumb,400),y=d?`<img src="${o(d)}" alt="${o(r.title||r.album||"")}" loading="lazy">`:'<div class="releases-main-ph">\u266B</div>',m=r.description||r.bio||"",g=`
    <div class="releases-main-card">
      ${y}
      <div class="releases-main-info">
        <div class="releases-main-artist">${o(r.artist||"\u2014")}</div>
        <div class="releases-main-title">${o(r.title||r.album||"\u2014")}</div>
        <div class="releases-main-date">${o(r.date||r.releaseDate||"")}</div>
        ${m?`<div class="releases-main-desc">${o(m)}</div>`:""}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`,u=l.slice(0,2).map((h,k)=>{let f=C(h.image||h.thumb,160);return`
      <div class="releases-small-card">
        ${f?`<img src="${o(f)}" alt="${o(h.title||h.album||"")}" loading="lazy">`:'<div class="releases-small-ph">\u266B</div>'}
        <div class="releases-small-info">
          <div class="releases-small-artist">${o(h.artist||"\u2014")}</div>
          <div class="releases-small-title">${o(h.title||h.album||"\u2014")}</div>
          <div class="releases-small-date">${o(h.date||h.releaseDate||"")}</div>
          <div class="releases-plex-badge" id="plex-badge-${k+1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`}).join("");return`
    <div class="releases-preview">
      ${g}
      <div class="releases-stack">${u}</div>
    </div>`}function Rt(e,a="albums"){return`
    ${`
    <div class="home-section-header">
      <div class="home-section-title">New releases for you</div>
      <div class="home-tabs">
        <button class="home-tab home-tab--releases ${a==="albums"?"active":""}" data-releases-tab="albums">ALBUMS</button>
        <button class="home-tab home-tab--releases ${a==="singles"?"active":""}" data-releases-tab="singles">SINGLES</button>
      </div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>`}
    <div id="releases-body">
      ${rt(e,a)}
    </div>`}async function tt(e,a){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(l=>(l.type||"album").toLowerCase()!=="single"),i=s.filter(l=>(l.type||"").toLowerCase()==="single"),n=(a==="singles"?i:t).slice(0,3);if(!n.length)return;let r=n.map(l=>({artist:l.artist||"",album:l.title||l.album||""}));try{let l=await fetch("/api/plex/check-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:r})});if(!l.ok)throw new Error(`HTTP ${l.status}`);let y=(await l.json()).results||{};r.forEach((m,g)=>{let u=`${m.artist}||${m.album}`,h=document.getElementById(`plex-badge-${g}`);h&&y[u]&&(h.style.display="inline-flex")})}catch(l){console.warn("Plex check-batch aanroep mislukt:",l)}}function Pt(e){let a=document.getElementById("home-donut-chart");!a||!window.Chart||(O&&(O.destroy(),O=null),O=new window.Chart(a,{type:"doughnut",data:{labels:e.map(s=>s.name),datasets:[{data:e.map(s=>s.count),backgroundColor:e.map(s=>s.color),borderWidth:0,hoverOffset:4}]},options:{cutout:"65%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:s=>` ${s.label}: ${T(s.parsed)} plays`}}},animation:{duration:400}}}))}async function ot(e){let a=document.getElementById("home-genres-legend");try{let s=null;try{let t=await v(`/api/plex/stats?period=${e}`);if(t&&t.source==="plex"&&t.genres&&Array.isArray(t.genres)&&t.genres.length>0){let i=t.genres.reduce((n,r)=>n+r.count,0)||1;s=t.genres.map((n,r)=>({name:n.name,count:n.count,pct:Math.round(n.count/i*100),color:S[r%S.length]})).slice(0,6)}}catch{}if(!s){let i=((await v(`/api/top/artists?period=${e}`))?.topartists?.artist||[]).slice(0,8),n={};for(let m of i){let g=m.topTag||"Other",u=parseInt(m.playcount,10)||0;n[g]=(n[g]||0)+u}let r=Object.entries(n).sort((m,g)=>g[1]-m[1]),l=r.slice(0,6),d=r.slice(6).reduce((m,[,g])=>m+g,0);if(d>0){let m=l.findIndex(([g])=>g==="Other");m>=0?l[m][1]+=d:l.push(["Other",d])}let y=l.reduce((m,[,g])=>m+g,0)||1;s=l.map(([m,g],u)=>({name:m,count:g,pct:Math.round(g/y*100),color:S[u%S.length]}))}a&&(a.innerHTML=s.map(t=>`
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${t.color}"></div>
          <div class="home-genres-legend-name">${o(t.name)}</div>
        </div>`).join("")),Pt(s)}catch(s){console.warn("Genre chart mislukt:",s),a&&(a.innerHTML='<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>')}}function lt(e){let a=(e?.topartists?.artist||[]).slice(0,4);if(!a.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=parseInt(a[0]?.playcount,10)||1;return a.map(t=>{let i=Math.round((parseInt(t.playcount,10)||0)/s*100),n=C(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72),r=n?`<img class="home-wylbt-artist-img" src="${o(n)}" alt="${o(t.name)}" loading="lazy">`:'<div class="home-wylbt-artist-ph">\u266A</div>';return`
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
      </div>`}).join("")}function Bt(e){let a={};for(let s of e?.toptracks?.track||[]){let t=s.album?.["#text"]||s.album?.name||null,i=s.artist?.name||s.artist?.["#text"]||(typeof s.artist=="string"?s.artist:"");if(!t)continue;let n=`${t}|||${i}`;a[n]||(a[n]={album:t,artist:i,playcount:0,image:s.image}),a[n].playcount+=parseInt(s.playcount,10)||0}return Object.values(a).sort((s,t)=>t.playcount-s.playcount).slice(0,4)}function ct(e){let a=Bt(e);if(!a.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=a[0]?.playcount||1;return a.map(t=>{let i=Math.round(t.playcount/s*100),n=C(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72);return`
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
      </div>`}).join("")}function Ht(e,a){return`
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
          ${ct(a)}
        </div>
      </div>

    </div>`}function Dt(){let e=document.getElementById("home-recent-covers"),a=document.getElementById("home-recent-prev"),s=document.getElementById("home-recent-next");if(!e||!a||!s)return;let t=0,i=160;function n(){let r=Math.max(0,e.scrollWidth-e.parentElement.offsetWidth);t=Math.max(0,Math.min(t,r)),e.style.transform=`translateX(-${t}px)`,a.disabled=t<=0,s.disabled=t>=r}a.addEventListener("click",()=>{t=Math.max(0,t-i),n()}),s.addEventListener("click",()=>{t+=i,n()}),n()}async function Ot(e){let a,s;try{let n=await v(`/api/plex/stats?period=${e}`);n&&n.source==="plex"?(a=st(n.topArtists),s=it(n.topTracks)):[a,s]=await Promise.all([v(`/api/topartists?period=${e}`).catch(()=>null),v(`/api/toptracks?period=${e}`).catch(()=>null)])}catch{[a,s]=await Promise.all([v(`/api/topartists?period=${e}`).catch(()=>null),v(`/api/toptracks?period=${e}`).catch(()=>null)])}let t=document.getElementById("home-wylbt-artists-list");t&&(t.innerHTML=lt(a));let i=document.getElementById("home-wylbt-releases-list");i&&(i.innerHTML=ct(s)),t?.querySelectorAll("[data-artist]").forEach(n=>{n.addEventListener("click",()=>w("artist-detail",{name:n.dataset.artist}))}),await ot(e)}async function jt(e){localStorage.setItem("homePeriod",e),document.querySelectorAll(".home-period-pill").forEach(a=>{a.classList.toggle("active",a.dataset.period===e)});try{let a=null,s=[],t=await v(`/api/plex/stats?period=${e}`);if(t?.dailyPlays?.some(n=>n.minutes>0||n.count>0))a=t.dailyPlays,s=t.recentTracks||[];else{let n=await v(`/api/activity?period=${e}`);n?.dailyPlays?.some(r=>r.minutes>0||r.count>0)&&(a=n.dailyPlays,s=n.recentTracks||[])}let i=document.querySelector(".activity-matrix-card");if(i){let n=s.length?U(s):[];i.outerHTML=nt(n,a)}}catch(a){console.warn("Activity matrix herlaad mislukt:",a)}if(e==="today")try{let a=new Date;a.setHours(0,0,0,0);let s=Math.floor(a.getTime()/1e3),i=((await v("/api/plex/stats?period=today"))?.recentTracks||[]).filter(r=>parseInt(r.date?.uts||0,10)>=s),n=document.getElementById("home-recent-covers");n&&(n.innerHTML=R(i))}catch(a){console.warn("Recent activity herlaad mislukt:",a)}else try{let s=(await v(`/api/plex/stats?period=${e}`))?.recentTracks||[],t=document.getElementById("home-recent-covers");t&&(t.innerHTML=R(s))}catch(a){console.warn("Recent activity herlaad mislukt:",a)}await Ot(e);try{let s=(await v(`/api/plex/stats?period=${e}`))?.topArtists||[],t=document.getElementById("home-recent-artists");if(t){let i=s.slice(0,5);if(i.length){let n=i.map(r=>{let l=r.thumb||r.image?.[3]?.["#text"]||r.image?.[2]?.["#text"],d=C(l,200),y=d?`<img class="home-artist-circle-img" src="${o(d)}" alt="${o(r.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
            <div class="home-artist-circle-item" data-artist="${o(r.name)}">
              <div class="home-artist-circle">${y}</div>
              <div class="home-artist-circle-name">${o(r.name)}</div>
            </div>`}).join("");t.innerHTML=n,t.querySelectorAll(".home-artist-circle-item").forEach(r=>{r.addEventListener("click",()=>{let l=r.dataset.artist;l&&w("artist-detail",{name:l})})})}}}catch(a){console.warn("Recent artists herlaad mislukt:",a)}}async function zt(){if(G.user?.name)return G.user.name;try{let e=await v("/api/user");return e?.user?.name||e?.name||null}catch{return null}}function dt(e){if(!e)return{};let a={...e};return e.artists!==void 0&&e.artistCount===void 0&&(a.artistCount=e.artists),e.albums!==void 0&&e.albumCount===void 0&&(a.albumCount=e.albums),e.tracks!==void 0&&e.trackCount===void 0&&(a.trackCount=e.tracks),a.artistCount!==void 0?a:e.library?dt(e.library):e.stats?e.stats:a}async function Wt(){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="home-page" aria-busy="true" aria-label="Laden\u2026">
      ${Q()}
      ${F(6,1)}
      ${F(4,2)}
    </div>`;let[a,s,t,i,n,r,l]=await Promise.all([zt().catch(()=>null),v("/api/plex/status").catch(()=>null),v("/api/plex/stats?period=7day").catch(()=>null),v("/api/wishlist").catch(()=>null),v("/api/releases").catch(()=>null),v("/api/user").catch(()=>null),v("/api/loved").catch(()=>null)]),d,y,m;t&&t.source==="plex"?(d=st(t.topArtists),y=it(t.topTracks),m={recenttracks:{track:U(t.recentTracks)}}):[d,y,m]=await Promise.all([v("/api/topartists?period=7day").catch(()=>null),v("/api/toptracks?period=7day").catch(()=>null),v("/api/recent?limit=200").catch(()=>null)]);let g={ok:r&&!r._stale,user:r?.user?.name||null},u=dt(s),h=m?.recenttracks?.track||[],k=i?.wishlist||i||[],f=n,L=l?.lovedtracks?.track||[],B=St(d),mt=await Et(d).catch(()=>""),ut=await At(d).catch(()=>""),vt=await It().catch(()=>""),z=h,N=null;if(t?.source==="plex"&&t?.dailyPlays?.some(c=>c.minutes>0||c.count>0))N=t.dailyPlays;else try{let c=await v("/api/activity?period=1month");c?.dailyPlays?.some(p=>p.minutes>0||p.count>0)&&(N=c.dailyPlays,c.recentTracks?.length&&(z=U(c.recentTracks)))}catch{try{z=(await v("/api/recent?limit=200"))?.recenttracks?.track||h}catch{}}e.innerHTML=`
    <div class="home-page">

      <!-- 1. Greeting + Stats + Last.fm Status -->
      ${gt(a,u,g)}

      <!-- 1b. Live Radio Bar -->
      ${ft()}

      <!-- 1c. Recent Listening Activity Matrix -->
      ${nt(z,N)}

      <!-- 2. Recent Activity -->
      ${wt(h)}

      <!-- 2b. Loved Tracks -->
      ${xt(L)}

      <!-- 2c. Featured Artist Banner -->
      ${mt}

      <!-- 3. Listen Later -->
      <div>${$t(k)}</div>

      <!-- 3b. Recent Artists -->
      <div>${Lt(d)}</div>

      <!-- 3c. Recommended Artists -->
      <div>${ut}</div>

      <!-- 3d. Your Playlists -->
      <div id="home-playlists-container">${vt}</div>

      <!-- 4. Daily Mixes -->
      <div>${Tt(d)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${Ct(B)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${Rt(f)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${Ht(d,y)}
      </div>

    </div>`;let ht=localStorage.getItem("homePeriod")||"7day";e.querySelectorAll(".home-period-pill").forEach(c=>{c.classList.toggle("active",c.dataset.period===ht)}),e.querySelectorAll(".home-period-pill").forEach(c=>{c.addEventListener("click",async()=>{let p=c.dataset.period;p&&await jt(p)})}),Dt(),kt().catch(()=>{}),ot("7day"),e.querySelectorAll("[data-switch]").forEach(c=>{c.addEventListener("click",()=>w(c.dataset.switch))}),e.querySelectorAll("#home-wylbt-artists-list [data-artist]").forEach(c=>{c.addEventListener("click",()=>w("artist-detail",{name:c.dataset.artist}))}),document.getElementById("home-recent-more")?.addEventListener("click",()=>{w("albums")}),document.getElementById("home-loved-more")?.addEventListener("click",()=>{w("listen-later")}),e.querySelectorAll(".genre-card").forEach(c=>{c.addEventListener("click",()=>w("ontdek")),c.addEventListener("keydown",p=>{(p.key==="Enter"||p.key===" ")&&w("ontdek")})});let H="albums";e.querySelectorAll("[data-releases-tab]").forEach(c=>{c.addEventListener("click",()=>{H=c.dataset.releasesTab,e.querySelectorAll("[data-releases-tab]").forEach(b=>b.classList.toggle("active",b===c));let p=document.getElementById("releases-body");p&&(p.innerHTML=rt(f,H),tt(f,H))})});let Y="played";e.querySelectorAll("[data-recent-tab]").forEach(c=>{c.addEventListener("click",async()=>{e.querySelectorAll("[data-recent-tab]").forEach(b=>b.classList.toggle("active",b===c)),Y=c.dataset.recentTab;let p=document.getElementById("home-recent-covers");if(p)if(Y==="added")try{let x=((await v("/api/plex/library?sort=addedAt:desc&limit=8"))?.library||[]).map($=>({name:$.album,artist:{"#text":$.artist},image:$.thumb?[null,null,{"#text":$.thumb}]:[null,null,{"#text":""}],addedAt:new Date($.addedAt*1e3).toISOString()}));p.innerHTML=R(x,"added")}catch(b){console.warn("Failed to load added items:",b),p.innerHTML='<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Fout bij laden van recent toegevoegde albums</div>'}else p.innerHTML=R(h,"played")})}),e.querySelectorAll(".home-artist-circle-item").forEach(c=>{c.addEventListener("click",()=>{let p=c.dataset.artist;p&&w("artist-detail",{name:p})})});let A=document.getElementById("featured-play-btn");A&&A.addEventListener("click",async()=>{let c=A.dataset.artist;if(c){A.disabled=!0,A.textContent="\u2026";try{let p=await v(`/api/plex/search?q=${encodeURIComponent(c)}&limit=3`),b=(p?.artists||[]).find(D=>D.title?.toLowerCase()===c.toLowerCase())||p?.artists?.[0];if(!b?.ratingKey){j(`"${c}" niet gevonden in Plex`,"#e05a2b");return}let $=(await v(`/api/plex/artists/${b.ratingKey}`))?.artist?.albums||[];if(!$.length){j("Geen albums gevonden in Plex","#e05a2b");return}let I=at($),{playOnZone:K}=await import("./plexRemote-NMGVQOEF.js");await K(I[0].ratingKey,"music")}catch(p){console.error("Featured artist play mislukt:",p),j("Afspelen mislukt","#e05a2b")}finally{A.disabled=!1,A.innerHTML='<span class="featured-play-icon">\u25B6</span><span class="featured-play-text">PLAY TRACKS</span>'}}}),e.querySelectorAll(".home-loved-play-btn").forEach(c=>{c.addEventListener("click",async p=>{p.stopPropagation();let b=c.closest("[data-track]"),x=b?.dataset.track||"",$=b?.dataset.artist||"";if(x){c.textContent="\u2026";try{let I=encodeURIComponent(`${x} ${$}`.trim()),D=(await v(`/api/plex/search?q=${I}&limit=5`))?.tracks||[],X=D.find(yt=>yt.title?.toLowerCase()===x.toLowerCase())||D[0];if(!X?.ratingKey){j(`"${x}" niet gevonden in Plex`,"#e05a2b");return}let{playOnZone:pt}=await import("./plexRemote-NMGVQOEF.js");await pt(X.ratingKey,"music")}catch(I){console.error("Loved track play mislukt:",I)}finally{c.textContent="\u25B6"}}})});let W=document.getElementById("home-np-indicator");W&&(fetch("/api/plex/nowplaying").then(c=>c.json()).then(c=>et(c)).catch(()=>{}),W.addEventListener("click",()=>w("nu")));let V=c=>{document.getElementById("home-np-indicator")?et(c.detail):window.removeEventListener("plex-np-update",V)};window.addEventListener("plex-np-update",V);let _=document.getElementById("home-recent-artists");_&&(document.getElementById("home-artists-prev")?.addEventListener("click",()=>{_.scrollBy({left:-256,behavior:"smooth"})}),document.getElementById("home-artists-next")?.addEventListener("click",()=>{_.scrollBy({left:256,behavior:"smooth"})}));let q=document.getElementById("home-recommended-artists");q&&(document.getElementById("home-rec-artists-prev")?.addEventListener("click",()=>{q.scrollBy({left:-320,behavior:"smooth"})}),document.getElementById("home-rec-artists-next")?.addEventListener("click",()=>{q.scrollBy({left:320,behavior:"smooth"})})),e.querySelectorAll(".home-rec-artist").forEach(c=>{c.addEventListener("click",()=>{let p=c.dataset.artist;p&&w("artist-detail",{name:p})})});let E=document.getElementById("home-playlists");if(E){let p=document.getElementById("home-playlists-prev"),b=document.getElementById("home-playlists-next"),x=()=>{let $=E.scrollLeft<=0,I=E.scrollLeft>=E.scrollWidth-E.clientWidth-10;p?.toggleAttribute("disabled",$),b?.toggleAttribute("disabled",I)};p?.addEventListener("click",()=>{E.scrollBy({left:-400,behavior:"smooth"}),setTimeout(x,400)}),b?.addEventListener("click",()=>{E.scrollBy({left:400,behavior:"smooth"}),setTimeout(x,400)}),E.addEventListener("scroll",x),x()}e.querySelectorAll(".home-playlist-card").forEach(c=>{c.addEventListener("click",()=>{let p=c.dataset.playlistId,b=c.dataset.playlistTitle||c.dataset.playlistName||"Afspeellijst";p&&w("playlist-detail",{id:p,title:b})})}),Mt(d),tt(f,H)}function et(e){let a=document.getElementById("home-np-indicator");a&&(e?.playing&&e.track?(a.querySelector(".home-np-track").textContent=`${e.track}${e.artist?" \u2014 "+e.artist:""}`,a.style.display="flex"):a.style.display="none")}function j(e,a){a=a||"#333";let s=document.getElementById("home-toast");s&&s.remove();let t=document.createElement("div");t.id="home-toast",t.textContent=e,t.style.cssText=`
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:${a};color:#fff;padding:10px 18px;border-radius:6px;
    font-size:13px;z-index:9999;pointer-events:none;
    animation:fadeInUp .2s ease;
  `,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}export{Wt as loadHome};
