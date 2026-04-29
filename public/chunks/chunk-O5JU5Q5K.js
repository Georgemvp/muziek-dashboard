import{b as S}from"./chunk-2UCV5F4T.js";import{G as k,I,J as T,a as h,f as v,h as n,j as g,p as x,s as E,z as y}from"./chunk-HCN2ZK5I.js";import{a as r}from"./chunk-2BMKGNH5.js";var M={tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},w={tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},B={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},J=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function G(t){for(let{pattern:e,platform:a}of J)if(e.test(t))return a;return null}function K(){return localStorage.getItem("orpheusQuality")||"hifi"}function P(t){localStorage.setItem("orpheusQuality",t)}function A(t){let e=B[t]||B.all,a=K();return`
    <label class="orpheus-quality-wrap" title="Download kwaliteit">
      <select id="orpheus-quality" class="orpheus-quality-sel" aria-label="Kwaliteit kiezen">
        ${e.map(([s,o])=>`<option value="${s}"${s===a?" selected":""}>${o}</option>`).join("")}
      </select>
    </label>`}function W(){return localStorage.getItem("downloadQuality")||"high"}async function Z(){let t=r.tabAbort?.signal;try{let e=await y("/api/tidarr/status",{signal:t});if(t?.aborted)return;let a=document.getElementById("tidarr-status-pill"),s=document.getElementById("tidarr-status-text");r.tidarrOk=!!e.connected,a&&s&&(a.className=`tidarr-status-pill ${r.tidarrOk?"on":"off"}`,s.textContent=r.tidarrOk?`Tidarr \xB7 verbonden${e.quality?" \xB7 "+e.quality:""}`:"Tidarr offline")}catch(e){if(e.name==="AbortError")return;r.tidarrOk=!1;let a=document.getElementById("tidarr-status-text");a&&(a.textContent="Tidarr offline")}}async function j(){let t=r.tabAbort?.signal;try{let e=await y("/api/tidarr/queue",{signal:t});if(t?.aborted)return;let a=(e.items||[]).length,s=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let o of s)o&&(a>0?(o.textContent=a,o.style.display=""):o.style.display="none")}catch(e){if(e.name==="AbortError")return}}function H(t){let e=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${g(t.title)}">${v(t.title)}</div>`:`<div class="tidal-ph" style="background:${g(t.title)}">${v(t.title)}</div>`,a=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null,t.tracks?`${t.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${e}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>
        <div class="tidal-meta">${n(a)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${n(t.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}function D(t){let e=t.platform||"unknown",a=M[e]||"#888",s=w[e]||e,o=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${g(t.title)}">${v(t.title)}</div>`:`<div class="tidal-ph" style="background:${g(t.title)}">${v(t.title)}</div>`,d=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null,t.tracks?`${t.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card orpheus-card" data-orpheus-jobid="">
      <div class="tidal-cover">${o}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>
        <div class="tidal-meta">${n(d)}</div>
      </div>
      <div class="orpheus-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${a}">${n(s)}</span>
        <button class="tidal-dl-btn orpheus-dl-btn"
                data-orpheus-url="${n(t.url||"")}"
                data-orpheus-title="${n(t.title)}"
                data-orpheus-artist="${n(t.artist)}"
                data-orpheus-platform="${n(e)}"
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
    </div>`}var b=new Map;function gt(t,e){if(b.has(t))return;let a=e?.querySelector(".orpheus-progress-wrap"),s=e?.querySelector(".orpheus-bar-fill"),o=e?.querySelector(".orpheus-job-status"),d=e?.querySelector(".orpheus-pct"),l=e?.querySelector(".orpheus-dl-btn"),i=e?.querySelector(".orpheus-stop-btn");a&&(a.style.display=""),l&&(l.disabled=!0,l.textContent="\u2026");let c=setInterval(async()=>{try{let u=await I(t),p=typeof u.progress=="number"?Math.round(u.progress):0;s&&(s.style.width=`${p}%`),d&&(d.textContent=`${p}%`);let f={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}}[u.status]||{label:u.status,cls:"q-pending"};if(o&&(o.textContent=f.label,o.className=`q-status ${f.cls} orpheus-job-status`),u.status==="done"||u.status==="error"||u.status==="stopped")clearInterval(c),b.delete(t),i&&(i.style.display="none"),u.status==="done"&&l?(l.textContent="\u2713",l.classList.add("dl-done")):l&&(l.disabled=!1,l.textContent="\u2B07 Download"),r.activeOrpheusJobs=r.activeOrpheusJobs.filter(m=>m.jobId!==t);else{let m=r.activeOrpheusJobs.find(U=>U.jobId===t);m&&(m.progress=p,m.status=u.status)}}catch{clearInterval(c),b.delete(t)}},800);b.set(t,c),i?.addEventListener("click",async()=>{try{await T(t)}catch{}clearInterval(c),b.delete(t),o&&(o.textContent="\u25A0 Gestopt",o.className="q-status q-pending orpheus-job-status"),l&&(l.disabled=!1,l.textContent="\u2B07 Download")},{once:!0})}async function Y(t){let e=document.getElementById("tidal-content");if(!e)return;let a=(t||"").trim(),s=a.startsWith("http")?G(a):null;if(s){X(a,s,e);return}if(a.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}e.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL (${w[r.orpheusPlatform]||r.orpheusPlatform})\u2026</div>`;try{let o=await k(a,r.orpheusPlatform),d=o.results||[];if(o.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(o.error)}</div>`;return}if(!d.length){e.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${n(a)}</strong>" via OrpheusDL.</div>`;return}let l=d.filter(p=>p.type==="album"),i=d.filter(p=>p.type==="track"),u=`<div class="orpheus-quality-row">${A(r.orpheusPlatform)}</div>`;l.length&&(u+=`<div class="section-title">Albums (${l.length})</div>
        <div class="tidal-grid">${l.map(D).join("")}</div>`),i.length&&(u+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${i.length})</div>
        <div class="tidal-grid">${i.map(D).join("")}</div>`),e.innerHTML=u,e.querySelector("#orpheus-quality")?.addEventListener("change",p=>{P(p.target.value)})}catch(o){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(o.message)}</div>`}}function X(t,e,a){let s=w[e]||e,o=M[e]||"#888",d=A(e);a.innerHTML=`
    <div class="orpheus-url-card">
      <div class="orpheus-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${o}">${n(s)}</span>
        <div class="orpheus-url-text">${n(t)}</div>
      </div>
      <div class="orpheus-url-actions">
        ${d}
        <button class="tidal-dl-btn orpheus-dl-btn orpheus-url-dl-btn"
                data-orpheus-url="${n(t)}"
                data-orpheus-title="${n(t)}"
                data-orpheus-artist=""
                data-orpheus-platform="${n(e)}">
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
    </div>`,a.querySelector("#orpheus-quality")?.addEventListener("change",l=>{P(l.target.value)})}async function tt(t){let e=document.getElementById("tidal-content");if(!e)return;let a=(t||"").trim();if(a.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}e.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let s=await y(`/api/tidarr/search?q=${encodeURIComponent(a)}`);if(r.tidalSearchResults=s.results||[],s.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(s.error)}</div>`;return}if(!r.tidalSearchResults.length){e.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${n(a)}</strong>".</div>`;return}let o=r.tidalSearchResults.filter(i=>i.type==="album"),d=r.tidalSearchResults.filter(i=>i.type==="track"),l="";o.length&&(l+=`<div class="section-title">Albums (${o.length})</div>
        <div class="tidal-grid">${o.map(H).join("")}</div>`),d.length&&(l+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(H).join("")}</div>`),e.innerHTML=l}catch(s){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(s.message)}</div>`}}function ft(t,e=!1){let a={queued:"q-pending",pending:"q-pending",downloading:"q-active",processing:"q-active",completed:"q-done",done:"q-done",error:"q-error",failed:"q-error"}[String(t.status||"").toLowerCase()]||"q-pending",s=typeof t.progress=="number"?Math.round(t.progress):null,o=s!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${s}%"></div></div>
       <div class="q-pct">${s}%</div>`:"",d=e?"":`<button class="q-remove" data-qid="${n(t.id)}" title="Verwijder uit queue">\u2715</button>`;return`
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${n(t.title||"(onbekend)")}</div>
        ${t.artist?`<div class="q-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>`:""}
        <span class="q-status ${a}">${n(t.status||"queued")}</span>
      </div>
      ${o}${d}
    </div>`}function R(){let t=document.getElementById("tidal-content");if(!t)return;let e=r.tidarrQueueItems;if(!e.length){t.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},s={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};t.innerHTML=`
    <div class="section-title">${e.length} item${e.length!==1?"s":""} in queue</div>
    <div class="q-list">${e.map(o=>{let d=s[o.status]||"q-pending",l=a[o.status]||o.status||"In wachtrij",i=o.progress?.current&&o.progress?.total?Math.round(o.progress.current/o.progress.total*100):null,c=i!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${i}%"></div></div><div class="q-pct">${i}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${n(o.title||"(onbekend)")}</div>
          ${o.artist?`<div class="q-artist">${n(o.artist)}</div>`:""}
          <span class="q-status ${d}">${n(l)}</span>
        </div>
        ${c}
        <button class="q-remove" data-qid="${n(o.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function z(){let t=document.getElementById("tidal-content");if(t){t.innerHTML=S(5);try{let e=await y("/api/downloads");if(!e.length){t.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let a={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};t.innerHTML=`
      <div class="section-title">${e.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${e.map(s=>{let o=s.queued_at?new Date(s.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",d=a[s.quality]||s.quality||"",l=s.image||s.cover||s.album_art||"";return`<div class="q-row">
          ${l?`<img class="q-thumb" src="${n(l)}" alt="${n(s.title)} by ${n(s.artist)}" loading="lazy" decoding="async">`:`<div class="q-thumb q-thumb-ph" style="background:${g(s.title||s.artist||"?")}">${v(s.title||s.artist||"?")}</div>`}
          <div class="q-info">
            <div class="q-title">${n(s.title)}</div>
            ${s.artist?`<div class="q-artist artist-link" data-artist="${n(s.artist)}">${n(s.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${d?" \xB7 "+d:""}${o?" \xB7 "+o:""}</span>
          </div>
          <button class="q-remove" data-dlid="${s.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await h("/api/downloads",{method:"DELETE"})}catch(s){s.name}for(let s of e)try{await h(`/api/downloads/${s.id}`,{method:"DELETE"})}catch(o){o.name}r.downloadedSet.clear(),z()}})}catch(e){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(e.message)}</div>`}}}function Q(t){r.tidalView=t,document.querySelectorAll("[data-tidal-view]").forEach(a=>{let s=a.dataset.tidalView===t;a.classList.toggle("sel-def",s),a.setAttribute("aria-selected",s?"true":"false")});let e=document.getElementById("tidal-search-wrap");if(e&&(e.style.display=t==="search"?"":"none"),t==="search"){let a=document.getElementById("tidal-search")?.value||"";r.downloadEngine==="orpheus"?Y(a):tt(a)}else t==="queue"?R():t==="history"&&z()}function _(){if(r.tidarrSseSource)return;let t=new EventSource("/api/tidarr/stream");r.tidarrSseSource=t,t.onmessage=e=>{try{r.tidarrQueueItems=JSON.parse(e.data)||[]}catch{r.tidarrQueueItems=[]}let a=r.tidarrQueueItems.filter(o=>o.status!=="finished"&&o.status!=="error"),s=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let o of s)o&&(a.length>0?(o.textContent=a.length,o.style.display=""):o.style.display="none");if(ot(r.tidarrQueueItems),r.activeView==="downloads"&&r.tidalView==="queue"&&R(),document.getElementById("queue-popover")?.classList.contains("open")&&F(),r.activeView==="nu"){let o=document.getElementById("wbody-download-voortgang");o&&et(o,a)}},t.onerror=()=>{t.close(),r.tidarrSseSource=null,setTimeout(_,1e4)}}function mt(){r.tidarrSseSource&&(r.tidarrSseSource.close(),r.tidarrSseSource=null)}function et(t,e){if(e||(e=r.tidarrQueueItems.filter(s=>s.status!=="finished"&&s.status!=="error")),!e.length){t.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};t.innerHTML=`<div class="w-queue-list">${e.slice(0,5).map(s=>{let o=s.progress?.current&&s.progress?.total?Math.round(s.progress.current/s.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${n(s.title||"(onbekend)")}</div>
      ${s.artist?`<div class="w-q-artist">${n(s.artist)}</div>`:""}
      ${o!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${o}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${o}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${n(a[s.status]||s.status)}</span>`}
    </div></div>`}).join("")}${e.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${e.length-5} meer</div>`:""}</div>`}function st(){_()}function ht(){}function yt(){let t=document.getElementById("tidarr-iframe"),e=document.getElementById("tidarr-ui-wrap"),a=document.getElementById("content");e.style.display="flex",a.style.display="none",t.dataset.loaded||(t.src=t.dataset.src,t.dataset.loaded="1")}function at(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function ot(t){let e=document.getElementById("queue-fab"),a=document.getElementById("fab-queue-badge");if(!e)return;let s=(t||[]).filter(o=>o.status!=="finished"&&o.status!=="error");t&&t.length>0?(e.style.display="",s.length>0?(a.textContent=s.length,a.style.display=""):a.style.display="none"):(e.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function F(){let t=document.getElementById("queue-popover-list");if(!t)return;let e=r.tidarrQueueItems;if(!e.length){t.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},s={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};t.innerHTML=e.map(o=>{let d=s[o.status]||"q-pending",l=a[o.status]||o.status||"In wachtrij",i=o.progress?.current&&o.progress?.total?Math.round(o.progress.current/o.progress.total*100):null,c=i!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${i}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${n(o.title||"(onbekend)")}</div>
      ${o.artist?`<div class="qpop-artist">${n(o.artist)}</div>`:""}
      <span class="q-status ${d}">${n(l)}</span>
      ${c}
    </div>`}).join("")}function nt(){let t=document.getElementById("queue-popover");if(!t)return;t.classList.toggle("open")&&F()}function q(){document.getElementById("queue-popover")?.classList.remove("open")}function O(t){return(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function N(t,e){let a=O(t),s=O(e);return!a||!s?!0:a===s||a.includes(s)||s.includes(a)}function rt(t,e,a,s){return new Promise(o=>{r.dlResolve=o;let d=document.getElementById("dl-confirm-modal"),l=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${a}"${e?" \u2013 "+e:""}`,l.innerHTML=t.map((i,c)=>{let u=!N(i.artist,e),p=i.image?`<img class="dlc-img" src="${n(i.image)}" alt="" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${v(i.title)}</div>`:`<div class="dlc-ph">${v(i.title)}</div>`,L=u?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${n(i.artist)}</div>`:`<div class="dlc-artist">${n(i.artist)}</div>`,f=i.score??0;return`
        <button class="dlc-card${c===0?" dlc-best":""}" data-dlc-idx="${c}">
          <div class="dlc-cover">${p}</div>
          <div class="dlc-info">
            <div class="dlc-title">${n(i.title)}</div>
            ${L}
            <div class="dlc-meta">${i.year?n(i.year):""}${i.year&&i.tracks?" \xB7 ":""}${i.tracks?i.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${f}%"></div></div>
            <div class="dlc-score-label">${f}% overeenkomst</div>
          </div>
          ${c===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),l.querySelectorAll(".dlc-card").forEach(i=>{i.addEventListener("click",()=>{let c=parseInt(i.dataset.dlcIdx);$(),o({chosen:t[c],btn:s})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function $(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",r.dlResolve&&(r.dlResolve({chosen:null}),r.dlResolve=null)}async function C(t,e,a,s){let o=await h("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:t.url,type:t.type||"album",title:t.title||a||"",artist:t.artist||e||"",id:String(t.id||""),quality:W()})}),d=await o.json();if(!o.ok||!d.ok)throw new Error(d.error||"download mislukt");x(t.artist||e||"",t.title||a||""),s&&(s.textContent="\u2713",s.classList.add("dl-done"),s.disabled=!1),await j()}async function bt(t,e,a){if(!r.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}a&&(a.disabled=!0,a.textContent="\u2026");try{let s=new URLSearchParams;t&&s.set("artist",t),e&&s.set("album",e);let o=await h(`/api/tidarr/candidates?${s}`);if(!o.ok){o.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${e}"${t?" van "+t:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let{candidates:d}=await o.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${e}"${t?" van "+t:""}`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let l=d[0];if(t&&!N(l.artist,t)){a&&(a.disabled=!1,a.textContent="\u2B07");let{chosen:i}=await rt(d,t,e,a);if(!i)return;a&&(a.disabled=!0,a.textContent="\u2026"),await C(i,t,e,a)}else await C(l,t,e,a)}catch(s){alert("Downloaden mislukt: "+s.message),a&&(a.disabled=!1,a.textContent="\u2B07")}}async function V(){let t=r.downloadEngine==="orpheus",e=w[r.orpheusPlatform]||r.orpheusPlatform,a=t?`Zoek via OrpheusDL${r.orpheusPlatform!=="all"?" \xB7 "+e:""}\u2026 of plak een URL`:"Zoek albums of tracks op Tidal\u2026";E(`
    <div class="tidal-page">
      <div class="tidal-tabs-row">
        <div class="seg-tabs" role="tablist" aria-label="Downloads secties">
          <button class="tool-btn sel-def" data-tidal-view="search" role="tab" aria-selected="true">Zoeken</button>
          <button class="tool-btn" data-tidal-view="queue" role="tab" aria-selected="false">Queue <span class="badge-inline" id="badge-tidarr-queue-inline" style="display:none">0</span></button>
          <button class="tool-btn" data-tidal-view="history" role="tab" aria-selected="false">Geschiedenis</button>
        </div>
        <div class="tidal-tabs-actions">
          <span class="tidarr-status-pill off" id="tidarr-status-pill"><span class="tidarr-dot"></span><span id="tidarr-status-text">Tidarr status\u2026</span></span>
          ${t?'<span class="tidarr-status-pill off" id="orpheus-status-pill"><span class="tidarr-dot"></span><span id="orpheus-status-text">OrpheusDL status\u2026</span></span>':""}
          <button class="tool-btn" id="btn-open-tidarr" type="button">Open Tidarr</button>
        </div>
      </div>
      ${t?`<div class="orpheus-engine-banner">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
        Download engine: <strong>OrpheusDL</strong>${r.orpheusPlatform!=="all"?` \xB7 Platform: <strong>${n(e)}</strong>`:""}
        \u2014 <button class="orpheus-engine-settings-link" type="button">Wijzig in \u2699 Instellingen</button>
      </div>`:""}
      <div class="tidal-search-wrap" id="tidal-search-wrap">
        <input id="tidal-search" class="tidal-search" type="search"
               placeholder="${n(a)}" autocomplete="off">
      </div>
      <div id="tidal-content"><div class="empty">Begin met typen om te zoeken${t?" via OrpheusDL":" op Tidal"}.</div></div>
    </div>
  `),document.querySelector(".orpheus-engine-settings-link")?.addEventListener("click",()=>{document.querySelector(".sidebar-settings-btn")?.click()});let s=()=>{r.activeView==="downloads"&&V()};document.addEventListener("engine:changed",s,{once:!0}),document.addEventListener("platform:changed",s,{once:!0}),await Z(),t&&await it(),await j(),Q(r.tidalView),st()}async function it(){let t=document.getElementById("orpheus-status-pill"),e=document.getElementById("orpheus-status-text");if(!(!t||!e))try{let{apiFetch:a}=await import("./api-UQ7J27AP.js"),s=await a("/api/orpheus/status");r.orpheusConnected=!!s.connected,t.className=`tidarr-status-pill ${s.connected?"on":"off"}`,e.textContent=s.connected?"OrpheusDL \xB7 verbonden":"OrpheusDL offline"}catch{r.orpheusConnected=!1,t&&(t.className="tidarr-status-pill off"),e&&(e.textContent="OrpheusDL offline")}}function wt(){r.activeView="downloads",at(),V()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{$()});document.getElementById("dl-confirm-modal")?.addEventListener("click",t=>{t.target===document.getElementById("dl-confirm-modal")&&$()});document.getElementById("queue-fab")?.addEventListener("click",nt);document.getElementById("qpop-close")?.addEventListener("click",t=>{t.stopPropagation(),q()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{q(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>Q("queue"),150)});document.addEventListener("click",t=>{let e=document.getElementById("queue-popover"),a=document.getElementById("queue-fab");e?.classList.contains("open")&&!e.contains(t.target)&&!a?.contains(t.target)&&q()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let t=document.getElementById("tidarr-iframe");t.src=t.dataset.src});export{K as a,W as b,Z as c,j as d,H as e,D as f,gt as g,Y as h,tt as i,ft as j,R as k,z as l,Q as m,_ as n,mt as o,et as p,st as q,ht as r,yt as s,at as t,ot as u,F as v,nt as w,q as x,O as y,N as z,rt as A,$ as B,C,bt as D,V as E,wt as F};
