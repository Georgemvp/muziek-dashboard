import{b as A}from"./chunk-VN7UFMTG.js";import{G as k,H as O,I as M,J as _,a as $,f as h,h as n,j as b,p as x,s as T,z as m}from"./chunk-FUEEWMYC.js";import{a as l}from"./chunk-GRRN6U7X.js";var N={tidal:"#33ffe7",qobuz:"#0070ef",deezer:"#a238ff",spotify:"#1cc659",soundcloud:"#ff5502",applemusic:"#FA586A",beatport:"#00ff89",beatsource:"#16a8f4",youtube:"#FF0000"},E={tidal:"Tidal",qobuz:"Qobuz",deezer:"Deezer",spotify:"Spotify",soundcloud:"SoundCloud",applemusic:"Apple Music",beatport:"Beatport",beatsource:"Beatsource",youtube:"YouTube"},P={tidal:[["atmos","Atmos"],["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"]],qobuz:[["hifi","HiFi"],["lossless","Lossless"],["high","High"]],deezer:[["lossless","Lossless"],["high","High"],["low","Low"]],spotify:[["high","High"],["low","Low"]],soundcloud:[["high","High"]],applemusic:[["high","High"]],beatport:[["lossless","Lossless"],["high","High"],["low","Low"]],beatsource:[["lossless","Lossless"],["high","High"],["low","Low"]],youtube:[["opus","Opus"],["aac","AAC"],["mp3","MP3"]],all:[["hifi","HiFi"],["lossless","Lossless"],["high","High"],["low","Low"],["atmos","Atmos"],["opus","Opus"],["aac","AAC"],["mp3","MP3"]]},dt=[{pattern:/tidal\.com/i,platform:"tidal"},{pattern:/open\.qobuz\.com/i,platform:"qobuz"},{pattern:/deezer\.com/i,platform:"deezer"},{pattern:/open\.spotify\.com/i,platform:"spotify"},{pattern:/soundcloud\.com/i,platform:"soundcloud"},{pattern:/music\.apple\.com/i,platform:"applemusic"},{pattern:/beatport\.com/i,platform:"beatport"},{pattern:/beatsource\.com/i,platform:"beatsource"},{pattern:/youtube\.com|youtu\.be/i,platform:"youtube"}];function ct(t){for(let{pattern:e,platform:s}of dt)if(e.test(t))return s;return null}function F(){return localStorage.getItem("orpheusQuality")||"hifi"}function U(t){localStorage.setItem("orpheusQuality",t)}function G(t){let e=P[t]||P.all,s=F();return`
    <label class="orpheus-quality-wrap" title="Download kwaliteit">
      <select id="orpheus-quality" class="orpheus-quality-sel" aria-label="Kwaliteit kiezen">
        ${e.map(([a,i])=>`<option value="${a}"${a===s?" selected":""}>${i}</option>`).join("")}
      </select>
    </label>`}function ut(){return localStorage.getItem("downloadQuality")||"high"}async function pt(){let t=l.tabAbort?.signal;try{let e=await m("/api/tidarr/status",{signal:t});if(t?.aborted)return;let s=document.getElementById("tidarr-status-pill"),a=document.getElementById("tidarr-status-text");l.tidarrOk=!!e.connected,s&&a&&(s.className=`tidarr-status-pill ${l.tidarrOk?"on":"off"}`,a.textContent=l.tidarrOk?`Tidarr \xB7 verbonden${e.quality?" \xB7 "+e.quality:""}`:"Tidarr offline")}catch(e){if(e.name==="AbortError")return;l.tidarrOk=!1;let s=document.getElementById("tidarr-status-text");s&&(s.textContent="Tidarr offline")}}async function J(){let t=l.tabAbort?.signal;try{let e=await m("/api/tidarr/queue",{signal:t});if(t?.aborted)return;let s=(e.items||[]).length,a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let i of a)i&&(s>0?(i.textContent=s,i.style.display=""):i.style.display="none")}catch(e){if(e.name==="AbortError")return}}function z(t){let e=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(t.title)}">${h(t.title)}</div>`:`<div class="tidal-ph" style="background:${b(t.title)}">${h(t.title)}</div>`,s=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null,t.tracks?`${t.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${e}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>
        <div class="tidal-meta">${n(s)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${n(t.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}function R(t){let e=t.platform||"unknown",s=N[e]||"#888",a=E[e]||e,i=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)} by ${n(t.artist)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(t.title)}">${h(t.title)}</div>`:`<div class="tidal-ph" style="background:${b(t.title)}">${h(t.title)}</div>`,o=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null,t.tracks?`${t.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card orpheus-card" data-orpheus-jobid="">
      <div class="tidal-cover">${i}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>
        <div class="tidal-meta">${n(o)}</div>
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
    </div>`}var q=new Map;function ft(t,e){if(q.has(t))return;let s=e?.querySelector(".orpheus-progress-wrap"),a=e?.querySelector(".orpheus-bar-fill"),i=e?.querySelector(".orpheus-job-status"),o=e?.querySelector(".orpheus-pct"),d=e?.querySelector(".orpheus-dl-btn"),c=e?.querySelector(".orpheus-stop-btn");s&&(s.style.display=""),d&&(d.disabled=!0,d.textContent="\u2026");let u=setInterval(async()=>{try{let r=await M(t),p=typeof r.progress=="number"?Math.round(r.progress):0;a&&(a.style.width=`${p}%`),o&&(o.textContent=`${p}%`);let v={pending:{label:"In wachtrij",cls:"q-pending"},running:{label:"Downloaden\u2026",cls:"q-active"},done:{label:"\u2713 Klaar",cls:"q-done"},error:{label:"\u26A0 Fout",cls:"q-error"},stopped:{label:"\u25A0 Gestopt",cls:"q-pending"}}[r.status]||{label:r.status,cls:"q-pending"};if(i&&(i.textContent=v.label,i.className=`q-status ${v.cls} orpheus-job-status`),r.status==="done"||r.status==="error"||r.status==="stopped")clearInterval(u),q.delete(t),c&&(c.style.display="none"),r.status==="done"&&d?(d.textContent="\u2713",d.classList.add("dl-done")):d&&(d.disabled=!1,d.textContent="\u2B07 Download"),l.activeOrpheusJobs=l.activeOrpheusJobs.filter(g=>g.jobId!==t),window.dispatchEvent(new CustomEvent("orpheus-jobs-update"));else{let g=l.activeOrpheusJobs.find(y=>y.jobId===t);g&&(g.progress=p,g.status=r.status),window.dispatchEvent(new CustomEvent("orpheus-jobs-update"))}}catch{clearInterval(u),q.delete(t)}},800);q.set(t,u),c?.addEventListener("click",async()=>{try{await _(t)}catch{}clearInterval(u),q.delete(t),i&&(i.textContent="\u25A0 Gestopt",i.className="q-status q-pending orpheus-job-status"),d&&(d.disabled=!1,d.textContent="\u2B07 Download")},{once:!0})}async function vt(t){let e=document.getElementById("tidal-content");if(!e)return;let s=(t||"").trim(),a=s.startsWith("http")?ct(s):null;if(a){gt(s,a,e);return}if(s.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken via OrpheusDL.</div>';return}e.innerHTML=`<div class="loading"><div class="spinner"></div>Zoeken via OrpheusDL (${E[l.orpheusPlatform]||l.orpheusPlatform})\u2026</div>`;try{let i=await k(s,l.orpheusPlatform),o=i.results||[];if(i.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(i.error)}</div>`;return}if(!o.length){e.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${n(s)}</strong>" via OrpheusDL.</div>`;return}let d=o.filter(p=>p.type==="album"),c=o.filter(p=>p.type==="track"),r=`<div class="orpheus-quality-row">${G(l.orpheusPlatform)}</div>`;d.length&&(r+=`<div class="section-title">Albums (${d.length})</div>
        <div class="tidal-grid">${d.map(R).join("")}</div>`),c.length&&(r+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${c.length})</div>
        <div class="tidal-grid">${c.map(R).join("")}</div>`),e.innerHTML=r,e.querySelector("#orpheus-quality")?.addEventListener("change",p=>{U(p.target.value)})}catch(i){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(i.message)}</div>`}}function gt(t,e,s){let a=E[e]||e,i=N[e]||"#888",o=G(e);s.innerHTML=`
    <div class="orpheus-url-card">
      <div class="orpheus-url-info">
        <span class="orpheus-platform-badge" style="--badge-color:${i}">${n(a)}</span>
        <div class="orpheus-url-text">${n(t)}</div>
      </div>
      <div class="orpheus-url-actions">
        ${o}
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
    </div>`,s.querySelector("#orpheus-quality")?.addEventListener("change",d=>{U(d.target.value)})}async function mt(t){let e=document.getElementById("tidal-content");if(!e)return;let s=(t||"").trim();if(s.length<2){e.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}e.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let a=await m(`/api/tidarr/search?q=${encodeURIComponent(s)}`);if(l.tidalSearchResults=a.results||[],a.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(a.error)}</div>`;return}if(!l.tidalSearchResults.length){e.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${n(s)}</strong>".</div>`;return}let i=l.tidalSearchResults.filter(c=>c.type==="album"),o=l.tidalSearchResults.filter(c=>c.type==="track"),d="";i.length&&(d+=`<div class="section-title">Albums (${i.length})</div>
        <div class="tidal-grid">${i.map(z).join("")}</div>`),o.length&&(d+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${o.length})</div>
        <div class="tidal-grid">${o.map(z).join("")}</div>`),e.innerHTML=d}catch(a){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(a.message)}</div>`}}function Ht(t,e=!1){let s={queued:"q-pending",pending:"q-pending",downloading:"q-active",processing:"q-active",completed:"q-done",done:"q-done",error:"q-error",failed:"q-error"}[String(t.status||"").toLowerCase()]||"q-pending",a=typeof t.progress=="number"?Math.round(t.progress):null,i=a!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${a}%"></div></div>
       <div class="q-pct">${a}%</div>`:"",o=e?"":`<button class="q-remove" data-qid="${n(t.id)}" title="Verwijder uit queue">\u2715</button>`;return`
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${n(t.title||"(onbekend)")}</div>
        ${t.artist?`<div class="q-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>`:""}
        <span class="q-status ${s}">${n(t.status||"queued")}</span>
      </div>
      ${i}${o}
    </div>`}function Z(){let t=document.getElementById("tidal-content");if(!t)return;let e=l.tidarrQueueItems;if(!e.length){t.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},a={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};t.innerHTML=`
    <div class="section-title">${e.length} item${e.length!==1?"s":""} in queue</div>
    <div class="q-list">${e.map(i=>{let o=a[i.status]||"q-pending",d=s[i.status]||i.status||"In wachtrij",c=i.progress?.current&&i.progress?.total?Math.round(i.progress.current/i.progress.total*100):null,u=c!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${c}%"></div></div><div class="q-pct">${c}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${n(i.title||"(onbekend)")}</div>
          ${i.artist?`<div class="q-artist" data-artist="${n(i.artist)}">${n(i.artist)}</div>`:""}
          <span class="q-status ${o}">${n(d)}</span>
        </div>
        ${u}
        <button class="q-remove" data-qid="${n(i.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function Y(){let t=document.getElementById("tidal-content");if(t){t.innerHTML=A(5);try{let e=await m("/api/downloads");if(!e.length){t.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let s={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};t.innerHTML=`
      <div class="section-title">${e.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${e.map(a=>{let i=a.queued_at?new Date(a.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",o=s[a.quality]||a.quality||"",d=a.image||a.cover||a.album_art||"";return`<div class="q-row">
          ${d?`<img class="q-thumb" src="${n(d)}" alt="${n(a.title)} by ${n(a.artist)}" loading="lazy" decoding="async">`:`<div class="q-thumb q-thumb-ph" style="background:${b(a.title||a.artist||"?")}">${h(a.title||a.artist||"?")}</div>`}
          <div class="q-info">
            <div class="q-title">${n(a.title)}</div>
            ${a.artist?`<div class="q-artist artist-link" data-artist="${n(a.artist)}">${n(a.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${o?" \xB7 "+o:""}${i?" \xB7 "+i:""}</span>
          </div>
          <button class="q-remove" data-dlid="${a.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await $("/api/downloads",{method:"DELETE"})}catch(a){a.name}for(let a of e)try{await $(`/api/downloads/${a.id}`,{method:"DELETE"})}catch(i){i.name}l.downloadedSet.clear(),Y()}})}catch(e){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(e.message)}</div>`}}}function K(t){l.tidalView=t,document.querySelectorAll("[data-tidal-view]").forEach(s=>{let a=s.dataset.tidalView===t;s.classList.toggle("sel-def",a),s.setAttribute("aria-selected",a?"true":"false")});let e=document.getElementById("tidal-search-wrap");if(e&&(e.style.display=t==="search"?"":"none"),t==="search"){let s=document.getElementById("tidal-search")?.value||"";l.downloadEngine==="orpheus"?vt(s):mt(s)}else t==="queue"?Z():t==="history"&&Y()}function W(){if(l.tidarrSseSource)return;let t=new EventSource("/api/tidarr/stream");l.tidarrSseSource=t,t.onmessage=e=>{try{l.tidarrQueueItems=JSON.parse(e.data)||[]}catch{l.tidarrQueueItems=[]}let s=l.tidarrQueueItems.filter(i=>i.status!=="finished"&&i.status!=="error"),a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let i of a)i&&(s.length>0?(i.textContent=s.length,i.style.display=""):i.style.display="none");if(bt(l.tidarrQueueItems),l.activeView==="downloads"&&l.tidalView==="queue"&&Z(),document.getElementById("queue-popover")?.classList.contains("open")&&et(),l.activeView==="nu"){let i=document.getElementById("wbody-download-voortgang");i&&ht(i,s)}window.dispatchEvent(new CustomEvent("tidarr-queue-update"))},t.onerror=()=>{t.close(),l.tidarrSseSource=null,setTimeout(W,1e4)}}function Dt(){l.tidarrSseSource&&(l.tidarrSseSource.close(),l.tidarrSseSource=null)}function ht(t,e){if(e||(e=l.tidarrQueueItems.filter(a=>a.status!=="finished"&&a.status!=="error")),!e.length){t.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};t.innerHTML=`<div class="w-queue-list">${e.slice(0,5).map(a=>{let i=a.progress?.current&&a.progress?.total?Math.round(a.progress.current/a.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${n(a.title||"(onbekend)")}</div>
      ${a.artist?`<div class="w-q-artist" data-artist="${n(a.artist)}">${n(a.artist)}</div>`:""}
      ${i!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${i}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${i}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${n(s[a.status]||a.status)}</span>`}
    </div></div>`}).join("")}${e.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${e.length-5} meer</div>`:""}</div>`}function X(){W()}function Ot(){}function yt(){let t=document.getElementById("tidarr-iframe"),e=document.getElementById("tidarr-ui-wrap"),s=document.getElementById("content");e.style.display="flex",s.style.display="none",t.dataset.loaded||(t.src=t.dataset.src,t.dataset.loaded="1")}function tt(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function bt(t){let e=document.getElementById("queue-fab"),s=document.getElementById("fab-queue-badge");if(!e)return;let a=(t||[]).filter(i=>i.status!=="finished"&&i.status!=="error");t&&t.length>0?(e.style.display="",a.length>0?(s.textContent=a.length,s.style.display=""):s.style.display="none"):(e.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function et(){let t=document.getElementById("queue-popover-list");if(!t)return;let e=l.tidarrQueueItems;if(!e.length){t.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},a={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};t.innerHTML=e.map(i=>{let o=a[i.status]||"q-pending",d=s[i.status]||i.status||"In wachtrij",c=i.progress?.current&&i.progress?.total?Math.round(i.progress.current/i.progress.total*100):null,u=c!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${c}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${n(i.title||"(onbekend)")}</div>
      ${i.artist?`<div class="qpop-artist" data-artist="${n(i.artist)}">${n(i.artist)}</div>`:""}
      <span class="q-status ${o}">${n(d)}</span>
      ${u}
    </div>`}).join("")}function wt(){let t=document.getElementById("queue-popover");if(!t)return;t.classList.toggle("open")&&et()}function S(){document.getElementById("queue-popover")?.classList.remove("open")}function j(t){return(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function C(t,e){let s=j(t),a=j(e);return!s||!a?!0:s===a||s.includes(a)||a.includes(s)}function st(t,e,s,a){return new Promise(i=>{l.dlResolve=i;let o=document.getElementById("dl-confirm-modal"),d=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${s}"${e?" \u2013 "+e:""}`,d.innerHTML=t.map((c,u)=>{let r=!C(c.artist,e),p=c.image?`<img class="dlc-img" src="${n(c.image)}" alt="" loading="lazy" decoding="async"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${h(c.title)}</div>`:`<div class="dlc-ph">${h(c.title)}</div>`,f=r?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${n(c.artist)}</div>`:`<div class="dlc-artist">${n(c.artist)}</div>`,v=c.score??0;return`
        <button class="dlc-card${u===0?" dlc-best":""}" data-dlc-idx="${u}">
          <div class="dlc-cover">${p}</div>
          <div class="dlc-info">
            <div class="dlc-title">${n(c.title)}</div>
            ${f}
            <div class="dlc-meta">${c.year?n(c.year):""}${c.year&&c.tracks?" \xB7 ":""}${c.tracks?c.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${v}%"></div></div>
            <div class="dlc-score-label">${v}% overeenkomst</div>
          </div>
          ${u===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),d.querySelectorAll(".dlc-card").forEach(c=>{c.addEventListener("click",()=>{let u=parseInt(c.dataset.dlcIdx);B(),i({chosen:t[u],btn:a})})}),o.classList.add("open"),document.body.style.overflow="hidden"})}function B(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",l.dlResolve&&(l.dlResolve({chosen:null}),l.dlResolve=null)}async function Q(t,e,s,a){let i=await $("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:t.url,type:t.type||"album",title:t.title||s||"",artist:t.artist||e||"",id:String(t.id||""),quality:ut()})}),o=await i.json();if(!i.ok||!o.ok)throw new Error(o.error||"download mislukt");x(t.artist||e||"",t.title||s||""),a&&(a.textContent="\u2713",a.classList.add("dl-done"),a.disabled=!1),await J()}async function Mt(t,e,s){if(!l.orpheusConnected){alert("OrpheusDL is niet verbonden. Controleer de OrpheusDL-instellingen.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let a=[t,e].filter(Boolean).join(" "),o=(await k(a,l.orpheusPlatform||"all")).results||[];if(!o.length){alert(`Niet gevonden via OrpheusDL: "${e}"${t?" van "+t:""}

Probeer handmatig via de Downloads-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let d=p=>{let f=0,v=(p.artist||"").toLowerCase(),g=(p.title||"").toLowerCase(),y=(t||"").toLowerCase(),w=(e||"").toLowerCase();return v&&y&&(v===y?f+=100:v.includes(y)||y.includes(v)?f+=60:f-=50),g&&w&&(g===w?f+=80:(g.includes(w)||w.includes(g))&&(f+=40)),p.type==="album"&&(f+=30),["qobuz","tidal","deezer"].includes(p.platform)&&(f+=20),/remix|original mix|live|remaster/i.test(g)&&!/remix|live|remaster/i.test(w)&&(f-=30),f};o.sort((p,f)=>d(f)-d(p));let c=F(),u=async p=>{let f=await O(p.url,c,p.title,p.artist);if(!f.ok)throw new Error(f.error||"download mislukt");x(p.artist||t,p.title||e);let v=s?.closest(".orpheus-card, .gaps-artist-card");f.jobId&&v?(l.activeOrpheusJobs=l.activeOrpheusJobs||[],l.activeOrpheusJobs.push({jobId:f.jobId,title:p.title,artist:p.artist,status:"pending",progress:0}),window.dispatchEvent(new CustomEvent("orpheus-jobs-update")),ft(f.jobId,v)):s&&(s.textContent="\u2713",s.classList.add("dl-done"),s.disabled=!1)},r=o[0];if(t&&!C(r.artist,t)){s&&(s.disabled=!1,s.textContent="\u2B07");let p=o.slice(0,3).map(v=>({title:v.title,artist:v.artist,url:v.url,image:v.image,year:v.year,score:d(v)})),{chosen:f}=await st(p,t,e,s);if(!f)return;s&&(s.disabled=!0,s.textContent="\u2026"),await u(f)}else await u(r)}catch(a){alert("OrpheusDL downloaden mislukt: "+a.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function _t(t,e,s){if(!l.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let a=new URLSearchParams;t&&a.set("artist",t),e&&a.set("album",e);let i=await $(`/api/tidarr/candidates?${a}`);if(!i.ok){i.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${e}"${t?" van "+t:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let{candidates:o}=await i.json();if(!o?.length){alert(`Niet gevonden op TIDAL: "${e}"${t?" van "+t:""}`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let d=o[0];if(t&&!C(d.artist,t)){s&&(s.disabled=!1,s.textContent="\u2B07");let{chosen:c}=await st(o,t,e,s);if(!c)return;s&&(s.disabled=!0,s.textContent="\u2026"),await Q(c,t,e,s)}else await Q(d,t,e,s)}catch(a){alert("Downloaden mislukt: "+a.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function at(){let t=l.downloadEngine==="orpheus",e=E[l.orpheusPlatform]||l.orpheusPlatform,s=t?`Zoek via OrpheusDL${l.orpheusPlatform!=="all"?" \xB7 "+e:""}\u2026 of plak een URL`:"Zoek albums of tracks op Tidal\u2026";T(`
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
        Download engine: <strong>OrpheusDL</strong>${l.orpheusPlatform!=="all"?` \xB7 Platform: <strong>${n(e)}</strong>`:""}
        \u2014 <button class="orpheus-engine-settings-link" type="button">Wijzig in \u2699 Instellingen</button>
      </div>`:""}
      <div class="tidal-search-wrap" id="tidal-search-wrap">
        <input id="tidal-search" class="tidal-search" type="search"
               placeholder="${n(s)}" autocomplete="off">
      </div>
      <div id="tidal-content"><div class="empty">Begin met typen om te zoeken${t?" via OrpheusDL":" op Tidal"}.</div></div>
    </div>
  `),document.querySelector(".orpheus-engine-settings-link")?.addEventListener("click",()=>{document.querySelector(".sidebar-settings-btn")?.click()});let a=()=>{l.activeView==="downloads"&&at()};document.addEventListener("engine:changed",a,{once:!0}),document.addEventListener("platform:changed",a,{once:!0}),await pt(),t&&await $t(),await J(),K(l.tidalView),X()}async function $t(){let t=document.getElementById("orpheus-status-pill"),e=document.getElementById("orpheus-status-text");if(!(!t||!e))try{let{apiFetch:s}=await import("./api-LH23ZYRC.js"),a=await s("/api/orpheus/status");l.orpheusConnected=!!a.connected,t.className=`tidarr-status-pill ${a.connected?"on":"off"}`,e.textContent=a.connected?"OrpheusDL \xB7 verbonden":"OrpheusDL offline"}catch{l.orpheusConnected=!1,t&&(t.className="tidarr-status-pill off"),e&&(e.textContent="OrpheusDL offline")}}function At(){l.activeView="downloads",tt(),at()}var H={tidarr:{label:"Tidal (Tidarr)",color:"#33ffe7",short:"TIDAL"},orpheus_tidal:{label:"Tidal",color:"#33ffe7",short:"TIDAL"},orpheus_qobuz:{label:"Qobuz",color:"#0070ef",short:"QOBUZ"},orpheus_deezer:{label:"Deezer",color:"#a238ff",short:"DEEZER"},orpheus_spotify:{label:"Spotify",color:"#1cc659",short:"SPOTIFY"},orpheus_soundcloud:{label:"SoundCloud",color:"#ff5502",short:"SC"},orpheus_applemusic:{label:"Apple Music",color:"#FA586A",short:"APPLE"},orpheus_beatport:{label:"Beatport",color:"#00ff89",short:"BEAT"},orpheus_beatsource:{label:"Beatsource",color:"#16a8f4",short:"BSRC"},orpheus_youtube:{label:"YouTube",color:"#FF0000",short:"YT"}};function it(t){return H[t]?.label||t}function D(t){return H[t]?.color||"#888"}function qt(t){return H[t]?.short||t.toUpperCase()}async function nt(t){if(t){t.innerHTML='<div class="src-loading">Status laden\u2026</div>';try{let s=(await m("/api/download/status")).sources||[];if(!s.length){t.innerHTML="";return}let a=s.filter(i=>i.enabled!==!1);t.innerHTML=`
      <div class="src-status-bar">
        ${a.map(i=>{let o=i.available===!0?"src-dot-ok":i.available===!1?"src-dot-err":"src-dot-unk",d=D(i.name);return`<span class="src-pill" title="${n(i.label||i.name)}${i.errorCount>0?" \xB7 "+i.errorCount+" fouten":""}">
            <span class="src-dot ${o}" style="--src-color:${d}"></span>
            <span class="src-pill-label">${n(qt(i.name))}</span>
          </span>`}).join("")}
        <button class="src-refresh-btn tool-btn" type="button" title="Herlaad status" aria-label="Herlaad bron-status">\u21BA</button>
      </div>`,t.querySelector(".src-refresh-btn")?.addEventListener("click",()=>nt(t))}catch{t.innerHTML='<span class="src-pill"><span class="src-dot src-dot-err"></span> Status onbekend</span>'}}}function V(t){let e=t.source||"unknown",s=D(e),a=it(e),i=t.image?`<img class="tidal-img" src="${n(t.image)}" alt="${n(t.title)}" loading="lazy" decoding="async"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(t.title)}">${h(t.title)}</div>`:`<div class="tidal-ph" style="background:${b(t.title)}">${h(t.title)}</div>`,o=[t.type==="album"?"Album":"Nummer",t.year,t.album&&t.type==="track"?t.album:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card unified-card"
         data-unified-source="${n(e)}"
         data-unified-url="${n(t.url||"")}"
         data-unified-title="${n(t.title)}"
         data-unified-artist="${n(t.artist||"")}"
         data-unified-type="${n(t.type||"album")}"
         data-unified-id="${n(String(t.id||""))}"
         data-unified-platform="${n(t.platform||"")}">
      <div class="tidal-cover">${i}</div>
      <div class="tidal-info">
        <div class="tidal-title">${n(t.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${n(t.artist||"")}">${n(t.artist||"")}</div>
        <div class="tidal-meta">${n(o)}</div>
      </div>
      <div class="unified-card-actions">
        <span class="orpheus-platform-badge" style="--badge-color:${s}">${n(a)}</span>
        <button class="tidal-dl-btn unified-dl-btn" title="Download via ${n(a)}">\u2B07 Download</button>
      </div>
    </div>`}async function I(t){let e=document.getElementById("unified-content");if(!e)return;let s=(t||"").trim();if(s.length<2){e.innerHTML='<div class="empty">Begin met typen om over alle bronnen te zoeken.</div>';return}e.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken via alle bronnen\u2026</div>';try{let a=document.getElementById("unified-type-sel")?.value||"album",i=await m(`/api/download/search?q=${encodeURIComponent(s)}&type=${a}`),o=i.results||[];if(i.error){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(i.error)}</div>`;return}if(!o.length){e.innerHTML=`<div class="empty">Geen resultaten voor "<strong>${n(s)}</strong>" via alle bronnen.</div>`;return}let d=o.filter(r=>r.type==="album"),c=o.filter(r=>r.type==="track"),u=`<div class="unified-results-info">${o.length} resultaten over ${new Set(o.map(r=>r.source)).size} bronnen</div>`;d.length&&(u+=`<div class="section-title">Albums (${d.length})</div>
        <div class="tidal-grid">${d.map(V).join("")}</div>`),c.length&&(u+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${c.length})</div>
        <div class="tidal-grid">${c.map(V).join("")}</div>`),e.innerHTML=u,e.querySelectorAll(".unified-dl-btn").forEach(r=>{r.addEventListener("click",async()=>{let p=r.closest(".unified-card"),f=p.dataset.unifiedSource,v=p.dataset.unifiedUrl,g=p.dataset.unifiedTitle,y=p.dataset.unifiedArtist,w=p.dataset.unifiedType;r.disabled=!0,r.textContent="\u2026";try{await xt({artist:y,album:g,type:w,source:f,url:v}),r.textContent="\u2713",r.classList.add("dl-done")}catch(lt){r.disabled=!1,r.textContent="\u2B07 Download",alert("Download mislukt: "+lt.message)}})})}catch(a){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(a.message)}</div>`}}async function xt({artist:t,album:e,track:s,type:a="album",quality:i,source:o="auto",url:d}){let c=i||localStorage.getItem("downloadQuality")||"flac",r=await fetch("/api/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({artist:t,album:e,track:s,type:a,quality:c,source:o})}),p=await r.json();if(!r.ok&&r.status>=500)throw new Error(p.error||"Orchestrator fout");if(p.status==="failed")throw new Error(p.error||"Alle bronnen mislukt");return x(t||"",e||s||""),p}async function ot(){let t=document.getElementById("unified-content");if(t){t.innerHTML='<div class="loading"><div class="spinner"></div>Queue laden\u2026</div>';try{let s=(await m("/api/download/queue")).jobs||[];if(!s.length){t.innerHTML='<div class="empty">Geen actieve downloads in de orchestrator queue.</div>';return}t.innerHTML=`
      <div class="section-title">${s.length} actieve download${s.length!==1?"s":""}</div>
      <div class="q-list">${s.map(a=>rt(a,!1)).join("")}</div>`,t.querySelectorAll(".unified-retry-btn").forEach(a=>{a.addEventListener("click",async()=>{let i=a.dataset.jobId;a.disabled=!0,a.textContent="\u2026";try{await fetch(`/api/download/retry/${i}`,{method:"POST"}),await ot()}catch{a.disabled=!1,a.textContent="Retry"}})})}catch(e){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(e.message)}</div>`}}}async function L(){let t=document.getElementById("unified-content");if(t){t.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis laden\u2026</div>';try{let s=(await m("/api/download/history?limit=100")).jobs||[];if(!s.length){t.innerHTML='<div class="empty">Nog geen downloads via de orchestrator.</div>';return}let a=s.filter(u=>u.status==="completed"||u.status==="needs_review").map(u=>u.id),i={};if(a.length)try{let u=await m("/api/verify/results?limit=200");for(let r of u.results||[])r.download_id&&(i[r.download_id]=r);for(let r of a)r in i||(i[r]=null)}catch{}let o=s.map(u=>({...u,_acoustid:i[u.id]})),d=s.filter(u=>u.status==="failed").length,c=a.length;t.innerHTML=`
      <div class="section-title">${s.length} downloads
        <div style="display:flex;gap:6px;margin-left:auto">
          ${d>0?`<button class="tool-btn" id="retry-all-btn" style="font-size:11px">\u21BA Herstart ${d} mislukt</button>`:""}
          ${c>0?'<button class="tool-btn" id="verify-all-btn" style="font-size:11px">\u{1F50D} Verifieer alles</button>':""}
        </div>
      </div>
      <div class="q-list">${o.map(u=>rt(u,!0)).join("")}</div>`,document.getElementById("retry-all-btn")?.addEventListener("click",async u=>{let r=u.currentTarget;r.disabled=!0,r.textContent="\u2026";try{let p=await fetch("/api/download/retry-all",{method:"POST"}).then(f=>f.json());r.textContent=`\u21BA ${p.retried} herstart`,setTimeout(()=>L(),2e3)}catch{r.disabled=!1,r.textContent="Fout"}}),document.getElementById("verify-all-btn")?.addEventListener("click",async u=>{let r=u.currentTarget;r.disabled=!0,r.textContent="\u{1F50D} Bezig\u2026";let p=0;for(let f of a){try{await fetch(`/api/verify/${f}`,{method:"POST"}),p++,r.textContent=`\u{1F50D} ${p}/${a.length}`}catch{}await new Promise(v=>setTimeout(v,400))}r.textContent=`\u2713 ${p} geverifieerd`,setTimeout(()=>L(),3e3)}),t.querySelectorAll(".unified-retry-btn").forEach(u=>{u.addEventListener("click",async()=>{let r=u.dataset.jobId;u.disabled=!0,u.textContent="\u2026";try{await fetch(`/api/download/retry/${r}`,{method:"POST"}),await L()}catch{u.disabled=!1,u.textContent="Retry"}})}),Lt(t)}catch(e){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${n(e.message)}</div>`}}}function Lt(t){t.querySelectorAll(".acoustid-verify-btn").forEach(e=>{e.addEventListener("click",async()=>{let s=e.dataset.jobId;e.disabled=!0,e.textContent="\u{1F50D} \u2026";try{await fetch(`/api/verify/${s}`,{method:"POST"}),e.textContent="\u{1F50D} Gestart",setTimeout(async()=>{try{let a=await m(`/api/verify/results/${s}`),i=t.querySelector(`.q-row[data-job-id="${s}"]`);if(!i||!a.result)return;let o=i.querySelector(".acoustid-verify-btn, .acoustid-badge");if(!o)return;let d=a.result;if(d.verified){let c=d.acoustid_score!=null?Math.round(d.acoustid_score*100):"?";o.outerHTML=`<span class="acoustid-badge acoustid-ok"
                title="\u2713 Geverifieerd (${c}%&#10;${n(d.matched_title||"")} \u2013 ${n(d.matched_artist||"")})">\u2713</span>`}else{let c=d.mismatch_reason||"Mismatch";o.outerHTML=`<span class="acoustid-badge acoustid-warn" title="\u26A0 ${n(c)}">\u26A0</span>`}}catch{}},5e3)}catch{e.disabled=!1,e.textContent="\u{1F50D} Fout"}})})}function rt(t,e){let s={pending:{cls:"q-pending",lbl:"In wachtrij"},running:{cls:"q-active",lbl:"Bezig\u2026"},completed:{cls:"q-done",lbl:"\u2713 Voltooid"},failed:{cls:"q-error",lbl:"\u2717 Mislukt"},needs_review:{cls:"q-warn",lbl:"\u26A0 Controleren"}},{cls:a,lbl:i}=s[t.status]||{cls:"q-pending",lbl:t.status},o=t.source_used||t.source_requested||"auto",d=D(o),c=it(o),u=t.created_at?new Date(t.created_at*1e3).toLocaleDateString("nl-NL",{day:"numeric",month:"short"}):"",r=e&&t.status==="failed"?`<button class="tool-btn unified-retry-btn" data-job-id="${t.id}" title="Opnieuw proberen">\u21BA Retry</button>`:"",p=t.status==="failed"&&t.error_log?`<div class="unified-job-err" title="${n(t.error_log)}">${n(t.error_log.slice(0,80))}${t.error_log.length>80?"\u2026":""}</div>`:"",f=t._acoustid,v="";if(t.status==="completed"||t.status==="needs_review")if(f===void 0)v=`<button class="tool-btn acoustid-verify-btn" data-job-id="${t.id}"
        title="Verifieer via AcoustID audio fingerprinting"
        style="font-size:10px;padding:1px 6px">\u{1F50D} Verifieer</button>`;else if(f===null)v='<span class="acoustid-badge acoustid-unknown" title="Nog niet geverifieerd">?</span>';else if(f.verified)v=`<span class="acoustid-badge acoustid-ok"
        title="\u2713 Geverifieerd (AcoustID score ${f.acoustid_score!=null?Math.round(f.acoustid_score*100):"?"}%&#10;${n(f.matched_title||"")} \u2013 ${n(f.matched_artist||"")})">\u2713</span>`;else{let g=f.mismatch_reason||"Verificatie mislukt";v=`<span class="acoustid-badge acoustid-warn"
        title="\u26A0 ${n(g)}">\u26A0</span>`}return`
    <div class="q-row" data-job-id="${t.id}">
      <div class="q-info" style="flex:1">
        <div class="q-title">${n(t.album||t.track||"(onbekend)")}</div>
        ${t.artist?`<div class="q-artist artist-link" data-artist="${n(t.artist)}">${n(t.artist)}</div>`:""}
        <div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap">
          <span class="q-status ${a}">${n(i)}</span>
          ${o!=="auto"&&o!=="none"?`<span class="orpheus-platform-badge" style="--badge-color:${d};font-size:10px;padding:1px 6px">${n(c)}</span>`:""}
          ${u?`<span style="font-size:10px;color:var(--muted2)">${n(u)}</span>`:""}
          ${t.attempts>1?`<span style="font-size:10px;color:var(--muted2)">${t.attempts}\xD7 geprobeerd</span>`:""}
          ${v}
        </div>
        ${p}
      </div>
      ${r}
    </div>`}function Et(t){l.unifiedView=t,document.querySelectorAll("[data-unified-view]").forEach(s=>{let a=s.dataset.unifiedView===t;s.classList.toggle("sel-def",a),s.setAttribute("aria-selected",a?"true":"false")});let e=document.getElementById("unified-search-wrap");if(e&&(e.style.display=t==="search"?"":"none"),t==="search"){let s=document.getElementById("unified-search")?.value||"";if(s.length>=2)I(s);else{let a=document.getElementById("unified-content");a&&(a.innerHTML='<div class="empty">Begin met typen om over alle bronnen te zoeken.</div>')}}else t==="queue"?ot():t==="history"&&L()}async function Tt(){T(`
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
  `),nt(document.getElementById("src-status-container")),document.querySelectorAll("[data-unified-view]").forEach(e=>{e.addEventListener("click",()=>Et(e.dataset.unifiedView))});let t;document.getElementById("unified-search")?.addEventListener("input",e=>{clearTimeout(t),t=setTimeout(()=>I(e.target.value),500)}),document.getElementById("unified-type-sel")?.addEventListener("change",()=>{let e=document.getElementById("unified-search")?.value||"";e.length>=2&&I(e)}),document.getElementById("btn-open-tidarr")?.addEventListener("click",yt),document.getElementById("btn-tidarr-close")?.addEventListener("click",()=>{document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}),X()}function Pt(){l.activeView="downloads",tt(),Tt()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{B()});document.getElementById("dl-confirm-modal")?.addEventListener("click",t=>{t.target===document.getElementById("dl-confirm-modal")&&B()});document.getElementById("queue-fab")?.addEventListener("click",wt);document.getElementById("qpop-close")?.addEventListener("click",t=>{t.stopPropagation(),S()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{S(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>K("queue"),150)});document.addEventListener("click",t=>{let e=document.getElementById("queue-popover"),s=document.getElementById("queue-fab");e?.classList.contains("open")&&!e.contains(t.target)&&!s?.contains(t.target)&&S()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let t=document.getElementById("tidarr-iframe");t.src=t.dataset.src});export{F as a,ut as b,pt as c,J as d,z as e,R as f,ft as g,vt as h,mt as i,Ht as j,Z as k,Y as l,K as m,W as n,Dt as o,ht as p,X as q,Ot as r,yt as s,tt as t,bt as u,et as v,wt as w,S as x,j as y,C as z,st as A,B,Q as C,Mt as D,_t as E,at as F,At as G,nt as H,V as I,I as J,xt as K,ot as L,L as M,Et as N,Tt as O,Pt as P};
