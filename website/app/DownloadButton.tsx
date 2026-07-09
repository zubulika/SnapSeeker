"use client";
import React, { useEffect, useState } from "react";

export default function DownloadButton({ className, text }: { className?: string, text: string }) {
  // Default fallback link to the releases page just in case
  const [downloadUrl, setDownloadUrl] = useState("https://github.com/zubulika/SnapSeeker/releases/latest");

  useEffect(() => {
    // Dynamically fetch the latest release from the GitHub API
    fetch("https://api.github.com/repos/zubulika/SnapSeeker/releases/latest")
      .then(res => res.json())
      .then(data => {
        if (data && data.assets) {
          // Find the executable installer in the release assets
          const exeAsset = data.assets.find((asset: any) => asset.name.endsWith(".exe"));
          if (exeAsset) {
            setDownloadUrl(exeAsset.browser_download_url);
          }
        }
      })
      .catch(err => console.error("Failed to fetch latest release:", err));
  }, []);

  return (
    <a href={downloadUrl} className={className}>{text}</a>
  );
}
