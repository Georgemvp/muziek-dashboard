import{d as Q}from"./chunk-H7SZLMAB.js";import{e as H,f as J,g as G}from"./chunk-HNNUXXVH.js";import{A as L,B as S,E as g,G as Y,X as V,a as d,b as q,c as F,e as I,f,g as z,h as p,i as B,j as n,k as x,l as Z,m,n as D,o as O,q as N,r as U,t as M,u as P,v,w as h,x as k,y as W,z as R}from"./chunk-4E6U7I7I.js";var E=null,lt=null,y="artist",w="",nt=null,C=null,T=210,X=3;function tt(){let t=window.innerWidth;return t>=1400?6:t>=1e3?5:t>=800?4:t>=640?3:2}async function j(){if(E)return E;let t=await g("/api/plex/library/all");return!t.ok||!t.library?.length?[]:(E=t.library.map(([e,a,i,s])=>({artist:e,album:a,ratingKey:i,thumb:s})),E)}function rt(){let t=E||[],e=w.toLowerCase().trim();return e&&(t=t.filter(a=>a.artist.toLowerCase().includes(e)||a.album.toLowerCase().includes(e))),y==="artist"?t=[...t].sort((a,i)=>a.artist.localeCompare(i.artist,"nl",{sensitivity:"base"})||a.album.localeCompare(i.album,"nl",{sensitivity:"base"})):y==="recent"&&(t=[...t].reverse()),lt=t,t}function ot(t){let e=new Map;for(let a of t){let i=(a.artist[0]||"#").toUpperCase(),s=/[A-Z]/.test(i)?i:"#";e.has(s)||e.set(s,[]),e.get(s).push(a)}return e}function dt(t){let e=t.thumb?f(t.thumb,240):null,a=e?`<img src="${n(e)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-cover-ph" style="display:none;background:${m(t.album)}">${p(t.album)}</div>`:`<div class="blib-cover-ph" style="background:${m(t.album)}">${p(t.album)}</div>`;return`<div class="blib-album"
    data-rating-key="${n(t.ratingKey)}"
    data-album="${n(t.album)}"
    data-artist="${n(t.artist)}"
    data-thumb="${n(t.thumb||"")}">
    <div class="blib-cover">
      ${a}
      <div class="blib-play-overlay"><button class="blib-play-btn" title="Afspelen">\u25B6</button></div>
    </div>
    <div class="blib-album-title" title="${n(t.album)}">${n(t.album)}</div>
    <div class="blib-album-artist">${n(t.artist)}</div>
  </div>`}var _=class{constructor(e,a){this.container=e,this.items=a,this.cols=tt(),this.lastStart=-1,this.lastEnd=-1,this.useGroups=y==="artist"&&!w,this.groups=this.useGroups?ot(a):null,this.flatRows=this._buildFlatRows(),this._createDOM(),this._onScroll=this._onScroll.bind(this),this._onResize=this._onResize.bind(this),window.addEventListener("scroll",this._onScroll,{passive:!0}),window.addEventListener("resize",this._onResize),this.render()}_buildFlatRows(){let e=[],a=0;if(this.groups)for(let[i,s]of this.groups){e.push({type:"header",letter:i,height:62,offset:a}),a+=62;for(let c=0;c<s.length;c+=this.cols)e.push({type:"albums",items:s.slice(c,c+this.cols),height:T,offset:a}),a+=T}else for(let i=0;i<this.items.length;i+=this.cols)e.push({type:"albums",items:this.items.slice(i,i+this.cols),height:T,offset:a}),a+=T;return this.totalHeight=a,e}_createDOM(){this.container.innerHTML=`<div class="blib-virtual-container" style="height:${this.totalHeight}px;position:relative">
         <div class="blib-virtual-window" style="position:absolute;left:0;right:0;top:0"></div>
       </div>`,this.winEl=this.container.querySelector(".blib-virtual-window")}_onScroll(){this.render()}_onResize(){let e=tt();if(e!==this.cols){this.cols=e,this.flatRows=this._buildFlatRows();let a=this.container.querySelector(".blib-virtual-container");a&&(a.style.height=this.totalHeight+"px"),this.lastStart=-1,this.lastEnd=-1}this.render()}render(){let e=window.scrollY||document.documentElement.scrollTop,a=this.container.getBoundingClientRect().top+e,i=e-a,s=window.innerHeight,c=X*T,b=0,r=this.flatRows.length-1;for(let o=0;o<this.flatRows.length;o++){let u=this.flatRows[o];if(u.offset+u.height>=i-c){b=Math.max(0,o-X);break}}for(let o=b;o<this.flatRows.length;o++)if(this.flatRows[o].offset>i+s+c){r=o;break}if(b===this.lastStart&&r===this.lastEnd)return;this.lastStart=b,this.lastEnd=r;let l="";for(let o=b;o<=r&&o<this.flatRows.length;o++){let u=this.flatRows[o];if(u.type==="header")l+=`<div class="blib-letter-header" style="height:${u.height}px;box-sizing:border-box">${n(u.letter)}</div>`;else{l+='<div class="blib-grid">';for(let $ of u.items)l+=dt($);l+="</div>"}}this.winEl.style.top=(this.flatRows[b]?.offset||0)+"px",requestAnimationFrame(()=>{this.winEl.innerHTML=l})}destroy(){window.removeEventListener("scroll",this._onScroll),window.removeEventListener("resize",this._onResize)}scrollToLetter(e){for(let a of this.flatRows)if(a.type==="header"&&a.letter===e){let i=this.container.getBoundingClientRect().top+window.scrollY+a.offset-120;window.scrollTo({top:i,behavior:"smooth"});return}}getAvailableLetters(){return new Set(this.flatRows.filter(e=>e.type==="header").map(e=>e.letter))}};function ct(t){let e=document.getElementById("blib-az-rail");if(!e)return;let a=t.getAvailableLetters();e.innerHTML="ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map(i=>`<button class="blib-az-btn${a.has(i)?"":" disabled"}" data-letter="${i}">${i}</button>`).join(""),e.addEventListener("click",i=>{let s=i.target.closest(".blib-az-btn");s&&!s.classList.contains("disabled")&&t.scrollToLetter(s.dataset.letter)})}function bt(t){let e=document.getElementById("blib-detail-overlay");e||(e=document.createElement("div"),e.id="blib-detail-overlay",e.className="blib-detail-overlay",document.body.appendChild(e));let a=t.thumb?f(t.thumb,320):null,i=a?`<img src="${n(a)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="blib-detail-cover-ph" style="display:none;background:${m(t.album)}">${p(t.album)}</div>`:`<div class="blib-detail-cover-ph" style="background:${m(t.album)}">${p(t.album)}</div>`;e.innerHTML=`
    <div class="blib-detail-panel">
      <button class="blib-detail-close" id="blib-detail-close">\u2715</button>
      <div class="blib-detail-hero">
        <div class="blib-detail-cover">${i}</div>
        <div class="blib-detail-info">
          <div class="blib-detail-title">${n(t.album)}</div>
          <div class="blib-detail-artist">${n(t.artist)}</div>
          <button class="blib-detail-play-all" id="blib-detail-play-all">\u25B6 Alles afspelen</button>
        </div>
      </div>
      <div class="blib-tracklist" id="blib-tracklist">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>`,e.classList.add("open"),document.body.style.overflow="hidden",e.querySelector("#blib-detail-close").addEventListener("click",et),e.addEventListener("click",s=>{s.target===e&&et()}),e.querySelector("#blib-detail-play-all").addEventListener("click",()=>{t.ratingKey&&(H(t.ratingKey,"music"),K(t))}),t.ratingKey&&g(`/api/plex/album/${encodeURIComponent(t.ratingKey)}/tracks`).then(s=>{let c=document.getElementById("blib-tracklist");if(!c)return;let b=s.tracks||[];if(!b.length){c.innerHTML='<div class="blib-empty"><p>Geen tracks gevonden.</p></div>';return}c.innerHTML=b.map((r,l)=>{let o=r.duration?Math.floor(r.duration/1e3):0,u=Math.floor(o/60),$=String(o%60).padStart(2,"0");return`<div class="blib-track-row"
              data-track-key="${n(r.ratingKey||"")}"
              data-track-title="${n(r.title||"")}">
            <div class="blib-track-num"><span>${l+1}</span></div>
            <div class="blib-track-title">${n(r.title||"")}</div>
            ${o?`<div class="blib-track-duration">${u}:${$}</div>`:""}
          </div>`}).join(""),c.addEventListener("click",r=>{let l=r.target.closest(".blib-track-row");l?.dataset.trackKey&&(H(l.dataset.trackKey,"music"),K(t))})}).catch(()=>{let s=document.getElementById("blib-tracklist");s&&(s.innerHTML='<div class="blib-empty"><p>Tracks laden mislukt.</p></div>')})}function et(){let t=document.getElementById("blib-detail-overlay");t&&t.classList.remove("open"),document.body.style.overflow=""}function at(){if(!document.getElementById("blib-player")){let t=document.createElement("div");t.id="blib-player",t.className="blib-player",document.body.appendChild(t)}}function K(t){nt=t,at();let e=document.getElementById("blib-player"),a=t.thumb?f(t.thumb,80):null,i=a?`<img src="${n(a)}" alt="" onerror="this.style.display='none'">`:`<div style="width:44px;height:44px;border-radius:6px;background:${m(t.album)};
         display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">
         ${p(t.album)}</div>`;e.innerHTML=`
    <div class="blib-player-progress"><div class="blib-player-progress-fill" id="blib-progress-fill"></div></div>
    <div class="blib-player-cover">${i}</div>
    <div class="blib-player-info">
      <div class="blib-player-title">${n(t.album)}</div>
      <div class="blib-player-artist">${n(t.artist)}</div>
    </div>
    <div class="blib-player-controls">
      <button class="blib-ctrl-btn" id="blib-prev" title="Vorige">\u23EE</button>
      <button class="blib-ctrl-btn primary" id="blib-pause" title="Pauze">\u23F8</button>
      <button class="blib-ctrl-btn" id="blib-next" title="Volgende">\u23ED</button>
    </div>`,e.classList.add("visible"),e.querySelector("#blib-prev").addEventListener("click",()=>G("prev")),e.querySelector("#blib-next").addEventListener("click",()=>G("next")),e.querySelector("#blib-pause").addEventListener("click",()=>J())}function ut(t){let e=document.getElementById("blib-count");e&&(e.textContent=`${B(t)} albums`)}async function A(t){C&&(C.destroy(),C=null);let e=rt();if(ut(e.length),!e.length){t.innerHTML=`
      <div class="blib-empty">
        <div class="blib-empty-icon">\u{1F3B5}</div>
        <h3>Geen albums gevonden</h3>
        <p>${w?`Geen resultaten voor "<strong>${n(w)}</strong>"`:"Plex bibliotheek is leeg of nog niet gesynchroniseerd."}</p>
      </div>`;return}if(C=new _(t,e),y==="artist"&&!w)ct(C);else{let a=document.getElementById("blib-az-rail");a&&(a.innerHTML="")}}function vt(){return`
    <div class="blib-toolbar">
      <input class="blib-search" id="blib-search" type="text"
        placeholder="\u{1F50D}  Zoek artiest of album\u2026" autocomplete="off"
        value="${n(w)}">
      <button class="blib-pill${y==="artist"?" active":""}" data-sort="artist">Artiest A\u2013Z</button>
      <button class="blib-pill${y==="recent"?" active":""}" data-sort="recent">Recent</button>
      <span class="blib-count" id="blib-count"></span>
      <button class="tool-btn" id="btn-sync-plex-blib" style="margin-left:8px">\u21BB Sync Plex</button>
    </div>
    <div class="blib-az-rail" id="blib-az-rail"></div>`}function pt(t){document.getElementById("blib-search")?.addEventListener("input",e=>{w=e.target.value,A(t)}),document.querySelectorAll(".blib-pill").forEach(e=>{e.addEventListener("click",()=>{y=e.dataset.sort,document.querySelectorAll(".blib-pill").forEach(a=>a.classList.toggle("active",a.dataset.sort===y)),A(t)})}),document.getElementById("btn-sync-plex-blib")?.addEventListener("click",async()=>{let e=document.getElementById("btn-sync-plex-blib"),a=e.textContent;e.disabled=!0,e.textContent="\u21BB Bezig\u2026";try{try{await q("/api/plex/refresh",{method:"POST"})}catch(i){if(i.name!=="AbortError")throw i}await Y(),E=null,await j(),A(t)}catch{}finally{e.disabled=!1,e.textContent=a}})}function Ht(t,e){return""}function zt(t){let e=t.target.closest(".blib-play-btn");if(e){t.stopPropagation();let i=e.closest(".blib-album");return i?.dataset.ratingKey&&(H(i.dataset.ratingKey,"music"),K({ratingKey:i.dataset.ratingKey,album:i.dataset.album,artist:i.dataset.artist,thumb:i.dataset.thumb})),!0}let a=t.target.closest(".blib-album");return a?.dataset.ratingKey?(bt({ratingKey:a.dataset.ratingKey,album:a.dataset.album,artist:a.dataset.artist,thumb:a.dataset.thumb}),!0):!1}async function Mt(){try{await j();let t=document.getElementById("bib-sub-content");t&&d.bibSubTab==="collectie"&&A(t)}catch(t){t.name!=="AbortError"&&h(t.message)}}async function it(t){d.bibSubTab=t;let e=document.getElementById("bib-sub-content"),a=document.getElementById("bib-subtoolbar");if(e){if(document.querySelectorAll(".bib-tab").forEach(i=>i.classList.toggle("active",i.dataset.bibtab===t)),t==="collectie"){if(d.activeSubTab="collectie",a&&(a.innerHTML=vt(),pt(e)),!document.getElementById("blib-detail-overlay")){let i=document.createElement("div");i.id="blib-detail-overlay",i.className="blib-detail-overlay",document.body.appendChild(i)}at(),e.innerHTML='<div class="loading"><div class="spinner"></div>Bibliotheek laden\u2026</div>';try{await j(),await A(e)}catch(i){i.name!=="AbortError"&&h(i.message)}}else if(t==="lijst"){d.activeSubTab="lijst",a&&(a.innerHTML="");let i=e;d.sectionContainerEl=i;try{await Q()}finally{d.sectionContainerEl===i&&(d.sectionContainerEl=null)}}}}async function Pt(){d.activeSubTab="collectie",V(),I.innerHTML=`
    <div class="bib-layout">
      <div class="bib-strips-wrap">
        <div class="scroll-strip">
          <div class="strip-label">Top artiesten <span class="strip-period">(${x(d.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-artists-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="scroll-strip" style="margin-top:16px">
          <div class="strip-label">Top nummers <span class="strip-period">(${x(d.currentPeriod)})</span></div>
          <div class="strip-body" id="strip-tracks-body">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>

      <div class="bib-subtabs" id="bib-subtabs">
        <button class="bib-tab${d.bibSubTab==="collectie"?" active":""}" data-bibtab="collectie">Collectie</button>
        <button class="bib-tab${d.bibSubTab==="lijst"?" active":""}" data-bibtab="lijst">Lijst</button>
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
    </div>`,I.style.opacity="1",I.style.transform="",document.querySelectorAll(".bib-tab").forEach(t=>t.addEventListener("click",()=>it(t.dataset.bibtab))),await Promise.all([R(document.getElementById("strip-artists-body"),()=>mt(d.currentPeriod)),R(document.getElementById("strip-tracks-body"),()=>gt(d.currentPeriod))]),await it(d.bibSubTab),W(document.getElementById("bib-stats-content"),()=>{let t=document.getElementById("bib-stats-content");return R(t,ht)})}async function mt(t){k();let e=d.tabAbort?.signal;try{let a=`topartists:${t}`,i=L(a,300*1e3);if(!i){if(i=await g(`/api/topartists?period=${t}`,{signal:e}),e?.aborted)return;S(a,i)}let s=i.topartists?.artist||[];if(!s.length){v('<div class="empty">Geen data.</div>');return}let c=parseInt(s[0]?.playcount||1),b=`<div class="section-title">Top artiesten \xB7 ${x(t)}</div><div class="artist-grid">`;for(let r=0;r<s.length;r++){let l=s[r],o=Math.round(parseInt(l.playcount)/c*100),u=z(l.image,"large")||z(l.image),$=f(u,120)||u,st=$?`<img src="${$}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="ag-photo-ph" style="display:none;background:${m(l.name,!0)}">${p(l.name)}</div>`:`<div class="ag-photo-ph" style="background:${m(l.name,!0)}">${p(l.name)}</div>`;b+=`<div class="ag-card">
        <div class="ag-photo" id="agp-${r}" style="view-transition-name: artist-${U(l.name)}">${st}</div>
        <div class="ag-info">
          <div class="ag-name artist-link" data-artist="${n(l.name)}">${n(l.name)}</div>
          <div class="card-bar"><div class="card-bar-fill" style="width:${o}%"></div></div>
          <div class="ag-plays">${B(l.playcount)} plays</div>
        </div></div>`}v(b+"</div>"),await F(s.map((r,l)=>async()=>{try{let o=await g(`/api/artist/${encodeURIComponent(r.name)}/info`);if(o.image){let u=document.getElementById(`agp-${l}`);u&&(u.innerHTML=`<img src="${f(o.image,120)||o.image}" alt="" loading="lazy" onerror="this.style.display='none'">`)}}catch{}}),4)}catch(a){if(a.name==="AbortError")return;h(a.message)}}async function gt(t){k();let e=d.tabAbort?.signal;try{let a=`toptracks:${t}`,i=L(a,300*1e3);if(!i){if(i=await g(`/api/toptracks?period=${t}`,{signal:e}),e?.aborted)return;S(a,i)}let s=i.toptracks?.track||[];if(!s.length){v('<div class="empty">Geen data.</div>');return}let c=parseInt(s[0]?.playcount||1),b=`<div class="section-title">Top nummers \xB7 ${x(t)}</div><div class="card-list">`;for(let r of s){let l=Math.round(parseInt(r.playcount)/c*100);b+=`<div class="card">${M(r.image)}<div class="card-info">
        <div class="card-title">${n(r.name)}</div>
        <div class="card-sub artist-link" data-artist="${n(r.artist?.name||"")}">${n(r.artist?.name||"")}</div>
        <div class="card-bar"><div class="card-bar-fill" style="width:${l}%"></div></div>
        </div><div class="card-meta">${B(r.playcount)}\xD7</div>
        <button class="play-btn" data-artist="${n(r.artist?.name||"")}" data-track="${n(r.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}v(b+"</div>")}catch(a){if(a.name==="AbortError")return;h(a.message)}}async function Gt(){k();let t=d.tabAbort?.signal;try{let e=L("loved",6e5);if(!e){if(e=await g("/api/loved",{signal:t}),t?.aborted)return;S("loved",e)}let a=e.lovedtracks?.track||[];if(!a.length){v('<div class="empty">Geen geliefde nummers.</div>');return}let i='<div class="section-title">Geliefde nummers</div><div class="card-list">';for(let s of a){let c=s.date?.uts?Z(parseInt(s.date.uts)):"";i+=`<div class="card">${M(s.image)}<div class="card-info">
        <div class="card-title">${n(s.name)}</div>
        <div class="card-sub artist-link" data-artist="${n(s.artist?.name||"")}">${n(s.artist?.name||"")}</div>
        </div><div class="card-meta" style="color:var(--red)">\u2665 ${c}</div>
        <button class="play-btn" data-artist="${n(s.artist?.name||"")}" data-track="${n(s.name)}" title="Preview afspelen">\u25B6</button>
        <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}v(i+"</div>")}catch(e){if(e.name==="AbortError")return;h(e.message)}}async function ht(){k("Statistieken ophalen...");let t=d.tabAbort?.signal;try{let e=L("stats",6e5);if(!e){if(e=await g("/api/stats",{signal:t}),t?.aborted)return;S("stats",e)}v(`
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
      </div>`,()=>yt(e))}catch(e){if(e.name==="AbortError")return;h(e.message)}}function yt(t){if(typeof Chart>"u")return;let e=!window.matchMedia("(prefers-color-scheme: light)").matches,a=e?"#2c2c2c":"#ddd",i=e?"#888":"#777",s=e?"#efefef":"#111";Chart.defaults.color=i,Chart.defaults.borderColor=a;let c=document.getElementById("chart-daily");c&&new Chart(c,{type:"bar",data:{labels:t.dailyScrobbles.map(l=>new Date(l.date+"T12:00:00").toLocaleDateString("nl-NL",{weekday:"short",day:"numeric"})),datasets:[{data:t.dailyScrobbles.map(l=>l.count),backgroundColor:"rgba(213,16,7,0.75)",borderRadius:4}]},options:{responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:l=>`${l.raw} scrobbles`}}},scales:{x:{grid:{display:!1},ticks:{color:i}},y:{grid:{color:a},ticks:{color:i},beginAtZero:!0}}}});let b=document.getElementById("chart-top");b&&t.topArtists?.length&&new Chart(b,{type:"bar",data:{labels:t.topArtists.map(l=>l.name),datasets:[{data:t.topArtists.map(l=>l.playcount),backgroundColor:"rgba(229,160,13,0.75)",borderRadius:4}]},options:{indexAxis:"y",responsive:!0,plugins:{legend:{display:!1},tooltip:{callbacks:{label:l=>`${l.raw} plays`}}},scales:{x:{grid:{color:a},ticks:{color:i},beginAtZero:!0},y:{grid:{display:!1},ticks:{color:s,font:{size:11}}}}}});let r=document.getElementById("chart-genres");if(r&&t.genres?.length){let l=["#d51007","#e5a00d","#6c5ce7","#00b894","#fd79a8","#0984e3","#e17055","#a29bfe"];new Chart(r,{type:"doughnut",data:{labels:t.genres.map(o=>o.name),datasets:[{data:t.genres.map(o=>o.count),backgroundColor:l.slice(0,t.genres.length),borderWidth:0}]},options:{responsive:!0,plugins:{legend:{position:"right",labels:{color:i,boxWidth:12,padding:10,font:{size:11}}}}}})}}async function ft(){k("Collectiegaten zoeken...");let t=d.tabAbort?.signal;try{let e=await g("/api/gaps",{signal:t});if(t?.aborted)return;if(e.status==="building"&&(!e.artists||!e.artists.length)){v(`<div class="loading"><div class="spinner"></div>
        <div>${n(e.message)}</div>
        <div class="build-hint">Pagina ververst automatisch over 20 seconden</div></div>`),setTimeout(()=>{d.activeSubTab==="gaten"&&ft()},2e4);return}if(d.lastGaps=e,wt(),e.builtAt&&Date.now()-e.builtAt>864e5){let a=document.createElement("div");a.className="refresh-banner",a.textContent="\u21BB Gaps worden op de achtergrond ververst...";let i=d.sectionContainerEl||document.getElementById("content");i&&i.prepend(a),fetch("/api/gaps/refresh",{method:"POST"}).catch(()=>{})}}catch(e){if(e.name==="AbortError")return;h(e.message)}}function wt(){if(!d.lastGaps)return;let t=[...d.lastGaps.artists||[]];if(!t.length){v('<div class="empty">Geen collectiegaten gevonden \u2014 je hebt alles al! \u{1F389}</div>'),document.getElementById("badge-gaps").textContent="0";return}d.gapsSort==="missing"&&t.sort((i,s)=>s.missingAlbums.length-i.missingAlbums.length),d.gapsSort==="name"&&t.sort((i,s)=>i.name.localeCompare(s.name));let e=t.reduce((i,s)=>i+s.missingAlbums.length,0);document.getElementById("badge-gaps").textContent=e;let a=`<div class="section-title">${e} ontbrekende albums bij ${t.length} artiesten die je al hebt</div>`;for(let i of t){let s=Math.round(i.ownedCount/i.totalCount*100),c=[D(i.country),i.country,i.startYear].filter(Boolean).join(" \xB7 "),b=f(i.image,56)||i.image,r=b?`<img class="gaps-photo" src="${n(b)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="gaps-photo-ph" style="display:none;background:${m(i.name)}">${p(i.name)}</div>`:`<div class="gaps-photo-ph" style="background:${m(i.name)}">${p(i.name)}</div>`;a+=`
      <div class="gaps-block">
        <div class="gaps-header">
          ${r}
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
              <div class="gaps-artist-name artist-link" data-artist="${n(i.name)}">${n(i.name)}</div>
              ${N("artist",i.name,"",i.image||"")}
            </div>
            <div class="gaps-artist-meta">${n(c)}</div>
            ${O(i.tags,3)}
            <div style="height:8px"></div>
            <div class="comp-bar"><div class="comp-fill" style="width:${s}%"></div></div>
            <div class="comp-text">${i.ownedCount} van ${i.totalCount} albums in Plex
              &nbsp;\xB7&nbsp; <span style="color:var(--new);font-weight:600">${i.missingAlbums.length} ontbreken</span></div>
          </div>
        </div>
        <div class="gaps-sub">Ontbrekende albums</div>
        <div class="gaps-album-grid">`;for(let l of i.missingAlbums)a+=P(l,!1,i.name);a+="</div>",i.allAlbums?.filter(l=>l.inPlex).length>0&&(a+=`<details style="margin-top:12px">
        <summary style="font-size:11px;color:var(--muted2);cursor:pointer;user-select:none">
          \u25B8 ${i.ownedCount} albums die je al hebt
        </summary>
        <div class="gaps-album-grid" style="margin-top:10px">
          ${i.allAlbums.filter(l=>l.inPlex).map(l=>P(l,!1,i.name)).join("")}
        </div>
      </details>`),a+="</div>"}v(a)}export{Ht as buildPlexLibraryHtml,zt as handlePlexLibraryClick,Pt as loadBibliotheek,ft as loadGaps,Gt as loadLoved,Mt as loadPlexLibrary,ht as loadStats,mt as loadTopArtists,gt as loadTopTracks,wt as renderGaps,yt as renderStatsCharts,it as switchBibSubTab};
