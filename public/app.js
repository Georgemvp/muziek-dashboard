(()=>{var qt=Object.defineProperty;var Pt=(e,t)=>()=>(e&&(t=e(e=0)),t);var Mt=(e,t)=>{for(var s in t)qt(e,s,{get:t[s],enumerable:!0})};var Et={};Mt(Et,{closeZonePicker:()=>xe,getSelectedZone:()=>V,initZonePicker:()=>Ge,pauseZone:()=>Ve,playOnZone:()=>_e,skipZone:()=>Ee,toggleZonePicker:()=>Ne});function V(){try{let e=localStorage.getItem(wt);return e?JSON.parse(e):null}catch{return null}}function Ut(e){localStorage.setItem(wt,JSON.stringify(e)),$t()}function $t(){let e=V(),t=document.getElementById("plex-zone-name");t&&(t.textContent=e?e.name:"\u2014");let s=document.getElementById("plex-zone-btn");s&&s.classList.toggle("has-zone",!!e)}async function Qt(){try{return(await fetch(`/api/plex/clients?t=${Date.now()}`).then(t=>t.json())).clients||[]}catch{return[]}}function xe(){let e=document.getElementById("plex-zone-dropdown");e&&(e.style.display="none"),Fe=!1}async function Ne(){let e=document.getElementById("plex-zone-dropdown");if(!e)return;if(Fe){xe();return}Fe=!0,e.style.display="",e.innerHTML='<div class="plex-zone-loading">Laden\u2026</div>';let t=await Qt(),s=V();if(!t.length){e.innerHTML='<div class="plex-zone-empty">Geen Plex clients gevonden.<br><small>Zorg dat Plexamp of een andere player actief is.</small></div>';return}e.innerHTML=t.map(i=>`
    <button class="plex-zone-item${s?.machineId===i.machineId?" active":""}"
      data-machine-id="${i.machineId}"
      data-name="${i.name}"
      data-product="${i.product}">
      <span class="plex-zone-icon">\u{1F50A}</span>
      <span class="plex-zone-label">
        <span class="plex-zone-item-name">${i.name}</span>
        <small class="plex-zone-item-product">${i.product}</small>
      </span>
      ${s?.machineId===i.machineId?'<span class="plex-zone-check">\u2713</span>':""}
    </button>
  `).join(""),e.querySelectorAll(".plex-zone-item").forEach(i=>{i.addEventListener("click",()=>{Ut({machineId:i.dataset.machineId,name:i.dataset.name,product:i.dataset.product}),xe()})})}async function _e(e,t="music"){let s=V();if(!s)return await Ne(),!1;try{let n=await(await fetch("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:s.machineId,ratingKey:String(e),type:t})})).json();if(!n.ok)throw new Error(n.error||"Afspelen mislukt");return Wt(s.name),!0}catch(i){return console.error("[Plex Remote] play fout:",i),Zt(`Afspelen mislukt: ${i.message}`),!1}}async function Ve(){let e=V();e&&await fetch("/api/plex/pause",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:e.machineId})}).catch(t=>console.warn("[Plex Remote] pause fout:",t))}async function Ee(e="next"){let t=V();t&&await fetch("/api/plex/skip",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:t.machineId,direction:e})}).catch(s=>console.warn("[Plex Remote] skip fout:",s))}function Wt(e){xt(`\u25B6 Afspelen op ${e}`,"#1db954")}function Zt(e){xt(`\u26A0 ${e}`,"#e05a2b")}function xt(e,t="#333"){let s=document.getElementById("plex-remote-toast");s&&s.remove();let i=document.createElement("div");i.id="plex-remote-toast",Object.assign(i.style,{position:"fixed",bottom:"80px",left:"50%",transform:"translateX(-50%)",background:t,color:"#fff",padding:"10px 20px",borderRadius:"8px",zIndex:"9998",fontSize:"13px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",pointerEvents:"none",whiteSpace:"nowrap"}),i.textContent=e,document.body.appendChild(i),setTimeout(()=>i.remove(),3e3)}function Ge(){$t(),document.getElementById("plex-zone-btn")?.addEventListener("click",e=>{e.stopPropagation(),Ne()}),document.addEventListener("click",e=>{let t=document.getElementById("plex-zone-wrap");t&&!t.contains(e.target)&&xe()})}var wt,Fe,de=Pt(()=>{wt="plexSelectedZone";Fe=!1});var a={activeTab:"nu",activeSubTab:null,bibSubTab:"collectie",sectionContainerEl:null,currentPeriod:"7day",recsFilter:"all",discFilter:"all",gapsSort:"missing",releasesSort:"listening",releasesFilter:"all",plexOk:!1,lastDiscover:null,lastGaps:null,lastReleases:null,lastRecs:null,plexLibData:null,wishlistMap:new Map,newReleaseIds:new Set,searchTimeout:null,tidalSearchTimeout:null,tabAbort:null,tidarrOk:!1,tidalView:"search",tidalSearchResults:null,tidarrQueuePoll:null,tidarrSseSource:null,tidarrQueueItems:[],downloadedSet:new Set,spotifyEnabled:!1,activeMood:null,previewAudio:new Audio,previewBtn:null,collapsibleSections:{recs:!1,releases:!1,discover:!1},sectionMutex:Promise.resolve(),dlResolve:null,VALID_QUALITIES:["max","high","normal","low"]};function k(e,t={}){return!t.signal&&a.tabAbort&&(t={...t,signal:a.tabAbort.signal}),fetch(e,t)}async function et(e,t=4){let s=[],i=[];for(let[n,d]of e.entries()){let c=Promise.resolve().then(d).then(l=>{s[n]=l},l=>{s[n]=void 0});i.push(c),i.length>=t&&(await Promise.race(i),i.splice(i.findIndex(l=>l===c),1))}return await Promise.all(i),s}var Be=window.matchMedia("(prefers-reduced-motion: reduce)").matches,S=document.getElementById("content");function B(e,t=120){return e?`/api/img?url=${encodeURIComponent(e)}&w=${t}&h=${t}`:null}var O=(e,t="medium")=>{if(!e)return null;let s=e.find(i=>i.size===t);return s&&s["#text"]&&!s["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f")?s["#text"]:null},v=e=>String(e||"?").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2),P=e=>parseInt(e).toLocaleString("nl-NL"),o=e=>String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),te=e=>({"7day":"week","1month":"maand","3month":"3 maanden","12month":"jaar",overall:"alles"})[e]||e;function se(e){let t=Math.floor(Date.now()/1e3)-e;return t<120?"zojuist":t<3600?`${Math.floor(t/60)}m`:t<86400?`${Math.floor(t/3600)}u`:`${Math.floor(t/86400)}d`}function b(e,t=!1){let s=0;for(let r=0;r<e.length;r++)s=s*31+e.charCodeAt(r)&16777215;let i=s%360,n=45+s%31,d=50+(s>>8)%26,c=20+(s>>16)%16,l=15+(s>>10)%11;return t?`radial-gradient(circle, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`:`linear-gradient(135deg, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${l}%))`}function J(e){return!e||e.length!==2?"":[...e.toUpperCase()].map(t=>String.fromCodePoint(t.charCodeAt(0)+127397)).join("")}function G(e,t=4){return e?.length?`<div class="tags" style="margin-top:5px">${e.slice(0,t).map(s=>`<span class="tag">${o(s)}</span>`).join("")}</div>`:""}function ae(e){return a.plexOk?e?'<span class="badge plex">\u25B6 In Plex</span>':'<span class="badge new">\u2726 Nieuw</span>':""}function F(e,t,s="",i=""){let n=a.wishlistMap.has(`${e}:${t}`);return`<button class="bookmark-btn${n?" saved":""}"
    data-btype="${o(e)}" data-bname="${o(t)}"
    data-bartist="${o(s)}" data-bimage="${o(i)}"
    title="${n?"Verwijder uit lijst":"Sla op in lijst"}">\u{1F516}</button>`}function me(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function tt(e,t){let s=i=>(i||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");return`${s(e)}|${s(t)}`}var st=(e,t)=>a.downloadedSet.has(tt(e,t)),at=(e,t)=>a.downloadedSet.add(tt(e,t));function N(e,t="",s=!1){return!a.tidarrOk||s?"":st(e,t)?`<button class="download-btn dl-done"
      data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
      title="Al gedownload">\u2713</button>`:`<button class="download-btn"
    data-dlartist="${o(e)}" data-dlalbum="${o(t)}"
    title="Download via Tidarr">\u2B07</button>`}var Ae=e=>{let t=O(e);return t?`<img class="card-img" src="${t}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>'};function ie(e,t=!0,s=""){let i=e.inPlex,n=b(e.title||""),d=e.year||"\u2014",c=st(s,e.title||""),l=a.tidarrOk&&s&&!i?c?`<button class="album-dl-btn download-btn dl-done" data-dlartist="${o(s)}" data-dlalbum="${o(e.title||"")}" title="Al gedownload">\u2713</button>`:`<button class="album-dl-btn download-btn" data-dlartist="${o(s)}" data-dlalbum="${o(e.title||"")}" title="Download via Tidarr">\u2B07</button>`:"";return`
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
    </div>`}function Xe(){if(Be)return;Object.entries({".rec-grid > *":60,".card-list > *":25,".artist-grid > *":40,".releases-grid > *":40,".wishlist-grid > *":40}).forEach(([t,s])=>{document.querySelectorAll(t).forEach((i,n)=>{i.style.animationDelay=`${n*s}ms`})})}function Dt(e){let t="";e==="cards"?t='<div class="skeleton-list">'+Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")+"</div>":e==="grid"?t='<div class="skeleton-grid">'+Array(8).fill('<div class="skeleton skeleton-square"></div>').join("")+"</div>":e==="stats"?t='<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>':t=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`,$(t)}function $(e,t){a.sectionContainerEl&&!document.contains(a.sectionContainerEl)&&(a.sectionContainerEl=null);let s=a.sectionContainerEl||S;!a.sectionContainerEl&&document.startViewTransition?document.startViewTransition(()=>{s.innerHTML=e,Xe(),t&&requestAnimationFrame(t)}).finished.catch(()=>{}):(s.innerHTML=e,a.sectionContainerEl?t&&t():(S.style.opacity="0",S.style.transform="translateY(6px)",requestAnimationFrame(()=>{S.offsetHeight,S.style.opacity="1",S.style.transform="",Xe(),t&&requestAnimationFrame(t)})))}var M=e=>$(`<div class="error-box">\u26A0\uFE0F ${o(e)}</div>`);function D(e){if(a.sectionContainerEl){a.sectionContainerEl.innerHTML=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`;return}let t={recent:"cards",loved:"cards",toptracks:"cards",topartists:"grid",releases:"grid",recs:"grid",discover:"grid",gaten:"grid",stats:"stats",lijst:"grid",collectie:"cards",tidal:"cards",nu:"cards",ontdek:"grid",bibliotheek:"cards",downloads:"cards"},s=a.activeSubTab||a.activeTab,i=t[s];i&&!e?Dt(i):$(`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`)}function ne(e,t){if(!e)return;if(!("IntersectionObserver"in window)){t();return}let s=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(s.unobserve(n.target),t())})},{rootMargin:"300px"});s.observe(e)}function H(e,t){let s=a.sectionMutex.then(async()=>{a.sectionContainerEl=e;try{await t()}finally{a.sectionContainerEl=null}});return a.sectionMutex=s.catch(()=>{}),s}var ve=new Map;function T(e,t){let s=ve.get(e);return s?Date.now()-s.timestamp>t?(ve.delete(e),null):s.data:null}function C(e,t){ve.set(e,{data:t,timestamp:Date.now()})}function U(e){ve.delete(e)}var ge=new Map;async function Q(e){if(ge.has(e))return ge.get(e);let t=f(e);return ge.set(e,t),t.finally(()=>{ge.delete(e)}),t}function zt(e){if(document.getElementById("rate-limit-notice"))return;let t=document.createElement("div");t.id="rate-limit-notice",Object.assign(t.style,{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",background:"#e05a2b",color:"#fff",padding:"12px 24px",borderRadius:"8px",zIndex:"9999",fontSize:"14px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",whiteSpace:"nowrap"}),t.textContent="\u23F1 "+e,document.body.appendChild(t),setTimeout(()=>t.remove(),8e3)}async function f(e,{signal:t}={}){let s=await fetch(e,{signal:t});if(s.status===429){let n=(await s.json().catch(()=>({}))).error||"Te veel verzoeken, probeer het over een minuut opnieuw";throw zt(n),new Error(n)}if(!s.ok)throw new Error(`Serverfout ${s.status}`);return s.json()}async function it(){try{let e=await f("/api/downloads/keys");a.downloadedSet=new Set(e)}catch{a.downloadedSet=new Set}}async function W(){try{let e=await fetch("/api/plex/status").then(i=>i.json()),t=document.getElementById("plex-pill"),s=document.getElementById("plex-pill-text");if(e.connected){a.plexOk=!0,t.className="plex-pill on";let i=e.albums?` \xB7 ${P(e.albums)} albums`:"";s.textContent=`Plex \xB7 ${P(e.artists)} artiesten${i}`}else t.className="plex-pill off",s.textContent="Plex offline"}catch{document.getElementById("plex-pill-text").textContent="Plex offline"}}async function nt(){try{let e=T("user",6e5);e||(e=await f("/api/user"),C("user",e));let t=e.user,s=O(t.image,"large"),i=s?`<img class="user-avatar" src="${s}" alt="">`:`<div class="user-avatar-ph">${(t.name||"U")[0].toUpperCase()}</div>`,n=new Date(parseInt(t.registered?.unixtime)*1e3).getFullYear();document.getElementById("user-wrap").innerHTML=`
      <div class="user-card">${i}
        <div><div class="user-name">${o(t.realname||t.name)}</div>
        <div class="user-sub">${P(t.playcount)} scrobbles \xB7 lid sinds ${n}</div></div>
      </div>`}catch{}}async function qe(){try{let e=await f("/api/wishlist");a.wishlistMap.clear();for(let t of e)a.wishlistMap.set(`${t.type}:${t.name}`,t.id);le()}catch{}}function le(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=a.wishlistMap.size||"0")}async function lt(e,t,s,i){let n=`${e}:${t}`;if(a.wishlistMap.has(n)){try{await k(`/api/wishlist/${a.wishlistMap.get(n)}`,{method:"DELETE"})}catch(d){if(d.name!=="AbortError")throw d}return a.wishlistMap.delete(n),le(),!1}else{let c=await(await k("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:t,artist:s,image:i})})).json();return a.wishlistMap.set(n,c.id),le(),!0}}async function oe(){D(),await qe();try{let e=await f("/api/wishlist");if(!e.length){$('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let t=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let s of e){let i=s.image?`<img src="${o(s.image)}" alt="" loading="lazy"
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
        </div>`}$(t+"</div>")}catch(e){M(e.message)}}function jt(){return localStorage.getItem("downloadQuality")||"high"}async function Pe(){let e=a.tabAbort?.signal;try{let t=await f("/api/tidarr/status",{signal:e});if(e?.aborted)return;let s=document.getElementById("tidarr-status-pill"),i=document.getElementById("tidarr-status-text");a.tidarrOk=!!t.connected,s&&i&&(s.className=`tidarr-status-pill ${a.tidarrOk?"on":"off"}`,i.textContent=a.tidarrOk?`Tidarr \xB7 verbonden${t.quality?" \xB7 "+t.quality:""}`:"Tidarr offline")}catch(t){if(t.name==="AbortError")return;a.tidarrOk=!1;let s=document.getElementById("tidarr-status-text");s&&(s.textContent="Tidarr offline")}}async function fe(){let e=a.tabAbort?.signal;try{let t=await f("/api/tidarr/queue",{signal:e});if(e?.aborted)return;let s=(t.items||[]).length,i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(s>0?(n.textContent=s,n.style.display=""):n.style.display="none")}catch(t){if(t.name==="AbortError")return}}function ot(e){let t=e.image?`<img class="tidal-img" src="${o(e.image)}" alt="" loading="lazy"
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
    </div>`}async function Me(e){let t=document.getElementById("tidal-content");if(!t)return;let s=(e||"").trim();if(s.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let i=await f(`/api/tidarr/search?q=${encodeURIComponent(s)}`);if(a.tidalSearchResults=i.results||[],i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.error)}</div>`;return}if(!a.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${o(s)}</strong>".</div>`;return}let n=a.tidalSearchResults.filter(l=>l.type==="album"),d=a.tidalSearchResults.filter(l=>l.type==="track"),c="";n.length&&(c+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(ot).join("")}</div>`),d.length&&(c+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(ot).join("")}</div>`),t.innerHTML=c}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(i.message)}</div>`}}function ct(){let e=document.getElementById("tidal-content");if(!e)return;let t=a.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let d=i[n.status]||"q-pending",c=s[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${l}%"></div></div><div class="q-pct">${l}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${o(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${o(n.artist)}</div>`:""}
          <span class="q-status ${d}">${o(c)}</span>
        </div>
        ${r}
        <button class="q-remove" data-qid="${o(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function ut(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let t=await f("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let s={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
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
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){try{await k("/api/downloads",{method:"DELETE"})}catch(i){i.name}for(let i of t)try{await k(`/api/downloads/${i.id}`,{method:"DELETE"})}catch(n){n.name}a.downloadedSet.clear(),ut()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`}}}function be(e){a.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(t=>t.classList.toggle("sel-def",t.dataset.tidalView===e)),e==="search"?Me(document.getElementById("tidal-search")?.value||""):e==="queue"?ct():e==="history"&&ut()}function ye(){if(a.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");a.tidarrSseSource=e,e.onmessage=t=>{try{a.tidarrQueueItems=JSON.parse(t.data)||[]}catch{a.tidarrQueueItems=[]}let s=a.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(s.length>0?(n.textContent=s.length,n.style.display=""):n.style.display="none");if(Rt(a.tidarrQueueItems),a.activeSubTab==="tidal"&&a.tidalView==="queue"&&ct(),document.getElementById("queue-popover")?.classList.contains("open")&&mt(),a.activeTab==="nu"){let n=document.getElementById("wbody-download-voortgang");n&&De(n,s)}},e.onerror=()=>{e.close(),a.tidarrSseSource=null,setTimeout(ye,1e4)}}function De(e,t){if(t||(t=a.tidarrQueueItems.filter(i=>i.status!=="finished"&&i.status!=="error")),!t.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen actieve downloads</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026"};e.innerHTML=`<div class="w-queue-list">${t.slice(0,5).map(i=>{let n=i.progress?.current&&i.progress?.total?Math.round(i.progress.current/i.progress.total*100):null;return`<div class="w-q-row"><div class="w-q-info">
      <div class="w-q-title">${o(i.title||"(onbekend)")}</div>
      ${i.artist?`<div class="w-q-artist">${o(i.artist)}</div>`:""}
      ${n!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${n}%"></div></div>
           <div style="font-size:10px;color:var(--muted2);margin-top:2px">${n}%</div>`:`<span class="q-status q-pending" style="margin-top:4px;display:inline-block">${o(s[i.status]||i.status)}</span>`}
    </div></div>`}).join("")}${t.length>5?`<div style="font-size:11px;color:var(--muted2);margin-top:6px">+${t.length-5} meer</div>`:""}</div>`}function Ht(){ye()}function pt(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),s=document.getElementById("content");t.style.display="flex",s.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function R(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function Rt(e){let t=document.getElementById("queue-fab"),s=document.getElementById("fab-queue-badge");if(!t)return;let i=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",i.length>0?(s.textContent=i.length,s.style.display=""):s.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function mt(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=a.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let s={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let d=i[n.status]||"q-pending",c=s[n.status]||n.status||"In wachtrij",l=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=l!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${l}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${o(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${o(n.artist)}</div>`:""}
      <span class="q-status ${d}">${o(c)}</span>
      ${r}
    </div>`}).join("")}function Ot(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&mt()}function ze(){document.getElementById("queue-popover")?.classList.remove("open")}function rt(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function vt(e,t){let s=rt(e),i=rt(t);return!s||!i?!0:s===i||s.includes(i)||i.includes(s)}function Ft(e,t,s,i){return new Promise(n=>{a.dlResolve=n;let d=document.getElementById("dl-confirm-modal"),c=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${s}"${t?" \u2013 "+t:""}`,c.innerHTML=e.map((l,r)=>{let p=!vt(l.artist,t),x=l.image?`<img class="dlc-img" src="${o(l.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${v(l.title)}</div>`:`<div class="dlc-ph">${v(l.title)}</div>`,u=p?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${o(l.artist)}</div>`:`<div class="dlc-artist">${o(l.artist)}</div>`,g=l.score??0;return`
        <button class="dlc-card${r===0?" dlc-best":""}" data-dlc-idx="${r}">
          <div class="dlc-cover">${x}</div>
          <div class="dlc-info">
            <div class="dlc-title">${o(l.title)}</div>
            ${u}
            <div class="dlc-meta">${l.year?o(l.year):""}${l.year&&l.tracks?" \xB7 ":""}${l.tracks?l.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${g}%"></div></div>
            <div class="dlc-score-label">${g}% overeenkomst</div>
          </div>
          ${r===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),c.querySelectorAll(".dlc-card").forEach(l=>{l.addEventListener("click",()=>{let r=parseInt(l.dataset.dlcIdx);je(),n({chosen:e[r],btn:i})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function je(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",a.dlResolve&&(a.dlResolve({chosen:null}),a.dlResolve=null)}async function dt(e,t,s,i){let n=await k("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||s||"",artist:e.artist||t||"",id:String(e.id||""),quality:jt()})}),d=await n.json();if(!n.ok||!d.ok)throw new Error(d.error||"download mislukt");at(e.artist||t||"",e.title||s||""),i&&(i.textContent="\u2713",i.classList.add("dl-done"),i.disabled=!1),await fe()}async function gt(e,t,s){if(!a.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}s&&(s.disabled=!0,s.textContent="\u2026");try{let i=new URLSearchParams;e&&i.set("artist",e),t&&i.set("album",t);let n=await k(`/api/tidarr/candidates?${i}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let{candidates:d}=await n.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),s&&(s.disabled=!1,s.textContent="\u2B07");return}let c=d[0];if(e&&!vt(c.artist,e)){s&&(s.disabled=!1,s.textContent="\u2B07");let{chosen:l}=await Ft(d,e,t,s);if(!l)return;s&&(s.disabled=!0,s.textContent="\u2026"),await dt(l,e,t,s)}else await dt(c,e,t,s)}catch(i){alert("Downloaden mislukt: "+i.message),s&&(s.disabled=!1,s.textContent="\u2B07")}}async function He(){$('<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>'),await Pe(),await fe(),be(a.tidalView),Ht()}function ft(){a.activeSubTab="tidal",R(),document.getElementById("tb-tidal")?.classList.add("visible"),He()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{je()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&je()});document.getElementById("queue-fab")?.addEventListener("click",Ot);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),ze()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{ze(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>be("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),s=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!s?.contains(e.target)&&ze()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});async function yt(){try{let e=await f("/api/spotify/status");a.spotifyEnabled=!!e.enabled;let t=document.getElementById("tb-mood");a.spotifyEnabled&&a.activeSubTab==="recs"?(t.style.display="",t.classList.add("visible")):a.spotifyEnabled&&(t.style.display="")}catch{a.spotifyEnabled=!1}}function Nt(e,t){let s=e.image?`<img src="${o(e.image)}" alt="" loading="lazy"
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
    </div>`}async function we(e){let t=document.getElementById("spotify-recs-section");if(!t)return;let s={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};t.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let i=`spotify:${e}`,n=T(i,300*1e3);if(n||(n=await f(`/api/spotify/recs?mood=${encodeURIComponent(e)}`),C(i,n)),!n.length){t.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let d=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${o(s[e]||e)}</div>
      <div class="spotify-grid">`;n.forEach((c,l)=>{d+=Nt(c,l)}),d+="</div>",t.innerHTML=d}catch{t.innerHTML=""}}function X(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(e=>{e.addEventListener("click",async()=>{let t=e.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(s=>s.classList.remove("sel-mood","loading")),a.activeMood===t){a.activeMood=null,X(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}a.activeMood=t,e.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await we(t),e.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{a.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",X()});document.addEventListener("click",e=>{let t=e.target.closest(".spotify-play-btn");if(!t)return;e.stopPropagation();let s=t.dataset.spotifyPreview;if(s){if(a.previewBtn===t){a.previewAudio.paused?(a.previewAudio.play(),t.textContent="\u23F8",t.classList.add("playing")):(a.previewAudio.pause(),t.textContent="\u25B6",t.classList.remove("playing"));return}if(a.previewBtn){a.previewAudio.pause(),a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing");let i=a.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}a.previewBtn=t,a.previewAudio.src=s,a.previewAudio.currentTime=0,a.previewAudio.play().then(()=>{t.textContent="\u23F8",t.classList.add("playing")}).catch(()=>{t.textContent="\u25B6",a.previewBtn=null})}},!0);async function he(){D();let e=a.tabAbort?.signal;try{let t=T("recs",3e5);if(!(t!==null)){if(t=await Q("/api/recs"),e?.aborted)return;C("recs",t)}let i=t.recommendations||[],n=t.albumRecs||[],d=t.trackRecs||[];if(a.plexOk=t.plexConnected||a.plexOk,a.lastRecs=t,t.plexConnected&&t.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${P(t.plexArtistCount)} artiesten`),!i.length){$('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let c=i.filter(u=>!u.inPlex).length,l=i.filter(u=>u.inPlex).length,r=document.getElementById("hdr-title-recs");r&&(r.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${i.length} artiesten`);let p='<div class="spotify-section" id="spotify-recs-section"></div>';p+=`<div class="section-title">Gebaseerd op jouw smaak: ${(t.basedOn||[]).slice(0,3).join(", ")}
      ${a.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${c} nieuw</span> \xB7 <span style="color:var(--plex)">${l} in Plex</span>`:""}
      </div><div class="rec-grid">`;for(let u=0;u<i.length;u++){let g=i[u],h=Math.round(g.match*100);p+=`
        <div class="rec-card" data-inplex="${g.inPlex}" id="rc-${u}">
          <div class="rec-photo" id="rph-${u}">
            <div class="rec-photo-ph" style="background:${b(g.name)}">${v(g.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${o(g.name)}">${o(g.name)}</span>
                ${ae(g.inPlex)}
              </div>
              <span class="rec-match">${h}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${o(g.reason)}</div>
            <div id="rtags-${u}"></div>
            <div id="ralb-${u}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`}if(p+="</div>",n.length){p+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let u of n){let g=B(u.image,80)||u.image,h=g?`<img class="albrec-img" src="${o(g)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${b(u.album)}">${v(u.album)}</div>`:`<div class="albrec-ph" style="background:${b(u.album)}">${v(u.album)}</div>`,y=a.plexOk?u.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";p+=`
          <div class="albrec-card">
            <div class="albrec-cover">${h}</div>
            <div class="albrec-info">
              <div class="albrec-title">${o(u.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${o(u.artist)}">${o(u.artist)}</div>
              <div class="albrec-reason">via ${o(u.reason)}</div>
              ${y}${N(u.artist,u.album,u.inPlex)}
            </div>
          </div>`}p+="</div>"}if(d.length){p+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let u of d){let g=u.playcount>0?`<span class="trackrec-plays">${P(u.playcount)}\xD7</span>`:"",h=u.url?`<a class="trackrec-link" href="${o(u.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";p+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${o(u.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${o(u.artist)}">${o(u.artist)}</div>
              <div class="trackrec-reason">via ${o(u.reason)}</div>
            </div>
            <div class="trackrec-meta">${g}${h}</div>
          </div>`}p+="</div>"}$(p,()=>{a.activeMood&&we(a.activeMood)}),$e();let x=document.getElementById("sec-recs-preview");if(x){let u=i.slice(0,8);x.innerHTML=`<div class="collapsed-thumbs">${u.map((g,h)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${h}" style="background:${b(g.name)}">
          <span class="collapsed-thumb-ph">${v(g.name)}</span>
        </div>`).join("")}${i.length>8?`<span class="collapsed-thumbs-more">+${i.length-8}</span>`:""}</div>`,u.forEach(async(g,h)=>{try{let y=await f(`/api/artist/${encodeURIComponent(g.name)}/info`),E=document.getElementById(`recs-thumb-${h}`);E&&y.image&&(E.innerHTML=`<img src="${o(B(y.image,48)||y.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}i.forEach(async(u,g)=>{try{let h=await f(`/api/artist/${encodeURIComponent(u.name)}/info`),y=document.getElementById(`rph-${g}`);y&&h.image&&(y.innerHTML=`<img src="${B(h.image,120)||h.image}" alt="" loading="lazy"
          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${b(u.name)}\\'>${v(u.name)}</div>'">`);let E=document.getElementById(`rtags-${g}`);E&&(E.innerHTML=G(h.tags,3)+'<div style="height:6px"></div>');let A=document.getElementById(`ralb-${g}`);if(A){let z=(h.albums||[]).slice(0,4);if(z.length){let m='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let w of z){let L=w.image?`<img class="rec-album-img" src="${B(w.image,48)||w.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',I=a.plexOk&&w.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";m+=`<div class="rec-album-row">${L}<span class="rec-album-name">${o(w.name)}</span>${I}${N(u.name,w.name,w.inPlex)}</div>`}A.innerHTML=m+"</div>"}else A.innerHTML=""}}catch{let h=document.getElementById(`ralb-${g}`);h&&(h.innerHTML="")}})}catch(t){if(t.name==="AbortError")return;M(t.message)}}function $e(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let t=e.dataset.inplex==="true",s=!0;a.recsFilter==="new"&&(s=!t),a.recsFilter==="plex"&&(s=t),e.classList.toggle("hidden",!s)})}function ht(e){let t=document.getElementById("badge-releases");t&&(e>0?(t.textContent=e,t.style.display=""):t.style.display="none")}function _t(e){if(!e)return"";let t=new Date(e),i=Math.floor((new Date-t)/864e5);return i===0?"vandaag":i===1?"gisteren":i<7?`${i} dagen geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function K(){D();let e=a.tabAbort?.signal;try{let t=T("releases",3e5);if(!t){if(t=await f("/api/releases",{signal:e}),e?.aborted)return;C("releases",t)}if(t.status==="building"){$(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{(a.activeSubTab==="releases"||a.activeSubTab===null)&&K()},5e3);return}a.lastReleases=t.releases||[],a.newReleaseIds=new Set(t.newReleaseIds||[]),ht(t.newCount||0),_()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function _(){let e=a.lastReleases||[];if(!e.length){$('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>');return}let t=e;if(a.releasesFilter!=="all"&&(t=e.filter(l=>(l.type||"album").toLowerCase()===a.releasesFilter)),!t.length){$(`<div class="empty">Geen ${a.releasesFilter==="ep"?"EP's":a.releasesFilter+"s"} gevonden voor dit filter.</div>`);return}a.releasesSort==="listening"?t=[...t].sort((l,r)=>(r.artistPlaycount||0)-(l.artistPlaycount||0)||new Date(r.releaseDate)-new Date(l.releaseDate)):t=[...t].sort((l,r)=>new Date(r.releaseDate)-new Date(l.releaseDate));let s=document.getElementById("hdr-title-releases");s&&(s.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${t.length} release${t.length!==1?"s":""}`);let i=l=>({album:"Album",single:"Single",ep:"EP"})[l?.toLowerCase()]||l||"Album",n=l=>({album:"rel-type-album",single:"rel-type-single",ep:"rel-type-ep"})[l?.toLowerCase()]||"rel-type-album",d=`<div class="section-title">${t.length} release${t.length!==1?"s":""} in de afgelopen 30 dagen</div>
    <div class="releases-grid">`;for(let l of t){let r=a.newReleaseIds.has(`${l.artist}::${l.album}`),p=l.image?`<img class="rel-img" src="${o(l.image)}" alt="" loading="lazy"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="rel-ph" style="display:none;background:${b(l.album)}">${v(l.album)}</div>`:`<div class="rel-ph" style="background:${b(l.album)}">${v(l.album)}</div>`,x=l.releaseDate?new Date(l.releaseDate).toLocaleDateString("nl-NL",{day:"numeric",month:"long"}):"",u=_t(l.releaseDate),g=x?`<div class="rel-date">${x} <span class="rel-date-rel">(${u})</span></div>`:"",h=a.plexOk?l.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6 In Plex</span>':l.artistInPlex?'<span class="badge new" style="font-size:9px">\u2726 Artiest in Plex</span>':"":"",y=l.deezerUrl?`<a class="rel-deezer-link" href="${o(l.deezerUrl)}" target="_blank" rel="noopener">Deezer \u2197</a>`:"";d+=`
      <div class="rel-card${r?" rel-card-new":""}">
        <div class="rel-cover">${p}</div>
        <div class="rel-info">
          <span class="rel-type-badge ${n(l.type)}">${i(l.type)}</span>
          <div class="rel-album">${o(l.album)}</div>
          <div class="rel-artist artist-link" data-artist="${o(l.artist)}">${o(l.artist)}</div>
          ${g}
          <div class="rel-footer">${h}${y}${N(l.artist,l.album,l.inPlex)}</div>
        </div>
      </div>`}$(d+"</div>");let c=document.getElementById("sec-releases-preview");if(c){let l=t.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(r.album)}">${v(r.album)}</span>
        </div>`:`<div class="collapsed-thumb" style="background:${b(r.album)}"><span class="collapsed-thumb-ph">${v(r.album)}</span></div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`}}async function Y(){D("Ontdekkingen ophalen...");let e=a.tabAbort?.signal;try{let t=T("discover",3e5);if(!t){if(t=await f("/api/discover",{signal:e}),e?.aborted)return;C("discover",t)}if(t.status==="building"){$(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{(a.activeSubTab==="discover"||a.activeSubTab===null)&&Y()},2e4);return}a.lastDiscover=t,t.plexConnected&&(a.plexOk=!0),re()}catch(t){if(t.name==="AbortError")return;M(t.message)}}function re(){if(!a.lastDiscover)return;let{artists:e,basedOn:t}=a.lastDiscover;if(!e?.length){$('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let s=e;if(a.discFilter==="new"&&(s=e.filter(l=>!l.inPlex)),a.discFilter==="partial"&&(s=e.filter(l=>l.inPlex&&l.missingCount>0)),!s.length){$('<div class="empty">Geen artiesten voor dit filter.</div>');return}let i=document.getElementById("hdr-title-discover");i&&(i.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${s.length} artiesten`);let n=s.reduce((l,r)=>l+r.missingCount,0),d=`<div class="section-title">Gebaseerd op: ${(t||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} albums te ontdekken</span></div>
    <div class="discover-grid">`;for(let l=0;l<s.length;l++){let r=s[l],p=Math.round(r.match*100),x=[J(r.country),r.country,r.startYear?`Actief vanaf ${r.startYear}`:null,r.totalAlbums?`${r.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),u=B(r.image,120)||r.image,g=u?`<img class="discover-photo" src="${o(u)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${b(r.name,!0)}">${v(r.name)}</div>`:`<div class="discover-photo-ph" style="background:${b(r.name,!0)}">${v(r.name)}</div>`,h=r.albums?.length||0,y=`${h} album${h!==1?"s":""}`;if(d+=`
      <div class="discover-section collapsed" id="disc-${l}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${l}">
          <div class="discover-card-top">
            ${g}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${o(r.name)}">${o(r.name)}</span>
                ${ae(r.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${o(r.reason)}</strong></div>
            </div>
            <span class="discover-match">${p}%</span>
            ${F("artist",r.name,"",r.image||"")}
          </div>
          ${x?`<div class="discover-meta">${o(x)}</div>`:""}
          ${G(r.tags,3)}
          ${r.missingCount>0?`<div class="discover-missing">\u2726 ${r.missingCount} ${r.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${l}" data-album-count="${h}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${y}</button>
          ${r.albums?.length?`<div class="discover-preview-row">${r.albums.slice(0,5).map(E=>{let A=b(E.title||"");return E.coverUrl?`<img class="discover-preview-thumb" src="${o(E.coverUrl)}" alt="${o(E.title)}" loading="lazy"
                   title="${o(E.title)}${E.year?" ("+E.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${A}">${v(E.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${A}">${v(E.title||"?")}</div>`}).join("")}${r.albums.length>5?`<div class="discover-preview-more">+${r.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`,r.albums?.length){d+='<div class="album-grid">';for(let E of r.albums)d+=ie(E,!0,r.name);d+="</div>"}else d+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>';d+="</div></div>"}d+="</div>",$(d);let c=document.getElementById("sec-discover-preview");if(c){let l=s.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${l.map(r=>r.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${o(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${b(r.name)}">${v(r.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(r.name)}"><span class="collapsed-thumb-ph">${v(r.name)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`}}function Vt(){try{let e=localStorage.getItem("ontdek-sections");e&&Object.assign(a.collapsibleSections,JSON.parse(e))}catch{}}function Gt(){try{localStorage.setItem("ontdek-sections",JSON.stringify(a.collapsibleSections))}catch{}}function bt(e,t){e.classList.remove("expanded","collapsed"),e.classList.add(t?"collapsed":"expanded")}function Re(e,t){let s=document.querySelector(`[data-section="${e}"]`);if(!s)return;let i=s.querySelector(".section-toggle-btn");i&&(bt(i,a.collapsibleSections[t]),i.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),a.collapsibleSections[t]=!a.collapsibleSections[t],Gt(),bt(i,a.collapsibleSections[t]),s.classList.toggle("collapsed")}),a.collapsibleSections[t]&&s.classList.add("collapsed"))}async function ee(){Vt(),a.activeSubTab=null,R();let e=a.spotifyEnabled?`
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
    </div>`:"";S.innerHTML=`
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
    </div>`,S.style.opacity="1",S.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{U("recs"),await H(document.getElementById("sec-recs-content"),he)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{a.lastReleases=null,U("releases");try{await k("/api/releases/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await H(document.getElementById("sec-releases-content"),K)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{a.lastDiscover=null,U("discover");try{await k("/api/discover/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await H(document.getElementById("sec-discover-content"),Y)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{a.activeMood=null,document.querySelectorAll(".mood-btn").forEach(t=>t.classList.remove("sel-mood","loading")),X(),ee()});{let t=document.getElementById("sec-recs-content");a.sectionContainerEl=t,await he(),a.sectionContainerEl===t&&(a.sectionContainerEl=null)}(async()=>{try{if(!a.lastReleases){let s=await f("/api/releases");if(s.status==="building")return;a.lastReleases=s.releases||[],a.newReleaseIds=new Set(s.newReleaseIds||[]),ht(s.newCount||0)}let t=document.getElementById("sec-releases-preview");if(t&&a.lastReleases.length){let s=a.lastReleases;a.releasesFilter!=="all"&&(s=a.lastReleases.filter(d=>(d.type||"album").toLowerCase()===a.releasesFilter)),a.releasesSort==="listening"?s=[...s].sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)||new Date(c.releaseDate)-new Date(d.releaseDate)):s=[...s].sort((d,c)=>new Date(c.releaseDate)-new Date(d.releaseDate));let i=s.slice(0,8);t.innerHTML=`<div class="collapsed-thumbs">${i.map(d=>d.image?`<div class="collapsed-thumb">
              <img src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(d.album)}">${v(d.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${b(d.album)}"><span class="collapsed-thumb-ph">${v(d.album)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`;let n=document.getElementById("hdr-title-releases");n&&(n.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${s.length} release${s.length!==1?"s":""}`)}}catch{}})(),ne(document.getElementById("sec-releases-content"),()=>{let t=document.getElementById("sec-releases-content");return H(t,K)}),(async()=>{try{if(!a.lastDiscover){let n=await f("/api/discover");if(n.status==="building")return;a.lastDiscover=n,n.plexConnected&&(a.plexOk=!0)}let{artists:t}=a.lastDiscover;if(!t?.length)return;let s=t;a.discFilter==="new"&&(s=t.filter(n=>!n.inPlex)),a.discFilter==="partial"&&(s=t.filter(n=>n.inPlex&&n.missingCount>0));let i=document.getElementById("sec-discover-preview");if(i&&s.length){let n=s.slice(0,8);i.innerHTML=`<div class="collapsed-thumbs">${n.map(c=>c.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${o(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${b(c.name)}">${v(c.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${b(c.name)}"><span class="collapsed-thumb-ph">${v(c.name)}</span></div>`).join("")}${s.length>8?`<span class="collapsed-thumbs-more">+${s.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-discover");d&&(d.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${s.length} artiesten`)}}catch{}})(),ne(document.getElementById("sec-discover-content"),()=>{let t=document.getElementById("sec-discover-content");return H(t,Y)}),Re("recs","recs"),Re("releases","releases"),Re("discover","discover")}de();var ke=null;function Le(){ke&&(clearInterval(ke),ke=null)}async function Qe(){let e=document.getElementById("plex-np-wrap");try{let t=await fetch("/api/plex/nowplaying").then(s=>s.json());e.innerHTML=t.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${o(t.track)}</div>
           <div class="card-sub">${o(t.artist)}${t.album?" \xB7 "+o(t.album):""}</div></div></div>`:""}catch{e.innerHTML=""}}function kt(e){return{"nu-luisteren":"\u{1F3B6} Nu luisteren","recente-nummers":"\u{1F550} Recente nummers","nieuwe-releases":"\u{1F4BF} Nieuwe releases deze week","download-voortgang":"\u2B07 Download-voortgang","vandaag-cijfers":"\u{1F4CA} Vandaag in cijfers",aanbeveling:"\u2728 Aanbeveling van de dag","collectie-stats":"\u{1F4C0} Collectie-stats"}[e]||e}var Ue=["nu-luisteren","recente-nummers","nieuwe-releases","download-voortgang","vandaag-cijfers","aanbeveling","collectie-stats"];function Lt(){let e=null,t=[];try{e=JSON.parse(localStorage.getItem("dashWidgetOrder"))}catch{}try{t=JSON.parse(localStorage.getItem("dashWidgetHidden"))||[]}catch{}let i=(Array.isArray(e)&&e.length?e:Ue).filter(l=>Ue.includes(l)&&!t.includes(l)),n=Ue.map(l=>`<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${o(l)}"${t.includes(l)?"":" checked"}>
      ${o(kt(l))}
    </label>`).join(""),d=i.map(l=>`<div class="widget-card" id="widget-${o(l)}" data-widget="${o(l)}">
      <div class="widget-hdr"><span class="widget-title">${o(kt(l))}</span></div>
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
    <div class="widget-grid" id="widget-grid">${d}</div>`;a.sectionContainerEl=null,S.innerHTML=c,requestAnimationFrame(()=>{Promise.allSettled([It(),Jt(),Kt(),Yt(),Xt(),es(),ts()]),document.getElementById("dash-customize-btn")?.addEventListener("click",()=>{let l=document.getElementById("dash-customize-panel");l&&(l.style.display=l.style.display==="none"?"":"none")}),document.querySelectorAll(".dash-widget-cb").forEach(l=>{l.addEventListener("change",()=>{let r=[];document.querySelectorAll(".dash-widget-cb").forEach(p=>{p.checked||r.push(p.dataset.widget)}),localStorage.setItem("dashWidgetHidden",JSON.stringify(r)),Lt()})})})}function Z(e,t){let s=document.getElementById("wbody-"+e);s&&(s.innerHTML=`<div class="widget-error">\u26A0 ${o(t||"Niet beschikbaar")}</div>`)}async function It(){let e=document.getElementById("wbody-nu-luisteren");if(!e||a.activeTab!=="nu")return;let t=a.tabAbort?.signal;try{let s=T("recent",6e4),i=s!==null,[n,d]=await Promise.allSettled([fetch("/api/plex/nowplaying",{signal:t}).then(l=>l.json()),i?Promise.resolve(s):Q("/api/recent")]);if(t?.aborted)return;!i&&d.status==="fulfilled"&&C("recent",d.value);let c="";if(n.status==="fulfilled"&&n.value?.playing){let l=n.value,r=!!V(),p=l.ratingKey||"";c+=`<div class="w-np-row">
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
      </div>`}if(d.status==="fulfilled"){let r=(d.value.recenttracks?.track||[]).find(p=>p["@attr"]?.nowplaying);if(r){let p=r.artist?.["#text"]||"",x=O(r.image,"medium");c+=`<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${x?`<img class="w-np-img" src="${o(x)}" alt="" loading="lazy">`:""}
          <div class="w-np-info">
            <div class="w-np-title">${o(r.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${o(p)}">${o(p)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">\u25CF Last.fm</span>
          </div>
        </div>`}}e.innerHTML=c||'<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>',e.querySelectorAll("[data-plex-action]").forEach(l=>{l.addEventListener("click",async()=>{let r=l.dataset.plexAction;if(r==="pause")Ve();else if(r==="next")Ee("next");else if(r==="prev")Ee("prev");else if(r==="zone"){let{toggleZonePicker:p}=await Promise.resolve().then(()=>(de(),Et));p()}})})}catch(s){if(s.name==="AbortError")return;Z("nu-luisteren",s.message)}}async function Jt(){let e=document.getElementById("wbody-recente-nummers");if(!e)return;let t=a.tabAbort?.signal;try{let s=T("recent",6e4);if(!s){if(s=await Q("/api/recent"),t?.aborted)return;C("recent",s)}let i=(s.recenttracks?.track||[]).filter(n=>!n["@attr"]?.nowplaying).slice(0,8);if(!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen recente nummers</div>';return}e.innerHTML=`<div class="w-track-list">${i.map(n=>{let d=n.artist?.["#text"]||"",c=n.date?.uts?se(parseInt(n.date.uts)):"";return`<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${o(n.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${o(d)}">${o(d)}</div>
        </div>
        <span class="w-track-ago">${c}</span>
      </div>`}).join("")}</div>`}catch(s){if(s.name==="AbortError")return;Z("recente-nummers",s.message)}}async function Kt(){let e=document.getElementById("wbody-nieuwe-releases");if(!e)return;let t=a.tabAbort?.signal;try{let s=a.lastReleases;if(!s){let d=await f("/api/releases",{signal:t});if(t?.aborted)return;if(d.status==="building"){e.innerHTML='<div class="empty" style="font-size:12px">Releases worden geladen\u2026</div>';return}s=d.releases||[]}let i=Date.now()-168*3600*1e3,n=s.filter(d=>d.releaseDate&&new Date(d.releaseDate).getTime()>i).sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)).slice(0,3);if(!n.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen releases deze week</div>';return}e.innerHTML=`<div class="w-releases-list">${n.map(d=>`<div class="w-rel-row">
        <div class="w-rel-cover">${d.image?`<img class="w-rel-img" src="${o(d.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="w-rel-ph" style="background:${b(d.album)}">${v(d.album)}</div>`}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${o(d.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${o(d.artist)}">${o(d.artist)}</div>
        </div>
        ${N(d.artist,d.album,d.inPlex)}
      </div>`).join("")}</div>`}catch(s){if(s.name==="AbortError")return;Z("nieuwe-releases",s.message)}}async function Yt(){let e=document.getElementById("wbody-download-voortgang");if(!e)return;if(!a.tidarrOk){e.innerHTML='<div class="widget-error">\u26A0 Tidarr offline</div>';return}let t=a.tabAbort?.signal;try{let s=await f("/api/tidarr/queue",{signal:t});if(t?.aborted)return;let i=(s.items||a.tidarrQueueItems||[]).filter(n=>n.status!=="finished"&&n.status!=="error");De(e,i)}catch(s){if(s.name==="AbortError")return;Z("download-voortgang","Tidarr niet bereikbaar")}}async function Xt(){let e=document.getElementById("wbody-vandaag-cijfers");if(!e)return;let t=a.tabAbort?.signal;try{let s=T("recent",6e4);if(!s){if(s=await Q("/api/recent"),t?.aborted)return;C("recent",s)}let i=s.recenttracks?.track||[],n=new Date().toDateString(),d=i.filter(p=>p.date?.uts&&new Date(parseInt(p.date.uts)*1e3).toDateString()===n),c=new Set(d.map(p=>p.artist?.["#text"])).size,l={};for(let p of d){let x=p.artist?.["#text"]||"";l[x]=(l[x]||0)+1}let r=Object.entries(l).sort((p,x)=>x[1]-p[1])[0];e.innerHTML=`<div class="w-stats-grid">
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
    </div>`}catch(s){if(s.name==="AbortError")return;Z("vandaag-cijfers",s.message)}}async function es(){let e=document.getElementById("wbody-aanbeveling");if(!e)return;let t=a.tabAbort?.signal;try{let s=T("recs",3e5);if(!s){if(s=await Q("/api/recs"),t?.aborted)return;C("recs",s)}let i=s.recommendations||[];if(a.lastRecs=s,!i.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen aanbevelingen</div>';return}let n=Math.floor(Date.now()/864e5),d=i[n%i.length],c=null;try{c=await f(`/api/artist/${encodeURIComponent(d.name)}/info`,{signal:t})}catch{}let l=c?.image?B(c.image,80)||c.image:null,r=(c?.albums||[]).slice(0,3);e.innerHTML=`<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${l?`<img class="w-rec-img" src="${o(l)}" alt="" loading="lazy">`:`<div class="w-rec-ph" style="background:${b(d.name)}">${v(d.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${o(d.name)}">${o(d.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${o(d.reason)}</div>
          ${ae(d.inPlex)}
          ${F("artist",d.name,"",c?.image||"")}
        </div>
      </div>
      ${r.length?`<div class="w-rec-albums">${r.map(p=>`<span class="w-rec-album">${o(p.name)}</span>`).join("")}</div>`:""}
    </div>`}catch(s){if(s.name==="AbortError")return;Z("aanbeveling",s.message)}}async function ts(){let e=document.getElementById("wbody-collectie-stats");if(!e)return;let t=a.tabAbort?.signal;try{let s=await f("/api/plex/status",{signal:t});if(t?.aborted)return;if(!s.connected){e.innerHTML='<div class="empty" style="font-size:12px">Plex offline</div>';return}let i=0;a.lastGaps?.artists&&(i=a.lastGaps.artists.reduce((n,d)=>n+(d.missingCount||0),0)),e.innerHTML=`<div class="w-stats-grid">
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
    </div>`}catch(s){if(s.name==="AbortError")return;Z("collectie-stats",s.message)}}async function St(){let e=a.tabAbort?.signal;try{let t=T("recent",6e4);if(!t){if(t=await f("/api/recent",{signal:e}),e?.aborted)return;C("recent",t)}let s=t.recenttracks?.track||[];if(!s.length){setContent('<div class="empty">Geen recente nummers.</div>');return}let i='<div class="card-list">';for(let n of s){let d=n["@attr"]?.nowplaying,c=n.date?.uts?se(parseInt(n.date.uts)):"",l=n.artist?.["#text"]||"",r=O(n.image),p=r?`<img class="card-img" src="${o(r)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>';d?i+=`<div class="now-playing">${p}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${o(n.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(l)}">${o(l)}</div></div></div>`:i+=`<div class="card">${p}<div class="card-info">
          <div class="card-title">${o(n.name)}</div>
          <div class="card-sub artist-link" data-artist="${o(l)}">${o(l)}</div>
          </div><div class="card-meta">${c}</div>
          <button class="play-btn" data-artist="${o(l)}" data-track="${o(n.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}setContent(i+"</div>")}catch(t){if(t.name==="AbortError")return;setContent(`<div class="error-box">\u26A0\uFE0F ${o(t.message)}</div>`)}}function Ie(){a.activeSubTab=null,R(),Le(),Lt(),setTimeout(()=>{a.activeTab==="nu"&&(ke=setInterval(()=>{if(a.activeTab!=="nu"){Le();return}It()},3e4))},500)}de();async function Tt(e,t,s){if(a.previewBtn===e){a.previewAudio.paused?(await a.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(a.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(a.previewBtn){a.previewAudio.pause(),a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing");let i=a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}a.previewBtn=e,e.textContent="\u2026",e.disabled=!0;try{let i=new URLSearchParams({artist:t,track:s}),n=await f(`/api/preview?${i}`);if(!n.preview){e.textContent="\u2014",e.disabled=!1,setTimeout(()=>{e.textContent==="\u2014"&&(e.textContent="\u25B6")},1800),a.previewBtn=null;return}a.previewAudio.src=n.preview,a.previewAudio.currentTime=0,await a.previewAudio.play(),e.textContent="\u23F8",e.disabled=!1,e.classList.add("playing")}catch{e.textContent="\u25B6",e.disabled=!1,a.previewBtn=null}}a.previewAudio.addEventListener("timeupdate",()=>{if(!a.previewBtn||!a.previewAudio.duration)return;let e=a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width=`${(a.previewAudio.currentTime/a.previewAudio.duration*100).toFixed(1)}%`)});a.previewAudio.addEventListener("ended",()=>{if(a.previewBtn){a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing");let e=a.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width="0%"),a.previewBtn=null}});document.addEventListener("visibilitychange",()=>{document.hidden&&!a.previewAudio.paused&&(a.previewAudio.pause(),a.previewBtn&&(a.previewBtn.textContent="\u25B6",a.previewBtn.classList.remove("playing")))});async function ss(e){let t=document.getElementById("search-results");if(e.length<2){t.classList.remove("open");return}try{let s=await f(`/api/search?q=${encodeURIComponent(e)}`);s.results?.length?t.innerHTML=s.results.map(i=>{let n=B(i.image,56)||i.image,d=n?`<img class="search-result-img" src="${o(n)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${b(i.name)};display:none">${v(i.name)}</div>`:`<div class="search-result-ph" style="background:${b(i.name)}">${v(i.name)}</div>`,c=i.listeners?`${P(i.listeners)} luisteraars`:"";return`<button class="search-result-item" data-artist="${o(i.name)}">
          ${d}
          <div><div class="search-result-name">${o(i.name)}</div>
          ${c?`<div class="search-result-sub">${c}</div>`:""}</div>
        </button>`}).join(""):t.innerHTML='<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>',t.classList.add("open")}catch{}}document.getElementById("search-input").addEventListener("input",e=>{clearTimeout(a.searchTimeout);let t=e.target.value.trim();if(!t){document.getElementById("search-results").classList.remove("open");return}a.searchTimeout=setTimeout(()=>ss(t),320)});document.addEventListener("click",e=>{e.target.closest("#search-wrap")||document.getElementById("search-results").classList.remove("open")});function Se(e,t){let s=(t||"").toLowerCase().trim(),i=e;if(s&&(i=e.filter(c=>c.artist.toLowerCase().includes(s)||c.album.toLowerCase().includes(s))),!i.length)return`<div class="empty">Geen resultaten voor "<strong>${o(t)}</strong>".</div>`;let n=new Map;for(let c of i)n.has(c.artist)||n.set(c.artist,[]),n.get(c.artist).push(c.album);let d=`<div class="section-title">${n.size} artiesten \xB7 ${P(i.length)} albums</div>
    <div class="plib-list">`;for(let[c,l]of n)d+=`
      <div class="plib-artist-block">
        <div class="plib-artist-header artist-link" data-artist="${o(c)}">
          <div class="plib-avatar" style="background:${b(c)}">${v(c)}</div>
          <span class="plib-artist-name">${o(c)}</span>
          <span class="plib-album-count">${l.length}</span>
        </div>
        <div class="plib-albums">
          ${l.map(r=>`<div class="plib-album-row">
            <span class="plib-album-badge">\u25B6</span>
            <span class="plib-album-title" title="${o(r)}">${o(r)}</span>
          </div>`).join("")}
        </div>
      </div>`;return d+"</div>"}async function ce(){D();let e=a.tabAbort?.signal;try{let t=await f("/api/plex/library",{signal:e});if(e?.aborted)return;a.plexLibData=t.library||[];let s=document.getElementById("plib-search");if(s&&(s.value=""),!a.plexLibData.length){$('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik \u21BB Sync Plex om te beginnen.</div>');return}$(Se(a.plexLibData,""))}catch(t){if(t.name==="AbortError")return;M(t.message)}}async function We(e){D();let t=a.tabAbort?.signal;try{let s=`topartists:${e}`,i=T(s,300*1e3);if(!i){if(i=await f(`/api/topartists?period=${e}`,{signal:t}),t?.aborted)return;C(s,i)}let n=i.topartists?.artist||[];if(!n.length){$('<div class="empty">Geen data.</div>');return}let d=parseInt(n[0]?.playcount||1),c=`<div class="section-title">Top artiesten \xB7 ${te(e)}</div><div class="artist-grid">`;for(let l=0;l<n.length;l++){let r=n[l],p=Math.round(parseInt(r.playcount)/d*100),x=O(r.image,"large")||O(r.image),u=B(x,120)||x,g=u?`<img src="${u}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${b(r.name,!0)}">${v(r.name)}</div>`:`<div class="ag-photo-ph" style="background:${b(r.name,!0)}">${v(r.name)}</div>`;c+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${l}" style="view-transition-name: artist-${me(r.name)}">${g}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${o(r.name)}">${o(r.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${p}%"></div></div>
          <div class="ag-plays">${P(r.playcount)} plays</div>
        </div></div>`}$(c+"</div>"),await et(n.map((l,r)=>async()=>{try{let p=await f(`/api/artist/${encodeURIComponent(l.name)}/info`);if(p.image){let x=document.getElementById(`agp-${r}`);x&&(x.innerHTML=`<img src="${B(p.image,120)||p.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}}),4)}catch(s){if(s.name==="AbortError")return;M(s.message)}}async function Ze(e){D();let t=a.tabAbort?.signal;try{let s=`toptracks:${e}`,i=T(s,300*1e3);if(!i){if(i=await f(`/api/toptracks?period=${e}`,{signal:t}),t?.aborted)return;C(s,i)}let n=i.toptracks?.track||[];if(!n.length){$('<div class="empty">Geen data.</div>');return}let d=parseInt(n[0]?.playcount||1),c=`<div class="section-title">Top nummers \xB7 ${te(e)}</div><div class="card-list">`;for(let l of n){let r=Math.round(parseInt(l.playcount)/d*100);c+=`<div class="card">${Ae(l.image)}<div class="card-info">
        <div class="card-title">${o(l.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(l.artist?.name||"")}">${o(l.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${r}%"></div></div>
        </div><div class="card-meta">${P(l.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${o(l.artist?.name||"")}" data-track="${o(l.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}$(c+"</div>")}catch(s){if(s.name==="AbortError")return;M(s.message)}}async function Bt(){D();let e=a.tabAbort?.signal;try{let t=T("loved",6e5);if(!t){if(t=await f("/api/loved",{signal:e}),e?.aborted)return;C("loved",t)}let s=t.lovedtracks?.track||[];if(!s.length){$('<div class="empty">Geen geliefde nummers.</div>');return}let i='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let n of s){let d=n.date?.uts?se(parseInt(n.date.uts)):"";i+=`<div class="card">${Ae(n.image)}<div class="card-info">
        <div class="card-title">${o(n.name)}</div>
        <div class="card-sub artist-link" data-artist="${o(n.artist?.name||"")}">${o(n.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${d}</div>
        <button class="play-btn" data-artist="${o(n.artist?.name||"")}" data-track="${o(n.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}$(i+"</div>")}catch(t){if(t.name==="AbortError")return;M(t.message)}}async function Je(){D("Statistieken ophalen...");let e=a.tabAbort?.signal;try{let t=T("stats",6e5);if(!t){if(t=await f("/api/stats",{signal:e}),e?.aborted)return;C("stats",t)}$(`
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
      </div>`,()=>as(t))}catch(t){if(t.name==="AbortError")return;M(t.message)}}function as(e){if(typeof Chart>"u")return;let t=!window.matchMedia("(prefers-color-scheme: light)").matches,s=t?"#2c2c2c":"#ddd",i=t?"#888":"#777",n=t?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=s;let d=document.getElementById("chart-daily");d&&new Chart(d,{type:"bar",data:{labels:e.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:e.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:s},ticks:{color:i},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&e.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:e.topArtists.map(r=>r.name),datasets:[{data:e.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:s},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:n,font:{size:11}}}}}});let l=document.getElementById("chart-genres");if(l&&e.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(l,{type:"doughnut",data:{labels:e.genres.map(p=>p.name),datasets:[{data:e.genres.map(p=>p.count),backgroundColor:r.slice(0,e.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function ue(){D("Collectiegaten zoeken...");let e=a.tabAbort?.signal;try{let t=await f("/api/gaps",{signal:e});if(e?.aborted)return;if(t.status==="building"&&(!t.artists||!t.artists.length)){$(`<div class="loading"><div class="spinner"></div>
        <div>${o(t.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{a.activeSubTab==="gaten"&&ue()},2e4);return}if(a.lastGaps=t,pe(),t.builtAt&&Date.now()-t.builtAt>864e5){let s=document.createElement("div");s.className="refresh-banner",s.textContent="\u21BB Gaps worden op de achtergrond ververst...";let i=a.sectionContainerEl||document.getElementById("content");i&&i.prepend(s),fetch("/api/gaps/refresh",{method:"POST"}).catch(()=>{})}}catch(t){if(t.name==="AbortError")return;M(t.message)}}function pe(){if(!a.lastGaps)return;let e=[...a.lastGaps.artists||[]];if(!e.length){$('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}a.gapsSort==="missing"&&e.sort((i,n)=>n.missingAlbums.length-i.missingAlbums.length),a.gapsSort==="name"&&e.sort((i,n)=>i.name.localeCompare(n.name));let t=e.reduce((i,n)=>i+n.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=t;let s=`<div class="section-title">${t} ontbrekende albums bij ${e.length} artiesten die je al hebt</div>`;for(let i of e){let n=Math.round(i.ownedCount/i.totalCount*100),d=[J(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),c=B(i.image,56)||i.image,l=c?`<img class="gaps-photo" src="${o(c)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${b(i.name)}">${v(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${b(i.name)}">${v(i.name)}</div>`;s+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${l}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${o(i.name)}">${o(i.name)}</div>
              ${F("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${o(d)}</div>
            ${G(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let r of i.missingAlbums)s+=ie(r,!1,i.name);s+="</div>",i.allAlbums?.filter(r=>r.inPlex).length>0&&(s+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(r=>r.inPlex).map(r=>ie(r,!1,i.name)).join("")}
        </div>
      </details>`),s+="</div>"}$(s)}async function Ct(e){a.bibSubTab=e;let t=document.getElementById("bib-sub-content"),s=document.getElementById("bib-subtoolbar");if(!t)return;document.querySelectorAll(".bib-tab").forEach(n=>n.classList.toggle("active",n.dataset.bibtab===e)),s&&(e==="collectie"?(s.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <input class="plib-search" id="plib-search-bib" type="text"
            placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off" style="flex:1;min-width:0">
          <button class="tool-btn" id="btn-sync-plex-bib">\u21BB Sync Plex</button>
        </div>`,document.getElementById("plib-search-bib")?.addEventListener("input",n=>{a.plexLibData&&(t.innerHTML=Se(a.plexLibData,n.target.value))}),document.getElementById("btn-sync-plex-bib")?.addEventListener("click",async()=>{let n=document.getElementById("btn-sync-plex-bib"),d=n.textContent;n.disabled=!0,n.textContent="\u21BB Bezig\u2026";try{try{await k("/api/plex/refresh",{method:"POST"})}catch(l){if(l.name!=="AbortError")throw l}await W(),a.plexLibData=null;let c=t;a.sectionContainerEl=c,await ce(),a.sectionContainerEl===c&&(a.sectionContainerEl=null)}catch{}finally{n.disabled=!1,n.textContent=d}})):s.innerHTML="");let i=t;a.sectionContainerEl=i;try{e==="collectie"?(a.activeSubTab="collectie",await ce()):e==="lijst"&&(a.activeSubTab="lijst",await oe())}finally{a.sectionContainerEl===i&&(a.sectionContainerEl=null)}}async function Ke(){a.activeSubTab="collectie",R(),S.innerHTML=`
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${te(a.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${te(a.currentPeriod)})</span></div>
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
    </div>`,S.style.opacity="1",S.style.transform="",document.querySelectorAll(".bib-tab").forEach(e=>e.addEventListener("click",()=>Ct(e.dataset.bibtab))),await Promise.all([H(document.getElementById("strip-artists-body"),()=>We(a.currentPeriod)),H(document.getElementById("strip-tracks-body"),()=>Ze(a.currentPeriod))]),await Ct(a.bibSubTab),ne(document.getElementById("bib-stats-content"),()=>{let e=document.getElementById("bib-stats-content");return H(e,Je)})}de();function Ye(e){let t=document.getElementById("panel-overlay"),s=document.getElementById("panel-content"),i=me(e),n=()=>{s.innerHTML=`<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`,t.classList.add("open"),document.body.style.overflow="hidden"};document.startViewTransition?document.startViewTransition(n).finished.catch(()=>{}):n(),Promise.allSettled([f(`/api/artist/${encodeURIComponent(e)}/info`),f(`/api/artist/${encodeURIComponent(e)}/similar`)]).then(([d,c])=>{let l=d.status==="fulfilled"?d.value:{},r=c.status==="fulfilled"?c.value.similar||[]:[],p=B(l.image,400)||l.image,x=p?`<img src="${o(p)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${b(e)};display:none">${v(e)}</div>`:`<div class="panel-photo-ph" style="background:${b(e)}">${v(e)}</div>`,u=[l.country?J(l.country)+" "+l.country:null,l.startYear?`Actief vanaf ${l.startYear}`:null,a.plexOk&&l.inPlex!==void 0?l.inPlex?"\u25B6 In Plex":"\u2726 Nieuw voor jou":null].filter(Boolean).join(" \xB7 "),g="";if(l.albums?.length){g='<div class="panel-section">Albums</div><div class="panel-albums">';for(let y of l.albums){let E=B(y.image,48)||y.image,A=E?`<img class="panel-album-img" src="${o(E)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="panel-album-ph">\u266A</div>',z=a.plexOk&&y.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6</span>':"",m=a.plexOk&&y.inPlex&&y.ratingKey?`<button class="plex-play-album-btn" data-rating-key="${o(y.ratingKey)}" title="Afspelen op Plex">\u25B6 Speel af</button>`:"";g+=`<div class="panel-album-row">${A}
          <span class="panel-album-name">${o(y.name)}</span>${z}${m}${N(e,y.name,y.inPlex)}</div>`}g+="</div>"}let h="";if(r.length){h='<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">';for(let y of r)h+=`<button class="panel-similar-chip artist-link" data-artist="${o(y.name)}">${o(y.name)}</button>`;h+="</div>"}s.innerHTML=`
      <div class="panel-photo-wrap" style="view-transition-name: artist-${i}">${x}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${o(e)}</div>
          ${F("artist",e,"",l.image||"")}
        </div>
        ${u?`<div class="panel-meta">${o(u)}</div>`:""}
        ${G(l.tags,6)}
        ${g}
        ${h}
      </div>`,s.querySelectorAll(".plex-play-album-btn").forEach(y=>{y.addEventListener("click",async E=>{E.stopPropagation();let A=y.dataset.ratingKey;if(A){y.disabled=!0,y.textContent="\u2026";let z=await _e(A,"music");y.disabled=!1,y.textContent=z?"\u25B6 Speelt af":"\u25B6 Speel af",z&&setTimeout(()=>{y.textContent="\u25B6 Speel af"},3e3)}})})})}function Te(){document.getElementById("panel-overlay").classList.remove("open"),document.body.style.overflow=""}var Ce={nu:()=>Ie(),ontdek:()=>ee(),bibliotheek:()=>Ke(),downloads:()=>ft(),discover:()=>Y(),gaps:()=>ue(),recent:()=>St(),recs:()=>he(),releases:()=>K(),topartists:()=>We(a.currentPeriod),toptracks:()=>Ze(a.currentPeriod),loved:()=>Bt(),stats:()=>Je(),wishlist:()=>oe(),plexlib:()=>ce(),tidal:()=>He()};document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,s=document.querySelectorAll(".tab"),i=document.querySelector(".tab.active"),n=Array.from(s).indexOf(i),c=Array.from(s).indexOf(e)>n?"rtl":"ltr";if(document.documentElement.style.setProperty("--tab-direction",c==="ltr"?"-1":"1"),s.forEach(l=>l.classList.remove("active")),e.classList.add("active"),a.activeTab=t,a.sectionContainerEl=null,a.tabAbort&&a.tabAbort.abort(),a.tabAbort=new AbortController,["tb-period","tb-recs","tb-mood","tb-releases","tb-discover","tb-gaps","tb-plexlib","tb-tidarr-ui"].forEach(l=>document.getElementById(l)?.classList.remove("visible")),document.getElementById("tb-gaps")?.classList.toggle("visible",t==="gaps"),document.getElementById("tb-tidal")?.classList.toggle("visible",t==="downloads"),t!=="downloads"&&R(),t!=="downloads"&&void 0,t!=="nu"&&Le(),document.startViewTransition)document.startViewTransition(async()=>{try{await Ce[t]?.()}catch(l){if(l.name==="AbortError")return;console.error("Tab load error:",l),S.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l.message}. Druk op R om opnieuw te proberen.</div>`}}).finished.catch(()=>{});else try{Ce[t]?.()}catch(l){if(l.name==="AbortError")return;console.error("Tab load error:",l),S.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l.message}. Druk op R om opnieuw te proberen.</div>`}})});document.querySelectorAll("[data-period]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-period]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.currentPeriod=e.dataset.period,Ce[a.activeTab]?.()})});document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-plex")),a.recsFilter=e.dataset.filter,e.classList.add(a.recsFilter==="all"?"sel-def":a.recsFilter==="new"?"sel-new":"sel-plex"),$e()})});document.querySelectorAll("[data-dfilter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-dfilter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-miss")),a.discFilter=e.dataset.dfilter,e.classList.add(a.discFilter==="all"?"sel-def":a.discFilter==="new"?"sel-new":"sel-miss"),re()})});document.querySelectorAll("[data-gsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-gsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.gapsSort=e.dataset.gsort,pe()})});document.querySelectorAll("[data-rtype]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rtype]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.releasesFilter=e.dataset.rtype,_()})});document.querySelectorAll("[data-rsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),a.releasesSort=e.dataset.rsort,_()})});document.getElementById("btn-refresh-releases")?.addEventListener("click",async()=>{a.lastReleases=null,U("releases");try{await k("/api/releases/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}K()});document.getElementById("btn-refresh-discover")?.addEventListener("click",async()=>{a.lastDiscover=null,U("discover");try{await k("/api/discover/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}Y()});document.getElementById("btn-refresh-gaps")?.addEventListener("click",async()=>{a.lastGaps=null;try{await k("/api/gaps/refresh",{method:"POST"})}catch(e){if(e.name!=="AbortError")throw e}ue()});document.getElementById("plib-search")?.addEventListener("input",e=>{!a.plexLibData||a.activeSubTab!=="collectie"||(S.innerHTML=Se(a.plexLibData,e.target.value))});document.getElementById("btn-sync-plex")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex"),t=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{try{await k("/api/plex/refresh",{method:"POST"})}catch(s){if(s.name!=="AbortError")throw s}await W(),a.plexLibData=null,a.activeSubTab==="collectie"&&await ce()}catch{}finally{e.disabled=!1,e.textContent=t}});document.getElementById("plex-refresh-btn")?.addEventListener("click",async()=>{let e=document.getElementById("plex-refresh-btn");e.classList.add("spinning"),e.disabled=!0;try{try{await k("/api/plex/refresh",{method:"POST"})}catch(t){if(t.name!=="AbortError")throw t}await W(),a.plexLibData=null}catch{}finally{e.classList.remove("spinning"),e.disabled=!1}});document.getElementById("tidal-search")?.addEventListener("input",e=>{clearTimeout(a.tidalSearchTimeout);let t=e.target.value.trim();a.tidalSearchTimeout=setTimeout(()=>{a.activeSubTab==="tidal"&&a.tidalView==="search"&&Me(t)},400)});document.getElementById("panel-close")?.addEventListener("click",Te);document.addEventListener("click",async e=>{let t=e.target.closest(".play-btn");if(t){e.stopPropagation(),Tt(t,t.dataset.artist,t.dataset.track);return}let s=e.target.closest(".disc-toggle-btn");if(s){e.stopPropagation();let m=s.dataset.discId,w=document.getElementById(m);if(w){let L=w.classList.toggle("collapsed");w.querySelectorAll(".disc-toggle-btn").forEach(I=>{I.classList.toggle("expanded",!L),I.classList.toggle("collapsed",L);let q=parseInt(I.dataset.albumCount,10)||0,j=`${q} album${q!==1?"s":""}`;I.textContent=L?`Toon ${j}`:j})}return}let i=e.target.closest(".discover-card-toggle");if(i&&!e.target.closest(".artist-link")&&!e.target.closest(".bookmark-btn")&&!e.target.closest(".disc-toggle-btn")){let m=i.dataset.discId,w=document.getElementById(m);if(w){let L=w.classList.toggle("collapsed");w.querySelectorAll(".disc-toggle-btn").forEach(I=>{I.classList.toggle("expanded",!L),I.classList.toggle("collapsed",L);let q=parseInt(I.dataset.albumCount,10)||0,j=`${q} album${q!==1?"s":""}`;I.textContent=L?`Toon ${j}`:j})}return}let n=e.target.closest("[data-artist]");if(n?.dataset.artist&&!n.classList.contains("bookmark-btn")){n.classList.contains("search-result-item")&&(document.getElementById("search-results").classList.remove("open"),document.getElementById("search-input").value=""),Ye(n.dataset.artist);return}let d=e.target.closest(".bookmark-btn");if(d){e.stopPropagation();let{btype:m,bname:w,bartist:L,bimage:I}=d.dataset,q=await lt(m,w,L,I);d.classList.toggle("saved",q),d.title=q?"Verwijder uit lijst":"Sla op in lijst",document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(w)}"][data-btype="${m}"]`).forEach(j=>{j.classList.toggle("saved",q)});return}let c=e.target.closest(".wish-remove[data-wid]");if(c){try{await k(`/api/wishlist/${c.dataset.wid}`,{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}a.wishlistMap.forEach((m,w)=>{String(m)===c.dataset.wid&&a.wishlistMap.delete(w)}),le(),oe();return}let l=e.target.closest(".panel-similar-chip[data-artist]");if(l){Ye(l.dataset.artist);return}let r=e.target.closest(".download-btn, .tidal-dl-btn");if(r){if(e.stopPropagation(),r.classList.contains("tidal-dl-btn")){let L=r.dataset.dlurl;if(!L)return;r.disabled=!0;let I=r.textContent;r.textContent="\u2026";try{let q=await k("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:L})}),j=await q.json();if(!q.ok||!j.ok)throw new Error(j.error||"download mislukt");r.textContent="\u2713 Toegevoegd",r.classList.add("downloaded"),fe()}catch(q){alert("Downloaden mislukt: "+q.message),r.textContent=I,r.disabled=!1}return}let{dlartist:m,dlalbum:w}=r.dataset;await gt(m,w,r);return}let p=e.target.closest(".q-remove[data-qid]");if(p){e.stopPropagation();try{try{await k("/api/tidarr/queue/"+encodeURIComponent(p.dataset.qid),{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}}catch(m){alert("Verwijderen mislukt: "+m.message)}return}let x=e.target.closest(".q-remove[data-dlid]");if(x){e.stopPropagation();try{try{await k(`/api/downloads/${x.dataset.dlid}`,{method:"DELETE"})}catch(m){if(m.name!=="AbortError")throw m}x.closest(".q-row")?.remove()}catch(m){alert("Verwijderen mislukt: "+m.message)}return}let u=e.target.closest(".inline-toolbar [data-filter]");if(u){document.querySelectorAll("[data-filter]").forEach(m=>m.classList.remove("sel-def","sel-new","sel-plex")),a.recsFilter=u.dataset.filter,u.classList.add(a.recsFilter==="all"?"sel-def":a.recsFilter==="new"?"sel-new":"sel-plex"),$e();return}let g=e.target.closest(".inline-toolbar [data-rtype]");if(g){document.querySelectorAll("[data-rtype]").forEach(w=>w.classList.remove("sel-def")),a.releasesFilter=g.dataset.rtype,g.classList.add("sel-def");let m=document.getElementById("sec-releases-content");m&&a.activeTab==="ontdek"?(a.sectionContainerEl=m,_(),a.sectionContainerEl===m&&(a.sectionContainerEl=null)):_();return}let h=e.target.closest(".inline-toolbar [data-rsort]");if(h){document.querySelectorAll("[data-rsort]").forEach(w=>w.classList.remove("sel-def")),a.releasesSort=h.dataset.rsort,h.classList.add("sel-def");let m=document.getElementById("sec-releases-content");m&&a.activeTab==="ontdek"?(a.sectionContainerEl=m,_(),a.sectionContainerEl===m&&(a.sectionContainerEl=null)):_();return}let y=e.target.closest(".inline-toolbar [data-dfilter]");if(y){document.querySelectorAll("[data-dfilter]").forEach(w=>w.classList.remove("sel-def","sel-new","sel-miss")),a.discFilter=y.dataset.dfilter,y.classList.add(a.discFilter==="all"?"sel-def":a.discFilter==="new"?"sel-new":"sel-miss");let m=document.getElementById("sec-discover-content");m&&a.activeTab==="ontdek"?(a.sectionContainerEl=m,re(),a.sectionContainerEl===m&&(a.sectionContainerEl=null)):re();return}let E=e.target.closest(".inline-toolbar [data-gsort]");if(E){document.querySelectorAll("[data-gsort]").forEach(m=>m.classList.remove("sel-def")),a.gapsSort=E.dataset.gsort,E.classList.add("sel-def"),a.activeTab==="gaps"?pe():pe();return}let A=e.target.closest(".sec-mood-block [data-mood]");if(A){let m=A.dataset.mood;if(a.activeMood===m){a.activeMood=null,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),X(),ee();return}a.activeMood=m,document.querySelectorAll("[data-mood]").forEach(L=>L.classList.remove("sel-mood","loading")),A.classList.add("sel-mood");let w=A.closest(".inline-toolbar");if(w&&!document.getElementById("btn-clear-mood-inline")){let L=document.createElement("span");L.className="toolbar-sep";let I=document.createElement("button");I.className="tool-btn",I.id="btn-clear-mood-inline",I.textContent="\u2715 Wis mood",I.addEventListener("click",()=>{a.activeMood=null,document.querySelectorAll("[data-mood]").forEach(q=>q.classList.remove("sel-mood","loading")),X(),ee()}),w.appendChild(L),w.appendChild(I)}we(m);return}let z=e.target.closest("[data-tidal-view]");if(z){let m=z.dataset.tidalView;m==="tidarr"?(document.getElementById("tb-tidal")?.classList.remove("visible"),document.getElementById("tb-tidarr-ui")?.classList.add("visible"),pt()):(R(),document.getElementById("tb-tidal")?.classList.add("visible"),document.getElementById("tb-tidarr-ui")?.classList.remove("visible"),be(m));return}if(e.target===document.getElementById("panel-overlay")){Te();return}});document.addEventListener("keydown",e=>{if(e.key==="Escape"){Te(),document.getElementById("search-results").classList.remove("open");return}let t=["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);if(e.key==="/"&&!t){e.preventDefault(),document.getElementById("search-input").focus();return}if(e.key==="r"&&!t){a.activeTab==="ontdek"?ee():a.activeTab==="bibliotheek"?Ke():a.activeTab==="gaps"?ue():Ce[a.activeTab]?.();return}if(!t&&/^[1-5]$/.test(e.key)){let s=document.querySelectorAll(".tab"),i=parseInt(e.key)-1;s[i]&&s[i].click();return}});document.querySelectorAll(".bnav-btn").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,s=document.querySelector(`.tab[data-tab="${t}"]`);s&&s.click(),document.querySelectorAll(".bnav-btn").forEach(i=>i.classList.toggle("active",i===e))})});document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab;document.querySelectorAll(".bnav-btn").forEach(s=>s.classList.toggle("active",s.dataset.tab===t))})});Be&&document.documentElement.setAttribute("data-reduce-motion","true");function At(e){document.documentElement.dataset.theme=e;let t=document.getElementById("theme-toggle");t&&(t.textContent=e==="dark"?"\u2600\uFE0F":"\u{1F319}")}(function(){let t=localStorage.getItem("theme");At(t||"light")})();document.getElementById("theme-toggle")?.addEventListener("click",()=>{let t=document.documentElement.dataset.theme==="dark"?"light":"dark";At(t),localStorage.setItem("theme",t)});(function(){let t=localStorage.getItem("downloadQuality")||"high",s=document.getElementById("download-quality");s&&a.VALID_QUALITIES.includes(t)&&(s.value=t)})();document.getElementById("download-quality")?.addEventListener("change",e=>{localStorage.setItem("downloadQuality",e.target.value)});Ge();W();Qe();nt();qe();Pe();it();ye();yt();Ie();setInterval(Qe,3e4);})();
