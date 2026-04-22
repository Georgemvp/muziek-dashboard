import{E as c,a as e,b as r,h as w,j as a,m as p,v as d,w as m,x as g}from"./chunk-4E6U7I7I.js";async function y(){try{let t=await c("/api/wishlist");e.wishlistMap.clear();for(let s of t)e.wishlistMap.set(`${s.type}:${s.name}`,s.id);h()}catch{}}function h(){let t=document.getElementById("badge-wishlist");t&&(t.textContent=e.wishlistMap.size||"0")}async function b(t,s,i,n){let o=`${t}:${s}`;if(e.wishlistMap.has(o)){try{await r(`/api/wishlist/${e.wishlistMap.get(o)}`,{method:"DELETE"})}catch(l){if(l.name!=="AbortError")throw l}return e.wishlistMap.delete(o),h(),!1}else{let v=await(await r("/api/wishlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:t,name:s,artist:i,image:n})})).json();return e.wishlistMap.set(o,v.id),h(),!0}}async function M(){g(),await y();try{let t=await c("/api/wishlist");if(!t.length){d('<div class="empty">Je lijst is leeg.<br>Voeg artiesten toe via het \u{1F516} icoon in Ontdek en Collectiegaten.</div>');return}let s=`<div class="section-title">${t.length} opgeslagen</div><div class="wishlist-grid">`;for(let i of t){let n=i.image?`<img src="${a(i.image)}" alt="" loading="lazy"
            onerror="this.onerror=null;this.style.display='none'">`:"";s+=`
        <div class="wish-card">
          <div class="wish-photo" style="background:${p(i.name)}">
            ${n}
            <div class="wish-ph">${w(i.name)}</div>
          </div>
          <div class="wish-body">
            <div class="wish-info">
              <div class="wish-name artist-link" data-artist="${a(i.name)}">${a(i.name)}</div>
              ${i.artist?`<div class="wish-sub">${a(i.artist)}</div>`:""}
              <div class="wish-type">${i.type==="artist"?"Artiest":"Album"}</div>
            </div>
            <button class="wish-remove" data-wid="${i.id}" title="Verwijder">\u2715</button>
          </div>
        </div>`}d(s+"</div>")}catch(t){m(t.message)}}export{y as a,h as b,b as c,M as d};
