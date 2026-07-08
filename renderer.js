// DOM Elements
const browseBtn = document.getElementById('browse-btn');
const folderPathInput = document.getElementById('folder-path');
const keywordsInput = document.getElementById('keywords');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const matchesList = document.getElementById('matches-list');
const previewMetadata = document.getElementById('preview-metadata');
const previewText = document.getElementById('preview-text');

let matchesDict = {}; // Map of filePath -> match details

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
  const keywords = keywordsInput.value;

  if (!folderPath) {
    alert('Please select a target folder first.');
    return;
  }
  if (!keywords.trim()) {
    alert('Please enter at least one keyword.');
    return;
  }

  // Reset UI State
  matchesList.innerHTML = '';
  previewMetadata.innerHTML = '';
  previewText.innerText = 'No image selected. Click a match to view extracted text.';
  matchesDict = {};
  progressBar.style.width = '0%';

  // Set scanning state UI
  startBtn.disabled = true;
  stopBtn.disabled = false;
  browseBtn.disabled = true;
  keywordsInput.disabled = true;

  statusText.innerText = 'Starting scan engine...';

  // Start the scan via main process
  window.api.startScan(folderPath, keywords);
});

// 3. Stop OCR Scan
stopBtn.addEventListener('click', () => {
  window.api.stopScan();
  statusText.innerText = 'Stopping scan...';
});

// ─── OCR Scan Listeners ──────────────────────────────────────────────────────

// A. Scan initialization info
window.api.onScanInfo(({ total }) => {
  statusText.innerText = `Found ${total} images to scan. Starting...`;
});

// B. Scan progress updates
window.api.onScanProgress(({ current, total, fileName }) => {
  const percentage = ((current / total) * 100).toFixed(1);
  progressBar.style.width = `${percentage}%`;
  statusText.innerText = `Scanning [${current} / ${total}] (${percentage}%): ${fileName}`;
});

// C. Found a matching image
window.api.onScanMatch((matchData) => {
  const { filePath, fileName, matchedKeywords, text } = matchData;
  matchesDict[filePath] = matchData;

  // Create list item element
  const li = document.createElement('li');
  li.className = 'match-item';
  li.dataset.path = filePath;

  // Title
  const title = document.createElement('span');
  title.className = 'match-title';
  title.innerText = fileName;
  li.appendChild(title);

  // Tags container
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'match-tags';
  matchedKeywords.forEach(keyword => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag';
    tag.innerText = keyword;
    tagsContainer.appendChild(tag);
  });
  li.appendChild(tagsContainer);

  // Event: Click to Preview
  li.addEventListener('click', () => {
    // Highlight selected item
    document.querySelectorAll('.match-item').forEach(el => el.classList.remove('selected'));
    li.classList.add('selected');

    // Load Preview
    previewMetadata.innerHTML = `
      <p><strong>Filename:</strong> ${fileName}</p>
      <p><strong>Path:</strong> ${filePath}</p>
      <p><strong>Keywords Matched:</strong> ${matchedKeywords.join(', ')}</p>
    `;
    previewText.innerText = text;
  });

  // Event: Double-Click to Open
  li.addEventListener('dblclick', () => {
    window.api.openImage(filePath);
  });

  matchesList.appendChild(li);
});

// D. Scan finished
window.api.onScanDone(({ count }) => {
  resetControlsState();
  statusText.innerText = `Scan completed. Found ${count} matches.`;
  alert(`Scan completed! Found ${count} matching images.`);
});

// E. Scan encountered error
window.api.onScanError((errMessage) => {
  resetControlsState();
  statusText.innerText = 'Scan failed.';
  alert(`Error: ${errMessage}`);
});

// Helper: Restore original button states
function resetControlsState() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  browseBtn.disabled = false;
  keywordsInput.disabled = false;
}
