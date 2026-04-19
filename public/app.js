(()=>{var s={currentTab:"nu",currentMainTab:"nu",bibSubTab:"collectie",sectionContainerEl:null,currentPeriod:"7day",recsFilter:"all",discFilter:"all",gapsSort:"missing",releasesSort:"listening",releasesFilter:"all",plexOk:!1,lastDiscover:null,lastGaps:null,lastReleases:null,plexLibData:null,wishlistMap:new Map,newReleaseIds:new Set,searchTimeout:null,tidalSearchTimeout:null,tidarrOk:!1,tidalView:"search",tidalSearchResults:null,tidarrQueuePoll:null,tidarrSseSource:null,tidarrQueueItems:[],downloadedSet:new Set,spotifyEnabled:!1,activeMood:null,previewAudio:new Audio,previewBtn:null,collapsibleSections:{recs:!1,releases:!1,discover:!1},sectionMutex:Promise.resolve(),dlResolve:null,VALID_QUALITIES:["max","high","normal","low"]};var we=window.matchMedia("(prefers-reduced-motion: reduce)").matches,I=document.getElementById("content");function S(e,t=120){return e?`/api/img?url=${encodeURIComponent(e)}&w=${t}&h=${t}`:null}var j=(e,t="medium")=>{if(!e)return null;let a=e.find(i=>i.size===t);return a&&a["#text"]&&!a["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f")?a["#text"]:null},m=e=>String(e||"?").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2),B=e=>parseInt(e).toLocaleString("nl-NL"),l=e=>String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),Y=e=>({"7day":"week","1month":"maand","3month":"3 maanden","12month":"jaar",overall:"alles"})[e]||e;function Z(e){let t=Math.floor(Date.now()/1e3)-e;return t<120?"zojuist":t<3600?`${Math.floor(t/60)}m`:t<86400?`${Math.floor(t/3600)}u`:`${Math.floor(t/86400)}d`}function g(e,t=!1){let a=0;for(let r=0;r<e.length;r++)a=a*31+e.charCodeAt(r)&16777215;let i=a%360,n=45+a%31,d=50+(a>>8)%26,c=20+(a>>16)%16,o=15+(a>>10)%11;return t?`radial-gradient(circle, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${o}%))`:`linear-gradient(135deg, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${o}%))`}function _(e){return!e||e.length!==2?"":[...e.toUpperCase()].map(t=>String.fromCodePoint(t.charCodeAt(0)+127397)).join("")}function O(e,t=4){return e?.length?`<div class="tags" style="margin-top:5px">${e.slice(0,t).map(a=>`<span class="tag">${l(a)}</span>`).join("")}</div>`:""}function X(e){return s.plexOk?e?'<span class="badge plex">\u25B6 In Plex</span>':'<span class="badge new">\u2726 Nieuw</span>':""}function H(e,t,a="",i=""){let n=s.wishlistMap.has(`${e}:${t}`);return`<button class="bookmark-btn${n?" saved":""}"
    data-btype="${l(e)}" data-bname="${l(t)}"
    data-bartist="${l(a)}" data-bimage="${l(i)}"
    title="${n?"Verwijder uit lijst":"Sla op in lijst"}">\u{1F516}</button>`}function oe(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function Re(e,t){let a=i=>(i||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");return`${a(e)}|${a(t)}`}var Fe=(e,t)=>s.downloadedSet.has(Re(e,t)),Oe=(e,t)=>s.downloadedSet.add(Re(e,t));function z(e,t="",a=!1){return!s.tidarrOk||a?"":Fe(e,t)?`<button class="download-btn dl-done"
      data-dlartist="${l(e)}" data-dlalbum="${l(t)}"
      title="Al gedownload">\u2713</button>`:`<button class="download-btn"
    data-dlartist="${l(e)}" data-dlalbum="${l(t)}"
    title="Download via Tidarr">\u2B07</button>`}var $e=e=>{let t=j(e);return t?`<img class="card-img" src="${t}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>'};function K(e,t=!0,a=""){let i=e.inPlex,n=g(e.title||""),d=e.year||"\u2014",c=Fe(a,e.title||""),o=s.tidarrOk&&a&&!i?c?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${l(a)}" data-dlalbum="${l(e.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${l(a)}" data-dlalbum="${l(e.title||"")}" title="Download via Tidarr">\u2B07</button>`:"";return`
    <div class="album-card ${i?"owned":"missing"}" title="${l(e.title)}${d!=="\u2014"?" ("+d+")":""}">
      <div class="album-cover" style="background:${n}">
        <div class="album-cover-ph">${m(e.title||"?")}</div>
        <img src="${l(e.coverUrl||"")}" alt="" loading="lazy"
          style="opacity:0;transition:opacity 0.35s;position:relative;z-index:1"
          onload="this.style.opacity='1'" onerror="this.remove()">
        ${o}
      </div>
      <div class="album-info">
        <div class="album-title">${l(e.title)}</div>
        <div class="album-year">${d}</div>
        ${t?`<span class="album-status ${i?"own":"miss"}">${i?"\u25B6 In Plex":"\u2726 Ontbreekt"}</span>`:""}
      </div>
    </div>`}function ze(){if(we)return;Object.entries({".rec-grid > *":60,".card-list > *":25,".artist-grid > *":40,".releases-grid > *":40,".wishlist-grid > *":40}).forEach(([t,a])=>{document.querySelectorAll(t).forEach((i,n)=>{i.style.animationDelay=`${n*a}ms`})})}function mt(e){let t="";e==="cards"?t='<div class="skeleton-list">'+Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")+"</div>":e==="grid"?t='<div class="skeleton-grid">'+Array(8).fill('<div class="skeleton skeleton-square"></div>').join("")+"</div>":e==="stats"?t='<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>':t=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`,y(t)}function y(e,t){let a=s.sectionContainerEl||I;!s.sectionContainerEl&&document.startViewTransition?document.startViewTransition(()=>{a.innerHTML=e,ze(),t&&requestAnimationFrame(t)}).finished.catch(()=>{}):(a.innerHTML=e,s.sectionContainerEl?t&&t():(I.style.opacity="0",I.style.transform="translateY(6px)",requestAnimationFrame(()=>{I.offsetHeight,I.style.opacity="1",I.style.transform="",ze(),t&&requestAnimationFrame(t)})))}var C=e=>y(`<div class="error-box">\u26A0\uFE0F ${l(e)}</div>`);function q(e){if(s.sectionContainerEl){s.sectionContainerEl.innerHTML=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`;return}let a={recent:"cards",loved:"cards",toptracks:"cards",topartists:"grid",releases:"grid",recs:"grid",discover:"grid",gaps:"grid",stats:"stats",wishlist:"grid",plexlib:"cards",nu:"cards",ontdek:"grid",bibliotheek:"cards",downloads:"cards"}[s.currentTab];a&&!e?mt(a):y(`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`)}function ee(e,t){if(!e)return;if(!("IntersectionObserver"in window)){t();return}let a=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(a.unobserve(n.target),t())})},{rootMargin:"300px"});a.observe(e)}function R(e,t){let a=s.sectionMutex.then(async()=>{s.sectionContainerEl=e;try{await t()}finally{s.sectionContainerEl=null}});return s.sectionMutex=a.catch(()=>{}),a}function vt(e){if(document.getElementById("rate-limit-notice"))return;let t=document.createElement("div");t.id="rate-limit-notice",Object.assign(t.style,{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",background:"#e05a2b",color:"#fff",padding:"12px 24px",borderRadius:"8px",zIndex:"9999",fontSize:"14px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",whiteSpace:"nowrap"}),t.textContent="\u23F1 "+e,document.body.appendChild(t),setTimeout(()=>t.remove(),8e3)}async function p(e){let t=await fetch(e);if(t.status===429){let i=(await t.json().catch(()=>({}))).error||"Te veel verzoeken, probeer het over een minuut opnieuw";throw vt(i),new Error(i)}if(!t.ok)throw new Error(`Serverfout ${t.status}`);return t.json()}async function Ne(){try{let e=await p("/api/downloads/keys");s.downloadedSet=new Set(e)}catch{s.downloadedSet=new Set}}async function N(){try{let e=await fetch("/api/plex/status").then(i=>i.json()),t=document.getElementById("plex-pill"),a=document.getElementById("plex-pill-text");if(e.connected){s.plexOk=!0,t.className="plex-pill on";let i=e.albums?` \xB7 ${B(e.albums)} albums`:"";a.textContent=`Plex \xB7 ${B(e.artists)} artiesten${i}`}else t.className="plex-pill off",a.textContent="Plex offline"}catch{document.getElementById("plex-pill-text").textContent="Plex offline"}}async function Ve(){try{let t=(await p("/api/user")).user,a=j(t.image,"large"),i=a?`<img class="user-avatar" src="${a}" alt="">`:`<div class="user-avatar-ph">${(t.name||"U")[0].toUpperCase()}</div>`,n=new Date(parseInt(t.registered?.unixtime)*1e3).getFullYear();document.getElementById("user-wrap").innerHTML=`
      <div class="user-card">${i}
        <div><div class="user-name">${l(t.realname||t.name)}</div>
        <div class="user-sub">${B(t.playcount)} scrobbles \xB7 lid sinds ${n}</div></div>
      </div>`}catch{}}async function xe(){try{let e=await p("/api/wishlist");s.wishlistMap.clear();for(let t of e)s.wishlistMap.set(`${t.type}:${t.name}`,t.id);te()}catch{}}function te(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=s.wishlistMap.size||"0")}async function _e(e,t,a,i){let n=`${e}:${t}`;if(s.wishlistMap.has(n))return await fetch(`/api/wishlist/${s.wishlistMap.get(n)}`,{method:"DELETE"}),s.wishlistMap.delete(n),te(),!1;{let c=await(await fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:t,artist:a,image:i})})).json();return s.wishlistMap.set(n,c.id),te(),!0}}async function se(){q(),await xe();try{let e=await p("/api/wishlist");if(!e.length){y('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let t=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let a of e){let i=a.image?`<img src="${l(a.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";t+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${g(a.name)}">
            ${i}
            <div class="wish-ph">${m(a.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${l(a.name)}">${l(a.name)}</div>
              ${a.artist?`<div class="wish-sub">${l(a.artist)}</div>`:""}
              <div class="wish-type">${a.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${a.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}y(t+"</div>")}catch(e){C(e.message)}}function gt(){return localStorage.getItem("downloadQuality")||"high"}async function Ee(){try{let e=await p("/api/tidarr/status"),t=document.getElementById("tidarr-status-pill"),a=document.getElementById("tidarr-status-text");s.tidarrOk=!!e.connected,t&&a&&(t.className=`tidarr-status-pill ${s.tidarrOk?"on":"off"}`,a.textContent=s.tidarrOk?`Tidarr \xB7 verbonden${e.quality?" \xB7 "+e.quality:""}`:"Tidarr offline")}catch{s.tidarrOk=!1;let e=document.getElementById("tidarr-status-text");e&&(e.textContent="Tidarr offline")}}async function re(){try{let t=((await p("/api/tidarr/queue")).items||[]).length,a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let i of a)i&&(t>0?(i.textContent=t,i.style.display=""):i.style.display="none")}catch{}}function Ge(e){let t=e.image?`<img class="tidal-img" src="${l(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${g(e.title)}">${m(e.title)}</div>`:`<div class="tidal-ph" style="background:${g(e.title)}">${m(e.title)}</div>`,a=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${t}</div>
      <div class="tidal-info">
        <div class="tidal-title">${l(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${l(e.artist)}">${l(e.artist)}</div>
        <div class="tidal-meta">${l(a)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${l(e.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}async function ke(e){let t=document.getElementById("tidal-content");if(!t)return;let a=(e||"").trim();if(a.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let i=await p(`/api/tidarr/search?q=${encodeURIComponent(a)}`);if(s.tidalSearchResults=i.results||[],i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${l(i.error)}</div>`;return}if(!s.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${l(a)}</strong>".</div>`;return}let n=s.tidalSearchResults.filter(o=>o.type==="album"),d=s.tidalSearchResults.filter(o=>o.type==="track"),c="";n.length&&(c+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(Ge).join("")}</div>`),d.length&&(c+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(Ge).join("")}</div>`),t.innerHTML=c}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${l(i.message)}</div>`}}function We(){let e=document.getElementById("tidal-content");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",o=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=o!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${o}%"></div></div><div class="q-pct">${o}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${l(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${l(n.artist)}</div>`:""}
          <span class="q-status ${d}">${l(c)}</span>
        </div>
        ${r}
        <button class="q-remove" data-qid="${l(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function Je(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let t=await p("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let a={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
      <div class="section-title">${t.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${t.map(i=>{let n=i.queued_at?new Date(i.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",d=a[i.quality]||i.quality||"";return`<div class="q-row">
          <div class="q-info">
            <div class="q-title">${l(i.title)}</div>
            ${i.artist?`<div class="q-artist artist-link" data-artist="${l(i.artist)}">${l(i.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${d?" \xB7 "+d:""}${n?" \xB7 "+n:""}</span>
          </div>
          <button class="q-remove" data-dlid="${i.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){await fetch("/api/downloads",{method:"DELETE"}).catch(()=>{});for(let i of t)await fetch(`/api/downloads/${i.id}`,{method:"DELETE"}).catch(()=>{});s.downloadedSet.clear(),Je()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${l(t.message)}</div>`}}}function de(e){s.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(t=>t.classList.toggle("sel-def",t.dataset.tidalView===e)),e==="search"?ke(document.getElementById("tidal-search")?.value||""):e==="queue"?We():e==="history"&&Je()}function ce(){if(s.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");s.tidarrSseSource=e,e.onmessage=t=>{try{s.tidarrQueueItems=JSON.parse(t.data)||[]}catch{s.tidarrQueueItems=[]}let a=s.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(a.length>0?(n.textContent=a.length,n.style.display=""):n.style.display="none");if(bt(s.tidarrQueueItems),s.currentTab==="tidal"&&s.tidalView==="queue"&&We(),document.getElementById("queue-popover")?.classList.contains("open")&&Ze(),s.currentTab==="nu"){let n=document.getElementById("wbody-download-voortgang");n&&Le(n,a)}},e.onerror=()=>{e.close(),s.tidarrSseSource=null,setTimeout(ce,1e4)}}function Le(e,t){if(t||(t=s.tidarrQueueItems.filter(i=>i.status!=="finished"&&i.status!=="error")),!t.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};e.innerHTML=`<div class="w-queue-list">${t.slice(0,5).map(i=>{let n=i.progress?.current&&i.progress?.total?Math.round(i.progress.current/i.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${l(i.title||"(onbekend)")}</div>
      ${i.artist?`<div class="w-q-artist">${l(i.artist)}</div>`:""}
      ${n!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${n}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${n}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${l(a[i.status]||i.status)}</span>`}
    </div></div>`}).join("")}${t.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${t.length-5} meer</div>`:""}</div>`}function ft(){ce()}function Ye(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),a=document.getElementById("content");t.style.display="flex",a.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function D(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function bt(e){let t=document.getElementById("queue-fab"),a=document.getElementById("fab-queue-badge");if(!t)return;let i=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",i.length>0?(a.textContent=i.length,a.style.display=""):a.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function Ze(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",o=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=o!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${o}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${l(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${l(n.artist)}</div>`:""}
      <span class="q-status ${d}">${l(c)}</span>
      ${r}
    </div>`}).join("")}function yt(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&Ze()}function Ie(){document.getElementById("queue-popover")?.classList.remove("open")}function Ue(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function Xe(e,t){let a=Ue(e),i=Ue(t);return!a||!i?!0:a===i||a.includes(i)||i.includes(a)}function ht(e,t,a,i){return new Promise(n=>{s.dlResolve=n;let d=document.getElementById("dl-confirm-modal"),c=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${a}"${t?" \u2013 "+t:""}`,c.innerHTML=e.map((o,r)=>{let u=!Xe(o.artist,t),f=o.image?`<img class="dlc-img" src="${l(o.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${m(o.title)}</div>`:`<div class="dlc-ph">${m(o.title)}</div>`,b=u?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${l(o.artist)}</div>`:`<div class="dlc-artist">${l(o.artist)}</div>`,w=o.score??0;return`
        <button class="dlc-card${r===0?" dlc-best":""}" data-dlc-idx="${r}">
          <div class="dlc-cover">${f}</div>
          <div class="dlc-info">
            <div class="dlc-title">${l(o.title)}</div>
            ${b}
            <div class="dlc-meta">${o.year?l(o.year):""}${o.year&&o.tracks?" \xB7 ":""}${o.tracks?o.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${w}%"></div></div>
            <div class="dlc-score-label">${w}% overeenkomst</div>
          </div>
          ${r===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),c.querySelectorAll(".dlc-card").forEach(o=>{o.addEventListener("click",()=>{let r=parseInt(o.dataset.dlcIdx);Se(),n({chosen:e[r],btn:i})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function Se(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",s.dlResolve&&(s.dlResolve({chosen:null}),s.dlResolve=null)}async function Qe(e,t,a,i){let n=await fetch("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||a||"",artist:e.artist||t||"",id:String(e.id||""),quality:gt()})}),d=await n.json();if(!n.ok||!d.ok)throw new Error(d.error||"download mislukt");Oe(e.artist||t||"",e.title||a||""),i&&(i.textContent="\u2713",i.classList.add("dl-done"),i.disabled=!1),await re()}async function Ke(e,t,a){if(!s.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}a&&(a.disabled=!0,a.textContent="\u2026");try{let i=new URLSearchParams;e&&i.set("artist",e),t&&i.set("album",t);let n=await fetch(`/api/tidarr/candidates?${i}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let{candidates:d}=await n.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let c=d[0];if(e&&!Xe(c.artist,e)){a&&(a.disabled=!1,a.textContent="\u2B07");let{chosen:o}=await ht(d,e,t,a);if(!o)return;a&&(a.disabled=!0,a.textContent="\u2026"),await Qe(o,e,t,a)}else await Qe(c,e,t,a)}catch(i){alert("Downloaden mislukt: "+i.message),a&&(a.disabled=!1,a.textContent="\u2B07")}}async function Te(){y('<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>'),await Ee(),await re(),de(s.tidalView),ft()}function et(){s.currentTab="tidal",D(),document.getElementById("tb-tidal")?.classList.add("visible"),Te()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{Se()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&Se()});document.getElementById("queue-fab")?.addEventListener("click",yt);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),Ie()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{Ie(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>de("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),a=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!a?.contains(e.target)&&Ie()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});async function st(){try{let e=await p("/api/spotify/status");s.spotifyEnabled=!!e.enabled;let t=document.getElementById("tb-mood");s.spotifyEnabled&&s.currentTab==="recs"?(t.style.display="",t.classList.add("visible")):s.spotifyEnabled&&(t.style.display="")}catch{s.spotifyEnabled=!1}}function wt(e,t){let a=e.image?`<img src="${l(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',i=e.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${l(e.preview_url)}"
         data-artist="${l(e.artist)}" data-track="${l(e.name)}"
         id="spbtn-${t}" title="Luister preview">\u25B6</button>`:"",n=e.spotify_url?`<a class="spotify-link-btn" href="${l(e.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`
    <div class="spotify-card">
      <div class="spotify-cover">
        ${a}${i}
        <div class="play-bar" style="position:absolute;bottom:0;left:0;width:100%;height:3px;background:rgba(0,0,0,0.3)">
          <div class="play-bar-fill" id="spbar-${t}"></div>
        </div>
      </div>
      <div class="spotify-info">
        <div class="spotify-track" title="${l(e.name)}">${l(e.name)}</div>
        <div class="spotify-artist artist-link" data-artist="${l(e.artist)}">${l(e.artist)}</div>
        <div class="spotify-album" title="${l(e.album)}">${l(e.album)}</div>
        ${n}
      </div>
    </div>`}async function pe(e){let t=document.getElementById("spotify-recs-section");if(!t)return;let a={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};t.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let i=await p(`/api/spotify/recs?mood=${encodeURIComponent(e)}`);if(!i.length){t.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let n=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${l(a[e]||e)}</div>
      <div class="spotify-grid">`;i.forEach((d,c)=>{n+=wt(d,c)}),n+="</div>",t.innerHTML=n}catch{t.innerHTML=""}}function Q(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(e=>{e.addEventListener("click",async()=>{let t=e.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(a=>a.classList.remove("sel-mood","loading")),s.activeMood===t){s.activeMood=null,Q(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}s.activeMood=t,e.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await pe(t),e.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",Q()});document.addEventListener("click",e=>{let t=e.target.closest(".spotify-play-btn");if(!t)return;e.stopPropagation();let a=t.dataset.spotifyPreview;if(a){if(s.previewBtn===t){s.previewAudio.paused?(s.previewAudio.play(),t.textContent="\u23F8",t.classList.add("playing")):(s.previewAudio.pause(),t.textContent="\u25B6",t.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=t,s.previewAudio.src=a,s.previewAudio.currentTime=0,s.previewAudio.play().then(()=>{t.textContent="\u23F8",t.classList.add("playing")}).catch(()=>{t.textContent="\u25B6",s.previewBtn=null})}},!0);async function ue(){q();try{let e=await p("/api/recs"),t=e.recommendations||[],a=e.albumRecs||[],i=e.trackRecs||[];if(s.plexOk=e.plexConnected||s.plexOk,e.plexConnected&&e.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${B(e.plexArtistCount)} artiesten`),!t.length){y('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let n=t.filter(u=>!u.inPlex).length,d=t.filter(u=>u.inPlex).length,c=document.getElementById("hdr-title-recs");c&&(c.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${t.length} artiesten`);let o='<div class="spotify-section" id="spotify-recs-section"></div>';o+=`<div class="section-title">Gebaseerd op jouw smaak: ${(e.basedOn||[]).slice(0,3).join(", ")}
      ${s.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} nieuw</span> \xB7 <span style="color:var(--plex)">${d} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let u=0;u<t.length;u++){let f=t[u],b=Math.round(f.match*100);o+=`
        <div class="rec-card" data-inplex="${f.inPlex}" id="rc-${u}">
          <div class="rec-photo" id="rph-${u}">
            <div class="rec-photo-ph" style="background:${g(f.name)}">${m(f.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${l(f.name)}">${l(f.name)}</span>
                ${X(f.inPlex)}
              </div>
              <span class="rec-match">${b}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${l(f.reason)}</div>
            <div id="rtags-${u}"></div>
            <div id="ralb-${u}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`}if(o+="</div>",a.length){o+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let u of a){let f=S(u.image,80)||u.image,b=f?`<img class="albrec-img" src="${l(f)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${g(u.album)}">${m(u.album)}</div>`:`<div class="albrec-ph" style="background:${g(u.album)}">${m(u.album)}</div>`,w=s.plexOk?u.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";o+=`
          <div class="albrec-card">
            <div class="albrec-cover">${b}</div>
            <div class="albrec-info">
              <div class="albrec-title">${l(u.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${l(u.artist)}">${l(u.artist)}</div>
              <div class="albrec-reason">via ${l(u.reason)}</div>
              ${w}${z(u.artist,u.album,u.inPlex)}
            </div>
          </div>`}o+="</div>"}if(i.length){o+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let u of i){let f=u.playcount>0?`<span class="trackrec-plays">${B(u.playcount)}\xD7</span>`:"",b=u.url?`<a class="trackrec-link" href="${l(u.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";o+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${l(u.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${l(u.artist)}">${l(u.artist)}</div>
              <div class="trackrec-reason">via ${l(u.reason)}</div>
            </div>
            <div class="trackrec-meta">${f}${b}</div>
          </div>`}o+="</div>"}y(o,()=>{s.activeMood&&pe(s.activeMood)}),me();let r=document.getElementById("sec-recs-preview");if(r){let u=t.slice(0,8);r.innerHTML=`<div class="collapsed-thumbs">${u.map((f,b)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${b}" style="background:${g(f.name)}">
          <span class="collapsed-thumb-ph">${m(f.name)}</span>
        </div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`,u.forEach(async(f,b)=>{try{let w=await p(`/api/artist/${encodeURIComponent(f.name)}/info`),E=document.getElementById(`recs-thumb-${b}`);E&&w.image&&(E.innerHTML=`<img src="${l(S(w.image,48)||w.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}t.forEach(async(u,f)=>{try{let b=await p(`/api/artist/${encodeURIComponent(u.name)}/info`),w=document.getElementById(`rph-${f}`);w&&b.image&&(w.innerHTML=`<img src="${S(b.image,120)||b.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${g(u.name)}\\'>${m(u.name)}</div>'">`);let E=document.getElementById(`rtags-${f}`);E&&(E.innerHTML=O(b.tags,3)+'<div style="height:6px"></div>');let $=document.getElementById(`ralb-${f}`);if($){let x=(b.albums||[]).slice(0,4);if(x.length){let A='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let M of x){let v=M.image?`<img class="rec-album-img" src="${S(M.image,48)||M.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',h=s.plexOk&&M.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";A+=`<div class="rec-album-row">${v}<span class="rec-album-name">${l(M.name)}</span>${h}${z(u.name,M.name,M.inPlex)}</div>`}$.innerHTML=A+"</div>"}else $.innerHTML=""}}catch{let b=document.getElementById(`ralb-${f}`);b&&(b.innerHTML="")}})}catch(e){C(e.message)}}function me(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let t=e.dataset.inplex==="true",a=!0;s.recsFilter==="new"&&(a=!t),s.recsFilter==="plex"&&(a=t),e.classList.toggle("hidden",!a)})}function at(e){let t=document.getElementById("badge-releases");t&&(e>0?(t.textContent=e,t.style.display=""):t.style.display="none")}function $t(e){if(!e)return"";let t=new Date(e),i=Math.floor((new Date-t)/864e5);return i===0?"vandaag":i===1?"gisteren":i<7?`${i} dagen geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function G(){q();try{let e=await p("/api/releases");if(e.status==="building"){y(`<div class="loading"><div class="spinner"></div>
        <div>${l(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{(s.currentTab==="releases"||s.currentTab==="ontdek")&&G()},5e3);return}s.lastReleases=e.releases||[],s.newReleaseIds=new Set(e.newReleaseIds||[]),at(e.newCount||0),F()}catch(e){C(e.message)}}function F(){let e=s.lastReleases||[];if(!e.length){y('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let t=e;if(s.releasesFilter!=="all"&&(t=e.filter(o=>(o.type||"album").toLowerCase()===s.releasesFilter)),!t.length){y(`<div class="empty">Geen ${s.releasesFilter==="ep"?"EP's":s.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}s.releasesSort==="listening"?t=[...t].sort((o,r)=>(r.artistPlaycount||0)-(o.artistPlaycount||0)||new Date(r.releaseDate)-new Date(o.releaseDate)):t=[...t].sort((o,r)=>new Date(r.releaseDate)-new Date(o.releaseDate));let a=document.getElementById("hdr-title-releases");a&&(a.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${t.length} release${t.length!==1?"s":""}`);let i=o=>({album:"Album",single:"Single",ep:"EP"})[o?.toLowerCase()]||o||"Album",n=o=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[o?.toLowerCase()]||"rel-type-album",d=`<div class="section-title">${t.length} release${t.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let o of t){let r=s.newReleaseIds.has(`${o.artist}::${o.album}`),u=o.image?`<img class="rel-img" src="${l(o.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${g(o.album)}">${m(o.album)}</div>`:`<div class="rel-ph" style="background:${g(o.album)}">${m(o.album)}</div>`,f=o.releaseDate?new Date(o.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",b=$t(o.releaseDate),w=f?`<div class="rel-date">${f} <span class="rel-date-rel">(${b})</span></div>`:"",E=s.plexOk?o.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':o.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",$=o.deezerUrl?`<a class="rel-deezer-link" href="${l(o.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";d+=`
      <div class="rel-card${r?" rel-card-new":""}">
        <div class="rel-cover">${u}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${n(o.type)}">${i(o.type)}</span>
          <div class="rel-album">${l(o.album)}</div>
          <div class="rel-artist artist-link" data-artist="${l(o.artist)}">${l(o.artist)}</div>
          ${w}
          <div class="rel-footer">${E}${$}${z(o.artist,o.album,o.inPlex)}</div>
        </div>
      </div>`}y(d+"</div>");let c=document.getElementById("sec-releases-preview");if(c){let o=t.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${o.map(r=>r.image?`<div class="collapsed-thumb">
          <img src="${l(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${g(r.album)}">${m(r.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${g(r.album)}"><span class="collapsed-thumb-ph">${m(r.album)}</span></div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`}}async function U(){q("Ontdekkingen ophalen...");try{let e=await p("/api/discover");if(e.status==="building"){y(`<div class="loading"><div class="spinner"></div>
        <div>${l(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{(s.currentTab==="discover"||s.currentTab==="ontdek")&&U()},2e4);return}s.lastDiscover=e,e.plexConnected&&(s.plexOk=!0),ae()}catch(e){C(e.message)}}function ae(){if(!s.lastDiscover)return;let{artists:e,basedOn:t}=s.lastDiscover;if(!e?.length){y('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let a=e;if(s.discFilter==="new"&&(a=e.filter(o=>!o.inPlex)),s.discFilter==="partial"&&(a=e.filter(o=>o.inPlex&&o.missingCount>0)),!a.length){y('<div class="empty">Geen artiesten voor dit filter.</div>');return}let i=document.getElementById("hdr-title-discover");i&&(i.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`);let n=a.reduce((o,r)=>o+r.missingCount,0),d=`<div class="section-title">Gebaseerd op: ${(t||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let o=0;o<a.length;o++){let r=a[o],u=Math.round(r.match*100),f=[_(r.country),r.country,r.startYear?`Actief vanaf ${r.startYear}`:null,r.totalAlbums?`${r.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),b=S(r.image,120)||r.image,w=b?`<img class="discover-photo" src="${l(b)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${g(r.name,!0)}">${m(r.name)}</div>`:`<div class="discover-photo-ph" style="background:${g(r.name,!0)}">${m(r.name)}</div>`,E=r.albums?.length||0,$=`${E} album${E!==1?"s":""}`;if(d+=`
      <div class="discover-section collapsed" id="disc-${o}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${o}">
          <div class="discover-card-top">
            ${w}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${l(r.name)}">${l(r.name)}</span>
                ${X(r.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${l(r.reason)}</strong></div>
            </div>
            <span class="discover-match">${u}%</span>
            ${H("artist",r.name,"",r.image||"")}
          </div>
          ${f?`<div class="discover-meta">${l(f)}</div>`:""}
          ${O(r.tags,3)}
          ${r.missingCount>0?`<div class="discover-missing">\u2726 ${r.missingCount} ${r.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${o}" data-album-count="${E}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${$}</button>
          ${r.albums?.length?`<div class="discover-preview-row">${r.albums.slice(0,5).map(x=>{let A=g(x.title||"");return x.coverUrl?`<img class="discover-preview-thumb" src="${l(x.coverUrl)}" alt="${l(x.title)}" loading="lazy"
                   title="${l(x.title)}${x.year?" ("+x.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${A}">${m(x.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${A}">${m(x.title||"?")}</div>`}).join("")}${r.albums.length>5?`<div class="discover-preview-more">+${r.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,r.albums?.length){d+='<div class="album-grid">';for(let x of r.albums)d+=K(x,!0,r.name);d+="</div>"}else d+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';d+="</div></div>"}d+="</div>",y(d);let c=document.getElementById("sec-discover-preview");if(c){let o=a.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${o.map(r=>r.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${l(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${g(r.name)}">${m(r.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${g(r.name)}"><span class="collapsed-thumb-ph">${m(r.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`}}function xt(){try{let e=localStorage.getItem("ontdek-sections");e&&Object.assign(s.collapsibleSections,JSON.parse(e))}catch{}}function Et(){try{localStorage.setItem("ontdek-sections",JSON.stringify(s.collapsibleSections))}catch{}}function tt(e,t){e.classList.remove("expanded","collapsed"),e.classList.add(t?"collapsed":"expanded")}function Be(e,t){let a=document.querySelector(`[data-section="${e}"]`);if(!a)return;let i=a.querySelector(".section-toggle-btn");i&&(tt(i,s.collapsibleSections[t]),i.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),s.collapsibleSections[t]=!s.collapsibleSections[t],Et(),tt(i,s.collapsibleSections[t]),a.classList.toggle("collapsed")}),s.collapsibleSections[t]&&a.classList.add("collapsed"))}async function W(){xt(),s.currentTab="ontdek",D();let e=s.spotifyEnabled?`
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
    </div>`:"";I.innerHTML=`
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
    </div>`,I.style.opacity="1",I.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{await R(document.getElementById("sec-recs-content"),ue)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{s.lastReleases=null,await fetch("/api/releases/refresh",{method:"POST"}),await R(document.getElementById("sec-releases-content"),G)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{s.lastDiscover=null,await fetch("/api/discover/refresh",{method:"POST"}),await R(document.getElementById("sec-discover-content"),U)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(t=>t.classList.remove("sel-mood","loading")),Q(),W()});{let t=document.getElementById("sec-recs-content");s.sectionContainerEl=t,await ue(),s.sectionContainerEl===t&&(s.sectionContainerEl=null)}(async()=>{try{if(!s.lastReleases){let a=await p("/api/releases");if(a.status==="building")return;s.lastReleases=a.releases||[],s.newReleaseIds=new Set(a.newReleaseIds||[]),at(a.newCount||0)}let t=document.getElementById("sec-releases-preview");if(t&&s.lastReleases.length){let a=s.lastReleases;s.releasesFilter!=="all"&&(a=s.lastReleases.filter(d=>(d.type||"album").toLowerCase()===s.releasesFilter)),s.releasesSort==="listening"?a=[...a].sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)||new Date(c.releaseDate)-new Date(d.releaseDate)):a=[...a].sort((d,c)=>new Date(c.releaseDate)-new Date(d.releaseDate));let i=a.slice(0,8);t.innerHTML=`<div class="collapsed-thumbs">${i.map(d=>d.image?`<div class="collapsed-thumb">
              <img src="${l(d.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${g(d.album)}">${m(d.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${g(d.album)}"><span class="collapsed-thumb-ph">${m(d.album)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let n=document.getElementById("hdr-title-releases");n&&(n.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${a.length} release${a.length!==1?"s":""}`)}}catch{}})(),ee(document.getElementById("sec-releases-content"),()=>{let t=document.getElementById("sec-releases-content");return R(t,G)}),(async()=>{try{if(!s.lastDiscover){let n=await p("/api/discover");if(n.status==="building")return;s.lastDiscover=n,n.plexConnected&&(s.plexOk=!0)}let{artists:t}=s.lastDiscover;if(!t?.length)return;let a=t;s.discFilter==="new"&&(a=t.filter(n=>!n.inPlex)),s.discFilter==="partial"&&(a=t.filter(n=>n.inPlex&&n.missingCount>0));let i=document.getElementById("sec-discover-preview");if(i&&a.length){let n=a.slice(0,8);i.innerHTML=`<div class="collapsed-thumbs">${n.map(c=>c.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${l(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${g(c.name)}">${m(c.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${g(c.name)}"><span class="collapsed-thumb-ph">${m(c.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-discover");d&&(d.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`)}}catch{}})(),ee(document.getElementById("sec-discover-content"),()=>{let t=document.getElementById("sec-discover-content");return R(t,U)}),Be("recs","recs"),Be("releases","releases"),Be("discover","discover")}var ve=null;function ge(){ve&&(clearInterval(ve),ve=null)}async function Ae(){let e=document.getElementById("plex-np-wrap");try{let t=await fetch("/api/plex/nowplaying").then(a=>a.json());e.innerHTML=t.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${l(t.track)}</div>
           <div class="card-sub">${l(t.artist)}${t.album?" \xB7 "+l(t.album):""}</div></div></div>`:""}catch{e.innerHTML=""}}function it(e){return{"nu-luisteren":"\u{1F3B6} Nu luisteren","recente-nummers":"\u{1F550} Recente nummers","nieuwe-releases":"\u{1F4BF} Nieuwe releases deze week","download-voortgang":"\u2B07 Download-voortgang","vandaag-cijfers":"\u{1F4CA} Vandaag in cijfers",aanbeveling:"\u2728 Aanbeveling van de dag","collectie-stats":"\u{1F4C0} Collectie-stats"}[e]||e}var qe=["nu-luisteren","recente-nummers","nieuwe-releases","download-voortgang","vandaag-cijfers","aanbeveling","collectie-stats"],nt=-1,ie=null;function lt(){let e=null,t=[];try{e=JSON.parse(localStorage.getItem("dashWidgetOrder"))}catch{}try{t=JSON.parse(localStorage.getItem("dashWidgetHidden"))||[]}catch{}let i=(Array.isArray(e)&&e.length?e:qe).filter(o=>qe.includes(o)&&!t.includes(o)),n=qe.map(o=>`<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${l(o)}"${t.includes(o)?"":" checked"}>
      ${l(it(o))}
    </label>`).join(""),d=i.map(o=>`<div class="widget-card" id="widget-${l(o)}" data-widget="${l(o)}">
      <div class="widget-hdr"><span class="widget-title">${l(it(o))}</span></div>
      <div class="widget-body" id="wbody-${l(o)}">
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
    <div class="widget-grid" id="widget-grid">${d}</div>`;s.sectionContainerEl=null,I.innerHTML=c,requestAnimationFrame(()=>{Promise.allSettled([ot(),kt(),Lt(),It(),St(),Tt(),Bt()]),document.getElementById("dash-customize-btn")?.addEventListener("click",()=>{let o=document.getElementById("dash-customize-panel");o&&(o.style.display=o.style.display==="none"?"":"none")}),document.querySelectorAll(".dash-widget-cb").forEach(o=>{o.addEventListener("change",()=>{let r=[];document.querySelectorAll(".dash-widget-cb").forEach(u=>{u.checked||r.push(u.dataset.widget)}),localStorage.setItem("dashWidgetHidden",JSON.stringify(r)),lt()})})})}function V(e,t){let a=document.getElementById("wbody-"+e);a&&(a.innerHTML=`<div class="widget-error">\u26A0 ${l(t||"Niet beschikbaar")}</div>`)}async function ot(){let e=document.getElementById("wbody-nu-luisteren");if(e)try{let[t,a]=await Promise.allSettled([fetch("/api/plex/nowplaying").then(n=>n.json()),p("/api/recent")]),i="";if(t.status==="fulfilled"&&t.value?.playing){let n=t.value;i+=`<div class="w-np-row">
        <div class="w-np-dot plex"></div>
        <div class="w-np-info">
          <div class="w-np-title">${l(n.track)}</div>
          <div class="w-np-sub">${l(n.artist)}${n.album?" \xB7 "+l(n.album):""}</div>
          <span class="badge plex" style="font-size:10px">\u25B6 Plex</span>
        </div>
      </div>`}if(a.status==="fulfilled"){let d=(a.value.recenttracks?.track||[]).find(c=>c["@attr"]?.nowplaying);if(d){let c=d.artist?.["#text"]||"",o=j(d.image,"medium");i+=`<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${o?`<img class="w-np-img" src="${l(o)}" alt="" loading="lazy">`:""}
          <div class="w-np-info">
            <div class="w-np-title">${l(d.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${l(c)}">${l(c)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">\u25CF Last.fm</span>
          </div>
        </div>`}}e.innerHTML=i||'<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>'}catch(t){V("nu-luisteren",t.message)}}async function kt(){let e=document.getElementById("wbody-recente-nummers");if(e)try{let a=((await p("/api/recent")).recenttracks?.track||[]).filter(i=>!i["@attr"]?.nowplaying).slice(0,8);if(!a.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen recente nummers</div>';return}e.innerHTML=`<div class="w-track-list">${a.map(i=>{let n=i.artist?.["#text"]||"",d=i.date?.uts?Z(parseInt(i.date.uts)):"";return`<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${l(i.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${l(n)}">${l(n)}</div>
        </div>
        <span class="w-track-ago">${d}</span>
      </div>`}).join("")}</div>`}catch(t){V("recente-nummers",t.message)}}async function Lt(){let e=document.getElementById("wbody-nieuwe-releases");if(e)try{let t=s.lastReleases;if(!t){let n=await p("/api/releases");if(n.status==="building"){e.innerHTML='<div class="empty" style="font-size:12px">Releases worden geladen\u2026</div>';return}t=n.releases||[]}let a=Date.now()-168*3600*1e3,i=t.filter(n=>n.releaseDate&&new Date(n.releaseDate).getTime()>a).sort((n,d)=>(d.artistPlaycount||0)-(n.artistPlaycount||0)).slice(0,3);if(!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen releases deze week</div>';return}e.innerHTML=`<div class="w-releases-list">${i.map(n=>`<div class="w-rel-row">
        <div class="w-rel-cover">${n.image?`<img class="w-rel-img" src="${l(n.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="w-rel-ph" style="background:${g(n.album)}">${m(n.album)}</div>`}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${l(n.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${l(n.artist)}">${l(n.artist)}</div>
        </div>
        ${z(n.artist,n.album,n.inPlex)}
      </div>`).join("")}</div>`}catch(t){V("nieuwe-releases",t.message)}}async function It(){let e=document.getElementById("wbody-download-voortgang");if(e){if(!s.tidarrOk){e.innerHTML='<div class="widget-error">\u26A0 Tidarr offline</div>';return}try{let a=((await p("/api/tidarr/queue")).items||s.tidarrQueueItems||[]).filter(i=>i.status!=="finished"&&i.status!=="error");Le(e,a)}catch{V("download-voortgang","Tidarr niet bereikbaar")}}}async function St(){let e=document.getElementById("wbody-vandaag-cijfers");if(e)try{let a=(await p("/api/recent")).recenttracks?.track||[],i=new Date().toDateString(),n=a.filter(r=>r.date?.uts&&new Date(parseInt(r.date.uts)*1e3).toDateString()===i),d=new Set(n.map(r=>r.artist?.["#text"])).size,c={};for(let r of n){let u=r.artist?.["#text"]||"";c[u]=(c[u]||0)+1}let o=Object.entries(c).sort((r,u)=>u[1]-r[1])[0];e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${n.length}</div>
        <div class="w-stat-lbl">scrobbles</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${d}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      ${o?`<div class="w-stat-block w-stat-wide">
        <div class="w-stat-val" style="font-size:13px;line-height:1.3">${l(o[0])}</div>
        <div class="w-stat-lbl">meest gespeeld (${o[1]}\xD7)</div>
      </div>`:""}
    </div>`}catch(t){V("vandaag-cijfers",t.message)}}async function Tt(){let e=document.getElementById("wbody-aanbeveling");if(e)try{let t=Math.floor(Date.now()/864e5);if((!ie||nt!==t)&&(ie=(await p("/api/recs")).recommendations||[],nt=t),!ie.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen aanbevelingen</div>';return}let a=ie[t%ie.length],i=null;try{i=await p(`/api/artist/${encodeURIComponent(a.name)}/info`)}catch{}let n=i?.image?S(i.image,80)||i.image:null,d=(i?.albums||[]).slice(0,3);e.innerHTML=`<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${n?`<img class="w-rec-img" src="${l(n)}" alt="" loading="lazy">`:`<div class="w-rec-ph" style="background:${g(a.name)}">${m(a.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${l(a.name)}">${l(a.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${l(a.reason)}</div>
          ${X(a.inPlex)}
          ${H("artist",a.name,"",i?.image||"")}
        </div>
      </div>
      ${d.length?`<div class="w-rec-albums">${d.map(c=>`<span class="w-rec-album">${l(c.name)}</span>`).join("")}</div>`:""}
    </div>`}catch(t){V("aanbeveling",t.message)}}async function Bt(){let e=document.getElementById("wbody-collectie-stats");if(e)try{let t=await p("/api/plex/status");if(!t.connected){e.innerHTML='<div class="empty" style="font-size:12px">Plex offline</div>';return}let a=0;s.lastGaps?.artists&&(a=s.lastGaps.artists.reduce((i,n)=>i+(n.missingCount||0),0)),e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${B(t.artists||0)}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${B(t.albums||0)}</div>
        <div class="w-stat-lbl">albums</div>
      </div>
      ${a?`<div class="w-stat-block">
        <div class="w-stat-val">${a}</div>
        <div class="w-stat-lbl">ontbreekt</div>
      </div>`:""}
    </div>`}catch(t){V("collectie-stats",t.message)}}async function rt(){try{let t=(await p("/api/recent")).recenttracks?.track||[];if(!t.length){setContent('<div class="empty">Geen recente nummers.</div>');return}let a='<div class="card-list">';for(let i of t){let n=i["@attr"]?.nowplaying,d=i.date?.uts?Z(parseInt(i.date.uts)):"",c=i.artist?.["#text"]||"",o=j(i.image),r=o?`<img class="card-img" src="${l(o)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>';n?a+=`<div class="now-playing">${r}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${l(i.name)}</div>
          <div class="card-sub artist-link" data-artist="${l(c)}">${l(c)}</div></div></div>`:a+=`<div class="card">${r}<div class="card-info">
          <div class="card-title">${l(i.name)}</div>
          <div class="card-sub artist-link" data-artist="${l(c)}">${l(c)}</div>
          </div><div class="card-meta">${d}</div>
          <button class="play-btn" data-artist="${l(c)}" data-track="${l(i.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}setContent(a+"</div>")}catch(e){setContent(`<div class="error-box">\u26A0\uFE0F ${l(e.message)}</div>`)}}function fe(){s.currentTab="nu",D(),ge(),lt(),ve=setInterval(()=>{if(s.currentTab!=="nu"){ge();return}ot()},3e4)}async function dt(e,t,a){if(s.previewBtn===e){s.previewAudio.paused?(await s.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(s.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=e,e.textContent="\u2026",e.disabled=!0;try{let i=new URLSearchParams({artist:t,track:a}),n=await p(`/api/preview?${i}`);if(!n.preview){e.textContent="\u2014",e.disabled=!1,setTimeout(()=>{e.textContent==="\u2014"&&(e.textContent="\u25B6")},1800),s.previewBtn=null;return}s.previewAudio.src=n.preview,s.previewAudio.currentTime=0,await s.previewAudio.play(),e.textContent="\u23F8",e.disabled=!1,e.classList.add("playing")}catch{e.textContent="\u25B6",e.disabled=!1,s.previewBtn=null}}s.previewAudio.addEventListener("timeupdate",()=>{if(!s.previewBtn||!s.previewAudio.duration)return;let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width=`${(s.previewAudio.currentTime/s.previewAudio.duration*100).toFixed(1)}%`)});s.previewAudio.addEventListener("ended",()=>{if(s.previewBtn){s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width="0%"),s.previewBtn=null}});document.addEventListener("visibilitychange",()=>{document.hidden&&!s.previewAudio.paused&&(s.previewAudio.pause(),s.previewBtn&&(s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing")))});async function Ct(e){let t=document.getElementById("search-results");if(e.length<2){t.classList.remove("open");return}try{let a=await p(`/api/search?q=${encodeURIComponent(e)}`);a.results?.length?t.innerHTML=a.results.map(i=>{let n=S(i.image,56)||i.image,d=n?`<img class="search-result-img" src="${l(n)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${g(i.name)};display:none">${m(i.name)}</div>`:`<div class="search-result-ph" style="background:${g(i.name)}">${m(i.name)}</div>`,c=i.listeners?`${B(i.listeners)} luisteraars`:"";return`<button class="search-result-item" data-artist="${l(i.name)}">
          ${d}
          <div><div class="search-result-name">${l(i.name)}</div>
          ${c?`<div class="search-result-sub">${c}</div>`:""}</div>
        </button>`}).join(""):t.innerHTML='<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>',t.classList.add("open")}catch{}}document.getElementById("search-input").addEventListener("input",e=>{clearTimeout(s.searchTimeout);let t=e.target.value.trim();if(!t){document.getElementById("search-results").classList.remove("open");return}s.searchTimeout=setTimeout(()=>Ct(t),320)});document.addEventListener("click",e=>{e.target.closest("#search-wrap")||document.getElementById("search-results").classList.remove("open")});function be(e,t){let a=(t||"").toLowerCase().trim(),i=e;if(a&&(i=e.filter(c=>c.artist.toLowerCase().includes(a)||c.album.toLowerCase().includes(a))),!i.length)return`<div class="empty">Geen resultaten voor "<strong>${l(t)}</strong>".</div>`;let n=new Map;for(let c of i)n.has(c.artist)||n.set(c.artist,[]),n.get(c.artist).push(c.album);let d=`<div class="section-title">${n.size} artiesten \xB7 ${B(i.length)} albums</div>
    <div class="plib-list">`;for(let[c,o]of n)d+=`
      <div class="plib-artist-block">
        <div class="plib-artist-header artist-link" data-artist="${l(c)}">
          <div class="plib-avatar" style="background:${g(c)}">${m(c)}</div>
          <span class="plib-artist-name">${l(c)}</span>
          <span class="plib-album-count">${o.length}</span>
        </div>
        <div class="plib-albums">
          ${o.map(r=>`<div class="plib-album-row">
            <span class="plib-album-badge">\u25B6</span>
            <span class="plib-album-title" title="${l(r)}">${l(r)}</span>
          </div>`).join("")}
        </div>
      </div>`;return d+"</div>"}async function ne(){q();try{let e=await p("/api/plex/library");s.plexLibData=e.library||[];let t=document.getElementById("plib-search");if(t&&(t.value=""),!s.plexLibData.length){y('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik \u21BB Sync Plex om te beginnen.</div>');return}y(be(s.plexLibData,""))}catch(e){C(e.message)}}async function Me(e){q();try{let a=(await p(`/api/topartists?period=${e}`)).topartists?.artist||[];if(!a.length){y('<div class="empty">Geen data.</div>');return}let i=parseInt(a[0]?.playcount||1),n=`<div class="section-title">Top artiesten \xB7 ${Y(e)}</div><div class="artist-grid">`;for(let d=0;d<a.length;d++){let c=a[d],o=Math.round(parseInt(c.playcount)/i*100),r=j(c.image,"large")||j(c.image),u=S(r,120)||r,f=u?`<img src="${u}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${g(c.name,!0)}">${m(c.name)}</div>`:`<div class="ag-photo-ph" style="background:${g(c.name,!0)}">${m(c.name)}</div>`;n+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${d}" style="view-transition-name: artist-${oe(c.name)}">${f}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${l(c.name)}">${l(c.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${o}%"></div></div>
          <div class="ag-plays">${B(c.playcount)} plays</div>
        </div></div>`}y(n+"</div>"),a.forEach(async(d,c)=>{try{let o=await p(`/api/artist/${encodeURIComponent(d.name)}/info`);if(o.image){let r=document.getElementById(`agp-${c}`);r&&(r.innerHTML=`<img src="${S(o.image,120)||o.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}})}catch(t){C(t.message)}}async function Pe(e){q();try{let a=(await p(`/api/toptracks?period=${e}`)).toptracks?.track||[];if(!a.length){y('<div class="empty">Geen data.</div>');return}let i=parseInt(a[0]?.playcount||1),n=`<div class="section-title">Top nummers \xB7 ${Y(e)}</div><div class="card-list">`;for(let d of a){let c=Math.round(parseInt(d.playcount)/i*100);n+=`<div class="card">${$e(d.image)}<div class="card-info">
        <div class="card-title">${l(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(d.artist?.name||"")}">${l(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${c}%"></div></div>
        </div><div class="card-meta">${B(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${l(d.artist?.name||"")}" data-track="${l(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}y(n+"</div>")}catch(t){C(t.message)}}async function ut(){q();try{let t=(await p("/api/loved")).lovedtracks?.track||[];if(!t.length){y('<div class="empty">Geen geliefde nummers.</div>');return}let a='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let i of t){let n=i.date?.uts?Z(parseInt(i.date.uts)):"";a+=`<div class="card">${$e(i.image)}<div class="card-info">
        <div class="card-title">${l(i.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(i.artist?.name||"")}">${l(i.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${l(i.artist?.name||"")}" data-track="${l(i.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}y(a+"</div>")}catch(e){C(e.message)}}async function De(){q("Statistieken ophalen...");try{let e=await p("/api/stats");y(`
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
      </div>`,()=>qt(e))}catch(e){C(e.message)}}function qt(e){if(typeof Chart>"u")return;let t=!window.matchMedia("(prefers-color-scheme: light)").matches,a=t?"#2c2c2c":"#ddd",i=t?"#888":"#777",n=t?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=a;let d=document.getElementById("chart-daily");d&&new Chart(d,{type:"bar",data:{labels:e.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:e.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:a},ticks:{color:i},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&e.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:e.topArtists.map(r=>r.name),datasets:[{data:e.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:a},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:n,font:{size:11}}}}}});let o=document.getElementById("chart-genres");if(o&&e.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(o,{type:"doughnut",data:{labels:e.genres.map(u=>u.name),datasets:[{data:e.genres.map(u=>u.count),backgroundColor:r.slice(0,e.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function J(){q("Collectiegaten zoeken...");try{let e=await p("/api/gaps");if(e.status==="building"){y(`<div class="loading"><div class="spinner"></div>
        <div>${l(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{s.currentTab==="gaps"&&J()},2e4);return}s.lastGaps=e,le()}catch(e){C(e.message)}}function le(){if(!s.lastGaps)return;let e=[...s.lastGaps.artists||[]];if(!e.length){y('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}s.gapsSort==="missing"&&e.sort((i,n)=>n.missingAlbums.length-i.missingAlbums.length),s.gapsSort==="name"&&e.sort((i,n)=>i.name.localeCompare(n.name));let t=e.reduce((i,n)=>i+n.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=t;let a=`<div class="section-title">${t} ontbrekende albums bij ${e.length} artiesten die je al hebt</div>`;for(let i of e){let n=Math.round(i.ownedCount/i.totalCount*100),d=[_(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),c=S(i.image,56)||i.image,o=c?`<img class="gaps-photo" src="${l(c)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${g(i.name)}">${m(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${g(i.name)}">${m(i.name)}</div>`;a+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${o}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${l(i.name)}">${l(i.name)}</div>
              ${H("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${l(d)}</div>
            ${O(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let r of i.missingAlbums)a+=K(r,!1,i.name);a+="</div>",i.allAlbums?.filter(r=>r.inPlex).length>0&&(a+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(r=>r.inPlex).map(r=>K(r,!1,i.name)).join("")}
        </div>
      </details>`),a+="</div>"}y(a)}async function ct(e){s.bibSubTab=e;let t=document.getElementById("bib-sub-content"),a=document.getElementById("bib-subtoolbar");if(!t)return;document.querySelectorAll(".bib-tab").forEach(n=>n.classList.toggle("active",n.dataset.bibtab===e)),a&&(e==="collectie"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <input class="plib-search" id="plib-search-bib" type="text"
            placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off" style="flex:1;min-width:0">
          <button class="tool-btn" id="btn-sync-plex-bib">\u21BB Sync Plex</button>
        </div>`,document.getElementById("plib-search-bib")?.addEventListener("input",n=>{s.plexLibData&&(t.innerHTML=be(s.plexLibData,n.target.value))}),document.getElementById("btn-sync-plex-bib")?.addEventListener("click",async()=>{let n=document.getElementById("btn-sync-plex-bib"),d=n.textContent;n.disabled=!0,n.textContent="\u21BB Bezig\u2026";try{await fetch("/api/plex/refresh",{method:"POST"}),await N(),s.plexLibData=null;let c=t;s.sectionContainerEl=c,await ne(),s.sectionContainerEl===c&&(s.sectionContainerEl=null)}catch{}finally{n.disabled=!1,n.textContent=d}})):e==="gaten"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <button class="tool-btn${s.gapsSort==="missing"?" sel-def":""}" data-gsort="missing">Meest ontbrekend</button>
          <button class="tool-btn${s.gapsSort==="name"?" sel-def":""}" data-gsort="name">A\u2013Z</button>
          <span class="toolbar-sep"></span>
          <button class="tool-btn refresh-btn" id="btn-ref-gaps-bib">\u21BB Vernieuwen</button>
        </div>`,document.getElementById("btn-ref-gaps-bib")?.addEventListener("click",async()=>{s.lastGaps=null,await fetch("/api/gaps/refresh",{method:"POST"});let n=document.getElementById("bib-sub-content");s.sectionContainerEl=n,await J(),s.sectionContainerEl===n&&(s.sectionContainerEl=null)})):a.innerHTML="");let i=t;s.sectionContainerEl=i;try{e==="collectie"?(s.currentTab="plexlib",await ne()):e==="gaten"?(s.currentTab="gaps",await J()):e==="lijst"&&(s.currentTab="wishlist",await se())}finally{s.sectionContainerEl===i&&(s.sectionContainerEl=null)}}async function je(){s.currentTab="plexlib",D(),I.innerHTML=`
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${Y(s.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${Y(s.currentPeriod)})</span></div>
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
    </div>`,I.style.opacity="1",I.style.transform="";let e=document.getElementById("badge-gaps-bib"),t=document.getElementById("badge-gaps");e&&t&&(e.textContent=t.textContent),document.querySelectorAll(".bib-tab").forEach(a=>a.addEventListener("click",()=>ct(a.dataset.bibtab)));{let a=document.getElementById("strip-artists-body");s.sectionContainerEl=a,await Me(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}{let a=document.getElementById("strip-tracks-body");s.sectionContainerEl=a,await Pe(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}await ct(s.bibSubTab),ee(document.getElementById("bib-stats-content"),()=>{let a=document.getElementById("bib-stats-content");return R(a,De)})}function He(e){let t=document.getElementById("panel-overlay"),a=document.getElementById("panel-content"),i=oe(e),n=()=>{a.innerHTML=`<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`,t.classList.add("open"),document.body.style.overflow="hidden"};document.startViewTransition?document.startViewTransition(n).finished.catch(()=>{}):n(),Promise.allSettled([p(`/api/artist/${encodeURIComponent(e)}/info`),p(`/api/artist/${encodeURIComponent(e)}/similar`)]).then(([d,c])=>{let o=d.status==="fulfilled"?d.value:{},r=c.status==="fulfilled"?c.value.similar||[]:[],u=S(o.image,400)||o.image,f=u?`<img src="${l(u)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${g(e)};display:none">${m(e)}</div>`:`<div class="panel-photo-ph" style="background:${g(e)}">${m(e)}</div>`,b=[o.country?_(o.country)+" "+o.country:null,o.startYear?`Actief vanaf ${o.startYear}`:null,s.plexOk&&o.inPlex!==void 0?o.inPlex?"\u25B6 In Plex":"\u2726 Nieuw voor jou":null].filter(Boolean).join(" \xB7 "),w="";if(o.albums?.length){w='<div class="panel-section">Albums</div><div class="panel-albums">';for(let $ of o.albums){let x=S($.image,48)||$.image,A=x?`<img class="panel-album-img" src="${l(x)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="panel-album-ph">\u266A</div>',M=s.plexOk&&$.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6</span>':"";w+=`<div class="panel-album-row">${A}
          <span class="panel-album-name">${l($.name)}</span>${M}${z(e,$.name,$.inPlex)}</div>`}w+="</div>"}let E="";if(r.length){E='<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">';for(let $ of r)E+=`<button class="panel-similar-chip artist-link" data-artist="${l($.name)}">${l($.name)}</button>`;E+="</div>"}a.innerHTML=`
      <div class="panel-photo-wrap" style="view-transition-name: artist-${i}">${f}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${l(e)}</div>
          ${H("artist",e,"",o.image||"")}
        </div>
        ${b?`<div class="panel-meta">${l(b)}</div>`:""}
        ${O(o.tags,6)}
        ${w}
        ${E}
      </div>`})}function ye(){document.getElementById("panel-overlay").classList.remove("open"),document.body.style.overflow=""}var he={nu:()=>fe(),ontdek:()=>W(),bibliotheek:()=>je(),downloads:()=>et(),discover:()=>U(),gaps:()=>J(),recent:()=>rt(),recs:()=>ue(),releases:()=>G(),topartists:()=>Me(s.currentPeriod),toptracks:()=>Pe(s.currentPeriod),loved:()=>ut(),stats:()=>De(),wishlist:()=>se(),plexlib:()=>ne(),tidal:()=>Te()};document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelectorAll(".tab"),i=document.querySelector(".tab.active"),n=Array.from(a).indexOf(i),c=Array.from(a).indexOf(e)>n?"rtl":"ltr";document.documentElement.style.setProperty("--tab-direction",c==="ltr"?"-1":"1"),a.forEach(o=>o.classList.remove("active")),e.classList.add("active"),s.currentMainTab=t,["tb-period","tb-recs","tb-mood","tb-releases","tb-discover","tb-gaps","tb-plexlib","tb-tidarr-ui"].forEach(o=>document.getElementById(o)?.classList.remove("visible")),document.getElementById("tb-tidal")?.classList.toggle("visible",t==="downloads"),t!=="downloads"&&D(),t!=="downloads"&&void 0,t!=="nu"&&ge(),document.startViewTransition?document.startViewTransition(()=>{he[t]?.()}).finished.catch(()=>{}):he[t]?.()})});document.querySelectorAll("[data-period]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-period]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.currentPeriod=e.dataset.period,he[s.currentTab]?.()})});document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=e.dataset.filter,e.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),me()})});document.querySelectorAll("[data-dfilter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-dfilter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=e.dataset.dfilter,e.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss"),ae()})});document.querySelectorAll("[data-gsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-gsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.gapsSort=e.dataset.gsort,le()})});document.querySelectorAll("[data-rtype]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rtype]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesFilter=e.dataset.rtype,F()})});document.querySelectorAll("[data-rsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesSort=e.dataset.rsort,F()})});document.getElementById("btn-refresh-releases")?.addEventListener("click",async()=>{s.lastReleases=null,await fetch("/api/releases/refresh",{method:"POST"}),G()});document.getElementById("btn-refresh-discover")?.addEventListener("click",async()=>{s.lastDiscover=null,await fetch("/api/discover/refresh",{method:"POST"}),U()});document.getElementById("btn-refresh-gaps")?.addEventListener("click",async()=>{s.lastGaps=null,await fetch("/api/gaps/refresh",{method:"POST"}),J()});document.getElementById("plib-search")?.addEventListener("input",e=>{!s.plexLibData||s.currentTab!=="plexlib"||(I.innerHTML=be(s.plexLibData,e.target.value))});document.getElementById("btn-sync-plex")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex"),t=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{await fetch("/api/plex/refresh",{method:"POST"}),await N(),s.plexLibData=null,s.currentTab==="plexlib"&&await ne()}catch{}finally{e.disabled=!1,e.textContent=t}});document.getElementById("plex-refresh-btn")?.addEventListener("click",async()=>{let e=document.getElementById("plex-refresh-btn");e.classList.add("spinning"),e.disabled=!0;try{await fetch("/api/plex/refresh",{method:"POST"}),await N(),s.plexLibData=null}catch{}finally{e.classList.remove("spinning"),e.disabled=!1}});document.getElementById("tidal-search")?.addEventListener("input",e=>{clearTimeout(s.tidalSearchTimeout);let t=e.target.value.trim();s.tidalSearchTimeout=setTimeout(()=>{s.currentTab==="tidal"&&s.tidalView==="search"&&ke(t)},400)});document.getElementById("panel-close")?.addEventListener("click",ye);document.addEventListener("click",async e=>{let t=e.target.closest(".play-btn");if(t){e.stopPropagation(),dt(t,t.dataset.artist,t.dataset.track);return}let a=e.target.closest(".disc-toggle-btn");if(a){e.stopPropagation();let v=a.dataset.discId,h=document.getElementById(v);if(h){let k=h.classList.toggle("collapsed");h.querySelectorAll(".disc-toggle-btn").forEach(L=>{L.classList.toggle("expanded",!k),L.classList.toggle("collapsed",k);let T=parseInt(L.dataset.albumCount,10)||0,P=`${T} album${T!==1?"s":""}`;L.textContent=k?`Toon ${P}`:P})}return}let i=e.target.closest(".discover-card-toggle");if(i&&!e.target.closest(".artist-link")&&!e.target.closest(".bookmark-btn")&&!e.target.closest(".disc-toggle-btn")){let v=i.dataset.discId,h=document.getElementById(v);if(h){let k=h.classList.toggle("collapsed");h.querySelectorAll(".disc-toggle-btn").forEach(L=>{L.classList.toggle("expanded",!k),L.classList.toggle("collapsed",k);let T=parseInt(L.dataset.albumCount,10)||0,P=`${T} album${T!==1?"s":""}`;L.textContent=k?`Toon ${P}`:P})}return}let n=e.target.closest("[data-artist]");if(n?.dataset.artist&&!n.classList.contains("bookmark-btn")){n.classList.contains("search-result-item")&&(document.getElementById("search-results").classList.remove("open"),document.getElementById("search-input").value=""),He(n.dataset.artist);return}let d=e.target.closest(".bookmark-btn");if(d){e.stopPropagation();let{btype:v,bname:h,bartist:k,bimage:L}=d.dataset,T=await _e(v,h,k,L);d.classList.toggle("saved",T),d.title=T?"Verwijder uit lijst":"Sla op in lijst",document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(h)}"][data-btype="${v}"]`).forEach(P=>{P.classList.toggle("saved",T)});return}let c=e.target.closest(".wish-remove[data-wid]");if(c){await fetch(`/api/wishlist/${c.dataset.wid}`,{method:"DELETE"}),s.wishlistMap.forEach((v,h)=>{String(v)===c.dataset.wid&&s.wishlistMap.delete(h)}),te(),se();return}let o=e.target.closest(".panel-similar-chip[data-artist]");if(o){He(o.dataset.artist);return}let r=e.target.closest(".download-btn, .tidal-dl-btn");if(r){if(e.stopPropagation(),r.classList.contains("tidal-dl-btn")){let k=r.dataset.dlurl;if(!k)return;r.disabled=!0;let L=r.textContent;r.textContent="\u2026";try{let T=await fetch("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:k})}),P=await T.json();if(!T.ok||!P.ok)throw new Error(P.error||"download mislukt");r.textContent="\u2713 Toegevoegd",r.classList.add("downloaded"),re()}catch(T){alert("Downloaden mislukt: "+T.message),r.textContent=L,r.disabled=!1}return}let{dlartist:v,dlalbum:h}=r.dataset;await Ke(v,h,r);return}let u=e.target.closest(".q-remove[data-qid]");if(u){e.stopPropagation();try{await fetch("/api/tidarr/queue/"+encodeURIComponent(u.dataset.qid),{method:"DELETE"})}catch(v){alert("Verwijderen mislukt: "+v.message)}return}let f=e.target.closest(".q-remove[data-dlid]");if(f){e.stopPropagation();try{await fetch(`/api/downloads/${f.dataset.dlid}`,{method:"DELETE"}),f.closest(".q-row")?.remove()}catch(v){alert("Verwijderen mislukt: "+v.message)}return}let b=e.target.closest(".inline-toolbar [data-filter]");if(b){document.querySelectorAll("[data-filter]").forEach(v=>v.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=b.dataset.filter,b.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),me();return}let w=e.target.closest(".inline-toolbar [data-rtype]");if(w){document.querySelectorAll("[data-rtype]").forEach(h=>h.classList.remove("sel-def")),s.releasesFilter=w.dataset.rtype,w.classList.add("sel-def");let v=document.getElementById("sec-releases-content");v&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=v,F(),s.sectionContainerEl===v&&(s.sectionContainerEl=null)):F();return}let E=e.target.closest(".inline-toolbar [data-rsort]");if(E){document.querySelectorAll("[data-rsort]").forEach(h=>h.classList.remove("sel-def")),s.releasesSort=E.dataset.rsort,E.classList.add("sel-def");let v=document.getElementById("sec-releases-content");v&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=v,F(),s.sectionContainerEl===v&&(s.sectionContainerEl=null)):F();return}let $=e.target.closest(".inline-toolbar [data-dfilter]");if($){document.querySelectorAll("[data-dfilter]").forEach(h=>h.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=$.dataset.dfilter,$.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss");let v=document.getElementById("sec-discover-content");v&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=v,ae(),s.sectionContainerEl===v&&(s.sectionContainerEl=null)):ae();return}let x=e.target.closest(".inline-toolbar [data-gsort]");if(x){document.querySelectorAll("[data-gsort]").forEach(h=>h.classList.remove("sel-def")),s.gapsSort=x.dataset.gsort,x.classList.add("sel-def");let v=document.getElementById("bib-sub-content");v&&s.currentMainTab==="bibliotheek"?(s.sectionContainerEl=v,le(),s.sectionContainerEl===v&&(s.sectionContainerEl=null)):le();return}let A=e.target.closest(".sec-mood-block [data-mood]");if(A){let v=A.dataset.mood;if(s.activeMood===v){s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(k=>k.classList.remove("sel-mood","loading")),Q(),W();return}s.activeMood=v,document.querySelectorAll("[data-mood]").forEach(k=>k.classList.remove("sel-mood","loading")),A.classList.add("sel-mood");let h=A.closest(".inline-toolbar");if(h&&!document.getElementById("btn-clear-mood-inline")){let k=document.createElement("span");k.className="toolbar-sep";let L=document.createElement("button");L.className="tool-btn",L.id="btn-clear-mood-inline",L.textContent="\u2715 Wis mood",L.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(T=>T.classList.remove("sel-mood","loading")),Q(),W()}),h.appendChild(k),h.appendChild(L)}pe(v);return}let M=e.target.closest("[data-tidal-view]");if(M){let v=M.dataset.tidalView;v==="tidarr"?(document.getElementById("tb-tidal")?.classList.remove("visible"),document.getElementById("tb-tidarr-ui")?.classList.add("visible"),Ye()):(D(),document.getElementById("tb-tidal")?.classList.add("visible"),document.getElementById("tb-tidarr-ui")?.classList.remove("visible"),de(v));return}if(e.target===document.getElementById("panel-overlay")){ye();return}});document.addEventListener("keydown",e=>{if(e.key==="Escape"){ye(),document.getElementById("search-results").classList.remove("open");return}let t=["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);if(e.key==="/"&&!t){e.preventDefault(),document.getElementById("search-input").focus();return}if(e.key==="r"&&!t){s.currentMainTab==="ontdek"?W():s.currentMainTab==="bibliotheek"?je():he[s.currentTab]?.();return}if(!t&&/^[1-4]$/.test(e.key)){let a=document.querySelectorAll(".tab"),i=parseInt(e.key)-1;a[i]&&a[i].click();return}});document.querySelectorAll(".bnav-btn").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelector(`.tab[data-tab="${t}"]`);a&&(document.startViewTransition?document.startViewTransition(()=>{a.click()}).finished.catch(()=>{}):a.click()),document.querySelectorAll(".bnav-btn").forEach(i=>i.classList.toggle("active",i===e))})});document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab;document.querySelectorAll(".bnav-btn").forEach(a=>a.classList.toggle("active",a.dataset.tab===t))})});we&&document.documentElement.setAttribute("data-reduce-motion","true");function pt(e){document.documentElement.dataset.theme=e;let t=document.getElementById("theme-toggle");t&&(t.textContent=e==="dark"?"\u2600\uFE0F":"\u{1F319}")}(function(){let t=localStorage.getItem("theme");pt(t||"light")})();document.getElementById("theme-toggle")?.addEventListener("click",()=>{let t=document.documentElement.dataset.theme==="dark"?"light":"dark";pt(t),localStorage.setItem("theme",t)});(function(){let t=localStorage.getItem("downloadQuality")||"high",a=document.getElementById("download-quality");a&&s.VALID_QUALITIES.includes(t)&&(a.value=t)})();document.getElementById("download-quality")?.addEventListener("change",e=>{localStorage.setItem("downloadQuality",e.target.value)});N();Ae();Ve();xe();Ee();Ne();ce();st();fe();setInterval(Ae,3e4);})();
