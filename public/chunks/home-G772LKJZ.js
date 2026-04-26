import{a as w}from"./chunk-6EPTSU2N.js";import{a as F,c as Q}from"./chunk-2UCV5F4T.js";import{A as v,a as G,e as M,i as l,k as J}from"./chunk-LCSFBDUL.js";var S=["#1a237e","#283593","#3949ab","#5c6bc0","#7986cb","#9fa8da"],O=null;function at(e){let a=[...e];for(let s=a.length-1;s>0;s--){let t=Math.floor(Math.random()*(s+1));[a[s],a[t]]=[a[t],a[s]]}return a}typeof window<"u"&&!window._imgFb&&(window._imgFb=function(e,a){if(!e._d){e._d=1;var s=e.getAttribute("data-fb");if(s){e.src=s;return}}e.style.display="none",e.insertAdjacentHTML("afterend",'<div class="home-recent-cover-ph">'+(a||"\u266A")+"</div>")});function P(e,a,s,t,i,r){t=t||120,i=i||"\u266A";let n=e?M(e,t):null,o=a?"/api/imageproxy/artist/"+encodeURIComponent(a):null,c=n||o;if(!c)return'<div class="home-recent-cover-ph">'+i+"</div>";let y=r?' class="'+l(r)+'"':"",u=s?' alt="'+l(s)+'"':"",g=n&&o?' data-fb="'+l(o)+'"':"",m="_imgFb(this,'"+i+"')";return'<img src="'+l(c)+'"'+u+y+g+' loading="lazy" onerror="'+l(m)+'">'}function st(e){return!e||!Array.isArray(e)?{topartists:{artist:[]}}:{topartists:{artist:e.map(a=>({name:a.name,playcount:String(a.playcount||0),image:[null,null,{"#text":a.thumb||""},{"#text":a.thumb||""}],topTag:a.genre||null}))}}}function it(e){return!e||!Array.isArray(e)?{toptracks:{track:[]}}:{toptracks:{track:e.map(a=>({name:a.title,playcount:String(a.playcount||0),artist:{name:a.artist,"#text":a.artist},album:{"#text":a.album,name:a.album},image:[null,null,{"#text":a.thumb||""}]}))}}}function U(e){return!e||!Array.isArray(e)?[]:e.map(a=>({name:a.title,artist:{"#text":a.artist},album:{"#text":a.album},image:[null,null,{"#text":a.thumb||""}],date:{uts:String(a.viewedAt)}}))}function T(e){return e==null||isNaN(e)?"\u2014":Number(e).toLocaleString("nl-NL")}function Z(e){if(!e)return"";let a=new Date(e),s=Date.now()-a.getTime(),t=Math.floor(s/864e5);return t<1?"Vandaag":t===1?"Gisteren":t<7?`${t}d geleden`:t<31?`${Math.floor(t/7)}w geleden`:`${Math.floor(t/30)}mo geleden`}function R(e,a=120){return e?M(e,a):null}function gt(e,a,s){let t=e||"Muzikant",i=a?.artists??a?.artistCount??"\u2026",r=a?.albums??a?.albumCount??"\u2026",n=a?.tracks??a?.trackCount??"\u2026",o=a?.composers??a?.composerCount??"\u2014",c='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',y='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>',u='<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',g='<svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>',m=s?.ok?`<span style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; display: inline-block; margin-left: 8px; title='Last.fm connected'"></span>`:`<span style="width: 8px; height: 8px; background: #f44336; border-radius: 50%; display: inline-block; margin-left: 8px;" title='Last.fm unavailable'></span>`;return`
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${l(t)}${m}</div>

      <div class="home-stat-cards">
        <div class="home-stat-card">
          <div class="home-stat-icon">${c}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-artists">${T(i)}</div>
            <div class="home-stat-label">Artists</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${y}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-albums">${T(r)}</div>
            <div class="home-stat-label">Albums</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${u}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-tracks">${T(n)}</div>
            <div class="home-stat-label">Tracks</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${g}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-composers">${T(o)}</div>
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
    </div>`}function bt(e){if(!e||e<1)return"0m";if(e<60)return`${Math.round(e)}m`;let a=Math.floor(e/60),s=Math.round(e%60);return s>0?`${a}h ${s}m`:`${a}h`}function nt(e,a){let s={};if(a&&Array.isArray(a))for(let m of a)m.date!=null&&(s[m.date]=m.minutes||(m.count?m.count*3.5:0));else for(let m of e||[]){let h=m.date?.uts;if(!h)continue;let f=new Date(parseInt(h,10)*1e3).toISOString().slice(0,10);s[f]=(s[f]||0)+3.5}let t=new Date,i=t.getDay(),r=new Date(t);r.setDate(t.getDate()-(i+6)%7),r.setHours(0,0,0,0);let n=[];for(let m=0;m<4;m++){let h=new Date(r);h.setDate(r.getDate()-m*7);let k=[];for(let f=0;f<7;f++){let L=new Date(h);L.setDate(h.getDate()+f);let B=L.toISOString().slice(0,10);k.push({key:B,minutes:s[B]||0})}n.push({days:k,totalMinutes:k.reduce((f,L)=>f+L.minutes,0)})}let o=Math.max(...n.map(m=>m.totalMinutes),1),c=Math.max(...n.flatMap(m=>m.days.map(h=>h.minutes)),1);function y(m){if(!m)return"width:6px;height:6px;background:#e0e0e0;";let h=m/c;return h<.25?"width:10px;height:10px;background:var(--accent);opacity:0.4;":h<.6?"width:16px;height:16px;background:var(--accent);opacity:0.7;":"width:24px;height:24px;background:var(--accent);opacity:1;"}let u=n.map(m=>{let h=m.totalMinutes>0?Math.round(m.totalMinutes/o*100):0,k=m.days.map(f=>`<div class="activity-dot-cell"><div class="activity-dot" style="${y(f.minutes)}" title="${f.key}: ${Math.round(f.minutes)}min"></div></div>`).join("");return`
      <div class="activity-bar-wrap">
        <div class="activity-bar" style="width:${h}%"></div>
        <span class="activity-bar-label">${bt(m.totalMinutes)}</span>
      </div>
      ${k}`}).join("");return`
    <div class="home-wylbt-card activity-matrix-card">
      <div class="home-wylbt-card-header" style="margin-bottom:16px">
        <div class="home-wylbt-card-title">Recent listening</div>
      </div>
      <div class="activity-grid">
        <!-- Header row -->
        <div class="activity-grid-label-header">Last 4 weeks</div>
        ${["M","T","W","T","F","S","S"].map(m=>`<div class="activity-day-label">${m}</div>`).join("")}
        <!-- Week rows -->
        ${u}
      </div>
    </div>`}function C(e,a="played"){return e?.length?e.slice(0,8).map(t=>{let i=typeof t.artist=="object"?t.artist?.["#text"]||t.artist?.name||"":t.artist||"",r=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",n=P(r,i,t.name,140,"\u266A"),o="";if(a==="added"&&t.addedAt)o=Z(t.addedAt);else if(a==="played"&&t.date?.uts){let c=new Date(parseInt(t.date.uts,10)*1e3);o=Z(c.toISOString())}return`
      <div class="home-recent-cover">
        ${n}
        ${o?`<div class="home-recent-cover-date">${o}</div>`:""}
        <div class="home-recent-cover-title" title="${l(t.name)}">${l(t.name)}</div>
        <div class="home-recent-cover-artist" title="${l(i)}">${l(i)}</div>
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
            ${C(e,"played")}
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
            ${a.map(t=>{let i=t.artist?.name||t.artist?.["#text"]||(typeof t.artist=="string"?t.artist:""),r=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",n=P(r,i,t.name,140,"\u2665");return`
      <div class="home-recent-cover" data-track="${l(t.name)}" data-artist="${l(i)}">
        ${n}
        <button class="home-loved-play-btn" title="Afspelen in Plex" aria-label="Afspelen">&#9654;</button>
        <div class="home-recent-cover-title" title="${l(t.name)}">${l(t.name)}</div>
        <div class="home-recent-cover-artist" title="${l(i)}">${l(i)}</div>
      </div>`}).join("")}
          </div>
        </div>
      </div>
    </div>`:""}function $t(e){let a=(e||[]).slice(0,4);return a.length?`
    <div class="home-section-header">
      <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-listen-later-grid">${a.map(t=>{let i=R(t.image,96);return`
      <div class="home-listen-later-item">
        ${i?`<img class="home-listen-later-img" src="${l(i)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-listen-later-ph">\u266B</div>'}
        <div class="home-listen-later-info">
          <div class="home-listen-later-name" title="${l(t.name)}">${l(t.name)}</div>
          <div class="home-listen-later-artist" title="${l(t.artist||"")}">${l(t.artist||"")}</div>
        </div>
        <div class="home-listen-later-type">${l(t.type||"album")}</div>
      </div>`}).join("")}</div>`:`
      <div class="home-section-header">
        <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
        <button class="home-more-btn" data-switch="albums">MORE</button>
      </div>
      <div class="home-listen-later-grid">
        <div class="home-listen-later-empty">Je wishlist is leeg. Voeg albums toe via de zoekfunctie.</div>
      </div>`}async function kt(){let e=document.getElementById("home-loved-covers");if(!e)return;let a=e.querySelectorAll(".home-recent-cover");if(!a.length)return;let s=new Set;a.forEach(i=>{let r=i.dataset.artist?.trim();r&&s.add(r)});let t=new Map;await Promise.allSettled([...s].slice(0,6).map(async i=>{try{let r=await v(`/api/plex/tracks?artist=${encodeURIComponent(i)}&limit=0`);for(let n of r?.tracks||[])if(n.thumb){let o=`${n.artist.toLowerCase()}||${n.title.toLowerCase()}`;t.set(o,n.thumb)}}catch{}})),t.size&&a.forEach(i=>{let r=i.dataset.track?.trim()?.toLowerCase(),n=i.dataset.artist?.trim()?.toLowerCase();if(!r||!n)return;let o=t.get(`${n}||${r}`);if(!o)return;let c=document.createElement("img");c.src=o,c.alt=r,c.loading="lazy",c.onerror=()=>{c.style.display="none"};let y=i.querySelector("img"),u=i.querySelector(".home-recent-cover-ph");y?y.replaceWith(c):u&&u.replaceWith(c)})}async function Et(e){let a=(e?.topartists?.artist||[]).slice(0,10);if(!a.length)return"";let s=null;try{let n=sessionStorage.getItem("featuredArtistName");n&&(s=a.find(o=>o.name===n))}catch{}if(!s){let n=Math.floor(Math.random()*a.length);s=a[n];try{sessionStorage.setItem("featuredArtistName",s.name)}catch{}}let t=[];try{let o=((await v(`/api/plex/library?q=${encodeURIComponent(s.name)}&sort=addedAt:desc&limit=10`))?.library||[]).filter(c=>c.artist.toLowerCase()===s.name.toLowerCase()).slice(0,3);o.length&&(t=o.map(c=>({name:c.album,artist:{name:c.artist},_plexThumb:c.thumb})))}catch{}if(!t.length)try{let n=await v(`/api/artist/${encodeURIComponent(s.name)}`);t=(n?.topalbums?.album||n?.albums||[]).slice(0,3)}catch{}let i=J(s.name),r=t.map(n=>{let o=n.artist?.name||n.artist||s.name,c;if(n._plexThumb)c=`<img src="${l(n._plexThumb)}" alt="${l(n.name||"")}" class="featured-album-img" loading="lazy" onerror="this.style.display='none'">`;else{let y=n.image?.[2]?.["#text"]||n.image?.[1]?.["#text"]||"";c=P(y,o,n.name,80,"\u266B","featured-album-img")}return`
      <div class="featured-album-card">
        ${c}
        <div class="featured-album-info">
          <div class="featured-album-artist">${l(n.artist?.name||n.artist||"")}</div>
          <div class="featured-album-title">${l(n.name||"")}</div>
        </div>
      </div>`}).join("");return`
    <div class="home-featured-banner" style="background: ${i}">
      <div class="featured-content-left">
        <div class="featured-label">PERFORMING THE MUSIC OF</div>
        <div class="featured-name">${l(s.name)}</div>
        <button class="featured-play" id="featured-play-btn" data-artist="${l(s.name)}">
          <span class="featured-play-icon">\u25B6</span>
          <span class="featured-play-text">PLAY TRACKS</span>
        </button>
      </div>
      <div class="featured-albums">
        ${r}
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
      <div class="home-recent-artists" id="home-recent-artists">${a.map(t=>{let i=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=P(i,t.name,t.name,200,"\u266A","home-artist-circle-img");return`
      <div class="home-artist-circle-item" data-artist="${l(t.name)}">
        <div class="home-artist-circle">${r}</div>
        <div class="home-artist-circle-name">${l(t.name)}</div>
      </div>`}).join("")}</div>
    </div>`:""}async function At(e){try{let a=(e?.topartists?.artist||e||[]).slice(0,5);if(!a.length)return"";let s=[];try{let i=await v("/api/discover");i?.artists&&Array.isArray(i.artists)&&(s=i.artists.slice(0,5))}catch{}if(s.length===0){let i=a.slice(0,3).map(async o=>{try{let c=await v(`/api/artist/${encodeURIComponent(o.name)}/similar`,{signal:AbortSignal.timeout(5e3)});return{source:o.name,similar:(c?.similarartists?.artist||c?.similar||[]).slice(0,5)}}catch{return{source:o.name,similar:[]}}}),r=await Promise.all(i),n=new Set(a.map(o=>o.name.toLowerCase()));for(let o of r)for(let c of o.similar){let y=(c.name||c).toLowerCase();!n.has(y)&&s.length<5&&(n.add(y),s.push({name:c.name||c,image:c.image,sources:[o.source]}))}}return s.length?`
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
          ${s.map(i=>{let r=typeof i=="string"?i:i.name,n=i.image,o=i.sources||[],c=typeof i!="string"&&(i.image?.[3]?.["#text"]||i.image?.[2]?.["#text"]||i.thumb)||"",y=P(c,r,r,120,"\u266A","home-rec-artist-img"),u="";if(o.length>0){let g=o.slice(0,2);g.length===1?u=`If you like ${g[0]}`:u=`If you like ${g.join(" and ")}`}return`
        <div class="home-rec-artist" data-artist="${l(r)}">
          <div class="home-rec-artist-img-wrap">${y}</div>
          <div class="home-rec-artist-name">${l(r)}</div>
          ${u?`<div class="home-rec-artist-reason">${l(u)}</div>`:""}
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
          ${a.map(t=>{let i="",r="";return t.thumb?(i=M(t.thumb,360),r=`background: url('${l(i)}'); background-size: cover; background-position: center;`):r="background: linear-gradient(135deg, rgba(40,60,140,0.8), rgba(60,30,100,0.8));",`
        <div class="home-playlist-card" data-playlist-id="${l(t.ratingKey||t.key||t.id||"")}" data-playlist-title="${l(t.title||"")}" data-playlist-name="${l(t.title||"")}">
          ${i?`<img class="home-playlist-card-img" src="${l(i)}" alt="${l(t.title||"")}" loading="lazy">`:'<div class="home-playlist-card-ph">\u266B</div>'}
          <div class="home-playlist-name">${l(t.title||"Playlist")}</div>
        </div>`}).join("")}
        </div>
      </div>`:""}catch(e){return console.warn("Playlists render mislukt:",e),""}}function Tt(e){let s=(e?.topartists?.artist||[]).slice(0,2).map((t,i)=>{let r=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",n=r?M(r,400):"";return`
      <div class="home-mix-card" data-switch="ontdek" style="${n?`background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${l(n)}'); background-size: cover; background-position: center;`:"background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7));"}">
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">${l(t.name)} Mix</div>
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
    <div class="home-daily-mixes">${s.join("")}</div>`}async function Mt(e){let a=(e?.topartists?.artist||[]).slice(0,2);for(let s=0;s<a.length;s++){let t=a[s],i=document.getElementById(`home-mix-featuring-${s}`);if(i)try{let r=new AbortController,n=setTimeout(()=>r.abort(),5e3);try{let o=await v(`/api/artist/${encodeURIComponent(t.name)}/similar`,{signal:r.signal});clearTimeout(n);let c=(o?.similarartists?.artist||o?.similar||[]).slice(0,3);c.length?i.textContent=`Featuring ${c.map(y=>y.name||y).join(", ")} and more`:i.textContent=""}catch{clearTimeout(n),i.textContent=""}}catch{i.textContent=""}}}function St(e){if(e?.genres&&Array.isArray(e.genres))return e.genres.map((t,i)=>({name:t.name,count:t.count,pct:t.pct||Math.round(t.count/e.genres.reduce((r,n)=>r+n.count,0)*100),color:S[i%S.length]})).slice(0,6);let a=e?.topartists?.artist||[],s={};for(let t of a){let i=t.topTag;if(!i||i.toLowerCase()==="other")continue;let r=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",n=r?M(r,400):null;s[i]||(s[i]={name:i,count:0,artistImage:n}),s[i].count+=parseInt(t.playcount,10)||0,!s[i].artistImage&&n&&(s[i].artistImage=n)}return Object.values(s).sort((t,i)=>i.count-t.count).slice(0,6)}function Rt(e){if(!e?.length)return"";let a=i=>{let r=i.artistImage?`background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${l(i.artistImage)}'); background-size: cover; background-position: center;`:"background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));";return`
      <div class="genre-card" data-genre="${l(i.name)}" style="${r}" role="button" tabindex="0">
        <span class="genre-card-name">${l(i.name)}</span>
      </div>`},s=e.slice(0,3),t=e.slice(3,6);return`
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${s.map(a).join("")}</div>
      <div class="genres-grid-row">${t.map(a).join("")}</div>
    </div>`}function rt(e,a){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(h=>(h.type||"album").toLowerCase()!=="single"),i=s.filter(h=>(h.type||"").toLowerCase()==="single"),r=(a==="singles"?i:t).slice(0,3);if(!r.length)return'<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>';let[n,...o]=r,c=R(n.image||n.thumb,400),y=c?`<img src="${l(c)}" alt="${l(n.title||n.album||"")}" loading="lazy">`:'<div class="releases-main-ph">\u266B</div>',u=n.description||n.bio||"",g=`
    <div class="releases-main-card">
      ${y}
      <div class="releases-main-info">
        <div class="releases-main-artist">${l(n.artist||"\u2014")}</div>
        <div class="releases-main-title">${l(n.title||n.album||"\u2014")}</div>
        <div class="releases-main-date">${l(n.date||n.releaseDate||"")}</div>
        ${u?`<div class="releases-main-desc">${l(u)}</div>`:""}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`,m=o.slice(0,2).map((h,k)=>{let f=R(h.image||h.thumb,160);return`
      <div class="releases-small-card">
        ${f?`<img src="${l(f)}" alt="${l(h.title||h.album||"")}" loading="lazy">`:'<div class="releases-small-ph">\u266B</div>'}
        <div class="releases-small-info">
          <div class="releases-small-artist">${l(h.artist||"\u2014")}</div>
          <div class="releases-small-title">${l(h.title||h.album||"\u2014")}</div>
          <div class="releases-small-date">${l(h.date||h.releaseDate||"")}</div>
          <div class="releases-plex-badge" id="plex-badge-${k+1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`}).join("");return`
    <div class="releases-preview">
      ${g}
      <div class="releases-stack">${m}</div>
    </div>`}function Ct(e,a="albums"){return`
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
    </div>`}async function tt(e,a){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(o=>(o.type||"album").toLowerCase()!=="single"),i=s.filter(o=>(o.type||"").toLowerCase()==="single"),r=(a==="singles"?i:t).slice(0,3);if(!r.length)return;let n=r.map(o=>({artist:o.artist||"",album:o.title||o.album||""}));try{let o=await fetch("/api/plex/check-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:n})});if(!o.ok)throw new Error(`HTTP ${o.status}`);let y=(await o.json()).results||{};n.forEach((u,g)=>{let m=`${u.artist}||${u.album}`,h=document.getElementById(`plex-badge-${g}`);h&&y[m]&&(h.style.display="inline-flex")})}catch(o){console.warn("Plex check-batch aanroep mislukt:",o)}}function Pt(e){let a=document.getElementById("home-donut-chart");!a||!window.Chart||(O&&(O.destroy(),O=null),O=new window.Chart(a,{type:"doughnut",data:{labels:e.map(s=>s.name),datasets:[{data:e.map(s=>s.count),backgroundColor:e.map(s=>s.color),borderWidth:0,hoverOffset:4}]},options:{cutout:"65%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:s=>` ${s.label}: ${T(s.parsed)} plays`}}},animation:{duration:400}}}))}async function ot(e){let a=document.getElementById("home-genres-legend");try{let s=null;try{let t=await v(`/api/plex/stats?period=${e}`);if(t&&t.source==="plex"&&t.genres&&Array.isArray(t.genres)&&t.genres.length>0){let i=t.genres.reduce((r,n)=>r+n.count,0)||1;s=t.genres.map((r,n)=>({name:r.name,count:r.count,pct:Math.round(r.count/i*100),color:S[n%S.length]})).slice(0,6)}}catch{}if(!s){let i=((await v(`/api/top/artists?period=${e}`))?.topartists?.artist||[]).slice(0,8),r={};for(let u of i){let g=u.topTag||"Other",m=parseInt(u.playcount,10)||0;r[g]=(r[g]||0)+m}let n=Object.entries(r).sort((u,g)=>g[1]-u[1]),o=n.slice(0,6),c=n.slice(6).reduce((u,[,g])=>u+g,0);if(c>0){let u=o.findIndex(([g])=>g==="Other");u>=0?o[u][1]+=c:o.push(["Other",c])}let y=o.reduce((u,[,g])=>u+g,0)||1;s=o.map(([u,g],m)=>({name:u,count:g,pct:Math.round(g/y*100),color:S[m%S.length]}))}a&&(a.innerHTML=s.map(t=>`
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${t.color}"></div>
          <div class="home-genres-legend-name">${l(t.name)}</div>
        </div>`).join("")),Pt(s)}catch(s){console.warn("Genre chart mislukt:",s),a&&(a.innerHTML='<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>')}}function lt(e){let a=(e?.topartists?.artist||[]).slice(0,4);if(!a.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=parseInt(a[0]?.playcount,10)||1;return a.map(t=>{let i=Math.round((parseInt(t.playcount,10)||0)/s*100),r=R(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72),n=r?`<img class="home-wylbt-artist-img" src="${l(r)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-wylbt-artist-ph">\u266A</div>';return`
      <div class="home-wylbt-artist-item" data-artist="${l(t.name)}">
        ${n}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${l(t.name)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${i}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${T(parseInt(t.playcount,10)||0)}</div>
      </div>`}).join("")}function Bt(e){let a={};for(let s of e?.toptracks?.track||[]){let t=s.album?.["#text"]||s.album?.name||null,i=s.artist?.name||s.artist?.["#text"]||s.artist||"";if(!t)continue;let r=`${t}|||${i}`;a[r]||(a[r]={album:t,artist:i,playcount:0,image:s.image}),a[r].playcount+=parseInt(s.playcount,10)||0}return Object.values(a).sort((s,t)=>t.playcount-s.playcount).slice(0,4)}function ct(e){let a=Bt(e);if(!a.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=a[0]?.playcount||1;return a.map(t=>{let i=Math.round(t.playcount/s*100),r=R(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72);return`
      <div class="home-wylbt-release-item">
        ${r?`<img class="home-wylbt-release-img" src="${l(r)}" alt="${l(t.album)}" loading="lazy">`:'<div class="home-wylbt-release-ph">\u266B</div>'}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${l(t.album)}</div>
          <div class="home-wylbt-item-sub">${l(t.artist)}</div>
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

    </div>`}function Dt(){let e=document.getElementById("home-recent-covers"),a=document.getElementById("home-recent-prev"),s=document.getElementById("home-recent-next");if(!e||!a||!s)return;let t=0,i=160;function r(){let n=Math.max(0,e.scrollWidth-e.parentElement.offsetWidth);t=Math.max(0,Math.min(t,n)),e.style.transform=`translateX(-${t}px)`,a.disabled=t<=0,s.disabled=t>=n}a.addEventListener("click",()=>{t=Math.max(0,t-i),r()}),s.addEventListener("click",()=>{t+=i,r()}),r()}async function Ot(e){let a,s;try{let r=await v(`/api/plex/stats?period=${e}`);r&&r.source==="plex"?(a=st(r.topArtists),s=it(r.topTracks)):[a,s]=await Promise.all([v(`/api/topartists?period=${e}`).catch(()=>null),v(`/api/toptracks?period=${e}`).catch(()=>null)])}catch{[a,s]=await Promise.all([v(`/api/topartists?period=${e}`).catch(()=>null),v(`/api/toptracks?period=${e}`).catch(()=>null)])}let t=document.getElementById("home-wylbt-artists-list");t&&(t.innerHTML=lt(a));let i=document.getElementById("home-wylbt-releases-list");i&&(i.innerHTML=ct(s)),t?.querySelectorAll("[data-artist]").forEach(r=>{r.addEventListener("click",()=>w("artist-detail",{name:r.dataset.artist}))}),await ot(e)}async function jt(e){localStorage.setItem("homePeriod",e),document.querySelectorAll(".home-period-pill").forEach(a=>{a.classList.toggle("active",a.dataset.period===e)});try{let a=null,s=[],t=await v(`/api/plex/stats?period=${e}`);if(t?.dailyPlays?.some(r=>r.minutes>0||r.count>0))a=t.dailyPlays,s=t.recentTracks||[];else{let r=await v(`/api/activity?period=${e}`);r?.dailyPlays?.some(n=>n.minutes>0||n.count>0)&&(a=r.dailyPlays,s=r.recentTracks||[])}let i=document.querySelector(".activity-matrix-card");if(i){let r=s.length?U(s):[];i.outerHTML=nt(r,a)}}catch(a){console.warn("Activity matrix herlaad mislukt:",a)}if(e==="today")try{let a=new Date;a.setHours(0,0,0,0);let s=Math.floor(a.getTime()/1e3),i=((await v("/api/plex/stats?period=today"))?.recentTracks||[]).filter(n=>parseInt(n.date?.uts||0,10)>=s),r=document.getElementById("home-recent-covers");r&&(r.innerHTML=C(i))}catch(a){console.warn("Recent activity herlaad mislukt:",a)}else try{let s=(await v(`/api/plex/stats?period=${e}`))?.recentTracks||[],t=document.getElementById("home-recent-covers");t&&(t.innerHTML=C(s))}catch(a){console.warn("Recent activity herlaad mislukt:",a)}await Ot(e);try{let s=(await v(`/api/plex/stats?period=${e}`))?.topArtists||[],t=document.getElementById("home-recent-artists");if(t){let i=s.slice(0,5);if(i.length){let r=i.map(n=>{let o=n.thumb||n.image?.[3]?.["#text"]||n.image?.[2]?.["#text"],c=R(o,200),y=c?`<img class="home-artist-circle-img" src="${l(c)}" alt="${l(n.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
            <div class="home-artist-circle-item" data-artist="${l(n.name)}">
              <div class="home-artist-circle">${y}</div>
              <div class="home-artist-circle-name">${l(n.name)}</div>
            </div>`}).join("");t.innerHTML=r,t.querySelectorAll(".home-artist-circle-item").forEach(n=>{n.addEventListener("click",()=>{let o=n.dataset.artist;o&&w("artist-detail",{name:o})})})}}}catch(a){console.warn("Recent artists herlaad mislukt:",a)}}async function zt(){if(G.user?.name)return G.user.name;try{let e=await v("/api/user");return e?.user?.name||e?.name||null}catch{return null}}function dt(e){if(!e)return{};let a={...e};return e.artists!==void 0&&e.artistCount===void 0&&(a.artistCount=e.artists),e.albums!==void 0&&e.albumCount===void 0&&(a.albumCount=e.albums),e.tracks!==void 0&&e.trackCount===void 0&&(a.trackCount=e.tracks),a.artistCount!==void 0?a:e.library?dt(e.library):e.stats?e.stats:a}async function Wt(){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="home-page" aria-busy="true" aria-label="Laden\u2026">
      ${Q()}
      ${F(6,1)}
      ${F(4,2)}
    </div>`;let[a,s,t,i,r,n,o]=await Promise.all([zt().catch(()=>null),v("/api/plex/status").catch(()=>null),v("/api/plex/stats?period=7day").catch(()=>null),v("/api/wishlist").catch(()=>null),v("/api/releases").catch(()=>null),v("/api/user").catch(()=>null),v("/api/loved").catch(()=>null)]),c,y,u;t&&t.source==="plex"?(c=st(t.topArtists),y=it(t.topTracks),u={recenttracks:{track:U(t.recentTracks)}}):[c,y,u]=await Promise.all([v("/api/topartists?period=7day").catch(()=>null),v("/api/toptracks?period=7day").catch(()=>null),v("/api/recent?limit=200").catch(()=>null)]);let g={ok:n&&!n._stale,user:n?.user?.name||null},m=dt(s),h=u?.recenttracks?.track||[],k=i?.wishlist||i||[],f=r,L=o?.lovedtracks?.track||[],B=St(c),mt=await Et(c).catch(()=>""),ut=await At(c).catch(()=>""),vt=await It().catch(()=>""),z=h,N=null;if(t?.source==="plex"&&t?.dailyPlays?.some(d=>d.minutes>0||d.count>0))N=t.dailyPlays;else try{let d=await v("/api/activity?period=1month");d?.dailyPlays?.some(p=>p.minutes>0||p.count>0)&&(N=d.dailyPlays,d.recentTracks?.length&&(z=U(d.recentTracks)))}catch{try{z=(await v("/api/recent?limit=200"))?.recenttracks?.track||h}catch{}}e.innerHTML=`
    <div class="home-page">

      <!-- 1. Greeting + Stats + Last.fm Status -->
      ${gt(a,m,g)}

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
      <div>${Lt(c)}</div>

      <!-- 3c. Recommended Artists -->
      <div>${ut}</div>

      <!-- 3d. Your Playlists -->
      <div id="home-playlists-container">${vt}</div>

      <!-- 4. Daily Mixes -->
      <div>${Tt(c)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${Rt(B)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${Ct(f)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${Ht(c,y)}
      </div>

    </div>`;let ht=localStorage.getItem("homePeriod")||"7day";e.querySelectorAll(".home-period-pill").forEach(d=>{d.classList.toggle("active",d.dataset.period===ht)}),e.querySelectorAll(".home-period-pill").forEach(d=>{d.addEventListener("click",async()=>{let p=d.dataset.period;p&&await jt(p)})}),Dt(),kt().catch(()=>{}),ot("7day"),e.querySelectorAll("[data-switch]").forEach(d=>{d.addEventListener("click",()=>w(d.dataset.switch))}),e.querySelectorAll("#home-wylbt-artists-list [data-artist]").forEach(d=>{d.addEventListener("click",()=>w("artist-detail",{name:d.dataset.artist}))}),document.getElementById("home-recent-more")?.addEventListener("click",()=>{w("albums")}),document.getElementById("home-loved-more")?.addEventListener("click",()=>{w("listen-later")}),e.querySelectorAll(".genre-card").forEach(d=>{d.addEventListener("click",()=>w("ontdek")),d.addEventListener("keydown",p=>{(p.key==="Enter"||p.key===" ")&&w("ontdek")})});let H="albums";e.querySelectorAll("[data-releases-tab]").forEach(d=>{d.addEventListener("click",()=>{H=d.dataset.releasesTab,e.querySelectorAll("[data-releases-tab]").forEach(b=>b.classList.toggle("active",b===d));let p=document.getElementById("releases-body");p&&(p.innerHTML=rt(f,H),tt(f,H))})});let Y="played";e.querySelectorAll("[data-recent-tab]").forEach(d=>{d.addEventListener("click",async()=>{e.querySelectorAll("[data-recent-tab]").forEach(b=>b.classList.toggle("active",b===d)),Y=d.dataset.recentTab;let p=document.getElementById("home-recent-covers");if(p)if(Y==="added")try{let x=((await v("/api/plex/library?sort=addedAt:desc&limit=8"))?.library||[]).map($=>({name:$.album,artist:{"#text":$.artist},image:$.thumb?[null,null,{"#text":$.thumb}]:[null,null,{"#text":""}],addedAt:new Date($.addedAt*1e3).toISOString()}));p.innerHTML=C(x,"added")}catch(b){console.warn("Failed to load added items:",b),p.innerHTML='<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Fout bij laden van recent toegevoegde albums</div>'}else p.innerHTML=C(h,"played")})}),e.querySelectorAll(".home-artist-circle-item").forEach(d=>{d.addEventListener("click",()=>{let p=d.dataset.artist;p&&w("artist-detail",{name:p})})});let A=document.getElementById("featured-play-btn");A&&A.addEventListener("click",async()=>{let d=A.dataset.artist;if(d){A.disabled=!0,A.textContent="\u2026";try{let p=await v(`/api/plex/search?q=${encodeURIComponent(d)}&limit=3`),b=(p?.artists||[]).find(D=>D.title?.toLowerCase()===d.toLowerCase())||p?.artists?.[0];if(!b?.ratingKey){j(`"${d}" niet gevonden in Plex`,"#e05a2b");return}let $=(await v(`/api/plex/artists/${b.ratingKey}`))?.artist?.albums||[];if(!$.length){j("Geen albums gevonden in Plex","#e05a2b");return}let I=at($),{playOnZone:K}=await import("./plexRemote-RSESKH2Y.js");await K(I[0].ratingKey,"music")}catch(p){console.error("Featured artist play mislukt:",p),j("Afspelen mislukt","#e05a2b")}finally{A.disabled=!1,A.innerHTML='<span class="featured-play-icon">\u25B6</span><span class="featured-play-text">PLAY TRACKS</span>'}}}),e.querySelectorAll(".home-loved-play-btn").forEach(d=>{d.addEventListener("click",async p=>{p.stopPropagation();let b=d.closest("[data-track]"),x=b?.dataset.track||"",$=b?.dataset.artist||"";if(x){d.textContent="\u2026";try{let I=encodeURIComponent(`${x} ${$}`.trim()),D=(await v(`/api/plex/search?q=${I}&limit=5`))?.tracks||[],X=D.find(yt=>yt.title?.toLowerCase()===x.toLowerCase())||D[0];if(!X?.ratingKey){j(`"${x}" niet gevonden in Plex`,"#e05a2b");return}let{playOnZone:pt}=await import("./plexRemote-RSESKH2Y.js");await pt(X.ratingKey,"music")}catch(I){console.error("Loved track play mislukt:",I)}finally{d.textContent="\u25B6"}}})});let W=document.getElementById("home-np-indicator");W&&(fetch("/api/plex/nowplaying").then(d=>d.json()).then(d=>et(d)).catch(()=>{}),W.addEventListener("click",()=>w("nu")));let V=d=>{document.getElementById("home-np-indicator")?et(d.detail):window.removeEventListener("plex-np-update",V)};window.addEventListener("plex-np-update",V);let _=document.getElementById("home-recent-artists");_&&(document.getElementById("home-artists-prev")?.addEventListener("click",()=>{_.scrollBy({left:-256,behavior:"smooth"})}),document.getElementById("home-artists-next")?.addEventListener("click",()=>{_.scrollBy({left:256,behavior:"smooth"})}));let q=document.getElementById("home-recommended-artists");q&&(document.getElementById("home-rec-artists-prev")?.addEventListener("click",()=>{q.scrollBy({left:-320,behavior:"smooth"})}),document.getElementById("home-rec-artists-next")?.addEventListener("click",()=>{q.scrollBy({left:320,behavior:"smooth"})})),e.querySelectorAll(".home-rec-artist").forEach(d=>{d.addEventListener("click",()=>{let p=d.dataset.artist;p&&w("artist-detail",{name:p})})});let E=document.getElementById("home-playlists");if(E){let p=document.getElementById("home-playlists-prev"),b=document.getElementById("home-playlists-next"),x=()=>{let $=E.scrollLeft<=0,I=E.scrollLeft>=E.scrollWidth-E.clientWidth-10;p?.toggleAttribute("disabled",$),b?.toggleAttribute("disabled",I)};p?.addEventListener("click",()=>{E.scrollBy({left:-400,behavior:"smooth"}),setTimeout(x,400)}),b?.addEventListener("click",()=>{E.scrollBy({left:400,behavior:"smooth"}),setTimeout(x,400)}),E.addEventListener("scroll",x),x()}e.querySelectorAll(".home-playlist-card").forEach(d=>{d.addEventListener("click",()=>{let p=d.dataset.playlistId,b=d.dataset.playlistTitle||d.dataset.playlistName||"Afspeellijst";p&&w("playlist-detail",{id:p,title:b})})}),Mt(c),tt(f,H)}function et(e){let a=document.getElementById("home-np-indicator");a&&(e?.playing&&e.track?(a.querySelector(".home-np-track").textContent=`${e.track}${e.artist?" \u2014 "+e.artist:""}`,a.style.display="flex"):a.style.display="none")}function j(e,a){a=a||"#333";let s=document.getElementById("home-toast");s&&s.remove();let t=document.createElement("div");t.id="home-toast",t.textContent=e,t.style.cssText=`
    position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
    background:${a};color:#fff;padding:10px 18px;border-radius:6px;
    font-size:13px;z-index:9999;pointer-events:none;
    animation:fadeInUp .2s ease;
  `,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}export{Wt as loadHome};
