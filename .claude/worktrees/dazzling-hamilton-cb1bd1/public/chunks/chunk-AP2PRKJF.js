import{b as O}from"./chunk-2UCV5F4T.js";import{G as E,H as C,I as B,J as D,a as w,f as h,h as n,j as y,p as x,s as S,z as q}from"./chunk-HCN2ZK5I.js";import{a as r}from"./chunk-2BMKGNH5.js";var z={tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},L={tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},H={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},Z=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function Y(t){for(let{pattern:e,platform:s}of Z)if(e.test(t))return s;return null}function R(){return localStorage.getItem("orpheusQuality")||"hifi"}function Q(t){localStorage.setItem("orpheusQuality",t)}function _(t){let e=H[t]||H.all,s=R();return`
    <label class="orpheus-quality-wrap" title="Download kwaliteit">
      <select id="orpheus-quality" class="orpheus-quality-sel" aria-label="Kwaliteit kiezen">
        ${e.map(([a,o])=>`<option value="${a}"${a===s?" selected":""}>${o}</option>`).join("")}
      </select>
    </label>`}function X(){return localStorage.getItem("downloadQuality")||"high"}async function tt(){let t=r.tabAbort?.signal;try{let e=await q("/api/tidarr/status",{signal:t});if(t?.aborted)return;let s=document.getElementById("tidarr-status-pill"),a=document.getElementById("tidarr-status-text");r.tidarrOk=!!e.connected,s&&a&&(s.className=`tidarr-status-pill ${r.tidarrOk?"on":"off"}`,a.textContent=r.tidarrOk?`Tidarr \xB7 verbonden${e.quality?" \xB7 "+e.quality:""}`:"Tidarr offline")}catch(e){if(e.name==="AbortError")return;r.tidarrOk=!1;let s=document.getElementById("tidarr-status-text");s&&(s.textContent="Tidarr offline")}}async function N(){let t=r.tabAbort?.signal;try{let e=await q("/api/tidarr/queue",{signal:t});if(t?.aborted)return;let s=(e.items||[]).length,a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let o of a)o&&(s>0?(o.textContent=s,o.style.display=""):o.style.display="none")}catch(e){if(e.name==="AbortError")return}}function j(t){let e=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${y(t.title)}">${h(t.title)}</div>`:`<div class="tidal-ph" style="background:${y(t.title)}">${h(t.title)}</div>`,s=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null,t.tracks?`${t.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${e}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>
        <div class="tidal-meta">${n(s)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${n(t.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}function M(t){let e=t.platform||"unknown",s=z[e]||"#888",a=L[e]||e,o=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${y(t.title)}">${h(t.title)}</div>`:`<div class="tidal-ph" style="background:${y(t.title)}">${h(t.title)}</div>`,d=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null,t.tracks?`${t.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card orpheus-card" data-orpheus-jobid="">
      <div class="tidal-cover">${o}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>
        <div class="tidal-meta">${n(d)}</div>
      </div>
      <div class="orpheus-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${s}">${n(a)}</span>
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
    </div>`}var $=new Map;function et(t,e){if($.has(t))return;let s=e?.querySelector(".orpheus-progress-wrap"),a=e?.querySelector(".orpheus-bar-fill"),o=e?.querySelector(".orpheus-job-status"),d=e?.querySelector(".orpheus-pct"),l=e?.querySelector(".orpheus-dl-btn"),i=e?.querySelector(".orpheus-stop-btn");s&&(s.style.display=""),l&&(l.disabled=!0,l.textContent="\u2026");let v=setInterval(async()=>{try{let f=await B(t),c=typeof f.progress=="number"?Math.round(f.progress):0;a&&(a.style.width=`${c}%`),d&&(d.textContent=`${c}%`);let p={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}}[f.status]||{label:f.status,cls:"q-pending"};if(o&&(o.textContent=p.label,o.className=`q-status ${p.cls} orpheus-job-status`),f.status==="done"||f.status==="error"||f.status==="stopped")clearInterval(v),$.delete(t),i&&(i.style.display="none"),f.status==="done"&&l?(l.textContent="\u2713",l.classList.add("dl-done")):l&&(l.disabled=!1,l.textContent="\u2B07 Download"),r.activeOrpheusJobs=r.activeOrpheusJobs.filter(g=>g.jobId!==t),window.dispatchEvent(new CustomEvent("orpheus-jobs-update"));else{let g=r.activeOrpheusJobs.find(m=>m.jobId===t);g&&(g.progress=c,g.status=f.status),window.dispatchEvent(new CustomEvent("orpheus-jobs-update"))}}catch{clearInterval(v),$.delete(t)}},800);$.set(t,v),i?.addEventListener("click",async()=>{try{await D(t)}catch{}clearInterval(v),$.delete(t),o&&(o.textContent="\u25A0 Gestopt",o.className="q-status q-pending orpheus-job-status"),l&&(l.disabled=!1,l.textContent="\u2B07 Download")},{once:!0})}async function st(t){let e=document.getElementById("tidal-content");if(!e)return;let s=(t||"").trim(),a=s.startsWith("http")?Y(s):null;if(a){at(s,a,e);return}if(s.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}e.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL (${L[r.orpheusPlatform]||r.orpheusPlatform})\u2026</div>`;try{let o=await E(s,r.orpheusPlatform),d=o.results||[];if(o.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(o.error)}</div>`;return}if(!d.length){e.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${n(s)}</strong>" via OrpheusDL.</div>`;return}let l=d.filter(c=>c.type==="album"),i=d.filter(c=>c.type==="track"),f=`<div class="orpheus-quality-row">${_(r.orpheusPlatform)}</div>`;l.length&&(f+=`<div class="section-title">Albums (${l.length})</div>
        <div class="tidal-grid">${l.map(M).join("")}</div>`),i.length&&(f+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${i.length})</div>
        <div class="tidal-grid">${i.map(M).join("")}</div>`),e.innerHTML=f,e.querySelector("#orpheus-quality")?.addEventListener("change",c=>{Q(c.target.value)})}catch(o){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(o.message)}</div>`}}function at(t,e,s){let a=L[e]||e,o=z[e]||"#888",d=_(e);s.innerHTML=`
    <div class="orpheus-url-card">
      <div class="orpheus-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${o}">${n(a)}</span>
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
    </div>`,s.querySelector("#orpheus-quality")?.addEventListener("change",l=>{Q(l.target.value)})}async function ot(t){let e=document.getElementById("tidal-content");if(!e)return;let s=(t||"").trim();if(s.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}e.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let a=await q(`/api/tidarr/search?q=${encodeURIComponent(s)}`);if(r.tidalSearchResults=a.results||[],a.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(a.error)}</div>`;return}if(!r.tidalSearchResults.length){e.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${n(s)}</strong>".</div>`;return}let o=r.tidalSearchResults.filter(i=>i.type==="album"),d=r.tidalSearchResults.filter(i=>i.type==="track"),l="";o.length&&(l+=`<div class="section-title">Albums (${o.length})</div>
        <div class="tidal-grid">${o.map(j).join("")}</div>`),d.length&&(l+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(j).join("")}</div>`),e.innerHTML=l}catch(a){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(a.message)}</div>`}}function ht(t,e=!1){let s={queued:"q-pending",pending:"q-pending",downloading:"q-active",processing:"q-active",completed:"q-done",done:"q-done",error:"q-error",failed:"q-error"}[String(t.status||"").toLowerCase()]||"q-pending",a=typeof t.progress=="number"?Math.round(t.progress):null,o=a!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${a}%"></div></div>
       <div class="q-pct">${a}%</div>`:"",d=e?"":`<button class="q-remove" data-qid="${n(t.id)}" title="Verwijder uit queue">\u2715</button>`;return`
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${n(t.title||"(onbekend)")}</div>
        ${t.artist?`<div class="q-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>`:""}
        <span class="q-status ${s}">${n(t.status||"queued")}</span>
      </div>
      ${o}${d}
    </div>`}function F(){let t=document.getElementById("tidal-content");if(!t)return;let e=r.tidarrQueueItems;if(!e.length){t.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},a={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};t.innerHTML=`
    <div class="section-title">${e.length} item${e.length!==1?"s":""} in queue</div>
    <div class="q-list">${e.map(o=>{let d=a[o.status]||"q-pending",l=s[o.status]||o.status||"In wachtrij",i=o.progress?.current&&o.progress?.total?Math.round(o.progress.current/o.progress.total*100):null,v=i!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${i}%"></div></div><div class="q-pct">${i}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${n(o.title||"(onbekend)")}</div>
          ${o.artist?`<div class="q-artist" data-artist="${n(o.artist)}">${n(o.artist)}</div>`:""}
          <span class="q-status ${d}">${n(l)}</span>
        </div>
        ${v}
        <button class="q-remove" data-qid="${n(o.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function V(){let t=document.getElementById("tidal-content");if(t){t.innerHTML=O(5);try{let e=await q("/api/downloads");if(!e.length){t.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let s={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};t.innerHTML=`
      <div class="section-title">${e.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${e.map(a=>{let o=a.queued_at?new Date(a.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",d=s[a.quality]||a.quality||"",l=a.image||a.cover||a.album_art||"";return`<div class="q-row">
          ${l?`<img class="q-thumb" src="${n(l)}" alt="${n(a.title)} by ${n(a.artist)}" loading="lazy" decoding="async">`:`<div class="q-thumb q-thumb-ph" style="background:${y(a.title||a.artist||"?")}">${h(a.title||a.artist||"?")}</div>`}
          <div class="q-info">
            <div class="q-title">${n(a.title)}</div>
            ${a.artist?`<div class="q-artist artist-link" data-artist="${n(a.artist)}">${n(a.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${d?" \xB7 "+d:""}${o?" \xB7 "+o:""}</span>
          </div>
          <button class="q-remove" data-dlid="${a.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await w("/api/downloads",{method:"DELETE"})}catch(a){a.name}for(let a of e)try{await w(`/api/downloads/${a.id}`,{method:"DELETE"})}catch(o){o.name}r.downloadedSet.clear(),V()}})}catch(e){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(e.message)}</div>`}}}function U(t){r.tidalView=t,document.querySelectorAll("[data-tidal-view]").forEach(s=>{let a=s.dataset.tidalView===t;s.classList.toggle("sel-def",a),s.setAttribute("aria-selected",a?"true":"false")});let e=document.getElementById("tidal-search-wrap");if(e&&(e.style.display=t==="search"?"":"none"),t==="search"){let s=document.getElementById("tidal-search")?.value||"";r.downloadEngine==="orpheus"?st(s):ot(s)}else t==="queue"?F():t==="history"&&V()}function J(){if(r.tidarrSseSource)return;let t=new EventSource("/api/tidarr/stream");r.tidarrSseSource=t,t.onmessage=e=>{try{r.tidarrQueueItems=JSON.parse(e.data)||[]}catch{r.tidarrQueueItems=[]}let s=r.tidarrQueueItems.filter(o=>o.status!=="finished"&&o.status!=="error"),a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let o of a)o&&(s.length>0?(o.textContent=s.length,o.style.display=""):o.style.display="none");if(lt(r.tidarrQueueItems),r.activeView==="downloads"&&r.tidalView==="queue"&&F(),document.getElementById("queue-popover")?.classList.contains("open")&&G(),r.activeView==="nu"){let o=document.getElementById("wbody-download-voortgang");o&&nt(o,s)}window.dispatchEvent(new CustomEvent("tidarr-queue-update"))},t.onerror=()=>{t.close(),r.tidarrSseSource=null,setTimeout(J,1e4)}}function mt(){r.tidarrSseSource&&(r.tidarrSseSource.close(),r.tidarrSseSource=null)}function nt(t,e){if(e||(e=r.tidarrQueueItems.filter(a=>a.status!=="finished"&&a.status!=="error")),!e.length){t.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};t.innerHTML=`<div class="w-queue-list">${e.slice(0,5).map(a=>{let o=a.progress?.current&&a.progress?.total?Math.round(a.progress.current/a.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${n(a.title||"(onbekend)")}</div>
      ${a.artist?`<div class="w-q-artist" data-artist="${n(a.artist)}">${n(a.artist)}</div>`:""}
      ${o!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${o}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${o}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${n(s[a.status]||a.status)}</span>`}
    </div></div>`}).join("")}${e.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${e.length-5} meer</div>`:""}</div>`}function rt(){J()}function yt(){}function bt(){let t=document.getElementById("tidarr-iframe"),e=document.getElementById("tidarr-ui-wrap"),s=document.getElementById("content");e.style.display="flex",s.style.display="none",t.dataset.loaded||(t.src=t.dataset.src,t.dataset.loaded="1")}function it(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function lt(t){let e=document.getElementById("queue-fab"),s=document.getElementById("fab-queue-badge");if(!e)return;let a=(t||[]).filter(o=>o.status!=="finished"&&o.status!=="error");t&&t.length>0?(e.style.display="",a.length>0?(s.textContent=a.length,s.style.display=""):s.style.display="none"):(e.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function G(){let t=document.getElementById("queue-popover-list");if(!t)return;let e=r.tidarrQueueItems;if(!e.length){t.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},a={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};t.innerHTML=e.map(o=>{let d=a[o.status]||"q-pending",l=s[o.status]||o.status||"In wachtrij",i=o.progress?.current&&o.progress?.total?Math.round(o.progress.current/o.progress.total*100):null,v=i!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${i}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${n(o.title||"(onbekend)")}</div>
      ${o.artist?`<div class="qpop-artist" data-artist="${n(o.artist)}">${n(o.artist)}</div>`:""}
      <span class="q-status ${d}">${n(l)}</span>
      ${v}
    </div>`}).join("")}function dt(){let t=document.getElementById("queue-popover");if(!t)return;t.classList.toggle("open")&&G()}function k(){document.getElementById("queue-popover")?.classList.remove("open")}function P(t){return(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function I(t,e){let s=P(t),a=P(e);return!s||!a?!0:s===a||s.includes(a)||a.includes(s)}function K(t,e,s,a){return new Promise(o=>{r.dlResolve=o;let d=document.getElementById("dl-confirm-modal"),l=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${s}"${e?" \u2013 "+e:""}`,l.innerHTML=t.map((i,v)=>{let f=!I(i.artist,e),c=i.image?`<img class="dlc-img" src="${n(i.image)}" alt="" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${h(i.title)}</div>`:`<div class="dlc-ph">${h(i.title)}</div>`,u=f?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${n(i.artist)}</div>`:`<div class="dlc-artist">${n(i.artist)}</div>`,p=i.score??0;return`
        <button class="dlc-card${v===0?" dlc-best":""}" data-dlc-idx="${v}">
          <div class="dlc-cover">${c}</div>
          <div class="dlc-info">
            <div class="dlc-title">${n(i.title)}</div>
            ${u}
            <div class="dlc-meta">${i.year?n(i.year):""}${i.year&&i.tracks?" \xB7 ":""}${i.tracks?i.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${p}%"></div></div>
            <div class="dlc-score-label">${p}% overeenkomst</div>
          </div>
          ${v===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),l.querySelectorAll(".dlc-card").forEach(i=>{i.addEventListener("click",()=>{let v=parseInt(i.dataset.dlcIdx);T(),o({chosen:t[v],btn:a})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function T(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",r.dlResolve&&(r.dlResolve({chosen:null}),r.dlResolve=null)}async function A(t,e,s,a){let o=await w("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:t.url,type:t.type||"album",title:t.title||s||"",artist:t.artist||e||"",id:String(t.id||""),quality:X()})}),d=await o.json();if(!o.ok||!d.ok)throw new Error(d.error||"download mislukt");x(t.artist||e||"",t.title||s||""),a&&(a.textContent="\u2713",a.classList.add("dl-done"),a.disabled=!1),await N()}async function wt(t,e,s){if(!r.orpheusConnected){alert("OrpheusDL is niet verbonden. Controleer de OrpheusDL-instellingen.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let a=[t,e].filter(Boolean).join(" "),d=(await E(a,r.orpheusPlatform||"all")).results||[];if(!d.length){alert(`Niet gevonden via OrpheusDL: "${e}"${t?" van "+t:""}

Probeer handmatig via de Downloads-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let l=c=>{let u=0,p=(c.artist||"").toLowerCase(),g=(c.title||"").toLowerCase(),m=(t||"").toLowerCase(),b=(e||"").toLowerCase();return p&&m&&(p===m?u+=100:p.includes(m)||m.includes(p)?u+=60:u-=50),g&&b&&(g===b?u+=80:(g.includes(b)||b.includes(g))&&(u+=40)),c.type==="album"&&(u+=30),["qobuz","tidal","deezer"].includes(c.platform)&&(u+=20),/remix|original mix|live|remaster/i.test(g)&&!/remix|live|remaster/i.test(b)&&(u-=30),u};d.sort((c,u)=>l(u)-l(c));let i=R(),v=async c=>{let u=await C(c.url,i,c.title,c.artist);if(!u.ok)throw new Error(u.error||"download mislukt");x(c.artist||t,c.title||e);let p=s?.closest(".orpheus-card, .gaps-artist-card");u.jobId&&p?(r.activeOrpheusJobs=r.activeOrpheusJobs||[],r.activeOrpheusJobs.push({jobId:u.jobId,title:c.title,artist:c.artist,status:"pending",progress:0}),window.dispatchEvent(new CustomEvent("orpheus-jobs-update")),et(u.jobId,p)):s&&(s.textContent="\u2713",s.classList.add("dl-done"),s.disabled=!1)},f=d[0];if(t&&!I(f.artist,t)){s&&(s.disabled=!1,s.textContent="\u2B07");let c=d.slice(0,3).map(p=>({title:p.title,artist:p.artist,url:p.url,image:p.image,year:p.year,score:l(p)})),{chosen:u}=await K(c,t,e,s);if(!u)return;s&&(s.disabled=!0,s.textContent="\u2026"),await v(u)}else await v(f)}catch(a){alert("OrpheusDL downloaden mislukt: "+a.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function qt(t,e,s){if(!r.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let a=new URLSearchParams;t&&a.set("artist",t),e&&a.set("album",e);let o=await w(`/api/tidarr/candidates?${a}`);if(!o.ok){o.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${e}"${t?" van "+t:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let{candidates:d}=await o.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${e}"${t?" van "+t:""}`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let l=d[0];if(t&&!I(l.artist,t)){s&&(s.disabled=!1,s.textContent="\u2B07");let{chosen:i}=await K(d,t,e,s);if(!i)return;s&&(s.disabled=!0,s.textContent="\u2026"),await A(i,t,e,s)}else await A(l,t,e,s)}catch(a){alert("Downloaden mislukt: "+a.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function W(){let t=r.downloadEngine==="orpheus",e=L[r.orpheusPlatform]||r.orpheusPlatform,s=t?`Zoek via OrpheusDL${r.orpheusPlatform!=="all"?" \xB7 "+e:""}\u2026 of plak een URL`:"Zoek albums of tracks op Tidal\u2026";S(`
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
               placeholder="${n(s)}" autocomplete="off">
      </div>
      <div id="tidal-content"><div class="empty">Begin met typen om te zoeken${t?" via OrpheusDL":" op Tidal"}.</div></div>
    </div>
  `),document.querySelector(".orpheus-engine-settings-link")?.addEventListener("click",()=>{document.querySelector(".sidebar-settings-btn")?.click()});let a=()=>{r.activeView==="downloads"&&W()};document.addEventListener("engine:changed",a,{once:!0}),document.addEventListener("platform:changed",a,{once:!0}),await tt(),t&&await ct(),await N(),U(r.tidalView),rt()}async function ct(){let t=document.getElementById("orpheus-status-pill"),e=document.getElementById("orpheus-status-text");if(!(!t||!e))try{let{apiFetch:s}=await import("./api-UQ7J27AP.js"),a=await s("/api/orpheus/status");r.orpheusConnected=!!a.connected,t.className=`tidarr-status-pill ${a.connected?"on":"off"}`,e.textContent=a.connected?"OrpheusDL \xB7 verbonden":"OrpheusDL offline"}catch{r.orpheusConnected=!1,t&&(t.className="tidarr-status-pill off"),e&&(e.textContent="OrpheusDL offline")}}function $t(){r.activeView="downloads",it(),W()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{T()});document.getElementById("dl-confirm-modal")?.addEventListener("click",t=>{t.target===document.getElementById("dl-confirm-modal")&&T()});document.getElementById("queue-fab")?.addEventListener("click",dt);document.getElementById("qpop-close")?.addEventListener("click",t=>{t.stopPropagation(),k()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{k(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>U("queue"),150)});document.addEventListener("click",t=>{let e=document.getElementById("queue-popover"),s=document.getElementById("queue-fab");e?.classList.contains("open")&&!e.contains(t.target)&&!s?.contains(t.target)&&k()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let t=document.getElementById("tidarr-iframe");t.src=t.dataset.src});export{R as a,X as b,tt as c,N as d,j as e,M as f,et as g,st as h,ot as i,ht as j,F as k,V as l,U as m,J as n,mt as o,nt as p,rt as q,yt as r,bt as s,it as t,lt as u,G as v,dt as w,k as x,P as y,I as z,K as A,T as B,A as C,wt as D,qt as E,W as F,$t as G};
