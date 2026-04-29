import{h as n,z as v}from"./chunk-HCN2ZK5I.js";var d=[{id:"global",label:"Global",color:"#888",icon:"\u2699\uFE0F",fields:[{key:"general.download_path",label:"Download pad",type:"text",placeholder:"/music"},{key:"general.download_quality",label:"Kwaliteit",type:"select",options:["hifi","lossless","high","low"]},{key:"general.search_limit",label:"Zoeklimiet",type:"number",min:1,max:100},{key:"formatting.album_format",label:"Album formaat",type:"text",placeholder:"{artist}/{name}{explicit}"},{key:"formatting.track_filename_format",label:"Track formaat",type:"text",placeholder:"{track_number}. {name}"},{key:"covers.embed_cover",label:"Hoes insluiten",type:"toggle"},{key:"covers.main_resolution",label:"Hoes resolutie",type:"number",min:300,max:3e3},{key:"lyrics.embed_lyrics",label:"Songtekst insluiten",type:"toggle"},{key:"lyrics.save_synced_lyrics",label:"Gesynchroniseerde tekst opslaan",type:"toggle"}],credentialKeys:[],description:"Algemene download- en formatteringsinstellingen."},{id:"tidal",label:"Tidal",color:"#33ffe7",icon:"\u{1F3B5}",settingsKey:"modules.tidal",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["atmos","hifi","lossless","high","low"]},{key:"tv_atmos_token",label:"TV Atmos Token",type:"text",placeholder:"Aanbevolen: laat leeg voor auto-login"},{key:"tv_atmos_secret",label:"TV Atmos Secret",type:"password",placeholder:""},{key:"mobile_atmos_hires_token",label:"Mobile Atmos/HiRes Token",type:"text",placeholder:""},{key:"mobile_hires_token",label:"Mobile HiRes Token",type:"text",placeholder:""}],credentialKeys:["tv_atmos_token","tv_atmos_secret","mobile_atmos_hires_token","mobile_hires_token"],description:"Bij de eerste download opent OrpheusDL automatisch een browser voor Tidal-inlog. Tokens zijn optioneel.",info:"\u24D8 Je hoeft geen tokens in te vullen \u2014 bij de eerste download wordt automatisch een browservenster geopend voor inloggen via Tidal."},{id:"qobuz",label:"Qobuz",color:"#0070ef",icon:"\u{1F3B6}",settingsKey:"modules.qobuz",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["hifi","lossless","high"]},{key:"username",label:"E-mailadres",type:"text",placeholder:"jouw@email.com"},{key:"password",label:"Wachtwoord",type:"password",placeholder:""},{key:"user_id",label:"Gebruikers-ID",type:"text",placeholder:"alternatief voor email/wachtwoord"},{key:"auth_token",label:"Auth token",type:"password",placeholder:"alternatief voor email/wachtwoord"},{key:"app_id",label:"App ID",type:"text",placeholder:"798273057",recommended:"798273057"},{key:"app_secret",label:"App Secret",type:"text",placeholder:"abb21364945c0583309667d13ca3d93a",recommended:"abb21364945c0583309667d13ca3d93a"}],credentialKeys:["username","password","user_id","auth_token"],description:"Qobuz-account credentials. App ID en secret zijn ingevuld met standaardwaarden."},{id:"deezer",label:"Deezer",color:"#a238ff",icon:"\u{1F3B8}",settingsKey:"modules.deezer",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["lossless","high","low"]},{key:"email",label:"E-mailadres",type:"text",placeholder:"jouw@email.com"},{key:"password",label:"Wachtwoord",type:"password",placeholder:""},{key:"arl",label:"ARL token",type:"password",placeholder:"alternatief voor email/wachtwoord"},{key:"client_id",label:"Client ID",type:"text",placeholder:"613143",recommended:"613143"},{key:"client_secret",label:"Client Secret",type:"text",placeholder:"e635f790edfbc8f7574447214e3271e7",recommended:"e635f790edfbc8f7574447214e3271e7"},{key:"bf_secret",label:"BF Secret",type:"text",placeholder:"g93bsW9bwfo79ml6",recommended:"g93bsW9bwfo79ml6"}],credentialKeys:["email","password","arl"],description:"Deezer-account credentials. Je kunt inloggen met email+wachtwoord of alleen een ARL-token."},{id:"spotify",label:"Spotify",color:"#1cc659",icon:"\u{1F3A7}",settingsKey:"modules.spotify",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["high","low"]},{key:"username",label:"Gebruikersnaam",type:"text",placeholder:"jouw Spotify-gebruikersnaam"},{key:"client_id",label:"Client ID",type:"text",placeholder:"van developer.spotify.com"},{key:"client_secret",label:"Client Secret",type:"password",placeholder:"van developer.spotify.com"}],credentialKeys:["username","client_id","client_secret"],description:"Maak een app op developer.spotify.com en voeg de redirect URI <code>http://127.0.0.1:4381/login</code> toe.",info:'\u24D8 Maak een app aan op <a href="https://developer.spotify.com" target="_blank" rel="noopener">developer.spotify.com</a> en voeg redirect URI <code>http://127.0.0.1:4381/login</code> toe.'},{id:"soundcloud",label:"SoundCloud",color:"#ff5502",icon:"\u2601\uFE0F",settingsKey:"modules.soundcloud",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["high"]},{key:"web_access_token",label:"OAuth token",type:"password",placeholder:"haal op uit browser cookies na inloggen"}],credentialKeys:["web_access_token"],description:"Haal de OAuth-token op uit je browsercookies na inloggen op soundcloud.com. Vereist een Go+-abonnement.",info:'\u24D8 Haal het OAuth-token op uit je browsercookies na inloggen op <a href="https://soundcloud.com" target="_blank" rel="noopener">soundcloud.com</a>. Vereist een SoundCloud Go+-abonnement.'},{id:"applemusic",label:"Apple Music",color:"#FA586A",icon:"\u{1F34E}",settingsKey:"modules.applemusic",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["high"]},{key:"cookies_path",label:"Cookies bestand",type:"text",placeholder:"./config/cookies.txt"}],credentialKeys:["cookies_path"],description:"Exporteer je cookies als cookies.txt vanuit je browser na inloggen op music.apple.com.",info:'\u24D8 Exporteer cookies als <code>cookies.txt</code> vanuit een browser-extensie na inloggen op <a href="https://music.apple.com" target="_blank" rel="noopener">music.apple.com</a>. Sla het bestand op als <code>./config/cookies.txt</code>.'},{id:"beatport",label:"Beatport",color:"#00ff89",icon:"\u{1F39B}\uFE0F",settingsKey:"modules.beatport",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["lossless","high","low"]},{key:"username",label:"Gebruikersnaam",type:"text",placeholder:"jouw Beatport-email"},{key:"password",label:"Wachtwoord",type:"password",placeholder:""}],credentialKeys:["username","password"],description:"Vereist een Beatport Professional-abonnement."},{id:"beatsource",label:"Beatsource",color:"#16a8f4",icon:"\u{1F39A}\uFE0F",settingsKey:"modules.beatsource",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["lossless","high","low"]},{key:"username",label:"Gebruikersnaam",type:"text",placeholder:"jouw Beatsource-email"},{key:"password",label:"Wachtwoord",type:"password",placeholder:""}],credentialKeys:["username","password"],description:"Vereist een Beatsource Pro-abonnement."},{id:"youtube",label:"YouTube",color:"#FF0000",icon:"\u25B6\uFE0F",settingsKey:"modules.youtube",fields:[{key:"quality_format",label:"Kwaliteit",type:"select",options:["lossless","high","low"]},{key:"cookies_path",label:"Cookies bestand",type:"text",placeholder:"./config/youtube-cookies.txt"}],credentialKeys:["cookies_path"],description:"Exporteer cookies als youtube-cookies.txt vanuit een incognito-sessie op youtube.com.",info:"\u24D8 Exporteer cookies als <code>youtube-cookies.txt</code> vanuit een incognito-sessie op YouTube. Sla het bestand op als <code>./config/youtube-cookies.txt</code>."}],w=null,p="global",g=!1;function f(o,t){return t.split(".").reduce((e,a)=>e&&e[a]!==void 0?e[a]:"",o)}function S(o,t,e){let a=t.split("."),l=o;for(let s=0;s<a.length-1;s++)(!l[a[s]]||typeof l[a[s]]!="object")&&(l[a[s]]={}),l=l[a[s]];l[a[a.length-1]]=e}function y(o,t){if(o.id==="global")return!0;let e=f(t,o.settingsKey)||{};return o.credentialKeys.some(a=>{let l=e[a];return l&&String(l).trim().length>0})}function K(o,t){let e={};return o.fields.forEach(a=>{let l=t.querySelector(`[data-field="${a.key}"]`);l&&(a.type==="toggle"?e[a.key]=l.checked:a.type==="number"?e[a.key]=Number(l.value)||0:e[a.key]=l.value)}),e}function _(o){return`
    <div class="osm-tabs" role="tablist">
      ${d.map(t=>{let e=y(t,o),a=t.id===p;return`
          <button class="osm-tab${a?" active":""}"
                  role="tab"
                  aria-selected="${a}"
                  data-tab="${t.id}"
                  title="${n(t.label)}">
            <span class="osm-tab-dot" style="background:${t.color}" aria-hidden="true"></span>
            <span class="osm-tab-label">${n(t.label)}</span>
            ${t.id!=="global"?`<span class="osm-tab-badge ${e?"configured":"unconfigured"}"
              title="${e?"Geconfigureerd":"Niet ingesteld"}"
              aria-label="${e?"Geconfigureerd":"Niet ingesteld"}">
              ${e?"\u2713":"\u25CB"}
            </span>`:""}
          </button>`}).join("")}
    </div>`}function $(o,t){let e=o.settingsKey,a=e?f(t,e)||{}:t.global||{},l=o.info?`<div class="osm-info-box">${o.info}</div>`:"",s=o.fields.map(r=>{let i=o.id==="global"?f(t.global||{},r.key):a[r.key],m=i??(r.recommended||""),u;if(r.type==="toggle"){let c=m===!0||m==="true";u=`
        <label class="osm-toggle-label">
          <input type="checkbox" class="osm-toggle-input" data-field="${n(r.key)}" ${c?"checked":""}>
          <span class="osm-toggle-track"><span class="osm-toggle-thumb"></span></span>
        </label>`}else if(r.type==="select")u=`
        <select class="osm-select" data-field="${n(r.key)}">
          ${(r.options||[]).map(c=>`<option value="${n(c)}" ${String(m)===c?"selected":""}>${n(c)}</option>`).join("")}
        </select>`;else{let c=r.type==="password";u=`
        <div class="osm-input-wrap">
          <input type="${c?"password":r.type==="number"?"number":"text"}"
                 class="osm-input"
                 data-field="${n(r.key)}"
                 value="${n(String(m))}"
                 placeholder="${n(r.placeholder||"")}"
                 ${r.min!==void 0?`min="${r.min}"`:""}
                 ${r.max!==void 0?`max="${r.max}"`:""}>
          ${c?`<button type="button" class="osm-reveal-btn" data-target="${n(r.key)}" aria-label="Wachtwoord tonen/verbergen">\u{1F441}</button>`:""}
          ${r.recommended?`<button type="button" class="osm-fill-btn" data-field="${n(r.key)}" data-value="${n(r.recommended)}" title="Vul aanbevolen waarde in">\u21A9</button>`:""}
        </div>`}return`
      <div class="osm-field">
        <label class="osm-field-label">${n(r.label)}</label>
        ${u}
      </div>`}).join("");return`
    <div class="osm-tab-content" role="tabpanel">
      <p class="osm-platform-desc">${o.description}</p>
      ${l}
      <div class="osm-fields">
        ${s}
      </div>
    </div>`}function j(o){let t=d.find(e=>e.id===p)||d[0];return`
    <div class="osm-overlay" id="osm-overlay" role="dialog" aria-modal="true" aria-label="OrpheusDL Instellingen">
      <div class="osm-modal">
        <div class="osm-header">
          <div class="osm-header-left">
            <span class="osm-logo">OrpheusDL Instellingen</span>
          </div>
          <div class="osm-header-right">
            <button class="osm-save-btn" id="osm-save-btn" type="button">Opslaan</button>
            <button class="osm-close-btn" id="osm-close-btn" type="button" aria-label="Sluiten">\u2715</button>
          </div>
        </div>

        ${_(o)}

        <div class="osm-body" id="osm-body">
          ${$(t,o)}
        </div>

        <div class="osm-footer">
          <span class="osm-save-status" id="osm-save-status"></span>
          <div class="osm-footer-badges">
            ${d.filter(e=>e.id!=="global").map(e=>{let a=y(e,o);return`<span class="osm-footer-badge ${a?"configured":"unconfigured"}" title="${n(e.label)}">
                <span class="osm-fb-dot" style="background:${e.color}"></span>
                ${n(e.label)} ${a?"\u2713":"\u25CB"}
              </span>`}).join("")}
          </div>
        </div>
      </div>
    </div>`}function z(o){let t=document.getElementById("osm-overlay");t&&(document.getElementById("osm-close-btn")?.addEventListener("click",b),t.addEventListener("click",e=>{e.target===t&&b()}),document.addEventListener("keydown",E),t.querySelectorAll(".osm-tab").forEach(e=>{e.addEventListener("click",()=>{h(o),p=e.dataset.tab,x(o)})}),document.getElementById("osm-save-btn")?.addEventListener("click",()=>T(o)),t.querySelectorAll(".osm-reveal-btn").forEach(e=>{e.addEventListener("click",()=>{let a=e.dataset.target,l=t.querySelector(`[data-field="${a}"]`);l&&(l.type=l.type==="password"?"text":"password")})}),t.querySelectorAll(".osm-fill-btn").forEach(e=>{e.addEventListener("click",()=>{let a=e.dataset.field,l=e.dataset.value,s=t.querySelector(`[data-field="${a}"]`);s&&(s.value=l)})}))}function E(o){o.key==="Escape"&&b()}function h(o){let t=d.find(l=>l.id===p);if(!t)return;let e=document.getElementById("osm-body");if(!e)return;let a=K(t,e);if(t.id==="global")o.global||(o.global={}),Object.entries(a).forEach(([l,s])=>{S(o.global,l,s)});else{let l=(t.settingsKey||"").split("."),s=o;for(let i=0;i<l.length-1;i++)s[l[i]]||(s[l[i]]={}),s=s[l[i]];let r=l[l.length-1];s[r]||(s[r]={}),Object.assign(s[r],a)}}function x(o){let t=document.getElementById("osm-overlay");if(!t)return;let e=t.querySelector(".osm-tabs");e&&(e.outerHTML=_(o));let a=document.getElementById("osm-body");if(a){let s=d.find(r=>r.id===p)||d[0];a.innerHTML=$(s,o)}let l=t.querySelector(".osm-footer-badges");l&&(l.innerHTML=d.filter(s=>s.id!=="global").map(s=>{let r=y(s,o);return`<span class="osm-footer-badge ${r?"configured":"unconfigured"}" title="${n(s.label)}">
        <span class="osm-fb-dot" style="background:${s.color}"></span>
        ${n(s.label)} ${r?"\u2713":"\u25CB"}
      </span>`}).join("")),t.querySelectorAll(".osm-tab").forEach(s=>{s.addEventListener("click",()=>{h(o),p=s.dataset.tab,x(o)})}),t.querySelectorAll(".osm-reveal-btn").forEach(s=>{s.addEventListener("click",()=>{let r=s.dataset.target,i=t.querySelector(`[data-field="${r}"]`);i&&(i.type=i.type==="password"?"text":"password")})}),t.querySelectorAll(".osm-fill-btn").forEach(s=>{s.addEventListener("click",()=>{let r=t.querySelector(`[data-field="${s.dataset.field}"]`);r&&(r.value=s.dataset.value)})})}async function T(o){if(g)return;g=!0,h(o);let t=document.getElementById("osm-save-btn"),e=document.getElementById("osm-save-status");t&&(t.disabled=!0,t.textContent="Opslaan\u2026"),e&&(e.textContent="",e.className="osm-save-status");try{let a=await fetch("/api/orpheus/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!a.ok){let l=await a.json().catch(()=>({}));throw new Error(l.error||`Serverfout ${a.status}`)}e&&(e.textContent="\u2713 Opgeslagen",e.className="osm-save-status success"),w=o,x(o)}catch(a){e&&(e.textContent=`\u2717 Fout: ${a.message}`,e.className="osm-save-status error")}finally{g=!1,t&&(t.disabled=!1,t.textContent="Opslaan")}}function b(){document.removeEventListener("keydown",E);let o=document.getElementById("osm-overlay");o&&o.remove()}async function B(){b();let o=document.createElement("div");o.id="osm-loading",o.innerHTML=`
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center">
      <div style="color:var(--color-text-primary,#fff);font-size:14px">Instellingen laden\u2026</div>
    </div>`,document.body.appendChild(o);let t;try{t=await v("/api/orpheus/settings")}catch(a){o.remove(),alert(`Kan OrpheusDL instellingen niet laden: ${a.message}`);return}o.remove(),w=t;let e=document.createElement("div");e.innerHTML=j(t),document.body.appendChild(e.firstElementChild),A(),z(t)}var k=!1;function A(){if(k)return;k=!0;let o=document.createElement("style");o.textContent=`
/* \u2500\u2500 OrpheusDL Settings Modal \u2500\u2500 */
.osm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.65);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  backdrop-filter: blur(4px);
}
.osm-modal {
  background: var(--color-surface, #1a1a1a);
  border: 1px solid var(--color-border, #333);
  border-radius: 12px;
  width: 100%;
  max-width: 760px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
}
.osm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border, #333);
  flex-shrink: 0;
}
.osm-logo {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.01em;
}
.osm-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.osm-save-btn {
  background: var(--color-accent, #7c3aed);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity .15s;
}
.osm-save-btn:hover { opacity: .85; }
.osm-save-btn:disabled { opacity: .5; cursor: not-allowed; }
.osm-close-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary, #888);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
}
.osm-close-btn:hover { color: var(--color-text-primary, #fff); }

/* \u2500\u2500 Tabbar \u2500\u2500 */
.osm-tabs {
  display: flex;
  overflow-x: auto;
  gap: 2px;
  padding: 10px 16px 0;
  border-bottom: 1px solid var(--color-border, #333);
  flex-shrink: 0;
  scrollbar-width: none;
}
.osm-tabs::-webkit-scrollbar { display: none; }
.osm-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border: none;
  background: none;
  color: var(--color-text-secondary, #888);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  white-space: nowrap;
  position: relative;
  transition: color .15s, background .15s;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.osm-tab:hover { color: var(--color-text-primary, #fff); background: var(--color-surface-hover, #252525); }
.osm-tab.active {
  color: var(--color-text-primary, #fff);
  border-bottom-color: var(--color-accent, #7c3aed);
}
.osm-tab-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.osm-tab-badge {
  font-size: 10px;
  line-height: 1;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 600;
}
.osm-tab-badge.configured  { background: rgba(34,197,94,.18); color: #22c55e; }
.osm-tab-badge.unconfigured { background: rgba(120,120,120,.15); color: #777; }

/* \u2500\u2500 Body / velden \u2500\u2500 */
.osm-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.osm-tab-content {}
.osm-platform-desc {
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  margin: 0 0 12px;
  line-height: 1.5;
}
.osm-info-box {
  background: rgba(124,58,237,.12);
  border: 1px solid rgba(124,58,237,.3);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary, #aaa);
  margin-bottom: 16px;
  line-height: 1.5;
}
.osm-info-box a { color: var(--color-accent, #a78bfa); }
.osm-info-box code { background: rgba(255,255,255,.1); padding: 1px 4px; border-radius: 3px; font-family: monospace; }
.osm-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 500px) {
  .osm-fields { grid-template-columns: 1fr; }
}
.osm-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.osm-field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary, #888);
  text-transform: uppercase;
  letter-spacing: .04em;
}
.osm-input, .osm-select {
  background: var(--color-surface-elevated, #222);
  border: 1px solid var(--color-border, #333);
  border-radius: 6px;
  color: var(--color-text-primary, #fff);
  font-size: 13px;
  padding: 7px 10px;
  width: 100%;
  outline: none;
  transition: border-color .15s;
  box-sizing: border-box;
}
.osm-input:focus, .osm-select:focus { border-color: var(--color-accent, #7c3aed); }
.osm-input-wrap { position: relative; display: flex; align-items: center; }
.osm-input-wrap .osm-input { padding-right: 32px; }
.osm-reveal-btn, .osm-fill-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary, #666);
  padding: 2px 3px;
  line-height: 1;
}
.osm-fill-btn { right: 28px; font-size: 11px; color: var(--color-accent, #a78bfa); }
.osm-reveal-btn:hover, .osm-fill-btn:hover { opacity: .8; }
/* Toggle */
.osm-toggle-label { display: flex; align-items: center; cursor: pointer; width: fit-content; }
.osm-toggle-input { display: none; }
.osm-toggle-track {
  width: 36px;
  height: 20px;
  background: var(--color-border, #444);
  border-radius: 10px;
  position: relative;
  transition: background .2s;
}
.osm-toggle-input:checked + .osm-toggle-track { background: var(--color-accent, #7c3aed); }
.osm-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.3);
}
.osm-toggle-input:checked + .osm-toggle-track .osm-toggle-thumb { transform: translateX(16px); }

/* \u2500\u2500 Footer \u2500\u2500 */
.osm-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--color-border, #333);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.osm-save-status {
  font-size: 12px;
  min-width: 80px;
}
.osm-save-status.success { color: #22c55e; }
.osm-save-status.error   { color: #ef4444; }
.osm-footer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.osm-footer-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 500;
}
.osm-footer-badge.configured  { background: rgba(34,197,94,.12); color: #22c55e; }
.osm-footer-badge.unconfigured { background: rgba(120,120,120,.1); color: #666; }
.osm-fb-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* \u2500\u2500 Sidebar settings-knop \u2500\u2500 */
.ssp-orpheus-settings-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: var(--color-surface-elevated, rgba(124,58,237,.1));
  border: 1px solid rgba(124,58,237,.25);
  border-radius: 6px;
  color: var(--color-text-primary, #ccc);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background .15s, border-color .15s;
}
.ssp-orpheus-settings-btn:hover {
  background: rgba(124,58,237,.2);
  border-color: rgba(124,58,237,.45);
}
`,document.head.appendChild(o)}export{B as a};
