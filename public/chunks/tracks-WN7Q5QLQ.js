import{i as v,n as k}from"./chunk-C6ZPWJ3O.js";import{A as h,i as m,u as p,v as g}from"./chunk-GHKYA3ZE.js";var d=null,y="",c="name",u="all";function b(){return document.getElementById("content")}function $(a){if(!a)return"-";let l=Math.floor(a/1e3),e=Math.floor(a%1e3/1e3);return`${l}:${e.toString().padStart(2,"0")}`}function i(a){return(a||"").toLowerCase().replace(/\(.*?\)/g,"").replace(/\[.*?\]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim()}function x(a,l){let e=new Map;(l||[]).forEach(n=>{let o=i(`${n.name}|${n.artist}`);e.set(o,n)});let t=(a||[]).map(n=>{let o=i(`${n.title}|${n.artist}`),s=e.get(o);return{...n,source:"plex",plays:s?.playcount||0,url:s?.url||null,inPlex:!0}}),r=(l||[]).filter(n=>{let o=i(`${n.name}|${n.artist}`);return!e.get(o)||!a.find(s=>i(s.title)===i(n.name)&&i(s.artist)===i(n.artist))}).map(n=>({ratingKey:null,title:n.name,artist:n.artist,album:n.album||"",duration:0,thumb:null,source:"lastfm",plays:n.playcount,url:n.url,inPlex:!1}));return{plex:t,lastfm:r,all:[...t,...r]}}function C(a){let l=a.filter(e=>u==="plex-only"?e.inPlex:u==="lastfm-only"?!e.inPlex:!0);if(y){let e=y.toLowerCase().trim();l=l.filter(t=>t.title.toLowerCase().includes(e)||t.artist.toLowerCase().includes(e)||t.album.toLowerCase().includes(e))}switch(c){case"artist":l.sort((e,t)=>e.artist.localeCompare(t.artist)||e.title.localeCompare(t.title));break;case"album":l.sort((e,t)=>e.album.localeCompare(t.album)||e.artist.localeCompare(t.artist));break;case"plays":l.sort((e,t)=>(t.plays||0)-(e.plays||0));break;case"duration":l.sort((e,t)=>(t.duration||0)-(e.duration||0));break;case"name":default:l.sort((e,t)=>e.title.localeCompare(t.title))}return l}function w(){let a=document.getElementById("view-toolbar"),l=d?.all?.length||0,e=d?.plex?.length||0,t=d?.lastfm?.length||0;a.innerHTML=`
    <div class="tracks-toolbar">
      <div class="toolbar-group">
        <input type="text" id="tracks-search" placeholder="Zoek tracks..." class="toolbar-input" value="${m(y)}">
        <select id="tracks-sort" class="toolbar-select">
          <option value="name" ${c==="name"?"selected":""}>Naam</option>
          <option value="artist" ${c==="artist"?"selected":""}>Artiest</option>
          <option value="album" ${c==="album"?"selected":""}>Album</option>
          <option value="plays" ${c==="plays"?"selected":""}>Meest beluisterd</option>
          <option value="duration" ${c==="duration"?"selected":""}>Duur</option>
        </select>
        <select id="tracks-filter" class="toolbar-select">
          <option value="all" ${u==="all"?"selected":""}>Alles (${l})</option>
          <option value="plex-only" ${u==="plex-only"?"selected":""}>Alleen Plex (${e})</option>
          <option value="lastfm-only" ${u==="lastfm-only"?"selected":""}>Alleen Last.fm (${t})</option>
        </select>
      </div>
      <div class="toolbar-group">
        <span class="toolbar-badge">${l} nummers</span>
      </div>
    </div>
  `,document.getElementById("tracks-search").addEventListener("input",r=>{y=r.target.value,f()}),document.getElementById("tracks-sort").addEventListener("change",r=>{c=r.target.value,f()}),document.getElementById("tracks-filter").addEventListener("change",r=>{u=r.target.value,f()})}async function f(){let a=b();if(!a||!d)return;w();let l=C(d.all),e=v();if(l.length===0){a.innerHTML=`
      <div class="tracks-empty">
        <div class="tracks-empty-icon">\u266A</div>
        <div class="tracks-empty-message">Geen sporen gevonden</div>
        <div class="tracks-empty-hint">Probeer andere zoekopdracht of filters</div>
      </div>
    `;return}a.innerHTML=`
    <div class="tracks-table-container">
      <table class="tracks-table">
        <thead>
          <tr>
            <th></th>
            <th>Nummer</th>
            <th>Artiest</th>
            <th>Album</th>
            <th>Duur</th>
            <th>Plays</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tracks-tbody">
          ${l.map((t,r)=>`
            <tr data-idx="${r}" data-rating-key="${t.ratingKey||""}">
              <td>
                ${t.inPlex?'<span class="plex-badge">P</span>':'<span class="music-note">\u266A</span>'}
              </td>
              <td>${m(t.title)}</td>
              <td>${m(t.artist)}</td>
              <td>${m(t.album)}</td>
              <td>${$(t.duration)}</td>
              <td>${t.plays>0?`<strong>${t.plays}</strong>`:"\u2014"}</td>
              <td>
                ${t.ratingKey?`
                  <button class="track-play-btn" data-rating-key="${t.ratingKey}" data-zone="${e?.id||""}">\u25B6</button>
                `:""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `,document.querySelectorAll(".track-play-btn").forEach(t=>{t.addEventListener("click",async r=>{r.preventDefault();let n=t.getAttribute("data-rating-key"),o=t.getAttribute("data-zone");if(!o){p("Selecteer eerst een afspeelzone");return}try{await k(o,n,"music"),t.textContent="\u23F8",setTimeout(()=>{t.textContent="\u25B6"},2e3)}catch(s){p("Kan nummer niet afspelen: "+s.message)}})})}async function L(){g();try{let[a,l]=await Promise.allSettled([h("/api/plex/tracks"),h("/api/top/tracks?period=overall")]),e=a.status==="fulfilled"?a.value.tracks||[]:[],t=l.status==="fulfilled"?l.value.track||[]:[];if(d=x(e,t),d.all.length===0){p("Geen sporen gevonden. Controleer of Plex en Last.fm geconfigureerd zijn.");return}await f(),document.title="Muziek \xB7 Tracks"}catch(a){p("Kan tracks niet laden: "+a.message)}}async function K(){b()&&(g(),await L())}export{K as loadTracks};
