(()=>{var s={activeTab:"nu",activeSubTab:null,bibSubTab:"collectie",sectionContainerEl:null,currentPeriod:"7day",recsFilter:"all",discFilter:"all",gapsSort:"missing",releasesSort:"listening",releasesFilter:"all",plexOk:!1,lastDiscover:null,lastGaps:null,lastReleases:null,lastRecs:null,plexLibData:null,wishlistMap:new Map,newReleaseIds:new Set,searchTimeout:null,tidalSearchTimeout:null,tabAbort:null,tidarrOk:!1,tidalView:"search",tidalSearchResults:null,tidarrQueuePoll:null,tidarrSseSource:null,tidarrQueueItems:[],downloadedSet:new Set,spotifyEnabled:!1,activeMood:null,previewAudio:new Audio,previewBtn:null,collapsibleSections:{recs:!1,releases:!1,discover:!1},sectionMutex:Promise.resolve(),dlResolve:null,VALID_QUALITIES:["max","high","normal","low"]};function k(e,t={}){return!t.signal&&s.tabAbort&&(t={...t,signal:s.tabAbort.signal}),fetch(e,t)}var ke=window.matchMedia("(prefers-reduced-motion: reduce)").matches,S=document.getElementById("content");function B(e,t=120){return e?`/api/img?url=${encodeURIComponent(e)}&w=${t}&h=${t}`:null}var R=(e,t="medium")=>{if(!e)return null;let a=e.find(i=>i.size===t);return a&&a["#text"]&&!a["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f")?a["#text"]:null},g=e=>String(e||"?").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2),q=e=>parseInt(e).toLocaleString("nl-NL"),o=e=>String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),ee=e=>({"7day":"week","1month":"maand","3month":"3 maanden","12month":"jaar",overall:"alles"})[e]||e;function te(e){let t=Math.floor(Date.now()/1e3)-e;return t<120?"zojuist":t<3600?`${Math.floor(t/60)}m`:t<86400?`${Math.floor(t/3600)}u`:`${Math.floor(t/86400)}d`}function f(e,t=!1){let a=0;for(let r=0;r<e.length;r++)a=a*31+e.charCodeAt(r)&16777215;let i=a%360,n=45+a%31,d=50+(a>>8)%26,c=20+(a>>16)%16,l=15+(a>>10)%11;return t?`radial-gradient(circle, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`:`linear-gradient(135deg, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`}function W(e){return!e||e.length!==2?"":[...e.toUpperCase()].map(t=>String.fromCodePoint(t.charCodeAt(0)+127397)).join("")}function V(e,t=4){return e?.length?`<div class="tags" style="margin-top:5px">${e.slice(0,t).map(a=>`<span class="tag">${o(a)}</span>`).join("")}</div>`:""}function se(e){return s.plexOk?e?'<span class="badge plex">\u25B6 In Plex</span>':'<span class="badge new">\u2726 Nieuw</span>':""}function z(e,t,a="",i=""){let n=s.wishlistMap.has(`${e}:${t}`);return`<button class="bookmark-btn${n?" saved":""}"
    data-btype="${o(e)}" data-bname="${o(t)}"
    data-bartist="${o(a)}" data-bimage="${o(i)}"
    title="${n?"Verwijder uit lijst":"Sla op in lijst"}">\u{1F516}</button>`}function ce(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function _e(e,t){let a=i=>(i||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");return`${a(e)}|${a(t)}`}var Ve=(e,t)=>s.downloadedSet.has(_e(e,t)),Ge=(e,t)=>s.downloadedSet.add(_e(e,t));function F(e,t="",a=!1){return!s.tidarrOk||a?"":Ve(e,t)?`<button class="download-btn dl-done"
      data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
      title="Al gedownload">\u2713</button>`:`<button class="download-btn"
    data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
    title="Download via Tidarr">\u2B07</button>`}var Le=e=>{let t=R(e);return t?`<img class="card-img" src="${t}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>'};function ae(e,t=!0,a=""){let i=e.inPlex,n=f(e.title||""),d=e.year||"\u2014",c=Ve(a,e.title||""),l=s.tidarrOk&&a&&!i?c?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${o(a)}" data-dlalbum="${o(e.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${o(a)}" data-dlalbum="${o(e.title||"")}" title="Download via Tidarr">\u2B07</button>`:"";return`
    <div class="album-card ${i?"owned":"missing"}" title="${o(e.title)}${d!=="\u2014"?" ("+d+")":""}">
      <div class="album-cover" style="background:${n}">
        <div class="album-cover-ph">${g(e.title||"?")}</div>
        <img src="${o(e.coverUrl||"")}" alt="" loading="lazy"
          style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1"
          onload="this.style.opacity='1'" onerror="this.remove()">
        ${l}
      </div>
      <div class="album-info">
        <div class="album-title">${o(e.title)}</div>
        <div class="album-year">${d}</div>
        ${t?`<span class="album-status ${i?"own":"miss"}">${i?"\u25B6 In Plex":"\u2726 Ontbreekt"}</span>`:""}
      </div>
    </div>`}function Ne(){if(ke)return;Object.entries({".rec-grid > *":60,".card-list > *":25,".artist-grid > *":40,".releases-grid > *":40,".wishlist-grid > *":40}).forEach(([t,a])=>{document.querySelectorAll(t).forEach((i,n)=>{i.style.animationDelay=`${n*a}ms`})})}function bt(e){let t="";e==="cards"?t='<div class="skeleton-list">'+Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")+"</div>":e==="grid"?t='<div class="skeleton-grid">'+Array(8).fill('<div class="skeleton skeleton-square"></div>').join("")+"</div>":e==="stats"?t='<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>':t=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`,w(t)}function w(e,t){s.sectionContainerEl&&!document.contains(s.sectionContainerEl)&&(s.sectionContainerEl=null);let a=s.sectionContainerEl||S;!s.sectionContainerEl&&document.startViewTransition?document.startViewTransition(()=>{a.innerHTML=e,Ne(),t&&requestAnimationFrame(t)}).finished.catch(()=>{}):(a.innerHTML=e,s.sectionContainerEl?t&&t():(S.style.opacity="0",S.style.transform="translateY(6px)",requestAnimationFrame(()=>{S.offsetHeight,S.style.opacity="1",S.style.transform="",Ne(),t&&requestAnimationFrame(t)})))}var M=e=>w(`<div class="error-box">\u26A0\uFE0F ${o(e)}</div>`);function D(e){if(s.sectionContainerEl){s.sectionContainerEl.innerHTML=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`;return}let t={recent:"cards",loved:"cards",toptracks:"cards",topartists:"grid",releases:"grid",recs:"grid",discover:"grid",gaten:"grid",stats:"stats",lijst:"grid",collectie:"cards",tidal:"cards",nu:"cards",ontdek:"grid",bibliotheek:"cards",downloads:"cards"},a=s.activeSubTab||s.activeTab,i=t[a];i&&!e?bt(i):w(`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`)}function ie(e,t){if(!e)return;if(!("IntersectionObserver"in window)){t();return}let a=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(a.unobserve(n.target),t())})},{rootMargin:"300px"});a.observe(e)}function O(e,t){let a=s.sectionMutex.then(async()=>{s.sectionContainerEl=e;try{await t()}finally{s.sectionContainerEl=null}});return s.sectionMutex=a.catch(()=>{}),a}var ue=new Map;function T(e,t){let a=ue.get(e);return a?Date.now()-a.timestamp>t?(ue.delete(e),null):a.data:null}function C(e,t){ue.set(e,{data:t,timestamp:Date.now()})}function G(e){ue.delete(e)}function ft(e){if(document.getElementById("rate-limit-notice"))return;let t=document.createElement("div");t.id="rate-limit-notice",Object.assign(t.style,{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",background:"#e05a2b",color:"#fff",padding:"12px 24px",borderRadius:"8px",zIndex:"9999",fontSize:"14px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",whiteSpace:"nowrap"}),t.textContent="\u23F1 "+e,document.body.appendChild(t),setTimeout(()=>t.remove(),8e3)}async function v(e,{signal:t}={}){let a=await fetch(e,{signal:t});if(a.status===429){let n=(await a.json().catch(()=>({}))).error||"Te veel verzoeken, probeer het over een minuut opnieuw";throw ft(n),new Error(n)}if(!a.ok)throw new Error(`Serverfout ${a.status}`);return a.json()}async function Ue(){try{let e=await v("/api/downloads/keys");s.downloadedSet=new Set(e)}catch{s.downloadedSet=new Set}}async function U(){try{let e=await fetch("/api/plex/status").then(i=>i.json()),t=document.getElementById("plex-pill"),a=document.getElementById("plex-pill-text");if(e.connected){s.plexOk=!0,t.className="plex-pill on";let i=e.albums?` \xB7 ${q(e.albums)} albums`:"";a.textContent=`Plex \xB7 ${q(e.artists)} artiesten${i}`}else t.className="plex-pill off",a.textContent="Plex offline"}catch{document.getElementById("plex-pill-text").textContent="Plex offline"}}async function Qe(){try{let e=T("user",6e5);e||(e=await v("/api/user"),C("user",e));let t=e.user,a=R(t.image,"large"),i=a?`<img class="user-avatar" src="${a}" alt="">`:`<div class="user-avatar-ph">${(t.name||"U")[0].toUpperCase()}</div>`,n=new Date(parseInt(t.registered?.unixtime)*1e3).getFullYear();document.getElementById("user-wrap").innerHTML=`
      <div class="user-card">${i}
        <div><div class="user-name">${o(t.realname||t.name)}</div>
        <div class="user-sub">${q(t.playcount)} scrobbles \xB7 lid sinds ${n}</div></div>
      </div>`}catch{}}async function Ie(){try{let e=await v("/api/wishlist");s.wishlistMap.clear();for(let t of e)s.wishlistMap.set(`${t.type}:${t.name}`,t.id);ne()}catch{}}function ne(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=s.wishlistMap.size||"0")}async function We(e,t,a,i){let n=`${e}:${t}`;if(s.wishlistMap.has(n)){try{await k(`/api/wishlist/${s.wishlistMap.get(n)}`,{method:"DELETE"})}catch(d){if(d.name!=="AbortError")throw d}return s.wishlistMap.delete(n),ne(),!1}else{let c=await(await k("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:t,artist:a,image:i})})).json();return s.wishlistMap.set(n,c.id),ne(),!0}}async function le(){D(),await Ie();try{let e=await v("/api/wishlist");if(!e.length){w('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let t=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let a of e){let i=a.image?`<img src="${o(a.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";t+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${f(a.name)}">
            ${i}
            <div class="wish-ph">${g(a.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${o(a.name)}">${o(a.name)}</div>
              ${a.artist?`<div class="wish-sub">${o(a.artist)}</div>`:""}
              <div class="wish-type">${a.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${a.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}w(t+"</div>")}catch(e){M(e.message)}}function yt(){return localStorage.getItem("downloadQuality")||"high"}async function Se(){let e=s.tabAbort?.signal;try{let t=await v("/api/tidarr/status",{signal:e});if(e?.aborted)return;let a=document.getElementById("tidarr-status-pill"),i=document.getElementById("tidarr-status-text");s.tidarrOk=!!t.connected,a&&i&&(a.className=`tidarr-status-pill ${s.tidarrOk?"on":"off"}`,i.textContent=s.tidarrOk?`Tidarr \xB7 verbonden${t.quality?" \xB7 "+t.quality:""}`:"Tidarr offline")}catch(t){if(t.name==="AbortError")return;s.tidarrOk=!1;let a=document.getElementById("tidarr-status-text");a&&(a.textContent="Tidarr offline")}}async function pe(){let e=s.tabAbort?.signal;try{let t=await v("/api/tidarr/queue",{signal:e});if(e?.aborted)return;let a=(t.items||[]).length,i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(a>0?(n.textContent=a,n.style.display=""):n.style.display="none")}catch(t){if(t.name==="AbortError")return}}function Je(e){let t=e.image?`<img class="tidal-img" src="${o(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${f(e.title)}">${g(e.title)}</div>`:`<div class="tidal-ph" style="background:${f(e.title)}">${g(e.title)}</div>`,a=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${t}</div>
      <div class="tidal-info">
        <div class="tidal-title">${o(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${o(e.artist)}">${o(e.artist)}</div>
        <div class="tidal-meta">${o(a)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${o(e.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}async function Te(e){let t=document.getElementById("tidal-content");if(!t)return;let a=(e||"").trim();if(a.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let i=await v(`/api/tidarr/search?q=${encodeURIComponent(a)}`);if(s.tidalSearchResults=i.results||[],i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.error)}</div>`;return}if(!s.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${o(a)}</strong>".</div>`;return}let n=s.tidalSearchResults.filter(l=>l.type==="album"),d=s.tidalSearchResults.filter(l=>l.type==="track"),c="";n.length&&(c+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(Je).join("")}</div>`),d.length&&(c+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(Je).join("")}</div>`),t.innerHTML=c}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.message)}</div>`}}function Ke(){let e=document.getElementById("tidal-content");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${l}%"></div></div><div class="q-pct">${l}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${o(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${o(n.artist)}</div>`:""}
          <span class="q-status ${d}">${o(c)}</span>
        </div>
        ${r}
        <button class="q-remove" data-qid="${o(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function Xe(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let t=await v("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let a={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
      <div class="section-title">${t.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${t.map(i=>{let n=i.queued_at?new Date(i.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",d=a[i.quality]||i.quality||"";return`<div class="q-row">
          <div class="q-info">
            <div class="q-title">${o(i.title)}</div>
            ${i.artist?`<div class="q-artist artist-link" data-artist="${o(i.artist)}">${o(i.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${d?" \xB7 "+d:""}${n?" \xB7 "+n:""}</span>
          </div>
          <button class="q-remove" data-dlid="${i.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await k("/api/downloads",{method:"DELETE"})}catch(i){i.name}for(let i of t)try{await k(`/api/downloads/${i.id}`,{method:"DELETE"})}catch(n){n.name}s.downloadedSet.clear(),Xe()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`}}}function me(e){s.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(t=>t.classList.toggle("sel-def",t.dataset.tidalView===e)),e==="search"?Te(document.getElementById("tidal-search")?.value||""):e==="queue"?Ke():e==="history"&&Xe()}function ve(){if(s.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");s.tidarrSseSource=e,e.onmessage=t=>{try{s.tidarrQueueItems=JSON.parse(t.data)||[]}catch{s.tidarrQueueItems=[]}let a=s.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(a.length>0?(n.textContent=a.length,n.style.display=""):n.style.display="none");if(wt(s.tidarrQueueItems),s.activeSubTab==="tidal"&&s.tidalView==="queue"&&Ke(),document.getElementById("queue-popover")?.classList.contains("open")&&tt(),s.activeTab==="nu"){let n=document.getElementById("wbody-download-voortgang");n&&Ce(n,a)}},e.onerror=()=>{e.close(),s.tidarrSseSource=null,setTimeout(ve,1e4)}}function Ce(e,t){if(t||(t=s.tidarrQueueItems.filter(i=>i.status!=="finished"&&i.status!=="error")),!t.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};e.innerHTML=`<div class="w-queue-list">${t.slice(0,5).map(i=>{let n=i.progress?.current&&i.progress?.total?Math.round(i.progress.current/i.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${o(i.title||"(onbekend)")}</div>
      ${i.artist?`<div class="w-q-artist">${o(i.artist)}</div>`:""}
      ${n!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${n}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${n}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${o(a[i.status]||i.status)}</span>`}
    </div></div>`}).join("")}${t.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${t.length-5} meer</div>`:""}</div>`}function ht(){ve()}function et(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),a=document.getElementById("content");t.style.display="flex",a.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function H(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function wt(e){let t=document.getElementById("queue-fab"),a=document.getElementById("fab-queue-badge");if(!t)return;let i=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",i.length>0?(a.textContent=i.length,a.style.display=""):a.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function tt(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${l}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${o(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${o(n.artist)}</div>`:""}
      <span class="q-status ${d}">${o(c)}</span>
      ${r}
    </div>`}).join("")}function $t(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&tt()}function Be(){document.getElementById("queue-popover")?.classList.remove("open")}function Ye(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function st(e,t){let a=Ye(e),i=Ye(t);return!a||!i?!0:a===i||a.includes(i)||i.includes(a)}function xt(e,t,a,i){return new Promise(n=>{s.dlResolve=n;let d=document.getElementById("dl-confirm-modal"),c=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${a}"${t?" \u2013 "+t:""}`,c.innerHTML=e.map((l,r)=>{let p=!st(l.artist,t),$=l.image?`<img class="dlc-img" src="${o(l.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${g(l.title)}</div>`:`<div class="dlc-ph">${g(l.title)}</div>`,u=p?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${o(l.artist)}</div>`:`<div class="dlc-artist">${o(l.artist)}</div>`,b=l.score??0;return`
        <button class="dlc-card${r===0?" dlc-best":""}" data-dlc-idx="${r}">
          <div class="dlc-cover">${$}</div>
          <div class="dlc-info">
            <div class="dlc-title">${o(l.title)}</div>
            ${u}
            <div class="dlc-meta">${l.year?o(l.year):""}${l.year&&l.tracks?" \xB7 ":""}${l.tracks?l.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${b}%"></div></div>
            <div class="dlc-score-label">${b}% overeenkomst</div>
          </div>
          ${r===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),c.querySelectorAll(".dlc-card").forEach(l=>{l.addEventListener("click",()=>{let r=parseInt(l.dataset.dlcIdx);Ae(),n({chosen:e[r],btn:i})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function Ae(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",s.dlResolve&&(s.dlResolve({chosen:null}),s.dlResolve=null)}async function Ze(e,t,a,i){let n=await k("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||a||"",artist:e.artist||t||"",id:String(e.id||""),quality:yt()})}),d=await n.json();if(!n.ok||!d.ok)throw new Error(d.error||"download mislukt");Ge(e.artist||t||"",e.title||a||""),i&&(i.textContent="\u2713",i.classList.add("dl-done"),i.disabled=!1),await pe()}async function at(e,t,a){if(!s.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}a&&(a.disabled=!0,a.textContent="\u2026");try{let i=new URLSearchParams;e&&i.set("artist",e),t&&i.set("album",t);let n=await k(`/api/tidarr/candidates?${i}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let{candidates:d}=await n.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let c=d[0];if(e&&!st(c.artist,e)){a&&(a.disabled=!1,a.textContent="\u2B07");let{chosen:l}=await xt(d,e,t,a);if(!l)return;a&&(a.disabled=!0,a.textContent="\u2026"),await Ze(l,e,t,a)}else await Ze(c,e,t,a)}catch(i){alert("Downloaden mislukt: "+i.message),a&&(a.disabled=!1,a.textContent="\u2B07")}}async function qe(){w('<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>'),await Se(),await pe(),me(s.tidalView),ht()}function it(){s.activeSubTab="tidal",H(),document.getElementById("tb-tidal")?.classList.add("visible"),qe()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{Ae()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&Ae()});document.getElementById("queue-fab")?.addEventListener("click",$t);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),Be()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{Be(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>me("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),a=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!a?.contains(e.target)&&Be()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});async function lt(){try{let e=await v("/api/spotify/status");s.spotifyEnabled=!!e.enabled;let t=document.getElementById("tb-mood");s.spotifyEnabled&&s.activeSubTab==="recs"?(t.style.display="",t.classList.add("visible")):s.spotifyEnabled&&(t.style.display="")}catch{s.spotifyEnabled=!1}}function Et(e,t){let a=e.image?`<img src="${o(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',i=e.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${o(e.preview_url)}"
         data-artist="${o(e.artist)}" data-track="${o(e.name)}"
         id="spbtn-${t}" title="Luister preview">\u25B6</button>`:"",n=e.spotify_url?`<a class="spotify-link-btn" href="${o(e.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`
    <div class="spotify-card">
      <div class="spotify-cover">
        ${a}${i}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${t}"></div>
        </div>
      </div>
      <div class="spotify-info">
        <div class="spotify-track" title="${o(e.name)}">${o(e.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${o(e.artist)}">${o(e.artist)}</div>
        <div class="spotify-album" title="${o(e.album)}">${o(e.album)}</div>
        ${n}
      </div>
    </div>`}async function be(e){let t=document.getElementById("spotify-recs-section");if(!t)return;let a={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};t.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let i=`spotify:${e}`,n=T(i,300*1e3);if(n||(n=await v(`/api/spotify/recs?mood=${encodeURIComponent(e)}`),C(i,n)),!n.length){t.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let d=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${o(a[e]||e)}</div>
      <div class="spotify-grid">`;n.forEach((c,l)=>{d+=Et(c,l)}),d+="</div>",t.innerHTML=d}catch{t.innerHTML=""}}function Z(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(e=>{e.addEventListener("click",async()=>{let t=e.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(a=>a.classList.remove("sel-mood","loading")),s.activeMood===t){s.activeMood=null,Z(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}s.activeMood=t,e.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await be(t),e.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",Z()});document.addEventListener("click",e=>{let t=e.target.closest(".spotify-play-btn");if(!t)return;e.stopPropagation();let a=t.dataset.spotifyPreview;if(a){if(s.previewBtn===t){s.previewAudio.paused?(s.previewAudio.play(),t.textContent="\u23F8",t.classList.add("playing")):(s.previewAudio.pause(),t.textContent="\u25B6",t.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=t,s.previewAudio.src=a,s.previewAudio.currentTime=0,s.previewAudio.play().then(()=>{t.textContent="\u23F8",t.classList.add("playing")}).catch(()=>{t.textContent="\u25B6",s.previewBtn=null})}},!0);async function ge(){D();let e=s.tabAbort?.signal;try{let t=T("recs",3e5);if(!(t!==null)){if(t=await v("/api/recs",{signal:e}),e?.aborted)return;C("recs",t)}let i=t.recommendations||[],n=t.albumRecs||[],d=t.trackRecs||[];if(s.plexOk=t.plexConnected||s.plexOk,s.lastRecs=t,t.plexConnected&&t.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${q(t.plexArtistCount)} artiesten`),!i.length){w('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let c=i.filter(u=>!u.inPlex).length,l=i.filter(u=>u.inPlex).length,r=document.getElementById("hdr-title-recs");r&&(r.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${i.length} artiesten`);let p='<div class="spotify-section" id="spotify-recs-section"></div>';p+=`<div class="section-title">Gebaseerd op jouw smaak: ${(t.basedOn||[]).slice(0,3).join(", ")}
      ${s.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${c} nieuw</span> \xB7 <span style="color:var(--plex)">${l} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let u=0;u<i.length;u++){let b=i[u],h=Math.round(b.match*100);p+=`
        <div class="rec-card" data-inplex="${b.inPlex}" id="rc-${u}">
          <div class="rec-photo" id="rph-${u}">
            <div class="rec-photo-ph" style="background:${f(b.name)}">${g(b.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${o(b.name)}">${o(b.name)}</span>
                ${se(b.inPlex)}
              </div>
              <span class="rec-match">${h}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${o(b.reason)}</div>
            <div id="rtags-${u}"></div>
            <div id="ralb-${u}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`}if(p+="</div>",n.length){p+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let u of n){let b=B(u.image,80)||u.image,h=b?`<img class="albrec-img" src="${o(b)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${f(u.album)}">${g(u.album)}</div>`:`<div class="albrec-ph" style="background:${f(u.album)}">${g(u.album)}</div>`,x=s.plexOk?u.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";p+=`
          <div class="albrec-card">
            <div class="albrec-cover">${h}</div>
            <div class="albrec-info">
              <div class="albrec-title">${o(u.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${o(u.artist)}">${o(u.artist)}</div>
              <div class="albrec-reason">via ${o(u.reason)}</div>
              ${x}${F(u.artist,u.album,u.inPlex)}
            </div>
          </div>`}p+="</div>"}if(d.length){p+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let u of d){let b=u.playcount>0?`<span class="trackrec-plays">${q(u.playcount)}\xD7</span>`:"",h=u.url?`<a class="trackrec-link" href="${o(u.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";p+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${o(u.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${o(u.artist)}">${o(u.artist)}</div>
              <div class="trackrec-reason">via ${o(u.reason)}</div>
            </div>
            <div class="trackrec-meta">${b}${h}</div>
          </div>`}p+="</div>"}w(p,()=>{s.activeMood&&be(s.activeMood)}),fe();let $=document.getElementById("sec-recs-preview");if($){let u=i.slice(0,8);$.innerHTML=`<div class="collapsed-thumbs">${u.map((b,h)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${h}" style="background:${f(b.name)}">
          <span class="collapsed-thumb-ph">${g(b.name)}</span>
        </div>`).join("")}${i.length>8?`<span class="collapsed-thumbs-more">+${i.length-8}</span>`:""}</div>`,u.forEach(async(b,h)=>{try{let x=await v(`/api/artist/${encodeURIComponent(b.name)}/info`),E=document.getElementById(`recs-thumb-${h}`);E&&x.image&&(E.innerHTML=`<img src="${o(B(x.image,48)||x.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}i.forEach(async(u,b)=>{try{let h=await v(`/api/artist/${encodeURIComponent(u.name)}/info`),x=document.getElementById(`rph-${b}`);x&&h.image&&(x.innerHTML=`<img src="${B(h.image,120)||h.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${f(u.name)}\\'>${g(u.name)}</div>'">`);let E=document.getElementById(`rtags-${b}`);E&&(E.innerHTML=V(h.tags,3)+'<div style="height:6px"></div>');let P=document.getElementById(`ralb-${b}`);if(P){let _=(h.albums||[]).slice(0,4);if(_.length){let m='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let y of _){let L=y.image?`<img class="rec-album-img" src="${B(y.image,48)||y.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',I=s.plexOk&&y.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";m+=`<div class="rec-album-row">${L}<span class="rec-album-name">${o(y.name)}</span>${I}${F(u.name,y.name,y.inPlex)}</div>`}P.innerHTML=m+"</div>"}else P.innerHTML=""}}catch{let h=document.getElementById(`ralb-${b}`);h&&(h.innerHTML="")}})}catch(t){if(t.name==="AbortError")return;M(t.message)}}function fe(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let t=e.dataset.inplex==="true",a=!0;s.recsFilter==="new"&&(a=!t),s.recsFilter==="plex"&&(a=t),e.classList.toggle("hidden",!a)})}function ot(e){let t=document.getElementById("badge-releases");t&&(e>0?(t.textContent=e,t.style.display=""):t.style.display="none")}function kt(e){if(!e)return"";let t=new Date(e),i=Math.floor((new Date-t)/864e5);return i===0?"vandaag":i===1?"gisteren":i<7?`${i} dagen geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function J(){D();let e=s.tabAbort?.signal;try{let t=T("releases",3e5);if(!t){if(t=await v("/api/releases",{signal:e}),e?.aborted)return;C("releases",t)}if(t.status==="building"){w(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{(s.activeSubTab==="releases"||s.activeSubTab===null)&&J()},5e3);return}s.lastReleases=t.releases||[],s.newReleaseIds=new Set(t.newReleaseIds||[]),ot(t.newCount||0),N()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function N(){let e=s.lastReleases||[];if(!e.length){w('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let t=e;if(s.releasesFilter!=="all"&&(t=e.filter(l=>(l.type||"album").toLowerCase()===s.releasesFilter)),!t.length){w(`<div class="empty">Geen ${s.releasesFilter==="ep"?"EP's":s.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}s.releasesSort==="listening"?t=[...t].sort((l,r)=>(r.artistPlaycount||0)-(l.artistPlaycount||0)||new Date(r.releaseDate)-new Date(l.releaseDate)):t=[...t].sort((l,r)=>new Date(r.releaseDate)-new Date(l.releaseDate));let a=document.getElementById("hdr-title-releases");a&&(a.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${t.length} release${t.length!==1?"s":""}`);let i=l=>({album:"Album",single:"Single",ep:"EP"})[l?.toLowerCase()]||l||"Album",n=l=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[l?.toLowerCase()]||"rel-type-album",d=`<div class="section-title">${t.length} release${t.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let l of t){let r=s.newReleaseIds.has(`${l.artist}::${l.album}`),p=l.image?`<img class="rel-img" src="${o(l.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${f(l.album)}">${g(l.album)}</div>`:`<div class="rel-ph" style="background:${f(l.album)}">${g(l.album)}</div>`,$=l.releaseDate?new Date(l.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",u=kt(l.releaseDate),b=$?`<div class="rel-date">${$} <span class="rel-date-rel">(${u})</span></div>`:"",h=s.plexOk?l.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':l.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",x=l.deezerUrl?`<a class="rel-deezer-link" href="${o(l.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";d+=`
      <div class="rel-card${r?" rel-card-new":""}">
        <div class="rel-cover">${p}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${n(l.type)}">${i(l.type)}</span>
          <div class="rel-album">${o(l.album)}</div>
          <div class="rel-artist artist-link" data-artist="${o(l.artist)}">${o(l.artist)}</div>
          ${b}
          <div class="rel-footer">${h}${x}${F(l.artist,l.album,l.inPlex)}</div>
        </div>
      </div>`}w(d+"</div>");let c=document.getElementById("sec-releases-preview");if(c){let l=t.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${f(r.album)}">${g(r.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${f(r.album)}"><span class="collapsed-thumb-ph">${g(r.album)}</span></div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`}}async function Y(){D("Ontdekkingen ophalen...");let e=s.tabAbort?.signal;try{let t=T("discover",3e5);if(!t){if(t=await v("/api/discover",{signal:e}),e?.aborted)return;C("discover",t)}if(t.status==="building"){w(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{(s.activeSubTab==="discover"||s.activeSubTab===null)&&Y()},2e4);return}s.lastDiscover=t,t.plexConnected&&(s.plexOk=!0),oe()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function oe(){if(!s.lastDiscover)return;let{artists:e,basedOn:t}=s.lastDiscover;if(!e?.length){w('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let a=e;if(s.discFilter==="new"&&(a=e.filter(l=>!l.inPlex)),s.discFilter==="partial"&&(a=e.filter(l=>l.inPlex&&l.missingCount>0)),!a.length){w('<div class="empty">Geen artiesten voor dit filter.</div>');return}let i=document.getElementById("hdr-title-discover");i&&(i.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`);let n=a.reduce((l,r)=>l+r.missingCount,0),d=`<div class="section-title">Gebaseerd op: ${(t||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let l=0;l<a.length;l++){let r=a[l],p=Math.round(r.match*100),$=[W(r.country),r.country,r.startYear?`Actief vanaf ${r.startYear}`:null,r.totalAlbums?`${r.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),u=B(r.image,120)||r.image,b=u?`<img class="discover-photo" src="${o(u)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${f(r.name,!0)}">${g(r.name)}</div>`:`<div class="discover-photo-ph" style="background:${f(r.name,!0)}">${g(r.name)}</div>`,h=r.albums?.length||0,x=`${h} album${h!==1?"s":""}`;if(d+=`
      <div class="discover-section collapsed" id="disc-${l}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${l}">
          <div class="discover-card-top">
            ${b}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${o(r.name)}">${o(r.name)}</span>
                ${se(r.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${o(r.reason)}</strong></div>
            </div>
            <span class="discover-match">${p}%</span>
            ${z("artist",r.name,"",r.image||"")}
          </div>
          ${$?`<div class="discover-meta">${o($)}</div>`:""}
          ${V(r.tags,3)}
          ${r.missingCount>0?`<div class="discover-missing">\u2726 ${r.missingCount} ${r.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${l}" data-album-count="${h}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${x}</button>
          ${r.albums?.length?`<div class="discover-preview-row">${r.albums.slice(0,5).map(E=>{let P=f(E.title||"");return E.coverUrl?`<img class="discover-preview-thumb" src="${o(E.coverUrl)}" alt="${o(E.title)}" loading="lazy"
                   title="${o(E.title)}${E.year?" ("+E.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${P}">${g(E.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${P}">${g(E.title||"?")}</div>`}).join("")}${r.albums.length>5?`<div class="discover-preview-more">+${r.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,r.albums?.length){d+='<div class="album-grid">';for(let E of r.albums)d+=ae(E,!0,r.name);d+="</div>"}else d+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';d+="</div></div>"}d+="</div>",w(d);let c=document.getElementById("sec-discover-preview");if(c){let l=a.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${f(r.name)}">${g(r.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${f(r.name)}"><span class="collapsed-thumb-ph">${g(r.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`}}function Lt(){try{let e=localStorage.getItem("ontdek-sections");e&&Object.assign(s.collapsibleSections,JSON.parse(e))}catch{}}function It(){try{localStorage.setItem("ontdek-sections",JSON.stringify(s.collapsibleSections))}catch{}}function nt(e,t){e.classList.remove("expanded","collapsed"),e.classList.add(t?"collapsed":"expanded")}function Pe(e,t){let a=document.querySelector(`[data-section="${e}"]`);if(!a)return;let i=a.querySelector(".section-toggle-btn");i&&(nt(i,s.collapsibleSections[t]),i.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),s.collapsibleSections[t]=!s.collapsibleSections[t],It(),nt(i,s.collapsibleSections[t]),a.classList.toggle("collapsed")}),s.collapsibleSections[t]&&a.classList.add("collapsed"))}async function K(){Lt(),s.activeSubTab=null,H();let e=s.spotifyEnabled?`
    <div class="section-block sec-mood-block">
      <div class="inline-toolbar">
        <span class="toolbar-label spotify-label">\u{1F3AF} Spotify mood</span>
        <span class="toolbar-sep"></span>
        <button class="tool-btn${s.activeMood==="energiek"?" sel-mood":""}" data-mood="energiek">\u26A1 Energiek</button>
        <button class="tool-btn${s.activeMood==="chill"?" sel-mood":""}" data-mood="chill">\u{1F30A} Chill</button>
        <button class="tool-btn${s.activeMood==="melancholisch"?" sel-mood":""}" data-mood="melancholisch">\u{1F327} Melancholisch</button>
        <button class="tool-btn${s.activeMood==="experimenteel"?" sel-mood":""}" data-mood="experimenteel">\u{1F52C} Experimenteel</button>
        <button class="tool-btn${s.activeMood==="feest"?" sel-mood":""}" data-mood="feest">\u{1F389} Feest</button>
        ${s.activeMood?'<span class="toolbar-sep"></span><button class="tool-btn" id="btn-clear-mood-inline">\u2715 Wis mood</button>':""}
      </div>
    </div>`:"";S.innerHTML=`
    <div class="ontdek-layout">
      ${e}

      <div class="section-block" data-section="recs">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-recs">\u{1F3AF} Aanbevelingen</span>
          <div class="inline-toolbar">
            <button class="tool-btn${s.recsFilter==="all"?" sel-def":""}" data-filter="all">Alle</button>
            <button class="tool-btn${s.recsFilter==="new"?" sel-new":""}" data-filter="new">\u2726 Nieuw voor mij</button>
            <button class="tool-btn${s.recsFilter==="plex"?" sel-plex":""}" data-filter="plex">\u25B6 Al in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-recs-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-recs-preview"></div>
        <div class="section-content" id="sec-recs-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>

      <div class="ontdek-divider">Nieuwe Releases</div>
      <div class="section-block" data-section="releases">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-releases">\u{1F4BF} Nieuwe Releases</span>
          <div class="inline-toolbar">
            <button class="tool-btn${s.releasesFilter==="all"?" sel-def":""}" data-rtype="all">Alle</button>
            <button class="tool-btn${s.releasesFilter==="album"?" sel-def":""}" data-rtype="album">Albums</button>
            <button class="tool-btn${s.releasesFilter==="single"?" sel-def":""}" data-rtype="single">Singles</button>
            <button class="tool-btn${s.releasesFilter==="ep"?" sel-def":""}" data-rtype="ep">EP's</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn${s.releasesSort==="listening"?" sel-def":""}" data-rsort="listening">Op luistergedrag</button>
            <button class="tool-btn${s.releasesSort==="date"?" sel-def":""}" data-rsort="date">Op datum</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-releases-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-releases-preview"></div>
        <div class="section-content" id="sec-releases-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>

      <div class="ontdek-divider">Ontdek Artiesten</div>
      <div class="section-block" data-section="discover">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-discover">\u{1F52D} Ontdek Artiesten</span>
          <div class="inline-toolbar">
            <button class="tool-btn${s.discFilter==="all"?" sel-def":""}" data-dfilter="all">Alle artiesten</button>
            <button class="tool-btn${s.discFilter==="new"?" sel-new":""}" data-dfilter="new">\u2726 Nieuw voor mij</button>
            <button class="tool-btn${s.discFilter==="partial"?" sel-miss":""}" data-dfilter="partial">\u25B6 Gedeeltelijk in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-discover-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-discover-preview"></div>
        <div class="section-content" id="sec-discover-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`,S.style.opacity="1",S.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{G("recs"),await O(document.getElementById("sec-recs-content"),ge)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{s.lastReleases=null,G("releases");try{await k("/api/releases/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await O(document.getElementById("sec-releases-content"),J)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{s.lastDiscover=null,G("discover");try{await k("/api/discover/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await O(document.getElementById("sec-discover-content"),Y)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(t=>t.classList.remove("sel-mood","loading")),Z(),K()});{let t=document.getElementById("sec-recs-content");s.sectionContainerEl=t,await ge(),s.sectionContainerEl===t&&(s.sectionContainerEl=null)}(async()=>{try{if(!s.lastReleases){let a=await v("/api/releases");if(a.status==="building")return;s.lastReleases=a.releases||[],s.newReleaseIds=new Set(a.newReleaseIds||[]),ot(a.newCount||0)}let t=document.getElementById("sec-releases-preview");if(t&&s.lastReleases.length){let a=s.lastReleases;s.releasesFilter!=="all"&&(a=s.lastReleases.filter(d=>(d.type||"album").toLowerCase()===s.releasesFilter)),s.releasesSort==="listening"?a=[...a].sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)||new Date(c.releaseDate)-new Date(d.releaseDate)):a=[...a].sort((d,c)=>new Date(c.releaseDate)-new Date(d.releaseDate));let i=a.slice(0,8);t.innerHTML=`<div class="collapsed-thumbs">${i.map(d=>d.image?`<div class="collapsed-thumb">
              <img src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${f(d.album)}">${g(d.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${f(d.album)}"><span class="collapsed-thumb-ph">${g(d.album)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let n=document.getElementById("hdr-title-releases");n&&(n.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${a.length} release${a.length!==1?"s":""}`)}}catch{}})(),ie(document.getElementById("sec-releases-content"),()=>{let t=document.getElementById("sec-releases-content");return O(t,J)}),(async()=>{try{if(!s.lastDiscover){let n=await v("/api/discover");if(n.status==="building")return;s.lastDiscover=n,n.plexConnected&&(s.plexOk=!0)}let{artists:t}=s.lastDiscover;if(!t?.length)return;let a=t;s.discFilter==="new"&&(a=t.filter(n=>!n.inPlex)),s.discFilter==="partial"&&(a=t.filter(n=>n.inPlex&&n.missingCount>0));let i=document.getElementById("sec-discover-preview");if(i&&a.length){let n=a.slice(0,8);i.innerHTML=`<div class="collapsed-thumbs">${n.map(c=>c.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${o(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${f(c.name)}">${g(c.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${f(c.name)}"><span class="collapsed-thumb-ph">${g(c.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-discover");d&&(d.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`)}}catch{}})(),ie(document.getElementById("sec-discover-content"),()=>{let t=document.getElementById("sec-discover-content");return O(t,Y)}),Pe("recs","recs"),Pe("releases","releases"),Pe("discover","discover")}var ye=null;function he(){ye&&(clearInterval(ye),ye=null)}async function je(){let e=document.getElementById("plex-np-wrap");try{let t=await fetch("/api/plex/nowplaying").then(a=>a.json());e.innerHTML=t.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${o(t.track)}</div>
           <div class="card-sub">${o(t.artist)}${t.album?" \xB7 "+o(t.album):""}</div></div></div>`:""}catch{e.innerHTML=""}}function rt(e){return{"nu-luisteren":"\u{1F3B6} Nu luisteren","recente-nummers":"\u{1F550} Recente nummers","nieuwe-releases":"\u{1F4BF} Nieuwe releases deze week","download-voortgang":"\u2B07 Download-voortgang","vandaag-cijfers":"\u{1F4CA} Vandaag in cijfers",aanbeveling:"\u2728 Aanbeveling van de dag","collectie-stats":"\u{1F4C0} Collectie-stats"}[e]||e}var De=["nu-luisteren","recente-nummers","nieuwe-releases","download-voortgang","vandaag-cijfers","aanbeveling","collectie-stats"];function dt(){let e=null,t=[];try{e=JSON.parse(localStorage.getItem("dashWidgetOrder"))}catch{}try{t=JSON.parse(localStorage.getItem("dashWidgetHidden"))||[]}catch{}let i=(Array.isArray(e)&&e.length?e:De).filter(l=>De.includes(l)&&!t.includes(l)),n=De.map(l=>`<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${o(l)}"${t.includes(l)?"":" checked"}>
      ${o(rt(l))}
    </label>`).join(""),d=i.map(l=>`<div class="widget-card" id="widget-${o(l)}" data-widget="${o(l)}">
      <div class="widget-hdr"><span class="widget-title">${o(rt(l))}</span></div>
      <div class="widget-body" id="wbody-${o(l)}">
        <div class="loading" style="padding:12px 0"><div class="spinner"></div></div>
      </div>
    </div>`).join(""),c=`
    <div class="dashboard-topbar">
      <span class="dashboard-heading">\u{1F3B5} Nu</span>
      <button class="dash-customize-btn" id="dash-customize-btn">\u2726 Pas aan</button>
    </div>
    <div class="dash-customize-panel" id="dash-customize-panel" style="display:none">
      <div class="dash-customize-title">Widgets tonen/verbergen</div>
      <div class="dash-widget-checkboxes">${n}</div>
    </div>
    <div class="widget-grid" id="widget-grid">${d}</div>`;s.sectionContainerEl=null,S.innerHTML=c,requestAnimationFrame(()=>{Promise.allSettled([ct(),St(),Tt(),Ct(),Bt(),At(),qt()]),document.getElementById("dash-customize-btn")?.addEventListener("click",()=>{let l=document.getElementById("dash-customize-panel");l&&(l.style.display=l.style.display==="none"?"":"none")}),document.querySelectorAll(".dash-widget-cb").forEach(l=>{l.addEventListener("change",()=>{let r=[];document.querySelectorAll(".dash-widget-cb").forEach(p=>{p.checked||r.push(p.dataset.widget)}),localStorage.setItem("dashWidgetHidden",JSON.stringify(r)),dt()})})})}function Q(e,t){let a=document.getElementById("wbody-"+e);a&&(a.innerHTML=`<div class="widget-error">\u26A0 ${o(t||"Niet beschikbaar")}</div>`)}async function ct(){let e=document.getElementById("wbody-nu-luisteren");if(!e||s.activeTab!=="nu")return;let t=s.tabAbort?.signal;try{let a=T("recent",6e4),i=a!==null,[n,d]=await Promise.allSettled([fetch("/api/plex/nowplaying",{signal:t}).then(l=>l.json()),i?Promise.resolve(a):v("/api/recent",{signal:t})]);if(t?.aborted)return;!i&&d.status==="fulfilled"&&C("recent",d.value);let c="";if(n.status==="fulfilled"&&n.value?.playing){let l=n.value;c+=`<div class="w-np-row">
        <div class="w-np-dot plex"></div>
        <div class="w-np-info">
          <div class="w-np-title">${o(l.track)}</div>
          <div class="w-np-sub">${o(l.artist)}${l.album?" \xB7 "+o(l.album):""}</div>
          <span class="badge plex" style="font-size:10px">\u25B6 Plex</span>
        </div>
      </div>`}if(d.status==="fulfilled"){let r=(d.value.recenttracks?.track||[]).find(p=>p["@attr"]?.nowplaying);if(r){let p=r.artist?.["#text"]||"",$=R(r.image,"medium");c+=`<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${$?`<img class="w-np-img" src="${o($)}" alt="" loading="lazy">`:""}
          <div class="w-np-info">
            <div class="w-np-title">${o(r.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${o(p)}">${o(p)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">\u25CF Last.fm</span>
          </div>
        </div>`}}e.innerHTML=c||'<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>'}catch(a){if(a.name==="AbortError")return;Q("nu-luisteren",a.message)}}async function St(){let e=document.getElementById("wbody-recente-nummers");if(!e)return;let t=s.tabAbort?.signal;try{let a=T("recent",6e4);if(!a){if(a=await v("/api/recent",{signal:t}),t?.aborted)return;C("recent",a)}let i=(a.recenttracks?.track||[]).filter(n=>!n["@attr"]?.nowplaying).slice(0,8);if(!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen recente nummers</div>';return}e.innerHTML=`<div class="w-track-list">${i.map(n=>{let d=n.artist?.["#text"]||"",c=n.date?.uts?te(parseInt(n.date.uts)):"";return`<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${o(n.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${o(d)}">${o(d)}</div>
        </div>
        <span class="w-track-ago">${c}</span>
      </div>`}).join("")}</div>`}catch(a){if(a.name==="AbortError")return;Q("recente-nummers",a.message)}}async function Tt(){let e=document.getElementById("wbody-nieuwe-releases");if(!e)return;let t=s.tabAbort?.signal;try{let a=s.lastReleases;if(!a){let d=await v("/api/releases",{signal:t});if(t?.aborted)return;if(d.status==="building"){e.innerHTML='<div class="empty" style="font-size:12px">Releases worden geladen\u2026</div>';return}a=d.releases||[]}let i=Date.now()-168*3600*1e3,n=a.filter(d=>d.releaseDate&&new Date(d.releaseDate).getTime()>i).sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)).slice(0,3);if(!n.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen releases deze week</div>';return}e.innerHTML=`<div class="w-releases-list">${n.map(d=>`<div class="w-rel-row">
        <div class="w-rel-cover">${d.image?`<img class="w-rel-img" src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="w-rel-ph" style="background:${f(d.album)}">${g(d.album)}</div>`}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${o(d.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${o(d.artist)}">${o(d.artist)}</div>
        </div>
        ${F(d.artist,d.album,d.inPlex)}
      </div>`).join("")}</div>`}catch(a){if(a.name==="AbortError")return;Q("nieuwe-releases",a.message)}}async function Ct(){let e=document.getElementById("wbody-download-voortgang");if(!e)return;if(!s.tidarrOk){e.innerHTML='<div class="widget-error">\u26A0 Tidarr offline</div>';return}let t=s.tabAbort?.signal;try{let a=await v("/api/tidarr/queue",{signal:t});if(t?.aborted)return;let i=(a.items||s.tidarrQueueItems||[]).filter(n=>n.status!=="finished"&&n.status!=="error");Ce(e,i)}catch(a){if(a.name==="AbortError")return;Q("download-voortgang","Tidarr niet bereikbaar")}}async function Bt(){let e=document.getElementById("wbody-vandaag-cijfers");if(!e)return;let t=s.tabAbort?.signal;try{let a=T("recent",6e4);if(!a){if(a=await v("/api/recent",{signal:t}),t?.aborted)return;C("recent",a)}let i=a.recenttracks?.track||[],n=new Date().toDateString(),d=i.filter(p=>p.date?.uts&&new Date(parseInt(p.date.uts)*1e3).toDateString()===n),c=new Set(d.map(p=>p.artist?.["#text"])).size,l={};for(let p of d){let $=p.artist?.["#text"]||"";l[$]=(l[$]||0)+1}let r=Object.entries(l).sort((p,$)=>$[1]-p[1])[0];e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${d.length}</div>
        <div class="w-stat-lbl">scrobbles</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${c}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      ${r?`<div class="w-stat-block w-stat-wide">
        <div class="w-stat-val" style="font-size:13px;line-height:1.3">${o(r[0])}</div>
        <div class="w-stat-lbl">meest gespeeld (${r[1]}\xD7)</div>
      </div>`:""}
    </div>`}catch(a){if(a.name==="AbortError")return;Q("vandaag-cijfers",a.message)}}async function At(){let e=document.getElementById("wbody-aanbeveling");if(!e)return;let t=s.tabAbort?.signal;try{let a=T("recs",3e5);if(!a){if(a=await v("/api/recs",{signal:t}),t?.aborted)return;C("recs",a)}let i=a.recommendations||[];if(s.lastRecs=a,!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen aanbevelingen</div>';return}let n=Math.floor(Date.now()/864e5),d=i[n%i.length],c=null;try{c=await v(`/api/artist/${encodeURIComponent(d.name)}/info`,{signal:t})}catch{}let l=c?.image?B(c.image,80)||c.image:null,r=(c?.albums||[]).slice(0,3);e.innerHTML=`<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${l?`<img class="w-rec-img" src="${o(l)}" alt="" loading="lazy">`:`<div class="w-rec-ph" style="background:${f(d.name)}">${g(d.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${o(d.name)}">${o(d.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${o(d.reason)}</div>
          ${se(d.inPlex)}
          ${z("artist",d.name,"",c?.image||"")}
        </div>
      </div>
      ${r.length?`<div class="w-rec-albums">${r.map(p=>`<span class="w-rec-album">${o(p.name)}</span>`).join("")}</div>`:""}
    </div>`}catch(a){if(a.name==="AbortError")return;Q("aanbeveling",a.message)}}async function qt(){let e=document.getElementById("wbody-collectie-stats");if(!e)return;let t=s.tabAbort?.signal;try{let a=await v("/api/plex/status",{signal:t});if(t?.aborted)return;if(!a.connected){e.innerHTML='<div class="empty" style="font-size:12px">Plex offline</div>';return}let i=0;s.lastGaps?.artists&&(i=s.lastGaps.artists.reduce((n,d)=>n+(d.missingCount||0),0)),e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${q(a.artists||0)}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${q(a.albums||0)}</div>
        <div class="w-stat-lbl">albums</div>
      </div>
      ${i?`<div class="w-stat-block">
        <div class="w-stat-val">${i}</div>
        <div class="w-stat-lbl">ontbreekt</div>
      </div>`:""}
    </div>`}catch(a){if(a.name==="AbortError")return;Q("collectie-stats",a.message)}}async function ut(){let e=s.tabAbort?.signal;try{let t=T("recent",6e4);if(!t){if(t=await v("/api/recent",{signal:e}),e?.aborted)return;C("recent",t)}let a=t.recenttracks?.track||[];if(!a.length){setContent('<div class="empty">Geen recente nummers.</div>');return}let i='<div class="card-list">';for(let n of a){let d=n["@attr"]?.nowplaying,c=n.date?.uts?te(parseInt(n.date.uts)):"",l=n.artist?.["#text"]||"",r=R(n.image),p=r?`<img class="card-img" src="${o(r)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>';d?i+=`<div class="now-playing">${p}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${o(n.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(l)}">${o(l)}</div></div></div>`:i+=`<div class="card">${p}<div class="card-info">
          <div class="card-title">${o(n.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(l)}">${o(l)}</div>
          </div><div class="card-meta">${c}</div>
          <button class="play-btn" data-artist="${o(l)}" data-track="${o(n.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}setContent(i+"</div>")}catch(t){if(t.name==="AbortError")return;setContent(`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`)}}function we(){s.activeSubTab=null,H(),he(),dt(),setTimeout(()=>{s.activeTab==="nu"&&(ye=setInterval(()=>{if(s.activeTab!=="nu"){he();return}ct()},3e4))},500)}async function pt(e,t,a){if(s.previewBtn===e){s.previewAudio.paused?(await s.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(s.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=e,e.textContent="\u2026",e.disabled=!0;try{let i=new URLSearchParams({artist:t,track:a}),n=await v(`/api/preview?${i}`);if(!n.preview){e.textContent="\u2014",e.disabled=!1,setTimeout(()=>{e.textContent==="\u2014"&&(e.textContent="\u25B6")},1800),s.previewBtn=null;return}s.previewAudio.src=n.preview,s.previewAudio.currentTime=0,await s.previewAudio.play(),e.textContent="\u23F8",e.disabled=!1,e.classList.add("playing")}catch{e.textContent="\u25B6",e.disabled=!1,s.previewBtn=null}}s.previewAudio.addEventListener("timeupdate",()=>{if(!s.previewBtn||!s.previewAudio.duration)return;let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width=`${(s.previewAudio.currentTime/s.previewAudio.duration*100).toFixed(1)}%`)});s.previewAudio.addEventListener("ended",()=>{if(s.previewBtn){s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width="0%"),s.previewBtn=null}});document.addEventListener("visibilitychange",()=>{document.hidden&&!s.previewAudio.paused&&(s.previewAudio.pause(),s.previewBtn&&(s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing")))});async function Pt(e){let t=document.getElementById("search-results");if(e.length<2){t.classList.remove("open");return}try{let a=await v(`/api/search?q=${encodeURIComponent(e)}`);a.results?.length?t.innerHTML=a.results.map(i=>{let n=B(i.image,56)||i.image,d=n?`<img class="search-result-img" src="${o(n)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${f(i.name)};display:none">${g(i.name)}</div>`:`<div class="search-result-ph" style="background:${f(i.name)}">${g(i.name)}</div>`,c=i.listeners?`${q(i.listeners)} luisteraars`:"";return`<button class="search-result-item" data-artist="${o(i.name)}">
          ${d}
          <div><div class="search-result-name">${o(i.name)}</div>
          ${c?`<div class="search-result-sub">${c}</div>`:""}</div>
        </button>`}).join(""):t.innerHTML='<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>',t.classList.add("open")}catch{}}document.getElementById("search-input").addEventListener("input",e=>{clearTimeout(s.searchTimeout);let t=e.target.value.trim();if(!t){document.getElementById("search-results").classList.remove("open");return}s.searchTimeout=setTimeout(()=>Pt(t),320)});document.addEventListener("click",e=>{e.target.closest("#search-wrap")||document.getElementById("search-results").classList.remove("open")});function $e(e,t){let a=(t||"").toLowerCase().trim(),i=e;if(a&&(i=e.filter(c=>c.artist.toLowerCase().includes(a)||c.album.toLowerCase().includes(a))),!i.length)return`<div class="empty">Geen resultaten voor "<strong>${o(t)}</strong>".</div>`;let n=new Map;for(let c of i)n.has(c.artist)||n.set(c.artist,[]),n.get(c.artist).push(c.album);let d=`<div class="section-title">${n.size} artiesten \xB7 ${q(i.length)} albums</div>
    <div class="plib-list">`;for(let[c,l]of n)d+=`
      <div class="plib-artist-block">
        <div class="plib-artist-header artist-link" data-artist="${o(c)}">
          <div class="plib-avatar" style="background:${f(c)}">${g(c)}</div>
          <span class="plib-artist-name">${o(c)}</span>
          <span class="plib-album-count">${l.length}</span>
        </div>
        <div class="plib-albums">
          ${l.map(r=>`<div class="plib-album-row">
            <span class="plib-album-badge">\u25B6</span>
            <span class="plib-album-title" title="${o(r)}">${o(r)}</span>
          </div>`).join("")}
        </div>
      </div>`;return d+"</div>"}async function re(){D();let e=s.tabAbort?.signal;try{let t=await v("/api/plex/library",{signal:e});if(e?.aborted)return;s.plexLibData=t.library||[];let a=document.getElementById("plib-search");if(a&&(a.value=""),!s.plexLibData.length){w('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik \u21BB Sync Plex om te beginnen.</div>');return}w($e(s.plexLibData,""))}catch(t){if(t.name==="AbortError")return;M(t.message)}}async function He(e){D();let t=s.tabAbort?.signal;try{let a=`topartists:${e}`,i=T(a,300*1e3);if(!i){if(i=await v(`/api/topartists?period=${e}`,{signal:t}),t?.aborted)return;C(a,i)}let n=i.topartists?.artist||[];if(!n.length){w('<div class="empty">Geen data.</div>');return}let d=parseInt(n[0]?.playcount||1),c=`<div class="section-title">Top artiesten \xB7 ${ee(e)}</div><div class="artist-grid">`;for(let l=0;l<n.length;l++){let r=n[l],p=Math.round(parseInt(r.playcount)/d*100),$=R(r.image,"large")||R(r.image),u=B($,120)||$,b=u?`<img src="${u}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${f(r.name,!0)}">${g(r.name)}</div>`:`<div class="ag-photo-ph" style="background:${f(r.name,!0)}">${g(r.name)}</div>`;c+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${l}" style="view-transition-name: artist-${ce(r.name)}">${b}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${o(r.name)}">${o(r.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${p}%"></div></div>
          <div class="ag-plays">${q(r.playcount)} plays</div>
        </div></div>`}w(c+"</div>"),n.forEach(async(l,r)=>{try{let p=await v(`/api/artist/${encodeURIComponent(l.name)}/info`);if(p.image){let $=document.getElementById(`agp-${r}`);$&&($.innerHTML=`<img src="${B(p.image,120)||p.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}})}catch(a){if(a.name==="AbortError")return;M(a.message)}}async function Re(e){D();let t=s.tabAbort?.signal;try{let a=`toptracks:${e}`,i=T(a,300*1e3);if(!i){if(i=await v(`/api/toptracks?period=${e}`,{signal:t}),t?.aborted)return;C(a,i)}let n=i.toptracks?.track||[];if(!n.length){w('<div class="empty">Geen data.</div>');return}let d=parseInt(n[0]?.playcount||1),c=`<div class="section-title">Top nummers \xB7 ${ee(e)}</div><div class="card-list">`;for(let l of n){let r=Math.round(parseInt(l.playcount)/d*100);c+=`<div class="card">${Le(l.image)}<div class="card-info">
        <div class="card-title">${o(l.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(l.artist?.name||"")}">${o(l.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${r}%"></div></div>
        </div><div class="card-meta">${q(l.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${o(l.artist?.name||"")}" data-track="${o(l.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}w(c+"</div>")}catch(a){if(a.name==="AbortError")return;M(a.message)}}async function vt(){D();let e=s.tabAbort?.signal;try{let t=T("loved",6e5);if(!t){if(t=await v("/api/loved",{signal:e}),e?.aborted)return;C("loved",t)}let a=t.lovedtracks?.track||[];if(!a.length){w('<div class="empty">Geen geliefde nummers.</div>');return}let i='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let n of a){let d=n.date?.uts?te(parseInt(n.date.uts)):"";i+=`<div class="card">${Le(n.image)}<div class="card-info">
        <div class="card-title">${o(n.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(n.artist?.name||"")}">${o(n.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${d}</div>
        <button class="play-btn" data-artist="${o(n.artist?.name||"")}" data-track="${o(n.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}w(i+"</div>")}catch(t){if(t.name==="AbortError")return;M(t.message)}}async function ze(){D("Statistieken ophalen...");let e=s.tabAbort?.signal;try{let t=T("stats",6e5);if(!t){if(t=await v("/api/stats",{signal:e}),e?.aborted)return;C("stats",t)}w(`
      <div class="stats-grid">
        <div class="stats-card full">
          <div class="stats-card-title">Scrobbles afgelopen 7 dagen</div>
          <div class="chart-wrap"><canvas id="chart-daily"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Top artiesten deze maand</div>
          <div class="chart-wrap" style="max-height:320px"><canvas id="chart-top"></canvas></div>
        </div>
        <div class="stats-card">
          <div class="stats-card-title">Genre verdeling</div>
          <div class="chart-wrap"><canvas id="chart-genres"></canvas></div>
        </div>
      </div>`,()=>Mt(t))}catch(t){if(t.name==="AbortError")return;M(t.message)}}function Mt(e){if(typeof Chart>"u")return;let t=!window.matchMedia("(prefers-color-scheme: light)").matches,a=t?"#2c2c2c":"#ddd",i=t?"#888":"#777",n=t?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=a;let d=document.getElementById("chart-daily");d&&new Chart(d,{type:"bar",data:{labels:e.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:e.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:a},ticks:{color:i},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&e.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:e.topArtists.map(r=>r.name),datasets:[{data:e.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:a},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:n,font:{size:11}}}}}});let l=document.getElementById("chart-genres");if(l&&e.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(l,{type:"doughnut",data:{labels:e.genres.map(p=>p.name),datasets:[{data:e.genres.map(p=>p.count),backgroundColor:r.slice(0,e.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function X(){D("Collectiegaten zoeken...");let e=s.tabAbort?.signal;try{let t=await v("/api/gaps",{signal:e});if(e?.aborted)return;if(t.status==="building"){w(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{s.activeSubTab==="gaten"&&X()},2e4);return}s.lastGaps=t,de()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function de(){if(!s.lastGaps)return;let e=[...s.lastGaps.artists||[]];if(!e.length){w('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}s.gapsSort==="missing"&&e.sort((i,n)=>n.missingAlbums.length-i.missingAlbums.length),s.gapsSort==="name"&&e.sort((i,n)=>i.name.localeCompare(n.name));let t=e.reduce((i,n)=>i+n.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=t;let a=`<div class="section-title">${t} ontbrekende albums bij ${e.length} artiesten die je al hebt</div>`;for(let i of e){let n=Math.round(i.ownedCount/i.totalCount*100),d=[W(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),c=B(i.image,56)||i.image,l=c?`<img class="gaps-photo" src="${o(c)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${f(i.name)}">${g(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${f(i.name)}">${g(i.name)}</div>`;a+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${l}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${o(i.name)}">${o(i.name)}</div>
              ${z("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${o(d)}</div>
            ${V(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let r of i.missingAlbums)a+=ae(r,!1,i.name);a+="</div>",i.allAlbums?.filter(r=>r.inPlex).length>0&&(a+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(r=>r.inPlex).map(r=>ae(r,!1,i.name)).join("")}
        </div>
      </details>`),a+="</div>"}w(a)}async function mt(e){s.bibSubTab=e;let t=document.getElementById("bib-sub-content"),a=document.getElementById("bib-subtoolbar");if(!t)return;document.querySelectorAll(".bib-tab").forEach(n=>n.classList.toggle("active",n.dataset.bibtab===e)),a&&(e==="collectie"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <input class="plib-search" id="plib-search-bib" type="text"
            placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off" style="flex:1;min-width:0">
          <button class="tool-btn" id="btn-sync-plex-bib">\u21BB Sync Plex</button>
        </div>`,document.getElementById("plib-search-bib")?.addEventListener("input",n=>{s.plexLibData&&(t.innerHTML=$e(s.plexLibData,n.target.value))}),document.getElementById("btn-sync-plex-bib")?.addEventListener("click",async()=>{let n=document.getElementById("btn-sync-plex-bib"),d=n.textContent;n.disabled=!0,n.textContent="\u21BB Bezig\u2026";try{try{await k("/api/plex/refresh",{method:"POST"})}catch(l){if(l.name!=="AbortError")throw l}await U(),s.plexLibData=null;let c=t;s.sectionContainerEl=c,await re(),s.sectionContainerEl===c&&(s.sectionContainerEl=null)}catch{}finally{n.disabled=!1,n.textContent=d}})):e==="gaten"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <button class="tool-btn${s.gapsSort==="missing"?" sel-def":""}" data-gsort="missing">Meest ontbrekend</button>
          <button class="tool-btn${s.gapsSort==="name"?" sel-def":""}" data-gsort="name">A\u2013Z</button>
          <span class="toolbar-sep"></span>
          <button class="tool-btn refresh-btn" id="btn-ref-gaps-bib">\u21BB Vernieuwen</button>
        </div>`,document.getElementById("btn-ref-gaps-bib")?.addEventListener("click",async()=>{s.lastGaps=null;try{await k("/api/gaps/refresh",{method:"POST"})}catch(d){if(d.name!=="AbortError")throw d}let n=document.getElementById("bib-sub-content");s.sectionContainerEl=n,await X(),s.sectionContainerEl===n&&(s.sectionContainerEl=null)})):a.innerHTML="");let i=t;s.sectionContainerEl=i;try{e==="collectie"?(s.activeSubTab="collectie",await re()):e==="gaten"?(s.activeSubTab="gaten",await X()):e==="lijst"&&(s.activeSubTab="lijst",await le())}finally{s.sectionContainerEl===i&&(s.sectionContainerEl=null)}}async function Fe(){s.activeSubTab="collectie",H(),S.innerHTML=`
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${ee(s.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${ee(s.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-tracks-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="bib-subtabs" id="bib-subtabs">
        <button class="bib-tab${s.bibSubTab==="collectie"?" active":""}" data-bibtab="collectie">Collectie</button>
        <button class="bib-tab${s.bibSubTab==="gaten"?" active":""}" data-bibtab="gaten">Gaten <span class="bib-tab-badge" id="badge-gaps-bib"></span></button>
        <button class="bib-tab${s.bibSubTab==="lijst"?" active":""}" data-bibtab="lijst">Lijst</button>
      </div>

      <div id="bib-subtoolbar"></div>
      <div class="bib-sub-content" id="bib-sub-content">
        <div class="loading"><div class="spinner"></div>Laden...</div>
      </div>

      <div class="section-block" style="margin-top:32px">
        <div class="section-hdr">
          <span class="section-hdr-title">Statistieken</span>
        </div>
        <div class="section-content" id="bib-stats-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`,S.style.opacity="1",S.style.transform="";let e=document.getElementById("badge-gaps-bib"),t=document.getElementById("badge-gaps");e&&t&&(e.textContent=t.textContent),document.querySelectorAll(".bib-tab").forEach(a=>a.addEventListener("click",()=>mt(a.dataset.bibtab)));{let a=document.getElementById("strip-artists-body");s.sectionContainerEl=a,await He(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}{let a=document.getElementById("strip-tracks-body");s.sectionContainerEl=a,await Re(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}await mt(s.bibSubTab),ie(document.getElementById("bib-stats-content"),()=>{let a=document.getElementById("bib-stats-content");return O(a,ze)})}function Oe(e){let t=document.getElementById("panel-overlay"),a=document.getElementById("panel-content"),i=ce(e),n=()=>{a.innerHTML=`<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`,t.classList.add("open"),document.body.style.overflow="hidden"};document.startViewTransition?document.startViewTransition(n).finished.catch(()=>{}):n(),Promise.allSettled([v(`/api/artist/${encodeURIComponent(e)}/info`),v(`/api/artist/${encodeURIComponent(e)}/similar`)]).then(([d,c])=>{let l=d.status==="fulfilled"?d.value:{},r=c.status==="fulfilled"?c.value.similar||[]:[],p=B(l.image,400)||l.image,$=p?`<img src="${o(p)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${f(e)};display:none">${g(e)}</div>`:`<div class="panel-photo-ph" style="background:${f(e)}">${g(e)}</div>`,u=[l.country?W(l.country)+" "+l.country:null,l.startYear?`Actief vanaf ${l.startYear}`:null,s.plexOk&&l.inPlex!==void 0?l.inPlex?"\u25B6 In Plex":"\u2726 Nieuw voor jou":null].filter(Boolean).join(" \xB7 "),b="";if(l.albums?.length){b='<div class="panel-section">Albums</div><div class="panel-albums">';for(let x of l.albums){let E=B(x.image,48)||x.image,P=E?`<img class="panel-album-img" src="${o(E)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="panel-album-ph">\u266A</div>',_=s.plexOk&&x.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6</span>':"";b+=`<div class="panel-album-row">${P}
          <span class="panel-album-name">${o(x.name)}</span>${_}${F(e,x.name,x.inPlex)}</div>`}b+="</div>"}let h="";if(r.length){h='<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">';for(let x of r)h+=`<button class="panel-similar-chip artist-link" data-artist="${o(x.name)}">${o(x.name)}</button>`;h+="</div>"}a.innerHTML=`
      <div class="panel-photo-wrap" style="view-transition-name: artist-${i}">${$}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${o(e)}</div>
          ${z("artist",e,"",l.image||"")}
        </div>
        ${u?`<div class="panel-meta">${o(u)}</div>`:""}
        ${V(l.tags,6)}
        ${b}
        ${h}
      </div>`})}function xe(){document.getElementById("panel-overlay").classList.remove("open"),document.body.style.overflow=""}var Ee={nu:()=>we(),ontdek:()=>K(),bibliotheek:()=>Fe(),downloads:()=>it(),discover:()=>Y(),gaps:()=>X(),recent:()=>ut(),recs:()=>ge(),releases:()=>J(),topartists:()=>He(s.currentPeriod),toptracks:()=>Re(s.currentPeriod),loved:()=>vt(),stats:()=>ze(),wishlist:()=>le(),plexlib:()=>re(),tidal:()=>qe()};document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelectorAll(".tab"),i=document.querySelector(".tab.active"),n=Array.from(a).indexOf(i),c=Array.from(a).indexOf(e)>n?"rtl":"ltr";if(document.documentElement.style.setProperty("--tab-direction",c==="ltr"?"-1":"1"),a.forEach(l=>l.classList.remove("active")),e.classList.add("active"),s.activeTab=t,s.sectionContainerEl=null,s.tabAbort&&s.tabAbort.abort(),s.tabAbort=new AbortController,["tb-period","tb-recs","tb-mood","tb-releases","tb-discover","tb-gaps","tb-plexlib","tb-tidarr-ui"].forEach(l=>document.getElementById(l)?.classList.remove("visible")),document.getElementById("tb-tidal")?.classList.toggle("visible",t==="downloads"),t!=="downloads"&&H(),t!=="downloads"&&void 0,t!=="nu"&&he(),document.startViewTransition)document.startViewTransition(async()=>{try{await Ee[t]?.()}catch(l){if(l.name==="AbortError")return;console.error("Tab load error:",l),S.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l.message}. Druk op R om opnieuw te proberen.</div>`}}).finished.catch(()=>{});else try{Ee[t]?.()}catch(l){if(l.name==="AbortError")return;console.error("Tab load error:",l),S.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l.message}. Druk op R om opnieuw te proberen.</div>`}})});document.querySelectorAll("[data-period]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-period]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.currentPeriod=e.dataset.period,Ee[s.activeTab]?.()})});document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=e.dataset.filter,e.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),fe()})});document.querySelectorAll("[data-dfilter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-dfilter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=e.dataset.dfilter,e.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss"),oe()})});document.querySelectorAll("[data-gsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-gsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.gapsSort=e.dataset.gsort,de()})});document.querySelectorAll("[data-rtype]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rtype]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesFilter=e.dataset.rtype,N()})});document.querySelectorAll("[data-rsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesSort=e.dataset.rsort,N()})});document.getElementById("btn-refresh-releases")?.addEventListener("click",async()=>{s.lastReleases=null,G("releases");try{await k("/api/releases/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}J()});document.getElementById("btn-refresh-discover")?.addEventListener("click",async()=>{s.lastDiscover=null,G("discover");try{await k("/api/discover/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}Y()});document.getElementById("btn-refresh-gaps")?.addEventListener("click",async()=>{s.lastGaps=null;try{await k("/api/gaps/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}X()});document.getElementById("plib-search")?.addEventListener("input",e=>{!s.plexLibData||s.activeSubTab!=="collectie"||(S.innerHTML=$e(s.plexLibData,e.target.value))});document.getElementById("btn-sync-plex")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex"),t=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{try{await k("/api/plex/refresh",{method:"POST"})}catch(a){if(a.name!=="AbortError")throw a}await U(),s.plexLibData=null,s.activeSubTab==="collectie"&&await re()}catch{}finally{e.disabled=!1,e.textContent=t}});document.getElementById("plex-refresh-btn")?.addEventListener("click",async()=>{let e=document.getElementById("plex-refresh-btn");e.classList.add("spinning"),e.disabled=!0;try{try{await k("/api/plex/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await U(),s.plexLibData=null}catch{}finally{e.classList.remove("spinning"),e.disabled=!1}});document.getElementById("tidal-search")?.addEventListener("input",e=>{clearTimeout(s.tidalSearchTimeout);let t=e.target.value.trim();s.tidalSearchTimeout=setTimeout(()=>{s.activeSubTab==="tidal"&&s.tidalView==="search"&&Te(t)},400)});document.getElementById("panel-close")?.addEventListener("click",xe);document.addEventListener("click",async e=>{let t=e.target.closest(".play-btn");if(t){e.stopPropagation(),pt(t,t.dataset.artist,t.dataset.track);return}let a=e.target.closest(".disc-toggle-btn");if(a){e.stopPropagation();let m=a.dataset.discId,y=document.getElementById(m);if(y){let L=y.classList.toggle("collapsed");y.querySelectorAll(".disc-toggle-btn").forEach(I=>{I.classList.toggle("expanded",!L),I.classList.toggle("collapsed",L);let A=parseInt(I.dataset.albumCount,10)||0,j=`${A} album${A!==1?"s":""}`;I.textContent=L?`Toon ${j}`:j})}return}let i=e.target.closest(".discover-card-toggle");if(i&&!e.target.closest(".artist-link")&&!e.target.closest(".bookmark-btn")&&!e.target.closest(".disc-toggle-btn")){let m=i.dataset.discId,y=document.getElementById(m);if(y){let L=y.classList.toggle("collapsed");y.querySelectorAll(".disc-toggle-btn").forEach(I=>{I.classList.toggle("expanded",!L),I.classList.toggle("collapsed",L);let A=parseInt(I.dataset.albumCount,10)||0,j=`${A} album${A!==1?"s":""}`;I.textContent=L?`Toon ${j}`:j})}return}let n=e.target.closest("[data-artist]");if(n?.dataset.artist&&!n.classList.contains("bookmark-btn")){n.classList.contains("search-result-item")&&(document.getElementById("search-results").classList.remove("open"),document.getElementById("search-input").value=""),Oe(n.dataset.artist);return}let d=e.target.closest(".bookmark-btn");if(d){e.stopPropagation();let{btype:m,bname:y,bartist:L,bimage:I}=d.dataset,A=await We(m,y,L,I);d.classList.toggle("saved",A),d.title=A?"Verwijder uit lijst":"Sla op in lijst",document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(y)}"][data-btype="${m}"]`).forEach(j=>{j.classList.toggle("saved",A)});return}let c=e.target.closest(".wish-remove[data-wid]");if(c){try{await k(`/api/wishlist/${c.dataset.wid}`,{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}s.wishlistMap.forEach((m,y)=>{String(m)===c.dataset.wid&&s.wishlistMap.delete(y)}),ne(),le();return}let l=e.target.closest(".panel-similar-chip[data-artist]");if(l){Oe(l.dataset.artist);return}let r=e.target.closest(".download-btn, .tidal-dl-btn");if(r){if(e.stopPropagation(),r.classList.contains("tidal-dl-btn")){let L=r.dataset.dlurl;if(!L)return;r.disabled=!0;let I=r.textContent;r.textContent="\u2026";try{let A=await k("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:L})}),j=await A.json();if(!A.ok||!j.ok)throw new Error(j.error||"download mislukt");r.textContent="\u2713 Toegevoegd",r.classList.add("downloaded"),pe()}catch(A){alert("Downloaden mislukt: "+A.message),r.textContent=I,r.disabled=!1}return}let{dlartist:m,dlalbum:y}=r.dataset;await at(m,y,r);return}let p=e.target.closest(".q-remove[data-qid]");if(p){e.stopPropagation();try{try{await k("/api/tidarr/queue/"+encodeURIComponent(p.dataset.qid),{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}}catch(m){alert("Verwijderen mislukt: "+m.message)}return}let $=e.target.closest(".q-remove[data-dlid]");if($){e.stopPropagation();try{try{await k(`/api/downloads/${$.dataset.dlid}`,{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}$.closest(".q-row")?.remove()}catch(m){alert("Verwijderen mislukt: "+m.message)}return}let u=e.target.closest(".inline-toolbar [data-filter]");if(u){document.querySelectorAll("[data-filter]").forEach(m=>m.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=u.dataset.filter,u.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),fe();return}let b=e.target.closest(".inline-toolbar [data-rtype]");if(b){document.querySelectorAll("[data-rtype]").forEach(y=>y.classList.remove("sel-def")),s.releasesFilter=b.dataset.rtype,b.classList.add("sel-def");let m=document.getElementById("sec-releases-content");m&&s.activeTab==="ontdek"?(s.sectionContainerEl=m,N(),s.sectionContainerEl===m&&(s.sectionContainerEl=null)):N();return}let h=e.target.closest(".inline-toolbar [data-rsort]");if(h){document.querySelectorAll("[data-rsort]").forEach(y=>y.classList.remove("sel-def")),s.releasesSort=h.dataset.rsort,h.classList.add("sel-def");let m=document.getElementById("sec-releases-content");m&&s.activeTab==="ontdek"?(s.sectionContainerEl=m,N(),s.sectionContainerEl===m&&(s.sectionContainerEl=null)):N();return}let x=e.target.closest(".inline-toolbar [data-dfilter]");if(x){document.querySelectorAll("[data-dfilter]").forEach(y=>y.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=x.dataset.dfilter,x.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss");let m=document.getElementById("sec-discover-content");m&&s.activeTab==="ontdek"?(s.sectionContainerEl=m,oe(),s.sectionContainerEl===m&&(s.sectionContainerEl=null)):oe();return}let E=e.target.closest(".inline-toolbar [data-gsort]");if(E){document.querySelectorAll("[data-gsort]").forEach(y=>y.classList.remove("sel-def")),s.gapsSort=E.dataset.gsort,E.classList.add("sel-def");let m=document.getElementById("bib-sub-content");m&&s.activeTab==="bibliotheek"?(s.sectionContainerEl=m,de(),s.sectionContainerEl===m&&(s.sectionContainerEl=null)):de();return}let P=e.target.closest(".sec-mood-block [data-mood]");if(P){let m=P.dataset.mood;if(s.activeMood===m){s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),Z(),K();return}s.activeMood=m,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),P.classList.add("sel-mood");let y=P.closest(".inline-toolbar");if(y&&!document.getElementById("btn-clear-mood-inline")){let L=document.createElement("span");L.className="toolbar-sep";let I=document.createElement("button");I.className="tool-btn",I.id="btn-clear-mood-inline",I.textContent="\u2715 Wis mood",I.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(A=>A.classList.remove("sel-mood","loading")),Z(),K()}),y.appendChild(L),y.appendChild(I)}be(m);return}let _=e.target.closest("[data-tidal-view]");if(_){let m=_.dataset.tidalView;m==="tidarr"?(document.getElementById("tb-tidal")?.classList.remove("visible"),document.getElementById("tb-tidarr-ui")?.classList.add("visible"),et()):(H(),document.getElementById("tb-tidal")?.classList.add("visible"),document.getElementById("tb-tidarr-ui")?.classList.remove("visible"),me(m));return}if(e.target===document.getElementById("panel-overlay")){xe();return}});document.addEventListener("keydown",e=>{if(e.key==="Escape"){xe(),document.getElementById("search-results").classList.remove("open");return}let t=["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);if(e.key==="/"&&!t){e.preventDefault(),document.getElementById("search-input").focus();return}if(e.key==="r"&&!t){s.activeTab==="ontdek"?K():s.activeTab==="bibliotheek"?Fe():Ee[s.activeTab]?.();return}if(!t&&/^[1-4]$/.test(e.key)){let a=document.querySelectorAll(".tab"),i=parseInt(e.key)-1;a[i]&&a[i].click();return}});document.querySelectorAll(".bnav-btn").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelector(`.tab[data-tab="${t}"]`);a&&a.click(),document.querySelectorAll(".bnav-btn").forEach(i=>i.classList.toggle("active",i===e))})});document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab;document.querySelectorAll(".bnav-btn").forEach(a=>a.classList.toggle("active",a.dataset.tab===t))})});ke&&document.documentElement.setAttribute("data-reduce-motion","true");function gt(e){document.documentElement.dataset.theme=e;let t=document.getElementById("theme-toggle");t&&(t.textContent=e==="dark"?"\u2600\uFE0F":"\u{1F319}")}(function(){let t=localStorage.getItem("theme");gt(t||"light")})();document.getElementById("theme-toggle")?.addEventListener("click",()=>{let t=document.documentElement.dataset.theme==="dark"?"light":"dark";gt(t),localStorage.setItem("theme",t)});(function(){let t=localStorage.getItem("downloadQuality")||"high",a=document.getElementById("download-quality");a&&s.VALID_QUALITIES.includes(t)&&(a.value=t)})();document.getElementById("download-quality")?.addEventListener("change",e=>{localStorage.setItem("downloadQuality",e.target.value)});U();je();Qe();Ie();Se();Ue();ve();lt();we();setInterval(je,3e4);})();
