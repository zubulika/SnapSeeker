import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import queue
import threading
import os
import glob
import asyncio
from scanner import OcrScanner

class ScanThread(threading.Thread):
    def __init__(self, folder_path, keywords, result_queue):
        super().__init__()
        self.folder_path = folder_path
        self.keywords = [k.strip().lower() for k in keywords.split(",") if k.strip()]
        self.result_queue = result_queue
        self._stop_event = threading.Event()

    def stop(self):
        self._stop_event.set()

    def run(self):
        # Create a new event loop for this thread to handle async WinRT tasks
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self.scan_loop())
        finally:
            loop.close()

    async def scan_loop(self):
        try:
            scanner = OcrScanner()
        except Exception as e:
            self.result_queue.put({"type": "error", "message": str(e)})
            return

        # Scan for supported formats (both in root and subdirectories)
        supported_extensions = ("*.png", "*.jpg", "*.jpeg", "*.bmp")
        files = []
        
        # Non-recursive scan
        for ext in supported_extensions:
            files.extend(glob.glob(os.path.join(self.folder_path, ext)))
        
        # Recursive scan (in subdirectories)
        for ext in supported_extensions:
            files.extend(glob.glob(os.path.join(self.folder_path, "**", ext), recursive=True))

        # Filter out duplicates and sort
        files = sorted(list(set(files)))
        total_files = len(files)

        self.result_queue.put({"type": "info", "total": total_files})

        for index, file_path in enumerate(files):
            if self._stop_event.is_set():
                break

            # Notify UI of current progress
            self.result_queue.put({
                "type": "progress",
                "current": index + 1,
                "total": total_files,
                "file_name": os.path.basename(file_path)
            })

            # Run OCR scanning
            text = await scanner.scan_image(file_path)
            
            # Check for keyword matches
            text_lower = text.lower()
            matches = [k for k in self.keywords if k in text_lower]
            
            if matches:
                self.result_queue.put({
                    "type": "match",
                    "file_path": file_path,
                    "file_name": os.path.basename(file_path),
                    "matched_keywords": matches,
                    "text": text
                })

        self.result_queue.put({"type": "done"})


class SnapSeekerApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("SnapSeeker — Desktop OCR Search")
        self.geometry("900x600")
        self.minsize(800, 500)
        
        self.result_queue = queue.Queue()
        self.scan_thread = None
        self.matches_dict = {}  # Map listbox display name -> match detail dict
        
        # Apply style
        self.style = ttk.Style()
        self.style.theme_use("vista")  # Clean default style for Windows
        
        self._create_widgets()
        self._check_queue_loop()

    def _create_widgets(self):
        # Top Frame (Inputs)
        input_frame = ttk.LabelFrame(self, text=" Search Configuration ", padding=15)
        input_frame.pack(fill="x", padx=15, pady=10)

        # Folder selection
        ttk.Label(input_frame, text="Target Folder:").grid(row=0, column=0, sticky="w", pady=5)
        self.folder_var = tk.StringVar()
        self.folder_entry = ttk.Entry(input_frame, textvariable=self.folder_var)
        self.folder_entry.grid(row=0, column=1, sticky="ew", padx=10, pady=5)
        
        self.browse_btn = ttk.Button(input_frame, text="Browse...", command=self._browse_folder)
        self.browse_btn.grid(row=0, column=2, sticky="e", pady=5)

        # Keywords input
        ttk.Label(input_frame, text="Keywords (comma-separated):").grid(row=1, column=0, sticky="w", pady=5)
        self.keywords_var = tk.StringVar(value="oracle, bypass, backup, recovery")
        self.keywords_entry = ttk.Entry(input_frame, textvariable=self.keywords_var)
        self.keywords_entry.grid(row=1, column=1, columnspan=2, sticky="ew", padx=(10, 0), pady=5)

        # Configure columns for grid expansion
        input_frame.columnconfigure(1, weight=1)

        # Control & Progress Frame
        control_frame = ttk.Frame(self, padding=15)
        control_frame.pack(fill="x", padx=15)

        self.start_btn = ttk.Button(control_frame, text="Start Search", command=self._start_search, width=15)
        self.start_btn.pack(side="left")

        self.stop_btn = ttk.Button(control_frame, text="Cancel", command=self._stop_search, state="disabled", width=15)
        self.stop_btn.pack(side="left", padx=10)

        self.progress_bar = ttk.Progressbar(control_frame, orient="horizontal", mode="determinate")
        self.progress_bar.pack(side="left", fill="x", expand=True, padx=15)

        self.status_var = tk.StringVar(value="Ready to scan")
        self.status_label = ttk.Label(control_frame, textvariable=self.status_var, font=("Segoe UI", 9, "italic"))
        self.status_label.pack(side="right")

        # Main Panel (Split List and Content Viewer)
        main_paned = ttk.Panedwindow(self, orient="horizontal")
        main_paned.pack(fill="both", expand=True, padx=15, pady=10)

        # Left list panel
        list_frame = ttk.Frame(main_paned)
        main_paned.add(list_frame, weight=1)

        ttk.Label(list_frame, text="Matches Found:").pack(anchor="w", pady=(0, 5))
        
        self.listbox_scrollbar = ttk.Scrollbar(list_frame, orient="vertical")
        self.matches_listbox = tk.Listbox(list_frame, yscrollcommand=self.listbox_scrollbar.set, font=("Segoe UI", 10))
        self.listbox_scrollbar.config(command=self.matches_listbox.yview)
        
        self.matches_listbox.pack(side="left", fill="both", expand=True)
        self.listbox_scrollbar.pack(side="right", fill="y")
        
        self.matches_listbox.bind("<<ListboxSelect>>", self._on_select_match)
        self.matches_listbox.bind("<Double-Button-1>", self._on_double_click_match)

        # Right preview panel
        preview_frame = ttk.Frame(main_paned)
        main_paned.add(preview_frame, weight=2)

        ttk.Label(preview_frame, text="OCR Text Content Preview:").pack(anchor="w", pady=(0, 5))
        
        self.text_scrollbar = ttk.Scrollbar(preview_frame, orient="vertical")
        self.text_preview = tk.Text(
            preview_frame, 
            yscrollcommand=self.text_scrollbar.set, 
            wrap="word", 
            font=("Consolas", 10),
            bg="#fdfdfd"
        )
        self.text_scrollbar.config(command=self.text_preview.yview)
        
        self.text_preview.pack(side="left", fill="both", expand=True)
        self.text_scrollbar.pack(side="right", fill="y")

        # Bottom help bar
        help_frame = ttk.Frame(self, padding=5)
        help_frame.pack(fill="x", side="bottom")
        ttk.Label(
            help_frame, 
            text="💡 Tip: Double-click a file in the list to open it directly in the photo viewer.", 
            font=("Segoe UI", 8)
        ).pack(side="left", padx=10)

    def _browse_folder(self):
        selected_folder = filedialog.askdirectory()
        if selected_folder:
            self.folder_var.set(os.path.normpath(selected_folder))

    def _start_search(self):
        folder = self.folder_var.get()
        keywords = self.keywords_var.get()

        if not folder or not os.path.exists(folder):
            messagebox.showerror("Error", "Please select a valid target folder path.")
            return

        if not keywords.strip():
            messagebox.showerror("Error", "Please enter at least one keyword.")
            return

        # Reset states
        self.matches_listbox.delete(0, "end")
        self.text_preview.delete("1.0", "end")
        self.matches_dict.clear()
        self.progress_bar["value"] = 0

        # UI state updates
        self.start_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.browse_btn.config(state="disabled")
        self.folder_entry.config(state="disabled")
        self.keywords_entry.config(state="disabled")

        self.status_var.set("Initializing scan engine...")

        # Start background thread
        self.scan_thread = ScanThread(folder, keywords, self.result_queue)
        self.scan_thread.start()

    def _stop_search(self):
        if self.scan_thread and self.scan_thread.is_alive():
            self.scan_thread.stop()
            self.status_var.set("Cancelling search...")

    def _on_select_match(self, event):
        selection = self.matches_listbox.curselection()
        if selection:
            item_text = self.matches_listbox.get(selection[0])
            match_data = self.matches_dict.get(item_text)
            if match_data:
                self.text_preview.delete("1.0", "end")
                # Highlight path at the top
                self.text_preview.insert("1.0", f"IMAGE FILE PATH:\n{match_data['file_path']}\n")
                self.text_preview.insert("end", f"MATCHED KEYWORDS: {', '.join(match_data['matched_keywords'])}\n")
                self.text_preview.insert("end", "="*50 + "\n\n")
                self.text_preview.insert("end", match_data["text"])

    def _on_double_click_match(self, event):
        selection = self.matches_listbox.curselection()
        if selection:
            item_text = self.matches_listbox.get(selection[0])
            match_data = self.matches_dict.get(item_text)
            if match_data:
                try:
                    os.startfile(match_data["file_path"])
                except Exception as e:
                    messagebox.showerror("Error", f"Could not open image: {e}")

    def _check_queue_loop(self):
        # Read items from the queue and update GUI
        while not self.result_queue.empty():
            try:
                msg = self.result_queue.get_nowait()
                msg_type = msg["type"]

                if msg_type == "error":
                    messagebox.showerror("Error", msg["message"])
                    self._reset_ui_after_search("Failed")
                    
                elif msg_type == "info":
                    total = msg["total"]
                    self.progress_bar["maximum"] = total
                    self.status_var.set(f"Found {total} images to scan.")

                elif msg_type == "progress":
                    current = msg["current"]
                    total = msg["total"]
                    file_name = msg["file_name"]
                    
                    self.progress_bar["value"] = current
                    self.status_var.set(f"Scanning [{current} / {total}]: {file_name}")

                elif msg_type == "match":
                    file_name = msg["file_name"]
                    matched_keywords = msg["matched_keywords"]
                    
                    # Create a unique list item string
                    display_text = f"[{', '.join(matched_keywords)}] {file_name}"
                    self.matches_dict[display_text] = msg
                    self.matches_listbox.insert("end", display_text)

                elif msg_type == "done":
                    self._reset_ui_after_search("Completed")
                    messagebox.showinfo("Done", f"Search completed! Found {len(self.matches_dict)} matches.")

            except queue.Empty:
                break
        
        # Schedule next queue check in 100ms
        self.after(100, self._check_queue_loop)

    def _reset_ui_after_search(self, status):
        self.start_btn.config(state="normal")
        self.stop_btn.config(state="disabled")
        self.browse_btn.config(state="normal")
        self.folder_entry.config(state="normal")
        self.keywords_entry.config(state="normal")
        self.status_var.set(f"Scan {status}")
        self.scan_thread = None


if __name__ == "__main__":
    app = SnapSeekerApp()
    app.mainloop()
