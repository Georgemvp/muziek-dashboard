import{h as i,x as s}from"./chunk-NGNPS5HK.js";import"./chunk-2BMKGNH5.js";var E=[{value:"schedule",label:"Cron expressie"},{value:"daily",label:"Dagelijks tijdstip"},{value:"weekly",label:"Wekelijks tijdstip"},{value:"interval",label:"Interval (elke X tijd)"},{value:"event",label:"Event (event bus)"}],T=[{value:"refresh_discovery",label:"Refresh Discovery"},{value:"refresh_gaps",label:"Refresh Gaps"},{value:"refresh_releases",label:"Refresh Releases"},{value:"generate_playlist",label:"Genereer Playlist"},{value:"process_wishlist",label:"Verwerk Wishlist"},{value:"scan_library",label:"Plex Library Scan"},{value:"scan_watchlist",label:"Scan Watchlist (nieuwe releases)"},{value:"cache_discovery_rebuild",label:"Herbouw Cache Discovery"},{value:"maintenance_scan",label:"Maintenance Scan"},{value:"custom_endpoint",label:"Custom API Endpoint"}],x=[{value:"notify_discord",label:"Discord notificatie"},{value:"notify_telegram",label:"Telegram notificatie"},{value:"notify_pushbullet",label:"Pushbullet notificatie"},{value:"fire_signal",label:"Vuur signaal af (chain)"},{value:"play_chime",label:"Speel chime af (frontend)"}],B=[{value:"daily_mix",label:"Daily Mix"},{value:"discovery_weekly",label:"Discovery Weekly"},{value:"release_radar",label:"Release Radar"},{value:"forgotten_favorites",label:"Forgotten Favorites"},{value:"hidden_gems",label:"Hidden Gems"}],I=[{value:"mon",label:"Maandag"},{value:"tue",label:"Dinsdag"},{value:"wed",label:"Woensdag"},{value:"thu",label:"Donderdag"},{value:"fri",label:"Vrijdag"},{value:"sat",label:"Zaterdag"},{value:"sun",label:"Zondag"}],u=[],v=[],h=null,r=null,c=new Set;async function G(e){h=e,h.innerHTML=`
    <div class="auto-view">
      <div class="auto-header">
        <div class="auto-header-left">
          <h1 class="auto-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            Automatisering
          </h1>
          <span class="auto-count" id="auto-count">0 automations</span>
        </div>
        <div class="auto-header-actions">
          <div class="auto-pipelines-wrapper">
            <button class="btn btn-secondary" id="auto-pipelines-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              Pipelines
            </button>
            <div class="auto-pipelines-dropdown" id="auto-pipelines-dropdown" hidden></div>
          </div>
          <button class="btn btn-primary" id="auto-new-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nieuw
          </button>
        </div>
      </div>

      <div class="auto-list" id="auto-list">
        <div class="auto-loading">
          <div class="spinner"></div>
          <span>Automations laden\u2026</span>
        </div>
      </div>
    </div>
  `,S(),await d()}async function d(){try{let[e,t]=await Promise.all([s("/api/automations"),s("/api/automations/pipelines")]);u=e.automations||[],v=t.pipelines||[],m(),A(),document.getElementById("auto-count").textContent=`${u.length} automation${u.length!==1?"s":""}`}catch(e){document.getElementById("auto-list").innerHTML=`<div class="auto-error">\u26A0 Kon automations niet laden: ${i(e.message)}</div>`}}function m(){let e=document.getElementById("auto-list");if(!u.length){e.innerHTML=`
      <div class="auto-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".3"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        <p>Geen automations gevonden.</p>
        <p>Maak er een aan of installeer een pipeline.</p>
      </div>
    `;return}let t={};for(let a of u){let o=a.group_name||"Standaard";t[o]||(t[o]=[]),t[o].push(a)}e.innerHTML=Object.entries(t).map(([a,o])=>`
    <div class="auto-group">
      <div class="auto-group-header">${i(a)}</div>
      <div class="auto-group-items">
        ${o.map(L).join("")}
      </div>
    </div>
  `).join(""),e.querySelectorAll("[data-action]").forEach(a=>{a.addEventListener("click",M)})}function L(e){let t=e.last_run?`<span class="auto-meta-value ${e.last_status==="error"?"auto-meta-error":"auto-meta-ok"}">${$(e.last_run)}</span>`:'<span class="auto-meta-value auto-meta-muted">Nog niet gedraaid</span>',a=e.enabled?'<span class="auto-status-dot auto-status-enabled" title="Ingeschakeld"></span>':'<span class="auto-status-dot auto-status-disabled" title="Uitgeschakeld"></span>',o=c.has(e.id);return`
    <div class="auto-card ${e.enabled?"":"auto-card-disabled"}" data-id="${e.id}">
      <div class="auto-card-main">
        <div class="auto-card-top">
          ${a}
          <span class="auto-card-name">${i(e.name)}</span>
          <label class="auto-toggle" title="${e.enabled?"Uitschakelen":"Inschakelen"}">
            <input type="checkbox" class="auto-toggle-input" ${e.enabled?"checked":""}
              data-action="toggle" data-id="${e.id}">
            <span class="auto-toggle-track"></span>
          </label>
        </div>

        <div class="auto-card-meta">
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Trigger
            </span>
            <span class="auto-meta-value">${i(e.trigger_label||e.trigger_type)}</span>
          </div>
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Actie
            </span>
            <span class="auto-meta-value">${i(e.action_label||e.action_type)}</span>
          </div>
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-8.01"/></svg>
              Laatste run
            </span>
            ${t}
          </div>
          ${e.then_actions&&e.then_actions.length?`
          <div class="auto-meta-row">
            <span class="auto-meta-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              Dan
            </span>
            <span class="auto-meta-value">${e.then_actions.map(l=>R(l)).join(", ")}</span>
          </div>`:""}
        </div>
      </div>

      <div class="auto-card-actions">
        <button class="auto-btn auto-btn-run ${o?"auto-btn-running":""}"
          data-action="run" data-id="${e.id}" title="Nu uitvoeren" ${o?"disabled":""}>
          ${o?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>':'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}
          ${o?"Loopt\u2026":"Draai nu"}
        </button>
        <button class="auto-btn" data-action="log" data-id="${e.id}" title="Log bekijken">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Log
        </button>
        <button class="auto-btn" data-action="edit" data-id="${e.id}" title="Bewerken">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Bewerk
        </button>
        <button class="auto-btn auto-btn-danger" data-action="delete" data-id="${e.id}" title="Verwijderen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  `}async function M(e){let t=e.currentTarget,a=t.dataset.action,o=Number(t.dataset.id);if(a==="toggle"){let l=t.checked;try{await s(`/api/automations/${o}/toggle`,{method:"POST"}),await d()}catch(n){alert(`Fout: ${n.message}`),t.checked=!l}return}if(a==="run"){c.add(o),m();try{await s(`/api/automations/${o}/run`,{method:"POST"}),setTimeout(async()=>{c.delete(o),await d()},2e3)}catch(l){c.delete(o),m(),alert(`Fout: ${l.message}`)}return}if(a==="edit"){r=o;let l=u.find(n=>n.id===o);f(l);return}if(a==="log"){await N(o);return}if(a==="delete"){let l=u.find(n=>n.id===o);if(!confirm(`Automation "${l?.name}" verwijderen?`))return;try{await s(`/api/automations/${o}`,{method:"DELETE"}),await d()}catch(n){alert(`Fout: ${n.message}`)}return}}function S(){document.getElementById("auto-new-btn").addEventListener("click",()=>{r=null,f(null)}),document.getElementById("auto-pipelines-btn").addEventListener("click",e=>{e.stopPropagation();let t=document.getElementById("auto-pipelines-dropdown");t.hidden=!t.hidden}),document.addEventListener("click",()=>{let e=document.getElementById("auto-pipelines-dropdown");e&&(e.hidden=!0)},{capture:!1})}function A(){let e=document.getElementById("auto-pipelines-dropdown");e&&(e.innerHTML=v.map(t=>`
    <button class="auto-pipeline-item" data-pipeline="${i(t.key)}">
      <span class="auto-pipeline-name">${i(t.name)}</span>
      <span class="auto-pipeline-desc">${i(t.description||"")}</span>
      <span class="auto-pipeline-count">${t.automationCount} automation${t.automationCount!==1?"s":""}</span>
    </button>
  `).join(""),e.querySelectorAll("[data-pipeline]").forEach(t=>{t.addEventListener("click",async a=>{a.stopPropagation(),e.hidden=!0;let o=t.dataset.pipeline,l=v.find(n=>n.key===o);if(confirm(`Pipeline "${l?.name}" installeren?
Dit maakt ${l?.automationCount} automation(s) aan.`))try{let n=await s(`/api/automations/pipelines/${o}/install`,{method:"POST"});await d(),alert(`\u2713 ${n.installed?.length||0} automation(s) ge\xEFnstalleerd!`)}catch(n){alert(`Fout bij installeren: ${n.message}`)}})}))}function f(e){let t=!!e,a=t?`Bewerk: ${e.name}`:"Nieuwe Automation",o=e?.then_actions||[],l=`
    <div class="auto-modal-backdrop" id="auto-modal-backdrop">
      <div class="auto-modal" role="dialog" aria-modal="true" aria-label="${i(a)}">
        <div class="auto-modal-header">
          <h2 class="auto-modal-title">${i(a)}</h2>
          <button class="auto-modal-close" id="auto-modal-close" aria-label="Sluiten">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="auto-modal-body">
          <div class="auto-form-group">
            <label class="auto-label">Naam</label>
            <input type="text" class="auto-input" id="auto-field-name"
              placeholder="Bijv. Nachtelijke sync" maxlength="200"
              value="${i(e?.name||"")}">
          </div>

          <div class="auto-form-group">
            <label class="auto-label">Groep</label>
            <input type="text" class="auto-input" id="auto-field-group"
              placeholder="Standaard" maxlength="100"
              value="${i(e?.group_name||"Standaard")}">
          </div>

          <div class="auto-form-row">
            <div class="auto-form-group auto-form-half">
              <label class="auto-label">Trigger type</label>
              <select class="auto-select" id="auto-field-trigger-type">
                ${E.map(n=>`
                  <option value="${n.value}" ${e?.trigger_type===n.value?"selected":""}>
                    ${n.label}
                  </option>
                `).join("")}
              </select>
            </div>
            <div class="auto-form-group auto-form-half">
              <label class="auto-label">Actie type</label>
              <select class="auto-select" id="auto-field-action-type">
                ${T.map(n=>`
                  <option value="${n.value}" ${e?.action_type===n.value?"selected":""}>
                    ${n.label}
                  </option>
                `).join("")}
              </select>
            </div>
          </div>

          <!-- Trigger config (dynamisch) -->
          <div id="auto-trigger-config"></div>

          <!-- Actie config (dynamisch) -->
          <div id="auto-action-config"></div>

          <!-- Then-actions -->
          <div class="auto-form-group">
            <label class="auto-label">
              Dan uitvoeren
              <span class="auto-label-hint">(max 3)</span>
            </label>
            <div id="auto-then-actions">
              ${o.slice(0,3).map((n,_)=>w(n,_)).join("")}
            </div>
            <button class="auto-btn-add-then" id="auto-add-then-btn" type="button"
              ${o.length>=3?"disabled":""}>
              + Voeg dan-actie toe
            </button>
          </div>
        </div>

        <div class="auto-modal-footer">
          <button class="btn btn-secondary" id="auto-modal-cancel">Annuleer</button>
          <button class="btn btn-primary" id="auto-modal-save">
            ${t?"Opslaan":"Aanmaken"}
          </button>
        </div>
      </div>
    </div>
  `;document.body.insertAdjacentHTML("beforeend",l),b(e?.trigger_type||"schedule",e?.trigger_config||{}),y(e?.action_type||"refresh_discovery",e?.action_config||{}),document.getElementById("auto-field-trigger-type").addEventListener("change",n=>{b(n.target.value,{})}),document.getElementById("auto-field-action-type").addEventListener("change",n=>{y(n.target.value,{})}),document.getElementById("auto-add-then-btn").addEventListener("click",j),document.getElementById("auto-modal-close").addEventListener("click",p),document.getElementById("auto-modal-cancel").addEventListener("click",p),document.getElementById("auto-modal-save").addEventListener("click",D),document.getElementById("auto-modal-backdrop").addEventListener("click",n=>{n.target===n.currentTarget&&p()}),k()}function b(e,t){let a=document.getElementById("auto-trigger-config");if(a)switch(e){case"schedule":a.innerHTML=`
        <div class="auto-form-group">
          <label class="auto-label">Cron expressie</label>
          <input type="text" class="auto-input" id="auto-tc-cron"
            placeholder="0 3 * * * (elke nacht om 3:00)"
            value="${i(t.cron||"")}">
          <span class="auto-hint">min uur dag maand weekdag \u2014 bijv. <code>0 3 * * *</code></span>
        </div>
      `;break;case"daily":a.innerHTML=`
        <div class="auto-form-group">
          <label class="auto-label">Tijdstip</label>
          <input type="time" class="auto-input auto-input-time" id="auto-tc-time"
            value="${i(t.time||"08:00")}">
        </div>
      `;break;case"weekly":a.innerHTML=`
        <div class="auto-form-row">
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Dag</label>
            <select class="auto-select" id="auto-tc-day">
              ${I.map(o=>`<option value="${o.value}" ${t.day===o.value?"selected":""}>${o.label}</option>`).join("")}
            </select>
          </div>
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Tijdstip</label>
            <input type="time" class="auto-input auto-input-time" id="auto-tc-time"
              value="${i(t.time||"03:00")}">
          </div>
        </div>
      `;break;case"interval":a.innerHTML=`
        <div class="auto-form-row">
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Aantal</label>
            <input type="number" class="auto-input" id="auto-tc-amount" min="1"
              value="${i(t.hours?String(t.hours):t.minutes?String(t.minutes):"1")}">
          </div>
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Eenheid</label>
            <select class="auto-select" id="auto-tc-unit">
              <option value="hours"   ${t.hours?"selected":""}>Uur</option>
              <option value="minutes" ${t.minutes?"selected":""}>Minuten</option>
            </select>
          </div>
        </div>
      `;break;case"event":a.innerHTML=`
        <div class="auto-form-group">
          <label class="auto-label">Event naam</label>
          <input type="text" class="auto-input" id="auto-tc-event"
            placeholder="download:complete of signal:mijn_signaal"
            value="${i(t.event||"")}">
          <span class="auto-hint">Beschikbare events: <code>download:complete</code>, <code>watchlist:new_release</code>, <code>signal:naam</code></span>
        </div>
      `;break;default:a.innerHTML=""}}function y(e,t){let a=document.getElementById("auto-action-config");if(a)switch(e){case"generate_playlist":a.innerHTML=`
        <div class="auto-form-group">
          <label class="auto-label">Playlist type</label>
          <select class="auto-select" id="auto-ac-playlist-type">
            ${B.map(o=>`<option value="${o.value}" ${t.type===o.value?"selected":""}>${o.label}</option>`).join("")}
          </select>
        </div>
      `;break;case"custom_endpoint":a.innerHTML=`
        <div class="auto-form-group">
          <label class="auto-label">URL</label>
          <input type="url" class="auto-input" id="auto-ac-url"
            placeholder="http://localhost:8080/webhook"
            value="${i(t.url||"")}">
        </div>
        <div class="auto-form-row">
          <div class="auto-form-group auto-form-half">
            <label class="auto-label">Methode</label>
            <select class="auto-select" id="auto-ac-method">
              <option value="POST" ${t.method==="POST"||!t.method?"selected":""}>POST</option>
              <option value="GET"  ${t.method==="GET"?"selected":""}>GET</option>
              <option value="PUT"  ${t.method==="PUT"?"selected":""}>PUT</option>
            </select>
          </div>
        </div>
      `;break;default:a.innerHTML=""}}function w(e,t){let a=e.config||{};return`
    <div class="auto-then-row" data-then-index="${t}">
      <select class="auto-select auto-then-type" data-then-index="${t}">
        ${x.map(o=>`<option value="${o.value}" ${e.type===o.value?"selected":""}>${o.label}</option>`).join("")}
      </select>
      <div class="auto-then-config" data-then-index="${t}">
        ${g(e.type,a)}
      </div>
      <button class="auto-btn-remove-then" data-then-index="${t}" type="button" title="Verwijder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `}function g(e,t){switch(e){case"notify_discord":return`<input type="url" class="auto-input auto-then-input" placeholder="Webhook URL (leeg = globale instelling)" value="${i(t.webhookUrl||"")}">
              <input type="text" class="auto-input auto-then-input" placeholder="Bericht (optioneel)" value="${i(t.message||"")}">`;case"notify_telegram":return`<input type="text" class="auto-input auto-then-input" placeholder="Bot Token (leeg = globale instelling)" value="${i(t.botToken||"")}">
              <input type="text" class="auto-input auto-then-input" placeholder="Chat ID" value="${i(t.chatId||"")}">`;case"notify_pushbullet":return`<input type="text" class="auto-input auto-then-input" placeholder="API Key (leeg = globale instelling)" value="${i(t.apiKey||"")}">`;case"fire_signal":return`<input type="text" class="auto-input auto-then-input" placeholder="Signaal naam (bijv. mijn_signaal)" value="${i(t.signal||"")}">`;default:return""}}function j(){let e=document.getElementById("auto-then-actions"),t=e.querySelectorAll(".auto-then-row").length;if(t>=3)return;let a=t;e.insertAdjacentHTML("beforeend",w({type:"notify_discord",config:{}},a));let o=e.querySelector(`[data-then-index="${a}"]`),l=o.querySelector(".auto-then-type");l.addEventListener("change",()=>{o.querySelector(".auto-then-config").innerHTML=g(l.value,{})});let n=document.getElementById("auto-add-then-btn");e.querySelectorAll(".auto-then-row").length>=3&&(n.disabled=!0),k()}function k(){document.querySelectorAll(".auto-btn-remove-then").forEach(e=>{e.addEventListener("click",t=>{t.currentTarget.closest(".auto-then-row").remove();let a=document.getElementById("auto-add-then-btn");a&&(a.disabled=!1)})}),document.querySelectorAll(".auto-then-type").forEach(e=>{e.addEventListener("change",()=>{let t=e.dataset.thenIndex,a=document.querySelector(`.auto-then-config[data-then-index="${t}"]`);a&&(a.innerHTML=g(e.value,{}))})})}function C(e){switch(e){case"schedule":return{cron:document.getElementById("auto-tc-cron")?.value.trim()||""};case"daily":return{time:document.getElementById("auto-tc-time")?.value||"08:00"};case"weekly":return{day:document.getElementById("auto-tc-day")?.value||"sun",time:document.getElementById("auto-tc-time")?.value||"03:00"};case"interval":{let t=Number(document.getElementById("auto-tc-amount")?.value)||1;return{[document.getElementById("auto-tc-unit")?.value||"hours"]:t}}case"event":return{event:document.getElementById("auto-tc-event")?.value.trim()||""};default:return{}}}function P(e){switch(e){case"generate_playlist":return{type:document.getElementById("auto-ac-playlist-type")?.value||"daily_mix"};case"custom_endpoint":return{url:document.getElementById("auto-ac-url")?.value.trim()||"",method:document.getElementById("auto-ac-method")?.value||"POST"};default:return{}}}function H(){let e=document.querySelectorAll(".auto-then-row"),t=[];return e.forEach(a=>{let o=a.querySelector(".auto-then-type")?.value,l=a.querySelectorAll(".auto-then-input"),n={};switch(o){case"notify_discord":n.webhookUrl=l[0]?.value,n.message=l[1]?.value;break;case"notify_telegram":n.botToken=l[0]?.value,n.chatId=l[1]?.value;break;case"notify_pushbullet":n.apiKey=l[0]?.value;break;case"fire_signal":n.signal=l[0]?.value;break}o&&t.push({type:o,config:n})}),t}async function D(){let e=document.getElementById("auto-field-name")?.value.trim(),t=document.getElementById("auto-field-group")?.value.trim()||"Standaard",a=document.getElementById("auto-field-trigger-type")?.value,o=document.getElementById("auto-field-action-type")?.value;if(!e){alert("Naam is verplicht");return}let l={name:e,group_name:t,trigger_type:a,trigger_config:C(a),action_type:o,action_config:P(o),then_actions:H(),enabled:!0};try{r?await s(`/api/automations/${r}`,{method:"PUT",body:JSON.stringify(l)}):await s("/api/automations",{method:"POST",body:JSON.stringify(l)}),p(),await d()}catch(n){alert(`Opslaan mislukt: ${n.message}`)}}function p(){document.getElementById("auto-modal-backdrop")?.remove(),r=null}async function N(e){let t=u.find(l=>l.id===e),a=[];try{a=(await s(`/api/automations/${e}/log?limit=30`)).log||[]}catch{}let o=`
    <div class="auto-modal-backdrop" id="auto-log-modal-backdrop">
      <div class="auto-modal auto-modal-log" role="dialog" aria-modal="true">
        <div class="auto-modal-header">
          <h2 class="auto-modal-title">Log: ${i(t?.name||`#${e}`)}</h2>
          <button class="auto-modal-close" id="auto-log-modal-close" aria-label="Sluiten">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="auto-modal-body">
          ${a.length===0?'<div class="auto-empty" style="padding:2rem;">Geen log entries gevonden.</div>':`<div class="auto-log-list">
                ${a.map(l=>{let n=typeof l.details=="string"?(()=>{try{return JSON.parse(l.details)}catch{return{}}})():l.details||{};return`
                    <div class="auto-log-row auto-log-${l.status}">
                      <span class="auto-log-status">${l.status==="success"?"\u2713":"\u2717"}</span>
                      <span class="auto-log-time">${$(l.created_at*1e3)}</span>
                      <span class="auto-log-trigger">${i(l.trigger_type||"\u2014")}</span>
                      <span class="auto-log-action">${i(l.action_type||"\u2014")}</span>
                      <span class="auto-log-dur">${l.duration_ms?`${l.duration_ms}ms`:"\u2014"}</span>
                      ${n.error?`<span class="auto-log-error">${i(n.error)}</span>`:""}
                    </div>
                  `}).join("")}
              </div>`}
        </div>
        <div class="auto-modal-footer">
          <button class="btn btn-secondary" id="auto-log-modal-close-btn">Sluiten</button>
        </div>
      </div>
    </div>
  `;document.body.insertAdjacentHTML("beforeend",o),document.getElementById("auto-log-modal-close").addEventListener("click",()=>document.getElementById("auto-log-modal-backdrop")?.remove()),document.getElementById("auto-log-modal-close-btn").addEventListener("click",()=>document.getElementById("auto-log-modal-backdrop")?.remove()),document.getElementById("auto-log-modal-backdrop").addEventListener("click",l=>{l.target===l.currentTarget&&document.getElementById("auto-log-modal-backdrop")?.remove()})}function $(e){return e?new Date(e>1e12?e:e*1e3).toLocaleString("nl-NL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"\u2014"}function R(e){return{notify_discord:"\u{1F514} Discord",notify_telegram:"\u{1F514} Telegram",notify_pushbullet:"\u{1F514} Pushbullet",fire_signal:"\u26A1 Signaal",play_chime:"\u{1F3B5} Chime"}[e.type]||e.type}export{G as loadAutomations};
