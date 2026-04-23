import{F as v,a as i,b as p,h as u,j as r,m as g,s as q,w}from"./chunk-K5NRXECC.js";function H(){return localStorage.getItem("downloadQuality")||"high"}async function M(){let e=i.tabAbort?.signal;try{let s=await v("/api/tidarr/status",{signal:e});if(e?.aborted)return;let a=document.getElementById("tidarr-status-pill"),t=document.getElementById("tidarr-status-text");i.tidarrOk=!!s.connected,a&&t&&(a.className=`tidarr-status-pill ${i.tidarrOk?"on":"off"}`,t.textContent=i.tidarrOk?`Tidarr \xB7 verbonden${s.quality?" \xB7 "+s.quality:""}`:"Tidarr offline")}catch(s){if(s.name==="AbortError")return;i.tidarrOk=!1;let a=document.getElementById("tidarr-status-text");a&&(a.textContent="Tidarr offline")}}async function E(){let e=i.tabAbort?.signal;try{let s=await v("/api/tidarr/queue",{signal:e});if(e?.aborted)return;let a=(s.items||[]).length,t=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of t)n&&(a>0?(n.textContent=a,n.style.display=""):n.style.display="none")}catch(s){if(s.name==="AbortError")return}}function h(e){let s=e.image?`<img class="tidal-img" src="${r(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${g(e.title)}">${u(e.title)}</div>`:`<div class="tidal-ph" style="background:${g(e.title)}">${u(e.title)}</div>`,a=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${s}</div>
      <div class="tidal-info">
        <div class="tidal-title">${r(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${r(e.artist)}">${r(e.artist)}</div>
        <div class="tidal-meta">${r(a)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${r(e.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}async function j(e){let s=document.getElementById("tidal-content");if(!s)return;let a=(e||"").trim();if(a.length<2){s.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}s.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let t=await v(`/api/tidarr/search?q=${encodeURIComponent(a)}`);if(i.tidalSearchResults=t.results||[],t.error){s.innerHTML=`<div class="error-box">\u26A0\uFE0F ${r(t.error)}</div>`;return}if(!i.tidalSearchResults.length){s.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${r(a)}</strong>".</div>`;return}let n=i.tidalSearchResults.filter(d=>d.type==="album"),o=i.tidalSearchResults.filter(d=>d.type==="track"),l="";n.length&&(l+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(h).join("")}</div>`),o.length&&(l+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${o.length})</div>
        <div class="tidal-grid">${o.map(h).join("")}</div>`),s.innerHTML=l}catch(t){s.innerHTML=`<div class="error-box">\u26A0\uFE0F ${r(t.message)}</div>`}}function U(e,s=!1){let a={queued:"q-pending",pending:"q-pending",downloading:"q-active",processing:"q-active",completed:"q-done",done:"q-done",error:"q-error",failed:"q-error"}[String(e.status||"").toLowerCase()]||"q-pending",t=typeof e.progress=="number"?Math.round(e.progress):null,n=t!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${t}%"></div></div>
       <div class="q-pct">${t}%</div>`:"",o=s?"":`<button class="q-remove" data-qid="${r(e.id)}" title="Verwijder uit queue">\u2715</button>`;return`
    <div class="q-row">
      <div class="q-info">
        <div class="q-title">${r(e.title||"(onbekend)")}</div>
        ${e.artist?`<div class="q-artist artist-link" data-artist="${r(e.artist)}">${r(e.artist)}</div>`:""}
        <span class="q-status ${a}">${r(e.status||"queued")}</span>
      </div>
      ${n}${o}
    </div>`}function x(){let e=document.getElementById("tidal-content");if(!e)return;let s=i.tidarrQueueItems;if(!s.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},t={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${s.length} item${s.length!==1?"s":""} in queue</div>
    <div class="q-list">${s.map(n=>{let o=t[n.status]||"q-pending",l=a[n.status]||n.status||"In wachtrij",d=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,c=d!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${d}%"></div></div><div class="q-pct">${d}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${r(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${r(n.artist)}</div>`:""}
          <span class="q-status ${o}">${r(l)}</span>
        </div>
        ${c}
        <button class="q-remove" data-qid="${r(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function I(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let s=await v("/api/downloads");if(!s.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let a={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
      <div class="section-title">${s.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${s.map(t=>{let n=t.queued_at?new Date(t.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",o=a[t.quality]||t.quality||"",l=t.image||t.cover||t.album_art||"";return`<div class="q-row">
          ${l?`<img class="q-thumb" src="${r(l)}" alt="" loading="lazy">`:`<div class="q-thumb q-thumb-ph" style="background:${g(t.title||t.artist||"?")}">${u(t.title||t.artist||"?")}</div>`}
          <div class="q-info">
            <div class="q-title">${r(t.title)}</div>
            ${t.artist?`<div class="q-artist artist-link" data-artist="${r(t.artist)}">${r(t.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${o?" \xB7 "+o:""}${n?" \xB7 "+n:""}</span>
          </div>
          <button class="q-remove" data-dlid="${t.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await p("/api/downloads",{method:"DELETE"})}catch(t){t.name}for(let t of s)try{await p(`/api/downloads/${t.id}`,{method:"DELETE"})}catch(n){n.name}i.downloadedSet.clear(),I()}})}catch(s){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${r(s.message)}</div>`}}}function T(e){i.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(a=>{let t=a.dataset.tidalView===e;a.classList.toggle("sel-def",t),a.setAttribute("aria-selected",t?"true":"false")});let s=document.getElementById("tidal-search-wrap");s&&(s.style.display=e==="search"?"":"none"),e==="search"?j(document.getElementById("tidal-search")?.value||""):e==="queue"?x():e==="history"&&I()}function k(){if(i.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");i.tidarrSseSource=e,e.onmessage=s=>{try{i.tidarrQueueItems=JSON.parse(s.data)||[]}catch{i.tidarrQueueItems=[]}let a=i.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),t=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of t)n&&(a.length>0?(n.textContent=a.length,n.style.display=""):n.style.display="none");if(V(i.tidarrQueueItems),i.activeView==="downloads"&&i.tidalView==="queue"&&x(),document.getElementById("queue-popover")?.classList.contains("open")&&L(),i.activeView==="nu"){let n=document.getElementById("wbody-download-voortgang");n&&Q(n,a)}},e.onerror=()=>{e.close(),i.tidarrSseSource=null,setTimeout(k,1e4)}}function K(){i.tidarrSseSource&&(i.tidarrSseSource.close(),i.tidarrSseSource=null)}function Q(e,s){if(s||(s=i.tidarrQueueItems.filter(t=>t.status!=="finished"&&t.status!=="error")),!s.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};e.innerHTML=`<div class="w-queue-list">${s.slice(0,5).map(t=>{let n=t.progress?.current&&t.progress?.total?Math.round(t.progress.current/t.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${r(t.title||"(onbekend)")}</div>
      ${t.artist?`<div class="w-q-artist">${r(t.artist)}</div>`:""}
      ${n!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${n}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${n}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${r(a[t.status]||t.status)}</span>`}
    </div></div>`}).join("")}${s.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${s.length-5} meer</div>`:""}</div>`}function R(){k()}function Z(){}function J(){let e=document.getElementById("tidarr-iframe"),s=document.getElementById("tidarr-ui-wrap"),a=document.getElementById("content");s.style.display="flex",a.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function A(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function V(e){let s=document.getElementById("queue-fab"),a=document.getElementById("fab-queue-badge");if(!s)return;let t=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(s.style.display="",t.length>0?(a.textContent=t.length,a.style.display=""):a.style.display="none"):(s.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function L(){let e=document.getElementById("queue-popover-list");if(!e)return;let s=i.tidarrQueueItems;if(!s.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},t={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=s.map(n=>{let o=t[n.status]||"q-pending",l=a[n.status]||n.status||"In wachtrij",d=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,c=d!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${d}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${r(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${r(n.artist)}</div>`:""}
      <span class="q-status ${o}">${r(l)}</span>
      ${c}
    </div>`}).join("")}function _(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&L()}function m(){document.getElementById("queue-popover")?.classList.remove("open")}function b(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function B(e,s){let a=b(e),t=b(s);return!a||!t?!0:a===t||a.includes(t)||t.includes(a)}function z(e,s,a,t){return new Promise(n=>{i.dlResolve=n;let o=document.getElementById("dl-confirm-modal"),l=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${a}"${s?" \u2013 "+s:""}`,l.innerHTML=e.map((d,c)=>{let S=!B(d.artist,s),D=d.image?`<img class="dlc-img" src="${r(d.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${u(d.title)}</div>`:`<div class="dlc-ph">${u(d.title)}</div>`,C=S?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${r(d.artist)}</div>`:`<div class="dlc-artist">${r(d.artist)}</div>`,y=d.score??0;return`
        <button class="dlc-card${c===0?" dlc-best":""}" data-dlc-idx="${c}">
          <div class="dlc-cover">${D}</div>
          <div class="dlc-info">
            <div class="dlc-title">${r(d.title)}</div>
            ${C}
            <div class="dlc-meta">${d.year?r(d.year):""}${d.year&&d.tracks?" \xB7 ":""}${d.tracks?d.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${y}%"></div></div>
            <div class="dlc-score-label">${y}% overeenkomst</div>
          </div>
          ${c===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),l.querySelectorAll(".dlc-card").forEach(d=>{d.addEventListener("click",()=>{let c=parseInt(d.dataset.dlcIdx);f(),n({chosen:e[c],btn:t})})}),o.classList.add("open"),document.body.style.overflow="hidden"})}function f(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",i.dlResolve&&(i.dlResolve({chosen:null}),i.dlResolve=null)}async function $(e,s,a,t){let n=await p("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||a||"",artist:e.artist||s||"",id:String(e.id||""),quality:H()})}),o=await n.json();if(!n.ok||!o.ok)throw new Error(o.error||"download mislukt");q(e.artist||s||"",e.title||a||""),t&&(t.textContent="\u2713",t.classList.add("dl-done"),t.disabled=!1),await E()}async function W(e,s,a){if(!i.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}a&&(a.disabled=!0,a.textContent="\u2026");try{let t=new URLSearchParams;e&&t.set("artist",e),s&&t.set("album",s);let n=await p(`/api/tidarr/candidates?${t}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${s}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let{candidates:o}=await n.json();if(!o?.length){alert(`Niet gevonden op TIDAL: "${s}"${e?" van "+e:""}`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let l=o[0];if(e&&!B(l.artist,e)){a&&(a.disabled=!1,a.textContent="\u2B07");let{chosen:d}=await z(o,e,s,a);if(!d)return;a&&(a.disabled=!0,a.textContent="\u2026"),await $(d,e,s,a)}else await $(l,e,s,a)}catch(t){alert("Downloaden mislukt: "+t.message),a&&(a.disabled=!1,a.textContent="\u2B07")}}async function P(){w(`
    <div class="tidal-page">
      <div class="tidal-tabs-row">
        <div class="seg-tabs" role="tablist" aria-label="Downloads secties">
          <button class="tool-btn sel-def" data-tidal-view="search" role="tab" aria-selected="true">Zoeken</button>
          <button class="tool-btn" data-tidal-view="queue" role="tab" aria-selected="false">Queue <span class="badge-inline" id="badge-tidarr-queue-inline" style="display:none">0</span></button>
          <button class="tool-btn" data-tidal-view="history" role="tab" aria-selected="false">Geschiedenis</button>
        </div>
        <div class="tidal-tabs-actions">
          <span class="tidarr-status-pill off" id="tidarr-status-pill"><span class="tidarr-dot"></span><span id="tidarr-status-text">Tidarr status\u2026</span></span>
          <button class="tool-btn" id="btn-open-tidarr" type="button">Open Tidarr</button>
        </div>
      </div>
      <div class="tidal-search-wrap" id="tidal-search-wrap">
        <input id="tidal-search" class="tidal-search" type="search" placeholder="Zoek albums of tracks op Tidal\u2026" autocomplete="off">
      </div>
      <div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>
    </div>
  `),await M(),await E(),T(i.tidalView),R()}function Y(){i.activeView="downloads",A(),P()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{f()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&f()});document.getElementById("queue-fab")?.addEventListener("click",_);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),m()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{m(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>T("queue"),150)});document.addEventListener("click",e=>{let s=document.getElementById("queue-popover"),a=document.getElementById("queue-fab");s?.classList.contains("open")&&!s.contains(e.target)&&!a?.contains(e.target)&&m()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});export{H as a,M as b,E as c,h as d,j as e,U as f,x as g,I as h,T as i,k as j,K as k,Q as l,R as m,Z as n,J as o,A as p,V as q,L as r,_ as s,m as t,b as u,B as v,z as w,f as x,$ as y,W as z,P as A,Y as B};
