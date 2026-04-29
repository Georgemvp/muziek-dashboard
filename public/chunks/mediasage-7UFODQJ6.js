import{a as n}from"./chunk-TX4DMDRR.js";import{a}from"./chunk-7FXT553B.js";import"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";function m(){}async function u(){let e=document.getElementById("content");if(!e)return;let t='<span class="ms-status-loading">Verbinden met MediaSage\u2026</span>';e.innerHTML=i(t),l();try{let r=await n(),o=r?.track_count??r?.tracks??r?.total_tracks??null;typeof o=="number"?t=`
        <span class="ms-status-dot ms-status-ok" aria-hidden="true"></span>
        <span class="ms-status-text">${o.toLocaleString("nl-NL")} tracks gesynchroniseerd</span>`:t=`
        <span class="ms-status-dot ms-status-warn" aria-hidden="true"></span>
        <span class="ms-status-text">Niet geconfigureerd</span>
        <button class="ms-sync-btn" id="ms-sync-btn">Synchroniseer</button>`}catch{t=`
      <span class="ms-status-dot ms-status-warn" aria-hidden="true"></span>
      <span class="ms-status-text">Niet geconfigureerd</span>
      <button class="ms-sync-btn" id="ms-sync-btn">Synchroniseer</button>`}let s=e.querySelector("#ms-status");if(s){s.innerHTML=t;let r=s.querySelector("#ms-sync-btn");r&&r.addEventListener("click",()=>{window.open("/mediasage/","_blank","noopener")})}}function i(e){return`
    <div class="ms-landing">

      <header class="ms-header">
        <h1 class="ms-title">
          <svg class="ms-sparkle" width="28" height="28" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
            <path d="M20 3v4m2-2h-4"/>
          </svg>
          MediaSage
        </h1>
        <p class="ms-desc">AI-powered muziekaanbevelingen op basis van je Plex bibliotheek</p>
        <div class="ms-status" id="ms-status" role="status" aria-live="polite">
          ${e}
        </div>
      </header>

      <div class="ms-cards">

        <button class="ms-card" id="ms-card-playlist" aria-label="AI Playlist Generator openen">
          <div class="ms-card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <svg class="ms-card-sparkle" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
              <path d="M20 3v4m2-2h-4"/>
            </svg>
          </div>
          <div class="ms-card-body">
            <div class="ms-card-title">AI Playlist</div>
            <div class="ms-card-subtitle">Genereer playlists met natural language prompts</div>
          </div>
          <svg class="ms-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        <button class="ms-card" id="ms-card-recommend" aria-label="Album Aanbevelingen openen">
          <div class="ms-card-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
            </svg>
            <svg class="ms-card-sparkle" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                 aria-hidden="true">
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
              <path d="M20 3v4m2-2h-4"/>
            </svg>
          </div>
          <div class="ms-card-body">
            <div class="ms-card-title">Album Recommend</div>
            <div class="ms-card-subtitle">Ontdek het perfecte album voor elk moment</div>
          </div>
          <svg class="ms-card-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

      </div>

      <footer class="ms-footer">
        <a href="/mediasage/" target="_blank" rel="noopener" class="ms-settings-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6"/>
            <path d="M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24"/>
            <path d="M1 12h6m6 0h6"/>
            <path d="M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>
          </svg>
          MediaSage instellingen
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </footer>

    </div>

    <style>
      .ms-landing {
        max-width: 640px;
        margin: 0 auto;
        padding: 2.5rem 1.5rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .ms-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .ms-title {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0;
        color: var(--color-text, #111);
      }
      .ms-sparkle {
        color: var(--color-accent, #7c3aed);
        flex-shrink: 0;
      }
      .ms-desc {
        margin: 0;
        font-size: 0.95rem;
        color: var(--color-text-muted, #666);
        line-height: 1.5;
      }
      .ms-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--color-text-muted, #666);
        margin-top: 0.25rem;
      }
      .ms-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .ms-status-ok   { background: #22c55e; }
      .ms-status-warn { background: #f59e0b; }
      .ms-status-loading { font-style: italic; }
      .ms-sync-btn {
        background: none;
        border: 1px solid var(--color-border, #ddd);
        border-radius: 4px;
        padding: 0.2rem 0.6rem;
        font-size: 0.8rem;
        cursor: pointer;
        color: var(--color-text, #111);
        margin-left: 0.25rem;
        transition: background 0.15s;
      }
      .ms-sync-btn:hover { background: var(--color-hover, #f3f4f6); }

      .ms-cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .ms-card {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        padding: 1.25rem 1.5rem;
        background: var(--color-surface, #fff);
        border: 1px solid var(--color-border, #e5e7eb);
        border-radius: 12px;
        cursor: pointer;
        text-align: left;
        transition: box-shadow 0.15s, transform 0.1s, border-color 0.15s;
        width: 100%;
      }
      .ms-card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        transform: translateY(-1px);
        border-color: var(--color-accent, #7c3aed);
      }
      .ms-card:active { transform: translateY(0); }
      .ms-card-icon {
        position: relative;
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        background: var(--color-accent-light, #ede9fe);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-accent, #7c3aed);
      }
      .ms-card-sparkle {
        position: absolute;
        top: -6px;
        right: -6px;
        color: var(--color-accent, #7c3aed);
        background: var(--color-surface, #fff);
        border-radius: 50%;
        padding: 1px;
      }
      .ms-card-body {
        flex: 1;
        min-width: 0;
      }
      .ms-card-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text, #111);
        margin-bottom: 0.2rem;
      }
      .ms-card-subtitle {
        font-size: 0.85rem;
        color: var(--color-text-muted, #666);
        line-height: 1.4;
      }
      .ms-card-arrow {
        flex-shrink: 0;
        color: var(--color-text-muted, #999);
        opacity: 0.6;
        transition: opacity 0.15s, transform 0.15s;
      }
      .ms-card:hover .ms-card-arrow {
        opacity: 1;
        transform: translateX(3px);
      }

      .ms-footer {
        padding-top: 0.5rem;
        border-top: 1px solid var(--color-border, #e5e7eb);
      }
      .ms-settings-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: var(--color-text-muted, #666);
        text-decoration: none;
        transition: color 0.15s;
      }
      .ms-settings-link:hover { color: var(--color-accent, #7c3aed); }

      @media (max-width: 600px) {
        .ms-landing { padding: 1.5rem 1rem 2rem; }
        .ms-title    { font-size: 1.4rem; }
        .ms-card     { padding: 1rem 1.1rem; gap: 1rem; }
      }
    </style>
  `}function l(){let e=document.getElementById("content");e&&(e.querySelector("#ms-card-playlist")?.addEventListener("click",()=>{a("mediasage-playlist")}),e.querySelector("#ms-card-recommend")?.addEventListener("click",()=>{a("mediasage-recommend")}))}export{m as hideMediaSageUI,u as loadMediaSage};
