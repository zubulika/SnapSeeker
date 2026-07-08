# SnapSeeker 🔍

SnapSeeker is a fast, lightweight Electron desktop application that scans a directory of screenshots or images locally using offline OCR (`tesseract.js`) to find images containing specific keywords.

It is designed to help you search for credentials, database keys, 2FA bypass codes, or specific text receipts in large folders containing thousands of screenshots.

---

## Features
- 🚀 **Cross-Platform**: Built with Electron (Node.js + Chromium).
- 📶 **100% Offline**: Uses `tesseract.js` for local, secure client-side OCR.
- 🎨 **Modern Dark UI**: Features a clean dark-themed dashboard with HTML5 and CSS3.
- 🧵 **Smooth Experience**: Heavy OCR computations run in background threads via Tesseract worker threads, ensuring the UI never lags or freezes.
- 📂 **Native Dialogs**: Interacts with the OS folder select dialog and opens images directly in the default photo viewer on double-click.

---

## Installation

1. Open a terminal in this directory.
2. Install the Node modules:
   ```bash
   npm install
   ```

---

## How to Run

Launch the desktop application:
```bash
npm start
```

1. Click **Browse...** to select your target image folder.
2. Enter comma-separated keywords in the search field (e.g. `oracle, bypass, recovery, credentials`).
3. Click **Start Search**.
4. Single-click any found match to preview the extracted text content.
5. Double-click any found match to open the screenshot directly in your default photo viewer!
