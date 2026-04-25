import{a as w}from"./chunk-ZEOE74RV.js";import{A as v,a as B,e as M,i as l,k as F}from"./chunk-LCSFBDUL.js";var T=["#1a237e","#283593","#3949ab","#5c6bc0","#7986cb","#9fa8da"],C=null;function q(e){return!e||!Array.isArray(e)?{topartists:{artist:[]}}:{topartists:{artist:e.map(s=>({name:s.name,playcount:String(s.playcount||0),image:[null,null,{"#text":s.thumb||""},{"#text":s.thumb||""}],topTag:s.genre||null}))}}}function Y(e){return!e||!Array.isArray(e)?{toptracks:{track:[]}}:{toptracks:{track:e.map(s=>({name:s.title,playcount:String(s.playcount||0),artist:{name:s.artist,"#text":s.artist},album:{"#text":s.album,name:s.album},image:[null,null,{"#text":s.thumb||""}]}))}}}function G(e){return!e||!Array.isArray(e)?[]:e.map(s=>({name:s.title,artist:{"#text":s.artist},album:{"#text":s.album},image:[null,null,{"#text":s.thumb||""}],date:{uts:String(s.viewedAt)}}))}function I(e){return e==null||isNaN(e)?"\u2014":Number(e).toLocaleString("nl-NL")}function _(e){if(!e)return"";let s=new Date(e),a=Date.now()-s.getTime(),t=Math.floor(a/864e5);return t<1?"Vandaag":t===1?"Gisteren":t<7?`${t}d geleden`:t<31?`${Math.floor(t/7)}w geleden`:`${Math.floor(t/30)}mo geleden`}function $(e,s=120){return e?M(e,s):null}function it(e,s,a){let t=e||"Muzikant",i=s?.artists??s?.artistCount??"\u2026",n=s?.albums??s?.albumCount??"\u2026",r=s?.tracks??s?.trackCount??"\u2026",o=s?.composers??s?.composerCount??"\u2014",d='<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',p='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg>',y='<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',g='<svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>',m=a?.ok?`<span style="width: 8px; height: 8px; background: #4caf50; border-radius: 50%; display: inline-block; margin-left: 8px; title='Last.fm connected'"></span>`:`<span style="width: 8px; height: 8px; background: #f44336; border-radius: 50%; display: inline-block; margin-left: 8px;" title='Last.fm unavailable'></span>`;return`
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${l(t)}${m}</div>

      <div class="home-stat-cards">
        <div class="home-stat-card">
          <div class="home-stat-icon">${d}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-artists">${I(i)}</div>
            <div class="home-stat-label">Artists</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${p}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-albums">${I(n)}</div>
            <div class="home-stat-label">Albums</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${y}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-tracks">${I(r)}</div>
            <div class="home-stat-label">Tracks</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon">${g}</div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-composers">${I(o)}</div>
            <div class="home-stat-label">Composers</div>
          </div>
        </div>
      </div>
    </div>`}function nt(){return`
    <div class="live-radio-bar">
      <div class="live-radio-badge">
        <span class="live-radio-dot"></span>
        <span class="live-radio-name">NPO Radio 2</span>
      </div>
      <div class="live-radio-info">NPO Radio 2 \u2014 Hilversum, Netherlands, 92.6 FM</div>
      <a href="#" class="live-radio-more" onclick="return false">More live radio</a>
    </div>`}function rt(e){if(!e||e<1)return"0m";if(e<60)return`${Math.round(e)}m`;let s=Math.floor(e/60),a=Math.round(e%60);return a>0?`${s}h ${a}m`:`${s}h`}function V(e,s){let a={};if(s&&Array.isArray(s))for(let m of s)m.date!=null&&(a[m.date]=m.minutes||(m.count?m.count*3.5:0));else for(let m of e||[]){let u=m.date?.uts;if(!u)continue;let b=new Date(parseInt(u,10)*1e3).toISOString().slice(0,10);a[b]=(a[b]||0)+3.5}let t=new Date,i=t.getDay(),n=new Date(t);n.setDate(t.getDate()-(i+6)%7),n.setHours(0,0,0,0);let r=[];for(let m=0;m<4;m++){let u=new Date(n);u.setDate(n.getDate()-m*7);let x=[];for(let b=0;b<7;b++){let L=new Date(u);L.setDate(u.getDate()+b);let R=L.toISOString().slice(0,10);x.push({key:R,minutes:a[R]||0})}r.push({days:x,totalMinutes:x.reduce((b,L)=>b+L.minutes,0)})}let o=Math.max(...r.map(m=>m.totalMinutes),1),d=Math.max(...r.flatMap(m=>m.days.map(u=>u.minutes)),1);function p(m){if(!m)return"width:6px;height:6px;background:#e0e0e0;";let u=m/d;return u<.25?"width:10px;height:10px;background:var(--accent);opacity:0.4;":u<.6?"width:16px;height:16px;background:var(--accent);opacity:0.7;":"width:24px;height:24px;background:var(--accent);opacity:1;"}let y=r.map(m=>{let u=m.totalMinutes>0?Math.round(m.totalMinutes/o*100):0,x=m.days.map(b=>`<div class="activity-dot-cell"><div class="activity-dot" style="${p(b.minutes)}" title="${b.key}: ${Math.round(b.minutes)}min"></div></div>`).join("");return`
      <div class="activity-bar-wrap">
        <div class="activity-bar" style="width:${u}%"></div>
        <span class="activity-bar-label">${rt(m.totalMinutes)}</span>
      </div>
      ${x}`}).join("");return`
    <div class="home-wylbt-card activity-matrix-card">
      <div class="home-wylbt-card-header" style="margin-bottom:16px">
        <div class="home-wylbt-card-title">Recent listening</div>
      </div>
      <div class="activity-grid">
        <!-- Header row -->
        <div class="activity-grid-label-header">Last 4 weeks</div>
        ${["M","T","W","T","F","S","S"].map(m=>`<div class="activity-day-label">${m}</div>`).join("")}
        <!-- Week rows -->
        ${y}
      </div>
    </div>`}function S(e,s="played"){return e?.length?e.slice(0,8).map(t=>{let i=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",n=i?$(i,140):null,r=n?`<img src="${l(n)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-recent-cover-ph">\u266A</div>',o="";if(s==="added"&&t.addedAt)o=_(t.addedAt);else if(s==="played"&&t.date?.uts){let d=new Date(parseInt(t.date.uts,10)*1e3);o=_(d.toISOString())}return`
      <div class="home-recent-cover">
        ${r}
        ${o?`<div class="home-recent-cover-date">${o}</div>`:""}
        <div class="home-recent-cover-title" title="${l(t.name)}">${l(t.name)}</div>
        <div class="home-recent-cover-artist" title="${l(t.artist?.["#text"]||t.artist||"")}">${l(t.artist?.["#text"]||t.artist||"")}</div>
      </div>`}).join(""):'<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>'}function lt(e){return`
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Recent activity</div>
        <div class="home-recent-tabs">
          <button class="home-recent-tab active" data-recent-tab="played">PLAYED</button>
          <button class="home-recent-tab" data-recent-tab="added">ADDED</button>
        </div>
        <button class="home-recent-more" id="home-recent-more">MORE</button>
      </div>
      <div class="home-recent-row">
        <button class="home-recent-nav" id="home-recent-prev" aria-label="Vorige">&#8249;</button>
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-recent-covers">
            ${S(e,"played")}
          </div>
        </div>
        <button class="home-recent-nav" id="home-recent-next" aria-label="Volgende">&#8250;</button>
      </div>
    </div>`}function ot(e){let s=(e||[]).slice(0,8);return s.length?`
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Loved Tracks</div>
        <button class="home-recent-more" id="home-loved-more">MORE</button>
      </div>
      <div class="home-recent-row">
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-loved-covers">
            ${s.map(t=>{let i=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",n=i?$(i,140):null;return`
      <div class="home-recent-cover">
        ${n?`<img src="${l(n)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-recent-cover-ph">\u2665</div>'}
        <div class="home-recent-cover-title" title="${l(t.name)}">${l(t.name)}</div>
        <div class="home-recent-cover-artist" title="${l(t.artist?.["#text"]||t.artist||"")}">${l(t.artist?.["#text"]||t.artist||"")}</div>
      </div>`}).join("")}
          </div>
        </div>
      </div>
    </div>`:""}function ct(e){let s=(e||[]).slice(0,4);return s.length?`
    <div class="home-section-header">
      <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-listen-later-grid">${s.map(t=>{let i=$(t.image,96);return`
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
      </div>`}async function dt(e){let s=(e?.topartists?.artist||[]).slice(0,10);if(!s.length)return"";let a=null;try{let r=sessionStorage.getItem("featuredArtistName");r&&(a=s.find(o=>o.name===r))}catch{}if(!a){let r=Math.floor(Math.random()*s.length);a=s[r];try{sessionStorage.setItem("featuredArtistName",a.name)}catch{}}let t=[];try{let r=await v(`/api/artist/${encodeURIComponent(a.name)}`);t=(r?.topalbums?.album||r?.albums||[]).slice(0,3)}catch{}let i=F(a.name),n=t.map(r=>{let o=r.image?.[2]?.["#text"]||r.image?.[1]?.["#text"]||"",d=o?M(o,80):null;return`
      <div class="featured-album-card">
        ${d?`<img src="${l(d)}" alt="${l(r.name)}" class="featured-album-img">`:'<div class="featured-album-ph">\u266B</div>'}
        <div class="featured-album-info">
          <div class="featured-album-artist">${l(r.artist?.name||r.artist||"")}</div>
          <div class="featured-album-title">${l(r.name||"")}</div>
        </div>
      </div>`}).join("");return`
    <div class="home-featured-banner" style="background: ${i}">
      <div class="featured-content-left">
        <div class="featured-label">PERFORMING THE MUSIC OF</div>
        <div class="featured-name">${l(a.name)}</div>
        <button class="featured-play" id="featured-play-btn" data-artist="${l(a.name)}">
          <span class="featured-play-icon">\u25B6</span>
          <span class="featured-play-text">PLAY TRACKS</span>
        </button>
      </div>
      <div class="featured-albums">
        ${n}
      </div>
    </div>`}function mt(e){let s=(e?.topartists?.artist||[]).slice(0,5);return s.length?`
    <div class="home-section-header">
      <div class="home-section-title">Your recent artists</div>
      <div class="home-recent-artists-nav">
        <button class="home-recent-artists-btn" id="home-artists-prev" aria-label="Vorige">&#8249;</button>
        <button class="home-recent-artists-btn" id="home-artists-next" aria-label="Volgende">&#8250;</button>
      </div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-recent-artists-wrap">
      <div class="home-recent-artists" id="home-recent-artists">${s.map(t=>{let i=$(t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"],200),n=i?`<img class="home-artist-circle-img" src="${l(i)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
      <div class="home-artist-circle-item" data-artist="${l(t.name)}">
        <div class="home-artist-circle">${n}</div>
        <div class="home-artist-circle-name">${l(t.name)}</div>
      </div>`}).join("")}</div>
    </div>`:""}async function ut(e){try{let s=(e?.topartists?.artist||e||[]).slice(0,5);if(!s.length)return"";let a=[];try{let i=await v("/api/discover");i?.artists&&Array.isArray(i.artists)&&(a=i.artists.slice(0,5))}catch{}if(a.length===0){let i=s.slice(0,3).map(async o=>{try{let d=await v(`/api/artist/${encodeURIComponent(o.name)}/similar`,{signal:AbortSignal.timeout(5e3)});return{source:o.name,similar:(d?.similarartists?.artist||d?.similar||[]).slice(0,5)}}catch{return{source:o.name,similar:[]}}}),n=await Promise.all(i),r=new Set(s.map(o=>o.name.toLowerCase()));for(let o of n)for(let d of o.similar){let p=(d.name||d).toLowerCase();!r.has(p)&&a.length<5&&(r.add(p),a.push({name:d.name||d,image:d.image,sources:[o.source]}))}}return a.length?`
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
          ${a.map(i=>{let n=typeof i=="string"?i:i.name,r=i.image,o=i.sources||[],d=typeof i!="string"&&(i.image?.[3]?.["#text"]||i.image?.[2]?.["#text"]||i.thumb)||"",p=$(d,120),y=p?`<img class="home-rec-artist-img" src="${l(p)}" alt="${l(n)}" loading="lazy">`:'<div class="home-rec-artist-ph">\u266A</div>',g="";if(o.length>0){let m=o.slice(0,2);m.length===1?g=`If you like ${m[0]}`:g=`If you like ${m.join(" and ")}`}return`
        <div class="home-rec-artist" data-artist="${l(n)}">
          <div class="home-rec-artist-img-wrap">${y}</div>
          <div class="home-rec-artist-name">${l(n)}</div>
          ${g?`<div class="home-rec-artist-reason">${l(g)}</div>`:""}
        </div>`}).join("")}
        </div>
      </div>`:""}catch(s){return console.warn("Recommended artists render mislukt:",s),""}}async function vt(){try{let e=await v("/api/plex/playlists"),s=(e?.playlists||e||[]).slice(0,5);return s.length?`
      <div class="home-playlists-section">
        <div class="home-playlists-header">
          <div class="home-playlists-title">Your Playlists</div>
          <div class="home-playlists-nav">
            <button class="home-playlist-nav-btn" id="home-playlists-prev" aria-label="Vorige">&#8249;</button>
            <button class="home-playlist-nav-btn" id="home-playlists-next" aria-label="Volgende">&#8250;</button>
          </div>
          <button class="home-more-btn" data-switch="albums">MORE</button>
        </div>
        <div class="home-playlists" id="home-playlists">
          ${s.map(t=>{let i="",n="";return t.thumb?(i=M(t.thumb,360),n=`background: url('${l(i)}'); background-size: cover; background-position: center;`):n="background: linear-gradient(135deg, rgba(40,60,140,0.8), rgba(60,30,100,0.8));",`
        <div class="home-playlist-card" data-playlist-id="${l(t.key||t.id||"")}" data-playlist-name="${l(t.title||"")}">
          ${i?`<img class="home-playlist-card-img" src="${l(i)}" alt="${l(t.title||"")}" loading="lazy">`:'<div class="home-playlist-card-ph">\u266B</div>'}
          <div class="home-playlist-name">${l(t.title||"Playlist")}</div>
        </div>`}).join("")}
        </div>
      </div>`:""}catch(e){return console.warn("Playlists render mislukt:",e),""}}function ht(e){let a=(e?.topartists?.artist||[]).slice(0,2).map((t,i)=>{let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=n?M(n,400):"";return`
      <div class="home-mix-card" data-switch="ontdek" style="${r?`background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${l(r)}'); background-size: cover; background-position: center;`:"background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7));"}">
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">${l(t.name)} Mix</div>
          <div class="home-mix-featuring" id="home-mix-featuring-${i}">Laden\u2026</div>
        </div>
      </div>`});for(;a.length<2;){let t=a.length+1;a.push(`
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
    <div class="home-daily-mixes">${a.join("")}</div>`}async function yt(e){let s=(e?.topartists?.artist||[]).slice(0,2);for(let a=0;a<s.length;a++){let t=s[a],i=document.getElementById(`home-mix-featuring-${a}`);if(i)try{let n=new AbortController,r=setTimeout(()=>n.abort(),5e3);try{let o=await v(`/api/artist/${encodeURIComponent(t.name)}/similar`,{signal:n.signal});clearTimeout(r);let d=(o?.similarartists?.artist||o?.similar||[]).slice(0,3);d.length?i.textContent=`Featuring ${d.map(p=>p.name||p).join(", ")} and more`:i.textContent=""}catch{clearTimeout(r),i.textContent=""}}catch{i.textContent=""}}}function gt(e){if(e?.genres&&Array.isArray(e.genres))return e.genres.map((t,i)=>({name:t.name,count:t.count,pct:t.pct||Math.round(t.count/e.genres.reduce((n,r)=>n+r.count,0)*100),color:T[i%T.length]})).slice(0,6);let s=e?.topartists?.artist||[],a={};for(let t of s){let i=t.topTag;if(!i||i.toLowerCase()==="other")continue;let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",r=n?M(n,400):null;a[i]||(a[i]={name:i,count:0,artistImage:r}),a[i].count+=parseInt(t.playcount,10)||0,!a[i].artistImage&&r&&(a[i].artistImage=r)}return Object.values(a).sort((t,i)=>i.count-t.count).slice(0,6)}function pt(e){if(!e?.length)return"";let s=i=>{let n=i.artistImage?`background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${l(i.artistImage)}'); background-size: cover; background-position: center;`:"background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));";return`
      <div class="genre-card" data-genre="${l(i.name)}" style="${n}" role="button" tabindex="0">
        <span class="genre-card-name">${l(i.name)}</span>
      </div>`},a=e.slice(0,3),t=e.slice(3,6);return`
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${a.map(s).join("")}</div>
      <div class="genres-grid-row">${t.map(s).join("")}</div>
    </div>`}function W(e,s){let a=e?.releases||(Array.isArray(e)?e:[]),t=a.filter(u=>(u.type||"album").toLowerCase()!=="single"),i=a.filter(u=>(u.type||"").toLowerCase()==="single"),n=(s==="singles"?i:t).slice(0,3);if(!n.length)return'<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>';let[r,...o]=n,d=$(r.image||r.thumb,400),p=d?`<img src="${l(d)}" alt="${l(r.title||r.album||"")}" loading="lazy">`:'<div class="releases-main-ph">\u266B</div>',y=r.description||r.bio||"",g=`
    <div class="releases-main-card">
      ${p}
      <div class="releases-main-info">
        <div class="releases-main-artist">${l(r.artist||"\u2014")}</div>
        <div class="releases-main-title">${l(r.title||r.album||"\u2014")}</div>
        <div class="releases-main-date">${l(r.date||r.releaseDate||"")}</div>
        ${y?`<div class="releases-main-desc">${l(y)}</div>`:""}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`,m=o.slice(0,2).map((u,x)=>{let b=$(u.image||u.thumb,160);return`
      <div class="releases-small-card">
        ${b?`<img src="${l(b)}" alt="${l(u.title||u.album||"")}" loading="lazy">`:'<div class="releases-small-ph">\u266B</div>'}
        <div class="releases-small-info">
          <div class="releases-small-artist">${l(u.artist||"\u2014")}</div>
          <div class="releases-small-title">${l(u.title||u.album||"\u2014")}</div>
          <div class="releases-small-date">${l(u.date||u.releaseDate||"")}</div>
          <div class="releases-plex-badge" id="plex-badge-${x+1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`}).join("");return`
    <div class="releases-preview">
      ${g}
      <div class="releases-stack">${m}</div>
    </div>`}function bt(e,s="albums"){return`
    ${`
    <div class="home-section-header">
      <div class="home-section-title">New releases for you</div>
      <div class="home-tabs">
        <button class="home-tab home-tab--releases ${s==="albums"?"active":""}" data-releases-tab="albums">ALBUMS</button>
        <button class="home-tab home-tab--releases ${s==="singles"?"active":""}" data-releases-tab="singles">SINGLES</button>
      </div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>`}
    <div id="releases-body">
      ${W(e,s)}
    </div>`}async function U(e,s){let a=e?.releases||(Array.isArray(e)?e:[]),t=a.filter(o=>(o.type||"album").toLowerCase()!=="single"),i=a.filter(o=>(o.type||"").toLowerCase()==="single"),n=(s==="singles"?i:t).slice(0,3);if(!n.length)return;let r=n.map(o=>({artist:o.artist||"",album:o.title||o.album||""}));try{let o=await fetch("/api/plex/check-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:r})});if(!o.ok)throw new Error(`HTTP ${o.status}`);let p=(await o.json()).results||{};r.forEach((y,g)=>{let m=`${y.artist}||${y.album}`,u=document.getElementById(`plex-badge-${g}`);u&&p[m]&&(u.style.display="inline-flex")})}catch(o){console.warn("Plex check-batch aanroep mislukt:",o)}}function ft(e){let s=document.getElementById("home-donut-chart");!s||!window.Chart||(C&&(C.destroy(),C=null),C=new window.Chart(s,{type:"doughnut",data:{labels:e.map(a=>a.name),datasets:[{data:e.map(a=>a.count),backgroundColor:e.map(a=>a.color),borderWidth:0,hoverOffset:4}]},options:{cutout:"65%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:a=>` ${a.label}: ${I(a.parsed)} plays`}}},animation:{duration:400}}}))}async function K(e){let s=document.getElementById("home-genres-legend");try{let a=null;try{let t=await v(`/api/plex/stats?period=${e}`);if(t&&t.source==="plex"&&t.genres&&Array.isArray(t.genres)&&t.genres.length>0){let i=t.genres.reduce((n,r)=>n+r.count,0)||1;a=t.genres.map((n,r)=>({name:n.name,count:n.count,pct:Math.round(n.count/i*100),color:T[r%T.length]})).slice(0,6)}}catch{}if(!a){let i=((await v(`/api/top/artists?period=${e}`))?.topartists?.artist||[]).slice(0,8),n={};for(let y of i){let g=y.topTag||"Other",m=parseInt(y.playcount,10)||0;n[g]=(n[g]||0)+m}let r=Object.entries(n).sort((y,g)=>g[1]-y[1]),o=r.slice(0,6),d=r.slice(6).reduce((y,[,g])=>y+g,0);if(d>0){let y=o.findIndex(([g])=>g==="Other");y>=0?o[y][1]+=d:o.push(["Other",d])}let p=o.reduce((y,[,g])=>y+g,0)||1;a=o.map(([y,g],m)=>({name:y,count:g,pct:Math.round(g/p*100),color:T[m%T.length]}))}s&&(s.innerHTML=a.map(t=>`
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${t.color}"></div>
          <div class="home-genres-legend-name">${l(t.name)}</div>
        </div>`).join("")),ft(a)}catch(a){console.warn("Genre chart mislukt:",a),s&&(s.innerHTML='<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>')}}function X(e){let s=(e?.topartists?.artist||[]).slice(0,4);if(!s.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let a=parseInt(s[0]?.playcount,10)||1;return s.map(t=>{let i=Math.round((parseInt(t.playcount,10)||0)/a*100),n=$(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72),r=n?`<img class="home-wylbt-artist-img" src="${l(n)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-wylbt-artist-ph">\u266A</div>';return`
      <div class="home-wylbt-artist-item" data-artist="${l(t.name)}">
        ${r}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${l(t.name)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${i}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${I(parseInt(t.playcount,10)||0)}</div>
      </div>`}).join("")}function wt(e){let s={};for(let a of e?.toptracks?.track||[]){let t=a.album?.["#text"]||a.album?.name||null,i=a.artist?.name||a.artist?.["#text"]||a.artist||"";if(!t)continue;let n=`${t}|||${i}`;s[n]||(s[n]={album:t,artist:i,playcount:0,image:a.image}),s[n].playcount+=parseInt(a.playcount,10)||0}return Object.values(s).sort((a,t)=>t.playcount-a.playcount).slice(0,4)}function J(e){let s=wt(e);if(!s.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let a=s[0]?.playcount||1;return s.map(t=>{let i=Math.round(t.playcount/a*100),n=$(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72);return`
      <div class="home-wylbt-release-item">
        ${n?`<img class="home-wylbt-release-img" src="${l(n)}" alt="${l(t.album)}" loading="lazy">`:'<div class="home-wylbt-release-ph">\u266B</div>'}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${l(t.album)}</div>
          <div class="home-wylbt-item-sub">${l(t.artist)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${i}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${I(t.playcount)}</div>
      </div>`}).join("")}function xt(e,s){return`
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
          ${X(e)}
        </div>
      </div>

      <!-- Blok 3: Top Releases -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Your top releases</div>
          <button class="home-more-btn">MORE</button>
        </div>
        <div id="home-wylbt-releases-list">
          ${J(s)}
        </div>
      </div>

    </div>`}function $t(){let e=document.getElementById("home-recent-covers"),s=document.getElementById("home-recent-prev"),a=document.getElementById("home-recent-next");if(!e||!s||!a)return;let t=0,i=160;function n(){let r=Math.max(0,e.scrollWidth-e.parentElement.offsetWidth);t=Math.max(0,Math.min(t,r)),e.style.transform=`translateX(-${t}px)`,s.disabled=t<=0,a.disabled=t>=r}s.addEventListener("click",()=>{t=Math.max(0,t-i),n()}),a.addEventListener("click",()=>{t+=i,n()}),n()}async function kt(e){let s,a;try{let n=await v(`/api/plex/stats?period=${e}`);n&&n.source==="plex"?(s=q(n.topArtists),a=Y(n.topTracks)):[s,a]=await Promise.all([v(`/api/topartists?period=${e}`).catch(()=>null),v(`/api/toptracks?period=${e}`).catch(()=>null)])}catch{[s,a]=await Promise.all([v(`/api/topartists?period=${e}`).catch(()=>null),v(`/api/toptracks?period=${e}`).catch(()=>null)])}let t=document.getElementById("home-wylbt-artists-list");t&&(t.innerHTML=X(s));let i=document.getElementById("home-wylbt-releases-list");i&&(i.innerHTML=J(a)),t?.querySelectorAll("[data-artist]").forEach(n=>{n.addEventListener("click",()=>w("artist-detail",{name:n.dataset.artist}))}),await K(e)}async function Et(e){localStorage.setItem("homePeriod",e),document.querySelectorAll(".home-period-pill").forEach(s=>{s.classList.toggle("active",s.dataset.period===e)});try{let s=null,a=[],t=await v(`/api/plex/stats?period=${e}`);if(t?.dailyPlays?.some(n=>n.minutes>0||n.count>0))s=t.dailyPlays,a=t.recentTracks||[];else{let n=await v(`/api/activity?period=${e}`);n?.dailyPlays?.some(r=>r.minutes>0||r.count>0)&&(s=n.dailyPlays,a=n.recentTracks||[])}let i=document.querySelector(".activity-matrix-card");if(i){let n=a.length?G(a):[];i.outerHTML=V(n,s)}}catch(s){console.warn("Activity matrix herlaad mislukt:",s)}if(e==="today")try{let s=new Date;s.setHours(0,0,0,0);let a=Math.floor(s.getTime()/1e3),i=((await v("/api/plex/stats?period=today"))?.recentTracks||[]).filter(r=>parseInt(r.date?.uts||0,10)>=a),n=document.getElementById("home-recent-covers");n&&(n.innerHTML=S(i))}catch(s){console.warn("Recent activity herlaad mislukt:",s)}else try{let a=(await v(`/api/plex/stats?period=${e}`))?.recentTracks||[],t=document.getElementById("home-recent-covers");t&&(t.innerHTML=S(a))}catch(s){console.warn("Recent activity herlaad mislukt:",s)}await kt(e);try{let a=(await v(`/api/plex/stats?period=${e}`))?.topArtists||[],t=document.getElementById("home-recent-artists");if(t){let i=a.slice(0,5);if(i.length){let n=i.map(r=>{let o=r.thumb||r.image?.[3]?.["#text"]||r.image?.[2]?.["#text"],d=$(o,200),p=d?`<img class="home-artist-circle-img" src="${l(d)}" alt="${l(r.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
            <div class="home-artist-circle-item" data-artist="${l(r.name)}">
              <div class="home-artist-circle">${p}</div>
              <div class="home-artist-circle-name">${l(r.name)}</div>
            </div>`}).join("");t.innerHTML=n,t.querySelectorAll(".home-artist-circle-item").forEach(r=>{r.addEventListener("click",()=>{let o=r.dataset.artist;o&&w("artist-detail",{name:o})})})}}}catch(s){console.warn("Recent artists herlaad mislukt:",s)}}async function Lt(){if(B.user?.name)return B.user.name;try{let e=await v("/api/user");return e?.user?.name||e?.name||null}catch{return null}}function Q(e){if(!e)return{};let s={...e};return e.artists!==void 0&&e.artistCount===void 0&&(s.artistCount=e.artists),e.albums!==void 0&&e.albumCount===void 0&&(s.albumCount=e.albums),e.tracks!==void 0&&e.trackCount===void 0&&(s.trackCount=e.tracks),s.artistCount!==void 0?s:e.library?Q(e.library):e.stats?e.stats:s}async function Pt(){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="home-page">
      <div class="home-skeleton" style="height:120px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:200px;border-radius:12px"></div>
      <div class="home-skeleton" style="height:160px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:240px;border-radius:8px"></div>
    </div>`;let[s,a,t,i,n,r,o]=await Promise.all([Lt().catch(()=>null),v("/api/plex/status").catch(()=>null),v("/api/plex/stats?period=7day").catch(()=>null),v("/api/wishlist").catch(()=>null),v("/api/releases").catch(()=>null),v("/api/user").catch(()=>null),v("/api/loved").catch(()=>null)]),d,p,y;t&&t.source==="plex"?(d=q(t.topArtists),p=Y(t.topTracks),y={recenttracks:{track:G(t.recentTracks)}}):[d,p,y]=await Promise.all([v("/api/topartists?period=7day").catch(()=>null),v("/api/toptracks?period=7day").catch(()=>null),v("/api/recent?limit=200").catch(()=>null)]);let g={ok:r&&!r._stale,user:r?.user?.name||null},m=Q(a),u=y?.recenttracks?.track||[],x=i?.wishlist||i||[],b=n,L=o?.lovedtracks?.track||[],R=gt(d),Z=await dt(d).catch(()=>""),tt=await ut(d).catch(()=>""),et=await vt().catch(()=>""),H=u,D=null;if(t?.source==="plex"&&t?.dailyPlays?.some(c=>c.minutes>0||c.count>0))D=t.dailyPlays;else try{let c=await v("/api/activity?period=1month");c?.dailyPlays?.some(h=>h.minutes>0||h.count>0)&&(D=c.dailyPlays,c.recentTracks?.length&&(H=G(c.recentTracks)))}catch{try{H=(await v("/api/recent?limit=200"))?.recenttracks?.track||u}catch{}}e.innerHTML=`
    <div class="home-page">

      <!-- 1. Greeting + Stats + Last.fm Status -->
      ${it(s,m,g)}

      <!-- 1b. Live Radio Bar -->
      ${nt()}

      <!-- 1c. Recent Listening Activity Matrix -->
      ${V(H,D)}

      <!-- 2. Recent Activity -->
      ${lt(u)}

      <!-- 2b. Loved Tracks -->
      ${ot(L)}

      <!-- 2c. Featured Artist Banner -->
      ${Z}

      <!-- 3. Listen Later -->
      <div>${ct(x)}</div>

      <!-- 3b. Recent Artists -->
      <div>${mt(d)}</div>

      <!-- 3c. Recommended Artists -->
      <div>${tt}</div>

      <!-- 3d. Your Playlists -->
      <div id="home-playlists-container">${et}</div>

      <!-- 4. Daily Mixes -->
      <div>${ht(d)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${pt(R)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${bt(b)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${xt(d,p)}
      </div>

    </div>`;let st=localStorage.getItem("homePeriod")||"7day";e.querySelectorAll(".home-period-pill").forEach(c=>{c.classList.toggle("active",c.dataset.period===st)}),e.querySelectorAll(".home-period-pill").forEach(c=>{c.addEventListener("click",async()=>{let h=c.dataset.period;h&&await Et(h)})}),$t(),K("7day"),e.querySelectorAll("[data-switch]").forEach(c=>{c.addEventListener("click",()=>w(c.dataset.switch))}),e.querySelectorAll("#home-wylbt-artists-list [data-artist]").forEach(c=>{c.addEventListener("click",()=>w("artist-detail",{name:c.dataset.artist}))}),document.getElementById("home-recent-more")?.addEventListener("click",()=>{w("albums")}),document.getElementById("home-loved-more")?.addEventListener("click",()=>{w("listen-later")}),e.querySelectorAll(".genre-card").forEach(c=>{c.addEventListener("click",()=>w("ontdek")),c.addEventListener("keydown",h=>{(h.key==="Enter"||h.key===" ")&&w("ontdek")})});let P="albums";e.querySelectorAll("[data-releases-tab]").forEach(c=>{c.addEventListener("click",()=>{P=c.dataset.releasesTab,e.querySelectorAll("[data-releases-tab]").forEach(f=>f.classList.toggle("active",f===c));let h=document.getElementById("releases-body");h&&(h.innerHTML=W(b,P),U(b,P))})});let N="played";e.querySelectorAll("[data-recent-tab]").forEach(c=>{c.addEventListener("click",async()=>{e.querySelectorAll("[data-recent-tab]").forEach(f=>f.classList.toggle("active",f===c)),N=c.dataset.recentTab;let h=document.getElementById("home-recent-covers");if(h)if(N==="added")try{let E=((await v("/api/plex/library?sort=addedAt:desc&limit=8"))?.library||[]).map(A=>({name:A.album,artist:{"#text":A.artist},image:A.thumb?[null,null,{"#text":A.thumb}]:[null,null,{"#text":""}],addedAt:new Date(A.addedAt*1e3).toISOString()}));h.innerHTML=S(E,"added")}catch(f){console.warn("Failed to load added items:",f),h.innerHTML='<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Fout bij laden van recent toegevoegde albums</div>'}else h.innerHTML=S(u,"played")})}),e.querySelectorAll(".home-artist-circle-item").forEach(c=>{c.addEventListener("click",()=>{let h=c.dataset.artist;h&&w("artist-detail",{name:h})})});let O=document.getElementById("featured-play-btn");O&&O.addEventListener("click",async()=>{let c=O.dataset.artist;if(c)try{let f=(await v(`/api/artist/${encodeURIComponent(c)}`))?.ratingKey;if(!f){console.warn("Geen ratingKey voor artiest:",c);return}let{playOnZone:E}=await import("./plexRemote-RSESKH2Y.js");await E(f,"music")}catch(h){console.error("Featured artist play mislukt:",h)}});let z=document.getElementById("home-recent-artists");z&&(document.getElementById("home-artists-prev")?.addEventListener("click",()=>{z.scrollBy({left:-256,behavior:"smooth"})}),document.getElementById("home-artists-next")?.addEventListener("click",()=>{z.scrollBy({left:256,behavior:"smooth"})}));let j=document.getElementById("home-recommended-artists");j&&(document.getElementById("home-rec-artists-prev")?.addEventListener("click",()=>{j.scrollBy({left:-320,behavior:"smooth"})}),document.getElementById("home-rec-artists-next")?.addEventListener("click",()=>{j.scrollBy({left:320,behavior:"smooth"})})),e.querySelectorAll(".home-rec-artist").forEach(c=>{c.addEventListener("click",()=>{let h=c.dataset.artist;h&&w("artist-detail",{name:h})})});let k=document.getElementById("home-playlists");if(k){let h=document.getElementById("home-playlists-prev"),f=document.getElementById("home-playlists-next"),E=()=>{let A=k.scrollLeft<=0,at=k.scrollLeft>=k.scrollWidth-k.clientWidth-10;h?.toggleAttribute("disabled",A),f?.toggleAttribute("disabled",at)};h?.addEventListener("click",()=>{k.scrollBy({left:-400,behavior:"smooth"}),setTimeout(E,400)}),f?.addEventListener("click",()=>{k.scrollBy({left:400,behavior:"smooth"}),setTimeout(E,400)}),k.addEventListener("scroll",E),E()}e.querySelectorAll(".home-playlist-card").forEach(c=>{c.addEventListener("click",()=>{let h=c.dataset.playlistId,f=c.dataset.playlistName;h&&(window.lastSelectedPlaylistId!==void 0&&(B.selectedPlaylist={id:h,name:f}),w("albums"))})}),yt(d),U(b,P)}export{Pt as loadHome};
