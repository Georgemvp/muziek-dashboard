import{a as P}from"./chunk-JLD3JF2U.js";import{d as M,g as H,h as s,z as g}from"./chunk-HCN2ZK5I.js";import{a as b}from"./chunk-2BMKGNH5.js";function N(e){if(!e)return"\u2014";let t=Math.floor(e/1e3);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function Q(e){return e?`${Math.round(e/6e4)} min`:""}function R(e){if(!e)return"";let t=Date.now()/1e3-e;return t<3600?`${Math.floor(t/60)}m geleden`:t<86400?`${Math.floor(t/3600)}u geleden`:`${Math.floor(t/86400)}d geleden`}var X={spring:"Lente",summer:"Zomer",autumn:"Herfst",winter:"Winter",halloween:"Halloween",christmas:"Kerstmis",valentines:"Valentijnsdag"},U={spring:"\u{1F338}",summer:"\u2600\uFE0F",autumn:"\u{1F342}",winter:"\u2744\uFE0F",halloween:"\u{1F383}",christmas:"\u{1F384}",valentines:"\u2764\uFE0F"},V={discovery_weekly:"\u{1F52D}",release_radar:"\u{1F4E1}",daily_mix:"\u{1F3AF}",forgotten_favorites:"\u{1F570}\uFE0F",hidden_gems:"\u{1F48E}",decade:"\u{1F4C5}",seasonal:"\u{1F338}",genre:"\u{1F3B8}",custom:"\u2728"};function ee(e){return e&&e.charAt(0).toUpperCase()+e.slice(1)}function F(e){if(!e?.length)return'<div class="dpl-ph"><span>\u{1F3B5}</span></div>';let t=[],n=new Set;for(let i of e)if(i.cover_url&&!n.has(i.cover_url)&&(n.add(i.cover_url),t.push(i.cover_url)),t.length>=4)break;if(!t.length)return'<div class="dpl-ph"><span>\u{1F3B5}</span></div>';if(t.length===1)return`<img class="dpl-single" src="${s(t[0])}" alt="" loading="lazy">`;for(;t.length<4;)t.push(t[t.length-1]);return`<div class="dpl-collage">${t.map(i=>`<img src="${s(i)}" alt="" loading="lazy" onerror="this.style.opacity=0">`).join("")}</div>`}var f=[],J=[],_=null,x=new Set,E=null;function O(e,t){let n=e.track_count||0,i=e.params?.season?U[e.params.season]||"\u{1F3B5}":V[e.type]||"\u{1F3B5}",c=e.type+JSON.stringify(e.params||null),m=e.cached&&e.tracks?F(e.tracks):`<div class="dpl-ph"><span>${i}</span></div>`,d=e.cached&&n>0?`<button class="dpl-play-btn" data-type="${s(e.type)}" data-params="${s(JSON.stringify(e.params||null))}" title="Speel af">\u25B6</button>`:"";return`<div class="dpl-card ${t?"is-gen":""} ${e.cached?"is-cached":""}"
    data-type="${s(e.type)}" data-params="${s(JSON.stringify(e.params||null))}" data-key="${s(c)}">
    <div class="dpl-thumb" role="button" tabindex="0">${m}${d}</div>
    <div class="dpl-body">
      <div class="dpl-name">${s(e.name)}</div>
      <div class="dpl-meta">
        ${e.cached?`<span class="dpl-badge dpl-ok">${n} tracks</span>`:'<span class="dpl-badge dpl-none">Niet gegenereerd</span>'}
        ${e.generated_at?`<span class="dpl-age">${R(e.generated_at)}</span>`:""}
      </div>
    </div>
    <div class="dpl-actions">
      <button class="dpl-btn dpl-gen-btn" data-type="${s(e.type)}"
        data-params="${s(JSON.stringify(e.params||null))}" title="Genereer opnieuw">
        ${t?'<span class="dpl-spin"></span>':"\u21BA"}
      </button>
    </div>
  </div>`}function C(e,t){j();let n=e.type==="discovery_weekly"||e.type==="release_radar",i=t.map((d,o)=>{let r=N(d.duration),l=d.cover_url?`<img src="${s(d.cover_url)}" alt="" loading="lazy" onerror="this.style.opacity=0">`:'<div class="dpl-tph">\u266A</div>',p=d.plex_key?`<button class="dpl-tplay" data-key="${s(d.plex_key)}">\u25B6</button>`:'<span class="dpl-disc">Ontdek</span>',$=d.reason?`<span class="dpl-reason">via ${s(d.reason)}</span>`:"";return`<div class="dpl-trow">
      <span class="dpl-tnum">${o+1}</span>
      <div class="dpl-tcover">${l}</div>
      <div class="dpl-tinfo">
        <div class="dpl-ttitle">${s(d.title||d.album||"\u2014")}</div>
        <div class="dpl-tsub">${s(d.artist)}${d.album?` \xB7 ${s(d.album)}`:""}${$}</div>
      </div>
      <span class="dpl-tdur">${r}</span>
      <div class="dpl-tact">${p}</div>
    </div>`}).join(""),c=n?"":`<button class="dpl-btn dpl-primary" id="dpl-play-all"
        data-type="${s(e.type)}" data-params="${s(JSON.stringify(e.params||null))}">\u25B6 Speel Alles</button>`;document.body.insertAdjacentHTML("beforeend",`
    <div class="dpl-backdrop" id="dpl-backdrop">
      <div class="dpl-modal" role="dialog">
        <div class="dpl-mhdr">
          <h2 class="dpl-mtitle">${s(e.name)}</h2>
          <div class="dpl-macts">
            ${c}
            <button class="dpl-btn" id="dpl-shuffle">\u21CC Shuffle</button>
            <button class="dpl-mclose" id="dpl-mclose" aria-label="Sluiten">\u2715</button>
          </div>
        </div>
        <div class="dpl-mbody" id="dpl-mbody">
          <div class="dpl-tcount">${t.length} tracks</div>
          <div class="dpl-tlist" id="dpl-tlist">${i}</div>
        </div>
      </div>
    </div>`),E=document.getElementById("dpl-backdrop"),E.addEventListener("click",d=>{d.target===E&&j()}),document.getElementById("dpl-mclose").addEventListener("click",j);let m=d=>{d.key==="Escape"&&(j(),document.removeEventListener("keydown",m))};document.addEventListener("keydown",m),document.getElementById("dpl-play-all")?.addEventListener("click",()=>B(e.type,e.params)),document.getElementById("dpl-shuffle")?.addEventListener("click",()=>{let d=[...t].sort(()=>Math.random()-.5);document.getElementById("dpl-tlist").innerHTML=d.map((o,r)=>{let l=N(o.duration),p=o.cover_url?`<img src="${s(o.cover_url)}" alt="" loading="lazy">`:'<div class="dpl-tph">\u266A</div>',$=o.plex_key?`<button class="dpl-tplay" data-key="${s(o.plex_key)}">\u25B6</button>`:'<span class="dpl-disc">Ontdek</span>',a=o.reason?`<span class="dpl-reason">via ${s(o.reason)}</span>`:"";return`<div class="dpl-trow"><span class="dpl-tnum">${r+1}</span>
        <div class="dpl-tcover">${p}</div>
        <div class="dpl-tinfo"><div class="dpl-ttitle">${s(o.title||o.album||"\u2014")}</div>
        <div class="dpl-tsub">${s(o.artist)}${o.album?` \xB7 ${s(o.album)}`:""}${a}</div></div>
        <span class="dpl-tdur">${l}</span><div class="dpl-tact">${$}</div></div>`}).join(""),q()}),q()}function q(){document.querySelectorAll(".dpl-tplay").forEach(e=>{e.addEventListener("click",()=>te(e.dataset.key,e))})}function j(){E&&(E.remove(),E=null)}async function K(){let e=localStorage.getItem("plex_machine_id");if(e)return e;try{let t=await g("/api/plex/clients"),n=Array.isArray(t)?t:t.clients||[];if(n.length)return localStorage.setItem("plex_machine_id",n[0].machineId),n[0].machineId}catch{}return null}async function te(e,t){let n=await K();if(!n){alert("Geen actieve Plex-speler gevonden.");return}try{t?.classList.add("loading"),await g(`/api/plex/play?machineId=${encodeURIComponent(n)}&ratingKey=${encodeURIComponent(e)}`,{method:"POST"}),t?.classList.remove("loading"),t?.classList.add("played"),setTimeout(()=>t?.classList.remove("played"),3e3)}catch(i){t?.classList.remove("loading"),alert(`Afspelen mislukt: ${i.message}`)}}async function B(e,t){let n=await K();if(!n){alert("Geen actieve Plex-speler gevonden.");return}try{let i=t?Object.entries(t).map(([c,m])=>`${c}=${encodeURIComponent(m)}`).join("&"):"";await g(`/api/playlists/play/${e}?machineId=${encodeURIComponent(n)}${i?"&"+i:""}`,{method:"POST"})}catch(i){alert(`Afspelen mislukt: ${i.message}`)}}async function G(e,t,n){let i=e+JSON.stringify(t||null);if(x.has(i))return;x.add(i),n?.classList.add("is-gen");let c=n?.querySelector(".dpl-gen-btn");c&&(c.innerHTML='<span class="dpl-spin"></span>');try{let m=t?Object.entries(t).map(([r,l])=>`${r}=${encodeURIComponent(l)}`).join("&"):"",d=await g(`/api/playlists/generate/${e}?force=true${m?"&"+m:""}`),o=f.findIndex(r=>r.type===e&&JSON.stringify(r.params||null)===JSON.stringify(t||null));o>=0&&Object.assign(f[o],{cached:!0,track_count:d.track_count||d.tracks?.length||0,generated_at:d.generated_at,tracks:d.tracks}),ae(e,t,d)}catch(m){alert(`Generatie mislukt: ${m.message}`)}finally{x.delete(i),n?.classList.remove("is-gen"),c&&(c.innerHTML="\u21BA")}}function ae(e,t,n){let i=e+JSON.stringify(t||null),c=document.querySelector(`.dpl-card[data-key="${CSS.escape(i)}"]`);if(!c)return;let m=f.find(r=>r.type===e&&JSON.stringify(r.params||null)===JSON.stringify(t||null));if(!m)return;let d=document.createElement("div");d.innerHTML=O({...m,tracks:n.tracks},!1);let o=d.firstElementChild;c.replaceWith(o),Y(o)}function Y(e){e.querySelector(".dpl-thumb")?.addEventListener("click",async()=>{let t=e.dataset.type,n=JSON.parse(e.dataset.params||"null");if(!e.classList.contains("is-cached")){await G(t,n,e);return}try{let i=n?Object.entries(n).map(([d,o])=>`${d}=${encodeURIComponent(o)}`).join("&"):"",c=await g(`/api/playlists/generate/${t}${i?"?"+i:""}`),m=f.find(d=>d.type===t&&JSON.stringify(d.params||null)===JSON.stringify(n||null))||{type:t,name:t,params:n};C(m,c.tracks||[])}catch(i){alert(`Laden mislukt: ${i.message}`)}}),e.querySelector(".dpl-gen-btn")?.addEventListener("click",async t=>{t.stopPropagation(),await G(e.dataset.type,JSON.parse(e.dataset.params||"null"),e)}),e.querySelector(".dpl-play-btn")?.addEventListener("click",async t=>{t.stopPropagation(),await B(e.dataset.type,JSON.parse(e.dataset.params||"null"))})}var w=[];function re(){let e=document.getElementById("dpl-seed-input"),t=document.getElementById("dpl-seed-add"),n=document.getElementById("dpl-custom-gen"),i=document.getElementById("dpl-seeds"),c=document.getElementById("dpl-custom-result"),m=document.getElementById("dpl-artists-dl"),d=()=>{i.innerHTML=w.map((l,p)=>`<span class="dpl-stag">${s(l)}<button class="dpl-srem" data-i="${p}">\u2715</button></span>`).join(""),n.disabled=!w.length,i.querySelectorAll(".dpl-srem").forEach(l=>{l.addEventListener("click",()=>{w.splice(+l.dataset.i,1),d()})})},o=()=>{let l=e?.value.trim();!l||w.includes(l)||w.length>=5||(w.push(l),e&&(e.value=""),d())};t?.addEventListener("click",o),e?.addEventListener("keydown",l=>{l.key==="Enter"&&o()});let r;e?.addEventListener("input",()=>{clearTimeout(r);let l=e.value.trim();l.length<2||(r=setTimeout(async()=>{try{let $=((await g(`/api/plex/search?q=${encodeURIComponent(l)}`)).artists||[]).map(a=>a.title||a.name);m&&(m.innerHTML=$.map(a=>`<option value="${s(a)}">`).join(""))}catch{}},250))}),n?.addEventListener("click",async()=>{if(w.length){n.disabled=!0,n.textContent="Genereren\u2026",c.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Even geduld\u2026</div>';try{let p=(await g(`/api/playlists/generate/custom?force=true&seeds=${encodeURIComponent(w.join(","))}`)).tracks||[];p.length?(c.innerHTML=`<div class="dpl-cres">
          <strong>${p.length} tracks</strong> gevonden \u2014
          <button class="dpl-btn dpl-primary" id="dpl-open-custom">Bekijk \u2192</button>
        </div>`,document.getElementById("dpl-open-custom")?.addEventListener("click",()=>{C({type:"custom",name:`Mix: ${w.slice(0,2).join(", ")}`,params:{seeds:w}},p)})):c.innerHTML='<p class="dpl-empty">Geen tracks gevonden.</p>'}catch(l){c.innerHTML=`<p class="dpl-err">Fout: ${s(l.message)}</p>`}finally{n.disabled=!1,n.textContent="Genereer Mix"}}})}async function se(e){f=e.catalog||[],J=e.genres||[],_=e.current_season;let t=f.filter(a=>["discovery_weekly","release_radar"].includes(a.type)),n=f.filter(a=>["daily_mix","forgotten_favorites","hidden_gems"].includes(a.type)),i=f.filter(a=>a.type==="seasonal"),c=f.filter(a=>a.type==="decade"),m=i.find(a=>a.params?.season===_),d=i.filter(a=>a.params?.season!==_),o=J.slice(0,12),r=[];try{let a=await g("/api/plex/playlists",{signal:b.tabAbort?.signal});r=(a?.playlists||a||[]).slice(0,8)}catch{}let l=t.map(a=>{let u=a.type+JSON.stringify(a.params||null),v=x.has(u),y=V[a.type]||"\u{1F3B5}",h=a.cached&&a.tracks?F(a.tracks):`<div class="dpl-ph big"><span>${y}</span></div>`;return`<div class="dpl-hero-card ${v?"is-gen":""} ${a.cached?"is-cached":""}"
      data-type="${s(a.type)}" data-params="${s(JSON.stringify(a.params||null))}" data-key="${s(u)}">
      <div class="dpl-hero-bg">${h}</div>
      <div class="dpl-hero-cnt">
        <span class="dpl-hero-icon">${y}</span>
        <h2 class="dpl-hero-title">${s(a.name)}</h2>
        <p class="dpl-hero-desc">${s(a.description||"")}</p>
        <div class="dpl-hero-meta">
          ${a.cached?`<span class="dpl-badge dpl-ok">${a.track_count} tracks</span>`:'<span class="dpl-badge dpl-none">Nog niet gegenereerd</span>'}
          ${a.generated_at?`<span class="dpl-age">${R(a.generated_at)}</span>`:""}
        </div>
        <div class="dpl-hero-btns">
          ${a.cached&&a.track_count>0?`<button class="dpl-btn dpl-primary dpl-hero-play" data-type="${s(a.type)}" data-params="null">\u25B6 Speel Af</button>`:""}
          <button class="dpl-btn dpl-hero-gen" data-type="${s(a.type)}" data-params="${s(JSON.stringify(a.params||null))}">
            ${v?'<span class="dpl-spin"></span> Bezig\u2026':a.cached?"\u21BA Vernieuw":"\u26A1 Genereer"}
          </button>
        </div>
      </div>
    </div>`}).join(""),p=a=>a.map(u=>{let v=u.type+JSON.stringify(u.params||null);return O(u,x.has(v))}).join(""),$=r.length?`
    <section class="dpl-section">
      <h2 class="dpl-stitle">\u{1F4C2} Plex Afspeellijsten</h2>
      <div class="dpl-scroll-row">
        ${r.map(a=>{let u=a.thumb?M(a.thumb,200):null;return`<button class="dpl-plex-card" data-id="${s(a.ratingKey)}" data-title="${s(a.title)}" aria-label="${s(a.title)}">
            <div class="dpl-plex-art">${u?`<img src="${s(u)}" alt="" loading="lazy">`:'<div class="dpl-ph"><span>\u266B</span></div>'}</div>
            <div class="dpl-plex-name">${s(a.title)}</div>
            <div class="dpl-plex-meta">${a.trackCount||0} nrs${a.duration?" \xB7 "+Q(a.duration):""}</div>
          </button>`}).join("")}
      </div>
    </section>`:"";document.getElementById("content").innerHTML=`
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">\u{1F3B5} Discovery Engine</h1>
        <p class="dpl-page-sub">Gepersonaliseerde playlists op basis van jouw luisterdata + Plex-bibliotheek</p>
      </div>

      <section class="dpl-section dpl-hero-section">
        ${l}
      </section>

      <section class="dpl-section">
        <h2 class="dpl-stitle">Jouw Mix</h2>
        <div class="dpl-grid">${p(n)}</div>
      </section>

      ${m?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">${U[_]||"\u{1F338}"} Seizoen: ${X[_]||_}</h2>
        <div class="dpl-grid dpl-grid-1">${O(m,x.has(m.type+JSON.stringify(m.params)))}</div>
      </section>`:""}

      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F4C5} Per Decennium</h2>
        <div class="dpl-scroll-row">${p(c)}</div>
      </section>

      ${o.length?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F3B8} Genres</h2>
        <div class="dpl-scroll-row">
          ${o.map(a=>{let u={genre:a},v="genre"+JSON.stringify(u),y=f.find(k=>k.type==="genre"&&k.params?.genre===a),h={type:"genre",name:ee(a),description:`Jouw tracks in het ${a} genre`,params:u,cached:!!y?.cached,track_count:y?.track_count||0,generated_at:y?.generated_at||null,tracks:y?.tracks||null};return O(h,x.has(v))}).join("")}
        </div>
      </section>`:""}

      ${d.length?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F5D3}\uFE0F Andere Seizoenen</h2>
        <div class="dpl-scroll-row">${p(d)}</div>
      </section>`:""}

      ${$}

      <section class="dpl-section dpl-custom-wrap">
        <h2 class="dpl-stitle">\u2728 Aangepaste Playlist</h2>
        <p class="dpl-custom-hint">Vul 1\u20135 artiesten in als startpunt voor een persoonlijke mix.</p>
        <div class="dpl-custom-form">
          <div class="dpl-seeds" id="dpl-seeds"></div>
          <div class="dpl-input-row">
            <input type="text" id="dpl-seed-input" class="dpl-input"
              placeholder="Artiestnaam\u2026" autocomplete="off" list="dpl-artists-dl">
            <datalist id="dpl-artists-dl"></datalist>
            <button class="dpl-btn" id="dpl-seed-add">+</button>
          </div>
          <button class="dpl-btn dpl-primary" id="dpl-custom-gen" disabled>Genereer Mix</button>
        </div>
        <div id="dpl-custom-result"></div>
      </section>
    </div>

    ${W()}`,document.querySelectorAll(".dpl-hero-card").forEach(a=>{a.querySelector(".dpl-hero-gen")?.addEventListener("click",async()=>{let u=a.dataset.type,v=JSON.parse(a.dataset.params||"null"),y=a.querySelector(".dpl-hero-gen"),h=u+JSON.stringify(v||null);if(!x.has(h)){x.add(h),y&&(y.classList.add("loading"),y.innerHTML='<span class="dpl-spin"></span> Bezig\u2026');try{let k=v?Object.entries(v).map(([z,Z])=>`${z}=${encodeURIComponent(Z)}`).join("&"):"",T=await g(`/api/playlists/generate/${u}?force=true${k?"&"+k:""}`),L=f.find(z=>z.type===u)||{type:u,name:u,params:v};Object.assign(L,{cached:!0,track_count:T.track_count||0,tracks:T.tracks}),C(L,T.tracks||[])}catch(k){alert(`Generatie mislukt: ${k.message}`)}finally{x.delete(h),y&&(y.classList.remove("loading"),y.innerHTML="\u21BA Vernieuw")}}}),a.querySelector(".dpl-hero-play")?.addEventListener("click",async u=>{u.stopPropagation(),await B(a.dataset.type,JSON.parse(a.dataset.params||"null"))}),a.addEventListener("click",async u=>{if(u.target.closest("button")||!a.classList.contains("is-cached"))return;let v=a.dataset.type,y=JSON.parse(a.dataset.params||"null");try{let h=y?Object.entries(y).map(([L,z])=>`${L}=${encodeURIComponent(z)}`).join("&"):"",k=await g(`/api/playlists/generate/${v}${h?"?"+h:""}`),T=f.find(L=>L.type===v)||{type:v,name:v,params:y};C(T,k.tracks||[])}catch{}})}),document.querySelectorAll(".dpl-card").forEach(Y),document.querySelectorAll(".dpl-plex-card").forEach(a=>{a.addEventListener("click",()=>{b.viewParams={id:a.dataset.id,title:a.dataset.title},P("playlist-detail")})}),re()}var ne={spotify:"\u{1F7E2}",deezer:"\u{1F7E0}",youtube:"\u{1F534}",tidal:"\u{1F535}"},le={spotify:"Spotify",deezer:"Deezer",youtube:"YouTube",tidal:"Tidal"};function ie(e){if(!e)return"Nooit gesynchroniseerd";let t=Math.floor(Date.now()/1e3)-e;return t<60?"Zojuist":t<3600?`${Math.floor(t/60)}m geleden`:t<86400?`${Math.floor(t/3600)}u geleden`:`${Math.floor(t/86400)}d geleden`}function oe(e){return e.track_count?Math.round(e.matched_count/e.track_count*100):0}function de(e){let t=ne[e.source_platform]||"\u{1F3B5}",n=le[e.source_platform]||e.source_platform,i=oe(e),c=i>=80?"#5cb85c":i>=40?"#f0ad4e":"#e05555";return`<div class="mir-card" data-id="${e.id}">
    <div class="mir-card-hdr">
      <span class="mir-platform">${t} ${s(n)}</span>
      ${e.auto_sync?'<span class="mir-badge mir-auto">Auto-sync</span>':""}
    </div>
    <div class="mir-card-name">${s(e.name)}</div>
    <div class="mir-card-stats">
      <div class="mir-pbar-wrap">
        <div class="mir-pbar" style="width:${i}%;background:${c}"></div>
      </div>
      <div class="mir-stat-row">
        <span>${e.matched_count}/${e.track_count} in Plex</span>
        <span class="mir-age">${ie(e.last_synced)}</span>
      </div>
    </div>
    <div class="mir-card-actions">
      <button class="dpl-btn mir-btn-tracks" data-id="${e.id}" title="Bekijk tracks">Tracks</button>
      <button class="dpl-btn mir-btn-sync"   data-id="${e.id}" title="Nu synchroniseren">\u21BA Sync</button>
      <button class="dpl-btn mir-btn-dl"     data-id="${e.id}" title="Download ontbrekende tracks">\u2B07 Downloaden</button>
      <button class="dpl-btn mir-btn-del"    data-id="${e.id}" title="Verwijder gespiegelde playlist">\u2715</button>
    </div>
  </div>`}async function I(e){e.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Laden\u2026</div>';let t=[];try{t=await g("/api/mirrored")}catch(o){e.innerHTML=`<div class="dpl-err">\u26A0\uFE0F Laden mislukt: ${s(o.message)}</div>`;return}e.innerHTML=`
    <div class="mir-toolbar">
      <input class="dpl-input mir-url-input" id="mir-url-input" type="url"
        placeholder="Plak een Spotify / Deezer / YouTube / Tidal playlist-URL\u2026">
      <button class="dpl-btn dpl-primary" id="mir-add-btn">+ Toevoegen</button>
    </div>
    <div id="mir-add-msg" class="mir-msg"></div>
    <div class="mir-grid" id="mir-grid">
      ${t.length?t.map(de).join(""):'<div class="dpl-empty">Nog geen gespiegelde playlists. Voeg er een toe hierboven.</div>'}
    </div>
    <div id="mir-tracks-panel" class="mir-tracks-panel" style="display:none"></div>`;let n=e.querySelector("#mir-url-input"),i=e.querySelector("#mir-add-btn"),c=e.querySelector("#mir-add-msg");i.addEventListener("click",async()=>{let o=n.value.trim();if(o){i.disabled=!0,i.textContent="\u23F3 Toevoegen\u2026",c.textContent="",c.className="mir-msg";try{let r=await g("/api/mirrored",{method:"POST",body:JSON.stringify({url:o})});c.textContent=`\u2713 "${r.name}" toegevoegd (${r.track_count} tracks, ${r.matched_count} in Plex)`,c.className="mir-msg mir-ok",n.value="",await I(e)}catch(r){c.textContent=`\u26A0\uFE0F ${r.message}`,c.className="mir-msg mir-err"}finally{i.disabled=!1,i.textContent="+ Toevoegen"}}}),n.addEventListener("keydown",o=>{o.key==="Enter"&&i.click()});let m=e.querySelector("#mir-grid"),d=e.querySelector("#mir-tracks-panel");m.addEventListener("click",async o=>{let r=o.target.dataset?.id;if(r){if(o.target.classList.contains("mir-btn-tracks")){await A(parseInt(r,10),d,m);return}if(o.target.classList.contains("mir-btn-sync")){let l=o.target;l.disabled=!0,l.textContent="\u23F3";try{let p=await g(`/api/mirrored/${r}/sync`,{method:"POST"});l.textContent=`\u2713 ${p.matched_count}/${p.track_count}`,setTimeout(()=>{l.disabled=!1,l.textContent="\u21BA Sync",I(e)},2e3)}catch{l.textContent="\u26A0\uFE0F",l.disabled=!1,setTimeout(()=>{l.textContent="\u21BA Sync"},2e3)}return}if(o.target.classList.contains("mir-btn-dl")){let l=o.target;l.disabled=!0,l.textContent="\u23F3 Bezig\u2026";try{let p=await g(`/api/mirrored/${r}/download-missing`,{method:"POST"});l.textContent=`\u2713 ${p.queued} in wachtrij`,setTimeout(()=>{l.disabled=!1,l.textContent="\u2B07 Downloaden"},3e3)}catch{l.textContent="\u26A0\uFE0F Fout",setTimeout(()=>{l.disabled=!1,l.textContent="\u2B07 Downloaden"},2500)}return}if(o.target.classList.contains("mir-btn-del")){if(!confirm("Gespiegelde playlist verwijderen?"))return;try{await g(`/api/mirrored/${r}`,{method:"DELETE"}),await I(e)}catch{}return}}})}async function A(e,t,n){t.style.display="block",t.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Tracks laden\u2026</div>',t.scrollIntoView({behavior:"smooth",block:"nearest"});let i;try{i=await g(`/api/mirrored/${e}/tracks`)}catch(r){t.innerHTML=`<div class="dpl-err">\u26A0\uFE0F ${s(r.message)}</div>`;return}let{playlist:c,tracks:m}=i,d={matched:{label:"\u2713 In Plex",cls:"mir-s-ok"},unmatched:{label:"\u2715 Ontbreekt",cls:"mir-s-miss"},downloading:{label:"\u2B07 Bezig",cls:"mir-s-dl"},downloaded:{label:"\u2713 Gedownload",cls:"mir-s-dl"},pending:{label:"\u22EF Pending",cls:"mir-s-pend"}},o=m.map(r=>{let l=d[r.match_status]||d.pending,p=r.match_confidence?`${Math.round(r.match_confidence*100)}%`:"";return`<div class="mir-trow">
      <span class="mir-tstatus ${l.cls}">${l.label}</span>
      <div class="mir-tinfo">
        <div class="mir-ttitle">${s(r.source_title)}</div>
        <div class="mir-tsub">${s(r.source_artist)}${r.source_album?` \xB7 ${s(r.source_album)}`:""}</div>
      </div>
      <span class="mir-tconf">${p}</span>
      ${r.match_status==="matched"?`<button class="dpl-btn mir-unmatch" data-track="${r.id}" data-pl="${e}" title="Ontkoppel van Plex">Unmatch</button>`:r.unmatched?`<button class="dpl-btn mir-rematch" data-track="${r.id}" data-pl="${e}" title="Opnieuw matchen">Rematch</button>`:""}
    </div>`}).join("");t.innerHTML=`
    <div class="mir-tp-hdr">
      <span class="mir-tp-title">${s(c.name)}</span>
      <span class="mir-tp-stat">${c.matched_count}/${c.track_count} in Plex</span>
      <button class="dpl-btn" id="mir-tp-close">\u2715 Sluiten</button>
    </div>
    <div class="mir-tlist">${o||'<div class="dpl-empty">Geen tracks gevonden.</div>'}</div>`,t.querySelector("#mir-tp-close")?.addEventListener("click",()=>{t.style.display="none",t.innerHTML=""}),t.addEventListener("click",async r=>{if(r.target.classList.contains("mir-unmatch")){let l=r.target.dataset.track,p=r.target.dataset.pl;try{await g(`/api/mirrored/${p}/tracks/${l}/unmatch`,{method:"POST",body:JSON.stringify({unmatched:!0})}),await A(parseInt(p,10),t,n)}catch{}}if(r.target.classList.contains("mir-rematch")){let l=r.target.dataset.track,p=r.target.dataset.pl;try{await g(`/api/mirrored/${p}/tracks/${l}/unmatch`,{method:"POST",body:JSON.stringify({unmatched:!1})}),await A(parseInt(p,10),t,n)}catch{}}})}function W(){return`<style>
.dpl-page{padding:1.5rem;max-width:1400px}
.dpl-hdr{margin-bottom:1.75rem}
.dpl-page-title{font-size:1.6rem;font-weight:700;margin:0 0 .2rem}
.dpl-page-sub{color:var(--color-secondary);font-size:.875rem;margin:0}
.dpl-section{margin-bottom:2.25rem}
.dpl-stitle{font-size:1rem;font-weight:600;margin:0 0 .875rem}
/* Hero */
.dpl-hero-section{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem}
@media(max-width:640px){.dpl-hero-section{grid-template-columns:1fr}}
.dpl-hero-card{position:relative;border-radius:14px;overflow:hidden;background:var(--color-surface,#1e1e1e);min-height:190px;cursor:pointer;transition:transform .15s}
.dpl-hero-card:hover{transform:scale(1.01)}
.dpl-hero-bg{position:absolute;inset:0;opacity:.3;filter:blur(3px)}
.dpl-hero-bg .dpl-collage,.dpl-hero-bg img,.dpl-hero-bg .dpl-single{width:100%;height:100%;object-fit:cover}
.dpl-hero-bg .dpl-collage{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr}
.dpl-hero-bg .dpl-collage img{width:100%;height:100%;object-fit:cover}
.dpl-hero-cnt{position:relative;z-index:1;padding:1.25rem;display:flex;flex-direction:column;gap:.45rem}
.dpl-hero-icon{font-size:2rem;line-height:1}
.dpl-hero-title{font-size:1.2rem;font-weight:700;margin:0}
.dpl-hero-desc{color:var(--color-secondary);font-size:.82rem;margin:0}
.dpl-hero-meta{display:flex;gap:.5rem;align-items:center;flex-wrap:wrap}
.dpl-hero-btns{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.2rem}
/* Grid */
.dpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:.9rem}
.dpl-grid-1{grid-template-columns:minmax(170px,260px)}
/* Scroll row */
.dpl-scroll-row{display:flex;gap:.9rem;overflow-x:auto;padding-bottom:.6rem;scrollbar-width:thin}
.dpl-scroll-row .dpl-card{flex:0 0 160px}
/* Card */
.dpl-card{border-radius:10px;overflow:hidden;background:var(--color-surface,#1e1e1e);transition:transform .15s,box-shadow .15s}
.dpl-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.3)}
.dpl-card.is-gen{opacity:.65;pointer-events:none}
.dpl-thumb{position:relative;aspect-ratio:1;cursor:pointer;overflow:hidden;background:var(--color-border,#333)}
.dpl-collage{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:100%}
.dpl-collage img{width:100%;height:100%;object-fit:cover}
.dpl-single{width:100%;height:100%;object-fit:cover;display:block}
.dpl-ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.2rem;background:var(--color-border,#333)}
.dpl-ph.big{font-size:3.5rem}
.dpl-play-btn{background:rgba(0,0,0,.65);color:#fff;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:.9rem;position:absolute;bottom:.5rem;right:.5rem;display:flex;align-items:center;justify-content:center;transition:background .15s}
.dpl-play-btn:hover{background:var(--color-accent,#6c63ff)}
.dpl-body{padding:.65rem .65rem .2rem}
.dpl-name{font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.2rem}
.dpl-meta{display:flex;gap:.35rem;align-items:center;flex-wrap:wrap}
.dpl-actions{padding:.25rem .65rem .55rem;display:flex;justify-content:flex-end}
/* Plex cards */
.dpl-plex-card{flex:0 0 130px;background:var(--color-surface,#1e1e1e);border:none;border-radius:8px;overflow:hidden;cursor:pointer;text-align:left;padding:0;transition:transform .15s}
.dpl-plex-card:hover{transform:translateY(-2px)}
.dpl-plex-art{aspect-ratio:1;overflow:hidden;background:var(--color-border,#333)}
.dpl-plex-art img{width:100%;height:100%;object-fit:cover}
.dpl-plex-name{font-size:.78rem;font-weight:600;padding:.4rem .5rem .1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpl-plex-meta{font-size:.7rem;color:var(--color-secondary);padding:0 .5rem .4rem}
/* Buttons */
.dpl-btn{padding:.3rem .65rem;border-radius:6px;border:none;cursor:pointer;font-size:.8rem;background:var(--color-border,#444);color:var(--color-text);transition:background .15s}
.dpl-btn:hover{background:var(--color-accent,#6c63ff);color:#fff}
.dpl-btn:disabled{opacity:.45;cursor:not-allowed}
.dpl-primary{background:var(--color-accent,#6c63ff);color:#fff}
.dpl-primary:hover{background:var(--color-accent-hover,#5a52e0)}
.dpl-gen-btn{min-width:28px;font-size:.75rem}
.dpl-hero-gen,.dpl-hero-play{padding:.45rem .9rem;font-size:.85rem}
/* Badges */
.dpl-badge{font-size:.68rem;padding:.12rem .38rem;border-radius:4px;font-weight:600;white-space:nowrap}
.dpl-ok{background:rgba(99,197,99,.2);color:#5cb85c}
.dpl-none{background:rgba(150,150,150,.12);color:var(--color-secondary)}
.dpl-age{font-size:.68rem;color:var(--color-secondary)}
/* Spinner */
.dpl-spin{display:inline-block;width:11px;height:11px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:dpl-rot .6s linear infinite;vertical-align:middle}
@keyframes dpl-rot{to{transform:rotate(360deg)}}
/* Modal */
.dpl-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem}
.dpl-modal{background:var(--color-bg,#141414);border-radius:14px;width:min(660px,100%);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.85);overflow:hidden}
.dpl-mhdr{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid var(--color-border,#333);flex-shrink:0}
.dpl-mtitle{font-size:1.05rem;font-weight:700;margin:0}
.dpl-macts{display:flex;gap:.45rem;align-items:center}
.dpl-mclose{background:none;border:none;font-size:1.05rem;cursor:pointer;color:var(--color-secondary);padding:.3rem .45rem;border-radius:4px}
.dpl-mclose:hover{background:var(--color-border,#333)}
.dpl-mbody{overflow-y:auto;padding:.65rem 1.2rem 1.2rem;flex:1}
.dpl-tcount{font-size:.75rem;color:var(--color-secondary);margin-bottom:.6rem}
.dpl-trow{display:grid;grid-template-columns:22px 38px 1fr auto 36px;gap:.5rem;align-items:center;padding:.45rem .2rem;border-radius:6px}
.dpl-trow:hover{background:var(--color-surface,#1e1e1e)}
.dpl-tnum{font-size:.75rem;color:var(--color-secondary);text-align:center}
.dpl-tcover{width:38px;height:38px;border-radius:3px;overflow:hidden}
.dpl-tcover img{width:100%;height:100%;object-fit:cover}
.dpl-tph{width:38px;height:38px;background:var(--color-border,#333);border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--color-secondary)}
.dpl-tinfo{min-width:0}
.dpl-ttitle{font-size:.85rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpl-tsub{font-size:.73rem;color:var(--color-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpl-reason{font-size:.68rem;color:var(--color-accent,#6c63ff);margin-left:.35rem}
.dpl-tdur{font-size:.75rem;color:var(--color-secondary);text-align:right;white-space:nowrap}
.dpl-tact{display:flex;justify-content:center}
.dpl-tplay{background:none;border:1px solid var(--color-border,#444);color:var(--color-text);border-radius:50%;width:26px;height:26px;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center;transition:all .15s}
.dpl-tplay:hover{background:var(--color-accent,#6c63ff);border-color:var(--color-accent,#6c63ff);color:#fff}
.dpl-tplay.loading{opacity:.5}
.dpl-tplay.played{background:#5cb85c;border-color:#5cb85c;color:#fff}
.dpl-disc{font-size:.64rem;padding:.1rem .3rem;border-radius:3px;background:rgba(108,99,255,.18);color:var(--color-accent,#6c63ff)}
/* Custom */
.dpl-custom-wrap{background:var(--color-surface,#1e1e1e);border-radius:12px;padding:1.1rem}
.dpl-custom-hint{color:var(--color-secondary);font-size:.82rem;margin:0 0 .85rem}
.dpl-custom-form{display:flex;flex-direction:column;gap:.65rem}
.dpl-seeds{display:flex;flex-wrap:wrap;gap:.35rem;min-height:24px}
.dpl-stag{display:inline-flex;align-items:center;gap:.2rem;background:rgba(108,99,255,.2);color:var(--color-accent,#6c63ff);padding:.22rem .55rem;border-radius:20px;font-size:.78rem}
.dpl-srem{background:none;border:none;cursor:pointer;color:inherit;font-size:.72rem;padding:0;line-height:1}
.dpl-input-row{display:flex;gap:.45rem}
.dpl-input{flex:1;padding:.45rem .65rem;border-radius:6px;border:1px solid var(--color-border,#333);background:var(--color-bg,#141414);color:var(--color-text);font-size:.85rem}
.dpl-input:focus{outline:none;border-color:var(--color-accent,#6c63ff)}
.dpl-cres{display:flex;align-items:center;gap:.75rem;margin-top:.4rem;font-size:.85rem}
.dpl-loading,.dpl-empty{padding:.75rem;text-align:center;color:var(--color-secondary);font-size:.85rem;display:flex;gap:.5rem;align-items:center;justify-content:center}
.dpl-err{color:#e05555;padding:.5rem 0;font-size:.85rem}
/* \u2500\u2500 Tabs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.dpl-tabs{display:flex;gap:0;border-bottom:2px solid var(--color-border,#333);margin-bottom:1.5rem}
.dpl-tab{padding:.55rem 1.1rem;font-size:.88rem;font-weight:600;border:none;background:none;color:var(--color-secondary);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s,border-color .15s}
.dpl-tab:hover{color:var(--color-text)}
.dpl-tab.active{color:var(--color-accent,#6c63ff);border-bottom-color:var(--color-accent,#6c63ff)}
/* \u2500\u2500 Mirrored Playlists \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.mir-toolbar{display:flex;gap:.55rem;margin-bottom:.75rem}
.mir-url-input{flex:1}
.mir-msg{font-size:.82rem;margin-bottom:.6rem;min-height:1.2em}
.mir-ok{color:#5cb85c}
.mir-err{color:#e05555}
.mir-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
.mir-card{background:var(--color-surface,#1e1e1e);border-radius:12px;padding:.9rem 1rem;display:flex;flex-direction:column;gap:.55rem;border:1px solid var(--color-border,#2a2a2a)}
.mir-card-hdr{display:flex;align-items:center;gap:.45rem}
.mir-platform{font-size:.78rem;font-weight:600;color:var(--color-secondary)}
.mir-badge{font-size:.64rem;padding:.1rem .35rem;border-radius:3px;font-weight:600}
.mir-auto{background:rgba(108,99,255,.15);color:var(--color-accent,#6c63ff)}
.mir-card-name{font-size:.92rem;font-weight:700;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-card-stats{display:flex;flex-direction:column;gap:.25rem}
.mir-pbar-wrap{height:5px;background:var(--color-border,#333);border-radius:3px;overflow:hidden}
.mir-pbar{height:100%;border-radius:3px;transition:width .3s}
.mir-stat-row{display:flex;justify-content:space-between;font-size:.72rem;color:var(--color-secondary)}
.mir-age{opacity:.75}
.mir-card-actions{display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.1rem}
.mir-card-actions .dpl-btn{font-size:.73rem;padding:.22rem .55rem}
.mir-btn-del{color:#e05555}
.mir-btn-del:hover{background:#e05555;color:#fff}
/* Mirrored Tracks Panel */
.mir-tracks-panel{margin-top:1.25rem;background:var(--color-surface,#1e1e1e);border-radius:12px;overflow:hidden;border:1px solid var(--color-border,#2a2a2a)}
.mir-tp-hdr{display:flex;align-items:center;gap:.65rem;padding:.7rem 1rem;border-bottom:1px solid var(--color-border,#333)}
.mir-tp-title{font-weight:700;font-size:.9rem;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-tp-stat{font-size:.75rem;color:var(--color-secondary);white-space:nowrap}
.mir-tlist{max-height:420px;overflow-y:auto;padding:.4rem .6rem}
.mir-trow{display:grid;grid-template-columns:100px 1fr auto auto;gap:.5rem;align-items:center;padding:.35rem .2rem;border-radius:6px}
.mir-trow:hover{background:var(--color-bg,#141414)}
.mir-tstatus{font-size:.68rem;font-weight:600;padding:.1rem .32rem;border-radius:3px;white-space:nowrap;text-align:center}
.mir-s-ok{background:rgba(92,184,92,.15);color:#5cb85c}
.mir-s-miss{background:rgba(224,85,85,.12);color:#e05555}
.mir-s-dl{background:rgba(108,99,255,.15);color:var(--color-accent,#6c63ff)}
.mir-s-pend{background:rgba(150,150,150,.1);color:var(--color-secondary)}
.mir-tinfo{min-width:0}
.mir-ttitle{font-size:.82rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-tsub{font-size:.72rem;color:var(--color-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mir-tconf{font-size:.68rem;color:var(--color-secondary);white-space:nowrap}
</style>`}var S=b.playlistTab||"discovery";async function ge(){let e=document.getElementById("content");e&&(S=b.playlistTab||"discovery",e.innerHTML=`
    ${W()}
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">\u{1F3B5} Playlists</h1>
      </div>
      <div class="dpl-tabs">
        <button class="dpl-tab${S==="discovery"?" active":""}" data-tab="discovery">\u{1F52D} Discovery Engine</button>
        <button class="dpl-tab${S==="mirrored"?" active":""}" data-tab="mirrored">\u{1F517} Gespiegeld</button>
      </div>
      <div id="dpl-tab-content">
        <div style="padding:2rem;text-align:center;color:var(--color-secondary)">
          <span class="dpl-spin"></span>
          <span style="margin-left:.5rem">Laden\u2026</span>
        </div>
      </div>
    </div>`,e.querySelectorAll(".dpl-tab").forEach(t=>{t.addEventListener("click",async()=>{e.querySelectorAll(".dpl-tab").forEach(n=>n.classList.remove("active")),t.classList.add("active"),S=t.dataset.tab,b.playlistTab=S,await D(S)})}),await D(S))}async function D(e){let t=document.getElementById("dpl-tab-content");if(t){if(e==="discovery"){t.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Playlists laden\u2026</div>';try{let n=await g("/api/playlists",{signal:b.tabAbort?.signal});await se(n)}catch(n){if(n.name==="AbortError")return;t.innerHTML=`<div style="padding:2rem;text-align:center">
        <p style="color:#e05">Playlists konden niet worden geladen: ${s(n.message)}</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1rem;cursor:pointer;border-radius:6px;border:none;background:var(--color-border);color:var(--color-text)">Opnieuw laden</button>
      </div>`}return}if(e==="mirrored"){t.innerHTML="",await I(t);return}}}async function ye(){let e=document.getElementById("content");if(!e)return;let t=b.viewParams?.id,n=b.viewParams?.title||"Afspeellijst";if(!t){e.innerHTML='<div class="error-box">\u26A0\uFE0F Geen afspeellijst geselecteerd.</div>';return}let i=b.previousView||"playlists";e.innerHTML=`
    <div class="playlist-detail-page">
      <div class="playlist-detail-header">
        <button class="album-detail-back" id="playlist-back-btn">\u2190 Terug</button>
        <div class="playlist-detail-meta">
          <div class="playlist-detail-art-wrap" id="playlist-detail-art">
            <div class="playlist-card-ph">\u266B</div>
          </div>
          <div class="playlist-detail-info">
            <div class="playlist-detail-label">AFSPEELLIJST</div>
            <h1 class="playlist-detail-title">${s(n)}</h1>
            <div class="playlist-detail-sub" id="playlist-detail-sub">Laden\u2026</div>
            <div class="playlist-detail-actions">
              <button class="play-all-btn" id="playlist-play-all" disabled>\u25B6 Afspelen</button>
            </div>
          </div>
        </div>
      </div>
      <div class="playlist-track-list" id="playlist-tracks">
        <div class="playlists-loading">
          <div class="spinner-sm"></div><span>Nummers laden\u2026</span>
        </div>
      </div>
    </div>`,document.getElementById("playlist-back-btn")?.addEventListener("click",()=>P(i));try{let m=(await g(`/api/plex/playlists/${encodeURIComponent(t)}/tracks`,{signal:b.tabAbort?.signal}))?.tracks||[],d=document.getElementById("playlist-detail-sub");if(d){let r=m.reduce((l,p)=>l+(p.duration||0),0);d.textContent=`${H(m.length)} nummers \xB7 ${Math.round(r/6e4)} min`}document.getElementById("playlist-play-all")?.removeAttribute("disabled");try{let r=await g("/api/plex/playlists",{signal:b.tabAbort?.signal}),l=(r?.playlists||r||[]).find(p=>String(p.ratingKey)===String(t));if(l?.thumb){let p=document.getElementById("playlist-detail-art");p&&(p.innerHTML=`<img src="${s(M(l.thumb,240))}" alt="${s(n)}" class="playlist-detail-art-img" loading="lazy">`)}}catch{}let o=document.getElementById("playlist-tracks");if(!o)return;if(!m.length){o.innerHTML='<div class="playlists-empty">Deze afspeellijst bevat geen nummers.</div>';return}o.innerHTML=`
      <table class="playlist-track-table">
        <thead>
          <tr>
            <th class="plt-num">#</th>
            <th class="plt-title">Titel</th>
            <th class="plt-artist">Artiest</th>
            <th class="plt-album">Album</th>
            <th class="plt-dur">Duur</th>
          </tr>
        </thead>
        <tbody>
          ${m.map((r,l)=>{let p=r.thumb?M(r.thumb,48):null;return`<tr class="playlist-track-row">
              <td class="plt-num">${l+1}</td>
              <td class="plt-title">
                <div class="plt-title-inner">
                  ${p?`<img src="${s(p)}" alt="" class="plt-thumb" loading="lazy">`:'<div class="plt-thumb plt-thumb-ph"></div>'}
                  <span>${s(r.title)}</span>
                </div>
              </td>
              <td class="plt-artist">${r.artist?`<button class="plt-artist-link" data-artist="${s(r.artist)}">${s(r.artist)}</button>`:"\u2014"}</td>
              <td class="plt-album">${s(r.album||"\u2014")}</td>
              <td class="plt-dur">${N(r.duration)}</td>
            </tr>`}).join("")}
        </tbody>
      </table>`}catch(c){if(c.name==="AbortError")return;let m=document.getElementById("playlist-tracks");m&&(m.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${s(c.message)}</div>`)}}export{ye as loadPlaylistDetail,ge as loadPlaylists};
