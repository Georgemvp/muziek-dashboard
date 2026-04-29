import{a as M}from"./chunk-NQBJDQD4.js";import{E as A,G as B,H,I,J as C,f as $,h as a,j as L,s as x}from"./chunk-HCN2ZK5I.js";import{a as u}from"./chunk-2BMKGNH5.js";var m={all:"#888",tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},g={all:"All",tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},f={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},j=["all","tidal","qobuz","deezer","spotify","soundcloud","applemusic","beatport","beatsource","youtube"],F=[["album","Album"],["track","Track"],["playlist","Playlist"],["artist","Artiest"]],J=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function O(e){for(let{pattern:t,platform:s}of J)if(t.test(e))return s;return null}function w(){return localStorage.getItem("orpheusQuality")||"hifi"}function k(e){localStorage.setItem("orpheusQuality",e)}function E(){return u.orpheusPlatform||"all"}function D(){return u.orpheusType||"album"}function Q(e){return j.map(t=>`
    <button class="oph-platform-pill${t===e?" active":""}"
            data-platform="${t}"
            style="--pill-color:${m[t]}">
      <span class="oph-pill-dot"></span>
      ${a(g[t])}
    </button>`).join("")}function R(e){return F.map(([t,s])=>`
    <button class="oph-type-pill${t===e?" active":""}" data-type="${t}">
      ${a(s)}
    </button>`).join("")}function U(e){let t=f[e]||f.all,s=w();return`<select class="oph-quality-sel" id="oph-quality-sel" aria-label="Download kwaliteit">
    ${t.map(([o,n])=>`<option value="${o}"${o===s?" selected":""}>${a(n)}</option>`).join("")}
  </select>`}function _(e){let t=e.platform||E()||"unknown",s=m[t]||"#888",o=g[t]||t,n=e.image?`<img class="tidal-img" src="${a(e.image)}" alt="${a(e.title)} by ${a(e.artist||"")}"
           loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${L(e.title)}">${$(e.title)}</div>`:`<div class="tidal-ph" style="background:${L(e.title)}">${$(e.title)}</div>`,l=[e.type==="album"?"Album":e.type==="playlist"?"Playlist":e.type==="artist"?"Artiest":"Track",e.year,e.tracks?`${e.tracks} nrs`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card orpheus-card oph-result-card" data-orpheus-jobid="">
      <div class="tidal-cover">${n}</div>
      <div class="tidal-info">
        <div class="tidal-title">${a(e.title)}</div>
        <div class="tidal-artist">${a(e.artist||"")}</div>
        <div class="tidal-meta">${a(l)}</div>
      </div>
      <div class="orpheus-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${s}">${a(o)}</span>
        <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
                data-orpheus-url="${a(e.url||"")}"
                data-orpheus-title="${a(e.title)}"
                data-orpheus-artist="${a(e.artist||"")}"
                data-orpheus-platform="${a(t)}"
                title="Download via OrpheusDL">\u2B07 Download</button>
      </div>
      <div class="orpheus-progress-wrap" style="display:none">
        <div class="q-bar"><div class="q-bar-fill orpheus-bar-fill" style="width:0%"></div></div>
        <div class="orpheus-progress-row">
          <span class="q-status q-pending orpheus-job-status">In wachtrij</span>
          <span class="orpheus-pct">0%</span>
          <button class="orpheus-stop-btn" title="Stop download" aria-label="Stop download">\u25A0</button>
        </div>
      </div>
    </div>`}function z(e,t){let s=g[t]||t||"Onbekend",o=m[t]||"#888",n=f[t]||f.all,i=w();return`
    <div class="oph-url-card">
      <div class="oph-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${o}">${a(s)}</span>
        <div class="oph-url-text">${a(e)}</div>
      </div>
      <div class="oph-url-dl-actions">
        <select class="oph-quality-sel" id="oph-url-quality" aria-label="Kwaliteit">
          ${n.map(([l,d])=>`<option value="${l}"${l===i?" selected":""}>${a(d)}</option>`).join("")}
        </select>
        <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
                data-orpheus-url="${a(e)}"
                data-orpheus-title="${a(e)}"
                data-orpheus-artist=""
                data-orpheus-platform="${a(t||"all")}">
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
    </div>`}var b=new Map;function K(e,t){if(b.has(e))return;let s=t?.querySelector(".orpheus-progress-wrap"),o=t?.querySelector(".orpheus-bar-fill"),n=t?.querySelector(".orpheus-job-status"),i=t?.querySelector(".orpheus-pct"),l=t?.querySelector(".oph-dl-btn"),d=t?.querySelector(".orpheus-stop-btn");s&&(s.style.display=""),l&&(l.disabled=!0,l.textContent="\u2026");let r={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}},p=setInterval(async()=>{try{let c=await I(e),h=typeof c.progress=="number"?Math.round(c.progress):0;o&&(o.style.width=`${h}%`),i&&(i.textContent=`${h}%`);let T=r[c.status]||{label:c.status,cls:"q-pending"};if(n&&(n.textContent=T.label,n.className=`q-status ${T.cls} orpheus-job-status`),c.status==="done"||c.status==="error"||c.status==="stopped")clearInterval(p),b.delete(e),d&&(d.style.display="none"),c.status==="done"&&l?(l.textContent="\u2713",l.classList.add("dl-done")):l&&(l.disabled=!1,l.textContent="\u2B07 Download"),u.activeOrpheusJobs&&(u.activeOrpheusJobs=u.activeOrpheusJobs.filter(y=>y.jobId!==e),S());else{let y=(u.activeOrpheusJobs||[]).find(P=>P.jobId===e);y&&(y.progress=h,y.status=c.status)}}catch{clearInterval(p),b.delete(e)}},800);b.set(e,p),d?.addEventListener("click",async()=>{try{await C(e)}catch{}clearInterval(p),b.delete(e),n&&(n.textContent="\u25A0 Gestopt",n.className="q-status q-pending orpheus-job-status"),l&&(l.disabled=!1,l.textContent="\u2B07 Download")},{once:!0})}function S(){let e=document.getElementById("oph-active-jobs");if(!e)return;let t=u.activeOrpheusJobs||[];if(!t.length){e.style.display="none",e.innerHTML="";return}e.style.display="";let s={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"}};e.innerHTML=`
    <div class="oph-section-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      Actieve downloads
      <span class="oph-jobs-count">${t.length}</span>
    </div>
    <div class="oph-active-list">
      ${t.map(o=>{let n=o.progress||0,i=m[o.platform]||"#888",l=s[o.status]||{label:o.status||"In wachtrij",cls:"q-pending"};return`<div class="oph-active-row" data-job-id="${a(o.jobId)}">
          <div class="oph-active-info">
            <span class="oph-platform-dot" style="background:${i}"></span>
            <div class="oph-active-text">
              <div class="oph-active-title">${a(o.title||"(onbekend)")}</div>
              ${o.artist?`<div class="oph-active-artist">${a(o.artist)}</div>`:""}
            </div>
          </div>
          <div class="oph-active-progress">
            <div class="q-bar"><div class="q-bar-fill" style="width:${n}%"></div></div>
            <div class="oph-active-meta">
              <span class="q-status ${l.cls}">${l.label}</span>
              <span class="oph-pct-small">${n}%</span>
            </div>
          </div>
        </div>`}).join("")}
    </div>`}function q(e){e.querySelectorAll(".oph-dl-btn").forEach(t=>{t.addEventListener("click",async()=>{let s=t.dataset.orpheusUrl,o=t.dataset.orpheusTitle,n=t.dataset.orpheusArtist,i=t.dataset.orpheusPlatform;if(!s)return;let l=t.closest(".oph-url-card")?.querySelector("#oph-url-quality")?.value||document.getElementById("oph-quality-sel")?.value||w();t.disabled=!0,t.textContent="\u2026";try{let d=await H(s,l,o,n);if(!d.ok)throw new Error(d.error||"Download mislukt");let r=d.jobId;u.activeOrpheusJobs||(u.activeOrpheusJobs=[]),u.activeOrpheusJobs.push({jobId:r,title:o,artist:n,platform:i,progress:0,status:"pending"}),S();let p=t.closest(".tidal-card, .oph-url-card");K(r,p)}catch(d){t.disabled=!1,t.textContent="\u2B07 Download",alert("Download mislukt: "+d.message)}})})}async function v(e){let t=document.getElementById("oph-results");if(!t)return;let s=(e||"").trim(),o=E(),n=D();if(s.startsWith("http")){let i=O(s),l=z(s,i||"all");t.innerHTML=l,t.querySelector("#oph-url-quality")?.addEventListener("change",d=>k(d.target.value)),q(t);return}if(s.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}t.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL${o!=="all"?" \xB7 "+(g[o]||o):""}\u2026</div>`;try{let i=await B(s,o,n==="artist"?"all":n),l=i.results||[];if(i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${a(i.error)}</div>`;return}if(!l.length){t.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${a(s)}</strong>" via OrpheusDL.</div>`;return}t.innerHTML=`<div class="tidal-grid">${l.map(_).join("")}</div>`,q(t)}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${a(i.message)}</div>`}}async function N(){let e=document.getElementById("oph-conn-dot"),t=document.getElementById("oph-conn-text");if(!(!e||!t))try{let s=await A();u.orpheusConnected=!!s.connected,e.className=`oph-conn-dot ${s.connected?"connected":"disconnected"}`,t.textContent=s.connected?"Verbonden":"Offline"}catch{u.orpheusConnected=!1,e&&(e.className="oph-conn-dot disconnected"),t&&(t.textContent="Offline")}}function Z(e){document.querySelectorAll("#oph-platform-pills [data-platform]").forEach(t=>t.classList.toggle("active",t.dataset.platform===e))}function Y(e){document.querySelectorAll("#oph-type-pills [data-type]").forEach(t=>t.classList.toggle("active",t.dataset.type===e))}function G(e){let t=document.getElementById("oph-quality-sel");if(!t)return;let s=f[e]||f.all,o=w();t.innerHTML=s.map(([n,i])=>`<option value="${n}"${n===o?" selected":""}>${a(i)}</option>`).join("")}async function et(){let e=E(),t=D();x(`
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
          ${Q(e)}
        </div>

        <!-- Type + kwaliteit -->
        <div class="oph-type-quality-row">
          <div class="oph-type-pills" id="oph-type-pills" role="group" aria-label="Type kiezen">
            ${R(t)}
          </div>
          <label class="oph-quality-wrap" aria-label="Kwaliteit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${U(e)}
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
  `),S(),N(),document.getElementById("oph-settings-btn")?.addEventListener("click",()=>{M()}),document.getElementById("oph-platform-pills")?.addEventListener("click",r=>{let p=r.target.closest("[data-platform]");if(!p)return;let c=p.dataset.platform;u.orpheusPlatform=c,Z(c),G(c);let h=document.getElementById("oph-search-input")?.value||"";h.trim().length>=2&&v(h)}),document.getElementById("oph-type-pills")?.addEventListener("click",r=>{let p=r.target.closest("[data-type]");if(!p)return;u.orpheusType=p.dataset.type,Y(u.orpheusType);let c=document.getElementById("oph-search-input")?.value||"";c.trim().length>=2&&v(c)}),document.getElementById("oph-quality-sel")?.addEventListener("change",r=>{k(r.target.value)});let s=document.getElementById("oph-search-input");document.getElementById("oph-search-btn")?.addEventListener("click",()=>{v(s?.value||"")}),s?.addEventListener("keydown",r=>{r.key==="Enter"&&v(s.value)});let o=null;s?.addEventListener("input",()=>{clearTimeout(o),o=setTimeout(()=>v(s.value),320)});let n=document.getElementById("oph-url-input"),i=document.getElementById("oph-url-submit"),l=()=>{let r=n?.value?.trim();if(!r||!r.startsWith("http"))return;let p=document.getElementById("oph-results");if(!p)return;let c=O(r);p.innerHTML=z(r,c||"all"),p.querySelector("#oph-url-quality")?.addEventListener("change",h=>k(h.target.value)),q(p)};i?.addEventListener("click",l),n?.addEventListener("keydown",r=>{r.key==="Enter"&&l()});let d=u.orpheusLastQuery;d?.length>=2&&(s&&(s.value=d),v(d))}export{et as loadOrpheus};
