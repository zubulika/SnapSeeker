import asyncio
import os
from winsdk.windows.storage import StorageFile, FileAccessMode
from winsdk.windows.graphics.imaging import BitmapDecoder
from winsdk.windows.media.ocr import OcrEngine

class OcrScanner:
    def __init__(self):
        # Initialize the native Windows OCR engine using system language settings
        self.engine = OcrEngine.try_create_from_user_profile_languages()
        if not self.engine:
            raise RuntimeError("Could not initialize Windows OCR engine. Please check system language settings.")

    async def scan_image(self, file_path: str) -> str:
        """
        Loads an image from the given file path and performs OCR using the native
        Windows Runtime API. Returns the recognized text.
        """
        try:
            absolute_path = os.path.abspath(file_path)
            # 1. Load the file as a Windows StorageFile
            storage_file = await StorageFile.get_file_from_path_async(absolute_path)
            # 2. Open a read stream on the file
            stream = await storage_file.open_async(FileAccessMode.READ)
            # 3. Create a decoder to decode the image format (PNG, JPG, BMP, etc.)
            decoder = await BitmapDecoder.create_async(stream)
            # 4. Extract the software bitmap format needed by the OCR engine
            software_bitmap = await decoder.get_software_bitmap_async()
            # 5. Run the OCR engine
            result = await self.engine.recognize_async(software_bitmap)
            
            # Clean up the WinRT stream handle
            stream.close()
            return result.text
        except Exception as e:
            # Handle corrupt/unsupported images gracefully
            return ""
