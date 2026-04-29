import{d as h,h as d,z as k}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var u=null,v=null,m="1month",$=[{key:"7day",label:"7 dagen"},{key:"1month",label:"1 maand"},{key:"3month",label:"3 maanden"},{key:"12month",label:"12 maanden"},{key:"overall",label:"Alles"}];function f(t){return t==null||isNaN(t)?"\u2014":Number(t).toLocaleString("nl-NL")}function x(t){return t?new Date(t).toLocaleDateString("nl-NL",{day:"numeric",month:"short"}):"\u2014"}function l(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()}function S(t){if(!t||t.length===0)return 0;let s=t.filter(n=>n.count>0);if(s.length===0)return 0;let a=s.reduce((n,e)=>n+e.count,0);return Math.round(a/s.length)}function w(t){return!t||t.length===0?null:t.reduce((s,a)=>a.count>(s?.count??0)?a:s,null)}function A(t){if(!t||t.length===0)return 0;let s=[...t].sort((e,o)=>e.date.localeCompare(o.date)),a=0,n=0;for(let e of s)e.count>0?(n++,a=Math.max(a,n)):n=0;return a}function L(){u&&(u.destroy(),u=null),v&&(v.destroy(),v=null)}function M(){return`
    <div class="stats-skeleton">
      <div class="stats-skeleton-cards">
        ${[1,2,3,4].map(()=>'<div class="stats-skel-card skeleton-pulse"></div>').join("")}
      </div>
      <div class="stats-skeleton-charts">
        <div class="stats-skel-chart skeleton-pulse"></div>
        <div class="stats-skel-chart skeleton-pulse"></div>
      </div>
    </div>
  `}function j(t){let{totalPlays:s,dailyPlays:a}=t,n=S(a),e=w(a),o=A(a);return`
    <div class="stats-summary-grid">
      ${[{icon:"\u{1F3B5}",label:"Totaal plays",value:f(s),sub:"in geselecteerde periode"},{icon:"\u{1F4CA}",label:"Gem. per actieve dag",value:f(n),sub:"plays per dag"},{icon:"\u{1F525}",label:"Meest actieve dag",value:e?f(e.count):"\u2014",sub:e?x(e.date):"geen data"},{icon:"\u26A1",label:"Langste streak",value:o>0?`${o}d`:"\u2014",sub:"aaneengesloten dagen"}].map(i=>`
        <div class="stats-summary-card">
          <div class="stats-summary-icon">${i.icon}</div>
          <div class="stats-summary-body">
            <div class="stats-summary-value">${i.value}</div>
            <div class="stats-summary-label">${d(i.label)}</div>
            <div class="stats-summary-sub">${d(i.sub)}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `}function T(t){let s=[...t].sort((r,g)=>r.date.localeCompare(g.date)),a=s.map(r=>x(r.date)),n=s.map(r=>r.count),e=l("--accent")||"#7c3aed",o=l("--accent-muted")||"rgba(124,58,237,0.10)",c=l("--text-secondary")||"#666",i=l("--border")||"#e5e5e5",b=l("--text")||"#1a1a1a",p=document.getElementById("stats-line-canvas");p&&(u&&(u.destroy(),u=null),u=new Chart(p,{type:"line",data:{labels:a,datasets:[{label:"Plays per dag",data:n,fill:!0,tension:.4,borderColor:e,backgroundColor:o,pointBackgroundColor:e,pointRadius:3,pointHoverRadius:5,borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!1},tooltip:{backgroundColor:l("--surface2")||"#f8f8f8",titleColor:b,bodyColor:c,borderColor:i,borderWidth:1,padding:10,callbacks:{label:r=>` ${r.parsed.y} plays`}}},scales:{x:{ticks:{color:c,font:{size:11},maxRotation:45,autoSkip:!0,maxTicksLimit:10},grid:{color:i,drawBorder:!1}},y:{beginAtZero:!0,ticks:{color:c,font:{size:11},precision:0},grid:{color:i,drawBorder:!1}}}}}))}function E(t){let s=(t||[]).slice(0,10),a=s.map(r=>r.name),n=s.map(r=>r.playcount||0),e=l("--accent")||"#7c3aed",o=l("--text-secondary")||"#666",c=l("--border")||"#e5e5e5",i=l("--text")||"#1a1a1a",b=s.map((r,g)=>{let C=1-g/s.length*.5;return e.startsWith("#")?B(e,C):e}),p=document.getElementById("stats-bar-canvas");p&&(v&&(v.destroy(),v=null),v=new Chart(p,{type:"bar",data:{labels:a,datasets:[{label:"Plays",data:n,backgroundColor:b,borderRadius:3,borderSkipped:!1}]},options:{indexAxis:"y",responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:l("--surface2")||"#f8f8f8",titleColor:i,bodyColor:o,borderColor:c,borderWidth:1,padding:10,callbacks:{label:r=>` ${f(r.parsed.x)} plays`}}},scales:{x:{beginAtZero:!0,ticks:{color:o,font:{size:11},precision:0},grid:{color:c}},y:{ticks:{color:i,font:{size:12,weight:"500"}},grid:{display:!1}}}}}))}function B(t,s){let a=parseInt(t.slice(1,3),16),n=parseInt(t.slice(3,5),16),e=parseInt(t.slice(5,7),16);return`rgba(${a},${n},${e},${s})`}function D(t){let s=(t||[]).slice(0,10);if(s.length===0)return'<div class="stats-empty">Geen artiesten gevonden voor deze periode.</div>';let a=Math.max(...s.map(n=>n.playcount||0),1);return`
    <ol class="stats-artist-list">
      ${s.map((n,e)=>{let o=Math.round((n.playcount||0)/a*100),c=h(n.thumb,40),i=c?`<img class="stats-artist-thumb" src="${c}" alt="${d(n.name)}" loading="lazy">`:`<div class="stats-artist-ph" style="background:${z(n.name)}">${I(n.name)}</div>`;return`
          <li class="stats-artist-row">
            <span class="stats-artist-rank">${e+1}</span>
            ${i}
            <div class="stats-artist-info">
              <div class="stats-artist-name">${d(n.name)}</div>
              <div class="stats-artist-bar-wrap">
                <div class="stats-artist-bar" style="width:${o}%"></div>
              </div>
            </div>
            <span class="stats-artist-count">${f(n.playcount)}</span>
          </li>
        `}).join("")}
    </ol>
  `}function I(t){return t?t.split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase():"?"}function z(t){let s=0;for(let n=0;n<(t||"").length;n++)s=s*31+t.charCodeAt(n)&4294967295;let a=Math.abs(s)%360;return`linear-gradient(135deg, hsl(${a},50%,40%), hsl(${(a+40)%360},60%,30%))`}async function y(t){let s=document.getElementById("content");if(!s)return;s.innerHTML=`
    <div class="stats-view">
      <div class="stats-toolbar">
        ${$.map(e=>`
          <button class="stats-period-btn ${e.key===t?"active":""}" data-period="${e.key}">
            ${d(e.label)}
          </button>
        `).join("")}
      </div>
      ${M()}
    </div>
  `,s.querySelectorAll(".stats-period-btn").forEach(e=>{e.addEventListener("click",()=>{m=e.dataset.period,y(m)})});let a;try{a=await k(`/api/plex/stats?period=${t}`)}catch(e){s.querySelector(".stats-skeleton").innerHTML=`
      <div class="error-box">\u26A0\uFE0F Statistieken laden mislukt: ${d(e.message)}</div>
    `;return}if(!a||a.error){s.querySelector(".stats-skeleton").innerHTML=`
      <div class="error-box">\u26A0\uFE0F ${d(a?.error||"Geen data beschikbaar")}</div>
    `;return}let n=s.querySelector(".stats-view");n&&(n.innerHTML=`
    <div class="stats-toolbar">
      ${$.map(e=>`
        <button class="stats-period-btn ${e.key===t?"active":""}" data-period="${e.key}">
          ${d(e.label)}
        </button>
      `).join("")}
    </div>

    <!-- Samenvattingscards -->
    ${j(a)}

    <!-- Grafieken rij -->
    <div class="stats-charts-row">

      <!-- Lijndiagram: dagelijkse plays -->
      <div class="stats-chart-card">
        <div class="stats-chart-header">
          <div class="section-title">Dagelijkse plays</div>
          <span class="stats-chart-sub">${a.dailyPlays?.length??0} dagen</span>
        </div>
        <div class="stats-line-wrap">
          <canvas id="stats-line-canvas"></canvas>
        </div>
      </div>

      <!-- Bardiagram: top 10 artiesten -->
      <div class="stats-chart-card">
        <div class="stats-chart-header">
          <div class="section-title">Top artiesten</div>
          <span class="stats-chart-sub">${(a.topArtists||[]).length} artiesten</span>
        </div>
        <div class="stats-bar-wrap">
          <canvas id="stats-bar-canvas"></canvas>
        </div>
      </div>

    </div>

    <!-- Top artiesten lijst -->
    <div class="stats-section">
      <div class="stats-section-header">
        <div class="section-title">Top 10 artiesten</div>
      </div>
      ${D(a.topArtists)}
    </div>
  `,n.querySelectorAll(".stats-period-btn").forEach(e=>{e.addEventListener("click",()=>{m=e.dataset.period,y(m)})}),requestAnimationFrame(()=>{a.dailyPlays?.length&&T(a.dailyPlays),a.topArtists?.length&&E(a.topArtists)}))}async function H(){L(),document.title="Muziek \xB7 Statistieken",await y(m)}export{H as loadStats};
