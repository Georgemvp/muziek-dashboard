import{a as L,c as x}from"./chunk-4XK2BE73.js";import"./chunk-YBNPHY7S.js";import{D as u,a as M,e as E,i as l}from"./chunk-454H4WOQ.js";var T=["#1a237e","#283593","#3949ab","#5c6bc0","#7986cb","#9fa8da"],I=null;function y(e){return e==null||isNaN(e)?"\u2014":e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":String(e)}function f(e,i=120){return e?E(e,i):null}function j(e,i){let s=e||"Muzikant",t=i?.artists??i?.artistCount??"\u2026",a=i?.albums??i?.albumCount??"\u2026",n=i?.tracks??i?.trackCount??"\u2026",o=i?.composers??i?.composerCount??"\u2014";return`
    <div class="home-greeting">
      <div class="home-greeting-text">Hi, ${l(s)}</div>
      <div class="home-stat-cards">
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-artists">${y(t)}</div>
            <div class="home-stat-label">Artists</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="3" x2="12" y2="9"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-albums">${y(a)}</div>
            <div class="home-stat-label">Albums</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-tracks">${y(n)}</div>
            <div class="home-stat-label">Tracks</div>
          </div>
        </div>
        <div class="home-stat-card">
          <div class="home-stat-icon"><svg viewBox="0 0 24 24"><path d="M9 12h6M9 8h6M9 16h4"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg></div>
          <div class="home-stat-body">
            <div class="home-stat-value" id="hstat-composers">${y(o)}</div>
            <div class="home-stat-label">Composers</div>
          </div>
        </div>
      </div>
    </div>`}function A(e){return e?.length?e.slice(0,8).map(s=>{let t=f(s.image?.[2]?.["#text"]||s.image?.[1]?.["#text"],120);return`
      <div class="home-recent-cover">
        ${t?`<img src="${l(t)}" alt="${l(s.name)}" loading="lazy">`:'<div class="home-recent-cover-ph">\u266A</div>'}
        <div class="home-recent-cover-label" title="${l(s.name)}">${l(s.name)}</div>
        <div class="home-recent-cover-label" style="opacity:.7">${l(s.artist?.["#text"]||s.artist||"")}</div>
      </div>`}).join(""):'<div style="color:rgba(255,255,255,0.5);font-size:13px;padding:12px 0">Geen recente activiteit</div>'}function _(e){return`
    <div class="home-recent-banner">
      <div class="home-recent-header">
        <div class="home-recent-title">Recent activity</div>
        <div class="home-recent-tabs">
          <button class="home-recent-tab active" data-recent-tab="played">PLAYED</button>
          <button class="home-recent-tab" data-recent-tab="loved">LOVED</button>
        </div>
        <button class="home-recent-more" id="home-recent-more">MORE</button>
      </div>
      <div class="home-recent-row">
        <button class="home-recent-nav" id="home-recent-prev" aria-label="Vorige">&#8249;</button>
        <div class="home-recent-covers-wrap">
          <div class="home-recent-covers" id="home-recent-covers">
            ${A(e)}
          </div>
        </div>
        <button class="home-recent-nav" id="home-recent-next" aria-label="Volgende">&#8250;</button>
      </div>
    </div>`}function q(e){let i=(e||[]).slice(0,4);return i.length?`
    <div class="home-section-header">
      <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
      <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
    </div>
    <div class="home-listen-later-grid">${i.map(t=>{let a=f(t.image,96);return`
      <div class="home-listen-later-item">
        ${a?`<img class="home-listen-later-img" src="${l(a)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-listen-later-ph">\u266B</div>'}
        <div class="home-listen-later-info">
          <div class="home-listen-later-name" title="${l(t.name)}">${l(t.name)}</div>
          <div class="home-listen-later-artist" title="${l(t.artist||"")}">${l(t.artist||"")}</div>
        </div>
        <div class="home-listen-later-type">${l(t.type||"album")}</div>
      </div>`}).join("")}</div>`:`
      <div class="home-section-header">
        <div class="home-section-title" style="font-family:var(--font-display)">Listen Later</div>
        <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
      </div>
      <div class="home-listen-later-grid">
        <div class="home-listen-later-empty">Je wishlist is leeg. Voeg albums toe via de zoekfunctie.</div>
      </div>`}function P(e){let i=(e?.topartists?.artist||[]).slice(0,5);return i.length?`
    <div class="home-section-header">
      <div class="home-section-title">Your recent artists</div>
      <div class="home-recent-artists-nav">
        <button class="home-recent-artists-btn" id="home-artists-prev" aria-label="Vorige">&#8249;</button>
        <button class="home-recent-artists-btn" id="home-artists-next" aria-label="Volgende">&#8250;</button>
      </div>
      <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
    </div>
    <div class="home-recent-artists-wrap">
      <div class="home-recent-artists" id="home-recent-artists">${i.map(t=>{let a=f(t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"],200),n=a?`<img class="home-artist-circle-img" src="${l(a)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-artist-circle-ph">\u266A</div>';return`
      <div class="home-artist-circle-item" data-artist="${l(t.name)}">
        <div class="home-artist-circle">${n}</div>
        <div class="home-artist-circle-name">${l(t.name)}</div>
      </div>`}).join("")}</div>
    </div>`:""}function V(e){let s=(e?.topartists?.artist||[]).slice(0,2).map((t,a)=>{let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",o=n?E(n,400):"";return`
      <div class="home-mix-card" data-switch="ontdek" style="${o?`background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('${l(o)}'); background-size: cover; background-position: center;`:"background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7));"}">
        <div class="home-mix-info">
          <div class="home-mix-label">DAILY MIX</div>
          <div class="home-mix-name">${l(t.name)} Mix</div>
          <div class="home-mix-featuring" id="home-mix-featuring-${a}">Laden\u2026</div>
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
    <div class="home-daily-mixes">${s.join("")}</div>`}async function N(e){let i=(e?.topartists?.artist||[]).slice(0,2);for(let s=0;s<i.length;s++){let t=i[s],a=document.getElementById(`home-mix-featuring-${s}`);if(a)try{let n=await u(`/api/artist/${encodeURIComponent(t.name)}/similar`),o=(n?.similarartists?.artist||n?.similar||[]).slice(0,3);if(o.length){let h=o.map(v=>l(v.name||v)).join(", ");a.textContent=`Featuring ${o.slice(0,3).map(v=>v.name||v).join(", ")} and more`}else a.textContent=""}catch{a.textContent=""}}}function Y(e){let i=e?.topartists?.artist||[],s={};for(let t of i){let a=t.topTag;if(!a||a.toLowerCase()==="other")continue;let n=t.image?.[3]?.["#text"]||t.image?.[2]?.["#text"]||"",o=n?E(n,400):null;s[a]||(s[a]={name:a,count:0,artistImage:o}),s[a].count+=parseInt(t.playcount,10)||0,!s[a].artistImage&&o&&(s[a].artistImage=o)}return Object.values(s).sort((t,a)=>a.count-t.count).slice(0,6)}function F(e){if(!e?.length)return"";let i=a=>{let n=a.artistImage?`background: linear-gradient(rgba(30,50,140,0.7), rgba(30,50,140,0.7)), url('${l(a.artistImage)}'); background-size: cover; background-position: center;`:"background: linear-gradient(135deg, rgba(30,50,140,0.9), rgba(60,20,120,0.9));";return`
      <div class="genre-card" data-genre="${l(a.name)}" style="${n}" role="button" tabindex="0">
        <span class="genre-card-name">${l(a.name)}</span>
      </div>`},s=e.slice(0,3),t=e.slice(3,6);return`
    <div class="home-section-header">
      <div class="home-section-title">Genres for you</div>
    </div>
    <div class="genres-grid">
      <div class="genres-grid-row">${s.map(i).join("")}</div>
      <div class="genres-grid-row">${t.map(i).join("")}</div>
    </div>`}function C(e,i){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(m=>(m.type||"album").toLowerCase()!=="single"),a=s.filter(m=>(m.type||"").toLowerCase()==="single"),n=(i==="singles"?a:t).slice(0,3);if(!n.length)return'<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:14px">Geen releases gevonden.</div>';let[o,...h]=n,v=f(o.image||o.thumb,400),b=v?`<img src="${l(v)}" alt="${l(o.title||o.album||"")}" loading="lazy">`:'<div class="releases-main-ph">\u266B</div>',r=o.description||o.bio||"",d=`
    <div class="releases-main-card">
      ${b}
      <div class="releases-main-info">
        <div class="releases-main-artist">${l(o.artist||"\u2014")}</div>
        <div class="releases-main-title">${l(o.title||o.album||"\u2014")}</div>
        <div class="releases-main-date">${l(o.date||o.releaseDate||"")}</div>
        ${r?`<div class="releases-main-desc">${l(r)}</div>`:""}
        <div class="releases-plex-badge" id="plex-badge-0" style="display:none" title="Beschikbaar in Plex">Q</div>
      </div>
    </div>`,p=h.slice(0,2).map((m,k)=>{let w=f(m.image||m.thumb,160);return`
      <div class="releases-small-card">
        ${w?`<img src="${l(w)}" alt="${l(m.title||m.album||"")}" loading="lazy">`:'<div class="releases-small-ph">\u266B</div>'}
        <div class="releases-small-info">
          <div class="releases-small-artist">${l(m.artist||"\u2014")}</div>
          <div class="releases-small-title">${l(m.title||m.album||"\u2014")}</div>
          <div class="releases-small-date">${l(m.date||m.releaseDate||"")}</div>
          <div class="releases-plex-badge" id="plex-badge-${k+1}" style="display:none" title="Beschikbaar in Plex">Q</div>
        </div>
      </div>`}).join("");return`
    <div class="releases-preview">
      ${d}
      <div class="releases-stack">${p}</div>
    </div>`}function D(e,i="albums"){return`
    ${`
    <div class="home-section-header">
      <div class="home-section-title">New releases for you</div>
      <div class="home-tabs">
        <button class="home-tab home-tab--releases ${i==="albums"?"active":""}" data-releases-tab="albums">ALBUMS</button>
        <button class="home-tab home-tab--releases ${i==="singles"?"active":""}" data-releases-tab="singles">SINGLES</button>
      </div>
      <button class="home-more-btn" data-switch="ontdek">MORE</button>
    </div>`}
    <div id="releases-body">
      ${C(e,i)}
    </div>`}async function B(e,i){let s=e?.releases||(Array.isArray(e)?e:[]),t=s.filter(o=>(o.type||"album").toLowerCase()!=="single"),a=s.filter(o=>(o.type||"").toLowerCase()==="single"),n=(i==="singles"?a:t).slice(0,3);for(let o=0;o<n.length;o++){let h=n[o],v=h.title||h.album||h.artist;if(!v)continue;let b=document.getElementById(`plex-badge-${o}`);if(b)try{let r=await u(`/api/plex/search?q=${encodeURIComponent(v)}`);(r?.results?.length||r?.albums?.length||r?.artists?.length||Array.isArray(r)&&r.length>0)&&(b.style.display="inline-flex")}catch{}}}function U(e){let i=document.getElementById("home-donut-chart");!i||!window.Chart||(I&&(I.destroy(),I=null),I=new window.Chart(i,{type:"doughnut",data:{labels:e.map(s=>s.name),datasets:[{data:e.map(s=>s.count),backgroundColor:e.map(s=>s.color),borderWidth:0,hoverOffset:4}]},options:{cutout:"65%",plugins:{legend:{display:!1},tooltip:{callbacks:{label:s=>` ${s.label}: ${y(s.parsed)} plays`}}},animation:{duration:400}}}))}async function S(e){let i=document.getElementById("home-genres-legend");try{let t=((await u(`/api/top/artists?period=${e}`))?.topartists?.artist||[]).slice(0,8),a={};for(let r of t){let d=r.topTag||"Other",p=parseInt(r.playcount,10)||0;a[d]=(a[d]||0)+p}let n=Object.entries(a).sort((r,d)=>d[1]-r[1]),o=n.slice(0,6),h=n.slice(6).reduce((r,[,d])=>r+d,0);if(h>0){let r=o.findIndex(([d])=>d==="Other");r>=0?o[r][1]+=h:o.push(["Other",h])}let v=o.reduce((r,[,d])=>r+d,0)||1,b=o.map(([r,d],p)=>({name:r,count:d,pct:Math.round(d/v*100),color:T[p%T.length]}));i&&(i.innerHTML=b.map(r=>`
        <div class="home-genres-legend-item">
          <div class="home-genres-legend-dot" style="background:${r.color}"></div>
          <div class="home-genres-legend-name">${l(r.name)}</div>
        </div>`).join("")),U(b)}catch(s){console.warn("Genre chart mislukt:",s),i&&(i.innerHTML='<div style="color:var(--text-muted);font-size:13px">Geen genre-data</div>')}}function O(e){let i=(e?.topartists?.artist||[]).slice(0,4);if(!i.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=parseInt(i[0]?.playcount,10)||1;return i.map(t=>{let a=Math.round((parseInt(t.playcount,10)||0)/s*100),n=f(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72),o=n?`<img class="home-wylbt-artist-img" src="${l(n)}" alt="${l(t.name)}" loading="lazy">`:'<div class="home-wylbt-artist-ph">\u266A</div>';return`
      <div class="home-wylbt-artist-item" data-artist="${l(t.name)}">
        ${o}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${l(t.name)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${a}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${y(parseInt(t.playcount,10)||0)}</div>
      </div>`}).join("")}function W(e){let i={};for(let s of e?.toptracks?.track||[]){let t=s.album?.["#text"]||s.album?.name||null,a=s.artist?.name||s.artist?.["#text"]||s.artist||"";if(!t)continue;let n=`${t}|||${a}`;i[n]||(i[n]={album:t,artist:a,playcount:0,image:s.image}),i[n].playcount+=parseInt(s.playcount,10)||0}return Object.values(i).sort((s,t)=>t.playcount-s.playcount).slice(0,4)}function G(e){let i=W(e);if(!i.length)return'<div style="color:var(--text-muted);font-size:13px">Geen data</div>';let s=i[0]?.playcount||1;return i.map(t=>{let a=Math.round(t.playcount/s*100),n=f(t.image?.[2]?.["#text"]||t.image?.[1]?.["#text"],72);return`
      <div class="home-wylbt-release-item">
        ${n?`<img class="home-wylbt-release-img" src="${l(n)}" alt="${l(t.album)}" loading="lazy">`:'<div class="home-wylbt-release-ph">\u266B</div>'}
        <div class="home-wylbt-item-info">
          <div class="home-wylbt-item-name">${l(t.album)}</div>
          <div class="home-wylbt-item-sub">${l(t.artist)}</div>
          <div class="home-wylbt-bar-wrap">
            <div class="home-wylbt-bar-track">
              <div class="home-wylbt-bar-fill" style="width:${a}%"></div>
            </div>
          </div>
        </div>
        <div class="home-wylbt-item-count">${y(t.playcount)}</div>
      </div>`}).join("")}function X(e,i){return`
    <div class="home-wylbt-header">
      <div class="home-wylbt-title">What you've been listening to</div>
      <select class="home-stats-period" id="home-stats-period">
        <option value="7day"    selected>Last week</option>
        <option value="1month">Last month</option>
        <option value="3month">Last 3 months</option>
        <option value="12month">Last year</option>
        <option value="overall">All time</option>
      </select>
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
          <button class="home-more-btn" data-switch="bibliotheek">MORE</button>
        </div>
        <div id="home-wylbt-artists-list">
          ${O(e)}
        </div>
      </div>

      <!-- Blok 3: Top Releases -->
      <div class="home-wylbt-card">
        <div class="home-wylbt-card-header">
          <div class="home-wylbt-card-title">Your top releases</div>
          <button class="home-more-btn">MORE</button>
        </div>
        <div id="home-wylbt-releases-list">
          ${G(i)}
        </div>
      </div>

    </div>`}function Q(){let e=document.getElementById("home-recent-covers"),i=document.getElementById("home-recent-prev"),s=document.getElementById("home-recent-next");if(!e||!i||!s)return;let t=0,a=224;function n(){let o=Math.max(0,e.scrollWidth-e.parentElement.offsetWidth);t=Math.max(0,Math.min(t,o)),e.style.transform=`translateX(-${t}px)`,i.disabled=t<=0,s.disabled=t>=o}i.addEventListener("click",()=>{t=Math.max(0,t-a),n()}),s.addEventListener("click",()=>{t+=a,n()}),n()}async function J(e){let[i,s]=await Promise.all([u(`/api/topartists?period=${e}`).catch(()=>null),u(`/api/toptracks?period=${e}`).catch(()=>null)]),t=document.getElementById("home-wylbt-artists-list");t&&(t.innerHTML=O(i));let a=document.getElementById("home-wylbt-releases-list");a&&(a.innerHTML=G(s)),t?.querySelectorAll("[data-artist]").forEach(n=>{n.addEventListener("click",()=>L(n.dataset.artist))}),await S(e)}async function K(){if(M.user?.name)return M.user.name;try{let e=await u("/api/user");return e?.user?.name||e?.name||null}catch{return null}}function z(e){return e?e.artistCount!==void 0?e:e.library?z(e.library):e.stats?e.stats:e:{}}async function ne(){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="home-page">
      <div class="home-skeleton" style="height:120px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:200px;border-radius:12px"></div>
      <div class="home-skeleton" style="height:160px;border-radius:8px"></div>
      <div class="home-skeleton" style="height:240px;border-radius:8px"></div>
    </div>`;let[i,s,t,a,n,o,h]=await Promise.all([K().catch(()=>null),u("/api/plex/status").catch(()=>null),u("/api/recent").catch(()=>null),u("/api/wishlist").catch(()=>null),u("/api/topartists?period=7day").catch(()=>null),u("/api/toptracks?period=7day").catch(()=>null),u("/api/releases").catch(()=>null)]),v=z(s),b=t?.recenttracks?.track||[],r=a?.wishlist||a||[],d=h,p=Y(n);e.innerHTML=`
    <div class="home-page">

      <!-- 1. Greeting + Stats -->
      ${j(i,v)}

      <!-- 2. Recent Activity -->
      ${_(b)}

      <!-- 3. Listen Later -->
      <div>${q(r)}</div>

      <!-- 3b. Recent Artists -->
      <div>${P(n)}</div>

      <!-- 4. Daily Mixes -->
      <div>${V(n)}</div>

      <!-- 4b. Genres for you -->
      <div id="home-genres-section">${F(p)}</div>

      <!-- 5. New Releases -->
      <div id="home-releases-section">${D(d)}</div>

      <!-- 6. Listening Stats -->
      <div id="home-stats-section">
        ${X(n,o)}
      </div>

    </div>`,Q(),S("7day"),e.querySelectorAll("[data-switch]").forEach(c=>{c.addEventListener("click",()=>x(c.dataset.switch))}),e.querySelectorAll("#home-wylbt-artists-list [data-artist]").forEach(c=>{c.addEventListener("click",()=>L(c.dataset.artist))}),document.getElementById("home-recent-more")?.addEventListener("click",()=>{x("bibliotheek")}),e.querySelectorAll(".genre-card").forEach(c=>{c.addEventListener("click",()=>x("ontdek")),c.addEventListener("keydown",g=>{(g.key==="Enter"||g.key===" ")&&x("ontdek")})});let m="albums";e.querySelectorAll("[data-releases-tab]").forEach(c=>{c.addEventListener("click",()=>{m=c.dataset.releasesTab,e.querySelectorAll("[data-releases-tab]").forEach($=>$.classList.toggle("active",$===c));let g=document.getElementById("releases-body");g&&(g.innerHTML=C(d,m),B(d,m))})});let k="played";e.querySelectorAll("[data-recent-tab]").forEach(c=>{c.addEventListener("click",async()=>{e.querySelectorAll("[data-recent-tab]").forEach($=>$.classList.toggle("active",$===c)),k=c.dataset.recentTab;let g=document.getElementById("home-recent-covers");if(g)if(k==="loved")try{let H=(await u("/api/loved"))?.lovedtracks?.track||[];g.innerHTML=A(H.map(R=>({...R,image:R.image})))}catch{}else g.innerHTML=A(b)})}),document.getElementById("home-stats-period")?.addEventListener("change",async c=>{await J(c.target.value)}),e.querySelectorAll(".home-artist-circle-item").forEach(c=>{c.addEventListener("click",()=>{let g=c.dataset.artist;g&&L(g)})});let w=document.getElementById("home-recent-artists");w&&(document.getElementById("home-artists-prev")?.addEventListener("click",()=>{w.scrollBy({left:-256,behavior:"smooth"})}),document.getElementById("home-artists-next")?.addEventListener("click",()=>{w.scrollBy({left:256,behavior:"smooth"})})),N(n),B(d,m)}export{ne as loadHome};
