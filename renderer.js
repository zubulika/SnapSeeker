// DOM Elements
const browseBtn = document.getElementById('browse-btn');
const folderPathInput = document.getElementById('folder-path');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const matchesGrid = document.getElementById('matches-grid');
const previewMetadata = document.getElementById('preview-metadata');
const previewText = document.getElementById('preview-text');

// Keywords Tag Input Elements
const tagsContainer = document.getElementById('tags-container');
const tagsList = document.getElementById('tags-list');
const keywordInput = document.getElementById('keyword-input');

let matchesDict = {}; // Map of filePath -> match details
let activeKeywords = ['oracle', 'bypass', 'backup', 'recovery']; // Default tags

// ─── Keywords Tag Input Logic ────────────────────────────────────────────────

function renderTags() {
  tagsList.innerHTML = '';
  activeKeywords.forEach(tag => {
    const badge = document.createElement('span');
    badge.className = 'keyword-tag-badge';
    badge.innerText = tag;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tag-remove-btn';
    removeBtn.innerText = '×';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activeKeywords = activeKeywords.filter(k => k !== tag);
      renderTags();
    });

    badge.appendChild(removeBtn);
    tagsList.appendChild(badge);
  });
}

// Focus input on container click
tagsContainer.addEventListener('click', () => {
  keywordInput.focus();
});

// Watch input keys to separate tags
keywordInput.addEventListener('keydown', (e) => {
  if (e.key === ',' || e.key === 'Enter') {
    e.preventDefault();
    const val = keywordInput.value.replace(/,/g, '').trim().toLowerCase();
    if (val && !activeKeywords.includes(val)) {
      activeKeywords.push(val);
      renderTags();
    }
    keywordInput.value = '';
  } else if (e.key === 'Backspace' && keywordInput.value === '') {
    activeKeywords.pop();
    renderTags();
  }
});

// Initialize tags on load
renderTags();

// ─── Button Events ───────────────────────────────────────────────────────────

// 1. Browse Folder
browseBtn.addEventListener('click', async () => {
  const selectedPath = await window.api.selectFolder();
  if (selectedPath) {
    folderPathInput.value = selectedPath;
  }
});

// 2. Start OCR Scan
startBtn.addEventListener('click', () => {
  const folderPath = folderPathInput.value;

  if (!folderPath) {
    alert('Please select a target folder first.');
    return;
  }
  if (activeKeywords.length === 0) {
    alert('Please enter at least one keyword.');
    return;
  }

  // Reset UI State
  matchesGrid.innerHTML = '';
  previewMetadata.innerHTML = '';
  previewText.innerText = 'Select an image to view text.';
  matchesDict = {};
  progressBar.style.width = '0%';

  // Set scanning state UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  browseBtn.disabled = true;
  keywordInput.disabled = true;

  statusText.innerText = 'Searching...';

  // Join active keywords array with commas to send to Main process
  const keywordsString = activeKeywords.join(',');
  window.api.startScan(folderPath, keywordsString);
});

// 3. Stop OCR Scan
stopBtn.addEventListener('click', () => {
  window.api.stopScan();
  statusText.innerText = 'Stopping...';
});

// ─── OCR Scan Listeners ──────────────────────────────────────────────────────

// A. Scan initialization info
window.api.onScanInfo(({ total }) => {
  statusText.innerText = `Found ${total} images to search.`;
});

// B. Scan progress updates
window.api.onScanProgress(({ current, total, fileName }) => {
  const percentage = ((current / total) * 100).toFixed(1);
  progressBar.style.width = `${percentage}%`;
  statusText.innerText = `Searching [${current} / ${total}]: ${fileName}`;
});

// C. Found a matching image (Draw square thumbnail block)
window.api.onScanMatch((matchData) => {
  const { filePath, fileName, matchedKeywords, text } = matchData;
  matchesDict[filePath] = matchData;

  // Create thumbnail card
  const card = document.createElement('div');
  card.className = 'thumbnail-card';
  card.dataset.path = filePath;

  // Image element (securely loaded via custom media:// protocol)
  const img = document.createElement('img');
  img.className = 'thumbnail-img';
  img.src = `media://${encodeURIComponent(filePath)}`;
  img.alt = fileName;
  card.appendChild(img);

  // Hover overlay
  const overlay = document.createElement('div');
  overlay.className = 'card-overlay';

  // Three dots options button
  const optionsBtn = document.createElement('button');
  optionsBtn.className = 'options-btn';
  optionsBtn.innerText = '•••';
  overlay.appendChild(optionsBtn);

  // Dropdown menu
  const menu = document.createElement('div');
  menu.className = 'options-menu';

  const openBtn = document.createElement('button');
  openBtn.className = 'menu-item';
  openBtn.innerText = 'Open image';
  openBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.api.openImage(filePath);
    menu.classList.remove('show');
    card.classList.remove('menu-active');
  });
  menu.appendChild(openBtn);

  const folderBtn = document.createElement('button');
  folderBtn.className = 'menu-item';
  folderBtn.innerText = 'Show in folder';
  folderBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.api.openInFolder(filePath);
    menu.classList.remove('show');
    card.classList.remove('menu-active');
  });
  menu.appendChild(folderBtn);

  overlay.appendChild(menu);
  card.appendChild(overlay);

  // Toggle options dropdown menu on click
  optionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Close other dropdowns first
    document.querySelectorAll('.options-menu').forEach(el => {
      if (el !== menu) el.classList.remove('show');
    });
    document.querySelectorAll('.thumbnail-card').forEach(el => {
      if (el !== card) el.classList.remove('menu-active');
    });

    menu.classList.toggle('show');
    card.classList.toggle('menu-active');
  });

  // Event: Click to preview text
  card.addEventListener('click', () => {
    document.querySelectorAll('.thumbnail-card').forEach(el => el.classList.remove('selected'));
    card.classList.add('selected');

    // Load Preview Panel Content
    previewMetadata.innerHTML = `
      <p><strong>Name:</strong> ${fileName}</p>
      <p><strong>Location:</strong> ${filePath}</p>
      <p><strong>Matched:</strong> ${matchedKeywords.join(', ')}</p>
    `;
    previewText.innerText = text;
  });

  // Event: Double-Click to Open
  card.addEventListener('dblclick', () => {
    window.api.openImage(filePath);
  });

  matchesGrid.appendChild(card);
});

// D. Scan finished
window.api.onScanDone(({ count }) => {
  resetControlsState();
  statusText.innerText = `Search finished. Found ${count} matches.`;
  alert(`Search finished. Found ${count} matches.`);
});

// E. Scan encountered error
window.api.onScanError((errMessage) => {
  resetControlsState();
  statusText.innerText = 'Search failed.';
  alert(`An error occurred: ${errMessage}`);
});

// Helper: Restore original button states
function resetControlsState() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  browseBtn.disabled = false;
  keywordInput.disabled = false;
}

// Global click handler to close any active dropdown menus when clicking elsewhere
document.addEventListener('click', () => {
  document.querySelectorAll('.options-menu').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.thumbnail-card').forEach(el => el.classList.remove('menu-active'));
});
