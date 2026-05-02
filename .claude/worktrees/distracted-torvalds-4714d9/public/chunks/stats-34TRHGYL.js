import{d as k,h as d,z as $}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var y=null;function S(){return y||(y=new Promise((t,e)=>{if(window.Chart){t(window.Chart);return}let s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",s.onload=()=>t(window.Chart),s.onerror=()=>e(new Error("Chart.js laden mislukt")),document.head.appendChild(s)})),y}var u=null,p=null,m="1month",C=[{key:"7day",label:"7 dagen"},{key:"1month",label:"1 maand"},{key:"3month",label:"3 maanden"},{key:"12month",label:"12 maanden"},{key:"overall",label:"Alles"}];function f(t){return t==null||isNaN(t)?"\u2014":Number(t).toLocaleString("nl-NL")}function w(t){return t?new Date(t).toLocaleDateString("nl-NL",{day:"numeric",month:"short"}):"\u2014"}function l(t){return getComputedStyle(document.documentElement).getPropertyValue(t).trim()}function j(t){if(!t||t.length===0)return 0;let e=t.filter(n=>n.count>0);if(e.length===0)return 0;let s=e.reduce((n,a)=>n+a.count,0);return Math.round(s/e.length)}function A(t){return!t||t.length===0?null:t.reduce((e,s)=>s.count>(e?.count??0)?s:e,null)}function L(t){if(!t||t.length===0)return 0;let e=[...t].sort((a,o)=>a.date.localeCompare(o.date)),s=0,n=0;for(let a of e)a.count>0?(n++,s=Math.max(s,n)):n=0;return s}function M(){u&&(u.destroy(),u=null),p&&(p.destroy(),p=null)}function E(){return`
    <div class="stats-skeleton">
      <div class="stats-skeleton-cards">
        ${[1,2,3,4].map(()=>'<div class="stats-skel-card skeleton-pulse"></div>').join("")}
      </div>
      <div class="stats-skeleton-charts">
        <div class="stats-skel-chart skeleton-pulse"></div>
        <div class="stats-skel-chart skeleton-pulse"></div>
      </div>
    </div>
  `}function T(t){let{totalPlays:e,dailyPlays:s}=t,n=j(s),a=A(s),o=L(s);return`
    <div class="stats-summary-grid">
      ${[{icon:"\u{1F3B5}",label:"Totaal plays",value:f(e),sub:"in geselecteerde periode"},{icon:"\u{1F4CA}",label:"Gem. per actieve dag",value:f(n),sub:"plays per dag"},{icon:"\u{1F525}",label:"Meest actieve dag",value:a?f(a.count):"\u2014",sub:a?w(a.date):"geen data"},{icon:"\u26A1",label:"Langste streak",value:o>0?`${o}d`:"\u2014",sub:"aaneengesloten dagen"}].map(i=>`
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
  `}function B(t){let e=[...t].sort((r,h)=>r.date.localeCompare(h.date)),s=e.map(r=>w(r.date)),n=e.map(r=>r.count),a=l("--accent")||"#7c3aed",o=l("--accent-muted")||"rgba(124,58,237,0.10)",c=l("--text-secondary")||"#666",i=l("--border")||"#e5e5e5",b=l("--text")||"#1a1a1a",v=document.getElementById("stats-line-canvas");v&&(u&&(u.destroy(),u=null),u=new Chart(v,{type:"line",data:{labels:s,datasets:[{label:"Plays per dag",data:n,fill:!0,tension:.4,borderColor:a,backgroundColor:o,pointBackgroundColor:a,pointRadius:3,pointHoverRadius:5,borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,interaction:{mode:"index",intersect:!1},plugins:{legend:{display:!1},tooltip:{backgroundColor:l("--surface2")||"#f8f8f8",titleColor:b,bodyColor:c,borderColor:i,borderWidth:1,padding:10,callbacks:{label:r=>` ${r.parsed.y} plays`}}},scales:{x:{ticks:{color:c,font:{size:11},maxRotation:45,autoSkip:!0,maxTicksLimit:10},grid:{color:i,drawBorder:!1}},y:{beginAtZero:!0,ticks:{color:c,font:{size:11},precision:0},grid:{color:i,drawBorder:!1}}}}}))}function D(t){let e=(t||[]).slice(0,10),s=e.map(r=>r.name),n=e.map(r=>r.playcount||0),a=l("--accent")||"#7c3aed",o=l("--text-secondary")||"#666",c=l("--border")||"#e5e5e5",i=l("--text")||"#1a1a1a",b=e.map((r,h)=>{let x=1-h/e.length*.5;return a.startsWith("#")?I(a,x):a}),v=document.getElementById("stats-bar-canvas");v&&(p&&(p.destroy(),p=null),p=new Chart(v,{type:"bar",data:{labels:s,datasets:[{label:"Plays",data:n,backgroundColor:b,borderRadius:3,borderSkipped:!1}]},options:{indexAxis:"y",responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:l("--surface2")||"#f8f8f8",titleColor:i,bodyColor:o,borderColor:c,borderWidth:1,padding:10,callbacks:{label:r=>` ${f(r.parsed.x)} plays`}}},scales:{x:{beginAtZero:!0,ticks:{color:o,font:{size:11},precision:0},grid:{color:c}},y:{ticks:{color:i,font:{size:12,weight:"500"}},grid:{display:!1}}}}}))}function I(t,e){let s=parseInt(t.slice(1,3),16),n=parseInt(t.slice(3,5),16),a=parseInt(t.slice(5,7),16);return`rgba(${s},${n},${a},${e})`}function z(t){let e=(t||[]).slice(0,10);if(e.length===0)return'<div class="stats-empty">Geen artiesten gevonden voor deze periode.</div>';let s=Math.max(...e.map(n=>n.playcount||0),1);return`
    <ol class="stats-artist-list">
      ${e.map((n,a)=>{let o=Math.round((n.playcount||0)/s*100),c=k(n.thumb,40),i=c?`<img class="stats-artist-thumb" src="${c}" alt="${d(n.name)}" loading="lazy">`:`<div class="stats-artist-ph" style="background:${q(n.name)}">${R(n.name)}</div>`;return`
          <li class="stats-artist-row">
            <span class="stats-artist-rank">${a+1}</span>
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
  `}function R(t){return t?t.split(/\s+/).slice(0,2).map(e=>e[0]).join("").toUpperCase():"?"}function q(t){let e=0;for(let n=0;n<(t||"").length;n++)e=e*31+t.charCodeAt(n)&4294967295;let s=Math.abs(e)%360;return`linear-gradient(135deg, hsl(${s},50%,40%), hsl(${(s+40)%360},60%,30%))`}async function g(t){let e=document.getElementById("content");if(!e)return;e.innerHTML=`
    <div class="stats-view">
      <div class="stats-toolbar">
        ${C.map(a=>`
          <button class="stats-period-btn ${a.key===t?"active":""}" data-period="${a.key}">
            ${d(a.label)}
          </button>
        `).join("")}
      </div>
      ${E()}
    </div>
  `,e.querySelectorAll(".stats-period-btn").forEach(a=>{a.addEventListener("click",()=>{m=a.dataset.period,g(m)})});let s;try{s=await $(`/api/plex/stats?period=${t}`)}catch(a){e.querySelector(".stats-skeleton").innerHTML=`
      <div class="error-box">\u26A0\uFE0F Statistieken laden mislukt: ${d(a.message)}</div>
    `;return}if(!s||s.error){e.querySelector(".stats-skeleton").innerHTML=`
      <div class="error-box">\u26A0\uFE0F ${d(s?.error||"Geen data beschikbaar")}</div>
    `;return}let n=e.querySelector(".stats-view");n&&(n.innerHTML=`
    <div class="stats-toolbar">
      ${C.map(a=>`
        <button class="stats-period-btn ${a.key===t?"active":""}" data-period="${a.key}">
          ${d(a.label)}
        </button>
      `).join("")}
    </div>

    <!-- Samenvattingscards -->
    ${T(s)}

    <!-- Grafieken rij -->
    <div class="stats-charts-row">

      <!-- Lijndiagram: dagelijkse plays -->
      <div class="stats-chart-card">
        <div class="stats-chart-header">
          <div class="section-title">Dagelijkse plays</div>
          <span class="stats-chart-sub">${s.dailyPlays?.length??0} dagen</span>
        </div>
        <div class="stats-line-wrap">
          <canvas id="stats-line-canvas"></canvas>
        </div>
      </div>

      <!-- Bardiagram: top 10 artiesten -->
      <div class="stats-chart-card">
        <div class="stats-chart-header">
          <div class="section-title">Top artiesten</div>
          <span class="stats-chart-sub">${(s.topArtists||[]).length} artiesten</span>
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
      ${z(s.topArtists)}
    </div>
  `,n.querySelectorAll(".stats-period-btn").forEach(a=>{a.addEventListener("click",()=>{m=a.dataset.period,g(m)})}),requestAnimationFrame(async()=>{try{await S()}catch(a){console.warn("[stats] Chart.js laden mislukt:",a);return}s.dailyPlays?.length&&B(s.dailyPlays),s.topArtists?.length&&D(s.topArtists)}))}async function P(){M(),document.title="Muziek \xB7 Statistieken",await g(m)}export{P as loadStats};
