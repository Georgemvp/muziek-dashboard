import{i as H,o as S,p as E}from"./chunk-C6ZPWJ3O.js";import{l as M,p as D}from"./chunk-QX5AHETD.js";import{A as f,a as v,d as A,e as I,f as y,g as h,h as $,i as a,j as x,k,n as T,o as L,r as P,w as g,x as p,z as w}from"./chunk-GHKYA3ZE.js";var b=null;function j(){b&&(clearInterval(b),b=null)}async function te(){let s=document.getElementById("plex-np-wrap");if(s)try{let n=await fetch("/api/plex/nowplaying").then(e=>e.json());if(!s.isConnected)return;s.innerHTML=n.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${a(n.track)}</div>
           <div class="card-sub">${a(n.artist)}${n.album?" \xB7 "+a(n.album):""}</div></div></div>`:""}catch{s.isConnected&&(s.innerHTML="")}}function C(s){return{"nu-luisteren":"\u{1F3B6} Nu luisteren","recente-nummers":"\u{1F550} Recente nummers","nieuwe-releases":"\u{1F4BF} Nieuwe releases deze week","download-voortgang":"\u2B07 Download-voortgang","vandaag-cijfers":"\u{1F4CA} Vandaag in cijfers",aanbeveling:"\u2728 Aanbeveling van de dag","collectie-stats":"\u{1F4C0} Collectie-stats"}[s]||s}var z=["nu-luisteren","recente-nummers","nieuwe-releases","download-voortgang","vandaag-cijfers","aanbeveling","collectie-stats"];function B(){let s=null,n=[];try{s=JSON.parse(localStorage.getItem("dashWidgetOrder"))}catch{}try{n=JSON.parse(localStorage.getItem("dashWidgetHidden"))||[]}catch{}let d=(Array.isArray(s)&&s.length?s:z).filter(i=>z.includes(i)&&!n.includes(i)),l=z.map(i=>`<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${a(i)}"${n.includes(i)?"":" checked"}>
      ${a(C(i))}
    </label>`).join(""),t=d.map(i=>`<div class="widget-card" id="widget-${a(i)}" data-widget="${a(i)}">
      <div class="widget-hdr"><span class="widget-title">${a(C(i))}</span></div>
      <div class="widget-body" id="wbody-${a(i)}">
        <div class="loading" style="padding:12px 0"><div class="spinner"></div></div>
      </div>
    </div>`).join(""),o=`
    <div class="dashboard-topbar">
      <span class="dashboard-heading">\u{1F3B5} Nu</span>
      <button class="dash-customize-btn" id="dash-customize-btn">\u2726 Pas aan</button>
    </div>
    <div class="dash-customize-panel" id="dash-customize-panel" style="display:none">
      <div class="dash-customize-title">Widgets tonen/verbergen</div>
      <div class="dash-widget-checkboxes">${l}</div>
    </div>
    <div class="widget-grid" id="widget-grid">${t}</div>`;v.sectionContainerEl=null,A.innerHTML=o,requestAnimationFrame(()=>{Promise.allSettled([N(),R(),O(),V(),G(),q(),W()]),document.getElementById("dash-customize-btn")?.addEventListener("click",()=>{let i=document.getElementById("dash-customize-panel");i&&(i.style.display=i.style.display==="none"?"":"none")}),document.querySelectorAll(".dash-widget-cb").forEach(i=>{i.addEventListener("change",()=>{let c=[];document.querySelectorAll(".dash-widget-cb").forEach(r=>{r.checked||c.push(r.dataset.widget)}),localStorage.setItem("dashWidgetHidden",JSON.stringify(c)),B()})})})}function m(s,n){let e=document.getElementById("wbody-"+s);e&&(e.innerHTML=`<div class="widget-error">\u26A0 ${a(n||"Niet beschikbaar")}</div>`)}async function N(){let s=document.getElementById("wbody-nu-luisteren");if(!s||v.activeView!=="nu")return;let n=v.tabAbort?.signal;try{let e=g("recent",6e4),d=e!==null,[l,t]=await Promise.allSettled([fetch("/api/plex/nowplaying",{signal:n}).then(i=>i.json()),d?Promise.resolve(e):w("/api/recent")]);if(n?.aborted)return;!d&&t.status==="fulfilled"&&p("recent",t.value);let o="";if(l.status==="fulfilled"&&l.value?.playing){let i=l.value,c=!!H(),r=i.ratingKey||"";o+=`<div class="w-np-row">
        <div class="w-np-dot plex"></div>
        <div class="w-np-info">
          <div class="w-np-title">${a(i.track)}</div>
          <div class="w-np-sub">${a(i.artist)}${i.album?" \xB7 "+a(i.album):""}</div>
          <span class="badge plex" style="font-size:10px">\u25B6 Plex</span>
        </div>
        ${c?`<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="prev" title="Vorige">\u23EE</button>
          <button class="plex-ctrl-btn" data-plex-action="pause" title="Pauze/Hervat">\u23F8</button>
          <button class="plex-ctrl-btn" data-plex-action="next" title="Volgende">\u23ED</button>
        </div>`:`<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="zone" title="Selecteer zone">\u{1F50A}</button>
        </div>`}
      </div>`}if(t.status==="fulfilled"){let c=(t.value.recenttracks?.track||[]).find(r=>r["@attr"]?.nowplaying);if(c){let r=c.artist?.["#text"]||"",u=y(c.image,"medium");o+=`<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${u?`<img class="w-np-img" src="${a(u)}" alt="${a(c.name)} by ${a(r)}" loading="lazy" decoding="async" width="48" height="48">`:""}
          <div class="w-np-info">
            <div class="w-np-title">${a(c.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${a(r)}">${a(r)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">\u25CF Last.fm</span>
          </div>
        </div>`}}s.innerHTML=o||'<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>',s.querySelectorAll("[data-plex-action]").forEach(i=>{i.addEventListener("click",async()=>{let c=i.dataset.plexAction;if(c==="pause")S();else if(c==="next")E("next");else if(c==="prev")E("prev");else if(c==="zone"){let{toggleZonePicker:r}=await import("./plexRemote-4B76C6KE.js");r()}})})}catch(e){if(e.name==="AbortError")return;m("nu-luisteren",e.message)}}async function R(){let s=document.getElementById("wbody-recente-nummers");if(!s)return;let n=v.tabAbort?.signal;try{let e=g("recent",6e4);if(!e){if(e=await w("/api/recent"),n?.aborted)return;p("recent",e)}let d=(e.recenttracks?.track||[]).filter(l=>!l["@attr"]?.nowplaying).slice(0,8);if(!d.length){s.innerHTML='<div class="empty" style="font-size:12px">Geen recente nummers</div>';return}s.innerHTML=`<div class="w-track-list">${d.map(l=>{let t=l.artist?.["#text"]||"",o=l.date?.uts?x(parseInt(l.date.uts)):"";return`<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${a(l.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${a(t)}">${a(t)}</div>
        </div>
        <span class="w-track-ago">${o}</span>
      </div>`}).join("")}</div>`}catch(e){if(e.name==="AbortError")return;m("recente-nummers",e.message)}}async function O(){let s=document.getElementById("wbody-nieuwe-releases");if(!s)return;let n=v.tabAbort?.signal;try{let e=v.lastReleases;if(!e){let t=await f("/api/releases",{signal:n});if(n?.aborted)return;if(t.status==="building"){s.innerHTML='<div class="empty" style="font-size:12px">Releases worden geladen\u2026</div>';return}e=t.releases||[]}let d=Date.now()-168*3600*1e3,l=e.filter(t=>t.releaseDate&&new Date(t.releaseDate).getTime()>d).sort((t,o)=>(o.artistPlaycount||0)-(t.artistPlaycount||0)).slice(0,3);if(!l.length){s.innerHTML='<div class="empty" style="font-size:12px">Geen releases deze week</div>';return}s.innerHTML=`<div class="w-releases-list">${l.map(t=>`<div class="w-rel-row">
        <div class="w-rel-cover">${t.image?`<img class="w-rel-img" src="${a(t.image)}" alt="${a(t.album)} by ${a(t.artist)}" loading="lazy" decoding="async" onerror="this.style.display='none'">`:`<div class="w-rel-ph" style="background:${k(t.album)}">${h(t.album)}</div>`}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${a(t.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${a(t.artist)}">${a(t.artist)}</div>
        </div>
        ${P(t.artist,t.album,t.inPlex)}
      </div>`).join("")}</div>`}catch(e){if(e.name==="AbortError")return;m("nieuwe-releases",e.message)}}async function V(){let s=document.getElementById("wbody-download-voortgang");if(!s)return;if(!v.tidarrOk){s.innerHTML='<div class="widget-error">\u26A0 Tidarr offline</div>';return}let n=v.tabAbort?.signal;try{let e=await f("/api/tidarr/queue",{signal:n});if(n?.aborted)return;let d=(e.items||v.tidarrQueueItems||[]).filter(l=>l.status!=="finished"&&l.status!=="error");M(s,d)}catch(e){if(e.name==="AbortError")return;m("download-voortgang","Tidarr niet bereikbaar")}}async function G(){let s=document.getElementById("wbody-vandaag-cijfers");if(!s)return;let n=v.tabAbort?.signal;try{let e=g("recent",6e4);if(!e){if(e=await w("/api/recent"),n?.aborted)return;p("recent",e)}let d=e.recenttracks?.track||[],l=new Date().toDateString(),t=d.filter(r=>r.date?.uts&&new Date(parseInt(r.date.uts)*1e3).toDateString()===l),o=new Set(t.map(r=>r.artist?.["#text"])).size,i={};for(let r of t){let u=r.artist?.["#text"]||"";i[u]=(i[u]||0)+1}let c=Object.entries(i).sort((r,u)=>u[1]-r[1])[0];s.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${t.length}</div>
        <div class="w-stat-lbl">scrobbles</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${o}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      ${c?`<div class="w-stat-block w-stat-wide">
        <div class="w-stat-val" style="font-size:13px;line-height:1.3">${a(c[0])}</div>
        <div class="w-stat-lbl">meest gespeeld (${c[1]}\xD7)</div>
      </div>`:""}
    </div>`}catch(e){if(e.name==="AbortError")return;m("vandaag-cijfers",e.message)}}async function q(){let s=document.getElementById("wbody-aanbeveling");if(!s)return;let n=v.tabAbort?.signal;try{let e=g("recs",3e5);if(!e){if(e=await w("/api/recs"),n?.aborted)return;p("recs",e)}let d=e.recommendations||[];if(v.lastRecs=e,!d.length){s.innerHTML='<div class="empty" style="font-size:12px">Geen aanbevelingen</div>';return}let l=Math.floor(Date.now()/864e5),t=d[l%d.length],o=null;try{o=await Promise.race([f(`/api/artist/${encodeURIComponent(t.name)}/info`,{signal:n}),new Promise((u,_)=>setTimeout(()=>_(new Error("timeout")),2e3))])}catch{}let i=o?.image?I(o.image,80)||o.image:null,c=(o?.albums||[]).slice(0,3);s.innerHTML=`<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${i?`<img class="w-rec-img" src="${a(i)}" alt="${a(t.name)}" loading="lazy" decoding="async">`:`<div class="w-rec-ph" style="background:${k(t.name)}">${h(t.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${a(t.name)}">${a(t.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${a(t.reason)}</div>
          ${T(t.inPlex)}
          ${L("artist",t.name,"",o?.image||"")}
        </div>
      </div>
      ${c.length?`<div class="w-rec-albums">${c.map(r=>`<span class="w-rec-album">${a(r.name)}</span>`).join("")}</div>`:""}
    </div>`}catch(e){if(e.name==="AbortError")return;m("aanbeveling",e.message)}}async function W(){let s=document.getElementById("wbody-collectie-stats");if(!s)return;let n=v.tabAbort?.signal;try{let e=await f("/api/plex/status",{signal:n});if(n?.aborted)return;if(!e.connected){s.innerHTML='<div class="empty" style="font-size:12px">Plex offline</div>';return}let d=0;v.lastGaps?.artists&&(d=v.lastGaps.artists.reduce((l,t)=>l+(t.missingCount||0),0)),s.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${$(e.artists||0)}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${$(e.albums||0)}</div>
        <div class="w-stat-lbl">albums</div>
      </div>
      ${d?`<div class="w-stat-block">
        <div class="w-stat-val">${d}</div>
        <div class="w-stat-lbl">ontbreekt</div>
      </div>`:""}
    </div>`}catch(e){if(e.name==="AbortError")return;m("collectie-stats",e.message)}}async function ae(){let s=v.tabAbort?.signal;try{let n=g("recent",6e4);if(!n){if(n=await f("/api/recent",{signal:s}),s?.aborted)return;p("recent",n)}let e=n.recenttracks?.track||[];if(!e.length){setContent('<div class="empty">Geen recente nummers.</div>');return}let d='<div class="card-list">';for(let l of e){let t=l["@attr"]?.nowplaying,o=l.date?.uts?x(parseInt(l.date.uts)):"",i=l.artist?.["#text"]||"",c=y(l.image),r=c?`<img class="card-img" src="${a(c)}" alt="${a(l.name)} by ${a(i)}" loading="lazy" decoding="async" width="56" height="56" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>';t?d+=`<div class="now-playing">${r}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${a(l.name)}</div>
          <div class="card-sub artist-link" data-artist="${a(i)}">${a(i)}</div></div></div>`:d+=`<div class="card">${r}<div class="card-info">
          <div class="card-title">${a(l.name)}</div>
          <div class="card-sub artist-link" data-artist="${a(i)}">${a(i)}</div>
          </div><div class="card-meta">${o}</div>
          <button class="play-btn" data-artist="${a(i)}" data-track="${a(l.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}setContent(d+"</div>")}catch(n){if(n.name==="AbortError")return;setContent(`<div class="error-box">\u26A0\uFE0F ${a(n.message)}</div>`)}}function se(){v.activeView="nu",D(),j(),B(),setTimeout(()=>{v.activeView==="nu"&&(b=setInterval(()=>{if(v.activeView!=="nu"){j();return}N()},3e4))},500)}export{j as a,te as b,B as c,N as d,V as e,ae as f,se as g};
