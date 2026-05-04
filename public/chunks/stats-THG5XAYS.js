import{a as I}from"./chunk-XRQN57E4.js";import{d as M,f as j,g as n,h as d,j as T,x as c}from"./chunk-OJFTIB2W.js";import"./chunk-2BMKGNH5.js";var z=null;function Z(){return z||(z=new Promise((t,s)=>{if(window.Chart){t(window.Chart);return}let e=document.createElement("script");e.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",e.onload=()=>t(window.Chart),e.onerror=()=>s(new Error("Chart.js laden mislukt")),document.head.appendChild(e)})),z}var g={};function x(t){g[t]&&(g[t].destroy(),delete g[t])}function K(){Object.keys(g).forEach(x)}var f="1month",E=[{key:"7day",label:"7 Dagen"},{key:"1month",label:"30 Dagen"},{key:"3month",label:"3 Maanden"},{key:"12month",label:"12 Maanden"},{key:"overall",label:"All Time"}];function b(t,s=""){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()||s}function A(){return{accent:b("--accent","#7c3aed"),accentMuted:b("--accent-muted","rgba(124,58,237,0.12)"),text:b("--text","#1a1a1a"),textMuted:b("--text-secondary","#888"),border:b("--border","#e5e5e5"),surface:b("--surface2","#f8f8f8")}}var h=["#7c3aed","#2563eb","#0891b2","#059669","#ca8a04","#ea580c","#dc2626","#9333ea","#0284c7","#16a34a","#d97706","#e11d48"];function N(t){return t>=8760?`${Math.round(t/8760)} jaar`:t>=720?`${Math.round(t/720)} mnd`:t>=24?`${Math.round(t/24)} dgn`:`${t} uur`}function Q(t,s=40){let e=t.thumb||t.image||null;return e?M(e,s):null}function U(t,s=64){let e=Q(t,s),i=T(t.name||""),o=j(t.name||"?");return`${e?`<img src="${e}" alt="${d(t.name)}" class="stats-bubble-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:""}<div class="stats-bubble-ph" style="${e?"display:none;":""}background:${i};width:${s}px;height:${s}px">${o}</div>`}function X(t,s=44){let e=t.image?M(t.image,s):null,i=T(t.name||t.album||""),o=j(t.name||t.album||"?");return e?`<img class="stats-cover" src="${e}" alt="${d(t.name)}" loading="lazy" width="${s}" height="${s}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="stats-cover-ph" style="display:none;background:${i};width:${s}px;height:${s}px">${o}</div>`:`<div class="stats-cover-ph" style="background:${i};width:${s}px;height:${s}px">${o}</div>`}function Y(){return`
    <div class="stats-skeletons">
      <div class="stats-overview-row">
        ${[1,2,3,4].map(()=>'<div class="stats-card skeleton-pulse" style="height:96px;border-radius:12px"></div>').join("")}
      </div>
      <div class="stats-charts-row">
        <div class="stats-chart-card skeleton-pulse" style="height:280px"></div>
        <div class="stats-chart-card skeleton-pulse" style="height:280px"></div>
      </div>
      <div class="stats-section-card skeleton-pulse" style="height:140px"></div>
    </div>
  `}function tt(t){return`
    <div class="stats-overview-row">
      ${[{icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',label:"Totaal Plays",value:n(t.totalPlays||0),sub:"lifetime scrobbles",color:"#7c3aed"},{icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',label:"Luistertijd",value:N(t.listeningHours||0),sub:`\u2248 ${n(t.listeningHours||0)} uur`,color:"#2563eb"},{icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',label:"Artiesten",value:n(t.uniqueArtists||t.plexArtists||0),sub:"in je bibliotheek",color:"#059669"},{icon:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',label:"Tracks in Plex",value:n(t.plexLibrarySize||t.uniqueTracks||0),sub:`${n(t.plexAlbums||t.uniqueAlbums||0)} albums`,color:"#ca8a04"}].map(e=>`
        <div class="stats-overview-card" style="--card-accent:${e.color}">
          <div class="stats-ov-icon" style="color:${e.color}">${e.icon}</div>
          <div class="stats-ov-body">
            <div class="stats-ov-value">${e.value}</div>
            <div class="stats-ov-label">${d(e.label)}</div>
            <div class="stats-ov-sub">${d(e.sub)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `}function st(t){let s=A(),e=document.getElementById("stats-timeline-canvas");e&&(x("timeline"),g.timeline=new Chart(e,{type:"bar",data:{labels:t.labels||[],datasets:[{label:"Plays",data:t.values||[],backgroundColor:s.accent,borderRadius:2,borderSkipped:!1}]},options:{responsive:!0,maintainAspectRatio:!1,animation:{duration:600},plugins:{legend:{display:!1},tooltip:{backgroundColor:s.surface,titleColor:s.text,bodyColor:s.textMuted,borderColor:s.border,borderWidth:1,padding:10,callbacks:{label:i=>` ${n(i.parsed.y)} plays`}}},scales:{x:{ticks:{color:s.textMuted,font:{size:11},maxRotation:45,autoSkip:!0,maxTicksLimit:16},grid:{color:s.border}},y:{beginAtZero:!0,ticks:{color:s.textMuted,font:{size:11},precision:0},grid:{color:s.border}}}}}))}function et(t){let s=A(),e=document.getElementById("stats-genre-canvas");if(!e||!t?.labels?.length){e&&(e.closest(".stats-donut-canvas-wrap").innerHTML='<div class="stats-empty-msg">Geen genres.</div>');return}x("genre"),g.genre=new Chart(e,{type:"doughnut",data:{labels:t.labels,datasets:[{data:t.values,backgroundColor:h,borderWidth:0,hoverOffset:8}]},options:{responsive:!0,maintainAspectRatio:!1,animation:{duration:600},cutout:"65%",plugins:{legend:{display:!1},tooltip:{backgroundColor:s.surface,titleColor:s.text,bodyColor:s.textMuted,borderColor:s.border,borderWidth:1,padding:10,callbacks:{label:o=>{let r=o.dataset.data.reduce((v,y)=>v+y,0),l=r>0?Math.round(o.parsed/r*100):0;return` ${n(o.parsed)} plays (${l}%)`}}}}}});let i=document.getElementById("stats-genre-legend");if(i){let o=t.values.reduce((r,l)=>r+l,0);i.innerHTML=t.labels.map((r,l)=>{let v=o>0?Math.round(t.values[l]/o*100):0;return`
        <div class="stats-genre-legend-item">
          <span class="stats-legend-dot" style="background:${h[l%h.length]}"></span>
          <span class="stats-legend-label" title="${d(r)}">${d(r)}</span>
          <span class="stats-legend-pct">${v}%</span>
        </div>`}).join("")}}function at(t){let s=document.getElementById("stats-formats-canvas");if(!s||!t?.labels?.length)return;x("formats");let e=t.total||t.values.reduce((r,l)=>r+l,0)||1,i=A();g.formats=new Chart(s,{type:"bar",data:{labels:["Bibliotheek"],datasets:t.labels.map((r,l)=>({label:r,data:[t.values[l]],backgroundColor:h[l%h.length],borderWidth:0,borderSkipped:!1}))},options:{indexAxis:"y",responsive:!0,maintainAspectRatio:!1,animation:{duration:600},plugins:{legend:{display:!1},tooltip:{backgroundColor:i.surface,titleColor:i.text,bodyColor:i.textMuted,borderColor:i.border,borderWidth:1,padding:10,callbacks:{label:r=>{let l=Math.round(r.parsed.x/e*100);return` ${r.dataset.label}: ${n(r.parsed.x)} (${l}%)`}}}},scales:{x:{stacked:!0,display:!1,grid:{display:!1}},y:{stacked:!0,display:!1,grid:{display:!1}}}}});let o=document.getElementById("stats-formats-legend");o&&(o.innerHTML=t.labels.map((r,l)=>{let v=Math.round(t.values[l]/e*100);return`
        <div class="stats-format-item">
          <span class="stats-legend-dot" style="background:${h[l%h.length]}"></span>
          <span class="stats-format-label">${d(r)}</span>
          <span class="stats-format-count">${n(t.values[l])}</span>
          <span class="stats-format-pct">${v}%</span>
        </div>`}).join(""))}function it(t){let s=document.getElementById("stats-enrich-canvas");if(!s)return;x("enrich");let e=Math.round((t.enrichmentCoverage||0)*100),i=100-e,o=A();g.enrich=new Chart(s,{type:"doughnut",data:{datasets:[{data:[e,i],backgroundColor:[h[3],o.border],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,animation:{duration:600},cutout:"72%",plugins:{legend:{display:!1},tooltip:{enabled:!1}}}});let r=document.getElementById("stats-enrich-pct");r&&(r.textContent=`${e}%`)}function rt(t){return t?.length?`
    <div class="stats-artists-scroll">
      ${t.slice(0,20).map((s,e)=>`
        <button class="stats-artist-bubble" data-artist="${d(s.name)}" title="${d(s.name)} \u2014 ${n(s.playcount)} plays">
          <div class="stats-bubble-img-wrap">
            ${U(s,64)}
            <span class="stats-bubble-rank">${e+1}</span>
          </div>
          <div class="stats-bubble-name">${d(s.name)}</div>
          <div class="stats-bubble-plays">${n(s.playcount)}</div>
        </button>
      `).join("")}
    </div>`:'<div class="stats-empty-msg">Geen data beschikbaar voor deze periode.</div>'}function nt(t){return t?.length?`
    <ol class="stats-ranked-list">
      ${t.slice(0,10).map((s,e)=>`
        <li class="stats-ranked-item">
          <span class="stats-rank-num">${e+1}</span>
          <div class="stats-cover-wrap">${X(s,44)}</div>
          <div class="stats-ranked-info">
            <div class="stats-ranked-title">${d(s.name)}</div>
            <div class="stats-ranked-sub">${d(s.artist)}</div>
          </div>
          <span class="stats-ranked-count">${n(s.playcount)}</span>
        </li>
      `).join("")}
    </ol>`:'<div class="stats-empty-msg">Geen albums beschikbaar.</div>'}function lt(t){return t?.length?`
    <ol class="stats-ranked-list">
      ${t.slice(0,10).map((s,e)=>`
        <li class="stats-ranked-item">
          <span class="stats-rank-num">${e+1}</span>
          <div class="stats-ranked-info" style="padding-left:4px">
            <div class="stats-ranked-title">${d(s.name)}</div>
            <div class="stats-ranked-sub">${d(s.artist)}${s.album?` \xB7 ${d(s.album)}`:""}</div>
          </div>
          <span class="stats-ranked-count">${n(s.playcount)}</span>
        </li>
      `).join("")}
    </ol>`:'<div class="stats-empty-msg">Geen tracks beschikbaar.</div>'}function ot(t){let s=Math.round((t.enrichmentCoverage||0)*100),e=[{icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',label:"Ontbrekende Covers",value:n(t.missingCovers||0),color:(t.missingCovers||0)>50?"#ea580c":"#16a34a"},{icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',label:"Geen Genre",value:n(t.missingGenres||0),color:(t.missingGenres||0)>100?"#ca8a04":"#16a34a"},{icon:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',label:"Incomplete Albums",value:n(t.incompleteAlbums||0),color:(t.incompleteAlbums||0)>50?"#ca8a04":"#16a34a"}];return`
    <div class="stats-health-grid">
      <!-- Format breakdown -->
      <div class="stats-health-card stats-health-formats">
        <div class="stats-subsection-head">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Audio Formaten
        </div>
        <div class="stats-formats-bar-wrap">
          <canvas id="stats-formats-canvas" height="30"></canvas>
        </div>
        <div class="stats-formats-legend" id="stats-formats-legend">
          <div class="stats-empty-msg">Formaten laden\u2026</div>
        </div>
      </div>

      <!-- Enrichment ring -->
      <div class="stats-health-card stats-health-enrich">
        <div class="stats-subsection-head">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Metadata Dekking
        </div>
        <div class="stats-enrich-ring-wrap">
          <div class="stats-enrich-ring">
            <canvas id="stats-enrich-canvas" width="80" height="80"></canvas>
            <div class="stats-enrich-label" id="stats-enrich-pct">${s}%</div>
          </div>
          <div class="stats-enrich-detail">
            <div class="stats-enrich-row"><span>Albums met cover</span><strong>${n(t.coveredAlbums||0)} / ${n(t.totalAlbums||0)}</strong></div>
            <div class="stats-enrich-row"><span>Totaal tracks</span><strong>${n(t.totalTracks||0)}</strong></div>
            <div class="stats-enrich-row"><span>Artiesten</span><strong>${n(t.totalArtists||0)}</strong></div>
          </div>
        </div>
      </div>

      <!-- Issue cards -->
      <div class="stats-health-issues">
        ${e.map(i=>`
          <div class="stats-issue-card">
            <div class="stats-issue-icon" style="color:${i.color}">${i.icon}</div>
            <div class="stats-issue-body">
              <div class="stats-issue-value" style="color:${i.color}">${i.value}</div>
              <div class="stats-issue-label">${d(i.label)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>`}async function B(t){let s=document.getElementById("content");if(!s)return;s.innerHTML=`
    <div class="stats-view">
      <div class="stats-header">
        <h1 class="stats-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Luisterstatistieken
        </h1>
        <div class="stats-period-tabs" role="tablist">
          ${E.map(a=>`
            <button class="stats-period-tab ${a.key===t?"active":""}" data-period="${a.key}" role="tab" aria-selected="${a.key===t}">${d(a.label)}</button>
          `).join("")}
        </div>
      </div>
      ${Y()}
    </div>`,s.querySelectorAll(".stats-period-tab").forEach(a=>{a.addEventListener("click",()=>{a.dataset.period!==f&&(f=a.dataset.period,B(f))})});let[e,i,o,r,l,v,y]=await Promise.allSettled([c(`/api/core/stats?range=${t}`),c(`/api/core/stats/timeline?range=${t}`),c(`/api/core/stats/genres?range=${t}`),c(`/api/core/stats/top/artists?range=${t}&limit=20`),c(`/api/core/stats/top/albums?range=${t}&limit=10`),c(`/api/core/stats/top/tracks?range=${t}&limit=10`),c("/api/stats/library-health")]),R=e.status==="fulfilled"?e.value:null,V=i.status==="fulfilled"?i.value:null,q=o.status==="fulfilled"?o.value:null,P=r.status==="fulfilled"?r.value:null,O=l.status==="fulfilled"?l.value:null,F=v.status==="fulfilled"?v.value:null,w=y.status==="fulfilled"?y.value:null,u=null;if(!R&&!P)try{let[a,m,L,S,G,D]=await Promise.allSettled([c("/api/stats/overview"),c(`/api/stats/top-artists?period=${t}&limit=20`),c(`/api/stats/timeline?period=${t}`),c(`/api/stats/genres?period=${t}`),c(`/api/stats/top-albums?period=${t}&limit=10`),c(`/api/stats/top-tracks?period=${t}&limit=10`)]);u={overview:a.status==="fulfilled"?a.value:null,topArtists:m.status==="fulfilled"?m.value?.artists||[]:[],timeline:L.status==="fulfilled"?L.value:null,genres:S.status==="fulfilled"?S.value:null,topAlbums:G.status==="fulfilled"?G.value?.albums||[]:[],topTracks:D.status==="fulfilled"?D.value?.tracks||[]:[]}}catch{try{u={_plex:await c(`/api/plex/stats?period=${t}`)}}catch{}}let k=s.querySelector(".stats-view");if(!k)return;let p=u?._plex,H=R||u?.overview||(p?{totalPlays:p.totalPlays||0,listeningHours:Math.round((p.totalPlays||0)*3.5/60),uniqueArtists:0,plexLibrarySize:0,plexAlbums:0,plexArtists:0}:null),W=P?.artists||u?.topArtists||[],_=O?.albums||u?.topAlbums||[],J=F?.tracks||u?.topTracks||[],$=V||u?.timeline||(p?.dailyPlays?{labels:[...p.dailyPlays].sort((a,m)=>a.date.localeCompare(m.date)).map(a=>a.date.slice(5)),values:[...p.dailyPlays].sort((a,m)=>a.date.localeCompare(m.date)).map(a=>a.count),totalPlays:p.totalPlays}:null),C=q||u?.genres||(p?.genres?{labels:(p.genres||[]).map(a=>a.name),values:(p.genres||[]).map(a=>a.count||1)}:null);k.innerHTML=`
    <!-- Header -->
    <div class="stats-header">
      <h1 class="stats-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        Luisterstatistieken
      </h1>
      <div class="stats-period-tabs" role="tablist">
        ${E.map(a=>`
          <button class="stats-period-tab ${a.key===t?"active":""}" data-period="${a.key}" role="tab" aria-selected="${a.key===t}">${d(a.label)}</button>
        `).join("")}
      </div>
    </div>

    <!-- Rij 1: Overview Cards -->
    ${H?tt(H):""}

    <!-- Rij 2: Timeline + Genre Donut -->
    <div class="stats-charts-row">
      <div class="stats-chart-card stats-chart-timeline">
        <div class="stats-chart-head">
          <span class="stats-chart-title">Plays over Tijd</span>
          <span class="stats-chart-sub">${$?.totalPlays!=null?n($.totalPlays)+" plays":""}</span>
        </div>
        <div class="stats-canvas-wrap" style="height:240px">
          <canvas id="stats-timeline-canvas"></canvas>
        </div>
      </div>
      <div class="stats-chart-card stats-chart-genres">
        <div class="stats-chart-head">
          <span class="stats-chart-title">Genres</span>
          <span class="stats-chart-sub">${C?.labels?.length?C.labels.length+" genres":""}</span>
        </div>
        <div class="stats-donut-wrap">
          <div class="stats-donut-canvas-wrap">
            <canvas id="stats-genre-canvas"></canvas>
          </div>
          <div class="stats-genre-legend" id="stats-genre-legend"></div>
        </div>
      </div>
    </div>

    <!-- Rij 3: Top Artiesten -->
    <div class="stats-section-card">
      <div class="stats-section-head">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        Top Artiesten
        <span class="stats-section-period">${E.find(a=>a.key===t)?.label||t}</span>
      </div>
      ${rt(W)}
    </div>

    <!-- Rij 4: Top Albums + Top Tracks -->
    <div class="stats-lists-row">
      <div class="stats-section-card">
        <div class="stats-section-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
          Top Albums
        </div>
        ${nt(_)}
      </div>
      <div class="stats-section-card">
        <div class="stats-section-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          Top Tracks
        </div>
        ${lt(J)}
      </div>
    </div>

    <!-- Rij 5: Library Health -->
    <div class="stats-section-card">
      <div class="stats-section-head">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Bibliotheek Gezondheid
      </div>
      ${w?ot(w):'<div class="stats-empty-msg">Geen gezondheidsdata beschikbaar.</div>'}
    </div>
  `,k.querySelectorAll(".stats-period-tab").forEach(a=>{a.addEventListener("click",()=>{a.dataset.period!==f&&(f=a.dataset.period,B(f))})}),k.querySelectorAll(".stats-artist-bubble[data-artist]").forEach(a=>{a.addEventListener("click",()=>I("artist-detail",{name:a.dataset.artist}))}),requestAnimationFrame(async()=>{try{await Z()}catch(a){console.warn("[stats] Chart.js laden mislukt:",a);return}$?.labels?.length&&st($),C?.labels?.length&&et(C);try{let a=await c("/api/stats/formats");a?.labels?.length&&at(a)}catch{}w&&it(w)})}function dt(){if(document.getElementById("stats-view-styles"))return;let t=document.createElement("style");t.id="stats-view-styles",t.textContent=`
    /* \u2500\u2500 Stats View Container \u2500\u2500 */
    .stats-view { padding: 20px 24px; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }

    /* \u2500\u2500 Header \u2500\u2500 */
    .stats-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-bottom: 4px; }
    .stats-title  { display: flex; align-items: center; gap: 8px; font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text); }

    /* \u2500\u2500 Period tabs \u2500\u2500 */
    .stats-period-tabs { display: flex; gap: 3px; background: var(--surface2, #f3f3f3); border-radius: 9px; padding: 3px; }
    .stats-period-tab  { border: none; background: transparent; color: var(--text-secondary); padding: 5px 11px; border-radius: 7px; font-size: .8rem; font-weight: 500; cursor: pointer; transition: all .15s; white-space: nowrap; }
    .stats-period-tab.active { background: var(--surface, #fff); color: var(--accent); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .stats-period-tab:hover:not(.active) { color: var(--text); }

    /* \u2500\u2500 Overview cards (Rij 1) \u2500\u2500 */
    .stats-overview-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stats-overview-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; transition: box-shadow .15s; }
    .stats-overview-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
    .stats-ov-icon  { flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--card-accent, #7c3aed) 12%, transparent); }
    .stats-ov-body  { min-width: 0; }
    .stats-ov-value { font-size: 1.3rem; font-weight: 700; color: var(--text); line-height: 1.2; }
    .stats-ov-label { font-size: .75rem; font-weight: 600; color: var(--text-secondary); margin-top: 2px; }
    .stats-ov-sub   { font-size: .7rem; color: var(--text-secondary); opacity: .7; }

    /* \u2500\u2500 Charts row (Rij 2) \u2500\u2500 */
    .stats-charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; }
    .stats-chart-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .stats-chart-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .stats-chart-title { font-size: .88rem; font-weight: 600; color: var(--text); }
    .stats-chart-sub   { font-size: .75rem; color: var(--text-secondary); }
    .stats-canvas-wrap { position: relative; }
    .stats-canvas-wrap canvas { width: 100% !important; }

    /* \u2500\u2500 Genre donut \u2500\u2500 */
    .stats-donut-wrap        { display: flex; align-items: flex-start; gap: 14px; min-height: 220px; }
    .stats-donut-canvas-wrap { flex-shrink: 0; width: 120px; height: 120px; margin-top: 10px; }
    .stats-genre-legend      { flex: 1; overflow-y: auto; max-height: 230px; display: flex; flex-direction: column; gap: 5px; }
    .stats-genre-legend-item { display: flex; align-items: center; gap: 6px; font-size: .77rem; }
    .stats-legend-dot        { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
    .stats-legend-label      { flex: 1; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-legend-pct        { color: var(--text-secondary); font-size: .7rem; }

    /* \u2500\u2500 Section cards \u2500\u2500 */
    .stats-section-card { background: var(--surface, #fff); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
    .stats-section-head { display: flex; align-items: center; gap: 7px; font-size: .85rem; font-weight: 600; color: var(--text); margin-bottom: 14px; }
    .stats-section-period { margin-left: auto; font-size: .73rem; font-weight: 400; color: var(--text-secondary); background: var(--surface2); padding: 2px 8px; border-radius: 20px; }
    .stats-subsection-head { display: flex; align-items: center; gap: 6px; font-size: .78rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }

    /* \u2500\u2500 Top Artiesten bubbels (Rij 3) \u2500\u2500 */
    .stats-artists-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: thin; }
    .stats-artist-bubble  { display: flex; flex-direction: column; align-items: center; gap: 5px; background: none; border: none; cursor: pointer; padding: 8px; border-radius: 10px; min-width: 74px; max-width: 74px; text-align: center; transition: background .15s; }
    .stats-artist-bubble:hover { background: var(--surface2, #f3f3f3); }
    .stats-bubble-img-wrap { position: relative; width: 64px; height: 64px; }
    .stats-bubble-img  { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
    .stats-bubble-ph   { border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 700; color: #fff; }
    .stats-bubble-rank { position: absolute; bottom: 0; right: 0; background: var(--accent); color: #fff; font-size: .58rem; font-weight: 700; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stats-bubble-name  { font-size: .7rem; font-weight: 600; color: var(--text); max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-bubble-plays { font-size: .65rem; color: var(--text-secondary); }

    /* \u2500\u2500 Ranked lists (Rij 4) \u2500\u2500 */
    .stats-lists-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .stats-ranked-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
    .stats-ranked-item { display: flex; align-items: center; gap: 10px; }
    .stats-rank-num    { font-size: .72rem; font-weight: 700; color: var(--text-secondary); min-width: 16px; text-align: right; }
    .stats-cover-wrap  { flex-shrink: 0; display: flex; }
    .stats-cover       { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }
    .stats-cover-ph    { border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: .7rem; font-weight: 700; color: #fff; }
    .stats-ranked-info { flex: 1; min-width: 0; }
    .stats-ranked-title{ font-size: .82rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stats-ranked-sub  { font-size: .72rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
    .stats-ranked-count{ font-size: .73rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; }

    /* \u2500\u2500 Library Health (Rij 5) \u2500\u2500 */
    .stats-health-grid    { display: grid; grid-template-columns: 1.6fr 1fr auto; gap: 14px; align-items: start; }
    .stats-health-card    { background: var(--surface2, #f8f8f8); border-radius: 10px; padding: 14px; }
    .stats-formats-bar-wrap { margin: 8px 0 6px; height: 30px; position: relative; }
    .stats-formats-bar-wrap canvas { width: 100% !important; height: 30px !important; position: absolute; inset: 0; }
    .stats-formats-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 4px; }
    .stats-format-item    { display: flex; align-items: center; gap: 5px; font-size: .72rem; }
    .stats-format-label   { color: var(--text); font-weight: 500; }
    .stats-format-count   { color: var(--text-secondary); }
    .stats-format-pct     { color: var(--text-secondary); opacity: .7; }

    .stats-health-enrich  { }
    .stats-enrich-ring-wrap { display: flex; align-items: center; gap: 14px; margin-top: 8px; }
    .stats-enrich-ring      { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
    .stats-enrich-ring canvas { width: 80px !important; height: 80px !important; }
    .stats-enrich-label  { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: .88rem; font-weight: 700; color: var(--text); pointer-events: none; }
    .stats-enrich-detail { display: flex; flex-direction: column; gap: 5px; flex: 1; }
    .stats-enrich-row    { display: flex; justify-content: space-between; gap: 8px; font-size: .72rem; color: var(--text-secondary); }
    .stats-enrich-row strong { color: var(--text); font-weight: 600; }

    .stats-health-issues { display: flex; flex-direction: column; gap: 8px; min-width: 160px; }
    .stats-issue-card    { background: var(--surface2, #f8f8f8); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
    .stats-issue-icon    { flex-shrink: 0; }
    .stats-issue-body    { min-width: 0; }
    .stats-issue-value   { font-size: 1.1rem; font-weight: 700; line-height: 1.1; }
    .stats-issue-label   { font-size: .7rem; color: var(--text-secondary); margin-top: 1px; }

    /* \u2500\u2500 Misc \u2500\u2500 */
    .stats-empty-msg { color: var(--text-secondary); font-size: .83rem; padding: 12px 0; }
    .stats-skeletons { display: flex; flex-direction: column; gap: 14px; }

    /* \u2500\u2500 Responsive \u2500\u2500 */
    @media (max-width: 1024px) {
      .stats-health-grid { grid-template-columns: 1fr 1fr; }
      .stats-health-issues { flex-direction: row; flex-wrap: wrap; }
      .stats-issue-card { flex: 1; min-width: 120px; }
    }
    @media (max-width: 860px) {
      .stats-overview-row { grid-template-columns: 1fr 1fr; }
      .stats-charts-row   { grid-template-columns: 1fr; }
      .stats-lists-row    { grid-template-columns: 1fr; }
      .stats-health-grid  { grid-template-columns: 1fr; }
    }
    @media (max-width: 520px) {
      .stats-overview-row { grid-template-columns: 1fr; }
      .stats-view { padding: 12px; }
      .stats-period-tabs { flex-wrap: wrap; }
    }
  `,document.head.appendChild(t)}async function vt(){K(),dt(),document.title="Muziek \xB7 Statistieken",await B(f)}export{vt as loadStats};
