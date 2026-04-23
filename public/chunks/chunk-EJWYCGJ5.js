import{a as M,g as D,h as E}from"./chunk-5VRNHLFG.js";import{A as m,B as p,D as w,E as f,T as P,X as S,a as v,e as A,f as I,g as y,h,i as $,j as i,l as x,m as k,p as T,q as L,s as H}from"./chunk-MZ4NN5XF.js";var b=null;function j(){b&&(clearInterval(b),b=null)}async function tt(){let e=document.getElementById("plex-np-wrap");if(e)try{let n=await fetch("/api/plex/nowplaying").then(t=>t.json());if(!e.isConnected)return;e.innerHTML=n.playing?`<div class="plex-np"><div class="plex-np-dot"></div><span class="plex-np-label">PLEX NU</span>
           <div class="card-info"><div class="card-title">${i(n.track)}</div>
           <div class="card-sub">${i(n.artist)}${n.album?" \xB7 "+i(n.album):""}</div></div></div>`:""}catch{e.isConnected&&(e.innerHTML="")}}function C(e){return{"nu-luisteren":"\u{1F3B6} Nu luisteren","recente-nummers":"\u{1F550} Recente nummers","nieuwe-releases":"\u{1F4BF} Nieuwe releases deze week","download-voortgang":"\u2B07 Download-voortgang","vandaag-cijfers":"\u{1F4CA} Vandaag in cijfers",aanbeveling:"\u2728 Aanbeveling van de dag","collectie-stats":"\u{1F4C0} Collectie-stats"}[e]||e}var z=["nu-luisteren","recente-nummers","nieuwe-releases","download-voortgang","vandaag-cijfers","aanbeveling","collectie-stats"];function B(){let e=null,n=[];try{e=JSON.parse(localStorage.getItem("dashWidgetOrder"))}catch{}try{n=JSON.parse(localStorage.getItem("dashWidgetHidden"))||[]}catch{}let r=(Array.isArray(e)&&e.length?e:z).filter(s=>z.includes(s)&&!n.includes(s)),l=z.map(s=>`<label class="dash-widget-label">
      <input type="checkbox" class="dash-widget-cb" data-widget="${i(s)}"${n.includes(s)?"":" checked"}>
      ${i(C(s))}
    </label>`).join(""),a=r.map(s=>`<div class="widget-card" id="widget-${i(s)}" data-widget="${i(s)}">
      <div class="widget-hdr"><span class="widget-title">${i(C(s))}</span></div>
      <div class="widget-body" id="wbody-${i(s)}">
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
    <div class="widget-grid" id="widget-grid">${a}</div>`;v.sectionContainerEl=null,A.innerHTML=o,requestAnimationFrame(()=>{Promise.allSettled([N(),_(),O(),R(),V(),G(),q()]),document.getElementById("dash-customize-btn")?.addEventListener("click",()=>{let s=document.getElementById("dash-customize-panel");s&&(s.style.display=s.style.display==="none"?"":"none")}),document.querySelectorAll(".dash-widget-cb").forEach(s=>{s.addEventListener("change",()=>{let d=[];document.querySelectorAll(".dash-widget-cb").forEach(c=>{c.checked||d.push(c.dataset.widget)}),localStorage.setItem("dashWidgetHidden",JSON.stringify(d)),B()})})})}function g(e,n){let t=document.getElementById("wbody-"+e);t&&(t.innerHTML=`<div class="widget-error">\u26A0 ${i(n||"Niet beschikbaar")}</div>`)}async function N(){let e=document.getElementById("wbody-nu-luisteren");if(!e||v.activeView!=="nu")return;let n=v.tabAbort?.signal;try{let t=m("recent",6e4),r=t!==null,[l,a]=await Promise.allSettled([fetch("/api/plex/nowplaying",{signal:n}).then(s=>s.json()),r?Promise.resolve(t):w("/api/recent")]);if(n?.aborted)return;!r&&a.status==="fulfilled"&&p("recent",a.value);let o="";if(l.status==="fulfilled"&&l.value?.playing){let s=l.value,d=!!M(),c=s.ratingKey||"";o+=`<div class="w-np-row">
        <div class="w-np-dot plex"></div>
        <div class="w-np-info">
          <div class="w-np-title">${i(s.track)}</div>
          <div class="w-np-sub">${i(s.artist)}${s.album?" \xB7 "+i(s.album):""}</div>
          <span class="badge plex" style="font-size:10px">\u25B6 Plex</span>
        </div>
        ${d?`<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="prev" title="Vorige">\u23EE</button>
          <button class="plex-ctrl-btn" data-plex-action="pause" title="Pauze/Hervat">\u23F8</button>
          <button class="plex-ctrl-btn" data-plex-action="next" title="Volgende">\u23ED</button>
        </div>`:`<div class="w-np-controls">
          <button class="plex-ctrl-btn" data-plex-action="zone" title="Selecteer zone">\u{1F50A}</button>
        </div>`}
      </div>`}if(a.status==="fulfilled"){let d=(a.value.recenttracks?.track||[]).find(c=>c["@attr"]?.nowplaying);if(d){let c=d.artist?.["#text"]||"",u=y(d.image,"medium");o+=`<div class="w-np-row">
          <div class="w-np-dot lfm"></div>
          ${u?`<img class="w-np-img" src="${i(u)}" alt="" loading="lazy">`:""}
          <div class="w-np-info">
            <div class="w-np-title">${i(d.name)}</div>
            <div class="w-np-sub artist-link" data-artist="${i(c)}">${i(c)}</div>
            <span class="badge" style="background:var(--red);color:#fff;font-size:10px">\u25CF Last.fm</span>
          </div>
        </div>`}}e.innerHTML=o||'<div class="empty" style="font-size:12px;padding:8px 0">Niets aan het afspelen</div>',e.querySelectorAll("[data-plex-action]").forEach(s=>{s.addEventListener("click",async()=>{let d=s.dataset.plexAction;if(d==="pause")D();else if(d==="next")E("next");else if(d==="prev")E("prev");else if(d==="zone"){let{toggleZonePicker:c}=await import("./plexRemote-5WHTXVL3.js");c()}})})}catch(t){if(t.name==="AbortError")return;g("nu-luisteren",t.message)}}async function _(){let e=document.getElementById("wbody-recente-nummers");if(!e)return;let n=v.tabAbort?.signal;try{let t=m("recent",6e4);if(!t){if(t=await w("/api/recent"),n?.aborted)return;p("recent",t)}let r=(t.recenttracks?.track||[]).filter(l=>!l["@attr"]?.nowplaying).slice(0,8);if(!r.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen recente nummers</div>';return}e.innerHTML=`<div class="w-track-list">${r.map(l=>{let a=l.artist?.["#text"]||"",o=l.date?.uts?x(parseInt(l.date.uts)):"";return`<div class="w-track-row">
        <div class="w-track-info">
          <div class="w-track-title">${i(l.name)}</div>
          <div class="w-track-artist artist-link" data-artist="${i(a)}">${i(a)}</div>
        </div>
        <span class="w-track-ago">${o}</span>
      </div>`}).join("")}</div>`}catch(t){if(t.name==="AbortError")return;g("recente-nummers",t.message)}}async function O(){let e=document.getElementById("wbody-nieuwe-releases");if(!e)return;let n=v.tabAbort?.signal;try{let t=v.lastReleases;if(!t){let a=await f("/api/releases",{signal:n});if(n?.aborted)return;if(a.status==="building"){e.innerHTML='<div class="empty" style="font-size:12px">Releases worden geladen\u2026</div>';return}t=a.releases||[]}let r=Date.now()-168*3600*1e3,l=t.filter(a=>a.releaseDate&&new Date(a.releaseDate).getTime()>r).sort((a,o)=>(o.artistPlaycount||0)-(a.artistPlaycount||0)).slice(0,3);if(!l.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen releases deze week</div>';return}e.innerHTML=`<div class="w-releases-list">${l.map(a=>`<div class="w-rel-row">
        <div class="w-rel-cover">${a.image?`<img class="w-rel-img" src="${i(a.image)}" alt="" loading="lazy" onerror="this.style.display='none'">`:`<div class="w-rel-ph" style="background:${k(a.album)}">${h(a.album)}</div>`}</div>
        <div class="w-rel-info">
          <div class="w-rel-title">${i(a.album)}</div>
          <div class="w-rel-artist artist-link" data-artist="${i(a.artist)}">${i(a.artist)}</div>
        </div>
        ${H(a.artist,a.album,a.inPlex)}
      </div>`).join("")}</div>`}catch(t){if(t.name==="AbortError")return;g("nieuwe-releases",t.message)}}async function R(){let e=document.getElementById("wbody-download-voortgang");if(!e)return;if(!v.tidarrOk){e.innerHTML='<div class="widget-error">\u26A0 Tidarr offline</div>';return}let n=v.tabAbort?.signal;try{let t=await f("/api/tidarr/queue",{signal:n});if(n?.aborted)return;let r=(t.items||v.tidarrQueueItems||[]).filter(l=>l.status!=="finished"&&l.status!=="error");P(e,r)}catch(t){if(t.name==="AbortError")return;g("download-voortgang","Tidarr niet bereikbaar")}}async function V(){let e=document.getElementById("wbody-vandaag-cijfers");if(!e)return;let n=v.tabAbort?.signal;try{let t=m("recent",6e4);if(!t){if(t=await w("/api/recent"),n?.aborted)return;p("recent",t)}let r=t.recenttracks?.track||[],l=new Date().toDateString(),a=r.filter(c=>c.date?.uts&&new Date(parseInt(c.date.uts)*1e3).toDateString()===l),o=new Set(a.map(c=>c.artist?.["#text"])).size,s={};for(let c of a){let u=c.artist?.["#text"]||"";s[u]=(s[u]||0)+1}let d=Object.entries(s).sort((c,u)=>u[1]-c[1])[0];e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${a.length}</div>
        <div class="w-stat-lbl">scrobbles</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${o}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      ${d?`<div class="w-stat-block w-stat-wide">
        <div class="w-stat-val" style="font-size:13px;line-height:1.3">${i(d[0])}</div>
        <div class="w-stat-lbl">meest gespeeld (${d[1]}\xD7)</div>
      </div>`:""}
    </div>`}catch(t){if(t.name==="AbortError")return;g("vandaag-cijfers",t.message)}}async function G(){let e=document.getElementById("wbody-aanbeveling");if(!e)return;let n=v.tabAbort?.signal;try{let t=m("recs",3e5);if(!t){if(t=await w("/api/recs"),n?.aborted)return;p("recs",t)}let r=t.recommendations||[];if(v.lastRecs=t,!r.length){e.innerHTML='<div class="empty" style="font-size:12px">Geen aanbevelingen</div>';return}let l=Math.floor(Date.now()/864e5),a=r[l%r.length],o=null;try{o=await f(`/api/artist/${encodeURIComponent(a.name)}/info`,{signal:n})}catch{}let s=o?.image?I(o.image,80)||o.image:null,d=(o?.albums||[]).slice(0,3);e.innerHTML=`<div class="w-rec-wrap">
      <div class="w-rec-top">
        ${s?`<img class="w-rec-img" src="${i(s)}" alt="" loading="lazy">`:`<div class="w-rec-ph" style="background:${k(a.name)}">${h(a.name)}</div>`}
        <div class="w-rec-info">
          <div class="w-rec-name artist-link" data-artist="${i(a.name)}">${i(a.name)}</div>
          <div class="w-rec-reason">Vergelijkbaar met ${i(a.reason)}</div>
          ${T(a.inPlex)}
          ${L("artist",a.name,"",o?.image||"")}
        </div>
      </div>
      ${d.length?`<div class="w-rec-albums">${d.map(c=>`<span class="w-rec-album">${i(c.name)}</span>`).join("")}</div>`:""}
    </div>`}catch(t){if(t.name==="AbortError")return;g("aanbeveling",t.message)}}async function q(){let e=document.getElementById("wbody-collectie-stats");if(!e)return;let n=v.tabAbort?.signal;try{let t=await f("/api/plex/status",{signal:n});if(n?.aborted)return;if(!t.connected){e.innerHTML='<div class="empty" style="font-size:12px">Plex offline</div>';return}let r=0;v.lastGaps?.artists&&(r=v.lastGaps.artists.reduce((l,a)=>l+(a.missingCount||0),0)),e.innerHTML=`<div class="w-stats-grid">
      <div class="w-stat-block">
        <div class="w-stat-val">${$(t.artists||0)}</div>
        <div class="w-stat-lbl">artiesten</div>
      </div>
      <div class="w-stat-block">
        <div class="w-stat-val">${$(t.albums||0)}</div>
        <div class="w-stat-lbl">albums</div>
      </div>
      ${r?`<div class="w-stat-block">
        <div class="w-stat-val">${r}</div>
        <div class="w-stat-lbl">ontbreekt</div>
      </div>`:""}
    </div>`}catch(t){if(t.name==="AbortError")return;g("collectie-stats",t.message)}}async function et(){let e=v.tabAbort?.signal;try{let n=m("recent",6e4);if(!n){if(n=await f("/api/recent",{signal:e}),e?.aborted)return;p("recent",n)}let t=n.recenttracks?.track||[];if(!t.length){setContent('<div class="empty">Geen recente nummers.</div>');return}let r='<div class="card-list">';for(let l of t){let a=l["@attr"]?.nowplaying,o=l.date?.uts?x(parseInt(l.date.uts)):"",s=l.artist?.["#text"]||"",d=y(l.image),c=d?`<img class="card-img" src="${i(d)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="card-ph" style="display:none">\u266A</div>`:'<div class="card-ph">\u266A</div>';a?r+=`<div class="now-playing">${c}<div class="np-dot"></div>
          <span class="np-label">NU</span>
          <div class="card-info"><div class="card-title">${i(l.name)}</div>
          <div class="card-sub artist-link" data-artist="${i(s)}">${i(s)}</div></div></div>`:r+=`<div class="card">${c}<div class="card-info">
          <div class="card-title">${i(l.name)}</div>
          <div class="card-sub artist-link" data-artist="${i(s)}">${i(s)}</div>
          </div><div class="card-meta">${o}</div>
          <button class="play-btn" data-artist="${i(s)}" data-track="${i(l.name)}" title="Preview afspelen">\u25B6</button>
          <div class="play-bar"><div class="play-bar-fill"></div></div></div>`}setContent(r+"</div>")}catch(n){if(n.name==="AbortError")return;setContent(`<div class="error-box">\u26A0\uFE0F ${i(n.message)}</div>`)}}function at(){v.activeView="nu",S(),j(),B(),setTimeout(()=>{v.activeView==="nu"&&(b=setInterval(()=>{if(v.activeView!=="nu"){j();return}N()},3e4))},500)}export{j as a,tt as b,B as c,N as d,R as e,et as f,at as g};
