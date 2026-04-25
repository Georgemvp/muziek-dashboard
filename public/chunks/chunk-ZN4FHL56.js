import{D as c,a as e,b as r,g as w,i as a,l as m,v as d,w as p,x as g}from"./chunk-XOZD6SLL.js";async function y(){try{let i=await c("/api/wishlist");e.wishlistMap.clear();for(let s of i)e.wishlistMap.set(`${s.type}:${s.name}`,s.id);h()}catch{}}function h(){let i=document.getElementById("badge-wishlist");i&&(i.textContent=e.wishlistMap.size||"0")}async function b(i,s,t,n){let o=`${i}:${s}`;if(e.wishlistMap.has(o)){try{await r(`/api/wishlist/${e.wishlistMap.get(o)}`,{method:"DELETE"})}catch(l){if(l.name!=="AbortError")throw l}return e.wishlistMap.delete(o),h(),!1}else{let v=await(await r("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:i,name:s,artist:t,image:n})})).json();return e.wishlistMap.set(o,v.id),h(),!0}}async function M(){g(),await y();try{let i=await c("/api/wishlist");if(!i.length){d('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let s=`<div class="section-title">${i.length} opgeslagen</div><div class="wishlist-grid">`;for(let t of i){let n=t.image?`<img src="${a(t.image)}" alt="${a(t.name)}${t.artist?" by "+a(t.artist):""}" loading="lazy" decoding="async"
            onerror="this.onerror=null;this.style.display='none'">`:"";s+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${m(t.name)}">
            ${n}
            <div class="wish-ph">${w(t.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${a(t.name)}">${a(t.name)}</div>
              ${t.artist?`<div class="wish-sub">${a(t.artist)}</div>`:""}
              <div class="wish-type">${t.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${t.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}d(s+"</div>")}catch(i){p(i.message)}}export{y as a,h as b,b as c,M as d};
