const urlInput = document.getElementById('urlInput');
const typeSelect = document.getElementById('typeSelect');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');
const libraryEl = document.getElementById('library');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadLibrary() {
  const res = await fetch('/api/library');
  const items = await res.json();
  renderLibrary(items);
}

function renderLibrary(items) {
  libraryEl.innerHTML = '';

  if (items.length === 0) {
    libraryEl.innerHTML = '<p class="empty">No media yet. Download something above.</p>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';

    const mediaTag =
      item.type === 'video'
        ? `<video controls preload="metadata" src="/media/${encodeURIComponent(item.filename)}"></video>`
        : `<audio controls preload="metadata" src="/media/${encodeURIComponent(item.filename)}"></audio>`;

    card.innerHTML = `
      <div class="card-title">${escapeHtml(item.title)}</div>
      ${mediaTag}
      <button class="delete-btn" data-id="${item.id}">Delete</button>
    `;
    libraryEl.appendChild(card);
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await fetch(`/api/library/${encodeURIComponent(id)}`, { method: 'DELETE' });
      loadLibrary();
    });
  });
}

downloadBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  const type = typeSelect.value;

  if (!url) {
    statusEl.textContent = 'Please paste a link first.';
    return;
  }

  downloadBtn.disabled = true;
  statusEl.textContent = '⏳ Downloading... this can take a while for 1080p video.';

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Download failed');

    statusEl.textContent = `✅ Done: ${data.title}`;
    urlInput.value = '';
    loadLibrary();
  } catch (err) {
    statusEl.textContent = `❌ ${err.message}`;
  } finally {
    downloadBtn.disabled = false;
  }
});

loadLibrary();