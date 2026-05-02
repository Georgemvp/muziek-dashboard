import{a as T}from"./chunk-ON3VBP4V.js";import{d as j,g as B,h as l,z as v}from"./chunk-HCN2ZK5I.js";import{a as k}from"./chunk-2BMKGNH5.js";function A(e){if(!e)return"\u2014";let a=Math.floor(e/1e3);return`${Math.floor(a/60)}:${String(a%60).padStart(2,"0")}`}function K(e){return e?`${Math.round(e/6e4)} min`:""}function P(e){if(!e)return"";let a=Date.now()/1e3-e;return a<3600?`${Math.floor(a/60)}m geleden`:a<86400?`${Math.floor(a/3600)}u geleden`:`${Math.floor(a/86400)}d geleden`}var F={spring:"Lente",summer:"Zomer",autumn:"Herfst",winter:"Winter",halloween:"Halloween",christmas:"Kerstmis",valentines:"Valentijnsdag"},G={spring:"\u{1F338}",summer:"\u2600\uFE0F",autumn:"\u{1F342}",winter:"\u2744\uFE0F",halloween:"\u{1F383}",christmas:"\u{1F384}",valentines:"\u2764\uFE0F"},q={discovery_weekly:"\u{1F52D}",release_radar:"\u{1F4E1}",daily_mix:"\u{1F3AF}",forgotten_favorites:"\u{1F570}\uFE0F",hidden_gems:"\u{1F48E}",decade:"\u{1F4C5}",seasonal:"\u{1F338}",genre:"\u{1F3B8}",custom:"\u2728"};function Y(e){return e&&e.charAt(0).toUpperCase()+e.slice(1)}function R(e){if(!e?.length)return'<div class="dpl-ph"><span>\u{1F3B5}</span></div>';let a=[],s=new Set;for(let r of e)if(r.cover_url&&!s.has(r.cover_url)&&(s.add(r.cover_url),a.push(r.cover_url)),a.length>=4)break;if(!a.length)return'<div class="dpl-ph"><span>\u{1F3B5}</span></div>';if(a.length===1)return`<img class="dpl-single" src="${l(a[0])}" alt="" loading="lazy">`;for(;a.length<4;)a.push(a[a.length-1]);return`<div class="dpl-collage">${a.map(r=>`<img src="${l(r)}" alt="" loading="lazy" onerror="this.style.opacity=0">`).join("")}</div>`}var h=[],J=[],E=null,x=new Set,L=null;function M(e,a){let s=e.track_count||0,r=e.params?.season?G[e.params.season]||"\u{1F3B5}":q[e.type]||"\u{1F3B5}",p=e.type+JSON.stringify(e.params||null),i=e.cached&&e.tracks?R(e.tracks):`<div class="dpl-ph"><span>${r}</span></div>`,n=e.cached&&s>0?`<button class="dpl-play-btn" data-type="${l(e.type)}" data-params="${l(JSON.stringify(e.params||null))}" title="Speel af">\u25B6</button>`:"";return`<div class="dpl-card ${a?"is-gen":""} ${e.cached?"is-cached":""}"
    data-type="${l(e.type)}" data-params="${l(JSON.stringify(e.params||null))}" data-key="${l(p)}">
    <div class="dpl-thumb" role="button" tabindex="0">${i}${n}</div>
    <div class="dpl-body">
      <div class="dpl-name">${l(e.name)}</div>
      <div class="dpl-meta">
        ${e.cached?`<span class="dpl-badge dpl-ok">${s} tracks</span>`:'<span class="dpl-badge dpl-none">Niet gegenereerd</span>'}
        ${e.generated_at?`<span class="dpl-age">${P(e.generated_at)}</span>`:""}
      </div>
    </div>
    <div class="dpl-actions">
      <button class="dpl-btn dpl-gen-btn" data-type="${l(e.type)}"
        data-params="${l(JSON.stringify(e.params||null))}" title="Genereer opnieuw">
        ${a?'<span class="dpl-spin"></span>':"\u21BA"}
      </button>
    </div>
  </div>`}function O(e,a){I();let s=e.type==="discovery_weekly"||e.type==="release_radar",r=a.map((n,o)=>{let d=A(n.duration),c=n.cover_url?`<img src="${l(n.cover_url)}" alt="" loading="lazy" onerror="this.style.opacity=0">`:'<div class="dpl-tph">\u266A</div>',m=n.plex_key?`<button class="dpl-tplay" data-key="${l(n.plex_key)}">\u25B6</button>`:'<span class="dpl-disc">Ontdek</span>',w=n.reason?`<span class="dpl-reason">via ${l(n.reason)}</span>`:"";return`<div class="dpl-trow">
      <span class="dpl-tnum">${o+1}</span>
      <div class="dpl-tcover">${c}</div>
      <div class="dpl-tinfo">
        <div class="dpl-ttitle">${l(n.title||n.album||"\u2014")}</div>
        <div class="dpl-tsub">${l(n.artist)}${n.album?` \xB7 ${l(n.album)}`:""}${w}</div>
      </div>
      <span class="dpl-tdur">${d}</span>
      <div class="dpl-tact">${m}</div>
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
          <div class="dpl-tcount">${a.length} tracks</div>
          <div class="dpl-tlist" id="dpl-tlist">${r}</div>
        </div>
      </div>
    </div>`),L=document.getElementById("dpl-backdrop"),L.addEventListener("click",n=>{n.target===L&&I()}),document.getElementById("dpl-mclose").addEventListener("click",I);let i=n=>{n.key==="Escape"&&(I(),document.removeEventListener("keydown",i))};document.addEventListener("keydown",i),document.getElementById("dpl-play-all")?.addEventListener("click",()=>N(e.type,e.params)),document.getElementById("dpl-shuffle")?.addEventListener("click",()=>{let n=[...a].sort(()=>Math.random()-.5);document.getElementById("dpl-tlist").innerHTML=n.map((o,d)=>{let c=A(o.duration),m=o.cover_url?`<img src="${l(o.cover_url)}" alt="" loading="lazy">`:'<div class="dpl-tph">\u266A</div>',w=o.plex_key?`<button class="dpl-tplay" data-key="${l(o.plex_key)}">\u25B6</button>`:'<span class="dpl-disc">Ontdek</span>',t=o.reason?`<span class="dpl-reason">via ${l(o.reason)}</span>`:"";return`<div class="dpl-trow"><span class="dpl-tnum">${d+1}</span>
        <div class="dpl-tcover">${m}</div>
        <div class="dpl-tinfo"><div class="dpl-ttitle">${l(o.title||o.album||"\u2014")}</div>
        <div class="dpl-tsub">${l(o.artist)}${o.album?` \xB7 ${l(o.album)}`:""}${t}</div></div>
        <span class="dpl-tdur">${c}</span><div class="dpl-tact">${w}</div></div>`}).join(""),C()}),C()}function C(){document.querySelectorAll(".dpl-tplay").forEach(e=>{e.addEventListener("click",()=>W(e.dataset.key,e))})}function I(){L&&(L.remove(),L=null)}async function U(){let e=localStorage.getItem("plex_machine_id");if(e)return e;try{let a=await v("/api/plex/clients"),s=Array.isArray(a)?a:a.clients||[];if(s.length)return localStorage.setItem("plex_machine_id",s[0].machineId),s[0].machineId}catch{}return null}async function W(e,a){let s=await U();if(!s){alert("Geen actieve Plex-speler gevonden.");return}try{a?.classList.add("loading"),await v(`/api/plex/play?machineId=${encodeURIComponent(s)}&ratingKey=${encodeURIComponent(e)}`,{method:"POST"}),a?.classList.remove("loading"),a?.classList.add("played"),setTimeout(()=>a?.classList.remove("played"),3e3)}catch(r){a?.classList.remove("loading"),alert(`Afspelen mislukt: ${r.message}`)}}async function N(e,a){let s=await U();if(!s){alert("Geen actieve Plex-speler gevonden.");return}try{let r=a?Object.entries(a).map(([p,i])=>`${p}=${encodeURIComponent(i)}`).join("&"):"";await v(`/api/playlists/play/${e}?machineId=${encodeURIComponent(s)}${r?"&"+r:""}`,{method:"POST"})}catch(r){alert(`Afspelen mislukt: ${r.message}`)}}async function H(e,a,s){let r=e+JSON.stringify(a||null);if(x.has(r))return;x.add(r),s?.classList.add("is-gen");let p=s?.querySelector(".dpl-gen-btn");p&&(p.innerHTML='<span class="dpl-spin"></span>');try{let i=a?Object.entries(a).map(([d,c])=>`${d}=${encodeURIComponent(c)}`).join("&"):"",n=await v(`/api/playlists/generate/${e}?force=true${i?"&"+i:""}`),o=h.findIndex(d=>d.type===e&&JSON.stringify(d.params||null)===JSON.stringify(a||null));o>=0&&Object.assign(h[o],{cached:!0,track_count:n.track_count||n.tracks?.length||0,generated_at:n.generated_at,tracks:n.tracks}),Z(e,a,n)}catch(i){alert(`Generatie mislukt: ${i.message}`)}finally{x.delete(r),s?.classList.remove("is-gen"),p&&(p.innerHTML="\u21BA")}}function Z(e,a,s){let r=e+JSON.stringify(a||null),p=document.querySelector(`.dpl-card[data-key="${CSS.escape(r)}"]`);if(!p)return;let i=h.find(d=>d.type===e&&JSON.stringify(d.params||null)===JSON.stringify(a||null));if(!i)return;let n=document.createElement("div");n.innerHTML=M({...i,tracks:s.tracks},!1);let o=n.firstElementChild;p.replaceWith(o),D(o)}function D(e){e.querySelector(".dpl-thumb")?.addEventListener("click",async()=>{let a=e.dataset.type,s=JSON.parse(e.dataset.params||"null");if(!e.classList.contains("is-cached")){await H(a,s,e);return}try{let r=s?Object.entries(s).map(([n,o])=>`${n}=${encodeURIComponent(o)}`).join("&"):"",p=await v(`/api/playlists/generate/${a}${r?"?"+r:""}`),i=h.find(n=>n.type===a&&JSON.stringify(n.params||null)===JSON.stringify(s||null))||{type:a,name:a,params:s};O(i,p.tracks||[])}catch(r){alert(`Laden mislukt: ${r.message}`)}}),e.querySelector(".dpl-gen-btn")?.addEventListener("click",async a=>{a.stopPropagation(),await H(e.dataset.type,JSON.parse(e.dataset.params||"null"),e)}),e.querySelector(".dpl-play-btn")?.addEventListener("click",async a=>{a.stopPropagation(),await N(e.dataset.type,JSON.parse(e.dataset.params||"null"))})}var b=[];function Q(){let e=document.getElementById("dpl-seed-input"),a=document.getElementById("dpl-seed-add"),s=document.getElementById("dpl-custom-gen"),r=document.getElementById("dpl-seeds"),p=document.getElementById("dpl-custom-result"),i=document.getElementById("dpl-artists-dl"),n=()=>{r.innerHTML=b.map((c,m)=>`<span class="dpl-stag">${l(c)}<button class="dpl-srem" data-i="${m}">\u2715</button></span>`).join(""),s.disabled=!b.length,r.querySelectorAll(".dpl-srem").forEach(c=>{c.addEventListener("click",()=>{b.splice(+c.dataset.i,1),n()})})},o=()=>{let c=e?.value.trim();!c||b.includes(c)||b.length>=5||(b.push(c),e&&(e.value=""),n())};a?.addEventListener("click",o),e?.addEventListener("keydown",c=>{c.key==="Enter"&&o()});let d;e?.addEventListener("input",()=>{clearTimeout(d);let c=e.value.trim();c.length<2||(d=setTimeout(async()=>{try{let w=((await v(`/api/plex/search?q=${encodeURIComponent(c)}`)).artists||[]).map(t=>t.title||t.name);i&&(i.innerHTML=w.map(t=>`<option value="${l(t)}">`).join(""))}catch{}},250))}),s?.addEventListener("click",async()=>{if(b.length){s.disabled=!0,s.textContent="Genereren\u2026",p.innerHTML='<div class="dpl-loading"><span class="dpl-spin"></span> Even geduld\u2026</div>';try{let m=(await v(`/api/playlists/generate/custom?force=true&seeds=${encodeURIComponent(b.join(","))}`)).tracks||[];m.length?(p.innerHTML=`<div class="dpl-cres">
          <strong>${m.length} tracks</strong> gevonden \u2014
          <button class="dpl-btn dpl-primary" id="dpl-open-custom">Bekijk \u2192</button>
        </div>`,document.getElementById("dpl-open-custom")?.addEventListener("click",()=>{O({type:"custom",name:`Mix: ${b.slice(0,2).join(", ")}`,params:{seeds:b}},m)})):p.innerHTML='<p class="dpl-empty">Geen tracks gevonden.</p>'}catch(c){p.innerHTML=`<p class="dpl-err">Fout: ${l(c.message)}</p>`}finally{s.disabled=!1,s.textContent="Genereer Mix"}}})}async function X(e){h=e.catalog||[],J=e.genres||[],E=e.current_season;let a=h.filter(t=>["discovery_weekly","release_radar"].includes(t.type)),s=h.filter(t=>["daily_mix","forgotten_favorites","hidden_gems"].includes(t.type)),r=h.filter(t=>t.type==="seasonal"),p=h.filter(t=>t.type==="decade"),i=r.find(t=>t.params?.season===E),n=r.filter(t=>t.params?.season!==E),o=J.slice(0,12),d=[];try{let t=await v("/api/plex/playlists",{signal:k.tabAbort?.signal});d=(t?.playlists||t||[]).slice(0,8)}catch{}let c=a.map(t=>{let u=t.type+JSON.stringify(t.params||null),y=x.has(u),g=q[t.type]||"\u{1F3B5}",f=t.cached&&t.tracks?R(t.tracks):`<div class="dpl-ph big"><span>${g}</span></div>`;return`<div class="dpl-hero-card ${y?"is-gen":""} ${t.cached?"is-cached":""}"
      data-type="${l(t.type)}" data-params="${l(JSON.stringify(t.params||null))}" data-key="${l(u)}">
      <div class="dpl-hero-bg">${f}</div>
      <div class="dpl-hero-cnt">
        <span class="dpl-hero-icon">${g}</span>
        <h2 class="dpl-hero-title">${l(t.name)}</h2>
        <p class="dpl-hero-desc">${l(t.description||"")}</p>
        <div class="dpl-hero-meta">
          ${t.cached?`<span class="dpl-badge dpl-ok">${t.track_count} tracks</span>`:'<span class="dpl-badge dpl-none">Nog niet gegenereerd</span>'}
          ${t.generated_at?`<span class="dpl-age">${P(t.generated_at)}</span>`:""}
        </div>
        <div class="dpl-hero-btns">
          ${t.cached&&t.track_count>0?`<button class="dpl-btn dpl-primary dpl-hero-play" data-type="${l(t.type)}" data-params="null">\u25B6 Speel Af</button>`:""}
          <button class="dpl-btn dpl-hero-gen" data-type="${l(t.type)}" data-params="${l(JSON.stringify(t.params||null))}">
            ${y?'<span class="dpl-spin"></span> Bezig\u2026':t.cached?"\u21BA Vernieuw":"\u26A1 Genereer"}
          </button>
        </div>
      </div>
    </div>`}).join(""),m=t=>t.map(u=>{let y=u.type+JSON.stringify(u.params||null);return M(u,x.has(y))}).join(""),w=d.length?`
    <section class="dpl-section">
      <h2 class="dpl-stitle">\u{1F4C2} Plex Afspeellijsten</h2>
      <div class="dpl-scroll-row">
        ${d.map(t=>{let u=t.thumb?j(t.thumb,200):null;return`<button class="dpl-plex-card" data-id="${l(t.ratingKey)}" data-title="${l(t.title)}" aria-label="${l(t.title)}">
            <div class="dpl-plex-art">${u?`<img src="${l(u)}" alt="" loading="lazy">`:'<div class="dpl-ph"><span>\u266B</span></div>'}</div>
            <div class="dpl-plex-name">${l(t.title)}</div>
            <div class="dpl-plex-meta">${t.trackCount||0} nrs${t.duration?" \xB7 "+K(t.duration):""}</div>
          </button>`}).join("")}
      </div>
    </section>`:"";document.getElementById("content").innerHTML=`
    <div class="dpl-page">
      <div class="dpl-hdr">
        <h1 class="dpl-page-title">\u{1F3B5} Discovery Engine</h1>
        <p class="dpl-page-sub">Gepersonaliseerde playlists op basis van jouw luisterdata + Plex-bibliotheek</p>
      </div>

      <section class="dpl-section dpl-hero-section">
        ${c}
      </section>

      <section class="dpl-section">
        <h2 class="dpl-stitle">Jouw Mix</h2>
        <div class="dpl-grid">${m(s)}</div>
      </section>

      ${i?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">${G[E]||"\u{1F338}"} Seizoen: ${F[E]||E}</h2>
        <div class="dpl-grid dpl-grid-1">${M(i,x.has(i.type+JSON.stringify(i.params)))}</div>
      </section>`:""}

      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F4C5} Per Decennium</h2>
        <div class="dpl-scroll-row">${m(p)}</div>
      </section>

      ${o.length?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F3B8} Genres</h2>
        <div class="dpl-scroll-row">
          ${o.map(t=>{let u={genre:t},y="genre"+JSON.stringify(u),g=h.find($=>$.type==="genre"&&$.params?.genre===t),f={type:"genre",name:Y(t),description:`Jouw tracks in het ${t} genre`,params:u,cached:!!g?.cached,track_count:g?.track_count||0,generated_at:g?.generated_at||null,tracks:g?.tracks||null};return M(f,x.has(y))}).join("")}
        </div>
      </section>`:""}

      ${n.length?`
      <section class="dpl-section">
        <h2 class="dpl-stitle">\u{1F5D3}\uFE0F Andere Seizoenen</h2>
        <div class="dpl-scroll-row">${m(n)}</div>
      </section>`:""}

      ${w}

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

    ${ee()}`,document.querySelectorAll(".dpl-hero-card").forEach(t=>{t.querySelector(".dpl-hero-gen")?.addEventListener("click",async()=>{let u=t.dataset.type,y=JSON.parse(t.dataset.params||"null"),g=t.querySelector(".dpl-hero-gen"),f=u+JSON.stringify(y||null);if(!x.has(f)){x.add(f),g&&(g.classList.add("loading"),g.innerHTML='<span class="dpl-spin"></span> Bezig\u2026');try{let $=y?Object.entries(y).map(([z,V])=>`${z}=${encodeURIComponent(V)}`).join("&"):"",_=await v(`/api/playlists/generate/${u}?force=true${$?"&"+$:""}`),S=h.find(z=>z.type===u)||{type:u,name:u,params:y};Object.assign(S,{cached:!0,track_count:_.track_count||0,tracks:_.tracks}),O(S,_.tracks||[])}catch($){alert(`Generatie mislukt: ${$.message}`)}finally{x.delete(f),g&&(g.classList.remove("loading"),g.innerHTML="\u21BA Vernieuw")}}}),t.querySelector(".dpl-hero-play")?.addEventListener("click",async u=>{u.stopPropagation(),await N(t.dataset.type,JSON.parse(t.dataset.params||"null"))}),t.addEventListener("click",async u=>{if(u.target.closest("button")||!t.classList.contains("is-cached"))return;let y=t.dataset.type,g=JSON.parse(t.dataset.params||"null");try{let f=g?Object.entries(g).map(([S,z])=>`${S}=${encodeURIComponent(z)}`).join("&"):"",$=await v(`/api/playlists/generate/${y}${f?"?"+f:""}`),_=h.find(S=>S.type===y)||{type:y,name:y,params:g};O(_,$.tracks||[])}catch{}})}),document.querySelectorAll(".dpl-card").forEach(D),document.querySelectorAll(".dpl-plex-card").forEach(t=>{t.addEventListener("click",()=>{k.viewParams={id:t.dataset.id,title:t.dataset.title},T("playlist-detail")})}),Q()}function ee(){return`<style>
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
</style>`}async function se(){let e=document.getElementById("content");if(e){e.innerHTML=`<div style="padding:2rem;text-align:center;color:var(--color-secondary)">
    <span style="display:inline-block;width:20px;height:20px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:dpl-rot .6s linear infinite;vertical-align:middle"></span>
    <span style="margin-left:.5rem">Playlists laden\u2026</span>
  </div>
  <style>@keyframes dpl-rot{to{transform:rotate(360deg)}}</style>`;try{let a=await v("/api/playlists",{signal:k.tabAbort?.signal});await X(a)}catch(a){if(a.name==="AbortError")return;e.innerHTML=`<div style="padding:2rem;text-align:center">
      <p style="color:#e05">Playlists konden niet worden geladen: ${l(a.message)}</p>
      <button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1rem;cursor:pointer;border-radius:6px;border:none;background:var(--color-border);color:var(--color-text)">Opnieuw laden</button>
    </div>`}}}async function re(){let e=document.getElementById("content");if(!e)return;let a=k.viewParams?.id,s=k.viewParams?.title||"Afspeellijst";if(!a){e.innerHTML='<div class="error-box">\u26A0\uFE0F Geen afspeellijst geselecteerd.</div>';return}let r=k.previousView||"playlists";e.innerHTML=`
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
    </div>`,document.getElementById("playlist-back-btn")?.addEventListener("click",()=>T(r));try{let i=(await v(`/api/plex/playlists/${encodeURIComponent(a)}/tracks`,{signal:k.tabAbort?.signal}))?.tracks||[],n=document.getElementById("playlist-detail-sub");if(n){let d=i.reduce((c,m)=>c+(m.duration||0),0);n.textContent=`${B(i.length)} nummers \xB7 ${Math.round(d/6e4)} min`}document.getElementById("playlist-play-all")?.removeAttribute("disabled");try{let d=await v("/api/plex/playlists",{signal:k.tabAbort?.signal}),c=(d?.playlists||d||[]).find(m=>String(m.ratingKey)===String(a));if(c?.thumb){let m=document.getElementById("playlist-detail-art");m&&(m.innerHTML=`<img src="${l(j(c.thumb,240))}" alt="${l(s)}" class="playlist-detail-art-img" loading="lazy">`)}}catch{}let o=document.getElementById("playlist-tracks");if(!o)return;if(!i.length){o.innerHTML='<div class="playlists-empty">Deze afspeellijst bevat geen nummers.</div>';return}o.innerHTML=`
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
          ${i.map((d,c)=>{let m=d.thumb?j(d.thumb,48):null;return`<tr class="playlist-track-row">
              <td class="plt-num">${c+1}</td>
              <td class="plt-title">
                <div class="plt-title-inner">
                  ${m?`<img src="${l(m)}" alt="" class="plt-thumb" loading="lazy">`:'<div class="plt-thumb plt-thumb-ph"></div>'}
                  <span>${l(d.title)}</span>
                </div>
              </td>
              <td class="plt-artist">${d.artist?`<button class="plt-artist-link" data-artist="${l(d.artist)}">${l(d.artist)}</button>`:"\u2014"}</td>
              <td class="plt-album">${l(d.album||"\u2014")}</td>
              <td class="plt-dur">${A(d.duration)}</td>
            </tr>`}).join("")}
        </tbody>
      </table>`}catch(p){if(p.name==="AbortError")return;let i=document.getElementById("playlist-tracks");i&&(i.innerHTML=`<div class="error-box">\u26A0\uFE0F Laden mislukt: ${l(p.message)}</div>`)}}export{re as loadPlaylistDetail,se as loadPlaylists};
