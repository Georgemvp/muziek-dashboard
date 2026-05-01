import{b as _}from"./chunk-2UCV5F4T.js";import{G as k,H as O,I as M,J as A,a as $,f as h,h as i,j as b,p as L,s as E,z as m}from"./chunk-HCN2ZK5I.js";import{a as r}from"./chunk-2BMKGNH5.js";var U={tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},x={tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},P={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},de=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function ce(e){for(let{pattern:t,platform:s}of de)if(t.test(e))return s;return null}function F(){return localStorage.getItem("orpheusQuality")||"hifi"}function V(e){localStorage.setItem("orpheusQuality",e)}function J(e){let t=P[e]||P.all,s=F();return`
    <label class="orpheus-quality-wrap" title="Download kwaliteit">
      <select id="orpheus-quality" class="orpheus-quality-sel" aria-label="Kwaliteit kiezen">
        ${t.map(([a,n])=>`<option value="${a}"${a===s?" selected":""}>${n}</option>`).join("")}
      </select>
    </label>`}function ue(){return localStorage.getItem("downloadQuality")||"high"}async function pe(){let e=r.tabAbort?.signal;try{let t=await m("/api/tidarr/status",{signal:e});if(e?.aborted)return;let s=document.getElementById("tidarr-status-pill"),a=document.getElementById("tidarr-status-text");r.tidarrOk=!!t.connected,s&&a&&(s.className=`tidarr-status-pill ${r.tidarrOk?"on":"off"}`,a.textContent=r.tidarrOk?`Tidarr \xB7 verbonden${t.quality?" \xB7 "+t.quality:""}`:"Tidarr offline")}catch(t){if(t.name==="AbortError")return;r.tidarrOk=!1;let s=document.getElementById("tidarr-status-text");s&&(s.textContent="Tidarr offline")}}async function G(){let e=r.tabAbort?.signal;try{let t=await m("/api/tidarr/queue",{signal:e});if(e?.aborted)return;let s=(t.items||[]).length,a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of a)n&&(s>0?(n.textContent=s,n.style.display=""):n.style.display="none")}catch(t){if(t.name==="AbortError")return}}function z(e){let t=e.image?`<img class="tidal-img" src="${i(e.image)}" alt="${i(e.title)} by ${i(e.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(e.title)}">${h(e.title)}</div>`:`<div class="tidal-ph" style="background:${b(e.title)}">${h(e.title)}</div>`,s=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${t}</div>
      <div class="tidal-info">
        <div class="tidal-title">${i(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${i(e.artist)}">${i(e.artist)}</div>
        <div class="tidal-meta">${i(s)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${i(e.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}function R(e){let t=e.platform||"unknown",s=U[t]||"#888",a=x[t]||t,n=e.image?`<img class="tidal-img" src="${i(e.image)}" alt="${i(e.title)} by ${i(e.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(e.title)}">${h(e.title)}</div>`:`<div class="tidal-ph" style="background:${b(e.title)}">${h(e.title)}</div>`,o=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card orpheus-card" data-orpheus-jobid="">
      <div class="tidal-cover">${n}</div>
      <div class="tidal-info">
        <div class="tidal-title">${i(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${i(e.artist)}">${i(e.artist)}</div>
        <div class="tidal-meta">${i(o)}</div>
      </div>
      <div class="orpheus-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${s}">${i(a)}</span>
        <button class="tidal-dl-btn orpheus-dl-btn"
                data-orpheus-url="${i(e.url||"")}"
                data-orpheus-title="${i(e.title)}"
                data-orpheus-artist="${i(e.artist)}"
                data-orpheus-platform="${i(t)}"
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
    </div>`}var q=new Map;function fe(e,t){if(q.has(e))return;let s=t?.querySelector(".orpheus-progress-wrap"),a=t?.querySelector(".orpheus-bar-fill"),n=t?.querySelector(".orpheus-job-status"),o=t?.querySelector(".orpheus-pct"),d=t?.querySelector(".orpheus-dl-btn"),l=t?.querySelector(".orpheus-stop-btn");s&&(s.style.display=""),d&&(d.disabled=!0,d.textContent="\u2026");let p=setInterval(async()=>{try{let u=await M(e),c=typeof u.progress=="number"?Math.round(u.progress):0;a&&(a.style.width=`${c}%`),o&&(o.textContent=`${c}%`);let v={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}}[u.status]||{label:u.status,cls:"q-pending"};if(n&&(n.textContent=v.label,n.className=`q-status ${v.cls} orpheus-job-status`),u.status==="done"||u.status==="error"||u.status==="stopped")clearInterval(p),q.delete(e),l&&(l.style.display="none"),u.status==="done"&&d?(d.textContent="\u2713",d.classList.add("dl-done")):d&&(d.disabled=!1,d.textContent="\u2B07 Download"),r.activeOrpheusJobs=r.activeOrpheusJobs.filter(g=>g.jobId!==e),window.dispatchEvent(new CustomEvent("orpheus-jobs-update"));else{let g=r.activeOrpheusJobs.find(y=>y.jobId===e);g&&(g.progress=c,g.status=u.status),window.dispatchEvent(new CustomEvent("orpheus-jobs-update"))}}catch{clearInterval(p),q.delete(e)}},800);q.set(e,p),l?.addEventListener("click",async()=>{try{await A(e)}catch{}clearInterval(p),q.delete(e),n&&(n.textContent="\u25A0 Gestopt",n.className="q-status q-pending orpheus-job-status"),d&&(d.disabled=!1,d.textContent="\u2B07 Download")},{once:!0})}async function ve(e){let t=document.getElementById("tidal-content");if(!t)return;let s=(e||"").trim(),a=s.startsWith("http")?ce(s):null;if(a){ge(s,a,t);return}if(s.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}t.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL (${x[r.orpheusPlatform]||r.orpheusPlatform})\u2026</div>`;try{let n=await k(s,r.orpheusPlatform),o=n.results||[];if(n.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(n.error)}</div>`;return}if(!o.length){t.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${i(s)}</strong>" via OrpheusDL.</div>`;return}let d=o.filter(c=>c.type==="album"),l=o.filter(c=>c.type==="track"),u=`<div class="orpheus-quality-row">${J(r.orpheusPlatform)}</div>`;d.length&&(u+=`<div class="section-title">Albums (${d.length})</div>
        <div class="tidal-grid">${d.map(R).join("")}</div>`),l.length&&(u+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${l.length})</div>
        <div class="tidal-grid">${l.map(R).join("")}</div>`),t.innerHTML=u,t.querySelector("#orpheus-quality")?.addEventListener("change",c=>{V(c.target.value)})}catch(n){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(n.message)}</div>`}}function ge(e,t,s){let a=x[t]||t,n=U[t]||"#888",o=J(t);s.innerHTML=`
    <div class="orpheus-url-card">
      <div class="orpheus-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${n}">${i(a)}</span>
        <div class="orpheus-url-text">${i(e)}</div>
      </div>
      <div class="orpheus-url-actions">
        ${o}
        <button class="tidal-dl-btn orpheus-dl-btn orpheus-url-dl-btn"
                data-orpheus-url="${i(e)}"
                data-orpheus-title="${i(e)}"
                data-orpheus-artist=""
                data-orpheus-platform="${i(t)}">
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
    </div>`,s.querySelector("#orpheus-quality")?.addEventListener("change",d=>{V(d.target.value)})}async function he(e){let t=document.getElementById("tidal-content");if(!t)return;let s=(e||"").trim();if(s.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let a=await m(`/api/tidarr/search?q=${encodeURIComponent(s)}`);if(r.tidalSearchResults=a.results||[],a.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(a.error)}</div>`;return}if(!r.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${i(s)}</strong>".</div>`;return}let n=r.tidalSearchResults.filter(l=>l.type==="album"),o=r.tidalSearchResults.filter(l=>l.type==="track"),d="";n.length&&(d+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(z).join("")}</div>`),o.length&&(d+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${o.length})</div>
        <div class="tidal-grid">${o.map(z).join("")}</div>`),t.innerHTML=d}catch(a){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(a.message)}</div>`}}function Ce(e,t=!1){let s={queued:"q-pending",pending:"q-pending",downloading:"q-active",processing:"q-active",completed:"q-done",done:"q-done",error:"q-error",failed:"q-error"}[String(e.status||"").toLowerCase()]||"q-pending",a=typeof e.progress=="number"?Math.round(e.progress):null,n=a!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${a}%"></div></div>
       <div class="q-pct">${a}%</div>`:"",o=t?"":`<button class="q-remove" data-qid="${i(e.id)}" title="Verwijder uit queue">\u2715</button>`;return`
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${i(e.title||"(onbekend)")}</div>
        ${e.artist?`<div class="q-artist artist-link" data-artist="${i(e.artist)}">${i(e.artist)}</div>`:""}
        <span class="q-status ${s}">${i(e.status||"queued")}</span>
      </div>
      ${n}${o}
    </div>`}function Z(){let e=document.getElementById("tidal-content");if(!e)return;let t=r.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},a={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let o=a[n.status]||"q-pending",d=s[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,p=l!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${l}%"></div></div><div class="q-pct">${l}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${i(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist" data-artist="${i(n.artist)}">${i(n.artist)}</div>`:""}
          <span class="q-status ${o}">${i(d)}</span>
        </div>
        ${p}
        <button class="q-remove" data-qid="${i(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function Y(){let e=document.getElementById("tidal-content");if(e){e.innerHTML=_(5);try{let t=await m("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let s={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
      <div class="section-title">${t.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${t.map(a=>{let n=a.queued_at?new Date(a.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",o=s[a.quality]||a.quality||"",d=a.image||a.cover||a.album_art||"";return`<div class="q-row">
          ${d?`<img class="q-thumb" src="${i(d)}" alt="${i(a.title)} by ${i(a.artist)}" loading="lazy" decoding="async">`:`<div class="q-thumb q-thumb-ph" style="background:${b(a.title||a.artist||"?")}">${h(a.title||a.artist||"?")}</div>`}
          <div class="q-info">
            <div class="q-title">${i(a.title)}</div>
            ${a.artist?`<div class="q-artist artist-link" data-artist="${i(a.artist)}">${i(a.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${o?" \xB7 "+o:""}${n?" \xB7 "+n:""}</span>
          </div>
          <button class="q-remove" data-dlid="${a.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await $("/api/downloads",{method:"DELETE"})}catch(a){a.name}for(let a of t)try{await $(`/api/downloads/${a.id}`,{method:"DELETE"})}catch(n){n.name}r.downloadedSet.clear(),Y()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(t.message)}</div>`}}}function K(e){r.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(s=>{let a=s.dataset.tidalView===e;s.classList.toggle("sel-def",a),s.setAttribute("aria-selected",a?"true":"false")});let t=document.getElementById("tidal-search-wrap");if(t&&(t.style.display=e==="search"?"":"none"),e==="search"){let s=document.getElementById("tidal-search")?.value||"";r.downloadEngine==="orpheus"?ve(s):he(s)}else e==="queue"?Z():e==="history"&&Y()}function W(){if(r.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");r.tidarrSseSource=e,e.onmessage=t=>{try{r.tidarrQueueItems=JSON.parse(t.data)||[]}catch{r.tidarrQueueItems=[]}let s=r.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of a)n&&(s.length>0?(n.textContent=s.length,n.style.display=""):n.style.display="none");if(be(r.tidarrQueueItems),r.activeView==="downloads"&&r.tidalView==="queue"&&Z(),document.getElementById("queue-popover")?.classList.contains("open")&&te(),r.activeView==="nu"){let n=document.getElementById("wbody-download-voortgang");n&&me(n,s)}window.dispatchEvent(new CustomEvent("tidarr-queue-update"))},e.onerror=()=>{e.close(),r.tidarrSseSource=null,setTimeout(W,1e4)}}function He(){r.tidarrSseSource&&(r.tidarrSseSource.close(),r.tidarrSseSource=null)}function me(e,t){if(t||(t=r.tidarrQueueItems.filter(a=>a.status!=="finished"&&a.status!=="error")),!t.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};e.innerHTML=`<div class="w-queue-list">${t.slice(0,5).map(a=>{let n=a.progress?.current&&a.progress?.total?Math.round(a.progress.current/a.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${i(a.title||"(onbekend)")}</div>
      ${a.artist?`<div class="w-q-artist" data-artist="${i(a.artist)}">${i(a.artist)}</div>`:""}
      ${n!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${n}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${n}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${i(s[a.status]||a.status)}</span>`}
    </div></div>`}).join("")}${t.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${t.length-5} meer</div>`:""}</div>`}function X(){W()}function De(){}function ye(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),s=document.getElementById("content");t.style.display="flex",s.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function ee(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function be(e){let t=document.getElementById("queue-fab"),s=document.getElementById("fab-queue-badge");if(!t)return;let a=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",a.length>0?(s.textContent=a.length,s.style.display=""):s.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function te(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=r.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},a={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let o=a[n.status]||"q-pending",d=s[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,p=l!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${l}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${i(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist" data-artist="${i(n.artist)}">${i(n.artist)}</div>`:""}
      <span class="q-status ${o}">${i(d)}</span>
      ${p}
    </div>`}).join("")}function we(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&te()}function S(){document.getElementById("queue-popover")?.classList.remove("open")}function j(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function B(e,t){let s=j(e),a=j(t);return!s||!a?!0:s===a||s.includes(a)||a.includes(s)}function se(e,t,s,a){return new Promise(n=>{r.dlResolve=n;let o=document.getElementById("dl-confirm-modal"),d=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${s}"${t?" \u2013 "+t:""}`,d.innerHTML=e.map((l,p)=>{let u=!B(l.artist,t),c=l.image?`<img class="dlc-img" src="${i(l.image)}" alt="" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${h(l.title)}</div>`:`<div class="dlc-ph">${h(l.title)}</div>`,f=u?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${i(l.artist)}</div>`:`<div class="dlc-artist">${i(l.artist)}</div>`,v=l.score??0;return`
        <button class="dlc-card${p===0?" dlc-best":""}" data-dlc-idx="${p}">
          <div class="dlc-cover">${c}</div>
          <div class="dlc-info">
            <div class="dlc-title">${i(l.title)}</div>
            ${f}
            <div class="dlc-meta">${l.year?i(l.year):""}${l.year&&l.tracks?" \xB7 ":""}${l.tracks?l.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${v}%"></div></div>
            <div class="dlc-score-label">${v}% overeenkomst</div>
          </div>
          ${p===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),d.querySelectorAll(".dlc-card").forEach(l=>{l.addEventListener("click",()=>{let p=parseInt(l.dataset.dlcIdx);C(),n({chosen:e[p],btn:a})})}),o.classList.add("open"),document.body.style.overflow="hidden"})}function C(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",r.dlResolve&&(r.dlResolve({chosen:null}),r.dlResolve=null)}async function Q(e,t,s,a){let n=await $("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||s||"",artist:e.artist||t||"",id:String(e.id||""),quality:ue()})}),o=await n.json();if(!n.ok||!o.ok)throw new Error(o.error||"download mislukt");L(e.artist||t||"",e.title||s||""),a&&(a.textContent="\u2713",a.classList.add("dl-done"),a.disabled=!1),await G()}async function Oe(e,t,s){if(!r.orpheusConnected){alert("OrpheusDL is niet verbonden. Controleer de OrpheusDL-instellingen.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let a=[e,t].filter(Boolean).join(" "),o=(await k(a,r.orpheusPlatform||"all")).results||[];if(!o.length){alert(`Niet gevonden via OrpheusDL: "${t}"${e?" van "+e:""}

Probeer handmatig via de Downloads-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let d=c=>{let f=0,v=(c.artist||"").toLowerCase(),g=(c.title||"").toLowerCase(),y=(e||"").toLowerCase(),w=(t||"").toLowerCase();return v&&y&&(v===y?f+=100:v.includes(y)||y.includes(v)?f+=60:f-=50),g&&w&&(g===w?f+=80:(g.includes(w)||w.includes(g))&&(f+=40)),c.type==="album"&&(f+=30),["qobuz","tidal","deezer"].includes(c.platform)&&(f+=20),/remix|original mix|live|remaster/i.test(g)&&!/remix|live|remaster/i.test(w)&&(f-=30),f};o.sort((c,f)=>d(f)-d(c));let l=F(),p=async c=>{let f=await O(c.url,l,c.title,c.artist);if(!f.ok)throw new Error(f.error||"download mislukt");L(c.artist||e,c.title||t);let v=s?.closest(".orpheus-card, .gaps-artist-card");f.jobId&&v?(r.activeOrpheusJobs=r.activeOrpheusJobs||[],r.activeOrpheusJobs.push({jobId:f.jobId,title:c.title,artist:c.artist,status:"pending",progress:0}),window.dispatchEvent(new CustomEvent("orpheus-jobs-update")),fe(f.jobId,v)):s&&(s.textContent="\u2713",s.classList.add("dl-done"),s.disabled=!1)},u=o[0];if(e&&!B(u.artist,e)){s&&(s.disabled=!1,s.textContent="\u2B07");let c=o.slice(0,3).map(v=>({title:v.title,artist:v.artist,url:v.url,image:v.image,year:v.year,score:d(v)})),{chosen:f}=await se(c,e,t,s);if(!f)return;s&&(s.disabled=!0,s.textContent="\u2026"),await p(f)}else await p(u)}catch(a){alert("OrpheusDL downloaden mislukt: "+a.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function Me(e,t,s){if(!r.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let a=new URLSearchParams;e&&a.set("artist",e),t&&a.set("album",t);let n=await $(`/api/tidarr/candidates?${a}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let{candidates:o}=await n.json();if(!o?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let d=o[0];if(e&&!B(d.artist,e)){s&&(s.disabled=!1,s.textContent="\u2B07");let{chosen:l}=await se(o,e,t,s);if(!l)return;s&&(s.disabled=!0,s.textContent="\u2026"),await Q(l,e,t,s)}else await Q(d,e,t,s)}catch(a){alert("Downloaden mislukt: "+a.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function ae(){let e=r.downloadEngine==="orpheus",t=x[r.orpheusPlatform]||r.orpheusPlatform,s=e?`Zoek via OrpheusDL${r.orpheusPlatform!=="all"?" \xB7 "+t:""}\u2026 of plak een URL`:"Zoek albums of tracks op Tidal\u2026";E(`
    <div class="tidal-page">
      <div class="tidal-tabs-row">
        <div class="seg-tabs" role="tablist" aria-label="Downloads secties">
          <button class="tool-btn sel-def" data-tidal-view="search" role="tab" aria-selected="true">Zoeken</button>
          <button class="tool-btn" data-tidal-view="queue" role="tab" aria-selected="false">Queue <span class="badge-inline" id="badge-tidarr-queue-inline" style="display:none">0</span></button>
          <button class="tool-btn" data-tidal-view="history" role="tab" aria-selected="false">Geschiedenis</button>
        </div>
        <div class="tidal-tabs-actions">
          <span class="tidarr-status-pill off" id="tidarr-status-pill"><span class="tidarr-dot"></span><span id="tidarr-status-text">Tidarr status\u2026</span></span>
          ${e?'<span class="tidarr-status-pill off" id="orpheus-status-pill"><span class="tidarr-dot"></span><span id="orpheus-status-text">OrpheusDL status\u2026</span></span>':""}
          <button class="tool-btn" id="btn-open-tidarr" type="button">Open Tidarr</button>
        </div>
      </div>
      ${e?`<div class="orpheus-engine-banner">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        Download engine: <strong>OrpheusDL</strong>${r.orpheusPlatform!=="all"?` \xB7 Platform: <strong>${i(t)}</strong>`:""}
        \u2014 <button class="orpheus-engine-settings-link" type="button">Wijzig in \u2699 Instellingen</button>
      </div>`:""}
      <div class="tidal-search-wrap" id="tidal-search-wrap">
        <input id="tidal-search" class="tidal-search" type="search"
               placeholder="${i(s)}" autocomplete="off">
      </div>
      <div id="tidal-content"><div class="empty">Begin met typen om te zoeken${e?" via OrpheusDL":" op Tidal"}.</div></div>
    </div>
  `),document.querySelector(".orpheus-engine-settings-link")?.addEventListener("click",()=>{document.querySelector(".sidebar-settings-btn")?.click()});let a=()=>{r.activeView==="downloads"&&ae()};document.addEventListener("engine:changed",a,{once:!0}),document.addEventListener("platform:changed",a,{once:!0}),await pe(),e&&await $e(),await G(),K(r.tidalView),X()}async function $e(){let e=document.getElementById("orpheus-status-pill"),t=document.getElementById("orpheus-status-text");if(!(!e||!t))try{let{apiFetch:s}=await import("./api-UQ7J27AP.js"),a=await s("/api/orpheus/status");r.orpheusConnected=!!a.connected,e.className=`tidarr-status-pill ${a.connected?"on":"off"}`,t.textContent=a.connected?"OrpheusDL \xB7 verbonden":"OrpheusDL offline"}catch{r.orpheusConnected=!1,e&&(e.className="tidarr-status-pill off"),t&&(t.textContent="OrpheusDL offline")}}function Ae(){r.activeView="downloads",ee(),ae()}var H={tidarr:{label:"Tidal (Tidarr)",color:"#33ffe7",short:"TIDAL"},orpheus_tidal:{label:"Tidal",color:"#33ffe7",short:"TIDAL"},orpheus_qobuz:{label:"Qobuz",color:"#0070ef",short:"QOBUZ"},orpheus_deezer:{label:"Deezer",color:"#a238ff",short:"DEEZER"},orpheus_spotify:{label:"Spotify",color:"#1cc659",short:"SPOTIFY"},orpheus_soundcloud:{label:"SoundCloud",color:"#ff5502",short:"SC"},orpheus_applemusic:{label:"Apple Music",color:"#FA586A",short:"APPLE"},orpheus_beatport:{label:"Beatport",color:"#00ff89",short:"BEAT"},orpheus_beatsource:{label:"Beatsource",color:"#16a8f4",short:"BSRC"},orpheus_youtube:{label:"YouTube",color:"#FF0000",short:"YT"}};function ne(e){return H[e]?.label||e}function D(e){return H[e]?.color||"#888"}function qe(e){return H[e]?.short||e.toUpperCase()}async function ie(e){if(e){e.innerHTML='<div class="src-loading">Status laden\u2026</div>';try{let s=(await m("/api/download/status")).sources||[];if(!s.length){e.innerHTML="";return}let a=s.filter(n=>n.enabled!==!1);e.innerHTML=`
      <div class="src-status-bar">
        ${a.map(n=>{let o=n.available===!0?"src-dot-ok":n.available===!1?"src-dot-err":"src-dot-unk",d=D(n.name);return`<span class="src-pill" title="${i(n.label||n.name)}${n.errorCount>0?" \xB7 "+n.errorCount+" fouten":""}">
            <span class="src-dot ${o}" style="--src-color:${d}"></span>
            <span class="src-pill-label">${i(qe(n.name))}</span>
          </span>`}).join("")}
        <button class="src-refresh-btn tool-btn" type="button" title="Herlaad status" aria-label="Herlaad bron-status">\u21BA</button>
      </div>`,e.querySelector(".src-refresh-btn")?.addEventListener("click",()=>ie(e))}catch{e.innerHTML='<span class="src-pill"><span class="src-dot src-dot-err"></span> Status onbekend</span>'}}}function N(e){let t=e.source||"unknown",s=D(t),a=ne(t),n=e.image?`<img class="tidal-img" src="${i(e.image)}" alt="${i(e.title)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(e.title)}">${h(e.title)}</div>`:`<div class="tidal-ph" style="background:${b(e.title)}">${h(e.title)}</div>`,o=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card unified-card"
         data-unified-source="${i(t)}"
         data-unified-url="${i(e.url||"")}"
         data-unified-title="${i(e.title)}"
         data-unified-artist="${i(e.artist||"")}"
         data-unified-type="${i(e.type||"album")}"
         data-unified-id="${i(String(e.id||""))}"
         data-unified-platform="${i(e.platform||"")}">
      <div class="tidal-cover">${n}</div>
      <div class="tidal-info">
        <div class="tidal-title">${i(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${i(e.artist||"")}">${i(e.artist||"")}</div>
        <div class="tidal-meta">${i(o)}</div>
      </div>
      <div class="unified-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${s}">${i(a)}</span>
        <button class="tidal-dl-btn unified-dl-btn" title="Download via ${i(a)}">\u2B07 Download</button>
      </div>
    </div>`}async function T(e){let t=document.getElementById("unified-content");if(!t)return;let s=(e||"").trim();if(s.length<2){t.innerHTML='<div class="empty">Begin met typen om over alle bronnen te zoeken.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken via alle bronnen\u2026</div>';try{let a=document.getElementById("unified-type-sel")?.value||"album",n=await m(`/api/download/search?q=${encodeURIComponent(s)}&type=${a}`),o=n.results||[];if(n.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(n.error)}</div>`;return}if(!o.length){t.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${i(s)}</strong>" via alle bronnen.</div>`;return}let d=o.filter(u=>u.type==="album"),l=o.filter(u=>u.type==="track"),p=`<div class="unified-results-info">${o.length} resultaten over ${new Set(o.map(u=>u.source)).size} bronnen</div>`;d.length&&(p+=`<div class="section-title">Albums (${d.length})</div>
        <div class="tidal-grid">${d.map(N).join("")}</div>`),l.length&&(p+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${l.length})</div>
        <div class="tidal-grid">${l.map(N).join("")}</div>`),t.innerHTML=p,t.querySelectorAll(".unified-dl-btn").forEach(u=>{u.addEventListener("click",async()=>{let c=u.closest(".unified-card"),f=c.dataset.unifiedSource,v=c.dataset.unifiedUrl,g=c.dataset.unifiedTitle,y=c.dataset.unifiedArtist,w=c.dataset.unifiedType;u.disabled=!0,u.textContent="\u2026";try{await Le({artist:y,album:g,type:w,source:f,url:v}),u.textContent="\u2713",u.classList.add("dl-done")}catch(le){u.disabled=!1,u.textContent="\u2B07 Download",alert("Download mislukt: "+le.message)}})})}catch(a){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(a.message)}</div>`}}async function Le({artist:e,album:t,track:s,type:a="album",quality:n,source:o="auto",url:d}){let l=n||localStorage.getItem("downloadQuality")||"flac",u=await fetch("/api/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({artist:e,album:t,track:s,type:a,quality:l,source:o})}),c=await u.json();if(!u.ok&&u.status>=500)throw new Error(c.error||"Orchestrator fout");if(c.status==="failed")throw new Error(c.error||"Alle bronnen mislukt");return L(e||"",t||s||""),c}async function oe(){let e=document.getElementById("unified-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Queue laden\u2026</div>';try{let s=(await m("/api/download/queue")).jobs||[];if(!s.length){e.innerHTML='<div class="empty">Geen actieve downloads in de orchestrator queue.</div>';return}e.innerHTML=`
      <div class="section-title">${s.length} actieve download${s.length!==1?"s":""}</div>
      <div class="q-list">${s.map(a=>re(a,!1)).join("")}</div>`,e.querySelectorAll(".unified-retry-btn").forEach(a=>{a.addEventListener("click",async()=>{let n=a.dataset.jobId;a.disabled=!0,a.textContent="\u2026";try{await fetch(`/api/download/retry/${n}`,{method:"POST"}),await oe()}catch{a.disabled=!1,a.textContent="Retry"}})})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(t.message)}</div>`}}}async function I(){let e=document.getElementById("unified-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis laden\u2026</div>';try{let s=(await m("/api/download/history?limit=100")).jobs||[];if(!s.length){e.innerHTML='<div class="empty">Nog geen downloads via de orchestrator.</div>';return}let a=s.filter(n=>n.status==="failed").length;e.innerHTML=`
      <div class="section-title">${s.length} downloads
        ${a>0?`<button class="tool-btn" id="retry-all-btn" style="margin-left:auto;font-size:11px">\u21BA Herstart ${a} mislukt</button>`:""}
      </div>
      <div class="q-list">${s.map(n=>re(n,!0)).join("")}</div>`,document.getElementById("retry-all-btn")?.addEventListener("click",async n=>{let o=n.currentTarget;o.disabled=!0,o.textContent="\u2026";try{let d=await fetch("/api/download/retry-all",{method:"POST"}).then(l=>l.json());o.textContent=`\u21BA ${d.retried} herstart`,setTimeout(()=>I(),2e3)}catch{o.disabled=!1,o.textContent="Fout"}}),e.querySelectorAll(".unified-retry-btn").forEach(n=>{n.addEventListener("click",async()=>{let o=n.dataset.jobId;n.disabled=!0,n.textContent="\u2026";try{await fetch(`/api/download/retry/${o}`,{method:"POST"}),await I()}catch{n.disabled=!1,n.textContent="Retry"}})})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${i(t.message)}</div>`}}}function re(e,t){let s={pending:{cls:"q-pending",lbl:"In wachtrij"},running:{cls:"q-active",lbl:"Bezig\u2026"},completed:{cls:"q-done",lbl:"\u2713 Voltooid"},failed:{cls:"q-error",lbl:"\u2717 Mislukt"}},{cls:a,lbl:n}=s[e.status]||{cls:"q-pending",lbl:e.status},o=e.source_used||e.source_requested||"auto",d=D(o),l=ne(o),p=e.created_at?new Date(e.created_at*1e3).toLocaleDateString("nl-NL",{day:"numeric",month:"short"}):"",u=t&&e.status==="failed"?`<button class="tool-btn unified-retry-btn" data-job-id="${e.id}" title="Opnieuw proberen">\u21BA Retry</button>`:"",c=e.status==="failed"&&e.error_log?`<div class="unified-job-err" title="${i(e.error_log)}">${i(e.error_log.slice(0,80))}${e.error_log.length>80?"\u2026":""}</div>`:"";return`
    <div class="q-row">
      <div class="q-info" style="flex:1">
        <div class="q-title">${i(e.album||e.track||"(onbekend)")}</div>
        ${e.artist?`<div class="q-artist artist-link" data-artist="${i(e.artist)}">${i(e.artist)}</div>`:""}
        <div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap">
          <span class="q-status ${a}">${i(n)}</span>
          ${o!=="auto"&&o!=="none"?`<span class="orpheus-platform-badge" style="--badge-color:${d};font-size:10px;padding:1px 6px">${i(l)}</span>`:""}
          ${p?`<span style="font-size:10px;color:var(--muted2)">${i(p)}</span>`:""}
          ${e.attempts>1?`<span style="font-size:10px;color:var(--muted2)">${e.attempts}\xD7 geprobeerd</span>`:""}
        </div>
        ${c}
      </div>
      ${u}
    </div>`}function xe(e){r.unifiedView=e,document.querySelectorAll("[data-unified-view]").forEach(s=>{let a=s.dataset.unifiedView===e;s.classList.toggle("sel-def",a),s.setAttribute("aria-selected",a?"true":"false")});let t=document.getElementById("unified-search-wrap");if(t&&(t.style.display=e==="search"?"":"none"),e==="search"){let s=document.getElementById("unified-search")?.value||"";if(s.length>=2)T(s);else{let a=document.getElementById("unified-content");a&&(a.innerHTML='<div class="empty">Begin met typen om over alle bronnen te zoeken.</div>')}}else e==="queue"?oe():e==="history"&&I()}async function Ee(){E(`
    <div class="tidal-page">

      <!-- Bron-status balk -->
      <div id="src-status-container" class="src-status-container"></div>

      <!-- Unified sectie tabs -->
      <div class="tidal-tabs-row" style="margin-top:8px">
        <div class="seg-tabs" role="tablist" aria-label="Download secties">
          <button class="tool-btn sel-def" data-unified-view="search" role="tab" aria-selected="true">\u{1F50D} Zoeken</button>
          <button class="tool-btn" data-unified-view="queue" role="tab" aria-selected="false">\u23F3 Queue</button>
          <button class="tool-btn" data-unified-view="history" role="tab" aria-selected="false">\u{1F4CB} Geschiedenis</button>
        </div>
        <div class="tidal-tabs-actions">
          <button class="tool-btn" id="btn-open-tidarr" type="button">Open Tidarr UI</button>
        </div>
      </div>

      <!-- Unified zoekbalk -->
      <div class="tidal-search-wrap" id="unified-search-wrap">
        <input id="unified-search" class="tidal-search" type="search"
               placeholder="Zoek albums of tracks via alle bronnen\u2026" autocomplete="off">
        <select id="unified-type-sel" class="orpheus-quality-sel" style="margin-left:8px;min-width:90px"
                title="Type" aria-label="Zoek type">
          <option value="album">Albums</option>
          <option value="track">Tracks</option>
        </select>
      </div>

      <div id="unified-content">
        <div class="empty">Begin met typen om over alle bronnen te zoeken.</div>
      </div>

      <!-- Tidarr iframe (verborgen) -->
      <div id="tidarr-ui-wrap" style="display:none;flex-direction:column;height:80vh">
        <button class="tool-btn" id="btn-tidarr-close" style="margin-bottom:8px">\u2190 Terug</button>
        <iframe id="tidarr-iframe" data-src="/tidarr-ui" style="flex:1;border:none;border-radius:8px"></iframe>
      </div>
    </div>
  `),ie(document.getElementById("src-status-container")),document.querySelectorAll("[data-unified-view]").forEach(t=>{t.addEventListener("click",()=>xe(t.dataset.unifiedView))});let e;document.getElementById("unified-search")?.addEventListener("input",t=>{clearTimeout(e),e=setTimeout(()=>T(t.target.value),500)}),document.getElementById("unified-type-sel")?.addEventListener("change",()=>{let t=document.getElementById("unified-search")?.value||"";t.length>=2&&T(t)}),document.getElementById("btn-open-tidarr")?.addEventListener("click",ye),document.getElementById("btn-tidarr-close")?.addEventListener("click",()=>{document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}),X()}function _e(){r.activeView="downloads",ee(),Ee()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{C()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&C()});document.getElementById("queue-fab")?.addEventListener("click",we);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),S()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{S(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>K("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),s=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!s?.contains(e.target)&&S()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});export{F as a,ue as b,pe as c,G as d,z as e,R as f,fe as g,ve as h,he as i,Ce as j,Z as k,Y as l,K as m,W as n,He as o,me as p,X as q,De as r,ye as s,ee as t,be as u,te as v,we as w,S as x,j as y,B as z,se as A,C as B,Q as C,Oe as D,Me as E,ae as F,Ae as G,ie as H,N as I,T as J,Le as K,oe as L,I as M,xe as N,Ee as O,_e as P};
