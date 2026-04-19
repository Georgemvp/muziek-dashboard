(()=>{var s={currentTab:"nu",currentMainTab:"nu",bibSubTab:"collectie",sectionContainerEl:null,currentPeriod:"7day",recsFilter:"all",discFilter:"all",gapsSort:"missing",releasesSort:"listening",releasesFilter:"all",plexOk:!1,lastDiscover:null,lastGaps:null,lastReleases:null,plexLibData:null,wishlistMap:new Map,newReleaseIds:new Set,searchTimeout:null,tidalSearchTimeout:null,tidarrOk:!1,tidalView:"search",tidalSearchResults:null,tidarrQueuePoll:null,tidarrSseSource:null,tidarrQueueItems:[],downloadedSet:new Set,spotifyEnabled:!1,activeMood:null,previewAudio:new Audio,previewBtn:null,collapsibleSections:{recs:!1,releases:!1,discover:!1},sectionMutex:Promise.resolve(),dlResolve:null,VALID_QUALITIES:["max","high","normal","low"]};var be=window.matchMedia("(prefers-reduced-motion: reduce)").matches,S=document.getElementById("content");

/* === DOM Helpers === */
function _el(tag, cls, txt) {
  var el = document.createElement(tag);
  if (cls) el.className = cls;
  if (txt != null) el.textContent = txt;
  return el;
}
function _htmlToFrag(html) {
  if (!html) return null;
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var frag = document.createDocumentFragment();
  while (tmp.firstChild) frag.appendChild(tmp.firstChild);
  return frag;
}
function T(e,t=120){return e?`/api/img?url=${encodeURIComponent(e)}&w=${t}&h=${t}`:null}var z=(e,t="medium")=>{if(!e)return null;let a=e.find(i=>i.size===t);return a&&a["#text"]&&!a["#text"].includes("2a96cbd8b46e442fc41c2b86b821562f")?a["#text"]:null},m=e=>String(e||"?").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2),q=e=>parseInt(e).toLocaleString("nl-NL"),l=e=>String(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"),Y=e=>({"7day":"week","1month":"maand","3month":"3 maanden","12month":"jaar",overall:"alles"})[e]||e;function ie(e){let t=Math.floor(Date.now()/1e3)-e;return t<120?"zojuist":t<3600?`${Math.floor(t/60)}m`:t<86400?`${Math.floor(t/3600)}u`:`${Math.floor(t/86400)}d`}function g(e,t=!1){let a=0;for(let r=0;r<e.length;r++)a=a*31+e.charCodeAt(r)&16777215;let i=a%360,n=45+a%31,d=50+(a>>8)%26,c=20+(a>>16)%16,o=15+(a>>10)%11;return t?`radial-gradient(circle, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${o}%))`:`linear-gradient(135deg, hsl(${i},${n}%,${c}%), hsl(${(i+40)%360},${d}%,${o}%))`}function O(e){return!e||e.length!==2?"":[...e.toUpperCase()].map(t=>String.fromCodePoint(t.charCodeAt(0)+127397)).join("")}function H(e,t=4){return e?.length?`<div class="tags" style="margin-top:5px">${e.slice(0,t).map(a=>`<span class="tag">${l(a)}</span>`).join("")}</div>`:""}function ye(e){return s.plexOk?e?'<span class="badge plex">\u25B6 In Plex</span>':'<span class="badge new">\u2726 Nieuw</span>':""}function N(e,t,a="",i=""){let n=s.wishlistMap.has(`${e}:${t}`);return`<button class="bookmark-btn${n?" saved":""}"
    data-btype="${l(e)}" data-bname="${l(t)}"
    data-bartist="${l(a)}" data-bimage="${l(i)}"
    title="${n?"Verwijder uit lijst":"Sla op in lijst"}">\u{1F516}</button>`}function ne(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").substring(0,50)}function Me(e,t){let a=i=>(i||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");return`${a(e)}|${a(t)}`}var De=(e,t)=>s.downloadedSet.has(Me(e,t)),Re=(e,t)=>s.downloadedSet.add(Me(e,t));function V(e,t="",a=!1){return!s.tidarrOk||a?"":De(e,t)?`<button class="download-btn dl-done"
      data-dlartist="${l(e)}" data-dlalbum="${l(t)}"
      title="Al gedownload">\u2713</button>`:`<button class="download-btn"
    data-dlartist="${l(e)}" data-dlalbum="${l(t)}"
    title="Download via Tidarr">\u2B07</button>`}var J=e=>{let t=z(e);return t?`<img class="card-img" src="${t}" alt="" loading="lazy"
      onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>'};function Z(e, t, a) {
  if (t === undefined) t = true;
  if (a === undefined) a = "";
  var i        = e.inPlex;
  var grad     = g(e.title || "");
  var d        = e.year || "\u2014";
  var isDl     = De(a, e.title || "");

  var card = _el('div', 'album-card ' + (i ? 'owned' : 'missing'));
  card.title = (e.title || "") + (d !== "\u2014" ? " (" + d + ")" : "");

  /* --- cover --- */
  var cover = _el('div', 'album-cover');
  cover.style.background = grad;
  cover.append(_el('div', 'album-cover-ph', m(e.title || "?")));
  if (e.coverUrl) {
    var img = document.createElement('img');
    img.src = e.coverUrl;
    img.alt = '';
    img.loading = 'lazy';
    img.style.cssText = "opacity:0;transition:opacity 0.35s;position:relative;z-index:1";
    img.onload  = function() { this.style.opacity = '1'; };
    img.onerror = function() { this.remove(); };
    cover.append(img);
  }
  if (s.tidarrOk && a && !i) {
    var dlBtn = document.createElement('button');
    dlBtn.className      = 'album-dl-btn download-btn' + (isDl ? ' dl-done' : '');
    dlBtn.dataset.dlartist = a;
    dlBtn.dataset.dlalbum  = e.title || "";
    dlBtn.title     = isDl ? "Al gedownload" : "Download via Tidarr";
    dlBtn.textContent = isDl ? "\u2713" : "\u2B07";
    cover.append(dlBtn);
  }
  card.append(cover);

  /* --- info --- */
  var info = _el('div', 'album-info');
  info.append(_el('div', 'album-title', e.title || ""));
  info.append(_el('div', 'album-year', d));
  if (t) {
    info.append(_el('span', 'album-status ' + (i ? 'own' : 'miss'),
                    i ? "\u25B6 In Plex" : "\u2726 Ontbreekt"));
  }
  card.append(info);
  return card;
}
function Pe(){if(be)return;Object.entries({".rec-grid > *":60,".card-list > *":25,".artist-grid > *":40,".releases-grid > *":40,".wishlist-grid > *":40}).forEach(([t,a])=>{document.querySelectorAll(t).forEach((i,n)=>{i.style.animationDelay=`${n*a}ms`})})}function at(e){let t="";e==="cards"?t='<div class="skeleton-list">'+Array(6).fill('<div class="skeleton skeleton-card"></div>').join("")+"</div>":e==="grid"?t='<div class="skeleton-grid">'+Array(8).fill('<div class="skeleton skeleton-square"></div>').join("")+"</div>":e==="stats"?t='<div class="skeleton-stats"><div class="skeleton skeleton-stat-full"></div><div class="skeleton-two"><div class="skeleton skeleton-stat-half"></div><div class="skeleton skeleton-stat-half"></div></div></div>':t=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`,b(t)}function b(e, t) {
  var a      = s.sectionContainerEl || S;
  var isNode = (e != null && typeof e === 'object' && e.nodeType != null);
  function _set() { if (isNode) { a.replaceChildren(e); } else { a.innerHTML = e; } }
  if (!s.sectionContainerEl && document.startViewTransition) {
    document.startViewTransition(function() { _set(); Pe(); if (t) requestAnimationFrame(t); }).finished.catch(function() {});
  } else {
    _set();
    if (s.sectionContainerEl) { if (t) t(); }
    else {
      S.style.opacity = "0";
      S.style.transform = "translateY(6px)";
      requestAnimationFrame(function() {
        S.offsetHeight;
        S.style.opacity = "1";
        S.style.transform = "";
        Pe();
        if (t) requestAnimationFrame(t);
      });
    }
  }
}
var B=e=>b(`<div class="error-box">\u26A0\uFE0F ${l(e)}</div>`);function C(e){if(s.sectionContainerEl){s.sectionContainerEl.innerHTML=`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`;return}let a={recent:"cards",loved:"cards",toptracks:"cards",topartists:"grid",releases:"grid",recs:"grid",discover:"grid",gaps:"grid",stats:"stats",wishlist:"grid",plexlib:"cards",nu:"cards",ontdek:"grid",bibliotheek:"cards",downloads:"cards"}[s.currentTab];a&&!e?at(a):b(`<div class="loading"><div class="spinner"></div>${e||"Laden..."}</div>`)}function X(e,t){if(!e)return;if(!("IntersectionObserver"in window)){t();return}let a=new IntersectionObserver(i=>{i.forEach(n=>{n.isIntersecting&&(a.unobserve(n.target),t())})},{rootMargin:"300px"});a.observe(e)}function virtualRender(container, items, renderFn, opts) {
  var batchSize  = (opts && opts.batchSize)  || 8;
  var rootMargin = (opts && opts.rootMargin) || "400px";
  var onBatch    = opts && opts.onBatch;
  var rendered   = 0;
  function renderBatch() {
    var end      = Math.min(rendered + batchSize, items.length);
    var startIdx = rendered;
    var frag     = document.createDocumentFragment();
    for (var i = rendered; i < end; i++) {
      var result = renderFn(items[i], i);
      if (result == null) { /* skip */ }
      else if (typeof result === 'string') {
        var tmp = document.createElement('div');
        tmp.innerHTML = result;
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      } else if (result.nodeType) {
        frag.appendChild(result);
      }
    }
    rendered = end;
    var old = container.querySelector(".vr-sentinel");
    if (old) old.remove();
    container.appendChild(frag);
    if (onBatch) onBatch(startIdx, rendered);
    if (rendered < items.length) {
      var sent = document.createElement("div");
      sent.className = "vr-sentinel";
      sent.style.cssText = "height:1px;visibility:hidden;pointer-events:none;grid-column:1/-1";
      container.appendChild(sent);
      var obs = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) { obs.disconnect(); renderBatch(); }
      }, { rootMargin: rootMargin });
      obs.observe(sent);
    }
  }
  renderBatch();
}
function R(e,t){let a=s.sectionMutex.then(async()=>{s.sectionContainerEl=e;try{await t()}finally{s.sectionContainerEl=null}});return s.sectionMutex=a.catch(()=>{}),a}async function f(e){let t=await fetch(e);if(!t.ok)throw new Error(`Serverfout ${t.status}`);return t.json()}async function je(){try{let e=await f("/api/downloads/keys");s.downloadedSet=new Set(e)}catch{s.downloadedSet=new Set}}async function F(){try{let e=await fetch("/api/plex/status").then(i=>i.json()),t=document.getElementById("plex-pill"),a=document.getElementById("plex-pill-text");if(e.connected){s.plexOk=!0,t.className="plex-pill on";let i=e.albums?` \xB7 ${q(e.albums)} albums`:"";a.textContent=`Plex \xB7 ${q(e.artists)} artiesten${i}`}else t.className="plex-pill off",a.textContent="Plex offline"}catch{document.getElementById("plex-pill-text").textContent="Plex offline"}}async function He(){try{let t=(await f("/api/user")).user,a=z(t.image,"large"),i=a?`<img class="user-avatar" src="${a}" alt="">`:`<div class="user-avatar-ph">${(t.name||"U")[0].toUpperCase()}</div>`,n=new Date(parseInt(t.registered?.unixtime)*1e3).getFullYear();document.getElementById("user-wrap").innerHTML=`
      <div class="user-card">${i}
        <div><div class="user-name">${l(t.realname||t.name)}</div>
        <div class="user-sub">${q(t.playcount)} scrobbles \xB7 lid sinds ${n}</div></div>
      </div>`}catch{}}async function he(){try{let e=await f("/api/wishlist");s.wishlistMap.clear();for(let t of e)s.wishlistMap.set(`${t.type}:${t.name}`,t.id);K()}catch{}}function K(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=s.wishlistMap.size||"0")}async function Fe(e,t,a,i){let n=`${e}:${t}`;if(s.wishlistMap.has(n))return await fetch(`/api/wishlist/${s.wishlistMap.get(n)}`,{method:"DELETE"}),s.wishlistMap.delete(n),K(),!1;{let c=await(await fetch("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:t,artist:a,image:i})})).json();return s.wishlistMap.set(n,c.id),K(),!0}}async function ee(){C(),await he();try{let e=await f("/api/wishlist");if(!e.length){b('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let t=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let a of e){let i=a.image?`<img src="${l(a.image)}" alt="" loading="lazy"
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
        </div>`}b(t+"</div>")}catch(e){B(e.message)}}function it(){return localStorage.getItem("downloadQuality")||"high"}async function $e(){try{let e=await f("/api/tidarr/status"),t=document.getElementById("tidarr-status-pill"),a=document.getElementById("tidarr-status-text");s.tidarrOk=!!e.connected,t&&a&&(t.className=`tidarr-status-pill ${s.tidarrOk?"on":"off"}`,a.textContent=s.tidarrOk?`Tidarr \xB7 verbonden${e.quality?" \xB7 "+e.quality:""}`:"Tidarr offline")}catch{s.tidarrOk=!1;let e=document.getElementById("tidarr-status-text");e&&(e.textContent="Tidarr offline")}}async function le(){try{let t=((await f("/api/tidarr/queue")).items||[]).length,a=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let i of a)i&&(t>0?(i.textContent=t,i.style.display=""):i.style.display="none")}catch{}}function ze(e){let t=e.image?`<img class="tidal-img" src="${l(e.image)}" alt="" loading="lazy"
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
    </div>`}async function we(e){let t=document.getElementById("tidal-content");if(!t)return;let a=(e||"").trim();if(a.length<2){t.innerHTML='<div class="empty">Begin met typen om te zoeken op Tidal.</div>';return}t.innerHTML='<div class="loading"><div class="spinner"></div>Zoeken op Tidal\u2026</div>';try{let i=await f(`/api/tidarr/search?q=${encodeURIComponent(a)}`);if(s.tidalSearchResults=i.results||[],i.error){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${l(i.error)}</div>`;return}if(!s.tidalSearchResults.length){t.innerHTML=`<div class="empty">Geen resultaten op Tidal voor "<strong>${l(a)}</strong>".</div>`;return}let n=s.tidalSearchResults.filter(o=>o.type==="album"),d=s.tidalSearchResults.filter(o=>o.type==="track"),c="";n.length&&(c+=`<div class="section-title">Albums (${n.length})</div>
        <div class="tidal-grid">${n.map(ze).join("")}</div>`),d.length&&(c+=`<div class="section-title" style="margin-top:1.5rem">Nummers (${d.length})</div>
        <div class="tidal-grid">${d.map(ze).join("")}</div>`),t.innerHTML=c}catch(i){t.innerHTML=`<div class="error-box">\u26A0\uFE0F ${l(i.message)}</div>`}}function Ve(){let e=document.getElementById("tidal-content");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="empty">De download-queue is leeg.</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken (wacht)",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=`
    <div class="section-title">${t.length} item${t.length!==1?"s":""} in queue</div>
    <div class="q-list">${t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",o=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=o!==null?`<div class="q-bar"><div class="q-bar-fill" style="width:${o}%"></div></div><div class="q-pct">${o}%</div>`:"";return`<div class="q-row">
        <div class="q-info">
          <div class="q-title">${l(n.title||"(onbekend)")}</div>
          ${n.artist?`<div class="q-artist">${l(n.artist)}</div>`:""}
          <span class="q-status ${d}">${l(c)}</span>
        </div>
        ${r}
        <button class="q-remove" data-qid="${l(n.id)}" title="Verwijder">\u2715</button>
      </div>`}).join("")}</div>`}async function Ue(){let e=document.getElementById("tidal-content");if(e){e.innerHTML='<div class="loading"><div class="spinner"></div>Geschiedenis ophalen\u2026</div>';try{let t=await f("/api/downloads");if(!t.length){e.innerHTML='<div class="empty">Nog geen downloads opgeslagen.</div>';return}let a={max:"24-bit",high:"Lossless",normal:"AAC",low:"96kbps"};e.innerHTML=`
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
        </div>`}).join("")}</div>`,document.getElementById("dl-history-clear")?.addEventListener("click",async()=>{if(confirm("Wis de volledige download-geschiedenis?")){await fetch("/api/downloads",{method:"DELETE"}).catch(()=>{});for(let i of t)await fetch(`/api/downloads/${i.id}`,{method:"DELETE"}).catch(()=>{});s.downloadedSet.clear(),Ue()}})}catch(t){e.innerHTML=`<div class="error-box">\u26A0\uFE0F ${l(t.message)}</div>`}}}function oe(e){s.tidalView=e,document.querySelectorAll("[data-tidal-view]").forEach(t=>t.classList.toggle("sel-def",t.dataset.tidalView===e)),e==="search"?we(document.getElementById("tidal-search")?.value||""):e==="queue"?Ve():e==="history"&&Ue()}function re(){if(s.tidarrSseSource)return;let e=new EventSource("/api/tidarr/stream");s.tidarrSseSource=e,e.onmessage=t=>{try{s.tidarrQueueItems=JSON.parse(t.data)||[]}catch{s.tidarrQueueItems=[]}let a=s.tidarrQueueItems.filter(n=>n.status!=="finished"&&n.status!=="error"),i=[document.getElementById("badge-tidarr-queue"),document.getElementById("badge-tidarr-queue-inline")];for(let n of i)n&&(a.length>0?(n.textContent=a.length,n.style.display=""):n.style.display="none");lt(s.tidarrQueueItems),s.currentTab==="tidal"&&s.tidalView==="queue"&&Ve(),document.getElementById("queue-popover")?.classList.contains("open")&&Qe()},e.onerror=()=>{e.close(),s.tidarrSseSource=null,setTimeout(re,1e4)}}function nt(){re()}function Ge(){let e=document.getElementById("tidarr-iframe"),t=document.getElementById("tidarr-ui-wrap"),a=document.getElementById("content");t.style.display="flex",a.style.display="none",e.dataset.loaded||(e.src=e.dataset.src,e.dataset.loaded="1")}function D(){document.getElementById("tidarr-ui-wrap").style.display="none",document.getElementById("content").style.display=""}function lt(e){let t=document.getElementById("queue-fab"),a=document.getElementById("fab-queue-badge");if(!t)return;let i=(e||[]).filter(n=>n.status!=="finished"&&n.status!=="error");e&&e.length>0?(t.style.display="",i.length>0?(a.textContent=i.length,a.style.display=""):a.style.display="none"):(t.style.display="none",document.getElementById("queue-popover")?.classList.remove("open"))}function Qe(){let e=document.getElementById("queue-popover-list");if(!e)return;let t=s.tidarrQueueItems;if(!t.length){e.innerHTML='<div class="qpop-empty">Queue is leeg</div>';return}let a={queue_download:"In wachtrij",queue_processing:"Verwerken",download:"Downloaden\u2026",processing:"Verwerken\u2026",finished:"Klaar \u2713",error:"Fout"},i={queue_download:"q-pending",queue_processing:"q-pending",download:"q-active",processing:"q-active",finished:"q-done",error:"q-error"};e.innerHTML=t.map(n=>{let d=i[n.status]||"q-pending",c=a[n.status]||n.status||"In wachtrij",o=n.progress?.current&&n.progress?.total?Math.round(n.progress.current/n.progress.total*100):null,r=o!==null?`<div class="q-bar" style="margin-top:4px"><div class="q-bar-fill" style="width:${o}%"></div></div>`:"";return`<div class="qpop-row">
      <div class="qpop-title">${l(n.title||"(onbekend)")}</div>
      ${n.artist?`<div class="qpop-artist">${l(n.artist)}</div>`:""}
      <span class="q-status ${d}">${l(c)}</span>
      ${r}
    </div>`}).join("")}function ot(){let e=document.getElementById("queue-popover");if(!e)return;e.classList.toggle("open")&&Qe()}function xe(){document.getElementById("queue-popover")?.classList.remove("open")}function Oe(e){return(e||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}function _e(e,t){let a=Oe(e),i=Oe(t);return!a||!i?!0:a===i||a.includes(i)||i.includes(a)}function rt(e,t,a,i){return new Promise(n=>{s.dlResolve=n;let d=document.getElementById("dl-confirm-modal"),c=document.getElementById("dl-confirm-cards");document.getElementById("dl-confirm-wanted").textContent=`"${a}"${t?" \u2013 "+t:""}`,c.innerHTML=e.map((o,r)=>{let u=!_e(o.artist,t),v=o.image?`<img class="dlc-img" src="${l(o.image)}" alt="" loading="lazy"
             onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="dlc-ph" style="display:none">${m(o.title)}</div>`:`<div class="dlc-ph">${m(o.title)}</div>`,y=u?`<div class="dlc-artist dlc-artist-warn">\u26A0 ${l(o.artist)}</div>`:`<div class="dlc-artist">${l(o.artist)}</div>`,$=o.score??0;return`
        <button class="dlc-card${r===0?" dlc-best":""}" data-dlc-idx="${r}">
          <div class="dlc-cover">${v}</div>
          <div class="dlc-info">
            <div class="dlc-title">${l(o.title)}</div>
            ${y}
            <div class="dlc-meta">${o.year?l(o.year):""}${o.year&&o.tracks?" \xB7 ":""}${o.tracks?o.tracks+" nrs":""}</div>
            <div class="dlc-score-bar"><div class="dlc-score-fill" style="width:${$}%"></div></div>
            <div class="dlc-score-label">${$}% overeenkomst</div>
          </div>
          ${r===0?'<span class="dlc-badge-best">Beste match</span>':""}
        </button>`}).join(""),c.querySelectorAll(".dlc-card").forEach(o=>{o.addEventListener("click",()=>{let r=parseInt(o.dataset.dlcIdx);Ee(),n({chosen:e[r],btn:i})})}),d.classList.add("open"),document.body.style.overflow="hidden"})}function Ee(){document.getElementById("dl-confirm-modal")?.classList.remove("open"),document.body.style.overflow="",s.dlResolve&&(s.dlResolve({chosen:null}),s.dlResolve=null)}async function Ne(e,t,a,i){let n=await fetch("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e.url,type:e.type||"album",title:e.title||a||"",artist:e.artist||t||"",id:String(e.id||""),quality:it()})}),d=await n.json();if(!n.ok||!d.ok)throw new Error(d.error||"download mislukt");Re(e.artist||t||"",e.title||a||""),i&&(i.textContent="\u2713",i.classList.add("dl-done"),i.disabled=!1),await le()}async function We(e,t,a){if(!s.tidarrOk){alert("Tidarr is niet verbonden. Controleer TIDARR_URL en TIDARR_API_KEY.");return}a&&(a.disabled=!0,a.textContent="\u2026");try{let i=new URLSearchParams;e&&i.set("artist",e),t&&i.set("album",t);let n=await fetch(`/api/tidarr/candidates?${i}`);if(!n.ok){n.status===401?alert(`Niet ingelogd bij TIDAL.
Ga naar de \u{1F39B}\uFE0F Tidarr-tab en koppel je TIDAL-account eerst.`):alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}

Probeer het handmatig via de \u{1F30A} Tidal-tab.`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let{candidates:d}=await n.json();if(!d?.length){alert(`Niet gevonden op TIDAL: "${t}"${e?" van "+e:""}`),a&&(a.disabled=!1,a.textContent="\u2B07");return}let c=d[0];if(e&&!_e(c.artist,e)){a&&(a.disabled=!1,a.textContent="\u2B07");let{chosen:o}=await rt(d,e,t,a);if(!o)return;a&&(a.disabled=!0,a.textContent="\u2026"),await Ne(o,e,t,a)}else await Ne(c,e,t,a)}catch(i){alert("Downloaden mislukt: "+i.message),a&&(a.disabled=!1,a.textContent="\u2B07")}}async function ke(){b('<div id="tidal-content"><div class="empty">Begin met typen om te zoeken op Tidal.</div></div>'),await $e(),await le(),oe(s.tidalView),nt()}function Ye(){s.currentTab="tidal",D(),document.getElementById("tb-tidal")?.classList.add("visible"),ke()}document.getElementById("dl-confirm-cancel")?.addEventListener("click",()=>{Ee()});document.getElementById("dl-confirm-modal")?.addEventListener("click",e=>{e.target===document.getElementById("dl-confirm-modal")&&Ee()});document.getElementById("queue-fab")?.addEventListener("click",ot);document.getElementById("qpop-close")?.addEventListener("click",e=>{e.stopPropagation(),xe()});document.getElementById("qpop-goto-tidal")?.addEventListener("click",()=>{xe(),document.querySelector('.tab[data-tab="downloads"]')?.click(),setTimeout(()=>oe("queue"),150)});document.addEventListener("click",e=>{let t=document.getElementById("queue-popover"),a=document.getElementById("queue-fab");t?.classList.contains("open")&&!t.contains(e.target)&&!a?.contains(e.target)&&xe()},!0);document.getElementById("btn-tidarr-reload")?.addEventListener("click",()=>{let e=document.getElementById("tidarr-iframe");e.src=e.dataset.src});async function Ze(){try{let e=await f("/api/spotify/status");s.spotifyEnabled=!!e.enabled;let t=document.getElementById("tb-mood");s.spotifyEnabled&&s.currentTab==="recs"?(t.style.display="",t.classList.add("visible")):s.spotifyEnabled&&(t.style.display="")}catch{s.spotifyEnabled=!1}}function dt(e,t){let a=e.image?`<img src="${l(e.image)}" alt="" loading="lazy"
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
    </div>`}async function ce(e){let t=document.getElementById("spotify-recs-section");if(!t)return;let a={energiek:"\u26A1 Energiek",chill:"\u{1F30A} Chill",melancholisch:"\u{1F327} Melancholisch",experimenteel:"\u{1F52C} Experimenteel",feest:"\u{1F389} Feest"};t.innerHTML='<div class="loading"><div class="spinner"></div>Spotify laden\u2026</div>';try{let i=await f(`/api/spotify/recs?mood=${encodeURIComponent(e)}`);if(!i.length){t.innerHTML='<div class="empty">Geen Spotify-aanbevelingen gevonden voor deze mood.</div>';return}let n=`
      <div class="spotify-section-title">\u{1F3AF} Spotify aanbevelingen \xB7 ${l(a[e]||e)}</div>
      <div class="spotify-grid">`;i.forEach((d,c)=>{n+=dt(d,c)}),n+="</div>",t.innerHTML=n}catch{t.innerHTML=""}}function Q(){let e=document.getElementById("spotify-recs-section");e&&(e.innerHTML="")}document.querySelectorAll(".mood-btn").forEach(e=>{e.addEventListener("click",async()=>{let t=e.dataset.mood;if(document.querySelectorAll(".mood-btn").forEach(a=>a.classList.remove("sel-mood","loading")),s.activeMood===t){s.activeMood=null,Q(),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none";return}s.activeMood=t,e.classList.add("sel-mood","loading"),document.getElementById("btn-clear-mood").style.display="",document.getElementById("mood-sep-clear").style.display="",await ce(t),e.classList.remove("loading")})});document.getElementById("btn-clear-mood")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(e=>e.classList.remove("sel-mood")),document.getElementById("btn-clear-mood").style.display="none",document.getElementById("mood-sep-clear").style.display="none",Q()});document.addEventListener("click",e=>{let t=e.target.closest(".spotify-play-btn");if(!t)return;e.stopPropagation();let a=t.dataset.spotifyPreview;if(a){if(s.previewBtn===t){s.previewAudio.paused?(s.previewAudio.play(),t.textContent="\u23F8",t.classList.add("playing")):(s.previewAudio.pause(),t.textContent="\u25B6",t.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".spotify-card")?.querySelector(".play-bar-fill")||s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=t,s.previewAudio.src=a,s.previewAudio.currentTime=0,s.previewAudio.play().then(()=>{t.textContent="\u23F8",t.classList.add("playing")}).catch(()=>{t.textContent="\u25B6",s.previewBtn=null})}},!0);async function de(){C();try{let e=await f("/api/recs"),t=e.recommendations||[],a=e.albumRecs||[],i=e.trackRecs||[];if(s.plexOk=e.plexConnected||s.plexOk,e.plexConnected&&e.plexArtistCount&&(document.getElementById("plex-pill").className="plex-pill on",document.getElementById("plex-pill-text").textContent=`Plex \xB7 ${q(e.plexArtistCount)} artiesten`),!t.length){b('<div class="empty">Geen aanbevelingen gevonden.</div>');return}let n=t.filter(u=>!u.inPlex).length,d=t.filter(u=>u.inPlex).length,c=document.getElementById("hdr-title-recs");c&&(c.textContent=`\u{1F3AF} Aanbevelingen \xB7 ${t.length} artiesten`);let o='<div class="spotify-section" id="spotify-recs-section"></div>';o+=`<div class="section-title">Gebaseerd op jouw smaak: ${(e.basedOn||[]).slice(0,3).join(", ")}
      ${s.plexOk?` &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} nieuw</span> \xB7 <span style="color:var(--plex)">${d} in Plex</span>`:""}
      </div><div class="rec-grid" id="vr-rec-grid">`;o+="</div>";if(a.length){o+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Albums</div>
        <div class="albrec-grid">`;for(let u of a){let v=T(u.image,80)||u.image,y=v?`<img class="albrec-img" src="${l(v)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="albrec-ph" style="display:none;background:${g(u.album)}">${m(u.album)}</div>`:`<div class="albrec-ph" style="background:${g(u.album)}">${m(u.album)}</div>`,$=s.plexOk?u.inPlex?'<span class="badge plex" style="font-size:9px;margin-top:4px">\u25B6 In Plex</span>':'<span class="badge new" style="font-size:9px;margin-top:4px">\u2726 Nieuw</span>':"";o+=`
          <div class="albrec-card">
            <div class="albrec-cover">${y}</div>
            <div class="albrec-info">
              <div class="albrec-title">${l(u.album)}</div>
              <div class="albrec-artist artist-link" data-artist="${l(u.artist)}">${l(u.artist)}</div>
              <div class="albrec-reason">via ${l(u.reason)}</div>
              ${$}${V(u.artist,u.album,u.inPlex)}
            </div>
          </div>`}o+="</div>"}if(i.length){o+=`<div class="section-title" style="margin-top:2rem">Aanbevolen Nummers</div>
        <div class="trackrec-list">`;for(let u of i){let v=u.playcount>0?`<span class="trackrec-plays">${q(u.playcount)}\xD7</span>`:"",y=u.url?`<a class="trackrec-link" href="${l(u.url)}" target="_blank" rel="noopener">Last.fm \u2197</a>`:"";o+=`
          <div class="trackrec-row">
            <div class="trackrec-info">
              <div class="trackrec-title">${l(u.track)}</div>
              <div class="trackrec-artist artist-link" data-artist="${l(u.artist)}">${l(u.artist)}</div>
              <div class="trackrec-reason">via ${l(u.reason)}</div>
            </div>
            <div class="trackrec-meta">${v}${y}</div>
          </div>`}o+="</div>"}b(o,()=>{s.activeMood&&ce(s.activeMood)}),ue();{let _vrc=document.getElementById("vr-rec-grid");if(_vrc)virtualRender(_vrc,t,(v,u)=>{let y=Math.round(v.match*100);return`
        <div class="rec-card" data-inplex="${v.inPlex}" id="rc-${u}">
          <div class="rec-photo" id="rph-${u}">
            <div class="rec-photo-ph" style="background:${g(v.name)}">${m(v.name)}</div>
          </div>
          <div class="rec-body">
            <div class="rec-header">
              <div class="rec-title-row">
                <span class="rec-name artist-link" data-artist="${l(v.name)}">${l(v.name)}</span>
                ${ye(v.inPlex)}
              </div>
              <span class="rec-match">${y}%</span>
            </div>
            <div class="rec-reason">Vergelijkbaar met ${l(v.reason)}</div>
            <div id="rtags-${u}"></div>
            <div id="ralb-${u}"><div class="rec-loading">Albums laden\u2026</div></div>
          </div>
        </div>`;},{batchSize:8,rootMargin:"400px",onBatch:(startIdx,endIdx)=>{for(let _i=startIdx;_i<endIdx;_i++){(async(u,v)=>{try{let y=await f(`/api/artist/${encodeURIComponent(v.name)}/info`),$=document.getElementById(`rph-${u}`);$&&y.image&&($.innerHTML=`<img src="${T(y.image,120)||y.image}" alt="" loading="lazy"\n          onerror="this.parentElement.innerHTML='<div class=\\'rec-photo-ph\\' style=\\'background:${g(v.name)}\\'>${m(v.name)}</div>'">`);let E=document.getElementById(`rtags-${u}`);E&&(E.innerHTML=H(y.tags,3)+'<div style="height:6px"></div>');let w=document.getElementById(`ralb-${u}`);if(w){let x=(y.albums||[]).slice(0,4);if(x.length){let A='<div class="rec-albums-label">Bekende albums</div><div class="rec-albums-list">';for(let P of x){let p=P.image?`<img class="rec-album-img" src="${T(P.image,48)||P.image}" alt="" loading="lazy">`:'<div class="rec-album-ph">\u266A</div>',h=s.plexOk&&P.inPlex?'<span class="rec-album-plex">\u25B6</span>':"";A+=`<div class="rec-album-row">${p}<span class="rec-album-name">${l(P.name)}</span>${h}${V(v.name,P.name,P.inPlex)}</div>`}w.innerHTML=A+"</div>"}else w.innerHTML=""}}catch{let y=document.getElementById(`ralb-${u}`);y&&(y.innerHTML="")}})(_i,t[_i])}}});}let r=document.getElementById("sec-recs-preview");if(r){let u=t.slice(0,8);r.innerHTML=`<div class="collapsed-thumbs">${u.map((v,y)=>`<div class="collapsed-thumb collapsed-thumb-round" id="recs-thumb-${y}" style="background:${g(v.name)}">
          <span class="collapsed-thumb-ph">${m(v.name)}</span>
        </div>`).join("")}${t.length>8?`<span class="collapsed-thumbs-more">+${t.length-8}</span>`:""}</div>`,u.forEach(async(v,y)=>{try{let $=await f(`/api/artist/${encodeURIComponent(v.name)}/info`),E=document.getElementById(`recs-thumb-${y}`);E&&$.image&&(E.innerHTML=`<img src="${l(T($.image,48)||$.image)}" alt="" loading="lazy" onerror="this.remove()">`)}catch{}})}}catch(e){B(e.message)}}function ue(){document.querySelectorAll(".rec-card[data-inplex]").forEach(e=>{let t=e.dataset.inplex==="true",a=!0;s.recsFilter==="new"&&(a=!t),s.recsFilter==="plex"&&(a=t),e.classList.toggle("hidden",!a)})}function Xe(e){let t=document.getElementById("badge-releases");t&&(e>0?(t.textContent=e,t.style.display=""):t.style.display="none")}function ct(e){if(!e)return"";let t=new Date(e),i=Math.floor((new Date-t)/864e5);return i===0?"vandaag":i===1?"gisteren":i<7?`${i} dagen geleden`:t.toLocaleDateString("nl-NL",{day:"numeric",month:"long"})}async function U(){C();try{let e=await f("/api/releases");if(e.status==="building"){b(`<div class="loading"><div class="spinner"></div>
        <div>${l(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 5 seconden</div></div>`),setTimeout(()=>{(s.currentTab==="releases"||s.currentTab==="ontdek")&&U()},5e3);return}s.lastReleases=e.releases||[],s.newReleaseIds=new Set(e.newReleaseIds||[]),Xe(e.newCount||0),j()}catch(e){B(e.message)}}function j() {
  var releases = s.lastReleases || [];
  if (!releases.length) { b('<div class="empty">Geen recente releases gevonden (afgelopen 30 dagen).</div>'); return; }

  var t = releases;
  if (s.releasesFilter !== "all")
    t = releases.filter(o => (o.type || "album").toLowerCase() === s.releasesFilter);
  if (!t.length) {
    b(`<div class="empty">Geen ${s.releasesFilter === "ep" ? "EP's" : s.releasesFilter + "s"} gevonden voor dit filter.</div>`);
    return;
  }

  s.releasesSort === "listening"
    ? t = [...t].sort((o, r) => (r.artistPlaycount || 0) - (o.artistPlaycount || 0) || new Date(r.releaseDate) - new Date(o.releaseDate))
    : t = [...t].sort((o, r) => new Date(r.releaseDate) - new Date(o.releaseDate));

  var titleEl = document.getElementById("hdr-title-releases");
  if (titleEl) titleEl.textContent = `\u{1F4BF} Nieuwe Releases \u00B7 ${t.length} release${t.length !== 1 ? "s" : ""}`;

  function typeLabel(o) { return ({ album: "Album", single: "Single", ep: "EP" })[o?.toLowerCase()] || o || "Album"; }
  function typeCls(o)   { return ({ album: "rel-type-album", single: "rel-type-single", ep: "rel-type-ep" })[o?.toLowerCase()] || "rel-type-album"; }

  /* wrapper frame */
  var frag   = document.createDocumentFragment();
  var header = _el('div', 'section-title', `${t.length} release${t.length !== 1 ? "s" : ""} in de afgelopen 30 dagen`);
  var grid   = _el('div', 'releases-grid');
  grid.id    = 'vr-releases-grid';
  frag.append(header, grid);
  b(frag);

  var _vrg = document.getElementById("vr-releases-grid");
  if (_vrg) virtualRender(_vrg, t, function(o) {
    var isNew = s.newReleaseIds.has(`${o.artist}::${o.album}`);
    var card  = _el('div', 'rel-card' + (isNew ? ' rel-card-new' : ''));

    /* cover */
    var coverDiv = _el('div', 'rel-cover');
    if (o.image) {
      var ri = document.createElement('img');
      ri.className = 'rel-img'; ri.src = o.image; ri.alt = ''; ri.loading = 'lazy';
      ri.onerror = function() { this.onerror = null; this.style.display = 'none'; if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex'; };
      var rph = _el('div', 'rel-ph');
      rph.style.cssText = `display:none;background:${g(o.album)}`; rph.textContent = m(o.album);
      coverDiv.append(ri, rph);
    } else {
      var rph = _el('div', 'rel-ph');
      rph.style.background = g(o.album); rph.textContent = m(o.album);
      coverDiv.append(rph);
    }
    card.append(coverDiv);

    /* info */
    var infoDiv = _el('div', 'rel-info');
    infoDiv.append(_el('span', `rel-type-badge ${typeCls(o.type)}`, typeLabel(o.type)));
    infoDiv.append(_el('div', 'rel-album', o.album));
    var artEl = _el('div', 'rel-artist artist-link', o.artist);
    artEl.dataset.artist = o.artist;
    infoDiv.append(artEl);

    if (o.releaseDate) {
      var dateStr = new Date(o.releaseDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
      var dateRel = ct(o.releaseDate);
      var dateDiv = _el('div', 'rel-date', dateStr + ' ');
      dateDiv.append(_el('span', 'rel-date-rel', `(${dateRel})`));
      infoDiv.append(dateDiv);
    }

    var footer = _el('div', 'rel-footer');
    if (s.plexOk) {
      if (o.inPlex)          { var b1 = _el('span', 'badge plex', '\u25B6 In Plex');       b1.style.fontSize = '9px'; footer.append(b1); }
      else if (o.artistInPlex){ var b2 = _el('span', 'badge new', '\u2726 Artiest in Plex'); b2.style.fontSize = '9px'; footer.append(b2); }
    }
    if (o.deezerUrl) {
      var dl = document.createElement('a');
      dl.className = 'rel-deezer-link'; dl.href = o.deezerUrl; dl.target = '_blank'; dl.rel = 'noopener';
      dl.textContent = 'Deezer \u2197';
      footer.append(dl);
    }
    var vHtml = V(o.artist, o.album, o.inPlex);
    if (vHtml) { var vf = _htmlToFrag(vHtml); if (vf) footer.append(vf); }
    infoDiv.append(footer);
    card.append(infoDiv);
    return card;
  }, { batchSize: 8, rootMargin: "400px" });

  /* collapsed preview strip */
  var previewEl = document.getElementById("sec-releases-preview");
  if (previewEl) {
    var preview  = t.slice(0, 8);
    var thumbs   = _el('div', 'collapsed-thumbs');
    for (var pr of preview) {
      var thumb = document.createElement('div');
      thumb.className = 'collapsed-thumb';
      if (pr.image) {
        var ti = document.createElement('img');
        ti.src = pr.image; ti.alt = ''; ti.loading = 'lazy';
        ti.onerror = function() { this.style.display = 'none'; if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex'; };
        var tp = _el('span', 'collapsed-thumb-ph');
        tp.style.cssText = `display:none;background:${g(pr.album)}`; tp.textContent = m(pr.album);
        thumb.append(ti, tp);
      } else {
        thumb.style.background = g(pr.album);
        thumb.append(_el('span', 'collapsed-thumb-ph', m(pr.album)));
      }
      thumbs.append(thumb);
    }
    if (t.length > 8) thumbs.append(_el('span', 'collapsed-thumbs-more', `+${t.length - 8}`));
    previewEl.replaceChildren(thumbs);
  }
}
async function G(){C("Ontdekkingen ophalen...");try{let e=await f("/api/discover");if(e.status==="building"){b(`<div class="loading"><div class="spinner"></div>
        <div>${l(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{(s.currentTab==="discover"||s.currentTab==="ontdek")&&G()},2e4);return}s.lastDiscover=e,e.plexConnected&&(s.plexOk=!0),te()}catch(e){B(e.message)}}function te(){if(!s.lastDiscover)return;let{artists:e,basedOn:t}=s.lastDiscover;if(!e?.length){b('<div class="empty">Geen ontdekkingen gevonden.</div>');return}let a=e;if(s.discFilter==="new"&&(a=e.filter(o=>!o.inPlex)),s.discFilter==="partial"&&(a=e.filter(o=>o.inPlex&&o.missingCount>0)),!a.length){b('<div class="empty">Geen artiesten voor dit filter.</div>');return}let i=document.getElementById("hdr-title-discover");i&&(i.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`);let n=a.reduce((o,r)=>o+r.missingCount,0),d=`<div class="section-title">Gebaseerd op: ${(t||[]).slice(0,3).join(", ")}
    &nbsp;\xB7&nbsp; <span style="color:var(--new)">${n} albums te ontdekken</span></div>
    <div class="discover-grid" id="vr-discover-grid"></div>`;b(d);{let _vdg=document.getElementById("vr-discover-grid");if(_vdg)virtualRender(_vdg,a,(r,o)=>{let u=Math.round(r.match*100),v=[O(r.country),r.country,r.startYear?`Actief vanaf ${r.startYear}`:null,r.totalAlbums?`${r.totalAlbums} studio-albums`:null].filter(Boolean).join(" \xB7 "),y=T(r.image,120)||r.image,$=y?`<img class="discover-photo" src="${l(y)}" alt="" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="discover-photo-ph" style="display:none;background:${g(r.name,!0)}">${m(r.name)}</div>`:`<div class="discover-photo-ph" style="background:${g(r.name,!0)}">${m(r.name)}</div>`,E=r.albums?.length||0,w=`${E} album${E!==1?"s":""}`;let _h=`
      <div class="discover-section collapsed" id="disc-${o}">
        <div class="discover-card discover-card-toggle" data-disc-id="disc-${o}">
          <div class="discover-card-top">
            ${$}
            <div class="discover-card-info">
              <div class="discover-card-name">
                <span class="artist-link" data-artist="${l(r.name)}">${l(r.name)}</span>
                ${ye(r.inPlex)}
              </div>
              <div class="discover-card-sub">Vergelijkbaar met <strong>${l(r.reason)}</strong></div>
            </div>
            <span class="discover-match">${u}%</span>
            ${N("artist",r.name,"",r.image||"")}
          </div>
          ${v?`<div class="discover-meta">${l(v)}</div>`:""}
          ${H(r.tags,3)}
          ${r.missingCount>0?`<div class="discover-missing">\u2726 ${r.missingCount} ${r.missingCount===1?"album":"albums"} te ontdekken</div>`:'<div style="font-size:11px;color:var(--plex);margin-top:4px">\u25B6 Volledig in Plex</div>'}
          <button class="disc-toggle-btn collapsed" data-disc-id="disc-${o}" data-album-count="${E}"
            title="Toon/verberg albums" aria-label="Albums tonen/verbergen">Toon ${w}</button>
          ${r.albums?.length?`<div class="discover-preview-row">${r.albums.slice(0,5).map(x=>{let A=g(x.title||"");return x.coverUrl?`<img class="discover-preview-thumb" src="${l(x.coverUrl)}" alt="${l(x.title)}" loading="lazy"
                   title="${l(x.title)}${x.year?" ("+x.year+")":""}"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
                 <div class="discover-preview-ph" style="display:none;background:${A}">${m(x.title||"?")}</div>`:`<div class="discover-preview-ph" style="background:${A}">${m(x.title||"?")}</div>`}).join("")}${r.albums.length>5?`<div class="discover-preview-more">+${r.albums.length-5}</div>`:""}</div>`:""}
        </div>
        <div class="discover-albums-wrap">`;if(r.albums?.length){_h+='<div class="album-grid">'+r.albums.map(x=>Z(x,true,r.name).outerHTML).join("")+"</div>"}else{_h+='<div style="font-size:13px;color:var(--muted2);padding:8px 0">Albums nog niet beschikbaar. Vernieuw straks.</div>'}_h+="</div></div>";return _h;},{batchSize:8,rootMargin:"400px"});};let c=document.getElementById("sec-discover-preview");if(c){let o=a.slice(0,8);c.innerHTML=`<div class="collapsed-thumbs">${o.map(r=>r.image?`<div class="collapsed-thumb collapsed-thumb-round">
          <img src="${l(r.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="collapsed-thumb-ph" style="display:none;background:${g(r.name)}">${m(r.name)}</span>
        </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${g(r.name)}"><span class="collapsed-thumb-ph">${m(r.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`}}function ut(){try{let e=localStorage.getItem("ontdek-sections");e&&Object.assign(s.collapsibleSections,JSON.parse(e))}catch{}}function pt(){try{localStorage.setItem("ontdek-sections",JSON.stringify(s.collapsibleSections))}catch{}}function Je(e,t){e.classList.remove("expanded","collapsed"),e.classList.add(t?"collapsed":"expanded")}function Le(e,t){let a=document.querySelector(`[data-section="${e}"]`);if(!a)return;let i=a.querySelector(".section-toggle-btn");i&&(Je(i,s.collapsibleSections[t]),i.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),s.collapsibleSections[t]=!s.collapsibleSections[t],pt(),Je(i,s.collapsibleSections[t]),a.classList.toggle("collapsed")}),s.collapsibleSections[t]&&a.classList.add("collapsed"))}async function _(){ut(),s.currentTab="ontdek",D();let e=s.spotifyEnabled?`
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
    </div>`,S.style.opacity="1",S.style.transform="",document.getElementById("btn-ref-recs-ontdek")?.addEventListener("click",async()=>{await R(document.getElementById("sec-recs-content"),de)}),document.getElementById("btn-ref-releases-ontdek")?.addEventListener("click",async()=>{s.lastReleases=null,await fetch("/api/releases/refresh",{method:"POST"}),await R(document.getElementById("sec-releases-content"),U)}),document.getElementById("btn-ref-discover-ontdek")?.addEventListener("click",async()=>{s.lastDiscover=null,await fetch("/api/discover/refresh",{method:"POST"}),await R(document.getElementById("sec-discover-content"),G)}),document.getElementById("btn-clear-mood-inline")?.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll(".mood-btn").forEach(t=>t.classList.remove("sel-mood","loading")),Q(),_()});{let t=document.getElementById("sec-recs-content");s.sectionContainerEl=t,await de(),s.sectionContainerEl===t&&(s.sectionContainerEl=null)}(async()=>{try{if(!s.lastReleases){let a=await f("/api/releases");if(a.status==="building")return;s.lastReleases=a.releases||[],s.newReleaseIds=new Set(a.newReleaseIds||[]),Xe(a.newCount||0)}let t=document.getElementById("sec-releases-preview");if(t&&s.lastReleases.length){let a=s.lastReleases;s.releasesFilter!=="all"&&(a=s.lastReleases.filter(d=>(d.type||"album").toLowerCase()===s.releasesFilter)),s.releasesSort==="listening"?a=[...a].sort((d,c)=>(c.artistPlaycount||0)-(d.artistPlaycount||0)||new Date(c.releaseDate)-new Date(d.releaseDate)):a=[...a].sort((d,c)=>new Date(c.releaseDate)-new Date(d.releaseDate));let i=a.slice(0,8);t.innerHTML=`<div class="collapsed-thumbs">${i.map(d=>d.image?`<div class="collapsed-thumb">
              <img src="${l(d.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${g(d.album)}">${m(d.album)}</span>
            </div>`:`<div class="collapsed-thumb" style="background:${g(d.album)}"><span class="collapsed-thumb-ph">${m(d.album)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let n=document.getElementById("hdr-title-releases");n&&(n.textContent=`\u{1F4BF} Nieuwe Releases \xB7 ${a.length} release${a.length!==1?"s":""}`)}}catch{}})(),X(document.getElementById("sec-releases-content"),()=>{let t=document.getElementById("sec-releases-content");return R(t,U)}),(async()=>{try{if(!s.lastDiscover){let n=await f("/api/discover");if(n.status==="building")return;s.lastDiscover=n,n.plexConnected&&(s.plexOk=!0)}let{artists:t}=s.lastDiscover;if(!t?.length)return;let a=t;s.discFilter==="new"&&(a=t.filter(n=>!n.inPlex)),s.discFilter==="partial"&&(a=t.filter(n=>n.inPlex&&n.missingCount>0));let i=document.getElementById("sec-discover-preview");if(i&&a.length){let n=a.slice(0,8);i.innerHTML=`<div class="collapsed-thumbs">${n.map(c=>c.image?`<div class="collapsed-thumb collapsed-thumb-round">
              <img src="${l(c.image)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
              <span class="collapsed-thumb-ph" style="display:none;background:${g(c.name)}">${m(c.name)}</span>
            </div>`:`<div class="collapsed-thumb collapsed-thumb-round" style="background:${g(c.name)}"><span class="collapsed-thumb-ph">${m(c.name)}</span></div>`).join("")}${a.length>8?`<span class="collapsed-thumbs-more">+${a.length-8}</span>`:""}</div>`;let d=document.getElementById("hdr-title-discover");d&&(d.textContent=`\u{1F52D} Ontdek Artiesten \xB7 ${a.length} artiesten`)}}catch{}})(),X(document.getElementById("sec-discover-content"),()=>{let t=document.getElementById("sec-discover-content");return R(t,G)}),Le("recs","recs"),Le("releases","releases"),Le("discover","discover")}async function pe(){let e=document.getElementById("plex-np-wrap");try{let t=await fetch("/api/plex/nowplaying").then(a=>a.json());e.innerHTML=t.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${l(t.track)}</div>
           <div class="card-sub">${l(t.artist)}${t.album?" \xB7 "+l(t.album):""}</div></div></div>`:""}catch{e.innerHTML=""}}async function Se() {
  C(); pe();
  try {
    var t = (await f("/api/recent")).recenttracks?.track || [];
    if (!t.length) { b('<div class="empty">Geen recente nummers.</div>'); return; }

    var frag = document.createDocumentFragment();
    var list = _el('div', 'card-list');

    for (var track of t) {
      var isNP    = track["@attr"]?.nowplaying;
      var timeAgo = track.date?.uts ? ie(parseInt(track.date.uts)) : "";
      var artist  = track.artist?.["#text"] || "";
      var imgUrl  = z(track.image);

      var card = _el('div', isNP ? 'now-playing' : 'card');

      /* image */
      if (imgUrl) {
        var ci = document.createElement('img');
        ci.className = 'card-img'; ci.src = imgUrl; ci.alt = ''; ci.loading = 'lazy';
        ci.onerror = function() { this.onerror = null; this.style.display = 'none'; if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex'; };
        var cp = _el('div', 'card-ph'); cp.style.display = 'none'; cp.textContent = '\u266A';
        card.append(ci, cp);
      } else {
        card.append(_el('div', 'card-ph', '\u266A'));
      }

      if (isNP) {
        card.append(_el('div', 'np-dot'));
        card.append(_el('span', 'np-label', 'NU'));
      }

      var info = _el('div', 'card-info');
      info.append(_el('div', 'card-title', track.name));
      var sub = _el('div', 'card-sub artist-link');
      sub.textContent = artist; sub.dataset.artist = artist;
      info.append(sub);
      card.append(info);

      if (!isNP) {
        card.append(_el('div', 'card-meta', timeAgo));
        var btn = document.createElement('button');
        btn.className = 'play-btn'; btn.textContent = '\u25B6';
        btn.dataset.artist = artist; btn.dataset.track = track.name;
        btn.title = 'Preview afspelen';
        var bar = _el('div', 'play-bar');
        bar.append(_el('div', 'play-bar-fill'));
        card.append(btn, bar);
      }

      list.append(card);
    }

    frag.append(list);
    b(frag);
  } catch(e) { B(e.message); }
}
function me(){s.currentTab="recent",D(),Se()}async function Ke(e,t,a){if(s.previewBtn===e){s.previewAudio.paused?(await s.previewAudio.play(),e.textContent="\u23F8",e.classList.add("playing")):(s.previewAudio.pause(),e.textContent="\u25B6",e.classList.remove("playing"));return}if(s.previewBtn){s.previewAudio.pause(),s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let i=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");i&&(i.style.width="0%")}s.previewBtn=e,e.textContent="\u2026",e.disabled=!0;try{let i=new URLSearchParams({artist:t,track:a}),n=await f(`/api/preview?${i}`);if(!n.preview){e.textContent="\u2014",e.disabled=!1,setTimeout(()=>{e.textContent==="\u2014"&&(e.textContent="\u25B6")},1800),s.previewBtn=null;return}s.previewAudio.src=n.preview,s.previewAudio.currentTime=0,await s.previewAudio.play(),e.textContent="\u23F8",e.disabled=!1,e.classList.add("playing")}catch{e.textContent="\u25B6",e.disabled=!1,s.previewBtn=null}}s.previewAudio.addEventListener("timeupdate",()=>{if(!s.previewBtn||!s.previewAudio.duration)return;let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width=`${(s.previewAudio.currentTime/s.previewAudio.duration*100).toFixed(1)}%`)});s.previewAudio.addEventListener("ended",()=>{if(s.previewBtn){s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing");let e=s.previewBtn.closest(".card")?.querySelector(".play-bar-fill");e&&(e.style.width="0%"),s.previewBtn=null}});document.addEventListener("visibilitychange",()=>{document.hidden&&!s.previewAudio.paused&&(s.previewAudio.pause(),s.previewBtn&&(s.previewBtn.textContent="\u25B6",s.previewBtn.classList.remove("playing")))});async function mt(e){let t=document.getElementById("search-results");if(e.length<2){t.classList.remove("open");return}try{let a=await f(`/api/search?q=${encodeURIComponent(e)}`);a.results?.length?t.innerHTML=a.results.map(i=>{let n=T(i.image,56)||i.image,d=n?`<img class="search-result-img" src="${l(n)}" alt="" loading="lazy"
               onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
             <div class="search-result-ph" style="background:${g(i.name)};display:none">${m(i.name)}</div>`:`<div class="search-result-ph" style="background:${g(i.name)}">${m(i.name)}</div>`,c=i.listeners?`${q(i.listeners)} luisteraars`:"";return`<button class="search-result-item" data-artist="${l(i.name)}">
          ${d}
          <div><div class="search-result-name">${l(i.name)}</div>
          ${c?`<div class="search-result-sub">${c}</div>`:""}</div>
        </button>`}).join(""):t.innerHTML='<div style="padding:12px 14px;color:var(--muted2);font-size:13px">Geen resultaten</div>',t.classList.add("open")}catch{}}document.getElementById("search-input").addEventListener("input",e=>{clearTimeout(s.searchTimeout);let t=e.target.value.trim();if(!t){document.getElementById("search-results").classList.remove("open");return}s.searchTimeout=setTimeout(()=>mt(t),320)});document.addEventListener("click",e=>{e.target.closest("#search-wrap")||document.getElementById("search-results").classList.remove("open")});function ve(e,t){let a=(t||"").toLowerCase().trim(),i=e;if(a&&(i=e.filter(c=>c.artist.toLowerCase().includes(a)||c.album.toLowerCase().includes(a))),!i.length)return`<div class="empty">Geen resultaten voor "<strong>${l(t)}</strong>".</div>`;let n=new Map;for(let c of i)n.has(c.artist)||n.set(c.artist,[]),n.get(c.artist).push(c.album);let d=`<div class="section-title">${n.size} artiesten \xB7 ${q(i.length)} albums</div>
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
      </div>`;return d+"</div>"}async function se(){C();try{let e=await f("/api/plex/library");s.plexLibData=e.library||[];let t=document.getElementById("plib-search");if(t&&(t.value=""),!s.plexLibData.length){b('<div class="empty">Plex bibliotheek is leeg of nog niet gesynchroniseerd.<br>Klik \u21BB Sync Plex om te beginnen.</div>');return}b(ve(s.plexLibData,""))}catch(e){B(e.message)}}async function Te(period) {
  C();
  try {
    var a = (await f(`/api/topartists?period=${period}`)).topartists?.artist || [];
    if (!a.length) { b('<div class="empty">Geen data.</div>'); return; }

    var maxPlays = parseInt(a[0]?.playcount || 1);
    var frag     = document.createDocumentFragment();
    frag.append(_el('div', 'section-title', `Top artiesten \u00B7 ${Y(period)}`));
    var grid = _el('div', 'artist-grid');

    for (var idx = 0; idx < a.length; idx++) {
      var ar  = a[idx];
      var pct = Math.round(parseInt(ar.playcount) / maxPlays * 100);
      var url = z(ar.image, "large") || z(ar.image);
      var proxied = T(url, 120) || url;

      var card  = _el('div', 'ag-card');
      var photo = _el('div', 'ag-photo');
      photo.id = `agp-${idx}`;
      photo.style.viewTransitionName = `artist-${ne(ar.name)}`;

      if (proxied) {
        var pi = document.createElement('img');
        pi.src = proxied; pi.alt = ''; pi.loading = 'lazy';
        pi.onerror = function() { this.style.display = 'none'; if (this.nextElementSibling) this.nextElementSibling.style.display = 'flex'; };
        var pp = _el('div', 'ag-photo-ph');
        pp.style.cssText = `display:none;background:${g(ar.name, true)}`;
        pp.textContent = m(ar.name);
        photo.append(pi, pp);
      } else {
        var pp = _el('div', 'ag-photo-ph');
        pp.style.background = g(ar.name, true);
        pp.textContent = m(ar.name);
        photo.append(pp);
      }

      var info    = _el('div', 'ag-info');
      var nameEl  = _el('div', 'ag-name artist-link', ar.name);
      nameEl.dataset.artist = ar.name;
      var barWrap = _el('div', 'card-bar');
      var barFill = _el('div', 'card-bar-fill');
      barFill.style.width = `${pct}%`;
      barWrap.append(barFill);
      info.append(nameEl, barWrap, _el('div', 'ag-plays', `${q(ar.playcount)} plays`));
      card.append(photo, info);
      grid.append(card);
    }

    frag.append(grid);
    b(frag);

    /* async image enhancement */
    a.forEach(async (artist, ci) => {
      try {
        var data = await f(`/api/artist/${encodeURIComponent(artist.name)}/info`);
        if (data.image) {
          var el = document.getElementById(`agp-${ci}`);
          if (el) {
            var ni = document.createElement('img');
            ni.src = T(data.image, 120) || data.image;
            ni.alt = ''; ni.loading = 'lazy';
            ni.onerror = function() { this.style.display = 'none'; };
            el.replaceChildren(ni);
          }
        }
      } catch {}
    });
  } catch(err) { B(err.message); }
}
async function Be(e){C();try{let a=(await f(`/api/toptracks?period=${e}`)).toptracks?.track||[];if(!a.length){b('<div class="empty">Geen data.</div>');return}let i=parseInt(a[0]?.playcount||1),n=`<div class="section-title">Top nummers \xB7 ${Y(e)}</div><div class="card-list">`;for(let d of a){let c=Math.round(parseInt(d.playcount)/i*100);n+=`<div class="card">${J(d.image)}<div class="card-info">
        <div class="card-title">${l(d.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(d.artist?.name||"")}">${l(d.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${c}%"></div></div>
        </div><div class="card-meta">${q(d.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${l(d.artist?.name||"")}" data-track="${l(d.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}b(n+"</div>")}catch(t){B(t.message)}}async function tt(){C();try{let t=(await f("/api/loved")).lovedtracks?.track||[];if(!t.length){b('<div class="empty">Geen geliefde nummers.</div>');return}let a='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let i of t){let n=i.date?.uts?ie(parseInt(i.date.uts)):"";a+=`<div class="card">${J(i.image)}<div class="card-info">
        <div class="card-title">${l(i.name)}</div>
        <div class="card-sub artist-link" data-artist="${l(i.artist?.name||"")}">${l(i.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${n}</div>
        <button class="play-btn" data-artist="${l(i.artist?.name||"")}" data-track="${l(i.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}b(a+"</div>")}catch(e){B(e.message)}}async function Ce(){C("Statistieken ophalen...");try{let e=await f("/api/stats");b(`
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
      </div>`,()=>vt(e))}catch(e){B(e.message)}}function vt(e){if(typeof Chart>"u")return;let t=!window.matchMedia("(prefers-color-scheme: light)").matches,a=t?"#2c2c2c":"#ddd",i=t?"#888":"#777",n=t?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=a;let d=document.getElementById("chart-daily");d&&new Chart(d,{type:"bar",data:{labels:e.dailyScrobbles.map(r=>new Date(r.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:e.dailyScrobbles.map(r=>r.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:a},ticks:{color:i},beginAtZero:!0}}}});let c=document.getElementById("chart-top");c&&e.topArtists?.length&&new Chart(c,{type:"bar",data:{labels:e.topArtists.map(r=>r.name),datasets:[{data:e.topArtists.map(r=>r.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:r=>`${r.raw} plays`}}},scales:{x:{grid:{color:a},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:n,font:{size:11}}}}}});let o=document.getElementById("chart-genres");if(o&&e.genres?.length){let r=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(o,{type:"doughnut",data:{labels:e.genres.map(u=>u.name),datasets:[{data:e.genres.map(u=>u.count),backgroundColor:r.slice(0,e.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function W(){C("Collectiegaten zoeken...");try{let e=await f("/api/gaps");if(e.status==="building"){b(`<div class="loading"><div class="spinner"></div>
        <div>${l(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{s.currentTab==="gaps"&&W()},2e4);return}s.lastGaps=e,ae()}catch(e){B(e.message)}}function ae(){if(!s.lastGaps)return;let e=[...s.lastGaps.artists||[]];if(!e.length){b('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}s.gapsSort==="missing"&&e.sort((i,n)=>n.missingAlbums.length-i.missingAlbums.length),s.gapsSort==="name"&&e.sort((i,n)=>i.name.localeCompare(n.name));let t=e.reduce((i,n)=>i+n.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=t;let a=`<div class="section-title">${t} ontbrekende albums bij ${e.length} artiesten die je al hebt</div>`;a+='<div id="vr-gaps-list"></div>';b(a);{let _vgl=document.getElementById("vr-gaps-list");if(_vgl)virtualRender(_vgl,e,(i)=>{let n=Math.round(i.ownedCount/i.totalCount*100),d=[O(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),c=T(i.image,56)||i.image,o=c?`<img class="gaps-photo" src="${l(c)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${g(i.name)}">${m(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${g(i.name)}">${m(i.name)}</div>`;let _h=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${o}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${l(i.name)}">${l(i.name)}</div>
              ${N("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${l(d)}</div>
            ${H(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${n}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;_h+=i.missingAlbums.map(r=>Z(r,false,i.name).outerHTML).join("");_h+="</div>";if(i.allAlbums?.filter(r=>r.inPlex).length>0){_h+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(r=>r.inPlex).map(r=>Z(r,false,i.name).outerHTML).join("")}
        </div>
      </details>`}_h+="</div>";return _h;},{batchSize:8,rootMargin:"400px"});}}async function et(e){s.bibSubTab=e;let t=document.getElementById("bib-sub-content"),a=document.getElementById("bib-subtoolbar");if(!t)return;document.querySelectorAll(".bib-tab").forEach(n=>n.classList.toggle("active",n.dataset.bibtab===e)),a&&(e==="collectie"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <input class="plib-search" id="plib-search-bib" type="text"
            placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off" style="flex:1;min-width:0">
          <button class="tool-btn" id="btn-sync-plex-bib">\u21BB Sync Plex</button>
        </div>`,document.getElementById("plib-search-bib")?.addEventListener("input",n=>{s.plexLibData&&(t.innerHTML=ve(s.plexLibData,n.target.value))}),document.getElementById("btn-sync-plex-bib")?.addEventListener("click",async()=>{let n=document.getElementById("btn-sync-plex-bib"),d=n.textContent;n.disabled=!0,n.textContent="\u21BB Bezig\u2026";try{await fetch("/api/plex/refresh",{method:"POST"}),await F(),s.plexLibData=null;let c=t;s.sectionContainerEl=c,await se(),s.sectionContainerEl===c&&(s.sectionContainerEl=null)}catch{}finally{n.disabled=!1,n.textContent=d}})):e==="gaten"?(a.innerHTML=`
        <div class="inline-toolbar" style="margin-bottom:12px">
          <button class="tool-btn${s.gapsSort==="missing"?" sel-def":""}" data-gsort="missing">Meest ontbrekend</button>
          <button class="tool-btn${s.gapsSort==="name"?" sel-def":""}" data-gsort="name">A\u2013Z</button>
          <span class="toolbar-sep"></span>
          <button class="tool-btn refresh-btn" id="btn-ref-gaps-bib">\u21BB Vernieuwen</button>
        </div>`,document.getElementById("btn-ref-gaps-bib")?.addEventListener("click",async()=>{s.lastGaps=null,await fetch("/api/gaps/refresh",{method:"POST"});let n=document.getElementById("bib-sub-content");s.sectionContainerEl=n,await W(),s.sectionContainerEl===n&&(s.sectionContainerEl=null)})):a.innerHTML="");let i=t;s.sectionContainerEl=i;try{e==="collectie"?(s.currentTab="plexlib",await se()):e==="gaten"?(s.currentTab="gaps",await W()):e==="lijst"&&(s.currentTab="wishlist",await ee())}finally{s.sectionContainerEl===i&&(s.sectionContainerEl=null)}}async function qe(){s.currentTab="plexlib",D(),S.innerHTML=`
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
    </div>`,S.style.opacity="1",S.style.transform="";let e=document.getElementById("badge-gaps-bib"),t=document.getElementById("badge-gaps");e&&t&&(e.textContent=t.textContent),document.querySelectorAll(".bib-tab").forEach(a=>a.addEventListener("click",()=>et(a.dataset.bibtab)));{let a=document.getElementById("strip-artists-body");s.sectionContainerEl=a,await Te(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}{let a=document.getElementById("strip-tracks-body");s.sectionContainerEl=a,await Be(s.currentPeriod),s.sectionContainerEl===a&&(s.sectionContainerEl=null)}await et(s.bibSubTab),X(document.getElementById("bib-stats-content"),()=>{let a=document.getElementById("bib-stats-content");return R(a,Ce)})}function Ae(e){let t=document.getElementById("panel-overlay"),a=document.getElementById("panel-content"),i=ne(e),n=()=>{a.innerHTML=`<div style="height:260px;background:var(--surface2)"></div>
      <div class="panel-body"><div class="loading" style="padding:2rem 0"><div class="spinner"></div>Laden...</div></div>`,t.classList.add("open"),document.body.style.overflow="hidden"};document.startViewTransition?document.startViewTransition(n).finished.catch(()=>{}):n(),Promise.allSettled([f(`/api/artist/${encodeURIComponent(e)}/info`),f(`/api/artist/${encodeURIComponent(e)}/similar`)]).then(([d,c])=>{let o=d.status==="fulfilled"?d.value:{},r=c.status==="fulfilled"?c.value.similar||[]:[],u=T(o.image,400)||o.image,v=u?`<img src="${l(u)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="panel-photo-ph" style="background:${g(e)};display:none">${m(e)}</div>`:`<div class="panel-photo-ph" style="background:${g(e)}">${m(e)}</div>`,y=[o.country?O(o.country)+" "+o.country:null,o.startYear?`Actief vanaf ${o.startYear}`:null,s.plexOk&&o.inPlex!==void 0?o.inPlex?"\u25B6 In Plex":"\u2726 Nieuw voor jou":null].filter(Boolean).join(" \xB7 "),$="";if(o.albums?.length){$='<div class="panel-section">Albums</div><div class="panel-albums">';for(let w of o.albums){let x=T(w.image,48)||w.image,A=x?`<img class="panel-album-img" src="${l(x)}" alt="" loading="lazy" onerror="this.onerror=null;this.remove()">`:'<div class="panel-album-ph">\u266A</div>',P=s.plexOk&&w.inPlex?'<span class="badge plex" style="font-size:9px">\u25B6</span>':"";$+=`<div class="panel-album-row">${A}
          <span class="panel-album-name">${l(w.name)}</span>${P}${V(e,w.name,w.inPlex)}</div>`}$+="</div>"}let E="";if(r.length){E='<div class="panel-section">Vergelijkbare artiesten</div><div class="panel-similar">';for(let w of r)E+=`<button class="panel-similar-chip artist-link" data-artist="${l(w.name)}">${l(w.name)}</button>`;E+="</div>"}a.innerHTML=`
      <div class="panel-photo-wrap" style="view-transition-name: artist-${i}">${v}</div>
      <div class="panel-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div class="panel-artist-name">${l(e)}</div>
          ${N("artist",e,"",o.image||"")}
        </div>
        ${y?`<div class="panel-meta">${l(y)}</div>`:""}
        ${H(o.tags,6)}
        ${$}
        ${E}
      </div>`})}function ge(){document.getElementById("panel-overlay").classList.remove("open"),document.body.style.overflow=""}var fe={nu:()=>me(),ontdek:()=>_(),bibliotheek:()=>qe(),downloads:()=>Ye(),discover:()=>G(),gaps:()=>W(),recent:()=>Se(),recs:()=>de(),releases:()=>U(),topartists:()=>Te(s.currentPeriod),toptracks:()=>Be(s.currentPeriod),loved:()=>tt(),stats:()=>Ce(),wishlist:()=>ee(),plexlib:()=>se(),tidal:()=>ke()};document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelectorAll(".tab"),i=document.querySelector(".tab.active"),n=Array.from(a).indexOf(i),c=Array.from(a).indexOf(e)>n?"rtl":"ltr";document.documentElement.style.setProperty("--tab-direction",c==="ltr"?"-1":"1"),a.forEach(o=>o.classList.remove("active")),e.classList.add("active"),s.currentMainTab=t,["tb-period","tb-recs","tb-mood","tb-releases","tb-discover","tb-gaps","tb-plexlib","tb-tidarr-ui"].forEach(o=>document.getElementById(o)?.classList.remove("visible")),document.getElementById("tb-tidal")?.classList.toggle("visible",t==="downloads"),t!=="downloads"&&D(),t!=="downloads"&&void 0,document.startViewTransition?document.startViewTransition(()=>{fe[t]?.()}).finished.catch(()=>{}):fe[t]?.()})});document.querySelectorAll("[data-period]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-period]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.currentPeriod=e.dataset.period,fe[s.currentTab]?.()})});document.querySelectorAll("[data-filter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-filter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=e.dataset.filter,e.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),ue()})});document.querySelectorAll("[data-dfilter]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-dfilter]").forEach(t=>t.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=e.dataset.dfilter,e.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss"),te()})});document.querySelectorAll("[data-gsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-gsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.gapsSort=e.dataset.gsort,ae()})});document.querySelectorAll("[data-rtype]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rtype]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesFilter=e.dataset.rtype,j()})});document.querySelectorAll("[data-rsort]").forEach(e=>{e.addEventListener("click",()=>{document.querySelectorAll("[data-rsort]").forEach(t=>t.classList.remove("sel-def")),e.classList.add("sel-def"),s.releasesSort=e.dataset.rsort,j()})});document.getElementById("btn-refresh-releases")?.addEventListener("click",async()=>{s.lastReleases=null,await fetch("/api/releases/refresh",{method:"POST"}),U()});document.getElementById("btn-refresh-discover")?.addEventListener("click",async()=>{s.lastDiscover=null,await fetch("/api/discover/refresh",{method:"POST"}),G()});document.getElementById("btn-refresh-gaps")?.addEventListener("click",async()=>{s.lastGaps=null,await fetch("/api/gaps/refresh",{method:"POST"}),W()});document.getElementById("plib-search")?.addEventListener("input",e=>{!s.plexLibData||s.currentTab!=="plexlib"||(S.innerHTML=ve(s.plexLibData,e.target.value))});document.getElementById("btn-sync-plex")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex"),t=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{await fetch("/api/plex/refresh",{method:"POST"}),await F(),s.plexLibData=null,s.currentTab==="plexlib"&&await se()}catch{}finally{e.disabled=!1,e.textContent=t}});document.getElementById("plex-refresh-btn")?.addEventListener("click",async()=>{let e=document.getElementById("plex-refresh-btn");e.classList.add("spinning"),e.disabled=!0;try{await fetch("/api/plex/refresh",{method:"POST"}),await F(),s.plexLibData=null}catch{}finally{e.classList.remove("spinning"),e.disabled=!1}});document.getElementById("tidal-search")?.addEventListener("input",e=>{clearTimeout(s.tidalSearchTimeout);let t=e.target.value.trim();s.tidalSearchTimeout=setTimeout(()=>{s.currentTab==="tidal"&&s.tidalView==="search"&&we(t)},400)});document.getElementById("panel-close")?.addEventListener("click",ge);document.addEventListener("click",async e=>{let t=e.target.closest(".play-btn");if(t){e.stopPropagation(),Ke(t,t.dataset.artist,t.dataset.track);return}let a=e.target.closest(".disc-toggle-btn");if(a){e.stopPropagation();let p=a.dataset.discId,h=document.getElementById(p);if(h){let k=h.classList.toggle("collapsed");h.querySelectorAll(".disc-toggle-btn").forEach(L=>{L.classList.toggle("expanded",!k),L.classList.toggle("collapsed",k);let I=parseInt(L.dataset.albumCount,10)||0,M=`${I} album${I!==1?"s":""}`;L.textContent=k?`Toon ${M}`:M})}return}let i=e.target.closest(".discover-card-toggle");if(i&&!e.target.closest(".artist-link")&&!e.target.closest(".bookmark-btn")&&!e.target.closest(".disc-toggle-btn")){let p=i.dataset.discId,h=document.getElementById(p);if(h){let k=h.classList.toggle("collapsed");h.querySelectorAll(".disc-toggle-btn").forEach(L=>{L.classList.toggle("expanded",!k),L.classList.toggle("collapsed",k);let I=parseInt(L.dataset.albumCount,10)||0,M=`${I} album${I!==1?"s":""}`;L.textContent=k?`Toon ${M}`:M})}return}let n=e.target.closest("[data-artist]");if(n?.dataset.artist&&!n.classList.contains("bookmark-btn")){n.classList.contains("search-result-item")&&(document.getElementById("search-results").classList.remove("open"),document.getElementById("search-input").value=""),Ae(n.dataset.artist);return}let d=e.target.closest(".bookmark-btn");if(d){e.stopPropagation();let{btype:p,bname:h,bartist:k,bimage:L}=d.dataset,I=await Fe(p,h,k,L);d.classList.toggle("saved",I),d.title=I?"Verwijder uit lijst":"Sla op in lijst",document.querySelectorAll(`.bookmark-btn[data-bname="${CSS.escape(h)}"][data-btype="${p}"]`).forEach(M=>{M.classList.toggle("saved",I)});return}let c=e.target.closest(".wish-remove[data-wid]");if(c){await fetch(`/api/wishlist/${c.dataset.wid}`,{method:"DELETE"}),s.wishlistMap.forEach((p,h)=>{String(p)===c.dataset.wid&&s.wishlistMap.delete(h)}),K(),ee();return}let o=e.target.closest(".panel-similar-chip[data-artist]");if(o){Ae(o.dataset.artist);return}let r=e.target.closest(".download-btn, .tidal-dl-btn");if(r){if(e.stopPropagation(),r.classList.contains("tidal-dl-btn")){let k=r.dataset.dlurl;if(!k)return;r.disabled=!0;let L=r.textContent;r.textContent="\u2026";try{let I=await fetch("/api/tidarr/download",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:k})}),M=await I.json();if(!I.ok||!M.ok)throw new Error(M.error||"download mislukt");r.textContent="\u2713 Toegevoegd",r.classList.add("downloaded"),le()}catch(I){alert("Downloaden mislukt: "+I.message),r.textContent=L,r.disabled=!1}return}let{dlartist:p,dlalbum:h}=r.dataset;await We(p,h,r);return}let u=e.target.closest(".q-remove[data-qid]");if(u){e.stopPropagation();try{await fetch("/api/tidarr/queue/"+encodeURIComponent(u.dataset.qid),{method:"DELETE"})}catch(p){alert("Verwijderen mislukt: "+p.message)}return}let v=e.target.closest(".q-remove[data-dlid]");if(v){e.stopPropagation();try{await fetch(`/api/downloads/${v.dataset.dlid}`,{method:"DELETE"}),v.closest(".q-row")?.remove()}catch(p){alert("Verwijderen mislukt: "+p.message)}return}let y=e.target.closest(".inline-toolbar [data-filter]");if(y){document.querySelectorAll("[data-filter]").forEach(p=>p.classList.remove("sel-def","sel-new","sel-plex")),s.recsFilter=y.dataset.filter,y.classList.add(s.recsFilter==="all"?"sel-def":s.recsFilter==="new"?"sel-new":"sel-plex"),ue();return}let $=e.target.closest(".inline-toolbar [data-rtype]");if($){document.querySelectorAll("[data-rtype]").forEach(h=>h.classList.remove("sel-def")),s.releasesFilter=$.dataset.rtype,$.classList.add("sel-def");let p=document.getElementById("sec-releases-content");p&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=p,j(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):j();return}let E=e.target.closest(".inline-toolbar [data-rsort]");if(E){document.querySelectorAll("[data-rsort]").forEach(h=>h.classList.remove("sel-def")),s.releasesSort=E.dataset.rsort,E.classList.add("sel-def");let p=document.getElementById("sec-releases-content");p&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=p,j(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):j();return}let w=e.target.closest(".inline-toolbar [data-dfilter]");if(w){document.querySelectorAll("[data-dfilter]").forEach(h=>h.classList.remove("sel-def","sel-new","sel-miss")),s.discFilter=w.dataset.dfilter,w.classList.add(s.discFilter==="all"?"sel-def":s.discFilter==="new"?"sel-new":"sel-miss");let p=document.getElementById("sec-discover-content");p&&s.currentMainTab==="ontdek"?(s.sectionContainerEl=p,te(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):te();return}let x=e.target.closest(".inline-toolbar [data-gsort]");if(x){document.querySelectorAll("[data-gsort]").forEach(h=>h.classList.remove("sel-def")),s.gapsSort=x.dataset.gsort,x.classList.add("sel-def");let p=document.getElementById("bib-sub-content");p&&s.currentMainTab==="bibliotheek"?(s.sectionContainerEl=p,ae(),s.sectionContainerEl===p&&(s.sectionContainerEl=null)):ae();return}let A=e.target.closest(".sec-mood-block [data-mood]");if(A){let p=A.dataset.mood;if(s.activeMood===p){s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(k=>k.classList.remove("sel-mood","loading")),Q(),_();return}s.activeMood=p,document.querySelectorAll("[data-mood]").forEach(k=>k.classList.remove("sel-mood","loading")),A.classList.add("sel-mood");let h=A.closest(".inline-toolbar");if(h&&!document.getElementById("btn-clear-mood-inline")){let k=document.createElement("span");k.className="toolbar-sep";let L=document.createElement("button");L.className="tool-btn",L.id="btn-clear-mood-inline",L.textContent="\u2715 Wis mood",L.addEventListener("click",()=>{s.activeMood=null,document.querySelectorAll("[data-mood]").forEach(I=>I.classList.remove("sel-mood","loading")),Q(),_()}),h.appendChild(k),h.appendChild(L)}ce(p);return}let P=e.target.closest("[data-tidal-view]");if(P){let p=P.dataset.tidalView;p==="tidarr"?(document.getElementById("tb-tidal")?.classList.remove("visible"),document.getElementById("tb-tidarr-ui")?.classList.add("visible"),Ge()):(D(),document.getElementById("tb-tidal")?.classList.add("visible"),document.getElementById("tb-tidarr-ui")?.classList.remove("visible"),oe(p));return}if(e.target===document.getElementById("panel-overlay")){ge();return}});document.addEventListener("keydown",e=>{if(e.key==="Escape"){ge(),document.getElementById("search-results").classList.remove("open");return}let t=["INPUT","TEXTAREA"].includes(document.activeElement?.tagName);if(e.key==="/"&&!t){e.preventDefault(),document.getElementById("search-input").focus();return}if(e.key==="r"&&!t){s.currentMainTab==="ontdek"?_():s.currentMainTab==="bibliotheek"?qe():fe[s.currentTab]?.();return}if(!t&&/^[1-4]$/.test(e.key)){let a=document.querySelectorAll(".tab"),i=parseInt(e.key)-1;a[i]&&a[i].click();return}});document.querySelectorAll(".bnav-btn").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab,a=document.querySelector(`.tab[data-tab="${t}"]`);a&&(document.startViewTransition?document.startViewTransition(()=>{a.click()}).finished.catch(()=>{}):a.click()),document.querySelectorAll(".bnav-btn").forEach(i=>i.classList.toggle("active",i===e))})});document.querySelectorAll(".tab").forEach(e=>{e.addEventListener("click",()=>{let t=e.dataset.tab;document.querySelectorAll(".bnav-btn").forEach(a=>a.classList.toggle("active",a.dataset.tab===t))})});be&&document.documentElement.setAttribute("data-reduce-motion","true");function st(e){document.documentElement.dataset.theme=e;let t=document.getElementById("theme-toggle");t&&(t.textContent=e==="dark"?"\u2600\uFE0F":"\u{1F319}")}(function(){let t=localStorage.getItem("theme");st(t||"light")})();document.getElementById("theme-toggle")?.addEventListener("click",()=>{let t=document.documentElement.dataset.theme==="dark"?"light":"dark";st(t),localStorage.setItem("theme",t)});(function(){let t=localStorage.getItem("downloadQuality")||"high",a=document.getElementById("download-quality");a&&s.VALID_QUALITIES.includes(t)&&(a.value=t)})();document.getElementById("download-quality")?.addEventListener("change",e=>{localStorage.setItem("downloadQuality",e.target.value)});F();pe();He();he();$e();je();re();Ze();me();setInterval(pe,3e4);})();
