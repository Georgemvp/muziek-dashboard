import{a as P}from"./chunk-FGEE3J4F.js";import{d as j,g as J,h as l,x as u}from"./chunk-NGNPS5HK.js";import{a as f}from"./chunk-2BMKGNH5.js";function N(e){if(!e)return"\u2014";let t=Math.floor(e/1e3);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function X(e){return e?`${Math.round(e/6e4)} min`:""}function U(e){if(!e)return"";let t=Date.now()/1e3-e;return t<3600?`${Math.floor(t/60)}m geleden`:t<86400?`${Math.floor(t/3600)}u geleden`:`${Math.floor(t/86400)}d geleden`}var ee={spring:"Lente",summer:"Zomer",autumn:"Herfst",winter:"Winter",halloween:"Halloween",christmas:"Kerstmis",valentines:"Valentijnsdag"},F={spring:"\u{1F338}",summer:"\u2600\uFE0F",autumn:"\u{1F342}",winter:"\u2744\uFE0F",halloween:"\u{1F383}",christmas:"\u{1F384}",valentines:"\u2764\uFE0F"},V={discovery_weekly:"\u{1F52D}",release_radar:"\u{1F4E1}",daily_mix:"\u{1F3AF}",forgotten_favorites:"\u{1F570}\uFE0F",hidden_gems:"\u{1F48E}",decade:"\u{1F4C5}",seasonal:"\u{1F338}",genre:"\u{1F3B8}",custom:"\u2728",because_you_listen_to:"\u{1F3A7}",daily_genre_mixes:"\u{1F3BC}",popular_picks:"\u{1F525}",discovery_shuffle:"\u{1F3B2}",familiar_favorites:"\u2B50",custom_builder:"\u{1F6E0}\uFE0F"};function te(e){return e&&e.charAt(0).toUpperCase()+e.slice(1)}function Y(e){if(!e?.length)return'<div class="dpl-ph"><span>\u{1F3B5}</span></div>';let t=[],s=new Set;for(let i of e)if(i.cover_url&&!s.has(i.cover_url)&&(s.add(i.cover_url),t.push(i.cover_url)),t.length>=4)break;if(!t.length)return'<div class="dpl-ph"><span>\u{1F3B5}</span></div>';if(t.length===1)return`<img class="dpl-single" src="${l(t[0])}" alt="" loading="lazy">`;for(;t.length<4;)t.push(t[t.length-1]);return`<div class="dpl-collage">${t.map(i=>`<img src="${l(i)}" alt="" loading="lazy" onerror="this.style.opacity=0">`).join("")}</div>`}var h=[],q=[],S=null,$=new Set,T=null;function B(e,t){let s=e.track_count||0,i=e.params?.season?F[e.params.season]||"\u{1F3B5}":V[e.type]||"\u{1F3B5}",p=e.type+JSON.stringify(e.params||null),m=e.cached&&e.tracks?Y(e.tracks):`<div class="dpl-ph"><span>${i}</span></div>`,d=e.cached&&s>0?`<button class="dpl-play-btn" data-type="${l(e.type)}" data-params="${l(JSON.stringify(e.params||null))}" title="Speel af">\u25B6</button>`:"";return`<div class="dpl-card ${t?"is-gen":""} ${e.cached?"is-cached":""}"
    data-type="${l(e.type)}" data-params="${l(JSON.stringify(e.params||null))}" data-key="${l(p)}">
    <div class="dpl-thumb" role="button" tabindex="0">${m}${d}</div>
    <div class="dpl-body">
      <div class="dpl-name">${l(e.name)}</div>
      <div class="dpl-meta">
        ${e.cached?`<span class="dpl-badge dpl-ok">${s} tracks</span>`:'<span class="dpl-badge dpl-none">Niet gegenereerd</span>'}
        ${e.generated_at?`<span class="dpl-age">${U(e.generated_at)}</span>`:""}
      </div>
    </div>
    <div class="dpl-actions">
      <button class="dpl-btn dpl-gen-btn" data-type="${l(e.type)}"
        data-params="${l(JSON.stringify(e.params||null))}" title="Genereer opnieuw">
        ${t?'<span class="dpl-spin"></span>':"\u21BA"}
      </button>
    </div>
  </div>`}function M(e,t){O();let s=e.type==="discovery_weekly"||e.type==="release_radar",i=t.map((d,o)=>{let n=N(d.duration),r=d.cover_url?`<img src="${l(d.cover_url)}" alt="" loading="lazy" onerror="this.style.opacity=0">`:'<div class="dpl-tph">\u266A</div>',c=d.plex_key?`<button class="dpl-tplay" data-key="${l(d.plex_key)}">\u25B6</button>`:'<span class="dpl-disc">Ontdek</span>',b=d.reason?`<span class="dpl-reason">via ${l(d.reason)}</span>`:"";return`<div class="dpl-trow">
      <span class="dpl-tnum">${o+1}</span>
      <div class="dpl-tcover">${r}</div>
      <div class="dpl-tinfo">
        <div class="dpl-ttitle">${l(d.title||d.album||"\u2014")}</div>
        <div class="dpl-tsub">${l(d.artist)}${d.album?` \xB7 ${l(d.album)}`:""}${b}</div>
      </div>
      <span class="dpl-tdur">${n}</span>
      <div class="dpl-tact">${c}</div>
    </div>`}).join(""),p=s?"":`<button class="dpl-btn dpl-primary" id="dpl-play-all"
        data-type="${l(e.type)}" data-params="${l(JSON.stringify(e.params||null))}">\u25B6 Speel Alles</button>`;document.body.insertAdjacentHTML("beforeend",`
    <div class="dpl-backdrop" id="dpl-backdrop">
      <div class="dpl-modal" role="dialog">
        <div class="dpl-mhdr">
          <h2 class="dpl-mtitle">${l(e.name)}</h2>
          <div class="dpl-macts">
            ${p}
            <button class="dpl-btn" id="dpl-shuffle">\u21CC Shuffle</button>
            <button class="dpl-mclose" id="dpl-mclose" aria-label="Sluiten">\u2715</button>
          </div>
        </div>
        <div class="dpl-mbody" id="dpl-mbody">
          <div class="dpl-tcount">${t.length} tracks</div>
          <div class="dpl-tlist" id="dpl-tlist">${i}</div>
        </div>
      </div>
    </div>`),T=document.getElementById("dpl-backdrop"),T.addEventListener("click",d=>{d.target===T&&O()}),document.getElementById("dpl-mclose").addEventListener("click",O);let m=d=>{d.key==="Escape"&&(O(),document.removeEventListener("keydown",m))};document.addEventListener("keydown",m),document.getElementById("dpl-play-all")?.addEventListener("click",()=>H(e.type,e.params)),document.getElementById("dpl-shuffle")?.addEventListener("click",()=>{let d=[...t].sort(()=>Math.random()-.5);document.getElementById("dpl-tlist").innerHTML=d.map((o,n)=>{let r=N(o.duration),c=o.cover_url?`<img src="${l(o.cover_url)}" alt="" loading="lazy">`:'<div class="dpl-tph">\u266A</div>',b=o.plex_key?`<button class="dpl-tplay" data-key="${l(o.plex_key)}">\u25B6</button>`:'<span class="dpl-disc">Ontdek</span>',a=o.reason?`<span class="dpl-reason">via ${l(o.reason)}</span>`:"";return`<div class="dpl-trow"><span class="dpl-tnum">${n+1}</span>
        <div class="dpl-tcover">${c}</div>
        <div class="dpl-tinfo"><div class="dpl-ttitle">${l(o.title||o.album||"\u2014")}</div>
        <div class="dpl-tsub">${l(o.artist)}${o.album?` \xB7 ${l(o.album)}`:""}${a}</div></div>
        <span class="dpl-tdur">${r}</span><div class="dpl-tact">${b}</div></div>`}).join(""),G()}),G()}function G(){document.querySelectorAll(".dpl-tplay").forEach(e=>{e.addEventListener("click",()=>ae(e.dataset.key,e))})}function O(){T&&(T.remove(),T=null)}async function K(){let e=localStorage.getItem("plex_machine_id");if(e)return e;try{let t=await u("/api/plex/clients"),s=Array.isArray(t)?t:t.clients||[];if(s.length)return localStorage.setItem("plex_machine_id",s[0].machineId),s[0].machineId}catch{}return null}async function ae(e,t){let s=await K();if(!s){alert("Geen actieve Plex-speler gevonden.");return}try{t?.classList.add("loading"),await u(`/api/plex/play?machineId=${encodeURIComponent(s)}&ratingKey=${encodeURIComponent(e)}`,{method:"POST"}),t?.classList.remove("loading"),t?.classList.add("played"),setTimeout(()=>t?.classList.remove("played"),3e3)}catch(i){t?.classList.remove("loading"),alert(`Afspelen mislukt: ${i.message}`)}}async function H(e,t){let s=await K();if(!s){alert("Geen actieve Plex-speler gevonden.");return}try{let i=t?Object.entries(t).map(([p,m])=>`${p}=${encodeURIComponent(m)}`).join("&"):"";await u(`/api/playlists/play/${e}?machineId=${encodeURIComponent(s)}${i?"&"+i:""}`,{method:"POST"})}catch(i){alert(`Afspelen mislukt: ${i.message}`)}}async function D(e,t,s){let i=e+JSON.stringify(t||null);if($.has(i))return;$.add(i),s?.classList.add("is-gen");let p=s?.querySelector(".dpl-gen-btn");p&&(p.innerHTML='<span class="dpl-spin"></span>');try{let m=t?Object.entries(t).map(([n,r])=>`${n}=${encodeURIComponent(r)}`).join("&"):"",d=await u(`/api/playlists/generate/${e}?force=true${m?"&"+m:""}`),o=h.findIndex(n=>n.type===e&&JSON.stringify(n.params||null)===JSON.stringify(t||null));o>=0&&Object.assign(h[o],{cached:!0,track_count:d.track_count||d.tracks?.length||0,generated_at:d.generated_at,tracks:d.tracks}),re(e,t,d)}catch(m){alert(`Generatie mislukt: ${m.message}`)}finally{$.delete(i),s?.classList.remove("is-gen"),p&&(p.innerHTML="\u21BA")}}function re(e,t,s){let i=e+JSON.stringify(t||null),p=document.querySelector(`.dpl-card[data-key="${CSS.escape(i)}"]`);if(!p)return;let m=h.find(n=>n.type===e&&JSON.stringify(n.params||null)===JSON.stringify(t||null));if(!m)return;let d=document.createElement("div");d.innerHTML=B({...m,tracks:s.tracks},!1);let o=d.firstElementChild;p.replaceWith(o),W(o)}function W(e){e.querySelector(".dpl-thumb")?.addEventListener("click",async()=>{let t=e.dataset.type,s=JSON.parse(e.dataset.params||"null");if(!e.classList.contains("is-cached")){await D(t,s,e);return}try{let i=s?Object.entries(s).map(([d,o])=>`${d}=${encodeURIComponent(o)}`).join("&"):"",p=await u(`/api/playlists/generate/${t}${i?"?"+i:""}`),m=h.find(d=>d.type===t&&JSON.stringify(d.params||null)===JSON.stringify(s||null))||{type:t,name:t,params:s};M(m,p.tracks||[])}catch(i){alert(`Laden mislukt: ${i.message}`)}}),e.querySelector(".dpl-gen-btn")?.addEventListener("click",async t=>{t.stopPropagation(),await D(e.dataset.type,JSON.parse(e.dataset.params||"null"),e)}),e.querySelector(".dpl-play-btn")?.addEventListener("click",async t=>{t.stopPropagation(),await H(e.dataset.type,JSON.parse(e.dataset.params||"null"))})}var x=[];function ne(){let e=document.getElementById("dpl-bylt-input"),t=document.getElementById("dpl-bylt-add"),s=document.getElementById("dpl-bylt-gen"),i=document.getElementById("dpl-bylt-seeds"),p=document.getElementById("dpl-bylt-result"),m=document.getElementById("dpl-artists-dl2"),d=()=>{i.innerHTML=x.map((r,c)=>`<span class="dpl-stag">${l(r)}<button class="dpl-srem" data-i="${c}">\u2715</button></span>`).join(""),s.disabled=!x.length,i.querySelectorAll(".dpl-srem").forEach(r=>{r.addEventListener("click",()=>{x.splice(+r.dataset.i,1),d()})})},o=()=>{let r=e?.value.trim();!r||x.includes(r)||x.length>=5||(x.push(r),e&&(e.value=""),d())};t?.addEventListener("click",o),e?.addEventListener("keydown",r=>{r.key==="Enter"&&o()});let n;e?.addEventListener("input",()=>{clearTimeout(n);let r=e.value.trim();r.length<2||(n=setTimeout(async()=>{try{let b=((await u(`/api/plex/search?q=${encodeURIComponent(r)}`)).artists||[]).map(a=>a.title||a.name);m&&(m.innerHTML=b.map(a=>`<option value="${l(a)}">`).join(""))}catch{}},250))}),s?.addEventListener("click",async()=>{if(x.length){s.disabled=!0,s.textContent="Genereren\u2026",p.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Even geduld\u2026</div>';try{let c=(await u(`/api/playlists/generate/because_you_listen_to?force=true&seeds=${encodeURIComponent(x.join(","))}`)).tracks||[];c.length?(p.innerHTML=`<div class="dpl-cres">
          <strong>${c.length} tracks</strong> gevonden \u2014
          <button class="dpl-btn dpl-primary" id="dpl-open-bylt">Bekijk \u2192</button>
        </div>`,document.getElementById("dpl-open-bylt")?.addEventListener("click",()=>{M({type:"because_you_listen_to",name:`Omdat je luistert naar: ${x.slice(0,2).join(", ")}`,params:{seeds:x}},c)})):p.innerHTML='<p class="dpl-empty">Geen vergelijkbare artiesten gevonden in je bibliotheek.</p>'}catch(r){p.innerHTML=`<p class="dpl-err">Fout: ${l(r.message)}</p>`}finally{s.disabled=!1,s.textContent="Genereer"}}})}var w=[];function se(){let e=document.getElementById("dpl-seed-input"),t=document.getElementById("dpl-seed-add"),s=document.getElementById("dpl-custom-gen"),i=document.getElementById("dpl-seeds"),p=document.getElementById("dpl-custom-result"),m=document.getElementById("dpl-artists-dl"),d=()=>{i.innerHTML=w.map((r,c)=>`<span class="dpl-stag">${l(r)}<button class="dpl-srem" data-i="${c}">\u2715</button></span>`).join(""),s.disabled=!w.length,i.querySelectorAll(".dpl-srem").forEach(r=>{r.addEventListener("click",()=>{w.splice(+r.dataset.i,1),d()})})},o=()=>{let r=e?.value.trim();!r||w.includes(r)||w.length>=5||(w.push(r),e&&(e.value=""),d())};t?.addEventListener("click",o),e?.addEventListener("keydown",r=>{r.key==="Enter"&&o()});let n;e?.addEventListener("input",()=>{clearTimeout(n);let r=e.value.trim();r.length<2||(n=setTimeout(async()=>{try{let b=((await u(`/api/plex/search?q=${encodeURIComponent(r)}`)).artists||[]).map(a=>a.title||a.name);m&&(m.innerHTML=b.map(a=>`<option value="${l(a)}">`).join(""))}catch{}},250))}),document.getElementById("dpl-track-count")?.addEventListener("input",function(){let r=document.getElementById("dpl-tc-val");r&&(r.textContent=this.value)}),document.getElementById("dpl-diversity")?.addEventListener("input",function(){let r=document.getElementById("dpl-div-val");r&&(r.textContent=this.value+"%")}),s?.addEventListener("click",async()=>{if(!w.length)return;s.disabled=!0,s.textContent="Genereren\u2026",p.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Even geduld\u2026</div>';let r=document.getElementById("dpl-track-count")?.value||50,c=(parseInt(document.getElementById("dpl-diversity")?.value||50)/100).toFixed(2),b=document.getElementById("dpl-include-seeds")?.checked!==!1;try{let a=`/api/playlists/generate/custom_builder?force=true&seeds=${encodeURIComponent(w.join(","))}&trackCount=${r}&diversity=${c}&includeSeeds=${b}`,v=(await u(a)).tracks||[];v.length?(p.innerHTML=`<div class="dpl-cres">
          <strong>${v.length} tracks</strong> gevonden \u2014
          <button class="dpl-btn dpl-primary" id="dpl-open-custom">Bekijk \u2192</button>
        </div>`,document.getElementById("dpl-open-custom")?.addEventListener("click",()=>{M({type:"custom_builder",name:`Builder Mix: ${w.slice(0,2).join(", ")}`,params:{seeds:w,trackCount:r,diversityFactor:c,includeSeeds:b}},v)})):p.innerHTML='<p class="dpl-empty">Geen tracks gevonden.</p>'}catch(a){p.innerHTML=`<p class="dpl-err">Fout: ${l(a.message)}</p>`}finally{s.disabled=!1,s.textContent="Genereer Mix"}})}async function le(e){h=e.catalog||[],q=e.genres||[],S=e.current_season;let t=h.filter(a=>["discovery_weekly","release_radar"].includes(a.type)),s=h.filter(a=>["daily_mix","forgotten_favorites","hidden_gems","popular_picks","discovery_shuffle","familiar_favorites"].includes(a.type)),i=h.filter(a=>a.type==="seasonal"),p=h.filter(a=>a.type==="decade"),m=i.find(a=>a.params?.season===S),d=i.filter(a=>a.params?.season!==S),o=q.slice(0,12),n=[];try{let a=await u("/api/plex/playlists",{signal:f.tabAbort?.signal});n=(a?.playlists||a||[]).slice(0,8)}catch{}let r=t.map(a=>{let g=a.type+JSON.stringify(a.params||null),v=$.has(g),y=V[a.type]||"\u{1F3B5}",k=a.cached&&a.tracks?Y(a.tracks):`<div class="dpl-ph big"><span>${y}</span></div>`;return`<div class="dpl-hero-card ${v?"is-gen":""} ${a.cached?"is-cached":""}"
      data-type="${l(a.type)}" data-params="${l(JSON.stringify(a.params||null))}" data-key="${l(g)}">
      <div class="dpl-hero-bg">${k}</div>
      <div class="dpl-hero-cnt">
        <span class="dpl-hero-icon">${y}</span>
        <h2 class="dpl-hero-title">${l(a.name)}</h2>
        <p class="dpl-hero-desc">${l(a.description||"")}</p>
        <div class="dpl-hero-meta">
          ${a.cached?`<span class="dpl-badge dpl-ok">${a.track_count} tracks</span>`:'<span class="dpl-badge dpl-none">Nog niet gegenereerd</span>'}
          ${a.generated_at?`<span class="dpl-age">${U(a.generated_at)}</span>`:""}
        </div>
        <div class="dpl-hero-btns">
          ${a.cached&&a.track_count>0?`<button class="dpl-btn dpl-primary dpl-hero-play" data-type="${l(a.type)}" data-params="null">\u25B6 Speel Af</button>`:""}
          <button class="dpl-btn dpl-hero-gen" data-type="${l(a.type)}" data-params="${l(JSON.stringify(a.params||null))}">
            ${v?'<span class="dpl-spin"></span> Bezig\u2026':a.cached?"\u21BA Vernieuw":"\u26A1 Genereer"}
          </button>
        </div>
      </div>
    </div>`}).join(""),c=a=>a.map(g=>{let v=g.type+JSON.stringify(g.params||null);return B(g,$.has(v))}).join(""),b=n.length?`
    <section class="dpl-section">
      <h2 class="dpl-stitle">\u{1F4C2} Plex Afspeellijsten</h2>
      <div class="dpl-scroll-row">
        ${n.map(a=>{let g=a.thumb?j(a.thumb,200):null;return`<button class="dpl-plex-card" data-id="${l(a.ratingKey)}" data-title="${l(a.title)}" aria-label="${l(a.title)}">
            <div class="dpl-plex-art">${g?`<img src="${l(g)}" alt="" loading="lazy">`:'<div class="dpl-ph"><span>\u266B</span></div>'}</div>
            <div class="dpl-plex-name">${l(a.title)}</div>
            <div class="dpl-plex-meta">${a.trackCount||0} nrs${a.duration?" \xB7 "+X(a.duration):""}</div>
          </button>`}).join("")}
      </div>
    </section>`:"";document.getElementById("content").innerHTML=`
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">\u{1F3B5} Discovery Engine</h1>
        <p class="dpl-page-sub">Gepersonaliseerde playlists op basis van jouw luisterdata + Plex-bibliotheek</p>
      </div>

      <section class="dpl-section dpl-hero-section">
        ${r}
      </section>

      <section class="dpl-section">
        <h2 class="dpl-stitle">Jouw Mix</h2>
        <div class="dpl-grid">${c(s)}</div>
      </section>

      ${m?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">${F[S]||"\u{1F338}"} Seizoen: ${ee[S]||S}</h2>
        <div class="dpl-grid dpl-grid-1">${B(m,$.has(m.type+JSON.stringify(m.params)))}</div>
      </section>`:""}

      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F4C5} Per Decennium</h2>
        <div class="dpl-scroll-row">${c(p)}</div>
      </section>

      ${o.length?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F3B8} Genres</h2>
        <div class="dpl-scroll-row">
          ${o.map(a=>{let g={genre:a},v="genre"+JSON.stringify(g),y=h.find(E=>E.type==="genre"&&E.params?.genre===a),k={type:"genre",name:te(a),description:`Jouw tracks in het ${a} genre`,params:g,cached:!!y?.cached,track_count:y?.track_count||0,generated_at:y?.generated_at||null,tracks:y?.tracks||null};return B(k,$.has(v))}).join("")}
        </div>
      </section>`:""}

      ${d.length?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F5D3}\uFE0F Andere Seizoenen</h2>
        <div class="dpl-scroll-row">${c(d)}</div>
      </section>`:""}

      ${b}

      <section class="dpl-section dpl-custom-wrap">
        <h2 class="dpl-stitle">\u{1F3A7} Omdat je luistert naar\u2026</h2>
        <p class="dpl-custom-hint">Vul 1\u20135 artiesten in \u2014 wij vinden vergelijkbare artiesten die al in je Plex-bibliotheek staan.</p>
        <div class="dpl-custom-form">
          <div class="dpl-seeds" id="dpl-bylt-seeds"></div>
          <div class="dpl-input-row">
            <input type="text" id="dpl-bylt-input" class="dpl-input"
              placeholder="Artiestnaam\u2026" autocomplete="off" list="dpl-artists-dl2">
            <datalist id="dpl-artists-dl2"></datalist>
            <button class="dpl-btn" id="dpl-bylt-add">+</button>
          </div>
          <button class="dpl-btn dpl-primary" id="dpl-bylt-gen" disabled>Genereer</button>
        </div>
        <div id="dpl-bylt-result"></div>
      </section>

      <section class="dpl-section dpl-custom-wrap">
        <h2 class="dpl-stitle">\u{1F6E0}\uFE0F Geavanceerde Playlist Builder</h2>
        <p class="dpl-custom-hint">Bouw een volledig gepersonaliseerde mix met controle over diversiteit en aantal tracks.</p>
        <div class="dpl-custom-form">
          <div class="dpl-seeds" id="dpl-seeds"></div>
          <div class="dpl-input-row">
            <input type="text" id="dpl-seed-input" class="dpl-input"
              placeholder="Artiestnaam\u2026" autocomplete="off" list="dpl-artists-dl">
            <datalist id="dpl-artists-dl"></datalist>
            <button class="dpl-btn" id="dpl-seed-add">+</button>
          </div>
          <div class="dpl-builder-opts">
            <label class="dpl-opt-label">Tracks: <span id="dpl-tc-val">50</span>
              <input type="range" id="dpl-track-count" min="30" max="100" value="50" step="5" class="dpl-range">
            </label>
            <label class="dpl-opt-label">Diversiteit: <span id="dpl-div-val">50%</span>
              <input type="range" id="dpl-diversity" min="0" max="100" value="50" class="dpl-range">
            </label>
            <label class="dpl-opt-label dpl-opt-check">
              <input type="checkbox" id="dpl-include-seeds" checked> Seed-artiesten zelf opnemen
            </label>
          </div>
          <button class="dpl-btn dpl-primary" id="dpl-custom-gen" disabled>Genereer Mix</button>
        </div>
        <div id="dpl-custom-result"></div>
      </section>
    </div>

    ${Z()}`,document.querySelectorAll(".dpl-hero-card").forEach(a=>{a.querySelector(".dpl-hero-gen")?.addEventListener("click",async()=>{let g=a.dataset.type,v=JSON.parse(a.dataset.params||"null"),y=a.querySelector(".dpl-hero-gen"),k=g+JSON.stringify(v||null);if(!$.has(k)){$.add(k),y&&(y.classList.add("loading"),y.innerHTML='<span class="dpl-spin"></span> Bezig\u2026');try{let E=v?Object.entries(v).map(([I,Q])=>`${I}=${encodeURIComponent(Q)}`).join("&"):"",z=await u(`/api/playlists/generate/${g}?force=true${E?"&"+E:""}`),_=h.find(I=>I.type===g)||{type:g,name:g,params:v};Object.assign(_,{cached:!0,track_count:z.track_count||0,tracks:z.tracks}),M(_,z.tracks||[])}catch(E){alert(`Generatie mislukt: ${E.message}`)}finally{$.delete(k),y&&(y.classList.remove("loading"),y.innerHTML="\u21BA Vernieuw")}}}),a.querySelector(".dpl-hero-play")?.addEventListener("click",async g=>{g.stopPropagation(),await H(a.dataset.type,JSON.parse(a.dataset.params||"null"))}),a.addEventListener("click",async g=>{if(g.target.closest("button")||!a.classList.contains("is-cached"))return;let v=a.dataset.type,y=JSON.parse(a.dataset.params||"null");try{let k=y?Object.entries(y).map(([_,I])=>`${_}=${encodeURIComponent(I)}`).join("&"):"",E=await u(`/api/playlists/generate/${v}${k?"?"+k:""}`),z=h.find(_=>_.type===v)||{type:v,name:v,params:y};M(z,E.tracks||[])}catch{}})}),document.querySelectorAll(".dpl-card").forEach(W),document.querySelectorAll(".dpl-plex-card").forEach(a=>{a.addEventListener("click",()=>{f.viewParams={id:a.dataset.id,title:a.dataset.title},P("playlist-detail")})}),ne(),se()}var ie={spotify:"\u{1F7E2}",deezer:"\u{1F7E0}",youtube:"\u{1F534}",tidal:"\u{1F535}"},oe={spotify:"Spotify",deezer:"Deezer",youtube:"YouTube",tidal:"Tidal"};function de(e){if(!e)return"Nooit gesynchroniseerd";let t=Math.floor(Date.now()/1e3)-e;return t<60?"Zojuist":t<3600?`${Math.floor(t/60)}m geleden`:t<86400?`${Math.floor(t/3600)}u geleden`:`${Math.floor(t/86400)}d geleden`}function ce(e){return e.track_count?Math.round(e.matched_count/e.track_count*100):0}function pe(e){let t=ie[e.source_platform]||"\u{1F3B5}",s=oe[e.source_platform]||e.source_platform,i=ce(e),p=i>=80?"#5cb85c":i>=40?"#f0ad4e":"#e05555";return`<div class="mir-card" data-id="${e.id}">
    <div class="mir-card-hdr">
      <span class="mir-platform">${t} ${l(s)}</span>
      ${e.auto_sync?'<span class="mir-badge mir-auto">Auto-sync</span>':""}
    </div>
    <div class="mir-card-name">${l(e.name)}</div>
    <div class="mir-card-stats">
      <div class="mir-pbar-wrap">
        <div class="mir-pbar" style="width:${i}%;background:${p}"></div>
      </div>
      <div class="mir-stat-row">
        <span>${e.matched_count}/${e.track_count} in Plex</span>
        <span class="mir-age">${de(e.last_synced)}</span>
      </div>
    </div>
    <div class="mir-card-actions">
      <button class="dpl-btn mir-btn-tracks" data-id="${e.id}" title="Bekijk tracks">Tracks</button>
      <button class="dpl-btn mir-btn-sync"   data-id="${e.id}" title="Nu synchroniseren">\u21BA Sync</button>
      <button class="dpl-btn mir-btn-dl"     data-id="${e.id}" title="Download ontbrekende tracks">\u2B07 Downloaden</button>
      <button class="dpl-btn mir-btn-del"    data-id="${e.id}" title="Verwijder gespiegelde playlist">\u2715</button>
    </div>
  </div>`}async function C(e){e.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Laden\u2026</div>';let t=[];try{t=await u("/api/mirrored")}catch(o){e.innerHTML=`<div class="dpl-err">\u26A0\uFE0F Laden mislukt: ${l(o.message)}</div>`;return}e.innerHTML=`
    <div class="mir-toolbar">
      <input class="dpl-input mir-url-input" id="mir-url-input" type="url"
        placeholder="Plak een Spotify / Deezer / YouTube / Tidal playlist-URL\u2026">
      <button class="dpl-btn dpl-primary" id="mir-add-btn">+ Toevoegen</button>
    </div>
    <div id="mir-add-msg" class="mir-msg"></div>
    <div class="mir-grid" id="mir-grid">
      ${t.length?t.map(pe).join(""):'<div class="dpl-empty">Nog geen gespiegelde playlists. Voeg er een toe hierboven.</div>'}
    </div>
    <div id="mir-tracks-panel" class="mir-tracks-panel" style="display:none"></div>`;let s=e.querySelector("#mir-url-input"),i=e.querySelector("#mir-add-btn"),p=e.querySelector("#mir-add-msg");i.addEventListener("click",async()=>{let o=s.value.trim();if(o){i.disabled=!0,i.textContent="\u23F3 Toevoegen\u2026",p.textContent="",p.className="mir-msg";try{let n=await u("/api/mirrored",{method:"POST",body:JSON.stringify({url:o})});p.textContent=`\u2713 "${n.name}" toegevoegd (${n.track_count} tracks, ${n.matched_count} in Plex)`,p.className="mir-msg mir-ok",s.value="",await C(e)}catch(n){p.textContent=`\u26A0\uFE0F ${n.message}`,p.className="mir-msg mir-err"}finally{i.disabled=!1,i.textContent="+ Toevoegen"}}}),s.addEventListener("keydown",o=>{o.key==="Enter"&&i.click()});let m=e.querySelector("#mir-grid"),d=e.querySelector("#mir-tracks-panel");m.addEventListener("click",async o=>{let n=o.target.dataset?.id;if(n){if(o.target.classList.contains("mir-btn-tracks")){await A(parseInt(n,10),d,m);return}if(o.target.classList.contains("mir-btn-sync")){let r=o.target;r.disabled=!0,r.textContent="\u23F3";try{let c=await u(`/api/mirrored/${n}/sync`,{method:"POST"});r.textContent=`\u2713 ${c.matched_count}/${c.track_count}`,setTimeout(()=>{r.disabled=!1,r.textContent="\u21BA Sync",C(e)},2e3)}catch{r.textContent="\u26A0\uFE0F",r.disabled=!1,setTimeout(()=>{r.textContent="\u21BA Sync"},2e3)}return}if(o.target.classList.contains("mir-btn-dl")){let r=o.target;r.disabled=!0,r.textContent="\u23F3 Bezig\u2026";try{let c=await u(`/api/mirrored/${n}/download-missing`,{method:"POST"});r.textContent=`\u2713 ${c.queued} in wachtrij`,setTimeout(()=>{r.disabled=!1,r.textContent="\u2B07 Downloaden"},3e3)}catch{r.textContent="\u26A0\uFE0F Fout",setTimeout(()=>{r.disabled=!1,r.textContent="\u2B07 Downloaden"},2500)}return}if(o.target.classList.contains("mir-btn-del")){if(!confirm("Gespiegelde playlist verwijderen?"))return;try{await u(`/api/mirrored/${n}`,{method:"DELETE"}),await C(e)}catch{}return}}})}async function A(e,t,s){t.style.display="block",t.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Tracks laden\u2026</div>',t.scrollIntoView({behavior:"smooth",block:"nearest"});let i;try{i=await u(`/api/mirrored/${e}/tracks`)}catch(n){t.innerHTML=`<div class="dpl-err">\u26A0\uFE0F ${l(n.message)}</div>`;return}let{playlist:p,tracks:m}=i,d={matched:{label:"\u2713 In Plex",cls:"mir-s-ok"},unmatched:{label:"\u2715 Ontbreekt",cls:"mir-s-miss"},downloading:{label:"\u2B07 Bezig",cls:"mir-s-dl"},downloaded:{label:"\u2713 Gedownload",cls:"mir-s-dl"},pending:{label:"\u22EF Pending",cls:"mir-s-pend"}},o=m.map(n=>{let r=d[n.match_status]||d.pending,c=n.match_confidence?`${Math.round(n.match_confidence*100)}%`:"";return`<div class="mir-trow">
      <span class="mir-tstatus ${r.cls}">${r.label}</span>
      <div class="mir-tinfo">
        <div class="mir-ttitle">${l(n.source_title)}</div>
        <div class="mir-tsub">${l(n.source_artist)}${n.source_album?` \xB7 ${l(n.source_album)}`:""}</div>
      </div>
      <span class="mir-tconf">${c}</span>
      ${n.match_status==="matched"?`<button class="dpl-btn mir-unmatch" data-track="${n.id}" data-pl="${e}" title="Ontkoppel van Plex">Unmatch</button>`:n.unmatched?`<button class="dpl-btn mir-rematch" data-track="${n.id}" data-pl="${e}" title="Opnieuw matchen">Rematch</button>`:""}
    </div>`}).join("");t.innerHTML=`
    <div class="mir-tp-hdr">
      <span class="mir-tp-title">${l(p.name)}</span>
      <span class="mir-tp-stat">${p.matched_count}/${p.track_count} in Plex</span>
      <button class="dpl-btn" id="mir-tp-close">\u2715 Sluiten</button>
    </div>
    <div class="mir-tlist">${o||'<div class="dpl-empty">Geen tracks gevonden.</div>'}</div>`,t.querySelector("#mir-tp-close")?.addEventListener("click",()=>{t.style.display="none",t.innerHTML=""}),t.addEventListener("click",async n=>{if(n.target.classList.contains("mir-unmatch")){let r=n.target.dataset.track,c=n.target.dataset.pl;try{await u(`/api/mirrored/${c}/tracks/${r}/unmatch`,{method:"POST",body:JSON.stringify({unmatched:!0})}),await A(parseInt(c,10),t,s)}catch{}}if(n.target.classList.contains("mir-rematch")){let r=n.target.dataset.track,c=n.target.dataset.pl;try{await u(`/api/mirrored/${c}/tracks/${r}/unmatch`,{method:"POST",body:JSON.stringify({unmatched:!1})}),await A(parseInt(c,10),t,s)}catch{}}})}function Z(){return`<style>
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
.dpl-builder-opts{display:flex;flex-direction:column;gap:.65rem;padding:.65rem;background:var(--color-surface,#1e1e1e);border-radius:8px}
.dpl-opt-label{display:flex;flex-direction:column;gap:.3rem;font-size:.82rem;color:var(--color-secondary)}
.dpl-opt-check{flex-direction:row;align-items:center;gap:.4rem;cursor:pointer}
.dpl-range{width:100%;accent-color:var(--color-accent,#6c63ff);cursor:pointer}
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
</style>`}var L=f.playlistTab||"discovery";async function ye(){let e=document.getElementById("content");e&&(L=f.playlistTab||"discovery",e.innerHTML=`
    ${Z()}
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">\u{1F3B5} Playlists</h1>
      </div>
      <div class="dpl-tabs">
        <button class="dpl-tab${L==="discovery"?" active":""}" data-tab="discovery">\u{1F52D} Discovery Engine</button>
        <button class="dpl-tab${L==="mirrored"?" active":""}" data-tab="mirrored">\u{1F517} Gespiegeld</button>
      </div>
      <div id="dpl-tab-content">
        <div style="padding:2rem;text-align:center;color:var(--color-secondary)">
          <span class="dpl-spin"></span>
          <span style="margin-left:.5rem">Laden\u2026</span>
        </div>
      </div>
    </div>`,e.querySelectorAll(".dpl-tab").forEach(t=>{t.addEventListener("click",async()=>{e.querySelectorAll(".dpl-tab").forEach(s=>s.classList.remove("active")),t.classList.add("active"),L=t.dataset.tab,f.playlistTab=L,await R(L)})}),await R(L))}async function R(e){let t=document.getElementById("dpl-tab-content");if(t){if(e==="discovery"){t.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Playlists laden\u2026</div>';try{let s=await u("/api/playlists",{signal:f.tabAbort?.signal});await le(s)}catch(s){if(s.name==="AbortError")return;t.innerHTML=`<div style="padding:2rem;text-align:center">
        <p style="color:#e05">Playlists konden niet worden geladen: ${l(s.message)}</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1rem;cursor:pointer;border-radius:6px;border:none;background:var(--color-border);color:var(--color-text)">Opnieuw laden</button>
      </div>`}return}if(e==="mirrored"){t.innerHTML="",await C(t);return}}}async function be(){let e=document.getElementById("content");if(!e)return;let t=f.viewParams?.id,s=f.viewParams?.title||"Afspeellijst";if(!t){e.innerHTML='<div class="error-box">\u26A0\uFE0F Geen afspeellijst geselecteerd.</div>';return}let i=f.previousView||"playlists";e.innerHTML=`
    <div class="playlist-detail-page">
      <div class="playlist-detail-header">
        <button class="album-detail-back" id="playlist-back-btn">\u2190 Terug</button>
        <div class="playlist-detail-meta">
          <div class="playlist-detail-art-wrap" id="playlist-detail-art">
            <div class="playlist-card-ph">\u266B</div>
          </div>
          <div class="playlist-detail-info">
            <div class="playlist-detail-label">AFSPEELLIJST</div>
            <h1 class="playlist-detail-title">${l(s)}</h1>
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
    </div>`,document.getElementById("playlist-back-btn")?.addEventListener("click",()=>P(i));try{let m=(await u(`/api/plex/playlists/${encodeURIComponent(t)}/tracks`,{signal:f.tabAbort?.signal}))?.tracks||[],d=document.getElementById("playlist-detail-sub");if(d){let n=m.reduce((r,c)=>r+(c.duration||0),0);d.textContent=`${J(m.length)} nummers \xB7 ${Math.round(n/6e4)} min`}document.getElementById("playlist-play-all")?.removeAttribute("disabled");try{let n=await u("/api/plex/playlists",{signal:f.tabAbort?.signal}),r=(n?.playlists||n||[]).find(c=>String(c.ratingKey)===String(t));if(r?.thumb){let c=document.getElementById("playlist-detail-art");c&&(c.innerHTML=`<img src="${l(j(r.thumb,240))}" alt="${l(s)}" class="playlist-detail-art-img" loading="lazy">`)}}catch{}let o=document.getElementById("playlist-tracks");if(!o)return;if(!m.length){o.innerHTML='<div class="playlists-empty">Deze afspeellijst bevat geen nummers.</div>';return}o.innerHTML=`
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
          ${m.map((n,r)=>{let c=n.thumb?j(n.thumb,48):null;return`<tr class="playlist-track-row">
              <td class="plt-num">${r+1}</td>
              <td class="plt-title">
                <div class="plt-title-inner">
                  ${c?`<img src="${l(c)}" alt="" class="plt-thumb" loading="lazy">`:'<div class="plt-thumb plt-thumb-ph"></div>'}
                  <span>${l(n.title)}</span>
                </div>
              </td>
              <td class="plt-artist">${n.artist?`<button class="plt-artist-link" data-artist="${l(n.artist)}">${l(n.artist)}</button>`:"\u2014"}</td>
              <td class="plt-album">${l(n.album||"\u2014")}</td>
              <td class="plt-dur">${N(n.duration)}</td>
            </tr>`}).join("")}
        </tbody>
      </table>`}catch(p){if(p.name==="AbortError")return;let m=document.getElementById("playlist-tracks");m&&(m.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l(p.message)}</div>`)}}export{be as loadPlaylistDetail,ye as loadPlaylists};
