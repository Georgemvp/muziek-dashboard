(()=>{var s={currentTab:"nu",currentMainTab:"nu",bibSubTab:"collectie",sectionContainerEl:null,currentPeriod:"7day",recsFilter:"all",discFilter:"all",gapsSort:"missing",releasesSort:"listening",releasesFilter:"all",plexOk:!1,lastDiscover:null,lastGaps:null,lastReleases:null,plexLibData:null,wishlistMap:new Map,newReleaseIds:new Set,searchTimeout:null,tidalSearchTimeout:null,tidarrOk:!1,tidalView:"search",tidalSearchResults:null,tidarrQueuePoll:null,tidarrSseSource:null,tidarrQueueItems:[],downloadedSet:new Set,spotifyEnabled:!1,activeMood:null,previewAudio:new Audio,previewBtn:null,collapsibleSections:{recs:!1,releases:!1,discover:!1},sectionMutex:Promise.resolve(),dlResolve:null,VALID_QUALITIES:["max","high","normal","low"]};var fe=window.matchMedia("(prefers-reduced-motion: reduce)").matches,I=document.getElementById("content"),F=(e,t="medium")=>{if(!e)return null;let a=e.find(i=>i.size===t);return a&&a["#text"]&&!a["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f")?a["#text"]:null},m=e=>String(e||"?").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2),B=e=>parseInt(e).toLocaleString("nl-NL"),o=e=>String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),W=e=>({"7day":"week","1month":"maand","3month":"3 maanden","12month":"jaar",overall:"alles"})[e]||e;function ae(e){let t=Math.floor(Date.now()/1e3)-e;return t<120?"zojuist":t<3600?`${Math.floor(t/60)}m`:t<86400?`${Math.floor(t/3600)}u`:`${Math.floor(t/86400)}d`}function g(e,t=!1){let a=0;for(let r=0;r<e.length;r++)a=a*31+e.charCodeAt(r)&16777215;let i=a%360,n=45+a%31,d=50+(a>>8)%26,c=20+(a>>16)%16,l=15+(a>>10)%11;return t?`radial-gradient(circle, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`:`linear-gradient(135deg, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`}function z(e){return!e||e.length!==2?"":[...e.toUpperCase()].map(t=>String.fromCodePoint(t.charCodeAt(0)+127397)).join("")}function j(e,t=4){return e?.length?`<div class="tags" style="margin-top:5px">${e.slice(0,t).map(a=>`<span class="tag">${o(a)}</span>`).join("")}</div>`:""}function be(e){return s.plexOk?e?'<span class="badge plex">\u25B6 In Plex</span>':'<span class="badge new">\u2726 Nieuw</span>':""}function O(e,t,a="",i=""){let n=s.wishlistMap.has(`${e}:${t}`);return`<button class="bookmark-btn${n?" saved":""}"
    data-btype="${o(e)}" data-bname="${o(t)}"
    data-bartist="${o(a)}" data-bimage="${o(i)}"
    title="${n?"Verwijder uit lijst":"Sla op in lijst"}">\u{1F516}</button>`}function ie(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function Pe(e,t){let a=i=>(i||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");return`${a(e)}|${a(t)}`}var Me=(e,t)=>s.downloadedSet.has(Pe(e,t)),De=(e,t)=>s.downloadedSet.add(Pe(e,t));function N(e,t="",a=!1){return!s.tidarrOk||a?"":Me(e,t)?`<button class="download-btn dl-done"
      data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
      title="Al gedownload">\u2713</button>`:`<button class="download-btn"
    data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
    title="Download via Tidarr">\u2B07</button>`}var Y=e=>{let t=F(e);return t?`<img class="card-img" src="${t}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>'};function J(e,t=!0,a=""){let i=e.inPlex,n=g(e.title||""),d=e.year||"\u2014",c=Me(a,e.title||""),l=s.tidarrOk&&a&&!i?c?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${o(a)}" data-dlalbum="${o(e.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${o(a)}" data-dlalbum="${o(e.title||"")}" title="Download via Tidarr">\u2B07</button>`:"";return`
    <div class="album-card ${i?"owned":"missing"}" title="${o(e.title)}${d!=="\u2014"?" ("+d+")":""}">
      <div class="album-cover" style="background:${n}">
        <div class="album-cover-ph">${m(e.title||"?")}</div>
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
    </div>`}function Ae(){if(fe)return;Object.entries({".rec-grid > *":60,".card-list > *":25,".artist-grid > *":40,".releases-grid > *":40,".wishlist-grid > *":40}).forEach(([t,a])=>{document.querySelectorAll(t).forEach((i,n)=>{i.style.animationDelay=`${n*a}ms`})})}function st(e){let t="";e==="cards"?t='<div class="skeleton-list">'+Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")+"</div>":e==="grid"?t='<div class="skeleton-grid">'+Array(8).fill('<div class="skeleton skeleton-square"></div>').join("")+"</div>":e==="stats"?t='<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>':t=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`,b(t)}function b(e,t){let a=s.sectionContainerEl||I;!s.sectionContainerEl&&document.startViewTransition?document.startViewTransition(()=>{a.innerHTML=e,Ae(),t&&requestAnimationFrame(t)}).finished.catch(()=>{}):(a.innerHTML=e,s.sectionContainerEl?t&&t():(I.style.opacity="0",I.style.transform="translateY(6px)",requestAnimationFrame(()=>{I.offsetHeight,I.style.opacity="1",I.style.transform="",Ae(),t&&requestAnimationFrame(t)})))}var S=e=>b(`<div class="error-box">\u26A0\uFE0F ${o(e)}</div>`);function T(e){if(s.sectionContainerEl){s.sectionContainerEl.innerHTML=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`;return}let a={recent:"cards",loved:"cards",toptracks:"cards",topartists:"grid",releases:"grid",recs:"grid",discover:"grid",gaps:"grid",stats:"stats",wishlist:"grid",plexlib:"cards",nu:"cards",ontdek:"grid",bibliotheek:"cards",downloads:"cards"}[s.currentTab];a&&!e?st(a):b(`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`)}function Z(e,t){if(!e)return;if(!("IntersectionObserver"in window)){t();return}let a=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(a.unobserve(n.target),t())})},{rootMargin:"300px"});a.observe(e)}function M(e,t){let a=s.sectionMutex.then(async()=>{s.sectionContainerEl=e;try{await t()}finally{s.sectionContainerEl=null}});return s.sectionMutex=a.catch(()=>{}),a}async function f(e){let t=await fetch(e);if(!t.ok)throw new Error(`Serverfout ${t.status}`);return t.json()}async function Re(){try{let e=await f("/api/downloads/keys");s.downloadedSet=new Set(e)}catch{s.downloadedSet=new Set}}async function H(){try{let e=await fetch("/api/plex/status").then(i=>i.json()),t=document.getElementById("plex-pill"),a=document.getElementById("plex-pill-text");if(e.connected){s.plexOk=!0,t.className="plex-pill on";let i=e.albums?` \xB7 ${B(e.albums)} albums`:"";a.textContent=`Plex \xB7 ${B(e.artists)} artiesten${i}`}else t.className="plex-pill off",a.textContent="Plex offline"}catch{document.getElementById("plex-pill-text").textContent="Plex offline"}}async function je(){try{let t=(await f("/api/user")).user,a=F(t.image,"large"),i=a?`<img class="user-avatar" src="${a}" alt="">`:`<div class="user-avatar-ph">${(t.name||"U")[0].toUpperCase()}</div>`,n=new Date(parseInt(t.registered?.unixtime)*1e3).getFullYear();document.getElementById("user-wrap").innerHTML=`
      <div class="user-card">${i}
        <div><div class="user-name">${o(t.realname||t.name)}</div>
        <div class="user-sub">${B(t.playcount)} scrobbles \xB7 lid sinds ${n}</div></div>
      </div>`}catch{}}async function ye(){try{let e=await f("/api/wishlist");s.wishlistMap.clear();for(let t of e)s.wishlistMap.set(`${t.type}:${t.name}`,t.id);X()}catch{}}function X(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=s.wishlistMap.size||"0")}async function He(e,t,a,i){let n=`${e}:${t}`;if(s.wishlistMap.has(n))return await fetch(`/api/wishlist/${s.wishlistMap.get(n)}`,{method:"DELETE"}),s.wishlistMap.delete(n),X(),!1;{let c=await(await fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:t,artist:a,image:i})})).json();return s.wishlistMap.set(n,c.id),X(),!0}}async function K(){T(),await ye();try{let e=await f("/api/wishlist");if(!e.length){b('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let t=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let a of e){let i=a.image?`<img src="${o(a.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";t+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${g(a.name)}">
            ${i}
            <div class="wish-ph">${m(a.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${o(a.name)}">${o(a.name)}</div>
              ${a.artist?`<div class="wish-sub">${o(a.artist)}</div>`:""}
              <div class="wish-type">${a.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${a.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}b(t+"</div>")}catch(e){S(e.message)}}function at(){return localStorage.getItem("downloadQuality")||"high"}async function he(){try{let e=await f("/api/tidarr/status"),t=document.getElementById("tidarr-status-pill"),a=document.getElementById("tidarr-status-text");s.tidarrOk=!!e.connected,t&&a&&(t.className=`tidarr-status-pill ${s.tidarrOk?"on":"off"}`,a.textContent=s.tidarrOk?`Tidarr \xB7 verbonden${e.quality?" \xB7 "+e.quality:""}`:"Tidarr offline")}catch{s.tidarrOk=!1;let e=document.getElementById("tidarr-status-text");e&&(e.textContent="Tidarr offline")}}async function ne(){try{let t=((await f("/api/tidarr/queue")).items||[]).length,a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let i of a)i&&(t>0?(i.textContent=t,i.style.display=""):i.style.display="none")}catch{}}function Fe(e){let t=e.image?`<img class="tidal-img" src="${o(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${g(e.title)}">${m(e.title)}</div>`:`<div class="tidal-ph" style="background:${g(e.title)}">${m(e.title)}</div>`,a=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${t}</div>
      <div class="tidal-info">
        <div class="tidal-title">${o(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${o(e.artist)}">${o(e.artist)}</div>
        <div class="tidal-meta">${o(a)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${o(e.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}async function we(e){let t=document.getElementById("tidal-content");if(!t)return;let a=(e||"").trim();if(a.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let i=await f(`/api/tidarr/search?q=${encodeURIComponent(a)}`);if(s.tidalSearchResults=i.results||[],i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.error)}</div>`;return}if(!s.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${o(a)}</strong>".</div>`;return}let n=s.tidalSearchResults.filter(l=>l.type==="album"),d=s.tidalSearchResults.filter(l=>l.type==="track"),c="";n.length&&(c+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(Fe).join("")}</div>`),d.length&&(c+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(Fe).join("")}</div>`),t.innerHTML=c}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.message)}</div>`}}function Ne(){let e=document.getElementById("tidal-content");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${l}%"></div></div><div class="q-pct">${l}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${o(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${o(n.artist)}</div>`:""}
          <span class="q-status ${d}">${o(c)}</span>
        </div>
        ${r}
        <button class="q-remove" data-qid="${o(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function Ve(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let t=await f("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let a={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
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
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){await fetch("/api/downloads",{method:"DELETE"}).catch(()=>{});for(let i of t)await fetch(`/api/downloads/${i.id}`,{method:"DELETE"}).catch(()=>{});s.downloadedSet.clear(),Ve()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`}}}function le(e){s.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(t=>t.classList.toggle("sel-def",t.dataset.tidalView===e)),e==="search"?we(document.getElementById("tidal-search")?.value||""):e==="queue"?Ne():e==="history"&&Ve()}function oe(){if(s.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");s.tidarrSseSource=e,e.onmessage=t=>{try{s.tidarrQueueItems=JSON.parse(t.data)||[]}catch{s.tidarrQueueItems=[]}let a=s.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(a.length>0?(n.textContent=a.length,n.style.display=""):n.style.display="none");nt(s.tidarrQueueItems),s.currentTab==="tidal"&&s.tidalView==="queue"&&Ne(),document.getElementById("queue-popover")?.classList.contains("open")&&Ge()},e.onerror=()=>{e.close(),s.tidarrSseSource=null,setTimeout(oe,1e4)}}function it(){oe()}function Ue(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),a=document.getElementById("content");t.style.display="flex",a.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function A(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function nt(e){let t=document.getElementById("queue-fab"),a=document.getElementById("fab-queue-badge");if(!t)return;let i=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",i.length>0?(a.textContent=i.length,a.style.display=""):a.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function Ge(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${l}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${o(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${o(n.artist)}</div>`:""}
      <span class="q-status ${d}">${o(c)}</span>
      ${r}
    </div>`}).join("")}function lt(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&Ge()}function $e(){document.getElementById("queue-popover")?.classList.remove("open")}function ze(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function Qe(e,t){let a=ze(e),i=ze(t);return!a||!i?!0:a===i||a.includes(i)||i.includes(a)}function ot(e,t,a,i){return new Promise(n=>{s.dlResolve=n;let d=document.getElementById("dl-confirm-modal"),c=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${a}"${t?" \u2013 "+t:""}`,c.innerHTML=e.map((l,r)=>{let u=!Qe(l.artist,t),v=l.image?`<img class="dlc-img" src="${o(l.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${m(l.title)}</div>`:`<div class="dlc-ph">${m(l.title)}</div>`,y=u?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${o(l.artist)}</div>`:`<div class="dlc-artist">${o(l.artist)}</div>`,w=l.score??0;return`
        <button class="dlc-card${r===0?" dlc-best":""}" data-dlc-idx="${r}">
          <div class="dlc-cover">${v}</div>
          <div class="dlc-info">
            <div class="dlc-title">${o(l.title)}</div>
            ${y}
            <div class="dlc-meta">${l.year?o(l.year):""}${l.year&&l.tracks?" \xB7 ":""}${l.tracks?l.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${w}%"></div></div>
            <div class="dlc-score-label">${w}% overeenkomst</div>
          </div>
          ${r===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),c.querySelectorAll(".dlc-card").forEach(l=>{l.addEventListener("click",()=>{let r=parseInt(l.dataset.dlcIdx);xe(),n({chosen:e[r],btn:i})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function xe(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",s.dlResolve&&(s.dlResolve({chosen:null}),s.dlResolve=null)}async function Oe(e,t,a,i){let n=await fetch("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||a||"",artist:e.artist||t||"",id:String(e.id||""),quality:at()})}),d=await n.json();if(!n.ok||!d.ok)throw new Error(d.error||"download mislukt");De(e.artist||t||"",e.title||a||""),i&&(i.textContent="\u2713",i.classList.add("dl-done"),i.disabled=!1),await ne()}async function _e(e,t,a){if(!s.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}a&&(a.disabled=!0,a.textContent="\u2026");try{let i=new URLSearchParams;e&&i.set("artist",e),t&&i.set("album",t);let n=await fetch(`/api/tidarr/candidates?${i}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let{candidates:d}=await n.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let c=d[0];if(e&&!Qe(c.artist,e)){a&&(a.disabled=!1,a.textContent="\u2B07");let{chosen:l}=await ot(d,e,t,a);if(!l)return;a&&(a.disabled=!0,a.textContent="\u2026"),await Oe(l,e,t,a)}else await Oe(c,e,t,a)}catch(i){alert("Downloaden mislukt: "+i.message),a&&(a.disabled=!1,a.textContent="\u2B07")}}async function Ee(){b('<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>'),await he(),await ne(),le(s.tidalView),it()}function We(){s.currentTab="tidal",A(),document.getElementById("tb-tidal")?.classList.add("visible"),Ee()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{xe()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&xe()});document.getElementById("queue-fab")?.addEventListener("click",lt);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),$e()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{$e(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>le("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),a=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!a?.contains(e.target)&&$e()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});async function Je(){try{let e=await f("/api/spotify/status");s.spotifyEnabled=!!e.enabled;let t=document.getElementById("tb-mood");s.spotifyEnabled&&s.currentTab==="recs"?(t.style.display="",t.classList.add("visible")):s.spotifyEnabled&&(t.style.display="")}catch{s.spotifyEnabled=!1}}function rt(e,t){let a=e.image?`<img src="${o(e.image)}" alt="" loading="lazy"
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
    </div>`}async function de(e){let t=document.getElementById("spotify-recs-section");if(!t)return;let a={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};t.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let i=await f(`/api/spotify/recs?mood=${encodeURIComponent(e)}`);if(!i.length){t.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let n=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${o(a[e]||e)}</div>
      <div class="spotify-grid">`;i.forEach((d,c)=>{n+=rt(d,c)}),n+="</div>",t.innerHTML=n}catch{t.innerHTML=""}}function G(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(e=>{e.addEventListener("click",async()=>{let t=e.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(a=>a.classList.remove("sel-mood","loading")),s.activeMood===t){s.activeMood=null,G(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}s.activeMood=t,e.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await de(t),e.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",G()});document.addEventListener("click",e=>{let t=e.target.closest(".spotify-play-btn");if(!t)return;e.stopPropagation();let a=t.dataset.spotifyPreview;if(a){if(s.previewBtn===t){s.previewAudio.paused?(s.previewAudio.play(),t.textContent="\u23F8",t.classList.add("playing")):(s.previewAudio.pause(),t.textContent="\u25B6",t.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=t,s.previewAudio.src=a,s.previewAudio.currentTime=0,s.previewAudio.play().then(()=>{t.textContent="\u23F8",t.classList.add("playing")}).catch(()=>{t.textContent="\u25B6",s.previewBtn=null})}},!0);async function re(){T();try{let e=await f("/api/recs"),t=e.recommendations||[],a=e.albumRecs||[],i=e.trackRecs||[];if(s.plexOk=e.plexConnected||s.plexOk,e.plexConnected&&e.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${B(e.plexArtistCount)} artiesten`),!t.length){b('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let n=t.filter(u=>!u.inPlex).length,d=t.filter(u=>u.inPlex).length,c=document.getElementById("hdr-title-recs");c&&(c.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${t.length} artiesten`);let l='<div class="spotify-section" id="spotify-recs-section"></div>';l+=`<div class="section-title">Gebaseerd op jouw smaak: ${(e.basedOn||[]).slice(0,3).join(", ")}
      ${s.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} nieuw</span> \xB7 <span style="color:var(--plex)">${d} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let u=0;u<t.length;u++){let v=t[u],y=Math.round(v.match*100);l+=`
        <div class="rec-card" data-inplex="${v.inPlex}" id="rc-${u}">
          <div class="rec-photo" id="rph-${u}">
            <div class="rec-photo-ph" style="background:${g(v.name)}">${m(v.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${o(v.name)}">${o(v.name)}</span>
                ${be(v.inPlex)}
              </div>
              <span class="rec-match">${y}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${o(v.reason)}</div>
            <div id="rtags-${u}"></div>
            <div id="ralb-${u}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`}if(l+="</div>",a.length){l+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let u of a){let v=u.image?`<img class="albrec-img" src="${o(u.image)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${g(u.album)}">${m(u.album)}</div>`:`<div class="albrec-ph" style="background:${g(u.album)}">${m(u.album)}</div>`,y=s.plexOk?u.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";l+=`
          <div class="albrec-card">
            <div class="albrec-cover">${v}</div>
            <div class="albrec-info">
              <div class="albrec-title">${o(u.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${o(u.artist)}">${o(u.artist)}</div>
              <div class="albrec-reason">via ${o(u.reason)}</div>
              ${y}${N(u.artist,u.album,u.inPlex)}
            </div>
          </div>`}l+="</div>"}if(i.length){l+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let u of i){let v=u.playcount>0?`<span class="trackrec-plays">${B(u.playcount)}\xD7</span>`:"",y=u.url?`<a class="trackrec-link" href="${o(u.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";l+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${o(u.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${o(u.artist)}">${o(u.artist)}</div>
              <div class="trackrec-reason">via ${o(u.reason)}</div>
            </div>
            <div class="trackrec-meta">${v}${y}</div>
          </div>`}l+="</div>"}b(l,()=>{s.activeMood&&de(s.activeMood)}),ce();let r=document.getElementById("sec-recs-preview");if(r){let u=t.slice(0,8);r.innerHTML=`<div class="collapsed-thumbs">${u.map((v,y)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${y}" style="background:${g(v.name)}">
          <span class="collapsed-thumb-ph">${m(v.name)}</span>
        </div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`,u.forEach(async(v,y)=>{try{let w=await f(`/api/artist/${encodeURIComponent(v.name)}/info`),$=document.getElementById(`recs-thumb-${y}`);$&&w.image&&($.innerHTML=`<img src="${o(w.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}t.forEach(async(u,v)=>{try{let y=await f(`/api/artist/${encodeURIComponent(u.name)}/info`),w=document.getElementById(`rph-${v}`);w&&y.image&&(w.innerHTML=`<img src="${y.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${g(u.name)}\\'>${m(u.name)}</div>'">`);let $=document.getElementById(`rtags-${v}`);$&&($.innerHTML=j(y.tags,3)+'<div style="height:6px"></div>');let x=document.getElementById(`ralb-${v}`);if(x){let C=(y.albums||[]).slice(0,4);if(C.length){let R='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let P of C){let p=P.image?`<img class="rec-album-img" src="${P.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',h=s.plexOk&&P.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";R+=`<div class="rec-album-row">${p}<span class="rec-album-name">${o(P.name)}</span>${h}${N(u.name,P.name,P.inPlex)}</div>`}x.innerHTML=R+"</div>"}else x.innerHTML=""}}catch{let y=document.getElementById(`ralb-${v}`);y&&(y.innerHTML="")}})}catch(e){S(e.message)}}function ce(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let t=e.dataset.inplex==="true",a=!0;s.recsFilter==="new"&&(a=!t),s.recsFilter==="plex"&&(a=t),e.classList.toggle("hidden",!a)})}function Ze(e){let t=document.getElementById("badge-releases");t&&(e>0?(t.textContent=e,t.style.display=""):t.style.display="none")}function dt(e){if(!e)return"";let t=new Date(e),i=Math.floor((new Date-t)/864e5);return i===0?"vandaag":i===1?"gisteren":i<7?`${i} dagen geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function V(){T();try{let e=await f("/api/releases");if(e.status==="building"){b(`<div class="loading"><div class="spinner"></div>
        <div>${o(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{(s.currentTab==="releases"||s.currentTab==="ontdek")&&V()},5e3);return}s.lastReleases=e.releases||[],s.newReleaseIds=new Set(e.newReleaseIds||[]),Ze(e.newCount||0),D()}catch(e){S(e.message)}}function D(){let e=s.lastReleases||[];if(!e.length){b('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let t=e;if(s.releasesFilter!=="all"&&(t=e.filter(l=>(l.type||"album").toLowerCase()===s.releasesFilter)),!t.length){b(`<div class="empty">Geen ${s.releasesFilter==="ep"?"EP's":s.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}s.releasesSort==="listening"?t=[...t].sort((l,r)=>(r.artistPlaycount||0)-(l.artistPlaycount||0)||new Date(r.releaseDate)-new Date(l.releaseDate)):t=[...t].sort((l,r)=>new Date(r.releaseDate)-new Date(l.releaseDate));let a=document.getElementById("hdr-title-releases");a&&(a.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${t.length} release${t.length!==1?"s":""}`);let i=l=>({album:"Album",single:"Single",ep:"EP"})[l?.toLowerCase()]||l||"Album",n=l=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[l?.toLowerCase()]||"rel-type-album",d=`<div class="section-title">${t.length} release${t.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let l of t){let r=s.newReleaseIds.has(`${l.artist}::${l.album}`),u=l.image?`<img class="rel-img" src="${o(l.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${g(l.album)}">${m(l.album)}</div>`:`<div class="rel-ph" style="background:${g(l.album)}">${m(l.album)}</div>`,v=l.releaseDate?new Date(l.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",y=dt(l.releaseDate),w=v?`<div class="rel-date">${v} <span class="rel-date-rel">(${y})</span></div>`:"",$=s.plexOk?l.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':l.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",x=l.deezerUrl?`<a class="rel-deezer-link" href="${o(l.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";d+=`
      <div class="rel-card${r?" rel-card-new":""}">
        <div class="rel-cover">${u}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${n(l.type)}">${i(l.type)}</span>
          <div class="rel-album">${o(l.album)}</div>
          <div class="rel-artist artist-link" data-artist="${o(l.artist)}">${o(l.artist)}</div>
          ${w}
          <div class="rel-footer">${$}${x}${N(l.artist,l.album,l.inPlex)}</div>
        </div>
      </div>`}b(d+"</div>");let c=document.getElementById("sec-releases-preview");if(c){let l=t.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${g(r.album)}">${m(r.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${g(r.album)}"><span class="collapsed-thumb-ph">${m(r.album)}</span></div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`}}async function U(){T("Ontdekkingen ophalen...");try{let e=await f("/api/discover");if(e.status==="building"){b(`<div class="loading"><div class="spinner"></div>
        <div>${o(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{(s.currentTab==="discover"||s.currentTab==="ontdek")&&U()},2e4);return}s.lastDiscover=e,e.plexConnected&&(s.plexOk=!0),ee()}catch(e){S(e.message)}}function ee(){if(!s.lastDiscover)return;let{artists:e,basedOn:t}=s.lastDiscover;if(!e?.length){b('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let a=e;if(s.discFilter==="new"&&(a=e.filter(l=>!l.inPlex)),s.discFilter==="partial"&&(a=e.filter(l=>l.inPlex&&l.missingCount>0)),!a.length){b('<div class="empty">Geen artiesten voor dit filter.</div>');return}let i=document.getElementById("hdr-title-discover");i&&(i.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`);let n=a.reduce((l,r)=>l+r.missingCount,0),d=`<div class="section-title">Gebaseerd op: ${(t||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let l=0;l<a.length;l++){let r=a[l],u=Math.round(r.match*100),v=[z(r.country),r.country,r.startYear?`Actief vanaf ${r.startYear}`:null,r.totalAlbums?`${r.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),y=r.image?`<img class="discover-photo" src="${o(r.image)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${g(r.name,!0)}">${m(r.name)}</div>`:`<div class="discover-photo-ph" style="background:${g(r.name,!0)}">${m(r.name)}</div>`,w=r.albums?.length||0,$=`${w} album${w!==1?"s":""}`;if(d+=`
      <div class="discover-section collapsed" id="disc-${l}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${l}">
          <div class="discover-card-top">
            ${y}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${o(r.name)}">${o(r.name)}</span>
                ${be(r.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${o(r.reason)}</strong></div>
            </div>
            <span class="discover-match">${u}%</span>
            ${O("artist",r.name,"",r.image||"")}
          </div>
          ${v?`<div class="discover-meta">${o(v)}</div>`:""}
          ${j(r.tags,3)}
          ${r.missingCount>0?`<div class="discover-missing">\u2726 ${r.missingCount} ${r.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${l}" data-album-count="${w}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${$}</button>
          ${r.albums?.length?`<div class="discover-preview-row">${r.albums.slice(0,5).map(x=>{let C=g(x.title||"");return x.coverUrl?`<img class="discover-preview-thumb" src="${o(x.coverUrl)}" alt="${o(x.title)}" loading="lazy"
                   title="${o(x.title)}${x.year?" ("+x.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${C}">${m(x.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${C}">${m(x.title||"?")}</div>`}).join("")}${r.albums.length>5?`<div class="discover-preview-more">+${r.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,r.albums?.length){d+='<div class="album-grid">';for(let x of r.albums)d+=J(x,!0,r.name);d+="</div>"}else d+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';d+="</div></div>"}d+="</div>",b(d);let c=document.getElementById("sec-discover-preview");if(c){let l=a.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${g(r.name)}">${m(r.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${g(r.name)}"><span class="collapsed-thumb-ph">${m(r.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`}}function ct(){try{let e=localStorage.getItem("ontdek-sections");e&&Object.assign(s.collapsibleSections,JSON.parse(e))}catch{}}function ut(){try{localStorage.setItem("ontdek-sections",JSON.stringify(s.collapsibleSections))}catch{}}function Ye(e,t){e.classList.remove("expanded","collapsed"),e.classList.add(t?"collapsed":"expanded")}function ke(e,t){let a=document.querySelector(`[data-section="${e}"]`);if(!a)return;let i=a.querySelector(".section-toggle-btn");i&&(Ye(i,s.collapsibleSections[t]),i.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),s.collapsibleSections[t]=!s.collapsibleSections[t],ut(),Ye(i,s.collapsibleSections[t]),a.classList.toggle("collapsed")}),s.collapsibleSections[t]&&a.classList.add("collapsed"))}async function Q(){ct(),s.currentTab="ontdek",A();let e=s.spotifyEnabled?`
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
    </div>`,I.style.opacity="1",I.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{await M(document.getElementById("sec-recs-content"),re)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{s.lastReleases=null,await fetch("/api/releases/refresh",{method:"POST"}),await M(document.getElementById("sec-releases-content"),V)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{s.lastDiscover=null,await fetch("/api/discover/refresh",{method:"POST"}),await M(document.getElementById("sec-discover-content"),U)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(t=>t.classList.remove("sel-mood","loading")),G(),Q()});{let t=document.getElementById("sec-recs-content");s.sectionContainerEl=t,await re(),s.sectionContainerEl===t&&(s.sectionContainerEl=null)}(async()=>{try{if(!s.lastReleases){let a=await f("/api/releases");if(a.status==="building")return;s.lastReleases=a.releases||[],s.newReleaseIds=new Set(a.newReleaseIds||[]),Ze(a.newCount||0)}let t=document.getElementById("sec-releases-preview");if(t&&s.lastReleases.length){let a=s.lastReleases;s.releasesFilter!=="all"&&(a=s.lastReleases.filter(d=>(d.type||"album").toLowerCase()===s.releasesFilter)),s.releasesSort==="listening"?a=[...a].sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)||new Date(c.releaseDate)-new Date(d.releaseDate)):a=[...a].sort((d,c)=>new Date(c.releaseDate)-new Date(d.releaseDate));let i=a.slice(0,8);t.innerHTML=`<div class="collapsed-thumbs">${i.map(d=>d.image?`<div class="collapsed-thumb">
              <img src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${g(d.album)}">${m(d.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${g(d.album)}"><span class="collapsed-thumb-ph">${m(d.album)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let n=document.getElementById("hdr-title-releases");n&&(n.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${a.length} release${a.length!==1?"s":""}`)}}catch{}})(),Z(document.getElementById("sec-releases-content"),()=>{let t=document.getElementById("sec-releases-content");return M(t,V)}),(async()=>{try{if(!s.lastDiscover){let n=await f("/api/discover");if(n.status==="building")return;s.lastDiscover=n,n.plexConnected&&(s.plexOk=!0)}let{artists:t}=s.lastDiscover;if(!t?.length)return;let a=t;s.discFilter==="new"&&(a=t.filter(n=>!n.inPlex)),s.discFilter==="partial"&&(a=t.filter(n=>n.inPlex&&n.missingCount>0));let i=document.getElementById("sec-discover-preview");if(i&&a.length){let n=a.slice(0,8);i.innerHTML=`<div class="collapsed-thumbs">${n.map(c=>c.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${o(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${g(c.name)}">${m(c.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${g(c.name)}"><span class="collapsed-thumb-ph">${m(c.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-discover");d&&(d.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`)}}catch{}})(),Z(document.getElementById("sec-discover-content"),()=>{let t=document.getElementById("sec-discover-content");return M(t,U)}),ke("recs","recs"),ke("releases","releases"),ke("discover","discover")}async function ue(){let e=document.getElementById("plex-np-wrap");try{let t=await fetch("/api/plex/nowplaying").then(a=>a.json());e.innerHTML=t.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${o(t.track)}</div>
           <div class="card-sub">${o(t.artist)}${t.album?" \xB7 "+o(t.album):""}</div></div></div>`:""}catch{e.innerHTML=""}}async function Ie(){T(),ue();try{let t=(await f("/api/recent")).recenttracks?.track||[];if(!t.length){b('<div class="empty">Geen recente nummers.</div>');return}let a='<div class="card-list">';for(let i of t){let n=i["@attr"]?.nowplaying,d=i.date?.uts?ae(parseInt(i.date.uts)):"",c=i.artist?.["#text"]||"",l=Y(i.image);n?a+=`<div class="now-playing">${l}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${o(i.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(c)}">${o(c)}</div></div></div>`:a+=`<div class="card">${l}<div class="card-info">
          <div class="card-title">${o(i.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(c)}">${o(c)}</div>
          </div><div class="card-meta">${d}</div>
          <button class="play-btn" data-artist="${o(c)}" data-track="${o(i.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}b(a+"</div>")}catch(e){S(e.message)}}function pe(){s.currentTab="recent",A(),Ie()}async function Xe(e,t,a){if(s.previewBtn===e){s.previewAudio.paused?(await s.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(s.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=e,e.textContent="\u2026",e.disabled=!0;try{let i=new URLSearchParams({artist:t,track:a}),n=await f(`/api/preview?${i}`);if(!n.preview){e.textContent="\u2014",e.disabled=!1,setTimeout(()=>{e.textContent==="\u2014"&&(e.textContent="\u25B6")},1800),s.previewBtn=null;return}s.previewAudio.src=n.preview,s.previewAudio.currentTime=0,await s.previewAudio.play(),e.textContent="\u23F8",e.disabled=!1,e.classList.add("playing")}catch{e.textContent="\u25B6",e.disabled=!1,s.previewBtn=null}}s.previewAudio.addEventListener("timeupdate",()=>{if(!s.previewBtn||!s.previewAudio.duration)return;let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width=`${(s.previewAudio.currentTime/s.previewAudio.duration*100).toFixed(1)}%`)});s.previewAudio.addEventListener("ended",()=>{if(s.previewBtn){s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width="0%"),s.previewBtn=null}});document.addEventListener("visibilitychange",()=>{document.hidden&&!s.previewAudio.paused&&(s.previewAudio.pause(),s.previewBtn&&(s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing")))});async function pt(e){let t=document.getElementById("search-results");if(e.length<2){t.classList.remove("open");return}try{let a=await f(`/api/search?q=${encodeURIComponent(e)}`);a.results?.length?t.innerHTML=a.results.map(i=>{let n=i.image?`<img class="search-result-img" src="${o(i.image)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${g(i.name)};display:none">${m(i.name)}</div>`:`<div class="search-result-ph" style="background:${g(i.name)}">${m(i.name)}</div>`,d=i.listeners?`${B(i.listeners)} luisteraars`:"";return`<button class="search-result-item" data-artist="${o(i.name)}">
          ${n}
          <div><div class="search-result-name">${o(i.name)}</div>
          ${d?`<div class="search-result-sub">${d}</div>`:""}</div>
        </button>`}).join(""):t.innerHTML='<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>',t.classList.add("open")}catch{}}document.getElementById("search-input").addEventListener("input",e=>{clearTimeout(s.searchTimeout);let t=e.target.value.trim();if(!t){document.getElementById("search-results").classList.remove("open");return}s.searchTimeout=setTimeout(()=>pt(t),320)});document.addEventListener("click",e=>{e.target.closest("#search-wrap")||document.getElementById("search-results").classList.remove("open")});function me(e,t){let a=(t||"").toLowerCase().trim(),i=e;if(a&&(i=e.filter(c=>c.artist.toLowerCase().includes(a)||c.album.toLowerCase().includes(a))),!i.length)return`<div class="empty">Geen resultaten voor "<strong>${o(t)}</strong>".</div>`;let n=new Map;for(let c of i)n.has(c.artist)||n.set(c.artist,[]),n.get(c.artist).push(c.album);let d=`<div class="section-title">${n.size} artiesten \xB7 ${B(i.length)} albums</div>
    <div class="plib-list">`;for(let[c,l]of n)d+=`
      <div class="plib-artist-block">
        <div class="plib-artist-header artist-link" data-artist="${o(c)}">
          <div class="plib-avatar" style="background:${g(c)}">${m(c)}</div>
          <span class="plib-artist-name">${o(c)}</span>
          <span class="plib-album-count">${l.length}</span>
        </div>
        <div class="plib-albums">
          ${l.map(r=>`<div class="plib-album-row">
            <span class="plib-album-badge">\u25B6</span>
            <span class="plib-album-title" title="${o(r)}">${o(r)}</span>
          </div>`).join("")}
        </div>
      </div>`;return d+"</div>"}async function te(){T();try{let e=await f("/api/plex/library");s.plexLibData=e.library||[];let t=document.getElementById("plib-search");if(t&&(t.value=""),!s.plexLibData.length){b('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik \u21BB Sync Plex om te beginnen.</div>');return}b(me(s.plexLibData,""))}catch(e){S(e.message)}}async function Se(e){T();try{let a=(await f(`/api/topartists?period=${e}`)).topartists?.artist||[];if(!a.length){b('<div class="empty">Geen data.</div>');return}let i=parseInt(a[0]?.playcount||1),n=`<div class="section-title">Top artiesten \xB7 ${W(e)}</div><div class="artist-grid">`;for(let d=0;d<a.length;d++){let c=a[d],l=Math.round(parseInt(c.playcount)/i*100),r=F(c.image,"large")||F(c.image),u=r?`<img src="${r}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${g(c.name,!0)}">${m(c.name)}</div>`:`<div class="ag-photo-ph" style="background:${g(c.name,!0)}">${m(c.name)}</div>`;n+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${d}" style="view-transition-name: artist-${ie(c.name)}">${u}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${o(c.name)}">${o(c.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${l}%"></div></div>
          <div class="ag-plays">${B(c.playcount)} plays</div>
        </div></div>`}b(n+"</div>"),a.forEach(async(d,c)=>{try{let l=await f(`/api/artist/${encodeURIComponent(d.name)}/info`);if(l.image){let r=document.getElementById(`agp-${c}`);r&&(r.innerHTML=`<img src="${l.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}})}catch(t){S(t.message)}}async function Te(e){T();try{let a=(await f(`/api/toptracks?period=${e}`)).toptracks?.track||[];if(!a.length){b('<div class="empty">Geen data.</div>');return}let i=parseInt(a[0]?.playcount||1),n=`<div class="section-title">Top nummers \xB7 ${W(e)}</div><div class="card-list">`;for(let d of a){let c=Math.round(parseInt(d.playcount)/i*100);n+=`<div class="card">${Y(d.image)}<div class="card-info">
        <div class="card-title">${o(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(d.artist?.name||"")}">${o(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${c}%"></div></div>
        </div><div class="card-meta">${B(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${o(d.artist?.name||"")}" data-track="${o(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}b(n+"</div>")}catch(t){S(t.message)}}async function et(){T();try{let t=(await f("/api/loved")).lovedtracks?.track||[];if(!t.length){b('<div class="empty">Geen geliefde nummers.</div>');return}let a='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let i of t){let n=i.date?.uts?ae(parseInt(i.date.uts)):"";a+=`<div class="card">${Y(i.image)}<div class="card-info">
        <div class="card-title">${o(i.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(i.artist?.name||"")}">${o(i.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${o(i.artist?.name||"")}" data-track="${o(i.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}b(a+"</div>")}catch(e){S(e.message)}}async function Be(){T("Statistieken ophalen...");try{let e=await f("/api/stats");b(`
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
      </div>`,()=>mt(e))}catch(e){S(e.message)}}function mt(e){if(typeof Chart>"u")return;let t=!window.matchMedia("(prefers-color-scheme: light)").matches,a=t?"#2c2c2c":"#ddd",i=t?"#888":"#777",n=t?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=a;let d=document.getElementById("chart-daily");d&&new Chart(d,{type:"bar",data:{labels:e.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:e.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:a},ticks:{color:i},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&e.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:e.topArtists.map(r=>r.name),datasets:[{data:e.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:a},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:n,font:{size:11}}}}}});let l=document.getElementById("chart-genres");if(l&&e.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(l,{type:"doughnut",data:{labels:e.genres.map(u=>u.name),datasets:[{data:e.genres.map(u=>u.count),backgroundColor:r.slice(0,e.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function _(){T("Collectiegaten zoeken...");try{let e=await f("/api/gaps");if(e.status==="building"){b(`<div class="loading"><div class="spinner"></div>
        <div>${o(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{s.currentTab==="gaps"&&_()},2e4);return}s.lastGaps=e,se()}catch(e){S(e.message)}}function se(){if(!s.lastGaps)return;let e=[...s.lastGaps.artists||[]];if(!e.length){b('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}s.gapsSort==="missing"&&e.sort((i,n)=>n.missingAlbums.length-i.missingAlbums.length),s.gapsSort==="name"&&e.sort((i,n)=>i.name.localeCompare(n.name));let t=e.reduce((i,n)=>i+n.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=t;let a=`<div class="section-title">${t} ontbrekende albums bij ${e.length} artiesten die je al hebt</div>`;for(let i of e){let n=Math.round(i.ownedCount/i.totalCount*100),d=[z(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),c=i.image?`<img class="gaps-photo" src="${o(i.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${g(i.name)}">${m(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${g(i.name)}">${m(i.name)}</div>`;a+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${c}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${o(i.name)}">${o(i.name)}</div>
              ${O("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${o(d)}</div>
            ${j(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let l of i.missingAlbums)a+=J(l,!1,i.name);a+="</div>",i.allAlbums?.filter(l=>l.inPlex).length>0&&(a+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(l=>l.inPlex).map(l=>J(l,!1,i.name)).join("")}
        </div>
      </details>`),a+="</div>"}b(a)}async function Ke(e){s.bibSubTab=e;let t=document.getElementById("bib-sub-content"),a=document.getElementById("bib-subtoolbar");if(!t)return;document.querySelectorAll(".bib-tab").forEach(n=>n.classList.toggle("active",n.dataset.bibtab===e)),a&&(e==="collectie"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <input class="plib-search" id="plib-search-bib" type="text"
            placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off" style="flex:1;min-width:0">
          <button class="tool-btn" id="btn-sync-plex-bib">\u21BB Sync Plex</button>
        </div>`,document.getElementById("plib-search-bib")?.addEventListener("input",n=>{s.plexLibData&&(t.innerHTML=me(s.plexLibData,n.target.value))}),document.getElementById("btn-sync-plex-bib")?.addEventListener("click",async()=>{let n=document.getElementById("btn-sync-plex-bib"),d=n.textContent;n.disabled=!0,n.textContent="\u21BB Bezig\u2026";try{await fetch("/api/plex/refresh",{method:"POST"}),await H(),s.plexLibData=null;let c=t;s.sectionContainerEl=c,await te(),s.sectionContainerEl===c&&(s.sectionContainerEl=null)}catch{}finally{n.disabled=!1,n.textContent=d}})):e==="gaten"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <button class="tool-btn${s.gapsSort==="missing"?" sel-def":""}" data-gsort="missing">Meest ontbrekend</button>
          <button class="tool-btn${s.gapsSort==="name"?" sel-def":""}" data-gsort="name">A\u2013Z</button>
          <span class="toolbar-sep"></span>
          <button class="tool-btn refresh-btn" id="btn-ref-gaps-bib">\u21BB Vernieuwen</button>
        </div>`,document.getElementById("btn-ref-gaps-bib")?.addEventListener("click",async()=>{s.lastGaps=null,await fetch("/api/gaps/refresh",{method:"POST"});let n=document.getElementById("bib-sub-content");s.sectionContainerEl=n,await _(),s.sectionContainerEl===n&&(s.sectionContainerEl=null)})):a.innerHTML="");let i=t;s.sectionContainerEl=i;try{e==="collectie"?(s.currentTab="plexlib",await te()):e==="gaten"?(s.currentTab="gaps",await _()):e==="lijst"&&(s.currentTab="wishlist",await K())}finally{s.sectionContainerEl===i&&(s.sectionContainerEl=null)}}async function Ce(){s.currentTab="plexlib",A(),I.innerHTML=`
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${W(s.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${W(s.currentPeriod)})</span></div>
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
    </div>`,I.style.opacity="1",I.style.transform="";let e=document.getElementById("badge-gaps-bib"),t=document.getElementById("badge-gaps");e&&t&&(e.textContent=t.textContent),document.querySelectorAll(".bib-tab").forEach(a=>a.addEventListener("click",()=>Ke(a.dataset.bibtab)));{let a=document.getElementById("strip-artists-body");s.sectionContainerEl=a,await Se(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}{let a=document.getElementById("strip-tracks-body");s.sectionContainerEl=a,await Te(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}await Ke(s.bibSubTab),Z(document.getElementById("bib-stats-content"),()=>{let a=document.getElementById("bib-stats-content");return M(a,Be)})}function qe(e){let t=document.getElementById("panel-overlay"),a=document.getElementById("panel-content"),i=ie(e),n=()=>{a.innerHTML=`<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`,t.classList.add("open"),document.body.style.overflow="hidden"};document.startViewTransition?document.startViewTransition(n).finished.catch(()=>{}):n(),Promise.allSettled([f(`/api/artist/${encodeURIComponent(e)}/info`),f(`/api/artist/${encodeURIComponent(e)}/similar`)]).then(([d,c])=>{let l=d.status==="fulfilled"?d.value:{},r=c.status==="fulfilled"?c.value.similar||[]:[],u=l.image?`<img src="${o(l.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${g(e)};display:none">${m(e)}</div>`:`<div class="panel-photo-ph" style="background:${g(e)}">${m(e)}</div>`,v=[l.country?z(l.country)+" "+l.country:null,l.startYear?`Actief vanaf ${l.startYear}`:null,s.plexOk&&l.inPlex!==void 0?l.inPlex?"\u25B6 In Plex":"\u2726 Nieuw voor jou":null].filter(Boolean).join(" \xB7 "),y="";if(l.albums?.length){y='<div class="panel-section">Albums</div><div class="panel-albums">';for(let $ of l.albums){let x=$.image?`<img class="panel-album-img" src="${o($.image)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="panel-album-ph">\u266A</div>',C=s.plexOk&&$.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6</span>':"";y+=`<div class="panel-album-row">${x}
          <span class="panel-album-name">${o($.name)}</span>${C}${N(e,$.name,$.inPlex)}</div>`}y+="</div>"}let w="";if(r.length){w='<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">';for(let $ of r)w+=`<button class="panel-similar-chip artist-link" data-artist="${o($.name)}">${o($.name)}</button>`;w+="</div>"}a.innerHTML=`
      <div class="panel-photo-wrap" style="view-transition-name: artist-${i}">${u}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${o(e)}</div>
          ${O("artist",e,"",l.image||"")}
        </div>
        ${v?`<div class="panel-meta">${o(v)}</div>`:""}
        ${j(l.tags,6)}
        ${y}
        ${w}
      </div>`})}function ve(){document.getElementById("panel-overlay").classList.remove("open"),document.body.style.overflow=""}var ge={nu:()=>pe(),ontdek:()=>Q(),bibliotheek:()=>Ce(),downloads:()=>We(),discover:()=>U(),gaps:()=>_(),recent:()=>Ie(),recs:()=>re(),releases:()=>V(),topartists:()=>Se(s.currentPeriod),toptracks:()=>Te(s.currentPeriod),loved:()=>et(),stats:()=>Be(),wishlist:()=>K(),plexlib:()=>te(),tidal:()=>Ee()};document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelectorAll(".tab"),i=document.querySelector(".tab.active"),n=Array.from(a).indexOf(i),c=Array.from(a).indexOf(e)>n?"rtl":"ltr";document.documentElement.style.setProperty("--tab-direction",c==="ltr"?"-1":"1"),a.forEach(l=>l.classList.remove("active")),e.classList.add("active"),s.currentMainTab=t,["tb-period","tb-recs","tb-mood","tb-releases","tb-discover","tb-gaps","tb-plexlib","tb-tidarr-ui"].forEach(l=>document.getElementById(l)?.classList.remove("visible")),document.getElementById("tb-tidal")?.classList.toggle("visible",t==="downloads"),t!=="downloads"&&A(),t!=="downloads"&&void 0,document.startViewTransition?document.startViewTransition(()=>{ge[t]?.()}).finished.catch(()=>{}):ge[t]?.()})});document.querySelectorAll("[data-period]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-period]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.currentPeriod=e.dataset.period,ge[s.currentTab]?.()})});document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=e.dataset.filter,e.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),ce()})});document.querySelectorAll("[data-dfilter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-dfilter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=e.dataset.dfilter,e.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss"),ee()})});document.querySelectorAll("[data-gsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-gsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.gapsSort=e.dataset.gsort,se()})});document.querySelectorAll("[data-rtype]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rtype]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesFilter=e.dataset.rtype,D()})});document.querySelectorAll("[data-rsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesSort=e.dataset.rsort,D()})});document.getElementById("btn-refresh-releases")?.addEventListener("click",async()=>{s.lastReleases=null,await fetch("/api/releases/refresh",{method:"POST"}),V()});document.getElementById("btn-refresh-discover")?.addEventListener("click",async()=>{s.lastDiscover=null,await fetch("/api/discover/refresh",{method:"POST"}),U()});document.getElementById("btn-refresh-gaps")?.addEventListener("click",async()=>{s.lastGaps=null,await fetch("/api/gaps/refresh",{method:"POST"}),_()});document.getElementById("plib-search")?.addEventListener("input",e=>{!s.plexLibData||s.currentTab!=="plexlib"||(I.innerHTML=me(s.plexLibData,e.target.value))});document.getElementById("btn-sync-plex")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex"),t=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{await fetch("/api/plex/refresh",{method:"POST"}),await H(),s.plexLibData=null,s.currentTab==="plexlib"&&await te()}catch{}finally{e.disabled=!1,e.textContent=t}});document.getElementById("plex-refresh-btn")?.addEventListener("click",async()=>{let e=document.getElementById("plex-refresh-btn");e.classList.add("spinning"),e.disabled=!0;try{await fetch("/api/plex/refresh",{method:"POST"}),await H(),s.plexLibData=null}catch{}finally{e.classList.remove("spinning"),e.disabled=!1}});document.getElementById("tidal-search")?.addEventListener("input",e=>{clearTimeout(s.tidalSearchTimeout);let t=e.target.value.trim();s.tidalSearchTimeout=setTimeout(()=>{s.currentTab==="tidal"&&s.tidalView==="search"&&we(t)},400)});document.getElementById("panel-close")?.addEventListener("click",ve);document.addEventListener("click",async e=>{let t=e.target.closest(".play-btn");if(t){e.stopPropagation(),Xe(t,t.dataset.artist,t.dataset.track);return}let a=e.target.closest(".disc-toggle-btn");if(a){e.stopPropagation();let p=a.dataset.discId,h=document.getElementById(p);if(h){let E=h.classList.toggle("collapsed");h.querySelectorAll(".disc-toggle-btn").forEach(k=>{k.classList.toggle("expanded",!E),k.classList.toggle("collapsed",E);let L=parseInt(k.dataset.albumCount,10)||0,q=`${L} album${L!==1?"s":""}`;k.textContent=E?`Toon ${q}`:q})}return}let i=e.target.closest(".discover-card-toggle");if(i&&!e.target.closest(".artist-link")&&!e.target.closest(".bookmark-btn")&&!e.target.closest(".disc-toggle-btn")){let p=i.dataset.discId,h=document.getElementById(p);if(h){let E=h.classList.toggle("collapsed");h.querySelectorAll(".disc-toggle-btn").forEach(k=>{k.classList.toggle("expanded",!E),k.classList.toggle("collapsed",E);let L=parseInt(k.dataset.albumCount,10)||0,q=`${L} album${L!==1?"s":""}`;k.textContent=E?`Toon ${q}`:q})}return}let n=e.target.closest("[data-artist]");if(n?.dataset.artist&&!n.classList.contains("bookmark-btn")){n.classList.contains("search-result-item")&&(document.getElementById("search-results").classList.remove("open"),document.getElementById("search-input").value=""),qe(n.dataset.artist);return}let d=e.target.closest(".bookmark-btn");if(d){e.stopPropagation();let{btype:p,bname:h,bartist:E,bimage:k}=d.dataset,L=await He(p,h,E,k);d.classList.toggle("saved",L),d.title=L?"Verwijder uit lijst":"Sla op in lijst",document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(h)}"][data-btype="${p}"]`).forEach(q=>{q.classList.toggle("saved",L)});return}let c=e.target.closest(".wish-remove[data-wid]");if(c){await fetch(`/api/wishlist/${c.dataset.wid}`,{method:"DELETE"}),s.wishlistMap.forEach((p,h)=>{String(p)===c.dataset.wid&&s.wishlistMap.delete(h)}),X(),K();return}let l=e.target.closest(".panel-similar-chip[data-artist]");if(l){qe(l.dataset.artist);return}let r=e.target.closest(".download-btn, .tidal-dl-btn");if(r){if(e.stopPropagation(),r.classList.contains("tidal-dl-btn")){let E=r.dataset.dlurl;if(!E)return;r.disabled=!0;let k=r.textContent;r.textContent="\u2026";try{let L=await fetch("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:E})}),q=await L.json();if(!L.ok||!q.ok)throw new Error(q.error||"download mislukt");r.textContent="\u2713 Toegevoegd",r.classList.add("downloaded"),ne()}catch(L){alert("Downloaden mislukt: "+L.message),r.textContent=k,r.disabled=!1}return}let{dlartist:p,dlalbum:h}=r.dataset;await _e(p,h,r);return}let u=e.target.closest(".q-remove[data-qid]");if(u){e.stopPropagation();try{await fetch("/api/tidarr/queue/"+encodeURIComponent(u.dataset.qid),{method:"DELETE"})}catch(p){alert("Verwijderen mislukt: "+p.message)}return}let v=e.target.closest(".q-remove[data-dlid]");if(v){e.stopPropagation();try{await fetch(`/api/downloads/${v.dataset.dlid}`,{method:"DELETE"}),v.closest(".q-row")?.remove()}catch(p){alert("Verwijderen mislukt: "+p.message)}return}let y=e.target.closest(".inline-toolbar [data-filter]");if(y){document.querySelectorAll("[data-filter]").forEach(p=>p.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=y.dataset.filter,y.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),ce();return}let w=e.target.closest(".inline-toolbar [data-rtype]");if(w){document.querySelectorAll("[data-rtype]").forEach(h=>h.classList.remove("sel-def")),s.releasesFilter=w.dataset.rtype,w.classList.add("sel-def");let p=document.getElementById("sec-releases-content");p&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=p,D(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):D();return}let $=e.target.closest(".inline-toolbar [data-rsort]");if($){document.querySelectorAll("[data-rsort]").forEach(h=>h.classList.remove("sel-def")),s.releasesSort=$.dataset.rsort,$.classList.add("sel-def");let p=document.getElementById("sec-releases-content");p&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=p,D(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):D();return}let x=e.target.closest(".inline-toolbar [data-dfilter]");if(x){document.querySelectorAll("[data-dfilter]").forEach(h=>h.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=x.dataset.dfilter,x.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss");let p=document.getElementById("sec-discover-content");p&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=p,ee(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):ee();return}let C=e.target.closest(".inline-toolbar [data-gsort]");if(C){document.querySelectorAll("[data-gsort]").forEach(h=>h.classList.remove("sel-def")),s.gapsSort=C.dataset.gsort,C.classList.add("sel-def");let p=document.getElementById("bib-sub-content");p&&s.currentMainTab==="bibliotheek"?(s.sectionContainerEl=p,se(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):se();return}let R=e.target.closest(".sec-mood-block [data-mood]");if(R){let p=R.dataset.mood;if(s.activeMood===p){s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(E=>E.classList.remove("sel-mood","loading")),G(),Q();return}s.activeMood=p,document.querySelectorAll("[data-mood]").forEach(E=>E.classList.remove("sel-mood","loading")),R.classList.add("sel-mood");let h=R.closest(".inline-toolbar");if(h&&!document.getElementById("btn-clear-mood-inline")){let E=document.createElement("span");E.className="toolbar-sep";let k=document.createElement("button");k.className="tool-btn",k.id="btn-clear-mood-inline",k.textContent="\u2715 Wis mood",k.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),G(),Q()}),h.appendChild(E),h.appendChild(k)}de(p);return}let P=e.target.closest("[data-tidal-view]");if(P){let p=P.dataset.tidalView;p==="tidarr"?(document.getElementById("tb-tidal")?.classList.remove("visible"),document.getElementById("tb-tidarr-ui")?.classList.add("visible"),Ue()):(A(),document.getElementById("tb-tidal")?.classList.add("visible"),document.getElementById("tb-tidarr-ui")?.classList.remove("visible"),le(p));return}if(e.target===document.getElementById("panel-overlay")){ve();return}});document.addEventListener("keydown",e=>{if(e.key==="Escape"){ve(),document.getElementById("search-results").classList.remove("open");return}let t=["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);if(e.key==="/"&&!t){e.preventDefault(),document.getElementById("search-input").focus();return}if(e.key==="r"&&!t){s.currentMainTab==="ontdek"?Q():s.currentMainTab==="bibliotheek"?Ce():ge[s.currentTab]?.();return}if(!t&&/^[1-4]$/.test(e.key)){let a=document.querySelectorAll(".tab"),i=parseInt(e.key)-1;a[i]&&a[i].click();return}});document.querySelectorAll(".bnav-btn").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelector(`.tab[data-tab="${t}"]`);a&&(document.startViewTransition?document.startViewTransition(()=>{a.click()}).finished.catch(()=>{}):a.click()),document.querySelectorAll(".bnav-btn").forEach(i=>i.classList.toggle("active",i===e))})});document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab;document.querySelectorAll(".bnav-btn").forEach(a=>a.classList.toggle("active",a.dataset.tab===t))})});fe&&document.documentElement.setAttribute("data-reduce-motion","true");function tt(e){document.documentElement.dataset.theme=e;let t=document.getElementById("theme-toggle");t&&(t.textContent=e==="dark"?"\u2600\uFE0F":"\u{1F319}")}(function(){let t=localStorage.getItem("theme");tt(t||"light")})();document.getElementById("theme-toggle")?.addEventListener("click",()=>{let t=document.documentElement.dataset.theme==="dark"?"light":"dark";tt(t),localStorage.setItem("theme",t)});(function(){let t=localStorage.getItem("downloadQuality")||"high",a=document.getElementById("download-quality");a&&s.VALID_QUALITIES.includes(t)&&(a.value=t)})();document.getElementById("download-quality")?.addEventListener("change",e=>{localStorage.setItem("downloadQuality",e.target.value)});H();ue();je();ye();he();Re();oe();Je();pe();setInterval(ue,3e4);})();
