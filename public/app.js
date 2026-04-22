(()=>{var Qt=Object.defineProperty;var Zt=(e,t)=>()=>(e&&(t=e(e=0)),t);var Wt=(e,t)=>{for(var s in t)Qt(e,s,{get:t[s],enumerable:!0})};var qt={};Wt(qt,{closeZonePicker:()=>Ce,getSelectedZone:()=>F,initZonePicker:()=>We,isWebZone:()=>ds,pauseZone:()=>be,playOnZone:()=>K,skipZone:()=>J,toggleZonePicker:()=>Ze});function F(){try{let e=localStorage.getItem(Tt);return e?JSON.parse(e):null}catch{return null}}function os(e){localStorage.setItem(Tt,JSON.stringify(e)),Bt()}function Bt(){let e=F(),t=document.getElementById("plex-zone-name");t&&(t.textContent=e?e.name:"\u2014");let s=document.getElementById("plex-zone-btn");s&&s.classList.toggle("has-zone",!!e)}async function rs(){try{return(await fetch(`/api/plex/clients?t=${Date.now()}`).then(t=>t.json())).clients||[]}catch{return[]}}function Ce(){let e=document.getElementById("plex-zone-dropdown");e&&(e.style.display="none"),Qe=!1}async function Ze(){let e=document.getElementById("plex-zone-dropdown");if(!e)return;if(Qe){Ce();return}Qe=!0,e.style.display="",e.innerHTML='<div class="plex-zone-loading">Laden\u2026</div>';let t=await rs(),s=F();if(!t.length){e.innerHTML='<div class="plex-zone-empty">Geen Plex clients gevonden.<br><small>Zorg dat Plexamp of een andere player actief is.</small></div>';return}let i=n=>(n.product||"").toLowerCase().includes("web");e.innerHTML=t.map(n=>`
    <button class="plex-zone-item${s?.machineId===n.machineId?" active":""}${i(n)?" plex-web-zone":""}"
      data-machine-id="${n.machineId}"
      data-name="${n.name}"
      data-product="${n.product}">
      <span class="plex-zone-icon">${i(n)?"\u{1F310}":"\u{1F50A}"}</span>
      <span class="plex-zone-label">
        <span class="plex-zone-item-name">${n.name}</span>
        <small class="plex-zone-item-product">${n.product}${i(n)?" \xB7 \u26A0 beperkt":""}</small>
      </span>
      ${s?.machineId===n.machineId?'<span class="plex-zone-check">\u2713</span>':""}
    </button>
  `).join("")+(t.some(i)?'<div class="plex-zone-webwarning">\u26A0 Plex Web ondersteunt geen afstandsbediening via de API. Gebruik <strong>Plexamp</strong> voor volledige besturing.</div>':""),e.querySelectorAll(".plex-zone-item").forEach(n=>{n.addEventListener("click",()=>{let d=n.dataset.product||"";os({machineId:n.dataset.machineId,name:n.dataset.name,product:d}),Ce(),d.toLowerCase().includes("web")&&Ct("Plex Web ondersteunt geen afstandsbediening. Gebruik Plexamp voor play/pause/skip.")})})}function ds(){let e=F();return e?(e.product||"").toLowerCase().includes("web"):!1}async function K(e,t="music"){let s=F();if(!s)return await Ze(),!1;try{let n=await(await fetch("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:s.machineId,ratingKey:String(e),type:t})})).json();if(!n.ok)throw new Error(n.error||"Afspelen mislukt");return cs(s.name),!0}catch(i){return console.error("[Plex Remote] play fout:",i),Ct(`Afspelen mislukt: ${i.message}`),!1}}async function be(){let e=F();e&&await fetch("/api/plex/pause",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:e.machineId})}).catch(t=>console.warn("[Plex Remote] pause fout:",t))}async function J(e="next"){let t=F();t&&await fetch("/api/plex/skip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:t.machineId,direction:e})}).catch(s=>console.warn("[Plex Remote] skip fout:",s))}function cs(e){At(`\u25B6 Afspelen op ${e}`,"#1db954")}function Ct(e){At(`\u26A0 ${e}`,"#e05a2b")}function At(e,t="#333"){let s=document.getElementById("plex-remote-toast");s&&s.remove();let i=document.createElement("div");i.id="plex-remote-toast",Object.assign(i.style,{position:"fixed",bottom:"80px",left:"50%",transform:"translateX(-50%)",background:t,color:"#fff",padding:"10px 20px",borderRadius:"8px",zIndex:"9998",fontSize:"13px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",pointerEvents:"none",whiteSpace:"nowrap"}),i.textContent=e,document.body.appendChild(i),setTimeout(()=>i.remove(),3e3)}function We(){Bt(),document.getElementById("plex-zone-btn")?.addEventListener("click",e=>{e.stopPropagation(),Ze()}),document.addEventListener("click",e=>{let t=document.getElementById("plex-zone-wrap");t&&!t.contains(e.target)&&Ce()})}var Tt,Qe,ne=Zt(()=>{Tt="plexSelectedZone";Qe=!1});var a={activeTab:"nu",activeSubTab:null,bibSubTab:"collectie",sectionContainerEl:null,currentPeriod:"7day",recsFilter:"all",discFilter:"all",gapsSort:"missing",releasesSort:"listening",releasesFilter:"all",plexOk:!1,lastDiscover:null,lastGaps:null,lastReleases:null,lastRecs:null,plexLibData:null,wishlistMap:new Map,newReleaseIds:new Set,searchTimeout:null,tidalSearchTimeout:null,tabAbort:null,tidarrOk:!1,tidalView:"search",tidalSearchResults:null,tidarrQueuePoll:null,tidarrSseSource:null,tidarrQueueItems:[],downloadedSet:new Set,spotifyEnabled:!1,activeMood:null,previewAudio:new Audio,previewBtn:null,collapsibleSections:{recs:!1,releases:!1,discover:!1},sectionMutex:Promise.resolve(),dlResolve:null,VALID_QUALITIES:["max","high","normal","low"]};function k(e,t={}){return!t.signal&&a.tabAbort&&(t={...t,signal:a.tabAbort.signal}),fetch(e,t)}async function rt(e,t=4){let s=[],i=[];for(let[n,d]of e.entries()){let c=Promise.resolve().then(d).then(l=>{s[n]=l},l=>{s[n]=void 0});i.push(c),i.length>=t&&(await Promise.race(i),i.splice(i.findIndex(l=>l===c),1))}return await Promise.all(i),s}var De=window.matchMedia("(prefers-reduced-motion: reduce)").matches,I=document.getElementById("content");function T(e,t=120){return e?`/api/img?url=${encodeURIComponent(e)}&w=${t}&h=${t}`:null}var O=(e,t="medium")=>{if(!e)return null;let s=e.find(i=>i.size===t);return s&&s["#text"]&&!s["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f")?s["#text"]:null},v=e=>String(e||"?").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2),P=e=>parseInt(e).toLocaleString("nl-NL"),o=e=>String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),oe=e=>({"7day":"week","1month":"maand","3month":"3 maanden","12month":"jaar",overall:"alles"})[e]||e;function re(e){let t=Math.floor(Date.now()/1e3)-e;return t<120?"zojuist":t<3600?`${Math.floor(t/60)}m`:t<86400?`${Math.floor(t/3600)}u`:`${Math.floor(t/86400)}d`}function b(e,t=!1){let s=0;for(let r=0;r<e.length;r++)s=s*31+e.charCodeAt(r)&16777215;let i=s%360,n=45+s%31,d=50+(s>>8)%26,c=20+(s>>16)%16,l=15+(s>>10)%11;return t?`radial-gradient(circle, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`:`linear-gradient(135deg, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`}function ee(e){return!e||e.length!==2?"":[...e.toUpperCase()].map(t=>String.fromCodePoint(t.charCodeAt(0)+127397)).join("")}function U(e,t=4){return e?.length?`<div class="tags" style="margin-top:5px">${e.slice(0,t).map(s=>`<span class="tag">${o(s)}</span>`).join("")}</div>`:""}function de(e){return a.plexOk?e?'<span class="badge plex">\u25B6 In Plex</span>':'<span class="badge new">\u2726 Nieuw</span>':""}function _(e,t,s="",i=""){let n=a.wishlistMap.has(`${e}:${t}`);return`<button class="bookmark-btn${n?" saved":""}"
    data-btype="${o(e)}" data-bname="${o(t)}"
    data-bartist="${o(s)}" data-bimage="${o(i)}"
    title="${n?"Verwijder uit lijst":"Sla op in lijst"}">\u{1F516}</button>`}function $e(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function dt(e,t){let s=i=>(i||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");return`${s(e)}|${s(t)}`}var ct=(e,t)=>a.downloadedSet.has(dt(e,t)),ut=(e,t)=>a.downloadedSet.add(dt(e,t));function N(e,t="",s=!1){return!a.tidarrOk||s?"":ct(e,t)?`<button class="download-btn dl-done"
      data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
      title="Al gedownload">\u2713</button>`:`<button class="download-btn"
    data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
    title="Download via Tidarr">\u2B07</button>`}var Re=e=>{let t=O(e);return t?`<img class="card-img" src="${t}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>'};function ce(e,t=!0,s=""){let i=e.inPlex,n=b(e.title||""),d=e.year||"\u2014",c=ct(s,e.title||""),l=a.tidarrOk&&s&&!i?c?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${o(s)}" data-dlalbum="${o(e.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${o(s)}" data-dlalbum="${o(e.title||"")}" title="Download via Tidarr">\u2B07</button>`:"";return`
    <div class="album-card ${i?"owned":"missing"}" title="${o(e.title)}${d!=="\u2014"?" ("+d+")":""}">
      <div class="album-cover" style="background:${n}">
        <div class="album-cover-ph">${v(e.title||"?")}</div>
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
    </div>`}function ot(){if(De)return;Object.entries({".rec-grid > *":60,".card-list > *":25,".artist-grid > *":40,".releases-grid > *":40,".wishlist-grid > *":40}).forEach(([t,s])=>{document.querySelectorAll(t).forEach((i,n)=>{i.style.animationDelay=`${n*s}ms`})})}function Kt(e){let t="";e==="cards"?t='<div class="skeleton-list">'+Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")+"</div>":e==="grid"?t='<div class="skeleton-grid">'+Array(8).fill('<div class="skeleton skeleton-square"></div>').join("")+"</div>":e==="stats"?t='<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>':t=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`,x(t)}function x(e,t){a.sectionContainerEl&&!document.contains(a.sectionContainerEl)&&(a.sectionContainerEl=null);let s=a.sectionContainerEl||I;!a.sectionContainerEl&&document.startViewTransition?document.startViewTransition(()=>{s.innerHTML=e,ot(),t&&requestAnimationFrame(t)}).finished.catch(()=>{}):(s.innerHTML=e,a.sectionContainerEl?t&&t():(I.style.opacity="0",I.style.transform="translateY(6px)",requestAnimationFrame(()=>{I.offsetHeight,I.style.opacity="1",I.style.transform="",ot(),t&&requestAnimationFrame(t)})))}var M=e=>x(`<div class="error-box">\u26A0\uFE0F ${o(e)}</div>`);function z(e){if(a.sectionContainerEl){a.sectionContainerEl.innerHTML=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`;return}let t={recent:"cards",loved:"cards",toptracks:"cards",topartists:"grid",releases:"grid",recs:"grid",discover:"grid",gaten:"grid",stats:"stats",lijst:"grid",collectie:"cards",tidal:"cards",nu:"cards",ontdek:"grid",bibliotheek:"cards",downloads:"cards"},s=a.activeSubTab||a.activeTab,i=t[s];i&&!e?Kt(i):x(`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`)}function ue(e,t){if(!e)return;if(!("IntersectionObserver"in window)){t();return}let s=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(s.unobserve(n.target),t())})},{rootMargin:"300px"});s.observe(e)}function H(e,t){let s=a.sectionMutex.then(async()=>{a.sectionContainerEl=e;try{await t()}finally{a.sectionContainerEl=null}});return a.sectionMutex=s.catch(()=>{}),s}var xe=new Map;function B(e,t){let s=xe.get(e);return s?Date.now()-s.timestamp>t?(xe.delete(e),null):s.data:null}function C(e,t){xe.set(e,{data:t,timestamp:Date.now()})}function Q(e){xe.delete(e)}var Ee=new Map;async function Z(e){if(Ee.has(e))return Ee.get(e);let t=g(e);return Ee.set(e,t),t.finally(()=>{Ee.delete(e)}),t}function Jt(e){if(document.getElementById("rate-limit-notice"))return;let t=document.createElement("div");t.id="rate-limit-notice",Object.assign(t.style,{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",background:"#e05a2b",color:"#fff",padding:"12px 24px",borderRadius:"8px",zIndex:"9999",fontSize:"14px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",whiteSpace:"nowrap"}),t.textContent="\u23F1 "+e,document.body.appendChild(t),setTimeout(()=>t.remove(),8e3)}async function g(e,{signal:t}={}){let s=await fetch(e,{signal:t});if(s.status===429){let n=(await s.json().catch(()=>({}))).error||"Te veel verzoeken, probeer het over een minuut opnieuw";throw Jt(n),new Error(n)}if(!s.ok)throw new Error(`Serverfout ${s.status}`);return s.json()}async function pt(){try{let e=await g("/api/downloads/keys");a.downloadedSet=new Set(e)}catch{a.downloadedSet=new Set}}async function W(){try{let e=await fetch("/api/plex/status").then(i=>i.json()),t=document.getElementById("plex-pill"),s=document.getElementById("plex-pill-text");if(e.connected){a.plexOk=!0,t.className="plex-pill on";let i=e.albums?` \xB7 ${P(e.albums)} albums`:"";s.textContent=`Plex \xB7 ${P(e.artists)} artiesten${i}`}else t.className="plex-pill off",s.textContent="Plex offline"}catch{document.getElementById("plex-pill-text").textContent="Plex offline"}}async function mt(){try{let e=B("user",6e5);e||(e=await g("/api/user"),C("user",e));let t=e.user,s=O(t.image,"large"),i=s?`<img class="user-avatar" src="${s}" alt="">`:`<div class="user-avatar-ph">${(t.name||"U")[0].toUpperCase()}</div>`,n=new Date(parseInt(t.registered?.unixtime)*1e3).getFullYear();document.getElementById("user-wrap").innerHTML=`
      <div class="user-card">${i}
        <div><div class="user-name">${o(t.realname||t.name)}</div>
        <div class="user-sub">${P(t.playcount)} scrobbles \xB7 lid sinds ${n}</div></div>
      </div>`}catch{}}async function He(){try{let e=await g("/api/wishlist");a.wishlistMap.clear();for(let t of e)a.wishlistMap.set(`${t.type}:${t.name}`,t.id);pe()}catch{}}function pe(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=a.wishlistMap.size||"0")}async function vt(e,t,s,i){let n=`${e}:${t}`;if(a.wishlistMap.has(n)){try{await k(`/api/wishlist/${a.wishlistMap.get(n)}`,{method:"DELETE"})}catch(d){if(d.name!=="AbortError")throw d}return a.wishlistMap.delete(n),pe(),!1}else{let c=await(await k("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:t,artist:s,image:i})})).json();return a.wishlistMap.set(n,c.id),pe(),!0}}async function me(){z(),await He();try{let e=await g("/api/wishlist");if(!e.length){x('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let t=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let s of e){let i=s.image?`<img src="${o(s.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";t+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${b(s.name)}">
            ${i}
            <div class="wish-ph">${v(s.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${o(s.name)}">${o(s.name)}</div>
              ${s.artist?`<div class="wish-sub">${o(s.artist)}</div>`:""}
              <div class="wish-type">${s.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${s.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}x(t+"</div>")}catch(e){M(e.message)}}function Yt(){return localStorage.getItem("downloadQuality")||"high"}async function je(){let e=a.tabAbort?.signal;try{let t=await g("/api/tidarr/status",{signal:e});if(e?.aborted)return;let s=document.getElementById("tidarr-status-pill"),i=document.getElementById("tidarr-status-text");a.tidarrOk=!!t.connected,s&&i&&(s.className=`tidarr-status-pill ${a.tidarrOk?"on":"off"}`,i.textContent=a.tidarrOk?`Tidarr \xB7 verbonden${t.quality?" \xB7 "+t.quality:""}`:"Tidarr offline")}catch(t){if(t.name==="AbortError")return;a.tidarrOk=!1;let s=document.getElementById("tidarr-status-text");s&&(s.textContent="Tidarr offline")}}async function ke(){let e=a.tabAbort?.signal;try{let t=await g("/api/tidarr/queue",{signal:e});if(e?.aborted)return;let s=(t.items||[]).length,i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(s>0?(n.textContent=s,n.style.display=""):n.style.display="none")}catch(t){if(t.name==="AbortError")return}}function bt(e){let t=e.image?`<img class="tidal-img" src="${o(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="tidal-ph" style="display:none;background:${b(e.title)}">${v(e.title)}</div>`:`<div class="tidal-ph" style="background:${b(e.title)}">${v(e.title)}</div>`,s=[e.type==="album"?"Album":"Nummer",e.year,e.album&&e.type==="track"?e.album:null,e.tracks?`${e.tracks} nummers`:null].filter(Boolean).join(" \xB7 ");return`
    <div class="tidal-card">
      <div class="tidal-cover">${t}</div>
      <div class="tidal-info">
        <div class="tidal-title">${o(e.title)}</div>
        <div class="tidal-artist artist-link" data-artist="${o(e.artist)}">${o(e.artist)}</div>
        <div class="tidal-meta">${o(s)}</div>
      </div>
      <button class="tidal-dl-btn" data-dlurl="${o(e.url)}" title="Download via Tidarr">\u2B07 Download</button>
    </div>`}async function Oe(e){let t=document.getElementById("tidal-content");if(!t)return;let s=(e||"").trim();if(s.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let i=await g(`/api/tidarr/search?q=${encodeURIComponent(s)}`);if(a.tidalSearchResults=i.results||[],i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.error)}</div>`;return}if(!a.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${o(s)}</strong>".</div>`;return}let n=a.tidalSearchResults.filter(l=>l.type==="album"),d=a.tidalSearchResults.filter(l=>l.type==="track"),c="";n.length&&(c+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(bt).join("")}</div>`),d.length&&(c+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(bt).join("")}</div>`),t.innerHTML=c}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.message)}</div>`}}function yt(){let e=document.getElementById("tidal-content");if(!e)return;let t=a.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let d=i[n.status]||"q-pending",c=s[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${l}%"></div></div><div class="q-pct">${l}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${o(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${o(n.artist)}</div>`:""}
          <span class="q-status ${d}">${o(c)}</span>
        </div>
        ${r}
        <button class="q-remove" data-qid="${o(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function ht(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let t=await g("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let s={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
      <div class="section-title">${t.length} gedownloade albums
        <button class="tool-btn" id="dl-history-clear" style="margin-left:auto;font-size:11px">\u{1F5D1} Wis alles</button>
      </div>
      <div class="q-list">${t.map(i=>{let n=i.queued_at?new Date(i.queued_at).toLocaleDateString("nl-NL",{day:"numeric",month:"short",year:"numeric"}):"",d=s[i.quality]||i.quality||"";return`<div class="q-row">
          <div class="q-info">
            <div class="q-title">${o(i.title)}</div>
            ${i.artist?`<div class="q-artist artist-link" data-artist="${o(i.artist)}">${o(i.artist)}</div>`:""}
            <span class="q-status q-done">\u2713 gedownload${d?" \xB7 "+d:""}${n?" \xB7 "+n:""}</span>
          </div>
          <button class="q-remove" data-dlid="${i.id}" title="Verwijder uit geschiedenis">\u2715</button>
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await k("/api/downloads",{method:"DELETE"})}catch(i){i.name}for(let i of t)try{await k(`/api/downloads/${i.id}`,{method:"DELETE"})}catch(n){n.name}a.downloadedSet.clear(),ht()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`}}}function Le(e){a.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(t=>t.classList.toggle("sel-def",t.dataset.tidalView===e)),e==="search"?Oe(document.getElementById("tidal-search")?.value||""):e==="queue"?yt():e==="history"&&ht()}function Se(){if(a.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");a.tidarrSseSource=e,e.onmessage=t=>{try{a.tidarrQueueItems=JSON.parse(t.data)||[]}catch{a.tidarrQueueItems=[]}let s=a.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(s.length>0?(n.textContent=s.length,n.style.display=""):n.style.display="none");if(es(a.tidarrQueueItems),a.activeSubTab==="tidal"&&a.tidalView==="queue"&&yt(),document.getElementById("queue-popover")?.classList.contains("open")&&$t(),a.activeTab==="nu"){let n=document.getElementById("wbody-download-voortgang");n&&Fe(n,s)}},e.onerror=()=>{e.close(),a.tidarrSseSource=null,setTimeout(Se,1e4)}}function Fe(e,t){if(t||(t=a.tidarrQueueItems.filter(i=>i.status!=="finished"&&i.status!=="error")),!t.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};e.innerHTML=`<div class="w-queue-list">${t.slice(0,5).map(i=>{let n=i.progress?.current&&i.progress?.total?Math.round(i.progress.current/i.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${o(i.title||"(onbekend)")}</div>
      ${i.artist?`<div class="w-q-artist">${o(i.artist)}</div>`:""}
      ${n!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${n}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${n}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${o(s[i.status]||i.status)}</span>`}
    </div></div>`}).join("")}${t.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${t.length-5} meer</div>`:""}</div>`}function Xt(){Se()}function wt(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),s=document.getElementById("content");t.style.display="flex",s.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function j(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function es(e){let t=document.getElementById("queue-fab"),s=document.getElementById("fab-queue-badge");if(!t)return;let i=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",i.length>0?(s.textContent=i.length,s.style.display=""):s.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function $t(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=a.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let d=i[n.status]||"q-pending",c=s[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${l}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${o(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${o(n.artist)}</div>`:""}
      <span class="q-status ${d}">${o(c)}</span>
      ${r}
    </div>`}).join("")}function ts(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&$t()}function _e(){document.getElementById("queue-popover")?.classList.remove("open")}function gt(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function xt(e,t){let s=gt(e),i=gt(t);return!s||!i?!0:s===i||s.includes(i)||i.includes(s)}function ss(e,t,s,i){return new Promise(n=>{a.dlResolve=n;let d=document.getElementById("dl-confirm-modal"),c=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${s}"${t?" \u2013 "+t:""}`,c.innerHTML=e.map((l,r)=>{let u=!xt(l.artist,t),y=l.image?`<img class="dlc-img" src="${o(l.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${v(l.title)}</div>`:`<div class="dlc-ph">${v(l.title)}</div>`,p=u?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${o(l.artist)}</div>`:`<div class="dlc-artist">${o(l.artist)}</div>`,f=l.score??0;return`
        <button class="dlc-card${r===0?" dlc-best":""}" data-dlc-idx="${r}">
          <div class="dlc-cover">${y}</div>
          <div class="dlc-info">
            <div class="dlc-title">${o(l.title)}</div>
            ${p}
            <div class="dlc-meta">${l.year?o(l.year):""}${l.year&&l.tracks?" \xB7 ":""}${l.tracks?l.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${f}%"></div></div>
            <div class="dlc-score-label">${f}% overeenkomst</div>
          </div>
          ${r===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),c.querySelectorAll(".dlc-card").forEach(l=>{l.addEventListener("click",()=>{let r=parseInt(l.dataset.dlcIdx);Ne(),n({chosen:e[r],btn:i})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function Ne(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",a.dlResolve&&(a.dlResolve({chosen:null}),a.dlResolve=null)}async function ft(e,t,s,i){let n=await k("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||s||"",artist:e.artist||t||"",id:String(e.id||""),quality:Yt()})}),d=await n.json();if(!n.ok||!d.ok)throw new Error(d.error||"download mislukt");ut(e.artist||t||"",e.title||s||""),i&&(i.textContent="\u2713",i.classList.add("dl-done"),i.disabled=!1),await ke()}async function Et(e,t,s){if(!a.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let i=new URLSearchParams;e&&i.set("artist",e),t&&i.set("album",t);let n=await k(`/api/tidarr/candidates?${i}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let{candidates:d}=await n.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let c=d[0];if(e&&!xt(c.artist,e)){s&&(s.disabled=!1,s.textContent="\u2B07");let{chosen:l}=await ss(d,e,t,s);if(!l)return;s&&(s.disabled=!0,s.textContent="\u2026"),await ft(l,e,t,s)}else await ft(c,e,t,s)}catch(i){alert("Downloaden mislukt: "+i.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function Ge(){x('<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>'),await je(),await ke(),Le(a.tidalView),Xt()}function kt(){a.activeSubTab="tidal",j(),document.getElementById("tb-tidal")?.classList.add("visible"),Ge()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{Ne()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&Ne()});document.getElementById("queue-fab")?.addEventListener("click",ts);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),_e()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{_e(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>Le("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),s=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!s?.contains(e.target)&&_e()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});async function St(){try{let e=await g("/api/spotify/status");a.spotifyEnabled=!!e.enabled;let t=document.getElementById("tb-mood");a.spotifyEnabled&&a.activeSubTab==="recs"?(t.style.display="",t.classList.add("visible")):a.spotifyEnabled&&(t.style.display="")}catch{a.spotifyEnabled=!1}}function as(e,t){let s=e.image?`<img src="${o(e.image)}" alt="" loading="lazy"
         onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="spotify-cover-ph" style="display:none">\u266A</div>`:'<div class="spotify-cover-ph">\u266A</div>',i=e.preview_url?`<button class="spotify-play-btn" data-spotify-preview="${o(e.preview_url)}"
         data-artist="${o(e.artist)}" data-track="${o(e.name)}"
         id="spbtn-${t}" title="Luister preview">\u25B6</button>`:"",n=e.spotify_url?`<a class="spotify-link-btn" href="${o(e.spotify_url)}" target="_blank" rel="noopener">\u266B Open in Spotify</a>`:"";return`
    <div class="spotify-card">
      <div class="spotify-cover">
        ${s}${i}
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
    </div>`}async function Te(e){let t=document.getElementById("spotify-recs-section");if(!t)return;let s={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};t.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let i=`spotify:${e}`,n=B(i,300*1e3);if(n||(n=await g(`/api/spotify/recs?mood=${encodeURIComponent(e)}`),C(i,n)),!n.length){t.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let d=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${o(s[e]||e)}</div>
      <div class="spotify-grid">`;n.forEach((c,l)=>{d+=as(c,l)}),d+="</div>",t.innerHTML=d}catch{t.innerHTML=""}}function ae(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(e=>{e.addEventListener("click",async()=>{let t=e.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(s=>s.classList.remove("sel-mood","loading")),a.activeMood===t){a.activeMood=null,ae(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}a.activeMood=t,e.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await Te(t),e.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{a.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",ae()});document.addEventListener("click",e=>{let t=e.target.closest(".spotify-play-btn");if(!t)return;e.stopPropagation();let s=t.dataset.spotifyPreview;if(s){if(a.previewBtn===t){a.previewAudio.paused?(a.previewAudio.play(),t.textContent="\u23F8",t.classList.add("playing")):(a.previewAudio.pause(),t.textContent="\u25B6",t.classList.remove("playing"));return}if(a.previewBtn){a.previewAudio.pause(),a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing");let i=a.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}a.previewBtn=t,a.previewAudio.src=s,a.previewAudio.currentTime=0,a.previewAudio.play().then(()=>{t.textContent="\u23F8",t.classList.add("playing")}).catch(()=>{t.textContent="\u25B6",a.previewBtn=null})}},!0);async function Ie(){z();let e=a.tabAbort?.signal;try{let t=B("recs",3e5);if(!(t!==null)){if(t=await Z("/api/recs"),e?.aborted)return;C("recs",t)}let i=t.recommendations||[],n=t.albumRecs||[],d=t.trackRecs||[];if(a.plexOk=t.plexConnected||a.plexOk,a.lastRecs=t,t.plexConnected&&t.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${P(t.plexArtistCount)} artiesten`),!i.length){x('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let c=i.filter(p=>!p.inPlex).length,l=i.filter(p=>p.inPlex).length,r=document.getElementById("hdr-title-recs");r&&(r.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${i.length} artiesten`);let u='<div class="spotify-section" id="spotify-recs-section"></div>';u+=`<div class="section-title">Gebaseerd op jouw smaak: ${(t.basedOn||[]).slice(0,3).join(", ")}
      ${a.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${c} nieuw</span> \xB7 <span style="color:var(--plex)">${l} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let p=0;p<i.length;p++){let f=i[p],w=Math.round(f.match*100);u+=`
        <div class="rec-card" data-inplex="${f.inPlex}" id="rc-${p}">
          <div class="rec-photo" id="rph-${p}">
            <div class="rec-photo-ph" style="background:${b(f.name)}">${v(f.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${o(f.name)}">${o(f.name)}</span>
                ${de(f.inPlex)}
              </div>
              <span class="rec-match">${w}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${o(f.reason)}</div>
            <div id="rtags-${p}"></div>
            <div id="ralb-${p}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`}if(u+="</div>",n.length){u+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let p of n){let f=T(p.image,80)||p.image,w=f?`<img class="albrec-img" src="${o(f)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${b(p.album)}">${v(p.album)}</div>`:`<div class="albrec-ph" style="background:${b(p.album)}">${v(p.album)}</div>`,h=a.plexOk?p.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";u+=`
          <div class="albrec-card">
            <div class="albrec-cover">${w}</div>
            <div class="albrec-info">
              <div class="albrec-title">${o(p.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${o(p.artist)}">${o(p.artist)}</div>
              <div class="albrec-reason">via ${o(p.reason)}</div>
              ${h}${N(p.artist,p.album,p.inPlex)}
            </div>
          </div>`}u+="</div>"}if(d.length){u+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let p of d){let f=p.playcount>0?`<span class="trackrec-plays">${P(p.playcount)}\xD7</span>`:"",w=p.url?`<a class="trackrec-link" href="${o(p.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";u+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${o(p.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${o(p.artist)}">${o(p.artist)}</div>
              <div class="trackrec-reason">via ${o(p.reason)}</div>
            </div>
            <div class="trackrec-meta">${f}${w}</div>
          </div>`}u+="</div>"}x(u,()=>{a.activeMood&&Te(a.activeMood)}),Be();let y=document.getElementById("sec-recs-preview");if(y){let p=i.slice(0,8);y.innerHTML=`<div class="collapsed-thumbs">${p.map((f,w)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${w}" style="background:${b(f.name)}">
          <span class="collapsed-thumb-ph">${v(f.name)}</span>
        </div>`).join("")}${i.length>8?`<span class="collapsed-thumbs-more">+${i.length-8}</span>`:""}</div>`,p.forEach(async(f,w)=>{try{let h=await g(`/api/artist/${encodeURIComponent(f.name)}/info`),E=document.getElementById(`recs-thumb-${w}`);E&&h.image&&(E.innerHTML=`<img src="${o(T(h.image,48)||h.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}i.forEach(async(p,f)=>{try{let w=await g(`/api/artist/${encodeURIComponent(p.name)}/info`),h=document.getElementById(`rph-${f}`);h&&w.image&&(h.innerHTML=`<img src="${T(w.image,120)||w.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${b(p.name)}\\'>${v(p.name)}</div>'">`);let E=document.getElementById(`rtags-${f}`);E&&(E.innerHTML=U(w.tags,3)+'<div style="height:6px"></div>');let A=document.getElementById(`ralb-${f}`);if(A){let D=(w.albums||[]).slice(0,4);if(D.length){let m='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let $ of D){let L=$.image?`<img class="rec-album-img" src="${T($.image,48)||$.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',S=a.plexOk&&$.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";m+=`<div class="rec-album-row">${L}<span class="rec-album-name">${o($.name)}</span>${S}${N(p.name,$.name,$.inPlex)}</div>`}A.innerHTML=m+"</div>"}else A.innerHTML=""}}catch{let w=document.getElementById(`ralb-${f}`);w&&(w.innerHTML="")}})}catch(t){if(t.name==="AbortError")return;M(t.message)}}function Be(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let t=e.dataset.inplex==="true",s=!0;a.recsFilter==="new"&&(s=!t),a.recsFilter==="plex"&&(s=t),e.classList.toggle("hidden",!s)})}function It(e){let t=document.getElementById("badge-releases");t&&(e>0?(t.textContent=e,t.style.display=""):t.style.display="none")}function is(e){if(!e)return"";let t=new Date(e),i=Math.floor((new Date-t)/864e5);return i===0?"vandaag":i===1?"gisteren":i<7?`${i} dagen geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function te(){z();let e=a.tabAbort?.signal;try{let t=B("releases",3e5);if(!t){if(t=await g("/api/releases",{signal:e}),e?.aborted)return;C("releases",t)}if(t.status==="building"){x(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{(a.activeSubTab==="releases"||a.activeSubTab===null)&&te()},5e3);return}a.lastReleases=t.releases||[],a.newReleaseIds=new Set(t.newReleaseIds||[]),It(t.newCount||0),G()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function G(){let e=a.lastReleases||[];if(!e.length){x('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let t=e;if(a.releasesFilter!=="all"&&(t=e.filter(l=>(l.type||"album").toLowerCase()===a.releasesFilter)),!t.length){x(`<div class="empty">Geen ${a.releasesFilter==="ep"?"EP's":a.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}a.releasesSort==="listening"?t=[...t].sort((l,r)=>(r.artistPlaycount||0)-(l.artistPlaycount||0)||new Date(r.releaseDate)-new Date(l.releaseDate)):t=[...t].sort((l,r)=>new Date(r.releaseDate)-new Date(l.releaseDate));let s=document.getElementById("hdr-title-releases");s&&(s.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${t.length} release${t.length!==1?"s":""}`);let i=l=>({album:"Album",single:"Single",ep:"EP"})[l?.toLowerCase()]||l||"Album",n=l=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[l?.toLowerCase()]||"rel-type-album",d=`<div class="section-title">${t.length} release${t.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let l of t){let r=a.newReleaseIds.has(`${l.artist}::${l.album}`),u=l.image?`<img class="rel-img" src="${o(l.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${b(l.album)}">${v(l.album)}</div>`:`<div class="rel-ph" style="background:${b(l.album)}">${v(l.album)}</div>`,y=l.releaseDate?new Date(l.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",p=is(l.releaseDate),f=y?`<div class="rel-date">${y} <span class="rel-date-rel">(${p})</span></div>`:"",w=a.plexOk?l.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':l.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",h=l.deezerUrl?`<a class="rel-deezer-link" href="${o(l.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";d+=`
      <div class="rel-card${r?" rel-card-new":""}">
        <div class="rel-cover">${u}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${n(l.type)}">${i(l.type)}</span>
          <div class="rel-album">${o(l.album)}</div>
          <div class="rel-artist artist-link" data-artist="${o(l.artist)}">${o(l.artist)}</div>
          ${f}
          <div class="rel-footer">${w}${h}${N(l.artist,l.album,l.inPlex)}</div>
        </div>
      </div>`}x(d+"</div>");let c=document.getElementById("sec-releases-preview");if(c){let l=t.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(r.album)}">${v(r.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${b(r.album)}"><span class="collapsed-thumb-ph">${v(r.album)}</span></div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`}}async function se(){z("Ontdekkingen ophalen...");let e=a.tabAbort?.signal;try{let t=B("discover",3e5);if(!t){if(t=await g("/api/discover",{signal:e}),e?.aborted)return;C("discover",t)}if(t.status==="building"){x(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{(a.activeSubTab==="discover"||a.activeSubTab===null)&&se()},2e4);return}a.lastDiscover=t,t.plexConnected&&(a.plexOk=!0),ve()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function ve(){if(!a.lastDiscover)return;let{artists:e,basedOn:t}=a.lastDiscover;if(!e?.length){x('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let s=e;if(a.discFilter==="new"&&(s=e.filter(l=>!l.inPlex)),a.discFilter==="partial"&&(s=e.filter(l=>l.inPlex&&l.missingCount>0)),!s.length){x('<div class="empty">Geen artiesten voor dit filter.</div>');return}let i=document.getElementById("hdr-title-discover");i&&(i.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${s.length} artiesten`);let n=s.reduce((l,r)=>l+r.missingCount,0),d=`<div class="section-title">Gebaseerd op: ${(t||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let l=0;l<s.length;l++){let r=s[l],u=Math.round(r.match*100),y=[ee(r.country),r.country,r.startYear?`Actief vanaf ${r.startYear}`:null,r.totalAlbums?`${r.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),p=T(r.image,120)||r.image,f=p?`<img class="discover-photo" src="${o(p)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${b(r.name,!0)}">${v(r.name)}</div>`:`<div class="discover-photo-ph" style="background:${b(r.name,!0)}">${v(r.name)}</div>`,w=r.albums?.length||0,h=`${w} album${w!==1?"s":""}`;if(d+=`
      <div class="discover-section collapsed" id="disc-${l}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${l}">
          <div class="discover-card-top">
            ${f}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${o(r.name)}">${o(r.name)}</span>
                ${de(r.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${o(r.reason)}</strong></div>
            </div>
            <span class="discover-match">${u}%</span>
            ${_("artist",r.name,"",r.image||"")}
          </div>
          ${y?`<div class="discover-meta">${o(y)}</div>`:""}
          ${U(r.tags,3)}
          ${r.missingCount>0?`<div class="discover-missing">\u2726 ${r.missingCount} ${r.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${l}" data-album-count="${w}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${h}</button>
          ${r.albums?.length?`<div class="discover-preview-row">${r.albums.slice(0,5).map(E=>{let A=b(E.title||"");return E.coverUrl?`<img class="discover-preview-thumb" src="${o(E.coverUrl)}" alt="${o(E.title)}" loading="lazy"
                   title="${o(E.title)}${E.year?" ("+E.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${A}">${v(E.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${A}">${v(E.title||"?")}</div>`}).join("")}${r.albums.length>5?`<div class="discover-preview-more">+${r.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,r.albums?.length){d+='<div class="album-grid">';for(let E of r.albums)d+=ce(E,!0,r.name);d+="</div>"}else d+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';d+="</div></div>"}d+="</div>",x(d);let c=document.getElementById("sec-discover-preview");if(c){let l=s.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(r.name)}">${v(r.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(r.name)}"><span class="collapsed-thumb-ph">${v(r.name)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`}}function ns(){try{let e=localStorage.getItem("ontdek-sections");e&&Object.assign(a.collapsibleSections,JSON.parse(e))}catch{}}function ls(){try{localStorage.setItem("ontdek-sections",JSON.stringify(a.collapsibleSections))}catch{}}function Lt(e,t){e.classList.remove("expanded","collapsed"),e.classList.add(t?"collapsed":"expanded")}function Ve(e,t){let s=document.querySelector(`[data-section="${e}"]`);if(!s)return;let i=s.querySelector(".section-toggle-btn");i&&(Lt(i,a.collapsibleSections[t]),i.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),a.collapsibleSections[t]=!a.collapsibleSections[t],ls(),Lt(i,a.collapsibleSections[t]),s.classList.toggle("collapsed")}),a.collapsibleSections[t]&&s.classList.add("collapsed"))}async function ie(){ns(),a.activeSubTab=null,j();let e=a.spotifyEnabled?`
    <div class="section-block sec-mood-block">
      <div class="inline-toolbar">
        <span class="toolbar-label spotify-label">\u{1F3AF} Spotify mood</span>
        <span class="toolbar-sep"></span>
        <button class="tool-btn${a.activeMood==="energiek"?" sel-mood":""}" data-mood="energiek">\u26A1 Energiek</button>
        <button class="tool-btn${a.activeMood==="chill"?" sel-mood":""}" data-mood="chill">\u{1F30A} Chill</button>
        <button class="tool-btn${a.activeMood==="melancholisch"?" sel-mood":""}" data-mood="melancholisch">\u{1F327} Melancholisch</button>
        <button class="tool-btn${a.activeMood==="experimenteel"?" sel-mood":""}" data-mood="experimenteel">\u{1F52C} Experimenteel</button>
        <button class="tool-btn${a.activeMood==="feest"?" sel-mood":""}" data-mood="feest">\u{1F389} Feest</button>
        ${a.activeMood?'<span class="toolbar-sep"></span><button class="tool-btn" id="btn-clear-mood-inline">\u2715 Wis mood</button>':""}
      </div>
    </div>`:"";I.innerHTML=`
    <div class="ontdek-layout">
      ${e}

      <div class="section-block" data-section="recs">
        <div class="section-hdr">
          <button class="section-toggle-btn expanded" title="Vouw in/uit"></button>
          <span class="section-hdr-title" id="hdr-title-recs">\u{1F3AF} Aanbevelingen</span>
          <div class="inline-toolbar">
            <button class="tool-btn${a.recsFilter==="all"?" sel-def":""}" data-filter="all">Alle</button>
            <button class="tool-btn${a.recsFilter==="new"?" sel-new":""}" data-filter="new">\u2726 Nieuw voor mij</button>
            <button class="tool-btn${a.recsFilter==="plex"?" sel-plex":""}" data-filter="plex">\u25B6 Al in Plex</button>
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
            <button class="tool-btn${a.releasesFilter==="all"?" sel-def":""}" data-rtype="all">Alle</button>
            <button class="tool-btn${a.releasesFilter==="album"?" sel-def":""}" data-rtype="album">Albums</button>
            <button class="tool-btn${a.releasesFilter==="single"?" sel-def":""}" data-rtype="single">Singles</button>
            <button class="tool-btn${a.releasesFilter==="ep"?" sel-def":""}" data-rtype="ep">EP's</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn${a.releasesSort==="listening"?" sel-def":""}" data-rsort="listening">Op luistergedrag</button>
            <button class="tool-btn${a.releasesSort==="date"?" sel-def":""}" data-rsort="date">Op datum</button>
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
            <button class="tool-btn${a.discFilter==="all"?" sel-def":""}" data-dfilter="all">Alle artiesten</button>
            <button class="tool-btn${a.discFilter==="new"?" sel-new":""}" data-dfilter="new">\u2726 Nieuw voor mij</button>
            <button class="tool-btn${a.discFilter==="partial"?" sel-miss":""}" data-dfilter="partial">\u25B6 Gedeeltelijk in Plex</button>
            <span class="toolbar-sep"></span>
            <button class="tool-btn refresh-btn" id="btn-ref-discover-ontdek">\u21BB</button>
          </div>
        </div>
        <div class="section-collapsed-preview" id="sec-discover-preview"></div>
        <div class="section-content" id="sec-discover-content">
          <div class="loading"><div class="spinner"></div>Laden...</div>
        </div>
      </div>
    </div>`,I.style.opacity="1",I.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{Q("recs"),await H(document.getElementById("sec-recs-content"),Ie)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{a.lastReleases=null,Q("releases");try{await k("/api/releases/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await H(document.getElementById("sec-releases-content"),te)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{a.lastDiscover=null,Q("discover");try{await k("/api/discover/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await H(document.getElementById("sec-discover-content"),se)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{a.activeMood=null,document.querySelectorAll(".mood-btn").forEach(t=>t.classList.remove("sel-mood","loading")),ae(),ie()});{let t=document.getElementById("sec-recs-content");a.sectionContainerEl=t,await Ie(),a.sectionContainerEl===t&&(a.sectionContainerEl=null)}(async()=>{try{if(!a.lastReleases){let s=await g("/api/releases");if(s.status==="building")return;a.lastReleases=s.releases||[],a.newReleaseIds=new Set(s.newReleaseIds||[]),It(s.newCount||0)}let t=document.getElementById("sec-releases-preview");if(t&&a.lastReleases.length){let s=a.lastReleases;a.releasesFilter!=="all"&&(s=a.lastReleases.filter(d=>(d.type||"album").toLowerCase()===a.releasesFilter)),a.releasesSort==="listening"?s=[...s].sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)||new Date(c.releaseDate)-new Date(d.releaseDate)):s=[...s].sort((d,c)=>new Date(c.releaseDate)-new Date(d.releaseDate));let i=s.slice(0,8);t.innerHTML=`<div class="collapsed-thumbs">${i.map(d=>d.image?`<div class="collapsed-thumb">
              <img src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(d.album)}">${v(d.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${b(d.album)}"><span class="collapsed-thumb-ph">${v(d.album)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`;let n=document.getElementById("hdr-title-releases");n&&(n.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${s.length} release${s.length!==1?"s":""}`)}}catch{}})(),ue(document.getElementById("sec-releases-content"),()=>{let t=document.getElementById("sec-releases-content");return H(t,te)}),(async()=>{try{if(!a.lastDiscover){let n=await g("/api/discover");if(n.status==="building")return;a.lastDiscover=n,n.plexConnected&&(a.plexOk=!0)}let{artists:t}=a.lastDiscover;if(!t?.length)return;let s=t;a.discFilter==="new"&&(s=t.filter(n=>!n.inPlex)),a.discFilter==="partial"&&(s=t.filter(n=>n.inPlex&&n.missingCount>0));let i=document.getElementById("sec-discover-preview");if(i&&s.length){let n=s.slice(0,8);i.innerHTML=`<div class="collapsed-thumbs">${n.map(c=>c.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${o(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(c.name)}">${v(c.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(c.name)}"><span class="collapsed-thumb-ph">${v(c.name)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-discover");d&&(d.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${s.length} artiesten`)}}catch{}})(),ue(document.getElementById("sec-discover-content"),()=>{let t=document.getElementById("sec-discover-content");return H(t,se)}),Ve("recs","recs"),Ve("releases","releases"),Ve("discover","discover")}ne();var Ae=null;function qe(){Ae&&(clearInterval(Ae),Ae=null)}async function Je(){let e=document.getElementById("plex-np-wrap");try{let t=await fetch("/api/plex/nowplaying").then(s=>s.json());e.innerHTML=t.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${o(t.track)}</div>
           <div class="card-sub">${o(t.artist)}${t.album?" \xB7 "+o(t.album):""}</div></div></div>`:""}catch{e.innerHTML=""}}function Pt(e){return{"nu-luisteren":"\u{1F3B6} Nu luisteren","recente-nummers":"\u{1F550} Recente nummers","nieuwe-releases":"\u{1F4BF} Nieuwe releases deze week","download-voortgang":"\u2B07 Download-voortgang","vandaag-cijfers":"\u{1F4CA} Vandaag in cijfers",aanbeveling:"\u2728 Aanbeveling van de dag","collectie-stats":"\u{1F4C0} Collectie-stats"}[e]||e}var Ke=["nu-luisteren","recente-nummers","nieuwe-releases","download-voortgang","vandaag-cijfers","aanbeveling","collectie-stats"];function Mt(){let e=null,t=[];try{e=JSON.parse(localStorage.getItem("dashWidgetOrder"))}catch{}try{t=JSON.parse(localStorage.getItem("dashWidgetHidden"))||[]}catch{}let i=(Array.isArray(e)&&e.length?e:Ke).filter(l=>Ke.includes(l)&&!t.includes(l)),n=Ke.map(l=>`<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${o(l)}"${t.includes(l)?"":" checked"}>
      ${o(Pt(l))}
    </label>`).join(""),d=i.map(l=>`<div class="widget-card" id="widget-${o(l)}" data-widget="${o(l)}">
      <div class="widget-hdr"><span class="widget-title">${o(Pt(l))}</span></div>
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
    <div class="widget-grid" id="widget-grid">${d}</div>`;a.sectionContainerEl=null,I.innerHTML=c,requestAnimationFrame(()=>{Promise.allSettled([zt(),us(),ps(),ms(),vs(),bs(),gs()]),document.getElementById("dash-customize-btn")?.addEventListener("click",()=>{let l=document.getElementById("dash-customize-panel");l&&(l.style.display=l.style.display==="none"?"":"none")}),document.querySelectorAll(".dash-widget-cb").forEach(l=>{l.addEventListener("change",()=>{let r=[];document.querySelectorAll(".dash-widget-cb").forEach(u=>{u.checked||r.push(u.dataset.widget)}),localStorage.setItem("dashWidgetHidden",JSON.stringify(r)),Mt()})})})}function Y(e,t){let s=document.getElementById("wbody-"+e);s&&(s.innerHTML=`<div class="widget-error">\u26A0 ${o(t||"Niet beschikbaar")}</div>`)}async function zt(){let e=document.getElementById("wbody-nu-luisteren");if(!e||a.activeTab!=="nu")return;let t=a.tabAbort?.signal;try{let s=B("recent",6e4),i=s!==null,[n,d]=await Promise.allSettled([fetch("/api/plex/nowplaying",{signal:t}).then(l=>l.json()),i?Promise.resolve(s):Z("/api/recent")]);if(t?.aborted)return;!i&&d.status==="fulfilled"&&C("recent",d.value);let c="";if(n.status==="fulfilled"&&n.value?.playing){let l=n.value,r=!!F(),u=l.ratingKey||"";c+=`<div class="w-np-row">
        <div class="w-np-dot plex"></div>
        <div class="w-np-info">
          <div class="w-np-title">${o(l.track)}</div>
          <div class="w-np-sub">${o(l.artist)}${l.album?" \xB7 "+o(l.album):""}</div>
          <span class="badge plex" style="font-size:10px">\u25B6 Plex</span>
        </div>
        ${r?`<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="prev" title="Vorige">\u23EE</button>
          <button class="plex-ctrl-btn" data-plex-action="pause" title="Pauze/Hervat">\u23F8</button>
          <button class="plex-ctrl-btn" data-plex-action="next" title="Volgende">\u23ED</button>
        </div>`:`<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="zone" title="Selecteer zone">\u{1F50A}</button>
        </div>`}
      </div>`}if(d.status==="fulfilled"){let r=(d.value.recenttracks?.track||[]).find(u=>u["@attr"]?.nowplaying);if(r){let u=r.artist?.["#text"]||"",y=O(r.image,"medium");c+=`<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${y?`<img class="w-np-img" src="${o(y)}" alt="" loading="lazy">`:""}
          <div class="w-np-info">
            <div class="w-np-title">${o(r.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${o(u)}">${o(u)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">\u25CF Last.fm</span>
          </div>
        </div>`}}e.innerHTML=c||'<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>',e.querySelectorAll("[data-plex-action]").forEach(l=>{l.addEventListener("click",async()=>{let r=l.dataset.plexAction;if(r==="pause")be();else if(r==="next")J("next");else if(r==="prev")J("prev");else if(r==="zone"){let{toggleZonePicker:u}=await Promise.resolve().then(()=>(ne(),qt));u()}})})}catch(s){if(s.name==="AbortError")return;Y("nu-luisteren",s.message)}}async function us(){let e=document.getElementById("wbody-recente-nummers");if(!e)return;let t=a.tabAbort?.signal;try{let s=B("recent",6e4);if(!s){if(s=await Z("/api/recent"),t?.aborted)return;C("recent",s)}let i=(s.recenttracks?.track||[]).filter(n=>!n["@attr"]?.nowplaying).slice(0,8);if(!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen recente nummers</div>';return}e.innerHTML=`<div class="w-track-list">${i.map(n=>{let d=n.artist?.["#text"]||"",c=n.date?.uts?re(parseInt(n.date.uts)):"";return`<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${o(n.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${o(d)}">${o(d)}</div>
        </div>
        <span class="w-track-ago">${c}</span>
      </div>`}).join("")}</div>`}catch(s){if(s.name==="AbortError")return;Y("recente-nummers",s.message)}}async function ps(){let e=document.getElementById("wbody-nieuwe-releases");if(!e)return;let t=a.tabAbort?.signal;try{let s=a.lastReleases;if(!s){let d=await g("/api/releases",{signal:t});if(t?.aborted)return;if(d.status==="building"){e.innerHTML='<div class="empty" style="font-size:12px">Releases worden geladen\u2026</div>';return}s=d.releases||[]}let i=Date.now()-168*3600*1e3,n=s.filter(d=>d.releaseDate&&new Date(d.releaseDate).getTime()>i).sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)).slice(0,3);if(!n.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen releases deze week</div>';return}e.innerHTML=`<div class="w-releases-list">${n.map(d=>`<div class="w-rel-row">
        <div class="w-rel-cover">${d.image?`<img class="w-rel-img" src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="w-rel-ph" style="background:${b(d.album)}">${v(d.album)}</div>`}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${o(d.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${o(d.artist)}">${o(d.artist)}</div>
        </div>
        ${N(d.artist,d.album,d.inPlex)}
      </div>`).join("")}</div>`}catch(s){if(s.name==="AbortError")return;Y("nieuwe-releases",s.message)}}async function ms(){let e=document.getElementById("wbody-download-voortgang");if(!e)return;if(!a.tidarrOk){e.innerHTML='<div class="widget-error">\u26A0 Tidarr offline</div>';return}let t=a.tabAbort?.signal;try{let s=await g("/api/tidarr/queue",{signal:t});if(t?.aborted)return;let i=(s.items||a.tidarrQueueItems||[]).filter(n=>n.status!=="finished"&&n.status!=="error");Fe(e,i)}catch(s){if(s.name==="AbortError")return;Y("download-voortgang","Tidarr niet bereikbaar")}}async function vs(){let e=document.getElementById("wbody-vandaag-cijfers");if(!e)return;let t=a.tabAbort?.signal;try{let s=B("recent",6e4);if(!s){if(s=await Z("/api/recent"),t?.aborted)return;C("recent",s)}let i=s.recenttracks?.track||[],n=new Date().toDateString(),d=i.filter(u=>u.date?.uts&&new Date(parseInt(u.date.uts)*1e3).toDateString()===n),c=new Set(d.map(u=>u.artist?.["#text"])).size,l={};for(let u of d){let y=u.artist?.["#text"]||"";l[y]=(l[y]||0)+1}let r=Object.entries(l).sort((u,y)=>y[1]-u[1])[0];e.innerHTML=`<div class="w-stats-grid">
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
    </div>`}catch(s){if(s.name==="AbortError")return;Y("vandaag-cijfers",s.message)}}async function bs(){let e=document.getElementById("wbody-aanbeveling");if(!e)return;let t=a.tabAbort?.signal;try{let s=B("recs",3e5);if(!s){if(s=await Z("/api/recs"),t?.aborted)return;C("recs",s)}let i=s.recommendations||[];if(a.lastRecs=s,!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen aanbevelingen</div>';return}let n=Math.floor(Date.now()/864e5),d=i[n%i.length],c=null;try{c=await g(`/api/artist/${encodeURIComponent(d.name)}/info`,{signal:t})}catch{}let l=c?.image?T(c.image,80)||c.image:null,r=(c?.albums||[]).slice(0,3);e.innerHTML=`<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${l?`<img class="w-rec-img" src="${o(l)}" alt="" loading="lazy">`:`<div class="w-rec-ph" style="background:${b(d.name)}">${v(d.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${o(d.name)}">${o(d.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${o(d.reason)}</div>
          ${de(d.inPlex)}
          ${_("artist",d.name,"",c?.image||"")}
        </div>
      </div>
      ${r.length?`<div class="w-rec-albums">${r.map(u=>`<span class="w-rec-album">${o(u.name)}</span>`).join("")}</div>`:""}
    </div>`}catch(s){if(s.name==="AbortError")return;Y("aanbeveling",s.message)}}async function gs(){let e=document.getElementById("wbody-collectie-stats");if(!e)return;let t=a.tabAbort?.signal;try{let s=await g("/api/plex/status",{signal:t});if(t?.aborted)return;if(!s.connected){e.innerHTML='<div class="empty" style="font-size:12px">Plex offline</div>';return}let i=0;a.lastGaps?.artists&&(i=a.lastGaps.artists.reduce((n,d)=>n+(d.missingCount||0),0)),e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${P(s.artists||0)}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${P(s.albums||0)}</div>
        <div class="w-stat-lbl">albums</div>
      </div>
      ${i?`<div class="w-stat-block">
        <div class="w-stat-val">${i}</div>
        <div class="w-stat-lbl">ontbreekt</div>
      </div>`:""}
    </div>`}catch(s){if(s.name==="AbortError")return;Y("collectie-stats",s.message)}}async function Dt(){let e=a.tabAbort?.signal;try{let t=B("recent",6e4);if(!t){if(t=await g("/api/recent",{signal:e}),e?.aborted)return;C("recent",t)}let s=t.recenttracks?.track||[];if(!s.length){setContent('<div class="empty">Geen recente nummers.</div>');return}let i='<div class="card-list">';for(let n of s){let d=n["@attr"]?.nowplaying,c=n.date?.uts?re(parseInt(n.date.uts)):"",l=n.artist?.["#text"]||"",r=O(n.image),u=r?`<img class="card-img" src="${o(r)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>';d?i+=`<div class="now-playing">${u}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${o(n.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(l)}">${o(l)}</div></div></div>`:i+=`<div class="card">${u}<div class="card-info">
          <div class="card-title">${o(n.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(l)}">${o(l)}</div>
          </div><div class="card-meta">${c}</div>
          <button class="play-btn" data-artist="${o(l)}" data-track="${o(n.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}setContent(i+"</div>")}catch(t){if(t.name==="AbortError")return;setContent(`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`)}}function Pe(){a.activeSubTab=null,j(),qe(),Mt(),setTimeout(()=>{a.activeTab==="nu"&&(Ae=setInterval(()=>{if(a.activeTab!=="nu"){qe();return}zt()},3e4))},500)}ne();async function Rt(e,t,s){if(a.previewBtn===e){a.previewAudio.paused?(await a.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(a.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(a.previewBtn){a.previewAudio.pause(),a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing");let i=a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}a.previewBtn=e,e.textContent="\u2026",e.disabled=!0;try{let i=new URLSearchParams({artist:t,track:s}),n=await g(`/api/preview?${i}`);if(!n.preview){e.textContent="\u2014",e.disabled=!1,setTimeout(()=>{e.textContent==="\u2014"&&(e.textContent="\u25B6")},1800),a.previewBtn=null;return}a.previewAudio.src=n.preview,a.previewAudio.currentTime=0,await a.previewAudio.play(),e.textContent="\u23F8",e.disabled=!1,e.classList.add("playing")}catch{e.textContent="\u25B6",e.disabled=!1,a.previewBtn=null}}a.previewAudio.addEventListener("timeupdate",()=>{if(!a.previewBtn||!a.previewAudio.duration)return;let e=a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width=`${(a.previewAudio.currentTime/a.previewAudio.duration*100).toFixed(1)}%`)});a.previewAudio.addEventListener("ended",()=>{if(a.previewBtn){a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing");let e=a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width="0%"),a.previewBtn=null}});document.addEventListener("visibilitychange",()=>{document.hidden&&!a.previewAudio.paused&&(a.previewAudio.pause(),a.previewBtn&&(a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing")))});async function fs(e){let t=document.getElementById("search-results");if(e.length<2){t.classList.remove("open");return}try{let s=await g(`/api/search?q=${encodeURIComponent(e)}`);s.results?.length?t.innerHTML=s.results.map(i=>{let n=T(i.image,56)||i.image,d=n?`<img class="search-result-img" src="${o(n)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${b(i.name)};display:none">${v(i.name)}</div>`:`<div class="search-result-ph" style="background:${b(i.name)}">${v(i.name)}</div>`,c=i.listeners?`${P(i.listeners)} luisteraars`:"";return`<button class="search-result-item" data-artist="${o(i.name)}">
          ${d}
          <div><div class="search-result-name">${o(i.name)}</div>
          ${c?`<div class="search-result-sub">${c}</div>`:""}</div>
        </button>`}).join(""):t.innerHTML='<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>',t.classList.add("open")}catch{}}document.getElementById("search-input").addEventListener("input",e=>{clearTimeout(a.searchTimeout);let t=e.target.value.trim();if(!t){document.getElementById("search-results").classList.remove("open");return}a.searchTimeout=setTimeout(()=>fs(t),320)});document.addEventListener("click",e=>{e.target.closest("#search-wrap")||document.getElementById("search-results").classList.remove("open")});ne();var le=null,ys=null,V="artist",X="",hs=null,ge=null,fe=210,Ht=3;function jt(){let e=window.innerWidth;return e>=1400?6:e>=1e3?5:e>=800?4:e>=640?3:2}async function et(){if(le)return le;let e=await g("/api/plex/library/all");return!e.ok||!e.library?.length?[]:(le=e.library.map(([t,s,i,n])=>({artist:t,album:s,ratingKey:i,thumb:n})),le)}function ws(){let e=le||[],t=X.toLowerCase().trim();return t&&(e=e.filter(s=>s.artist.toLowerCase().includes(t)||s.album.toLowerCase().includes(t))),V==="artist"?e=[...e].sort((s,i)=>s.artist.localeCompare(i.artist,"nl",{sensitivity:"base"})||s.album.localeCompare(i.album,"nl",{sensitivity:"base"})):V==="recent"&&(e=[...e].reverse()),ys=e,e}function $s(e){let t=new Map;for(let s of e){let i=(s.artist[0]||"#").toUpperCase(),n=/[A-Z]/.test(i)?i:"#";t.has(n)||t.set(n,[]),t.get(n).push(s)}return t}function xs(e){let t=e.thumb?T(e.thumb,240):null,s=t?`<img src="${o(t)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${b(e.album)}">${v(e.album)}</div>`:`<div class="blib-cover-ph" style="background:${b(e.album)}">${v(e.album)}</div>`;return`<div class="blib-album"
    data-rating-key="${o(e.ratingKey)}"
    data-album="${o(e.album)}"
    data-artist="${o(e.artist)}"
    data-thumb="${o(e.thumb||"")}">
    <div class="blib-cover">
      ${s}
      <div class="blib-play-overlay"><button class="blib-play-btn" title="Afspelen">\u25B6</button></div>
    </div>
    <div class="blib-album-title" title="${o(e.album)}">${o(e.album)}</div>
    <div class="blib-album-artist">${o(e.artist)}</div>
  </div>`}var Ye=class{constructor(t,s){this.container=t,this.items=s,this.cols=jt(),this.lastStart=-1,this.lastEnd=-1,this.useGroups=V==="artist"&&!X,this.groups=this.useGroups?$s(s):null,this.flatRows=this._buildFlatRows(),this._createDOM(),this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),window.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let t=[],s=0;if(this.groups)for(let[i,n]of this.groups){t.push({type:"header",letter:i,height:62,offset:s}),s+=62;for(let d=0;d<n.length;d+=this.cols)t.push({type:"albums",items:n.slice(d,d+this.cols),height:fe,offset:s}),s+=fe}else for(let i=0;i<this.items.length;i+=this.cols)t.push({type:"albums",items:this.items.slice(i,i+this.cols),height:fe,offset:s}),s+=fe;return this.totalHeight=s,t}_createDOM(){this.container.innerHTML=`<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".blib-virtual-window")}_onScroll(){this.render()}_onResize(){let t=jt();if(t!==this.cols){this.cols=t,this.flatRows=this._buildFlatRows();let s=this.container.querySelector(".blib-virtual-container");s&&(s.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let t=window.scrollY||document.documentElement.scrollTop,s=this.container.getBoundingClientRect().top+t,i=t-s,n=window.innerHeight,d=Ht*fe,c=0,l=this.flatRows.length-1;for(let u=0;u<this.flatRows.length;u++){let y=this.flatRows[u];if(y.offset+y.height>=i-d){c=Math.max(0,u-Ht);break}}for(let u=c;u<this.flatRows.length;u++)if(this.flatRows[u].offset>i+n+d){l=u;break}if(c===this.lastStart&&l===this.lastEnd)return;this.lastStart=c,this.lastEnd=l;let r="";for(let u=c;u<=l&&u<this.flatRows.length;u++){let y=this.flatRows[u];if(y.type==="header")r+=`<div class="blib-letter-header" style="height:${y.height}px;box-sizing:border-box">${o(y.letter)}</div>`;else{r+='<div class="blib-grid">';for(let p of y.items)r+=xs(p);r+="</div>"}}this.winEl.style.top=(this.flatRows[c]?.offset||0)+"px",this.winEl.innerHTML=r}destroy(){window.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(t){for(let s of this.flatRows)if(s.type==="header"&&s.letter===t){let i=this.container.getBoundingClientRect().top+window.scrollY+s.offset-120;window.scrollTo({top:i,behavior:"smooth"});return}}getAvailableLetters(){return new Set(this.flatRows.filter(t=>t.type==="header").map(t=>t.letter))}};function Es(e){let t=document.getElementById("blib-az-rail");if(!t)return;let s=e.getAvailableLetters();t.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(i=>`<button class="blib-az-btn${s.has(i)?"":" disabled"}" data-letter="${i}">${i}</button>`).join(""),t.addEventListener("click",i=>{let n=i.target.closest(".blib-az-btn");n&&!n.classList.contains("disabled")&&e.scrollToLetter(n.dataset.letter)})}function ks(e){let t=document.getElementById("blib-detail-overlay");t||(t=document.createElement("div"),t.id="blib-detail-overlay",t.className="blib-detail-overlay",document.body.appendChild(t));let s=e.thumb?T(e.thumb,320):null,i=s?`<img src="${o(s)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${b(e.album)}">${v(e.album)}</div>`:`<div class="blib-detail-cover-ph" style="background:${b(e.album)}">${v(e.album)}</div>`;t.innerHTML=`
    <div class="blib-detail-panel">
      <button class="blib-detail-close" id="blib-detail-close">\u2715</button>
      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${i}</div>
        <div class="blib-detail-info">
          <div class="blib-detail-title">${o(e.album)}</div>
          <div class="blib-detail-artist">${o(e.artist)}</div>
          <button class="blib-detail-play-all" id="blib-detail-play-all">\u25B6 Alles afspelen</button>
        </div>
      </div>
      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>`,t.classList.add("open"),document.body.style.overflow="hidden",t.querySelector("#blib-detail-close").addEventListener("click",Ot),t.addEventListener("click",n=>{n.target===t&&Ot()}),t.querySelector("#blib-detail-play-all").addEventListener("click",()=>{e.ratingKey&&(K(e.ratingKey,"music"),Xe(e))}),e.ratingKey&&g(`/api/plex/album/${encodeURIComponent(e.ratingKey)}/tracks`).then(n=>{let d=document.getElementById("blib-tracklist");if(!d)return;let c=n.tracks||[];if(!c.length){d.innerHTML='<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';return}d.innerHTML=c.map((l,r)=>{let u=l.duration?Math.floor(l.duration/1e3):0,y=Math.floor(u/60),p=String(u%60).padStart(2,"0");return`<div class="blib-track-row"
              data-track-key="${o(l.ratingKey||"")}"
              data-track-title="${o(l.title||"")}">
            <div class="blib-track-num"><span>${r+1}</span></div>
            <div class="blib-track-title">${o(l.title||"")}</div>
            ${u?`<div class="blib-track-duration">${y}:${p}</div>`:""}
          </div>`}).join(""),d.addEventListener("click",l=>{let r=l.target.closest(".blib-track-row");r?.dataset.trackKey&&(K(r.dataset.trackKey,"music"),Xe(e))})}).catch(()=>{let n=document.getElementById("blib-tracklist");n&&(n.innerHTML='<div class="blib-empty"><p>Tracks laden mislukt.</p></div>')})}function Ot(){let e=document.getElementById("blib-detail-overlay");e&&e.classList.remove("open"),document.body.style.overflow=""}function _t(){if(!document.getElementById("blib-player")){let e=document.createElement("div");e.id="blib-player",e.className="blib-player",document.body.appendChild(e)}}function Xe(e){hs=e,_t();let t=document.getElementById("blib-player"),s=e.thumb?T(e.thumb,80):null,i=s?`<img src="${o(s)}" alt="" onerror="this.style.display='none'">`:`<div style="width:44px;height:44px;border-radius:6px;background:${b(e.album)};
         display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">
         ${v(e.album)}</div>`;t.innerHTML=`
    <div class="blib-player-progress"><div class="blib-player-progress-fill" id="blib-progress-fill"></div></div>
    <div class="blib-player-cover">${i}</div>
    <div class="blib-player-info">
      <div class="blib-player-title">${o(e.album)}</div>
      <div class="blib-player-artist">${o(e.artist)}</div>
    </div>
    <div class="blib-player-controls">
      <button class="blib-ctrl-btn" id="blib-prev" title="Vorige">\u23EE</button>
      <button class="blib-ctrl-btn primary" id="blib-pause" title="Pauze">\u23F8</button>
      <button class="blib-ctrl-btn" id="blib-next" title="Volgende">\u23ED</button>
    </div>`,t.classList.add("visible"),t.querySelector("#blib-prev").addEventListener("click",()=>J("prev")),t.querySelector("#blib-next").addEventListener("click",()=>J("next")),t.querySelector("#blib-pause").addEventListener("click",()=>be())}function Ls(e){let t=document.getElementById("blib-count");t&&(t.textContent=`${P(e)} albums`)}async function ye(e){ge&&(ge.destroy(),ge=null);let t=ws();if(Ls(t.length),!t.length){e.innerHTML=`
      <div class="blib-empty">
        <div class="blib-empty-icon">\u{1F3B5}</div>
        <h3>Geen albums gevonden</h3>
        <p>${X?`Geen resultaten voor "<strong>${o(X)}</strong>"`:"Plex bibliotheek is leeg of nog niet gesynchroniseerd."}</p>
      </div>`;return}if(ge=new Ye(e,t),V==="artist"&&!X)Es(ge);else{let s=document.getElementById("blib-az-rail");s&&(s.innerHTML="")}}function Ss(){return`
    <div class="blib-toolbar">
      <input class="blib-search" id="blib-search" type="text"
        placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off"
        value="${o(X)}">
      <button class="blib-pill${V==="artist"?" active":""}" data-sort="artist">Artiest A\u2013Z</button>
      <button class="blib-pill${V==="recent"?" active":""}" data-sort="recent">Recent</button>
      <span class="blib-count" id="blib-count"></span>
      <button class="tool-btn" id="btn-sync-plex-blib" style="margin-left:8px">\u21BB Sync Plex</button>
    </div>
    <div class="blib-az-rail" id="blib-az-rail"></div>`}function Is(e){document.getElementById("blib-search")?.addEventListener("input",t=>{X=t.target.value,ye(e)}),document.querySelectorAll(".blib-pill").forEach(t=>{t.addEventListener("click",()=>{V=t.dataset.sort,document.querySelectorAll(".blib-pill").forEach(s=>s.classList.toggle("active",s.dataset.sort===V)),ye(e)})}),document.getElementById("btn-sync-plex-blib")?.addEventListener("click",async()=>{let t=document.getElementById("btn-sync-plex-blib"),s=t.textContent;t.disabled=!0,t.textContent="\u21BB Bezig\u2026";try{try{await k("/api/plex/refresh",{method:"POST"})}catch(i){if(i.name!=="AbortError")throw i}await W(),le=null,await et(),ye(e)}catch{}finally{t.disabled=!1,t.textContent=s}})}function Nt(e,t){return""}function Gt(e){let t=e.target.closest(".blib-play-btn");if(t){e.stopPropagation();let i=t.closest(".blib-album");return i?.dataset.ratingKey&&(K(i.dataset.ratingKey,"music"),Xe({ratingKey:i.dataset.ratingKey,album:i.dataset.album,artist:i.dataset.artist,thumb:i.dataset.thumb})),!0}let s=e.target.closest(".blib-album");return s?.dataset.ratingKey?(ks({ratingKey:s.dataset.ratingKey,album:s.dataset.album,artist:s.dataset.artist,thumb:s.dataset.thumb}),!0):!1}async function tt(){try{await et();let e=document.getElementById("bib-sub-content");e&&a.bibSubTab==="collectie"&&ye(e)}catch(e){e.name!=="AbortError"&&M(e.message)}}async function Ft(e){a.bibSubTab=e;let t=document.getElementById("bib-sub-content"),s=document.getElementById("bib-subtoolbar");if(t){if(document.querySelectorAll(".bib-tab").forEach(i=>i.classList.toggle("active",i.dataset.bibtab===e)),e==="collectie"){if(a.activeSubTab="collectie",s&&(s.innerHTML=Ss(),Is(t)),!document.getElementById("blib-detail-overlay")){let i=document.createElement("div");i.id="blib-detail-overlay",i.className="blib-detail-overlay",document.body.appendChild(i)}_t(),t.innerHTML='<div class="loading"><div class="spinner"></div>Bibliotheek laden\u2026</div>';try{await et(),await ye(t)}catch(i){i.name!=="AbortError"&&M(i.message)}}else if(e==="lijst"){a.activeSubTab="lijst",s&&(s.innerHTML="");let i=t;a.sectionContainerEl=i;try{await me()}finally{a.sectionContainerEl===i&&(a.sectionContainerEl=null)}}}}async function st(){a.activeSubTab="collectie",j(),I.innerHTML=`
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${oe(a.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${oe(a.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-tracks-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="bib-subtabs" id="bib-subtabs">
        <button class="bib-tab${a.bibSubTab==="collectie"?" active":""}" data-bibtab="collectie">Collectie</button>
        <button class="bib-tab${a.bibSubTab==="lijst"?" active":""}" data-bibtab="lijst">Lijst</button>
      </div>

      <div id="bib-subtoolbar"></div>
      <div class="blib-wrap">
        <div class="bib-sub-content" id="bib-sub-content">
          <div class="loading"><div class="spinner"></div>Laden\u2026</div>
        </div>
      </div>

      <div class="section-block" style="margin-top:32px">
        <div class="section-hdr">
          <span class="section-hdr-title">Statistieken</span>
        </div>
        <div class="section-content" id="bib-stats-content">
          <div class="loading"><div class="spinner"></div>Laden\u2026</div>
        </div>
      </div>
    </div>`,I.style.opacity="1",I.style.transform="",document.querySelectorAll(".bib-tab").forEach(e=>e.addEventListener("click",()=>Ft(e.dataset.bibtab))),await Promise.all([H(document.getElementById("strip-artists-body"),()=>at(a.currentPeriod)),H(document.getElementById("strip-tracks-body"),()=>it(a.currentPeriod))]),await Ft(a.bibSubTab),ue(document.getElementById("bib-stats-content"),()=>{let e=document.getElementById("bib-stats-content");return H(e,nt)})}async function at(e){z();let t=a.tabAbort?.signal;try{let s=`topartists:${e}`,i=B(s,300*1e3);if(!i){if(i=await g(`/api/topartists?period=${e}`,{signal:t}),t?.aborted)return;C(s,i)}let n=i.topartists?.artist||[];if(!n.length){x('<div class="empty">Geen data.</div>');return}let d=parseInt(n[0]?.playcount||1),c=`<div class="section-title">Top artiesten \xB7 ${oe(e)}</div><div class="artist-grid">`;for(let l=0;l<n.length;l++){let r=n[l],u=Math.round(parseInt(r.playcount)/d*100),y=O(r.image,"large")||O(r.image),p=T(y,120)||y,f=p?`<img src="${p}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${b(r.name,!0)}">${v(r.name)}</div>`:`<div class="ag-photo-ph" style="background:${b(r.name,!0)}">${v(r.name)}</div>`;c+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${l}" style="view-transition-name: artist-${$e(r.name)}">${f}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${o(r.name)}">${o(r.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${u}%"></div></div>
          <div class="ag-plays">${P(r.playcount)} plays</div>
        </div></div>`}x(c+"</div>"),await rt(n.map((l,r)=>async()=>{try{let u=await g(`/api/artist/${encodeURIComponent(l.name)}/info`);if(u.image){let y=document.getElementById(`agp-${r}`);y&&(y.innerHTML=`<img src="${T(u.image,120)||u.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}}),4)}catch(s){if(s.name==="AbortError")return;M(s.message)}}async function it(e){z();let t=a.tabAbort?.signal;try{let s=`toptracks:${e}`,i=B(s,300*1e3);if(!i){if(i=await g(`/api/toptracks?period=${e}`,{signal:t}),t?.aborted)return;C(s,i)}let n=i.toptracks?.track||[];if(!n.length){x('<div class="empty">Geen data.</div>');return}let d=parseInt(n[0]?.playcount||1),c=`<div class="section-title">Top nummers \xB7 ${oe(e)}</div><div class="card-list">`;for(let l of n){let r=Math.round(parseInt(l.playcount)/d*100);c+=`<div class="card">${Re(l.image)}<div class="card-info">
        <div class="card-title">${o(l.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(l.artist?.name||"")}">${o(l.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${r}%"></div></div>
        </div><div class="card-meta">${P(l.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${o(l.artist?.name||"")}" data-track="${o(l.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}x(c+"</div>")}catch(s){if(s.name==="AbortError")return;M(s.message)}}async function Vt(){z();let e=a.tabAbort?.signal;try{let t=B("loved",6e5);if(!t){if(t=await g("/api/loved",{signal:e}),e?.aborted)return;C("loved",t)}let s=t.lovedtracks?.track||[];if(!s.length){x('<div class="empty">Geen geliefde nummers.</div>');return}let i='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let n of s){let d=n.date?.uts?re(parseInt(n.date.uts)):"";i+=`<div class="card">${Re(n.image)}<div class="card-info">
        <div class="card-title">${o(n.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(n.artist?.name||"")}">${o(n.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${d}</div>
        <button class="play-btn" data-artist="${o(n.artist?.name||"")}" data-track="${o(n.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}x(i+"</div>")}catch(t){if(t.name==="AbortError")return;M(t.message)}}async function nt(){z("Statistieken ophalen...");let e=a.tabAbort?.signal;try{let t=B("stats",6e5);if(!t){if(t=await g("/api/stats",{signal:e}),e?.aborted)return;C("stats",t)}x(`
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
      </div>`,()=>Ts(t))}catch(t){if(t.name==="AbortError")return;M(t.message)}}function Ts(e){if(typeof Chart>"u")return;let t=!window.matchMedia("(prefers-color-scheme: light)").matches,s=t?"#2c2c2c":"#ddd",i=t?"#888":"#777",n=t?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=s;let d=document.getElementById("chart-daily");d&&new Chart(d,{type:"bar",data:{labels:e.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:e.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:s},ticks:{color:i},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&e.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:e.topArtists.map(r=>r.name),datasets:[{data:e.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:s},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:n,font:{size:11}}}}}});let l=document.getElementById("chart-genres");if(l&&e.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(l,{type:"doughnut",data:{labels:e.genres.map(u=>u.name),datasets:[{data:e.genres.map(u=>u.count),backgroundColor:r.slice(0,e.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function he(){z("Collectiegaten zoeken...");let e=a.tabAbort?.signal;try{let t=await g("/api/gaps",{signal:e});if(e?.aborted)return;if(t.status==="building"&&(!t.artists||!t.artists.length)){x(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{a.activeSubTab==="gaten"&&he()},2e4);return}if(a.lastGaps=t,we(),t.builtAt&&Date.now()-t.builtAt>864e5){let s=document.createElement("div");s.className="refresh-banner",s.textContent="\u21BB Gaps worden op de achtergrond ververst...";let i=a.sectionContainerEl||document.getElementById("content");i&&i.prepend(s),fetch("/api/gaps/refresh",{method:"POST"}).catch(()=>{})}}catch(t){if(t.name==="AbortError")return;M(t.message)}}function we(){if(!a.lastGaps)return;let e=[...a.lastGaps.artists||[]];if(!e.length){x('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}a.gapsSort==="missing"&&e.sort((i,n)=>n.missingAlbums.length-i.missingAlbums.length),a.gapsSort==="name"&&e.sort((i,n)=>i.name.localeCompare(n.name));let t=e.reduce((i,n)=>i+n.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=t;let s=`<div class="section-title">${t} ontbrekende albums bij ${e.length} artiesten die je al hebt</div>`;for(let i of e){let n=Math.round(i.ownedCount/i.totalCount*100),d=[ee(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),c=T(i.image,56)||i.image,l=c?`<img class="gaps-photo" src="${o(c)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${b(i.name)}">${v(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${b(i.name)}">${v(i.name)}</div>`;s+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${l}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${o(i.name)}">${o(i.name)}</div>
              ${_("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${o(d)}</div>
            ${U(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let r of i.missingAlbums)s+=ce(r,!1,i.name);s+="</div>",i.allAlbums?.filter(r=>r.inPlex).length>0&&(s+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(r=>r.inPlex).map(r=>ce(r,!1,i.name)).join("")}
        </div>
      </details>`),s+="</div>"}x(s)}ne();function lt(e){let t=document.getElementById("panel-overlay"),s=document.getElementById("panel-content"),i=$e(e),n=()=>{s.innerHTML=`<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`,t.classList.add("open"),document.body.style.overflow="hidden"};document.startViewTransition?document.startViewTransition(n).finished.catch(()=>{}):n(),Promise.allSettled([g(`/api/artist/${encodeURIComponent(e)}/info`),g(`/api/artist/${encodeURIComponent(e)}/similar`)]).then(([d,c])=>{let l=d.status==="fulfilled"?d.value:{},r=c.status==="fulfilled"?c.value.similar||[]:[],u=T(l.image,400)||l.image,y=u?`<img src="${o(u)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${b(e)};display:none">${v(e)}</div>`:`<div class="panel-photo-ph" style="background:${b(e)}">${v(e)}</div>`,p=[l.country?ee(l.country)+" "+l.country:null,l.startYear?`Actief vanaf ${l.startYear}`:null,a.plexOk&&l.inPlex!==void 0?l.inPlex?"\u25B6 In Plex":"\u2726 Nieuw voor jou":null].filter(Boolean).join(" \xB7 "),f="";if(l.albums?.length){f='<div class="panel-section">Albums</div><div class="panel-albums">';for(let h of l.albums){let E=T(h.image,48)||h.image,A=E?`<img class="panel-album-img" src="${o(E)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="panel-album-ph">\u266A</div>',D=a.plexOk&&h.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6</span>':"",m=a.plexOk&&h.inPlex&&h.ratingKey?`<button class="plex-play-album-btn" data-rating-key="${o(h.ratingKey)}" title="Afspelen op Plex">\u25B6 Speel af</button>`:"";f+=`<div class="panel-album-row">${A}
          <span class="panel-album-name">${o(h.name)}</span>${D}${m}${N(e,h.name,h.inPlex)}</div>`}f+="</div>"}let w="";if(r.length){w='<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">';for(let h of r)w+=`<button class="panel-similar-chip artist-link" data-artist="${o(h.name)}">${o(h.name)}</button>`;w+="</div>"}s.innerHTML=`
      <div class="panel-photo-wrap" style="view-transition-name: artist-${i}">${y}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${o(e)}</div>
          ${_("artist",e,"",l.image||"")}
        </div>
        ${p?`<div class="panel-meta">${o(p)}</div>`:""}
        ${U(l.tags,6)}
        ${f}
        ${w}
      </div>`,s.querySelectorAll(".plex-play-album-btn").forEach(h=>{h.addEventListener("click",async E=>{E.stopPropagation();let A=h.dataset.ratingKey;if(A){h.disabled=!0,h.textContent="\u2026";let D=await K(A,"music");h.disabled=!1,h.textContent=D?"\u25B6 Speelt af":"\u25B6 Speel af",D&&setTimeout(()=>{h.textContent="\u25B6 Speel af"},3e3)}})})})}function Me(){document.getElementById("panel-overlay").classList.remove("open"),document.body.style.overflow=""}var ze={nu:()=>Pe(),ontdek:()=>ie(),bibliotheek:()=>st(),downloads:()=>kt(),discover:()=>se(),gaps:()=>he(),recent:()=>Dt(),recs:()=>Ie(),releases:()=>te(),topartists:()=>at(a.currentPeriod),toptracks:()=>it(a.currentPeriod),loved:()=>Vt(),stats:()=>nt(),wishlist:()=>me(),plexlib:()=>tt(),tidal:()=>Ge()};document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,s=document.querySelectorAll(".tab"),i=document.querySelector(".tab.active"),n=Array.from(s).indexOf(i),c=Array.from(s).indexOf(e)>n?"rtl":"ltr";if(document.documentElement.style.setProperty("--tab-direction",c==="ltr"?"-1":"1"),s.forEach(l=>l.classList.remove("active")),e.classList.add("active"),a.activeTab=t,a.sectionContainerEl=null,a.tabAbort&&a.tabAbort.abort(),a.tabAbort=new AbortController,["tb-period","tb-recs","tb-mood","tb-releases","tb-discover","tb-gaps","tb-plexlib","tb-tidarr-ui"].forEach(l=>document.getElementById(l)?.classList.remove("visible")),document.getElementById("tb-gaps")?.classList.toggle("visible",t==="gaps"),document.getElementById("tb-tidal")?.classList.toggle("visible",t==="downloads"),t!=="downloads"&&j(),t!=="downloads"&&void 0,t!=="nu"&&qe(),document.startViewTransition)document.startViewTransition(async()=>{try{await ze[t]?.()}catch(l){if(l.name==="AbortError")return;console.error("Tab load error:",l),I.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l.message}. Druk op R om opnieuw te proberen.</div>`}}).finished.catch(()=>{});else try{ze[t]?.()}catch(l){if(l.name==="AbortError")return;console.error("Tab load error:",l),I.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l.message}. Druk op R om opnieuw te proberen.</div>`}})});document.querySelectorAll("[data-period]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-period]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.currentPeriod=e.dataset.period,ze[a.activeTab]?.()})});document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-plex")),a.recsFilter=e.dataset.filter,e.classList.add(a.recsFilter==="all"?"sel-def":a.recsFilter==="new"?"sel-new":"sel-plex"),Be()})});document.querySelectorAll("[data-dfilter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-dfilter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-miss")),a.discFilter=e.dataset.dfilter,e.classList.add(a.discFilter==="all"?"sel-def":a.discFilter==="new"?"sel-new":"sel-miss"),ve()})});document.querySelectorAll("[data-gsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-gsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.gapsSort=e.dataset.gsort,we()})});document.querySelectorAll("[data-rtype]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rtype]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.releasesFilter=e.dataset.rtype,G()})});document.querySelectorAll("[data-rsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.releasesSort=e.dataset.rsort,G()})});document.getElementById("btn-refresh-releases")?.addEventListener("click",async()=>{a.lastReleases=null,Q("releases");try{await k("/api/releases/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}te()});document.getElementById("btn-refresh-discover")?.addEventListener("click",async()=>{a.lastDiscover=null,Q("discover");try{await k("/api/discover/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}se()});document.getElementById("btn-refresh-gaps")?.addEventListener("click",async()=>{a.lastGaps=null;try{await k("/api/gaps/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}he()});document.getElementById("plib-search")?.addEventListener("input",e=>{!a.plexLibData||a.activeSubTab!=="collectie"||(I.innerHTML=Nt(a.plexLibData,e.target.value))});document.getElementById("btn-sync-plex")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex"),t=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{try{await k("/api/plex/refresh",{method:"POST"})}catch(s){if(s.name!=="AbortError")throw s}await W(),a.plexLibData=null,a.activeSubTab==="collectie"&&await tt()}catch{}finally{e.disabled=!1,e.textContent=t}});document.getElementById("plex-refresh-btn")?.addEventListener("click",async()=>{let e=document.getElementById("plex-refresh-btn");e.classList.add("spinning"),e.disabled=!0;try{try{await k("/api/plex/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await W(),a.plexLibData=null}catch{}finally{e.classList.remove("spinning"),e.disabled=!1}});document.getElementById("tidal-search")?.addEventListener("input",e=>{clearTimeout(a.tidalSearchTimeout);let t=e.target.value.trim();a.tidalSearchTimeout=setTimeout(()=>{a.activeSubTab==="tidal"&&a.tidalView==="search"&&Oe(t)},400)});document.getElementById("panel-close")?.addEventListener("click",Me);document.addEventListener("click",async e=>{if(Gt(e))return;let t=e.target.closest(".play-btn");if(t){e.stopPropagation(),Rt(t,t.dataset.artist,t.dataset.track);return}let s=e.target.closest(".disc-toggle-btn");if(s){e.stopPropagation();let m=s.dataset.discId,$=document.getElementById(m);if($){let L=$.classList.toggle("collapsed");$.querySelectorAll(".disc-toggle-btn").forEach(S=>{S.classList.toggle("expanded",!L),S.classList.toggle("collapsed",L);let q=parseInt(S.dataset.albumCount,10)||0,R=`${q} album${q!==1?"s":""}`;S.textContent=L?`Toon ${R}`:R})}return}let i=e.target.closest(".discover-card-toggle");if(i&&!e.target.closest(".artist-link")&&!e.target.closest(".bookmark-btn")&&!e.target.closest(".disc-toggle-btn")){let m=i.dataset.discId,$=document.getElementById(m);if($){let L=$.classList.toggle("collapsed");$.querySelectorAll(".disc-toggle-btn").forEach(S=>{S.classList.toggle("expanded",!L),S.classList.toggle("collapsed",L);let q=parseInt(S.dataset.albumCount,10)||0,R=`${q} album${q!==1?"s":""}`;S.textContent=L?`Toon ${R}`:R})}return}let n=e.target.closest("[data-artist]");if(n?.dataset.artist&&!n.classList.contains("bookmark-btn")){n.classList.contains("search-result-item")&&(document.getElementById("search-results").classList.remove("open"),document.getElementById("search-input").value=""),lt(n.dataset.artist);return}let d=e.target.closest(".bookmark-btn");if(d){e.stopPropagation();let{btype:m,bname:$,bartist:L,bimage:S}=d.dataset,q=await vt(m,$,L,S);d.classList.toggle("saved",q),d.title=q?"Verwijder uit lijst":"Sla op in lijst",document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape($)}"][data-btype="${m}"]`).forEach(R=>{R.classList.toggle("saved",q)});return}let c=e.target.closest(".wish-remove[data-wid]");if(c){try{await k(`/api/wishlist/${c.dataset.wid}`,{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}a.wishlistMap.forEach((m,$)=>{String(m)===c.dataset.wid&&a.wishlistMap.delete($)}),pe(),me();return}let l=e.target.closest(".panel-similar-chip[data-artist]");if(l){lt(l.dataset.artist);return}let r=e.target.closest(".download-btn, .tidal-dl-btn");if(r){if(e.stopPropagation(),r.classList.contains("tidal-dl-btn")){let L=r.dataset.dlurl;if(!L)return;r.disabled=!0;let S=r.textContent;r.textContent="\u2026";try{let q=await k("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:L})}),R=await q.json();if(!q.ok||!R.ok)throw new Error(R.error||"download mislukt");r.textContent="\u2713 Toegevoegd",r.classList.add("downloaded"),ke()}catch(q){alert("Downloaden mislukt: "+q.message),r.textContent=S,r.disabled=!1}return}let{dlartist:m,dlalbum:$}=r.dataset;await Et(m,$,r);return}let u=e.target.closest(".q-remove[data-qid]");if(u){e.stopPropagation();try{try{await k("/api/tidarr/queue/"+encodeURIComponent(u.dataset.qid),{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}}catch(m){alert("Verwijderen mislukt: "+m.message)}return}let y=e.target.closest(".q-remove[data-dlid]");if(y){e.stopPropagation();try{try{await k(`/api/downloads/${y.dataset.dlid}`,{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}y.closest(".q-row")?.remove()}catch(m){alert("Verwijderen mislukt: "+m.message)}return}let p=e.target.closest(".inline-toolbar [data-filter]");if(p){document.querySelectorAll("[data-filter]").forEach(m=>m.classList.remove("sel-def","sel-new","sel-plex")),a.recsFilter=p.dataset.filter,p.classList.add(a.recsFilter==="all"?"sel-def":a.recsFilter==="new"?"sel-new":"sel-plex"),Be();return}let f=e.target.closest(".inline-toolbar [data-rtype]");if(f){document.querySelectorAll("[data-rtype]").forEach($=>$.classList.remove("sel-def")),a.releasesFilter=f.dataset.rtype,f.classList.add("sel-def");let m=document.getElementById("sec-releases-content");m&&a.activeTab==="ontdek"?(a.sectionContainerEl=m,G(),a.sectionContainerEl===m&&(a.sectionContainerEl=null)):G();return}let w=e.target.closest(".inline-toolbar [data-rsort]");if(w){document.querySelectorAll("[data-rsort]").forEach($=>$.classList.remove("sel-def")),a.releasesSort=w.dataset.rsort,w.classList.add("sel-def");let m=document.getElementById("sec-releases-content");m&&a.activeTab==="ontdek"?(a.sectionContainerEl=m,G(),a.sectionContainerEl===m&&(a.sectionContainerEl=null)):G();return}let h=e.target.closest(".inline-toolbar [data-dfilter]");if(h){document.querySelectorAll("[data-dfilter]").forEach($=>$.classList.remove("sel-def","sel-new","sel-miss")),a.discFilter=h.dataset.dfilter,h.classList.add(a.discFilter==="all"?"sel-def":a.discFilter==="new"?"sel-new":"sel-miss");let m=document.getElementById("sec-discover-content");m&&a.activeTab==="ontdek"?(a.sectionContainerEl=m,ve(),a.sectionContainerEl===m&&(a.sectionContainerEl=null)):ve();return}let E=e.target.closest(".inline-toolbar [data-gsort]");if(E){document.querySelectorAll("[data-gsort]").forEach(m=>m.classList.remove("sel-def")),a.gapsSort=E.dataset.gsort,E.classList.add("sel-def"),a.activeTab==="gaps"?we():we();return}let A=e.target.closest(".sec-mood-block [data-mood]");if(A){let m=A.dataset.mood;if(a.activeMood===m){a.activeMood=null,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),ae(),ie();return}a.activeMood=m,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),A.classList.add("sel-mood");let $=A.closest(".inline-toolbar");if($&&!document.getElementById("btn-clear-mood-inline")){let L=document.createElement("span");L.className="toolbar-sep";let S=document.createElement("button");S.className="tool-btn",S.id="btn-clear-mood-inline",S.textContent="\u2715 Wis mood",S.addEventListener("click",()=>{a.activeMood=null,document.querySelectorAll("[data-mood]").forEach(q=>q.classList.remove("sel-mood","loading")),ae(),ie()}),$.appendChild(L),$.appendChild(S)}Te(m);return}let D=e.target.closest("[data-tidal-view]");if(D){let m=D.dataset.tidalView;m==="tidarr"?(document.getElementById("tb-tidal")?.classList.remove("visible"),document.getElementById("tb-tidarr-ui")?.classList.add("visible"),wt()):(j(),document.getElementById("tb-tidal")?.classList.add("visible"),document.getElementById("tb-tidarr-ui")?.classList.remove("visible"),Le(m));return}if(e.target===document.getElementById("panel-overlay")){Me();return}});document.addEventListener("keydown",e=>{if(e.key==="Escape"){Me(),document.getElementById("search-results").classList.remove("open");return}let t=["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);if(e.key==="/"&&!t){e.preventDefault(),document.getElementById("search-input").focus();return}if(e.key==="r"&&!t){a.activeTab==="ontdek"?ie():a.activeTab==="bibliotheek"?st():a.activeTab==="gaps"?he():ze[a.activeTab]?.();return}if(!t&&/^[1-5]$/.test(e.key)){let s=document.querySelectorAll(".tab"),i=parseInt(e.key)-1;s[i]&&s[i].click();return}});document.querySelectorAll(".bnav-btn").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,s=document.querySelector(`.tab[data-tab="${t}"]`);s&&s.click(),document.querySelectorAll(".bnav-btn").forEach(i=>i.classList.toggle("active",i===e))})});document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab;document.querySelectorAll(".bnav-btn").forEach(s=>s.classList.toggle("active",s.dataset.tab===t))})});De&&document.documentElement.setAttribute("data-reduce-motion","true");function Ut(e){document.documentElement.dataset.theme=e;let t=document.getElementById("theme-toggle");t&&(t.textContent=e==="dark"?"\u2600\uFE0F":"\u{1F319}")}(function(){let t=localStorage.getItem("theme");Ut(t||"light")})();document.getElementById("theme-toggle")?.addEventListener("click",()=>{let t=document.documentElement.dataset.theme==="dark"?"light":"dark";Ut(t),localStorage.setItem("theme",t)});(function(){let t=localStorage.getItem("downloadQuality")||"high",s=document.getElementById("download-quality");s&&a.VALID_QUALITIES.includes(t)&&(s.value=t)})();document.getElementById("download-quality")?.addEventListener("change",e=>{localStorage.setItem("downloadQuality",e.target.value)});We();W();Je();mt();He();je();pt();Se();St();Pe();setInterval(Je,3e4);})();
