import{F as m,a,b as d,h as g,j as l,m as x,w as p,x as y,y as b}from"./chunk-OXJVLDHB.js";var v="plexSelectedZone";function f(){try{let e=localStorage.getItem(v);return e?JSON.parse(e):null}catch{return null}}function E(e){localStorage.setItem(v,JSON.stringify(e)),z()}function z(){let e=f(),n=document.getElementById("plex-zone-name");n&&(n.textContent=e?e.name:"\u2014");let t=document.getElementById("plex-zone-btn");t&&t.classList.toggle("has-zone",!!e)}async function _(){try{return(await fetch(`/api/plex/clients?t=${Date.now()}`).then(n=>n.json())).clients||[]}catch{return[]}}var u=!1;function h(){let e=document.getElementById("plex-zone-dropdown");e&&(e.style.display="none"),u=!1}async function $(){let e=document.getElementById("plex-zone-dropdown");if(!e)return;if(u){h();return}u=!0,e.style.display="",e.innerHTML='<div class="plex-zone-loading">Laden\u2026</div>';let n=await _(),t=f(),i={machineId:"__web__",name:"Web (deze browser)",product:"Web"},s=o=>(o.product||"").toLowerCase().includes("web"),r=[i,...n];e.innerHTML=r.map(o=>{let c=o.machineId==="__web__";return`
    <button class="plex-zone-item${t?.machineId===o.machineId?" active":""}${s(o)?" plex-web-zone":""}"
      data-machine-id="${o.machineId}"
      data-name="${o.name}"
      data-product="${o.product}">
      <span class="plex-zone-icon">${s(o)||c?"\u{1F310}":"\u{1F50A}"}</span>
      <span class="plex-zone-label">
        <span class="plex-zone-item-name">${o.name}</span>
        <small class="plex-zone-item-product">${c?"Speelt af in deze browser":`${o.product}${s(o)?" \xB7 \u26A0 beperkt":""}`}</small>
      </span>
      ${t?.machineId===o.machineId?'<span class="plex-zone-check">\u2713</span>':""}
    </button>
  `}).join("")+(n.some(s)?'<div class="plex-zone-webwarning">\u26A0 Plex Web ondersteunt geen afstandsbediening via de API. Gebruik <strong>Plexamp</strong> voor volledige besturing.</div>':""),e.querySelectorAll(".plex-zone-item").forEach(o=>{o.addEventListener("click",()=>{let c=o.dataset.product||"";E({machineId:o.dataset.machineId,name:o.dataset.name,product:c}),h(),o.dataset.machineId!=="__web__"&&c.toLowerCase().includes("web")&&I("Plex Web ondersteunt geen afstandsbediening. Gebruik Plexamp voor play/pause/skip.")})})}async function O(e,n="music"){let t=f();if(!t)return await $(),!1;try{let s=await(await fetch("/api/plex/play",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({machineId:t.machineId,ratingKey:String(e),type:n})})).json();if(!s.ok)throw new Error(s.error||"Afspelen mislukt");return S(t.name),!0}catch(i){return console.error("[Plex Remote] play fout:",i),I(`Afspelen mislukt: ${i.message}`),!1}}function S(e){k(`\u25B6 Afspelen op ${e}`,"#1db954")}function I(e){k(`\u26A0 ${e}`,"#e05a2b")}function k(e,n="#333"){let t=document.getElementById("plex-remote-toast");t&&t.remove();let i=document.createElement("div");i.id="plex-remote-toast",Object.assign(i.style,{position:"fixed",bottom:"80px",left:"50%",transform:"translateX(-50%)",background:n,color:"#fff",padding:"10px 20px",borderRadius:"8px",zIndex:"9998",fontSize:"13px",fontFamily:"sans-serif",boxShadow:"0 4px 16px rgba(0,0,0,0.35)",pointerEvents:"none",whiteSpace:"nowrap"}),i.textContent=e,document.body.appendChild(i),setTimeout(()=>i.remove(),3e3)}function C(){z(),document.getElementById("plex-zone-btn")?.addEventListener("click",e=>{e.stopPropagation(),$()}),document.addEventListener("click",e=>{let n=document.getElementById("plex-zone-wrap");n&&!n.contains(e.target)&&h()})}async function P(){try{let e=await m("/api/wishlist");a.wishlistMap.clear();for(let n of e)a.wishlistMap.set(`${n.type}:${n.name}`,n.id);w()}catch{}}function w(){let e=document.getElementById("badge-wishlist");e&&(e.textContent=a.wishlistMap.size||"0")}async function j(e,n,t,i){let s=`${e}:${n}`;if(a.wishlistMap.has(s)){try{await d(`/api/wishlist/${a.wishlistMap.get(s)}`,{method:"DELETE"})}catch(r){if(r.name!=="AbortError")throw r}return a.wishlistMap.delete(s),w(),!1}else{let o=await(await d("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:e,name:n,artist:t,image:i})})).json();return a.wishlistMap.set(s,o.id),w(),!0}}async function B(){b(),await P();try{let e=await m("/api/wishlist");if(!e.length){p('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let n=`<div class="section-title">${e.length} opgeslagen</div><div class="wishlist-grid">`;for(let t of e){let i=t.image?`<img src="${l(t.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";n+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${x(t.name)}">
            ${i}
            <div class="wish-ph">${g(t.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${l(t.name)}">${l(t.name)}</div>
              ${t.artist?`<div class="wish-sub">${l(t.artist)}</div>`:""}
              <div class="wish-type">${t.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${t.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}p(n+"</div>")}catch(e){y(e.message)}}export{f as a,O as b,C as c,P as d,w as e,j as f,B as g};
