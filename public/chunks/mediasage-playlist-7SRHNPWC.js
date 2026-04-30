import{b as H,c as K,d as G,e as O,f as _,g as N,k as q,l as D,m as R,n as z,o as V}from"./chunk-TX4DMDRR.js";import{a as Z}from"./chunk-LN6W2KS4.js";import{f as T,h as a,j as S}from"./chunk-HCN2ZK5I.js";import"./chunk-2BMKGNH5.js";var p=1,h=null,u=new Set,g=new Set,b=1,C=!1,k=25,i=[],c="Mijn playlist",d=null,f=[],y=[],P=null,l=null,E=null,$=null,v="",F=null,J=null;async function Ie(){p=1,h=null,u=new Set,g=new Set,b=1,C=!1,k=25,i=[],c="Mijn playlist",d&&(d.abort(),d=null),f=[],y=[],P=null,l=null,E=null,$=null,v="",re(),Q()}function re(){if(document.getElementById("ms-playlist-styles"))return;let e=document.createElement("style");e.id="ms-playlist-styles",e.textContent=`
    /* \u2500\u2500 Layout \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-view {
      max-width: 860px;
      margin: 0 auto;
      padding-bottom: 60px;
    }
    .ms-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 20px 8px;
    }
    .ms-back-btn {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      border-radius: 8px;
      padding: 6px 13px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      transition: color .15s, border-color .15s;
      flex-shrink: 0;
    }
    .ms-back-btn:hover { color: var(--color-text); border-color: var(--color-accent); }
    .ms-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }

    /* \u2500\u2500 Step indicator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-steps {
      display: flex;
      align-items: center;
      padding: 14px 20px 10px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .ms-steps::-webkit-scrollbar { display: none; }
    .ms-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .ms-step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      background: var(--color-card);
      border: 2px solid var(--color-border);
      color: var(--color-text-secondary);
      transition: all .2s;
    }
    .ms-step.active .ms-step-dot {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }
    .ms-step.done .ms-step-dot {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
      opacity: .55;
    }
    .ms-step-label {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap;
    }
    .ms-step.active .ms-step-label { color: var(--color-accent); font-weight: 600; }
    .ms-step-line {
      flex: 1;
      height: 2px;
      background: var(--color-border);
      margin: 0 4px 14px;
      min-width: 18px;
      transition: background .2s;
    }
    .ms-step-line.done { background: var(--color-accent); opacity: .45; }

    /* \u2500\u2500 Card \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 22px 24px;
      margin: 0 20px 14px;
    }
    .ms-card h2 {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text);
      margin: 0 0 18px;
    }

    /* \u2500\u2500 Prompt \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-textarea {
      width: 100%;
      min-height: 96px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 15px;
      padding: 11px 13px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color .15s;
      line-height: 1.5;
    }
    .ms-textarea:focus { outline: none; border-color: var(--color-accent); }

    /* \u2500\u2500 Seed track \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-seed-toggle-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-top: 12px;
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      user-select: none;
    }
    .ms-seed-toggle-row input { cursor: pointer; accent-color: var(--color-accent); }
    .ms-seed-section { display: none; margin-top: 10px; }
    .ms-seed-section.visible { display: block; }
    .ms-text-input {
      width: 100%;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 14px;
      padding: 9px 12px;
      box-sizing: border-box;
      font-family: inherit;
      transition: border-color .15s;
    }
    .ms-text-input:focus { outline: none; border-color: var(--color-accent); }
    .ms-search-results {
      margin-top: 6px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      max-height: 230px;
      overflow-y: auto;
    }
    .ms-search-result {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--color-border);
      transition: background .12s;
    }
    .ms-search-result:last-child { border-bottom: none; }
    .ms-search-result:hover { background: var(--color-card); }
    .ms-thumb {
      width: 36px;
      height: 36px;
      border-radius: 5px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .ms-thumb-ph {
      width: 36px;
      height: 36px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    .ms-result-info { flex: 1; min-width: 0; }
    .ms-result-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-result-sub {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-seed-chosen {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 11px;
      background: color-mix(in srgb, var(--color-accent) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-accent) 28%, transparent);
      border-radius: 8px;
      margin-top: 6px;
    }
    .ms-seed-info { flex: 1; min-width: 0; }
    .ms-seed-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
    .ms-seed-artist { font-size: 11px; color: var(--color-text-secondary); }
    .ms-seed-clear {
      background: none; border: none;
      color: var(--color-text-secondary);
      cursor: pointer; padding: 4px 6px; font-size: 15px; line-height: 1;
      transition: color .12s;
    }
    .ms-seed-clear:hover { color: #e53e3e; }

    /* \u2500\u2500 Buttons \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      transition: opacity .15s, transform .1s;
      white-space: nowrap;
    }
    .ms-btn:disabled { opacity: .4; cursor: not-allowed; }
    .ms-btn:not(:disabled):hover { opacity: .82; }
    .ms-btn:not(:disabled):active { transform: scale(.97); }
    .ms-btn-primary   { background: var(--accent); color: #fff; }
    .ms-btn-secondary {
      background: var(--color-card);
      color: var(--color-text);
      border: 1px solid var(--color-border);
    }
    .ms-btn-ghost {
      background: none;
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }
    .ms-row {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      flex-wrap: wrap;
      align-items: center;
    }

    /* \u2500\u2500 Chips \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 7px;
    }
    .ms-chip {
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      color: var(--color-text-secondary);
      font-size: 12px;
      cursor: pointer;
      transition: all .14s;
      user-select: none;
      font-family: inherit;
    }
    .ms-chip:hover { border-color: var(--color-accent); color: var(--color-text); }
    .ms-chip.active {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: #fff;
    }

    /* \u2500\u2500 Form fields \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-field { margin-top: 18px; }
    .ms-field > label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-secondary);
      margin-bottom: 6px;
    }
    .ms-slider {
      width: 100%;
      accent-color: var(--color-accent);
      cursor: pointer;
    }
    .ms-slider-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ms-slider-edge { font-size: 12px; color: var(--color-text-secondary); flex-shrink: 0; }
    .ms-slider-val {
      font-size: 14px;
      font-weight: 700;
      color: var(--color-accent);
      min-width: 28px;
    }
    .ms-checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      font-size: 13px;
      color: var(--color-text);
      cursor: pointer;
      user-select: none;
    }
    .ms-checkbox-row input { cursor: pointer; accent-color: var(--color-accent); }
    .ms-preview-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      margin-top: 18px;
      font-size: 13px;
      color: var(--color-text-secondary);
    }
    .ms-preview-count {
      font-size: 22px;
      font-weight: 800;
      color: var(--color-accent);
    }

    /* \u2500\u2500 Generating \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-gen-hero {
      text-align: center;
      padding: 28px 0 12px;
    }
    .ms-gen-spinner {
      width: 44px;
      height: 44px;
      border: 4px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: ms-spin .85s linear infinite;
      margin: 0 auto 14px;
    }
    @keyframes ms-spin { to { transform: rotate(360deg); } }
    .ms-gen-text {
      font-size: 15px;
      color: var(--color-text-secondary);
    }

    /* \u2500\u2500 Track rows \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-track-list { margin-top: 10px; }
    .ms-track-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 8px;
      border-radius: 7px;
      transition: background .12s;
    }
    .ms-track-row:hover { background: var(--color-bg); }
    .ms-track-num {
      font-size: 12px;
      color: var(--color-text-secondary);
      min-width: 22px;
      text-align: right;
      flex-shrink: 0;
    }
    .ms-track-art {
      width: 38px;
      height: 38px;
      border-radius: 5px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .ms-track-art-ph {
      width: 38px;
      height: 38px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,.75);
      flex-shrink: 0;
    }
    .ms-track-info { flex: 1; min-width: 0; }
    .ms-track-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-track-sub {
      font-size: 11px;
      color: var(--color-text-secondary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ms-track-dur {
      font-size: 12px;
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
    .ms-track-remove {
      background: none; border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 13px;
      flex-shrink: 0;
      opacity: 0;
      transition: opacity .14s, color .14s;
      line-height: 1;
    }
    .ms-track-row:hover .ms-track-remove { opacity: 1; }
    .ms-track-remove:hover { color: #e53e3e; }

    /* \u2500\u2500 Playlist name input \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-playlist-name-input {
      font-size: 19px;
      font-weight: 700;
      background: transparent;
      border: none;
      border-bottom: 2px solid var(--color-border);
      color: var(--color-text);
      padding: 3px 0;
      width: 100%;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color .15s;
    }
    .ms-playlist-name-input:focus {
      outline: none;
      border-color: var(--color-accent);
    }

    /* \u2500\u2500 Meta bar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-top: 7px;
      margin-bottom: 4px;
    }

    /* \u2500\u2500 Action cards \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-action-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 16px 18px;
      margin: 0 20px 12px;
    }
    .ms-action-card h3 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 700;
      color: var(--color-text);
    }
    .ms-select {
      width: 100%;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      color: var(--color-text);
      font-size: 14px;
      padding: 9px 12px;
      box-sizing: border-box;
      font-family: inherit;
      cursor: pointer;
      margin-bottom: 10px;
    }
    .ms-select:focus { outline: none; border-color: var(--color-accent); }
    .ms-status-txt {
      margin-left: 10px;
      font-size: 13px;
      color: var(--color-text-secondary);
      vertical-align: middle;
    }

    /* \u2500\u2500 Shimmer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-shimmer {
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        var(--color-card)   50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      animation: ms-shimmer 1.3s infinite;
      border-radius: 4px;
      display: inline-block;
    }
    @keyframes ms-shimmer { to { background-position: -200% 0; } }

    /* \u2500\u2500 Error box margin fix \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    .ms-view .error-box { margin: 0 20px 14px; }

    /* \u2500\u2500 Responsive \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    @media (max-width: 768px) {
      .ms-card { margin: 0 12px 14px; padding: 16px; }
      .ms-action-card { margin: 0 12px 12px; }
      .ms-header { padding: 12px 14px 6px; }
      .ms-steps { padding: 10px 14px 8px; }
      .ms-title { font-size: 17px; }
      .ms-row { flex-direction: column; align-items: stretch; }
      .ms-btn { width: 100%; }
    }
  `,document.head.appendChild(e)}function Q(){let e=document.getElementById("content");e&&(e.innerHTML=`
    <div class="ms-view">
      ${oe()}
      ${U()}
      <div id="ms-body">${W()}</div>
    </div>
  `,Y())}function x(e){p=e;let t=document.querySelector(".ms-steps"),s=document.getElementById("ms-body");t&&(t.outerHTML=U()),s?(s.innerHTML=W(),Y(),document.querySelector(".ms-view")?.scrollIntoView({behavior:"smooth",block:"start"})):Q()}function oe(){return`
    <div class="ms-header">
      <button class="ms-back-btn" id="ms-back-btn">\u2190 Terug</button>
      <h1 class="ms-title">\u{1F3B5} AI Playlist Generator</h1>
    </div>
  `}function U(){let e=[{n:1,label:"Prompt"},{n:2,label:"Filters"},{n:3,label:"Genereren"},{n:4,label:"Resultaat"},{n:5,label:"Acties"}];return`
    <nav class="ms-steps" aria-label="Stappen">
      ${e.map((t,s)=>`
        <div class="ms-step${p===t.n?" active":""}${p>t.n?" done":""}">
          <div class="ms-step-dot">${p>t.n?"\u2713":t.n}</div>
          <span class="ms-step-label">${t.label}</span>
        </div>
        ${s<e.length-1?`<div class="ms-step-line${p>t.n?" done":""}"></div>`:""}
      `).join("")}
    </nav>
  `}function W(){switch(p){case 1:return ae();case 2:return ie();case 3:return le();case 4:return ce();case 5:return de();default:return""}}function ae(){let e=l?X():`
      <input type="text" class="ms-text-input" id="ms-seed-search"
        placeholder="Zoek een nummer uit je bibliotheek..."
        autocomplete="off" value="">
      <div id="ms-seed-results"></div>
    `;return`
    <div class="ms-card">
      <h2>Beschrijf je playlist</h2>
      <textarea
        class="ms-textarea"
        id="ms-prompt"
        placeholder="Beschrijf je playlist... bijv. 'Melancholy 90s alternative for a rainy day'"
        maxlength="500"
      >${a(v)}</textarea>

      <label class="ms-seed-toggle-row">
        <input type="checkbox" id="ms-seed-toggle" ${l?"checked":""}>
        Start vanuit een specifiek nummer
      </label>

      <div class="ms-seed-section${l?" visible":""}" id="ms-seed-section">
        ${e}
      </div>

      <div class="ms-analyze-btn-row">
        <button class="ms-btn ms-btn-primary" id="ms-analyze-btn"
          ${!v.trim()&&!l?"disabled":""}>Analyseer \u2192</button>
      </div>
    </div>
  `}function X(){return l?`
    <div class="ms-seed-chosen">
      ${l.ratingKey?`<img src="${z(l.ratingKey)}" class="ms-thumb" alt="" onerror="this.remove()">`:`<div class="ms-thumb-ph" style="background:${S(l.title||"")}">\u266A</div>`}
      <div class="ms-seed-info">
        <div class="ms-seed-name">${a(l.title||"Onbekende track")}</div>
        <div class="ms-seed-artist">${a(l.artist||"")}${l.album?" \xB7 "+a(l.album):""}</div>
      </div>
      <button class="ms-seed-clear" id="ms-seed-clear" title="Verwijder seed track">\u2715</button>
    </div>
  `:""}function ie(){let e=h?.genres||[],t=h?.decades||[],s=e.length?e.map(o=>`<button class="ms-chip${u.has(o)?" active":""}" data-chip-genre="${a(o)}">${a(o)}</button>`).join(""):'<span style="font-size:13px;color:var(--color-text-secondary)">Geen genres gesuggereerd</span>',n=t.length?t.map(o=>`<button class="ms-chip${g.has(o)?" active":""}" data-chip-decade="${a(o)}">${a(o)}</button>`).join(""):'<span style="font-size:13px;color:var(--color-text-secondary)">Geen decennia gesuggereerd</span>',r=Array(5).fill(0).map((o,m)=>m<b?"\u2605":"\u2606").join("");return`
    <div class="ms-card">
      <h2>Stel filters in</h2>

      <div class="ms-field">
        <label>Genres</label>
        <div class="ms-chips" id="ms-genre-chips">${s}</div>
      </div>

      <div class="ms-field">
        <label>Decennia</label>
        <div class="ms-chips" id="ms-decade-chips">${n}</div>
      </div>

      <div class="ms-field">
        <label>Minimale beoordeling: <span id="ms-rating-label">${r} (${b}+)</span></label>
        <div class="ms-slider-row">
          <span class="ms-slider-edge">1</span>
          <input type="range" class="ms-slider" id="ms-rating-slider"
            min="1" max="5" step="1" value="${b}">
          <span class="ms-slider-edge">5</span>
        </div>
      </div>

      <label class="ms-checkbox-row">
        <input type="checkbox" id="ms-exclude-live" ${C?"checked":""}>
        Live versies uitsluiten
      </label>

      <div class="ms-field">
        <label>Aantal tracks: <span class="ms-slider-val" id="ms-count-val">${k}</span></label>
        <div class="ms-slider-row">
          <span class="ms-slider-edge">10</span>
          <input type="range" class="ms-slider" id="ms-count-slider"
            min="10" max="50" step="5" value="${k}">
          <span class="ms-slider-edge">50</span>
        </div>
      </div>

      <div class="ms-preview-bar">
        <span>Beschikbare tracks die matchen:</span>
        <span class="ms-preview-count" id="ms-preview-count">
          <span class="ms-shimmer" style="width:40px;height:22px;vertical-align:middle;"></span>
        </span>
      </div>

      <div class="ms-row">
        <button class="ms-btn ms-btn-ghost" id="ms-back-to-1">\u2190 Terug</button>
        <button class="ms-btn ms-btn-primary" id="ms-generate-btn">Genereer playlist \u2192</button>
      </div>
    </div>
  `}function le(){return`
    <div class="ms-card">
      <div class="ms-gen-hero">
        <div class="ms-gen-spinner" id="ms-gen-spinner"></div>
        <div class="ms-gen-text" id="ms-gen-text">Playlist wordt gegenereerd\u2026</div>
      </div>

      <div class="ms-track-list" id="ms-stream-tracks"></div>

      <div class="ms-row" style="justify-content:center;display:none" id="ms-gen-done-row">
        <button class="ms-btn ms-btn-primary" id="ms-to-result-btn">Bekijk resultaat \u2192</button>
      </div>
    </div>
  `}function ce(){let e=i.reduce((s,n)=>s+(n.duration||0),0),t=i.map((s,n)=>L(s,n,!0)).join("");return`
    <div class="ms-card">
      <input
        type="text"
        class="ms-playlist-name-input"
        id="ms-playlist-name"
        value="${a(c)}"
        placeholder="Playlist naam\u2026"
        maxlength="80"
      >
      <div class="ms-meta">
        <span>\u{1F3B5} ${i.length} tracks</span>
        <span>\u23F1 ${M(e)}</span>
        ${E?`<span>\u{1F4B0} ${a(String(E))}</span>`:""}
        ${$?`<span>\u{1F524} ${a(String($))} tokens</span>`:""}
      </div>

      <div class="ms-track-list" id="ms-result-tracks">
        ${t||'<div style="padding:20px;text-align:center;color:var(--color-text-secondary)">Geen tracks gegenereerd</div>'}
      </div>

      <div class="ms-row">
        <button class="ms-btn ms-btn-ghost"      id="ms-back-to-2">\u2190 Terug naar filters</button>
        <button class="ms-btn ms-btn-secondary"  id="ms-regen-btn">\u21BB Opnieuw genereren</button>
        <button class="ms-btn ms-btn-primary"    id="ms-to-actions-btn">Acties \u2192</button>
      </div>
    </div>
  `}function de(){let e=f.length?f.map(s=>{let n=s.clientIdentifier||s.id||s.name||"",r=s.name||s.title||s.clientIdentifier||n;return`<option value="${a(n)}"${P===n?" selected":""}>${a(r)}</option>`}).join(""):'<option value="">Geen clients gevonden</option>',t=y.length?y.map(s=>{let n=s.ratingKey||s.id||"",r=s.title||s.name||n;return`<option value="${a(n)}">${a(r)}</option>`}).join(""):'<option value="">Geen playlists gevonden</option>';return`
    <div class="ms-card" style="margin-bottom:0">
      <h2 style="margin-bottom:4px">Playlist klaar \u2713</h2>
      <div class="ms-meta"><span>\u{1F3B5} ${i.length} tracks \xB7 ${a(c)}</span></div>
    </div>

    <div class="ms-action-card">
      <h3>\u25B6 Nu afspelen</h3>
      <select class="ms-select" id="ms-client-select">
        <option value="">Kies een Plex-client\u2026</option>
        ${e}
      </select>
      <button class="ms-btn ms-btn-primary" id="ms-play-btn"
        ${f.length?"":"disabled"}>\u25B6 Play Now</button>
      <span class="ms-status-txt" id="ms-play-status"></span>
    </div>

    <div class="ms-action-card">
      <h3>\u{1F4BE} Opslaan als nieuwe playlist</h3>
      <button class="ms-btn ms-btn-secondary" id="ms-save-btn">Opslaan in Plex</button>
      <span class="ms-status-txt" id="ms-save-status"></span>
    </div>

    <div class="ms-action-card">
      <h3>\u2795 Toevoegen aan bestaande playlist</h3>
      <select class="ms-select" id="ms-playlist-select">
        <option value="">Kies een playlist\u2026</option>
        ${t}
      </select>
      <button class="ms-btn ms-btn-secondary" id="ms-add-btn"
        ${y.length?"":"disabled"}>Toevoegen</button>
      <span class="ms-status-txt" id="ms-add-status"></span>
    </div>

    <div class="ms-action-card" style="border:none;background:none;padding-top:0">
      <div class="ms-row" style="margin-top:0">
        <button class="ms-btn ms-btn-ghost" id="ms-back-to-4">\u2190 Terug naar resultaat</button>
      </div>
    </div>
  `}function L(e,t,s=!1){let n=e.ratingKey?z(e.ratingKey):null,r=n?`<img src="${a(n)}" class="ms-track-art" alt="" loading="lazy"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`:"",o=`<div class="ms-track-art-ph"
    style="background:${S(e.album||e.title||"")};${n?"display:none":""}"
  >${T(e.album||e.title||"?")}</div>`,m=s?`<button class="ms-track-remove" data-remove-idx="${t}"
         title="Verwijder track" aria-label="Verwijder ${a(e.title||"")}">\u2715</button>`:"";return`
    <div class="ms-track-row" data-track-idx="${t}">
      <span class="ms-track-num">${t+1}</span>
      ${r}${o}
      <div class="ms-track-info">
        <div class="ms-track-title" title="${a(e.title||"Onbekend")}">${a(e.title||"Onbekend")}</div>
        <div class="ms-track-sub">${a(e.artist||e.grandparentTitle||"")}${e.album||e.parentTitle?" \xB7 "+a(e.album||e.parentTitle):""}</div>
      </div>
      <span class="ms-track-dur">${e.duration?M(e.duration):""}</span>
      ${m}
    </div>
  `}function Y(){switch(document.getElementById("ms-back-btn")?.addEventListener("click",()=>{d&&(d.abort(),d=null),Z("mediasage")}),p){case 1:me();break;case 2:ge();break;case 3:be();break;case 4:xe();break;case 5:fe();break}}function me(){document.getElementById("ms-prompt")?.addEventListener("input",e=>{v=e.target.value;let t=document.getElementById("ms-analyze-btn");t&&(t.disabled=!v.trim()&&!l)}),document.getElementById("ms-seed-toggle")?.addEventListener("change",e=>{let t=document.getElementById("ms-seed-section");t&&(e.target.checked?t.classList.add("visible"):(t.classList.remove("visible"),l=null,t.innerHTML=`
        <input type="text" class="ms-text-input" id="ms-seed-search"
          placeholder="Zoek een nummer uit je bibliotheek\u2026" autocomplete="off">
        <div id="ms-seed-results"></div>
      `,j()))}),j(),ee(),document.getElementById("ms-analyze-btn")?.addEventListener("click",ue)}function j(){document.getElementById("ms-seed-search")?.addEventListener("input",e=>{clearTimeout(J);let t=e.target.value.trim();if(!t){let s=document.getElementById("ms-seed-results");s&&(s.innerHTML="");return}J=setTimeout(()=>pe(t),350)})}function ee(){document.getElementById("ms-seed-clear")?.addEventListener("click",()=>{l=null;let e=document.getElementById("ms-seed-section");e&&(e.innerHTML=`
        <input type="text" class="ms-text-input" id="ms-seed-search"
          placeholder="Zoek een nummer uit je bibliotheek\u2026" autocomplete="off">
        <div id="ms-seed-results"></div>
      `,document.getElementById("ms-seed-toggle").checked=!1,e.classList.remove("visible"),j())})}async function pe(e){let t=document.getElementById("ms-seed-results");if(t){t.innerHTML='<div class="loading" style="padding:10px;text-align:center"><div class="spinner"></div></div>';try{let s=await H(e),n=Array.isArray(s)?s:s?.tracks||s?.results||[];if(!n.length){t.innerHTML='<div style="padding:10px 12px;font-size:13px;color:var(--color-text-secondary)">Geen nummers gevonden</div>';return}let r=n.slice(0,12).map((o,m)=>{let I=o.title||o.name||"Onbekend",A=o.artist||o.grandparentTitle||"",B=o.album||o.parentTitle||"",ne=o.ratingKey?`<img src="${z(o.ratingKey)}" class="ms-thumb" alt="" onerror="this.remove()">`:`<div class="ms-thumb-ph" style="background:${S(B||I)}">${T(I)}</div>`;return`
        <div class="ms-search-result" data-track='${JSON.stringify({ratingKey:o.ratingKey,title:I,artist:A,album:B}).replace(/'/g,"&#39;")}'>
          ${ne}
          <div class="ms-result-info">
            <div class="ms-result-title">${a(I)}</div>
            <div class="ms-result-sub">${a(A)}${B?" \xB7 "+a(B):""}</div>
          </div>
        </div>
      `}).join("");t.innerHTML=`<div class="ms-search-results">${r}</div>`,t.querySelectorAll(".ms-search-result").forEach(o=>{o.addEventListener("click",()=>{try{l=JSON.parse(o.dataset.track.replace(/&#39;/g,"'"))}catch{return}let m=document.getElementById("ms-seed-section");m&&(m.innerHTML=X(),ee())})})}catch(s){t.innerHTML=`<div class="error-box">Zoeken mislukt: ${a(s.message)}</div>`}}}async function ue(){let e=document.getElementById("ms-prompt"),t=(e?.value||v).trim();if(!t&&!l){e?.focus();return}let s=document.getElementById("ms-analyze-btn");s&&(s.disabled=!0,s.textContent="Analyseren\u2026");try{let n;l?n=await G({...l,prompt:t||void 0}):n=await K(t),h=n,v=t,u=new Set(n?.genres||[]),g=new Set(n?.decades||[]),x(2)}catch(n){s&&(s.disabled=!1,s.textContent="Analyseer \u2192"),se(`Analyse mislukt: ${n.message}`)}}function ge(){document.getElementById("ms-genre-chips")?.addEventListener("click",e=>{let t=e.target.closest("[data-chip-genre]");if(!t)return;let s=t.dataset.chipGenre;u.has(s)?u.delete(s):u.add(s),t.classList.toggle("active",u.has(s)),w()}),document.getElementById("ms-decade-chips")?.addEventListener("click",e=>{let t=e.target.closest("[data-chip-decade]");if(!t)return;let s=t.dataset.chipDecade;g.has(s)?g.delete(s):g.add(s),t.classList.toggle("active",g.has(s)),w()}),document.getElementById("ms-rating-slider")?.addEventListener("input",e=>{b=parseInt(e.target.value);let t=document.getElementById("ms-rating-label");if(t){let s=Array(5).fill(0).map((n,r)=>r<b?"\u2605":"\u2606").join("");t.textContent=`${s} (${b}+)`}w()}),document.getElementById("ms-count-slider")?.addEventListener("input",e=>{k=parseInt(e.target.value);let t=document.getElementById("ms-count-val");t&&(t.textContent=k)}),document.getElementById("ms-exclude-live")?.addEventListener("change",e=>{C=e.target.checked,w()}),document.getElementById("ms-back-to-1")?.addEventListener("click",()=>x(1)),document.getElementById("ms-generate-btn")?.addEventListener("click",()=>x(3)),w(0)}function te(){return{prompt:v||void 0,seed_track:l||void 0,genres:[...u],decades:[...g],min_rating:b,exclude_live:C,track_count:k}}function w(e=420){clearTimeout(F),F=setTimeout(async()=>{let t=document.getElementById("ms-preview-count");if(t){t.innerHTML='<span class="ms-shimmer" style="width:38px;height:22px;vertical-align:middle;"></span>';try{let s=await O(te()),n=s?.count??s?.total??(typeof s=="number"?s:"\u2014"),r=document.getElementById("ms-preview-count");r&&(r.textContent=n)}catch{let s=document.getElementById("ms-preview-count");s&&(s.textContent="\u2014")}}},e)}function be(){i=[],E=null,$=null,d&&(d.abort(),d=null),d=V(te(),e=>{i.push(e);let t=document.getElementById("ms-stream-tracks");if(t){let n=document.createElement("div");n.innerHTML=L(e,i.length-1,!1),t.appendChild(n.firstElementChild)}let s=document.getElementById("ms-gen-text");s&&(s.textContent=`${i.length} track${i.length!==1?"s":""} gevonden\u2026`)},e=>{if(d=null,E=e.cost||e.estimated_cost||null,$=e.tokens||e.token_usage||null,e.tracks?.length&&!i.length){i=e.tracks;let r=document.getElementById("ms-stream-tracks");r&&(r.innerHTML=i.map((o,m)=>L(o,m,!1)).join(""))}if(c==="Mijn playlist"){let r=e.suggested_name||e.name||h?.suggested_name||h?.name;r&&(c=r)}let t=document.getElementById("ms-gen-text"),s=document.getElementById("ms-gen-spinner"),n=document.getElementById("ms-gen-done-row");t&&(t.textContent=`\u2713 Klaar \u2014 ${i.length} tracks`),s&&(s.style.animation="none",s.style.borderColor="var(--color-accent)"),n&&(n.style.display="flex",document.getElementById("ms-to-result-btn")?.addEventListener("click",()=>x(4)))},e=>{if(e?.name==="AbortError")return;se(`Generatie mislukt: ${e.message}`);let t=document.getElementById("ms-gen-spinner");t&&(t.style.animation="none")})}function xe(){document.getElementById("ms-playlist-name")?.addEventListener("input",e=>{c=e.target.value}),document.getElementById("ms-result-tracks")?.addEventListener("click",e=>{let t=e.target.closest("[data-remove-idx]");if(!t)return;let s=parseInt(t.dataset.removeIdx);if(isNaN(s)||s<0||s>=i.length)return;i.splice(s,1);let n=document.getElementById("ms-result-tracks");n&&(n.innerHTML=i.map((r,o)=>L(r,o,!0)).join("")),ve()}),document.getElementById("ms-back-to-2")?.addEventListener("click",()=>x(2)),document.getElementById("ms-regen-btn")?.addEventListener("click",()=>{c=document.getElementById("ms-playlist-name")?.value||c,x(3)}),document.getElementById("ms-to-actions-btn")?.addEventListener("click",async()=>{c=document.getElementById("ms-playlist-name")?.value||c;let e=document.getElementById("ms-to-actions-btn");e&&(e.disabled=!0,e.textContent="Laden\u2026");try{let[t,s]=await Promise.all([q().catch(()=>[]),D().catch(()=>[])]);f=Array.isArray(t)?t:t?.clients||[],y=Array.isArray(s)?s:s?.playlists||[]}catch{f=[],y=[]}x(5)})}function ve(){let e=document.querySelector(".ms-meta");if(!e)return;let t=i.reduce((n,r)=>n+(r.duration||0),0),s=e.querySelectorAll("span");s[0]&&(s[0].textContent=`\u{1F3B5} ${i.length} tracks`),s[1]&&(s[1].textContent=`\u23F1 ${M(t)}`)}function fe(){document.getElementById("ms-play-btn")?.addEventListener("click",async()=>{let e=document.getElementById("ms-client-select")?.value;if(!e)return;P=e;let t=document.getElementById("ms-play-btn"),s=document.getElementById("ms-play-status");t&&(t.disabled=!0,t.textContent="Bezig\u2026");try{let n=i.map(r=>r.ratingKey).filter(Boolean);await R(n,e),t&&(t.disabled=!1,t.textContent="\u2713 Afspelen gestart"),s&&(s.textContent="\u2713")}catch(n){t&&(t.disabled=!1,t.textContent="\u25B6 Play Now"),s&&(s.textContent=`Mislukt: ${n.message}`)}}),document.getElementById("ms-save-btn")?.addEventListener("click",async()=>{let e=document.getElementById("ms-save-btn"),t=document.getElementById("ms-save-status");e&&(e.disabled=!0,e.textContent="Opslaan\u2026");try{await _({name:c,tracks:i,ratingKeys:i.map(s=>s.ratingKey).filter(Boolean)}),e&&(e.disabled=!1,e.textContent="\u2713 Opgeslagen"),t&&(t.textContent="\u2713 Playlist aangemaakt in Plex")}catch(s){e&&(e.disabled=!1,e.textContent="Opslaan in Plex"),t&&(t.textContent=`Mislukt: ${s.message}`)}}),document.getElementById("ms-add-btn")?.addEventListener("click",async()=>{let e=document.getElementById("ms-playlist-select")?.value;if(!e)return;let t=document.getElementById("ms-add-btn"),s=document.getElementById("ms-add-status");t&&(t.disabled=!0,t.textContent="Toevoegen\u2026");try{await N({id:e,ratingKeys:i.map(n=>n.ratingKey).filter(Boolean)}),t&&(t.disabled=!1,t.textContent="Toevoegen"),s&&(s.textContent="\u2713 Tracks toegevoegd")}catch(n){t&&(t.disabled=!1,t.textContent="Toevoegen"),s&&(s.textContent=`Mislukt: ${n.message}`)}}),document.getElementById("ms-back-to-4")?.addEventListener("click",()=>x(4))}function se(e){let t=document.getElementById("ms-body");if(!t)return;let s=t.querySelector(".error-box.ms-injected");s&&s.remove();let n=document.createElement("div");n.className="error-box ms-injected",n.textContent=`\u26A0 ${e}`,t.insertBefore(n,t.firstChild)}function M(e){if(!e)return"";let t=Math.round(e/1e3),s=Math.floor(t/3600),n=Math.floor(t%3600/60),r=t%60;return s>0?`${s}u ${n}m`:`${n}:${String(r).padStart(2,"0")}`}export{Ie as loadMediaSagePlaylist};
