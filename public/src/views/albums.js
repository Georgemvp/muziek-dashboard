// ── Albums view — placeholder for future implementation

export async function loadAlbums() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px;">
      <h1 style="font-size: 24px; margin: 0;">Albums</h1>
      <p style="color: var(--text-muted);">Coming soon…</p>
    </div>
  `;

  document.title = 'Muziek · Albums';
}
