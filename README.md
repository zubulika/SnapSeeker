# SnapSeeker 🔍

SnapSeeker is a fast, lightweight Python desktop application that scans a directory of screenshots or images using Windows' native OCR engine to find images containing specific keywords.

It is particularly useful for finding screenshots of API credentials, database keys, 2FA bypass codes, or specific text receipts in large folders containing thousands of screenshots.

---

## Features
- 🚀 **High Speed**: Uses the built-in Windows UWP OCR engine via the `winsdk` API.
- 🧵 **Responsive UI**: The scanning process runs in a background thread, ensuring the Tkinter interface never freezes.
- 📊 **Real-time Progress**: Displays a progress bar and shows which file is currently being scanned.
- 🛠️ **Direct Interaction**: Double-clicking a matched file in the list opens it in the default system photo viewer.
- 📝 **Live Text Preview**: Shows the recognized text on the right side when you select an image from the match list.

---

## Installation

1. Open a terminal in this directory.
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## How to Run

Launch the application:
```bash
python app.py
```

1. Click **Browse...** to select your target image folder.
2. Enter comma-separated keywords in the search field (e.g. `oracle, bypass, recovery, credentials`).
3. Click **Start Search**.
4. Double-click any found match in the list to open it directly!
