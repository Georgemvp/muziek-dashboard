function l(){return`
    <div class="sk-card">
      <div class="skeleton skeleton-img"></div>
      <div class="sk-card-body">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    </div>`}function d(s=4,e=3){let t=s*e,i=Array.from({length:t},()=>l()).join("");return`<div class="sk-grid" style="--sk-cols:${s}">${i}</div>`}function o(s=5){return`<div class="sk-list">${Array.from({length:s},()=>`
    <div class="sk-list-row">
      <div class="skeleton sk-list-thumb"></div>
      <div class="sk-list-lines">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
      <div class="skeleton sk-list-badge"></div>
    </div>`).join("")}</div>`}function n(){return`
    <div class="sk-hero">
      <div class="skeleton sk-hero-img"></div>
      <div class="sk-hero-body">
        <div class="skeleton sk-hero-title"></div>
        <div class="skeleton skeleton-text" style="width:55%"></div>
        <div class="skeleton skeleton-text" style="width:40%"></div>
      </div>
    </div>`}export{d as a,o as b,n as c};
