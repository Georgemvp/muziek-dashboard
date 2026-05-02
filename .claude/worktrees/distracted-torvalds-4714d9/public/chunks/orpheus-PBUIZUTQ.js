import{a as O}from"./chunk-OBIGRC7P.js";import{E as I,G as H,H as M,I as B,J as D,f as k,h as n,j as q,s as C}from"./chunk-HCN2ZK5I.js";import{a as c}from"./chunk-2BMKGNH5.js";var g={all:"#888",tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},w={all:"All",tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},y={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},F=["all","tidal","qobuz","deezer","spotify","soundcloud","applemusic","beatport","beatsource","youtube"],R=[["album","Album"],["track","Track"],["playlist","Playlist"],["artist","Artiest"]],_=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function P(t){for(let{pattern:e,platform:a}of _)if(e.test(t))return a;return null}function L(){return localStorage.getItem("orpheusQuality")||"hifi"}function E(t){localStorage.setItem("orpheusQuality",t)}function S(){return c.orpheusPlatform||"all"}function j(){return c.orpheusType||"album"}function J(t){return F.map(e=>`
    <button class="oph-platform-pill${e===t?" active":""}"
            data-platform="${e}"
            style="--pill-color:${g[e]}">
      <span class="oph-pill-dot"></span>
      ${n(w[e])}
    </button>`).join("")}function N(t){return R.map(([e,a])=>`
    <button class="oph-type-pill${e===t?" active":""}" data-type="${e}">
      ${n(a)}
    </button>`).join("")}function Q(t){let e=y[t]||y.all,a=L();return`<select class="oph-quality-sel" id="oph-quality-sel" aria-label="Download kwaliteit">
    ${e.map(([o,l])=>`<option value="${o}"${o===a?" selected":""}>${n(l)}</option>`).join("")}
  </select>`}function U(t){let e=t.platform||S()||"unknown",a=g[e]||"#888",o=w[e]||e,l=!!t.inPlex,i=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist||"")}"
           loading="lazy" decoding="async"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${q(t.title)}">${k(t.title)}</div>`:`<div class="tidal-ph" style="background:${q(t.title)}">${k(t.title)}</div>`,r=[t.type==="album"?"Album":t.type==="playlist"?"Playlist":t.type==="artist"?"Artiest":"Track",t.year,t.tracks?`${t.tracks} nrs`:null].filter(Boolean).join(" \xB7 "),d=l?`<span class="orpheus-platform-badge" style="--badge-color:${a}">${n(o)}</span>
       <span class="oph-plex-badge" title="Al in je Plex bibliotheek">\u25B6 In Plex</span>`:`<span class="orpheus-platform-badge" style="--badge-color:${a}">${n(o)}</span>
       <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
               data-orpheus-url="${n(t.url||"")}"
               data-orpheus-title="${n(t.title)}"
               data-orpheus-artist="${n(t.artist||"")}"
               data-orpheus-platform="${n(e)}"
               title="Download via OrpheusDL">\u2B07 Download</button>`;return`
    <div class="tidal-card orpheus-card oph-result-card${l?" oph-in-plex":""}" data-orpheus-jobid="">
      <div class="tidal-cover">${i}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist">${n(t.artist||"")}</div>
        <div class="tidal-meta">${n(r)}</div>
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
    </div>`}function z(t,e){let a=w[e]||e||"Onbekend",o=g[e]||"#888",l=y[e]||y.all,i=L();return`
    <div class="oph-url-card">
      <div class="oph-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${o}">${n(a)}</span>
        <div class="oph-url-text">${n(t)}</div>
      </div>
      <div class="oph-url-dl-actions">
        <select class="oph-quality-sel" id="oph-url-quality" aria-label="Kwaliteit">
          ${l.map(([s,r])=>`<option value="${s}"${s===i?" selected":""}>${n(r)}</option>`).join("")}
        </select>
        <button class="tidal-dl-btn orpheus-dl-btn oph-dl-btn"
                data-orpheus-url="${n(t)}"
                data-orpheus-title="${n(t)}"
                data-orpheus-artist=""
                data-orpheus-platform="${n(e||"all")}">
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
    </div>`}var K=[{pattern:/401.*authentication|authentication.*required|user authentication/i,message:"Authenticatie mislukt. Ga naar Instellingen \u2192 OrpheusDL en vernieuw je auth_token."},{pattern:/401/i,message:"Authenticatie mislukt (401). Controleer je inloggegevens in de OrpheusDL instellingen."},{pattern:/403.*forbidden|forbidden/i,message:"Toegang geweigerd (403). Controleer je abonnement en credentials."},{pattern:/Could not get (album|track|artist|playlist) info/i,message:"Kon metadata niet ophalen. Controleer de URL en je credentials."},{pattern:/timed? ?out/i,message:"Download timeout. Probeer opnieuw."}];function Z(t){if(!Array.isArray(t))return null;let e=t.map(o=>typeof o=="string"?o:o?.message||o?.text||String(o||""));for(let{pattern:o,message:l}of K)if(e.some(i=>o.test(i)))return l;return e.find(o=>/✗|failed|error/i.test(o))?"Download mislukt. Controleer de logs voor meer details.":null}var b=new Map;function G(t,e){if(b.has(t))return;let a=e?.querySelector(".orpheus-progress-wrap"),o=e?.querySelector(".orpheus-bar-fill"),l=e?.querySelector(".orpheus-job-status"),i=e?.querySelector(".orpheus-pct"),s=e?.querySelector(".oph-dl-btn"),r=e?.querySelector(".orpheus-stop-btn");a&&(a.style.display=""),s&&(s.disabled=!0,s.textContent="\u2026");let d={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}},u=setInterval(async()=>{try{let p=await B(t),$=typeof p.progress=="number"?Math.round(p.progress):0;o&&(o.style.width=`${$}%`),i&&(i.textContent=`${$}%`);let T=d[p.status]||{label:p.status,cls:"q-pending"};if(l&&(l.textContent=T.label,l.className=`q-status ${T.cls} orpheus-job-status`),p.status==="done"||p.status==="error"||p.status==="stopped"){clearInterval(u),b.delete(t),r&&(r.style.display="none");let h=p.status==="error"||p.status==="done"&&p.success===!1;if(!h&&p.status==="done"&&s)s.textContent="\u2713",s.classList.add("dl-done"),l&&(l.textContent="\u2713 Klaar",l.className="q-status q-done orpheus-job-status");else if(h){if(s&&(s.disabled=!1,s.textContent="\u2B07 Download"),l&&(l.textContent="\u2717 Mislukt",l.className="q-status q-error orpheus-job-status"),o&&o.classList.add("oph-bar-error"),a){a.querySelectorAll(".orpheus-error-message").forEach(m=>m.remove());let v=p.errorMessage||Z(p.log);if(v){let m=document.createElement("div");m.className="orpheus-error-message",m.innerHTML=`<span class="oph-err-icon">\u26A0</span><span class="oph-err-text">${n(v)}</span>`,a.appendChild(m)}}}else s&&(s.disabled=!1,s.textContent="\u2B07 Download");c.activeOrpheusJobs&&(c.activeOrpheusJobs=c.activeOrpheusJobs.filter(v=>v.jobId!==t),A())}else{let h=(c.activeOrpheusJobs||[]).find(v=>v.jobId===t);h&&(h.progress=$,h.status=p.status)}}catch{clearInterval(u),b.delete(t)}},800);b.set(t,u),r?.addEventListener("click",async()=>{try{await D(t)}catch{}clearInterval(u),b.delete(t),l&&(l.textContent="\u25A0 Gestopt",l.className="q-status q-pending orpheus-job-status"),s&&(s.disabled=!1,s.textContent="\u2B07 Download")},{once:!0})}function A(){let t=document.getElementById("oph-active-jobs");if(!t)return;let e=c.activeOrpheusJobs||[];if(!e.length){t.style.display="none",t.innerHTML="";return}t.style.display="";let a={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"}};t.innerHTML=`
    <div class="oph-section-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="3" x2="12" y2="21"/>
      </svg>
      Actieve downloads
      <span class="oph-jobs-count">${e.length}</span>
    </div>
    <div class="oph-active-list">
      ${e.map(o=>{let l=o.progress||0,i=g[o.platform]||"#888",s=a[o.status]||{label:o.status||"In wachtrij",cls:"q-pending"};return`<div class="oph-active-row" data-job-id="${n(o.jobId)}">
          <div class="oph-active-info">
            <span class="oph-platform-dot" style="background:${i}"></span>
            <div class="oph-active-text">
              <div class="oph-active-title">${n(o.title||"(onbekend)")}</div>
              ${o.artist?`<div class="oph-active-artist">${n(o.artist)}</div>`:""}
            </div>
          </div>
          <div class="oph-active-progress">
            <div class="q-bar"><div class="q-bar-fill" style="width:${l}%"></div></div>
            <div class="oph-active-meta">
              <span class="q-status ${s.cls}">${s.label}</span>
              <span class="oph-pct-small">${l}%</span>
            </div>
          </div>
        </div>`}).join("")}
    </div>`}function x(t){t.querySelectorAll(".oph-dl-btn").forEach(e=>{e.addEventListener("click",async()=>{let a=e.dataset.orpheusUrl,o=e.dataset.orpheusTitle,l=e.dataset.orpheusArtist,i=e.dataset.orpheusPlatform;if(!a)return;let s=e.closest(".oph-url-card")?.querySelector("#oph-url-quality")?.value||document.getElementById("oph-quality-sel")?.value||L();e.disabled=!0,e.textContent="\u2026";try{let r=await M(a,s,o,l);if(!r.ok)throw new Error(r.error||"Download mislukt");let d=r.jobId;c.activeOrpheusJobs||(c.activeOrpheusJobs=[]),c.activeOrpheusJobs.push({jobId:d,title:o,artist:l,platform:i,progress:0,status:"pending"}),A();let u=e.closest(".tidal-card, .oph-url-card");G(d,u)}catch(r){e.disabled=!1,e.textContent="\u2B07 Download",alert("Download mislukt: "+r.message)}})})}async function f(t){let e=document.getElementById("oph-results");if(!e)return;let a=(t||"").trim(),o=S(),l=j();if(a.startsWith("http")){let i=P(a),s=z(a,i||"all");e.innerHTML=s,e.querySelector("#oph-url-quality")?.addEventListener("change",r=>E(r.target.value)),x(e);return}if(a.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}e.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL${o!=="all"?" \xB7 "+(w[o]||o):""}\u2026</div>`;try{let i=await H(a,o,l==="artist"?"all":l),s=i.results||[];if(i.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(i.error)}</div>`;return}if(!s.length){e.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${n(a)}</strong>" via OrpheusDL.</div>`;return}e.innerHTML=`<div class="tidal-grid">${s.map(U).join("")}</div>`,x(e)}catch(i){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(i.message)}</div>`}}async function Y(){let t=document.getElementById("oph-conn-dot"),e=document.getElementById("oph-conn-text");if(!(!t||!e))try{let a=await I();c.orpheusConnected=!!a.connected,t.className=`oph-conn-dot ${a.connected?"connected":"disconnected"}`,e.textContent=a.connected?"Verbonden":"Offline"}catch{c.orpheusConnected=!1,t&&(t.className="oph-conn-dot disconnected"),e&&(e.textContent="Offline")}}function V(t){document.querySelectorAll("#oph-platform-pills [data-platform]").forEach(e=>e.classList.toggle("active",e.dataset.platform===t))}function W(t){document.querySelectorAll("#oph-type-pills [data-type]").forEach(e=>e.classList.toggle("active",e.dataset.type===t))}function X(t){let e=document.getElementById("oph-quality-sel");if(!e)return;let a=y[t]||y.all,o=L();e.innerHTML=a.map(([l,i])=>`<option value="${l}"${l===o?" selected":""}>${n(i)}</option>`).join("")}function tt(){A(),Y(),document.getElementById("oph-settings-btn")?.addEventListener("click",()=>{O()}),document.getElementById("oph-platform-pills")?.addEventListener("click",s=>{let r=s.target.closest("[data-platform]");if(!r)return;let d=r.dataset.platform;c.orpheusPlatform=d,V(d),X(d);let u=document.getElementById("oph-search-input")?.value||"";u.trim().length>=2&&f(u)}),document.getElementById("oph-type-pills")?.addEventListener("click",s=>{let r=s.target.closest("[data-type]");if(!r)return;c.orpheusType=r.dataset.type,W(c.orpheusType);let d=document.getElementById("oph-search-input")?.value||"";d.trim().length>=2&&f(d)}),document.getElementById("oph-quality-sel")?.addEventListener("change",s=>{E(s.target.value)});let t=document.getElementById("oph-search-input");document.getElementById("oph-search-btn")?.addEventListener("click",()=>{f(t?.value||"")}),t?.addEventListener("keydown",s=>{s.key==="Enter"&&f(t.value)});let e=null;t?.addEventListener("input",()=>{clearTimeout(e),e=setTimeout(()=>f(t.value),320)});let a=document.getElementById("oph-url-input"),o=document.getElementById("oph-url-submit"),l=()=>{let s=a?.value?.trim();if(!s||!s.startsWith("http"))return;let r=document.getElementById("oph-results");if(!r)return;let d=P(s);r.innerHTML=z(s,d||"all"),r.querySelector("#oph-url-quality")?.addEventListener("change",u=>E(u.target.value)),x(r)};o?.addEventListener("click",l),a?.addEventListener("keydown",s=>{s.key==="Enter"&&l()});let i=c.orpheusLastQuery;i?.length>=2&&(t&&(t.value=i),f(i))}async function lt(){let t=S(),e=j();C(`
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
          ${J(t)}
        </div>

        <!-- Type + kwaliteit -->
        <div class="oph-type-quality-row">
          <div class="oph-type-pills" id="oph-type-pills" role="group" aria-label="Type kiezen">
            ${N(e)}
          </div>
          <label class="oph-quality-wrap" aria-label="Kwaliteit">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${Q(t)}
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
  `,tt)}export{lt as loadOrpheus};
