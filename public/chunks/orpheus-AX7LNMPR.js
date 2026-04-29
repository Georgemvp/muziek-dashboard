import{a as M}from"./chunk-OBIGRC7P.js";import{E as T,G as H,H as I,I as B,J as C,f as $,h as a,j as L,s as A}from"./chunk-HCN2ZK5I.js";import{a as c}from"./chunk-2BMKGNH5.js";var b={all:"#888",tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},m={all:"All",tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},v={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},j=["all","tidal","qobuz","deezer","spotify","soundcloud","applemusic","beatport","beatsource","youtube"],F=[["album","Album"],["track","Track"],["playlist","Playlist"],["artist","Artiest"]],J=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function O(t){for(let{pattern:e,platform:o}of J)if(e.test(t))return o;return null}function g(){return localStorage.getItem("orpheusQuality")||"hifi"}function k(t){localStorage.setItem("orpheusQuality",t)}function E(){return c.orpheusPlatform||"all"}function P(){return c.orpheusType||"album"}function Q(t){return j.map(e=>`
    <button class="oph-platform-pill${e===t?" active":""}"
            data-platform="${e}"
            style="--pill-color:${b[e]}">
      <span class="oph-pill-dot"></span>
      ${a(m[e])}
    </button>`).join("")}function R(t){return F.map(([e,o])=>`
    <button class="oph-type-pill${e===t?" active":""}" data-type="${e}">
      ${a(o)}
    </button>`).join("")}function U(t){let e=v[t]||v.all,o=g();return`<select class="oph-quality-sel" id="oph-quality-sel" aria-label="Download kwaliteit">
    ${e.map(([l,n])=>`<option value="${l}"${l===o?" selected":""}>${a(n)}</option>`).join("")}
  </select>`}function _(t){let e=t.platform||E()||"unknown",o=b[e]||"#888",l=m[e]||e,n=!!t.inPlex,r=t.image?`<img class="tidal-img" src="${a(t.image)}" alt="${a(t.title)} by ${a(t.artist||"")}"
           loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${L(t.title)}">${$(t.title)}</div>`:`<div class="tidal-ph" style="background:${L(t.title)}">${$(t.title)}</div>`,i=[t.type==="album"?"Album":t.type==="playlist"?"Playlist":t.type==="artist"?"Artiest":"Track",t.year,t.tracks?`${t.tracks} nrs`:null].filter(Boolean).join(" \xB7 "),d=n?`<span class="orpheus-platform-badge" style="--badge-color:${o}">${a(l)}</span>
       <span class="oph-plex-badge" title="Al in je Plex bibliotheek">\u25B6 In Plex</span>`:`<span class="orpheus-platform-badge" style="--badge-color:${o}">${a(l)}</span>
       <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
               data-orpheus-url="${a(t.url||"")}"
               data-orpheus-title="${a(t.title)}"
               data-orpheus-artist="${a(t.artist||"")}"
               data-orpheus-platform="${a(e)}"
               title="Download via OrpheusDL">\u2B07 Download</button>`;return`
    <div class="tidal-card orpheus-card oph-result-card${n?" oph-in-plex":""}" data-orpheus-jobid="">
      <div class="tidal-cover">${r}</div>
      <div class="tidal-info">
        <div class="tidal-title">${a(t.title)}</div>
        <div class="tidal-artist">${a(t.artist||"")}</div>
        <div class="tidal-meta">${a(i)}</div>
      </div>
      <div class="orpheus-card-actions">
        ${d}
      </div>
      <div class="orpheus-progress-wrap" style="display:none">
        <div class="q-bar"><div class="q-bar-fill orpheus-bar-fill" style="width:0%"></div></div>
        <div class="orpheus-progress-row">
          <span class="q-status q-pending orpheus-job-status">In wachtrij</span>
          <span class="orpheus-pct">0%</span>
          <button class="orpheus-stop-btn" title="Stop download" aria-label="Stop download">\u25A0</button>
        </div>
      </div>
    </div>`}function D(t,e){let o=m[e]||e||"Onbekend",l=b[e]||"#888",n=v[e]||v.all,r=g();return`
    <div class="oph-url-card">
      <div class="oph-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${l}">${a(o)}</span>
        <div class="oph-url-text">${a(t)}</div>
      </div>
      <div class="oph-url-dl-actions">
        <select class="oph-quality-sel" id="oph-url-quality" aria-label="Kwaliteit">
          ${n.map(([s,i])=>`<option value="${s}"${s===r?" selected":""}>${a(i)}</option>`).join("")}
        </select>
        <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
                data-orpheus-url="${a(t)}"
                data-orpheus-title="${a(t)}"
                data-orpheus-artist=""
                data-orpheus-platform="${a(e||"all")}">
          \u2B07 Direct downloaden
        </button>
      </div>
      <div class="orpheus-progress-wrap" style="display:none">
        <div class="q-bar"><div class="q-bar-fill orpheus-bar-fill" style="width:0%"></div></div>
        <div class="orpheus-progress-row">
          <span class="q-status q-pending orpheus-job-status">In wachtrij</span>
          <span class="orpheus-pct">0%</span>
          <button class="orpheus-stop-btn" title="Stop download">\u25A0</button>
        </div>
      </div>
    </div>`}var y=new Map;function K(t,e){if(y.has(t))return;let o=e?.querySelector(".orpheus-progress-wrap"),l=e?.querySelector(".orpheus-bar-fill"),n=e?.querySelector(".orpheus-job-status"),r=e?.querySelector(".orpheus-pct"),s=e?.querySelector(".oph-dl-btn"),i=e?.querySelector(".orpheus-stop-btn");o&&(o.style.display=""),s&&(s.disabled=!0,s.textContent="\u2026");let d={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}},p=setInterval(async()=>{try{let u=await B(t),w=typeof u.progress=="number"?Math.round(u.progress):0;l&&(l.style.width=`${w}%`),r&&(r.textContent=`${w}%`);let S=d[u.status]||{label:u.status,cls:"q-pending"};if(n&&(n.textContent=S.label,n.className=`q-status ${S.cls} orpheus-job-status`),u.status==="done"||u.status==="error"||u.status==="stopped")clearInterval(p),y.delete(t),i&&(i.style.display="none"),u.status==="done"&&s?(s.textContent="\u2713",s.classList.add("dl-done")):s&&(s.disabled=!1,s.textContent="\u2B07 Download"),c.activeOrpheusJobs&&(c.activeOrpheusJobs=c.activeOrpheusJobs.filter(f=>f.jobId!==t),x());else{let f=(c.activeOrpheusJobs||[]).find(z=>z.jobId===t);f&&(f.progress=w,f.status=u.status)}}catch{clearInterval(p),y.delete(t)}},800);y.set(t,p),i?.addEventListener("click",async()=>{try{await C(t)}catch{}clearInterval(p),y.delete(t),n&&(n.textContent="\u25A0 Gestopt",n.className="q-status q-pending orpheus-job-status"),s&&(s.disabled=!1,s.textContent="\u2B07 Download")},{once:!0})}function x(){let t=document.getElementById("oph-active-jobs");if(!t)return;let e=c.activeOrpheusJobs||[];if(!e.length){t.style.display="none",t.innerHTML="";return}t.style.display="";let o={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"}};t.innerHTML=`
    <div class="oph-section-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      Actieve downloads
      <span class="oph-jobs-count">${e.length}</span>
    </div>
    <div class="oph-active-list">
      ${e.map(l=>{let n=l.progress||0,r=b[l.platform]||"#888",s=o[l.status]||{label:l.status||"In wachtrij",cls:"q-pending"};return`<div class="oph-active-row" data-job-id="${a(l.jobId)}">
          <div class="oph-active-info">
            <span class="oph-platform-dot" style="background:${r}"></span>
            <div class="oph-active-text">
              <div class="oph-active-title">${a(l.title||"(onbekend)")}</div>
              ${l.artist?`<div class="oph-active-artist">${a(l.artist)}</div>`:""}
            </div>
          </div>
          <div class="oph-active-progress">
            <div class="q-bar"><div class="q-bar-fill" style="width:${n}%"></div></div>
            <div class="oph-active-meta">
              <span class="q-status ${s.cls}">${s.label}</span>
              <span class="oph-pct-small">${n}%</span>
            </div>
          </div>
        </div>`}).join("")}
    </div>`}function q(t){t.querySelectorAll(".oph-dl-btn").forEach(e=>{e.addEventListener("click",async()=>{let o=e.dataset.orpheusUrl,l=e.dataset.orpheusTitle,n=e.dataset.orpheusArtist,r=e.dataset.orpheusPlatform;if(!o)return;let s=e.closest(".oph-url-card")?.querySelector("#oph-url-quality")?.value||document.getElementById("oph-quality-sel")?.value||g();e.disabled=!0,e.textContent="\u2026";try{let i=await I(o,s,l,n);if(!i.ok)throw new Error(i.error||"Download mislukt");let d=i.jobId;c.activeOrpheusJobs||(c.activeOrpheusJobs=[]),c.activeOrpheusJobs.push({jobId:d,title:l,artist:n,platform:r,progress:0,status:"pending"}),x();let p=e.closest(".tidal-card, .oph-url-card");K(d,p)}catch(i){e.disabled=!1,e.textContent="\u2B07 Download",alert("Download mislukt: "+i.message)}})})}async function h(t){let e=document.getElementById("oph-results");if(!e)return;let o=(t||"").trim(),l=E(),n=P();if(o.startsWith("http")){let r=O(o),s=D(o,r||"all");e.innerHTML=s,e.querySelector("#oph-url-quality")?.addEventListener("change",i=>k(i.target.value)),q(e);return}if(o.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}e.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL${l!=="all"?" \xB7 "+(m[l]||l):""}\u2026</div>`;try{let r=await H(o,l,n==="artist"?"all":n),s=r.results||[];if(r.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${a(r.error)}</div>`;return}if(!s.length){e.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${a(o)}</strong>" via OrpheusDL.</div>`;return}e.innerHTML=`<div class="tidal-grid">${s.map(_).join("")}</div>`,q(e)}catch(r){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${a(r.message)}</div>`}}async function N(){let t=document.getElementById("oph-conn-dot"),e=document.getElementById("oph-conn-text");if(!(!t||!e))try{let o=await T();c.orpheusConnected=!!o.connected,t.className=`oph-conn-dot ${o.connected?"connected":"disconnected"}`,e.textContent=o.connected?"Verbonden":"Offline"}catch{c.orpheusConnected=!1,t&&(t.className="oph-conn-dot disconnected"),e&&(e.textContent="Offline")}}function Z(t){document.querySelectorAll("#oph-platform-pills [data-platform]").forEach(e=>e.classList.toggle("active",e.dataset.platform===t))}function Y(t){document.querySelectorAll("#oph-type-pills [data-type]").forEach(e=>e.classList.toggle("active",e.dataset.type===t))}function G(t){let e=document.getElementById("oph-quality-sel");if(!e)return;let o=v[t]||v.all,l=g();e.innerHTML=o.map(([n,r])=>`<option value="${n}"${n===l?" selected":""}>${a(r)}</option>`).join("")}function V(){x(),N(),document.getElementById("oph-settings-btn")?.addEventListener("click",()=>{M()}),document.getElementById("oph-platform-pills")?.addEventListener("click",s=>{let i=s.target.closest("[data-platform]");if(!i)return;let d=i.dataset.platform;c.orpheusPlatform=d,Z(d),G(d);let p=document.getElementById("oph-search-input")?.value||"";p.trim().length>=2&&h(p)}),document.getElementById("oph-type-pills")?.addEventListener("click",s=>{let i=s.target.closest("[data-type]");if(!i)return;c.orpheusType=i.dataset.type,Y(c.orpheusType);let d=document.getElementById("oph-search-input")?.value||"";d.trim().length>=2&&h(d)}),document.getElementById("oph-quality-sel")?.addEventListener("change",s=>{k(s.target.value)});let t=document.getElementById("oph-search-input");document.getElementById("oph-search-btn")?.addEventListener("click",()=>{h(t?.value||"")}),t?.addEventListener("keydown",s=>{s.key==="Enter"&&h(t.value)});let e=null;t?.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>h(t.value),320)});let o=document.getElementById("oph-url-input"),l=document.getElementById("oph-url-submit"),n=()=>{let s=o?.value?.trim();if(!s||!s.startsWith("http"))return;let i=document.getElementById("oph-results");if(!i)return;let d=O(s);i.innerHTML=D(s,d||"all"),i.querySelector("#oph-url-quality")?.addEventListener("change",p=>k(p.target.value)),q(i)};l?.addEventListener("click",n),o?.addEventListener("keydown",s=>{s.key==="Enter"&&n()});let r=c.orpheusLastQuery;r?.length>=2&&(t&&(t.value=r),h(r))}async function st(){let t=E(),e=P();A(`
    <div class="oph-page">

      <!-- \u2500\u2500 Koptekst \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <div class="oph-header">
        <div class="oph-header-left">
          <h1 class="oph-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            OrpheusDL
          </h1>
          <div class="oph-conn-status">
            <span class="oph-conn-dot" id="oph-conn-dot"></span>
            <span class="oph-conn-label" id="oph-conn-text">Controleren\u2026</span>
          </div>
        </div>
        <button class="tool-btn oph-settings-btn" id="oph-settings-btn" type="button">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Instellingen
        </button>
      </div>

      <!-- \u2500\u2500 Actieve downloads \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <div id="oph-active-jobs" class="oph-active-jobs" style="display:none"></div>

      <!-- \u2500\u2500 Directe URL download \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <div class="oph-url-section">
        <label class="oph-url-label" for="oph-url-input">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Directe URL
        </label>
        <div class="oph-url-row">
          <input id="oph-url-input" class="oph-url-input" type="url"
                 placeholder="Plak een URL van elk platform (Tidal, Qobuz, Deezer, Spotify, YouTube\u2026)"
                 autocomplete="off" spellcheck="false">
          <button class="tidal-dl-btn oph-url-submit-btn" id="oph-url-submit" type="button">
            \u2B07 Download
          </button>
        </div>
      </div>

      <!-- \u2500\u2500 Zoekbesturing \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <div class="oph-controls">

        <!-- Platform pills -->
        <div class="oph-pills-row" id="oph-platform-pills" role="group" aria-label="Platform kiezen">
          ${Q(t)}
        </div>

        <!-- Type + kwaliteit -->
        <div class="oph-type-quality-row">
          <div class="oph-type-pills" id="oph-type-pills" role="group" aria-label="Type kiezen">
            ${R(e)}
          </div>
          <label class="oph-quality-wrap" aria-label="Kwaliteit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${U(t)}
          </label>
        </div>

        <!-- Zoekbalk -->
        <div class="oph-search-row">
          <input id="oph-search-input" class="tidal-search oph-search-input" type="search"
                 placeholder="Zoek artiest, album of track\u2026" autocomplete="off">
          <button class="tool-btn sel-def oph-search-btn" id="oph-search-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Zoeken
          </button>
        </div>
      </div>

      <!-- \u2500\u2500 Zoekresultaten \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
      <div id="oph-results">
        <div class="empty">Kies een platform en zoek muziek, of plak een URL hierboven.</div>
      </div>

    </div>
  `,V)}export{st as loadOrpheus};
