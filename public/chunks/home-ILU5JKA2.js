import{a as T,c as S}from"./chunk-AJG3ALGO.js";import"./chunk-DNLDPMEE.js";import{A as h,a as C,e as M,i as l,k as F}from"./chunk-G2KURTNZ.js";var R=["#1a237e","#283593","#3949ab","#5c6bc0","#7986cb","#9fa8da"],D=null;function U(e){return!e||!Array.isArray(e)?{topartists:{artist:[]}}:{topartists:{artist:e.map(s=>({name:s.name,playcount:String(s.playcount||0),image:[null,null,{"#text":s.thumb||""},{"#text":s.thumb||""}],topTag:s.genre||null}))}}}function Y(e){return!e||!Array.isArray(e)?{toptracks:{track:[]}}:{toptracks:{track:e.map(s=>({name:s.title,playcount:String(s.playcount||0),artist:{name:s.artist,"#text":s.artist},album:{"#text":s.album,name:s.album},image:[null,null,{"#text":s.thumb||""}]}))}}}function G(e){return!e||!Array.isArray(e)?[]:e.map(s=>({name:s.title,artist:{"#text":s.artist},album:{"#text":s.album},image:[null,null,{"#text":s.thumb||""}],date:{uts:String(s.viewedAt)}}))}function L(e){return e==null||isNaN(e)?"\u2014":Number(e).toLocaleString("nl-NL")}function _(e){if(!e)return"";let s=new Date(e),a=Date.now()-s.getTime(),t=Math.floor(a/864e5);return t<1?"Vandaag":t===1?"Gisteren":t<7?`${t}d geleden`:t<31?`${Math.floor(t/7)}w geleden`:`${Math.floor(t/30)}mo geleden`}function $(e,s=120){return e?M(e,s):null}function et(e,s){let a=e||"Muzikant",t=s?.artists??s?.artistCount??"\u2026",i=s?.albums??s?.albumCount??"\u2026",r=s?.tracks??s?.trackCount??"\u2026",n=s?.composers??s?.composerCount??"\u2014";return`
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${l(a)}</div>

      <div class="home-stat-cards">
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-artists">${L(t)}</div>
            <div class="home-stat-label">Artists</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-albums">${L(i)}</div>
            <div class="home-stat-label">Albums</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-tracks">${L(r)}</div>
            <div class="home-stat-label">Tracks</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-composers">${L(n)}</div>
            <div class="home-stat-label">Composers</div>
          </div>
        </div>
      </div>
    </div>`}function st(){return`
    <div class="live-radio-bar">
      <div class="live-radio-badge">
        <span class="live-radio-dot"></span>
        <span class="live-radio-name">NPO Radio 2</span>
      </div>
      <div class="live-radio-info">NPO Radio 2 \u2014 Hilversum, Netherlands, 92.6 FM</div>
      <a href="#" class="live-radio-more" onclick="return false">More live radio</a>
    </div>`}function at(e){if(!e||e<1)return"0m";if(e<60)return`${Math.round(e)}m`;let s=Math.floor(e/60),a=Math.round(e%60);return a>0?`${s}h ${a}m`:`${s}h`}function V(e,s){let a={};if(s&&Array.isArray(s))for(let d of s)d.date!=null&&(a[d.date]=d.minutes||(d.count?d.count*3.5:0));else for(let d of e||[]){let u=d.date?.uts;if(!u)continue;let b=new Date(parseInt(u,10)*1e3).toISOString().slice(0,10);a[b]=(a[b]||0)+3.5}let t=new Date,i=t.getDay(),r=new Date(t);r.setDate(t.getDate()-(i+6)%7),r.setHours(0,0,0,0);let n=[];for(let d=0;d<4;d++){let u=new Date(r);u.setDate(r.getDate()-d*7);let w=[];for(let b=0;b<7;b++){let E=new Date(u);E.setDate(u.getDate()+b);let I=E.toISOString().slice(0,10);w.push({key:I,minutes:a[I]||0})}n.push({days:w,totalMinutes:w.reduce((b,E)=>b+E.minutes,0)})}let o=Math.max(...n.map(d=>d.totalMinutes),1),m=Math.max(...n.flatMap(d=>d.days.map(u=>u.minutes)),1);function p(d){if(!d)return"width:6px;height:6px;background:#e0e0e0;";let u=d/m;return u<.25?"width:10px;height:10px;background:var(--accent);opacity:0.4;":u<.6?"width:16px;height:16px;background:var(--accent);opacity:0.7;":"width:24px;height:24px;background:var(--accent);opacity:1;"}let y=n.map(d=>{let u=d.totalMinutes>0?Math.round(d.totalMinutes/o*100):0,w=d.days.map(b=>`<div class="activity-dot-cell"><div class="activity-dot" style="${p(b.minutes)}" title="${b.key}: ${Math.round(b.minutes)}min"></div></div>`).join("");return`
      <div class="activity-bar-wrap">
        <div class="activity-bar" style="width:${u}%"></div>
        <span class="activity-bar-label">${at(d.totalMinutes)}</span>
      </div>
      ${w}`}).join("");return`
    <div class="home-wylbt-card activity-matrix-card">
      <div class="home-wylbt-card-header" style="margin-bottom:16px">
        <div class="home-wylbt-card-title">Recent listening</div>
      </div>
      <div class="activity-grid">
        <!-- Header row -->
        <div class="activity-grid-label-header">Last 4 weeks</div>
        ${["M","T","W","T","F","S","S"].map(d=>`<div class="activity-day-label">${d}</div>`).join("")}
        <!-- Week rows -->
        ${y}
      </div>
    </div>`}function P(e,s="played"){return e?.length?e.slice(0,8).map(t=>{let i=t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"]||t.image?.[3]?.["#text"]||"",r=i?$(i,140):null,n=r?`<img src="${l(r)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-recent-cover-ph">\u266A</div>',o="";if(s==="added"&&t.addedAt)o=_(t.addedAt);else if(s==="played"&&t.date?.uts){let m=new Date(parseInt(t.date.uts,10)*1e3);o=_(m.toISOString())}return`
      <div class="home-recent-cover">
        ${n}
        ${o?`<div class="home-recent-cover-date">${o}</div>`:""}
        <div class="home-recent-cover-title" title="${l(t.name)}">${l(t.name)}</div>
        <div class="home-recent-cover-artist" title="${l(t.artist?.["#text"]||t.artist||"")}">${l(t.artist?.["#text"]||t.artist||"")}</div>
      </div>`}).join(""):'<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>'}function it(e){return`
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
            ${P(e,"played")}
          </div>
        </div>
        <button class="home-recent-nav" id="home-recent-next" aria-label="Volgende">&#8250;</button>
      </div>
    </div>`}function nt(e){let s=(e||[]).slice(0,4);return s.length?`
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
      </div>`}async function rt(e){let s=(e?.topartists?.artist||[]).slice(0,10);if(!s.length)return"";let a=null;try{let n=sessionStorage.getItem("featuredArtistName");n&&(a=s.find(o=>o.name===n))}catch{}if(!a){let n=Math.floor(Math.random()*s.length);a=s[n];try{sessionStorage.setItem("featuredArtistName",a.name)}catch{}}let t=[];try{let n=await h(`/api/artist/${encodeURIComponent(a.name)}`);t=(n?.topalbums?.album||n?.albums||[]).slice(0,3)}catch{}let i=F(a.name),r=t.map(n=>{let o=n.image?.[2]?.["#text"]||n.image?.[1]?.["#text"]||"",m=o?M(o,80):null;return`
      <div class="featured-album-card">
        ${m?`<img src="${l(m)}" alt="${l(n.name)}" class="featured-album-img">`:'<div class="featured-album-ph">\u266B</div>'}
        <div class="featured-album-info">
          <div class="featured-album-artist">${l(n.artist?.name||n.artist||"")}</div>
          <div class="featured-album-title">${l(n.name||"")}</div>
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
        ${r}
      </div>
    </div>`}function lt(e){let s=(e?.topartists?.artist||[]).slice(0,5);return s.length?`
    <div class="home-section-header">
      <div class="home-section-title">Your recent artists</div>
      <div class="home-recent-artists-nav">
        <button class="home-recent-artists-btn" id="home-artists-prev" aria-label="Vorige">&#8249;</button>
        <button class="home-recent-artists-btn" id="home-artists-next" aria-label="Volgende">&#8250;</button>
      </div>
      <button class="home-more-btn" data-switch="albums">MORE</button>
    </div>
    <div class="home-recent-artists-wrap">
      <div class="home-recent-artists" id="home-recent-artists">${s.map(t=>{let i=$(t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"],200),r=i?`<img class="home-artist-circle-img" src="${l(i)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
      <div class="home-artist-circle-item" data-artist="${l(t.name)}">
        <div class="home-artist-circle">${r}</div>
        <div class="home-artist-circle-name">${l(t.name)}</div>
      </div>`}).join("")}</div>
    </div>`:""}async function ot(e){try{let s=(e?.topartists?.artist||e||[]).slice(0,5);if(!s.length)return"";let a=[];try{let i=await h("/api/discover");i?.artists&&Array.isArray(i.artists)&&(a=i.artists.slice(0,5))}catch{}if(a.length===0){let i=s.slice(0,3).map(async o=>{try{let m=await h(`/api/artist/${encodeURIComponent(o.name)}/similar`,{signal:AbortSignal.timeout(5e3)});return{source:o.name,similar:(m?.similarartists?.artist||m?.similar||[]).slice(0,5)}}catch{return{source:o.name,similar:[]}}}),r=await Promise.all(i),n=new Set(s.map(o=>o.name.toLowerCase()));for(let o of r)for(let m of o.similar){let p=(m.name||m).toLowerCase();!n.has(p)&&a.length<5&&(n.add(p),a.push({name:m.name||m,image:m.image,sources:[o.source]}))}}return a.length?`
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
          ${a.map(i=>{let r=typeof i=="string"?i:i.name,n=i.image,o=i.sources||[],m=typeof i!="string"&&(i.image?.[3]?.["#text"]||i.image?.[2]?.["#text"]||i.thumb)||"",p=$(m,120),y=p?`<img class="home-rec-artist-img" src="${l(p)}" alt="${l(r)}" loading="lazy">`:'<div class="home-rec-artist-ph">\u266A</div>',g="";if(o.length>0){let d=o.slice(0,2);d.length===1?g=`If you like ${d[0]}`:g=`If you like ${d.join(" and ")}`}return`
        <div class="home-rec-artist" data-artist="${l(r)}">
          <div class="home-rec-artist-img-wrap">${y}</div>
          <div class="home-rec-artist-name">${l(r)}</div>
          ${g?`<div class="home-rec-artist-reason">${l(g)}</div>`:""}
        </div>`}).join("")}
        </div>
      </div>`:""}catch(s){return console.warn("Recommended artists render mislukt:",s),""}}async function ct(){try{let e=await h("/api/plex/playlists"),s=(e?.playlists||e||[]).slice(0,5);return s.length?`
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
          ${s.map(t=>{let i="",r="";return t.thumb?(i=M(t.thumb,360),r=`background: url('${l(i)}'); background-size: cover; background-position: center;`):r="background: linear-gradient(135deg, rgba(40,60,140,0.8), rgba(60,30,100,0.8));",`
        <div class="home-playlist-card" data-playlist-id="${l(t.key||t.id||"")}" data-playlist-name="${l(t.title||"")}">
          ${i?`<img class="home-playlist-card-img" src="${l(i)}" alt="${l(t.title||"")}" loading="lazy">`:'<div class="home-playlist-card-ph">\u266B</div>'}
          <div class="home-playlist-name">${l(t.title||"Playlist")}</div>
        </div>`}).join("")}
        </div>
      </div>`:""}catch(e){return console.warn("Playlists render mislukt:",e),""}}function dt(e){let a=(e?.topartists?.artist||[]).slice(0,2).map((t,i)=>{let r=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",n=r?M(r,400):"";return`
      <div class="home-mix-card" data-switch="ontdek" style="${n?`background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${l(n)}'); background-size: cover; background-position: center;`:"background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7));"}">
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
    <div class="home-daily-mixes">${a.join("")}</div>`}async function mt(e){let s=(e?.topartists?.artist||[]).slice(0,2);for(let a=0;a<s.length;a++){let t=s[a],i=document.getElementById(`home-mix-featuring-${a}`);if(i)try{let r=new AbortController,n=setTimeout(()=>r.abort(),5e3);try{let o=await h(`/api/artist/${encodeURIComponent(t.name)}/similar`,{signal:r.signal});clearTimeout(n);let m=(o?.similarartists?.artist||o?.similar||[]).slice(0,3);m.length?i.textContent=`Featuring ${m.map(p=>p.name||p).join(", ")} and more`:i.textContent=""}catch{clearTimeout(n),i.textContent=""}}catch{i.textContent=""}}}function ut(e){if(e?.genres&&Array.isArray(e.genres))return e.genres.map((t,i)=>({name:t.name,count:t.count,pct:t.pct||Math.round(t.count/e.genres.reduce((r,n)=>r+n.count,0)*100),color:R[i%R.length]})).slice(0,6);let s=e?.topartists?.artist||[],a={};for(let t of s){let i=t.topTag;if(!i||i.toLowerCase()==="other")continue;let r=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",n=r?M(r,400):null;a[i]||(a[i]={name:i,count:0,artistImage:n}),a[i].count+=parseInt(t.playcount,10)||0,!a[i].artistImage&&n&&(a[i].artistImage=n)}return Object.values(a).sort((t,i)=>i.count-t.count).slice(0,6)}function vt(e){if(!e?.length)return"";let s=i=>{let r=i.artistImage?`background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${l(i.artistImage)}'); background-size: cover; background-position: center;`:"background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));";return`
      <div class="genre-card" data-genre="${l(i.name)}" style="${r}" role="button" tabindex="0">
        <span class="genre-card-name">${l(i.name)}</span>
      </div>`},a=e.slice(0,3),t=e.slice(3,6);return`
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${a.map(s).join("")}</div>
      <div class="genres-grid-row">${t.map(s).join("")}</div>
    </div>`}function W(e,s){let a=e?.releases||(Array.isArray(e)?e:[]),t=a.filter(u=>(u.type||"album").toLowerCase()!=="single"),i=a.filter(u=>(u.type||"").toLowerCase()==="single"),r=(s==="singles"?i:t).slice(0,3);if(!r.length)return'<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>';let[n,...o]=r,m=$(n.image||n.thumb,400),p=m?`<img src="${l(m)}" alt="${l(n.title||n.album||"")}" loading="lazy">`:'<div class="releases-main-ph">\u266B</div>',y=n.description||n.bio||"",g=`
    <div class="releases-main-card">
      ${p}
      <div class="releases-main-info">
        <div class="releases-main-artist">${l(n.artist||"\u2014")}</div>
        <div class="releases-main-title">${l(n.title||n.album||"\u2014")}</div>
        <div class="releases-main-date">${l(n.date||n.releaseDate||"")}</div>
        ${y?`<div class="releases-main-desc">${l(y)}</div>`:""}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`,d=o.slice(0,2).map((u,w)=>{let b=$(u.image||u.thumb,160);return`
      <div class="releases-small-card">
        ${b?`<img src="${l(b)}" alt="${l(u.title||u.album||"")}" loading="lazy">`:'<div class="releases-small-ph">\u266B</div>'}
        <div class="releases-small-info">
          <div class="releases-small-artist">${l(u.artist||"\u2014")}</div>
          <div class="releases-small-title">${l(u.title||u.album||"\u2014")}</div>
          <div class="releases-small-date">${l(u.date||u.releaseDate||"")}</div>
          <div class="releases-plex-badge" id="plex-badge-${w+1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`}).join("");return`
    <div class="releases-preview">
      ${g}
      <div class="releases-stack">${d}</div>
    </div>`}function ht(e,s="albums"){return`
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
    </div>`}async function q(e,s){let a=e?.releases||(Array.isArray(e)?e:[]),t=a.filter(o=>(o.type||"album").toLowerCase()!=="single"),i=a.filter(o=>(o.type||"").toLowerCase()==="single"),r=(s==="singles"?i:t).slice(0,3);if(!r.length)return;let n=r.map(o=>({artist:o.artist||"",album:o.title||o.album||""}));try{let o=await fetch("/api/plex/check-batch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:n})});if(!o.ok)throw new Error(`HTTP ${o.status}`);let p=(await o.json()).results||{};n.forEach((y,g)=>{let d=`${y.artist}||${y.album}`,u=document.getElementById(`plex-badge-${g}`);u&&p[d]&&(u.style.display="inline-flex")})}catch(o){console.warn("Plex check-batch aanroep mislukt:",o)}}function yt(e){let s=document.getElementById("home-donut-chart");!s||!window.Chart||(D&&(D.destroy(),D=null),D=new window.Chart(s,{type:"doughnut",data:{labels:e.map(a=>a.name),datasets:[{data:e.map(a=>a.count),backgroundColor:e.map(a=>a.color),borderWidth:0,hoverOffset:4}]},options:{cutout:"65%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:a=>` ${a.label}: ${L(a.parsed)} plays`}}},animation:{duration:400}}}))}async function K(e){let s=document.getElementById("home-genres-legend");try{let a=null;try{let t=await h(`/api/plex/stats?period=${e}`);if(t&&t.source==="plex"&&t.genres&&Array.isArray(t.genres)&&t.genres.length>0){let i=t.genres.reduce((r,n)=>r+n.count,0)||1;a=t.genres.map((r,n)=>({name:r.name,count:r.count,pct:Math.round(r.count/i*100),color:R[n%R.length]})).slice(0,6)}}catch{}if(!a){let i=((await h(`/api/top/artists?period=${e}`))?.topartists?.artist||[]).slice(0,8),r={};for(let y of i){let g=y.topTag||"Other",d=parseInt(y.playcount,10)||0;r[g]=(r[g]||0)+d}let n=Object.entries(r).sort((y,g)=>g[1]-y[1]),o=n.slice(0,6),m=n.slice(6).reduce((y,[,g])=>y+g,0);if(m>0){let y=o.findIndex(([g])=>g==="Other");y>=0?o[y][1]+=m:o.push(["Other",m])}let p=o.reduce((y,[,g])=>y+g,0)||1;a=o.map(([y,g],d)=>({name:y,count:g,pct:Math.round(g/p*100),color:R[d%R.length]}))}s&&(s.innerHTML=a.map(t=>`
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${t.color}"></div>
          <div class="home-genres-legend-name">${l(t.name)}</div>
        </div>`).join("")),yt(a)}catch(a){console.warn("Genre chart mislukt:",a),s&&(s.innerHTML='<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>')}}function X(e){let s=(e?.topartists?.artist||[]).slice(0,4);if(!s.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let a=parseInt(s[0]?.playcount,10)||1;return s.map(t=>{let i=Math.round((parseInt(t.playcount,10)||0)/a*100),r=$(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72),n=r?`<img class="home-wylbt-artist-img" src="${l(r)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-wylbt-artist-ph">\u266A</div>';return`
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
        <div class="home-wylbt-item-count">${L(parseInt(t.playcount,10)||0)}</div>
      </div>`}).join("")}function gt(e){let s={};for(let a of e?.toptracks?.track||[]){let t=a.album?.["#text"]||a.album?.name||null,i=a.artist?.name||a.artist?.["#text"]||a.artist||"";if(!t)continue;let r=`${t}|||${i}`;s[r]||(s[r]={album:t,artist:i,playcount:0,image:a.image}),s[r].playcount+=parseInt(a.playcount,10)||0}return Object.values(s).sort((a,t)=>t.playcount-a.playcount).slice(0,4)}function J(e){let s=gt(e);if(!s.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let a=s[0]?.playcount||1;return s.map(t=>{let i=Math.round(t.playcount/a*100),r=$(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72);return`
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
        <div class="home-wylbt-item-count">${L(t.playcount)}</div>
      </div>`}).join("")}function pt(e,s){return`
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

    </div>`}function bt(){let e=document.getElementById("home-recent-covers"),s=document.getElementById("home-recent-prev"),a=document.getElementById("home-recent-next");if(!e||!s||!a)return;let t=0,i=160;function r(){let n=Math.max(0,e.scrollWidth-e.parentElement.offsetWidth);t=Math.max(0,Math.min(t,n)),e.style.transform=`translateX(-${t}px)`,s.disabled=t<=0,a.disabled=t>=n}s.addEventListener("click",()=>{t=Math.max(0,t-i),r()}),a.addEventListener("click",()=>{t+=i,r()}),r()}async function ft(e){let s,a;try{let r=await h(`/api/plex/stats?period=${e}`);r&&r.source==="plex"?(s=U(r.topArtists),a=Y(r.topTracks)):[s,a]=await Promise.all([h(`/api/topartists?period=${e}`).catch(()=>null),h(`/api/toptracks?period=${e}`).catch(()=>null)])}catch{[s,a]=await Promise.all([h(`/api/topartists?period=${e}`).catch(()=>null),h(`/api/toptracks?period=${e}`).catch(()=>null)])}let t=document.getElementById("home-wylbt-artists-list");t&&(t.innerHTML=X(s));let i=document.getElementById("home-wylbt-releases-list");i&&(i.innerHTML=J(a)),t?.querySelectorAll("[data-artist]").forEach(r=>{r.addEventListener("click",()=>T(r.dataset.artist))}),await K(e)}async function wt(e){localStorage.setItem("homePeriod",e),document.querySelectorAll(".home-period-pill").forEach(s=>{s.classList.toggle("active",s.dataset.period===e)});try{let s=null,a=[],t=await h(`/api/plex/stats?period=${e}`);if(t?.dailyPlays?.some(r=>r.minutes>0||r.count>0))s=t.dailyPlays,a=t.recentTracks||[];else{let r=await h(`/api/activity?period=${e}`);r?.dailyPlays?.some(n=>n.minutes>0||n.count>0)&&(s=r.dailyPlays,a=r.recentTracks||[])}let i=document.querySelector(".activity-matrix-card");if(i){let r=a.length?G(a):[];i.outerHTML=V(r,s)}}catch(s){console.warn("Activity matrix herlaad mislukt:",s)}if(e==="today")try{let s=new Date;s.setHours(0,0,0,0);let a=Math.floor(s.getTime()/1e3),i=((await h("/api/plex/stats?period=today"))?.recentTracks||[]).filter(n=>parseInt(n.date?.uts||0,10)>=a),r=document.getElementById("home-recent-covers");r&&(r.innerHTML=P(i))}catch(s){console.warn("Recent activity herlaad mislukt:",s)}else try{let a=(await h(`/api/plex/stats?period=${e}`))?.recentTracks||[],t=document.getElementById("home-recent-covers");t&&(t.innerHTML=P(a))}catch(s){console.warn("Recent activity herlaad mislukt:",s)}await ft(e);try{let a=(await h(`/api/plex/stats?period=${e}`))?.topArtists||[],t=document.getElementById("home-recent-artists");if(t){let i=a.slice(0,5);if(i.length){let r=i.map(n=>{let o=n.thumb||n.image?.[3]?.["#text"]||n.image?.[2]?.["#text"],m=$(o,200),p=m?`<img class="home-artist-circle-img" src="${l(m)}" alt="${l(n.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
            <div class="home-artist-circle-item" data-artist="${l(n.name)}">
              <div class="home-artist-circle">${p}</div>
              <div class="home-artist-circle-name">${l(n.name)}</div>
            </div>`}).join("");t.innerHTML=r,t.querySelectorAll(".home-artist-circle-item").forEach(n=>{n.addEventListener("click",()=>{let o=n.dataset.artist;o&&T(o)})})}}}catch(s){console.warn("Recent artists herlaad mislukt:",s)}}async function $t(){if(C.user?.name)return C.user.name;try{let e=await h("/api/user");return e?.user?.name||e?.name||null}catch{return null}}function Q(e){if(!e)return{};let s={...e};return e.artists!==void 0&&e.artistCount===void 0&&(s.artistCount=e.artists),e.albums!==void 0&&e.albumCount===void 0&&(s.albumCount=e.albums),e.tracks!==void 0&&e.trackCount===void 0&&(s.trackCount=e.tracks),s.artistCount!==void 0?s:e.library?Q(e.library):e.stats?e.stats:s}async function Tt(){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="home-page">
      <div class="home-skeleton" style="height:120px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:200px;border-radius:12px"></div>
      <div class="home-skeleton" style="height:160px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:240px;border-radius:8px"></div>
    </div>`;let[s,a,t,i,r]=await Promise.all([$t().catch(()=>null),h("/api/plex/status").catch(()=>null),h("/api/plex/stats?period=7day").catch(()=>null),h("/api/wishlist").catch(()=>null),h("/api/releases").catch(()=>null)]),n,o,m;t&&t.source==="plex"?(n=U(t.topArtists),o=Y(t.topTracks),m={recenttracks:{track:G(t.recentTracks)}}):[n,o,m]=await Promise.all([h("/api/topartists?period=7day").catch(()=>null),h("/api/toptracks?period=7day").catch(()=>null),h("/api/recent?limit=200").catch(()=>null)]);let p=Q(a),y=m?.recenttracks?.track||[],g=i?.wishlist||i||[],d=r,u=ut(n),w=await rt(n).catch(()=>""),b=await ot(n).catch(()=>""),E=await ct().catch(()=>""),I=y,H=null;if(t?.source==="plex"&&t?.dailyPlays?.some(c=>c.minutes>0||c.count>0))H=t.dailyPlays;else try{let c=await h("/api/activity?period=1month");c?.dailyPlays?.some(v=>v.minutes>0||v.count>0)&&(H=c.dailyPlays,c.recentTracks?.length&&(I=G(c.recentTracks)))}catch{try{I=(await h("/api/recent?limit=200"))?.recenttracks?.track||y}catch{}}e.innerHTML=`
    <div class="home-page">

      <!-- 1. Greeting + Stats -->
      ${et(s,p)}

      <!-- 1b. Live Radio Bar -->
      ${st()}

      <!-- 1c. Recent Listening Activity Matrix -->
      ${V(I,H)}

      <!-- 2. Recent Activity -->
      ${it(y)}

      <!-- 2b. Featured Artist Banner -->
      ${w}

      <!-- 3. Listen Later -->
      <div>${nt(g)}</div>

      <!-- 3b. Recent Artists -->
      <div>${lt(n)}</div>

      <!-- 3c. Recommended Artists -->
      <div>${b}</div>

      <!-- 3d. Your Playlists -->
      <div id="home-playlists-container">${E}</div>

      <!-- 4. Daily Mixes -->
      <div>${dt(n)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${vt(u)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${ht(d)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${pt(n,o)}
      </div>

    </div>`;let Z=localStorage.getItem("homePeriod")||"7day";e.querySelectorAll(".home-period-pill").forEach(c=>{c.classList.toggle("active",c.dataset.period===Z)}),e.querySelectorAll(".home-period-pill").forEach(c=>{c.addEventListener("click",async()=>{let v=c.dataset.period;v&&await wt(v)})}),bt(),K("7day"),e.querySelectorAll("[data-switch]").forEach(c=>{c.addEventListener("click",()=>S(c.dataset.switch))}),e.querySelectorAll("#home-wylbt-artists-list [data-artist]").forEach(c=>{c.addEventListener("click",()=>T(c.dataset.artist))}),document.getElementById("home-recent-more")?.addEventListener("click",()=>{S("albums")}),e.querySelectorAll(".genre-card").forEach(c=>{c.addEventListener("click",()=>S("ontdek")),c.addEventListener("keydown",v=>{(v.key==="Enter"||v.key===" ")&&S("ontdek")})});let B="albums";e.querySelectorAll("[data-releases-tab]").forEach(c=>{c.addEventListener("click",()=>{B=c.dataset.releasesTab,e.querySelectorAll("[data-releases-tab]").forEach(f=>f.classList.toggle("active",f===c));let v=document.getElementById("releases-body");v&&(v.innerHTML=W(d,B),q(d,B))})});let N="played";e.querySelectorAll("[data-recent-tab]").forEach(c=>{c.addEventListener("click",async()=>{e.querySelectorAll("[data-recent-tab]").forEach(f=>f.classList.toggle("active",f===c)),N=c.dataset.recentTab;let v=document.getElementById("home-recent-covers");if(v)if(N==="added")try{let k=((await h("/api/plex/library?sort=addedAt:desc&limit=8"))?.library||[]).map(A=>({name:A.album,artist:{"#text":A.artist},image:A.thumb?[null,null,{"#text":A.thumb}]:[null,null,{"#text":""}],addedAt:new Date(A.addedAt*1e3).toISOString()}));v.innerHTML=P(k,"added")}catch(f){console.warn("Failed to load added items:",f),v.innerHTML='<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Fout bij laden van recent toegevoegde albums</div>'}else v.innerHTML=P(y,"played")})}),e.querySelectorAll(".home-artist-circle-item").forEach(c=>{c.addEventListener("click",()=>{let v=c.dataset.artist;v&&T(v)})});let O=document.getElementById("featured-play-btn");O&&O.addEventListener("click",async()=>{let c=O.dataset.artist;if(c)try{let f=(await h(`/api/artist/${encodeURIComponent(c)}`))?.ratingKey;if(!f){console.warn("Geen ratingKey voor artiest:",c);return}let{playOnZone:k}=await import("./plexRemote-2Q7YBOS6.js");await k(f,"music")}catch(v){console.error("Featured artist play mislukt:",v)}});let z=document.getElementById("home-recent-artists");z&&(document.getElementById("home-artists-prev")?.addEventListener("click",()=>{z.scrollBy({left:-256,behavior:"smooth"})}),document.getElementById("home-artists-next")?.addEventListener("click",()=>{z.scrollBy({left:256,behavior:"smooth"})}));let j=document.getElementById("home-recommended-artists");j&&(document.getElementById("home-rec-artists-prev")?.addEventListener("click",()=>{j.scrollBy({left:-320,behavior:"smooth"})}),document.getElementById("home-rec-artists-next")?.addEventListener("click",()=>{j.scrollBy({left:320,behavior:"smooth"})})),e.querySelectorAll(".home-rec-artist").forEach(c=>{c.addEventListener("click",()=>{let v=c.dataset.artist;v&&T(v)})});let x=document.getElementById("home-playlists");if(x){let v=document.getElementById("home-playlists-prev"),f=document.getElementById("home-playlists-next"),k=()=>{let A=x.scrollLeft<=0,tt=x.scrollLeft>=x.scrollWidth-x.clientWidth-10;v?.toggleAttribute("disabled",A),f?.toggleAttribute("disabled",tt)};v?.addEventListener("click",()=>{x.scrollBy({left:-400,behavior:"smooth"}),setTimeout(k,400)}),f?.addEventListener("click",()=>{x.scrollBy({left:400,behavior:"smooth"}),setTimeout(k,400)}),x.addEventListener("scroll",k),k()}e.querySelectorAll(".home-playlist-card").forEach(c=>{c.addEventListener("click",()=>{let v=c.dataset.playlistId,f=c.dataset.playlistName;v&&(window.lastSelectedPlaylistId!==void 0&&(C.selectedPlaylist={id:v,name:f}),S("albums"))})}),mt(n),q(d,B)}export{Tt as loadHome};
