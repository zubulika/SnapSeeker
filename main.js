const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { createWorker } = require('tesseract.js');

// Register media protocol scheme as privileged before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { bypassCSP: true, secure: true, supportFetchAPI: true } }
]);

let mainWindow;
let isScanning = false;
let tesseractWorker = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#18181b',
      symbolColor: '#f4f4f5',
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(async () => {
  // Set up local media protocol handler to securely serve images to renderer
  protocol.handle('media', (request) => {
    const filePath = decodeURIComponent(request.url.replace('media://', ''));
    return net.fetch('file:///' + filePath);
  });

  createWindow();

  // Eagerly initialize Tesseract worker on startup for instant search response
  try {
    tesseractWorker = await createWorker('eng');
  } catch (err) {
    console.error('Failed to pre-load OCR worker:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  // Clean up OCR worker on exit
  if (tesseractWorker) {
    await tesseractWorker.terminate();
  }
  if (process.platform !== 'darwin') app.quit();
});

// Helper: Recursively find images
async function getImagesRecursively(dir, files_ = []) {
  try {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        await getImagesRecursively(fullPath, files_);
      } else {
        const ext = path.extname(file.name).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.bmp'].includes(ext)) {
          files_.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err);
  }
  return files_;
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────

// 1. Folder Selection Dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  }
  return result.filePaths[0];
});

// 2. Open Selected Image in Default System Viewer
ipcMain.on('open-image', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    shell.openPath(filePath);
  }
});

// 3. OCR Scan Control
ipcMain.on('start-scan', async (event, { folderPath, keywords }) => {
  if (isScanning) return;
  isScanning = true;

  const keywordList = keywords
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);

  try {
    // A. Gather files
    const images = await getImagesRecursively(folderPath);
    const totalFiles = images.length;
    event.sender.send('scan-info', { total: totalFiles });

    if (totalFiles === 0) {
      event.sender.send('scan-done', { count: 0 });
      isScanning = false;
      return;
    }

    // B. Ensure Tesseract Worker is ready
    if (!tesseractWorker) {
      tesseractWorker = await createWorker('eng');
    }

    let matchCount = 0;

    // C. Scan loop
    for (let i = 0; i < totalFiles; i++) {
      if (!isScanning) break; // Cancel requested

      const filePath = images[i];
      const fileName = path.basename(filePath);

      // Send progress to UI
      event.sender.send('scan-progress', {
        current: i + 1,
        total: totalFiles,
        fileName: fileName
      });

      try {
        // Run OCR
        const { data: { text } } = await tesseractWorker.recognize(filePath);
        
        // Search text for keywords
        const textLower = text.toLowerCase();
        const matchedKeywords = keywordList.filter(k => textLower.includes(k));

        if (matchedKeywords.length > 0) {
          matchCount++;
          event.sender.send('scan-match', {
            filePath: filePath,
            fileName: fileName,
            matchedKeywords: matchedKeywords,
            text: text
          });
        }
      } catch (ocrErr) {
        console.error(`OCR failed for: ${fileName}`, ocrErr);
        // Continue scanning other files even if one fails
      }
    }

    event.sender.send('scan-done', { count: matchCount });
  } catch (err) {
    event.sender.send('scan-error', err.message);
  } finally {
    isScanning = false;
  }
});

ipcMain.on('stop-scan', () => {
  isScanning = false;
});

ipcMain.on('open-in-folder', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath);
  }
});

