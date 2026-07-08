import React from "react";

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="logo">SnapSeeker</a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="https://github.com/zubulika/SnapSeeker" target="_blank" rel="noopener noreferrer" className="github-link">GitHub</a>
          </div>
          <a href="#" className="btn nav-btn btn-primary">Download</a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="badge">Desktop Application</span>
            <h1>Find text in screenshots, instantly.</h1>
            <p className="tagline">
              A fast, private, and 100% offline OCR search engine for your desktop. Stop wasting hours digging through folders for backup codes, API credentials, or receipts.
            </p>
            <div className="hero-actions">
              <a href="#" className="btn btn-primary">Download for Windows</a>
              <a href="https://github.com/zubulika/SnapSeeker" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Source code</a>
            </div>
          </div>
          <div className="hero-preview">
            <div className="app-mockup-frame">
              <div className="glow-effect"></div>
              <img src="/assets/app_mockup.png" alt="SnapSeeker User Interface" className="app-mockup-img" />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Built for speed and privacy.</h2>
            <p>A simple, elegant utility that runs completely on your machine.</p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <span className="feature-icon-text">Security</span>
              <h3>100% Local and Private</h3>
              <p>Your images never touch the cloud. All OCR text extraction runs locally on your computer, keeping your sensitive credentials and files safe.</p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <span className="feature-icon-text">Performance</span>
              <h3>Fast OCR Engine</h3>
              <p>Powered by local worker threads that process multiple images in the background, keeping the user interface completely responsive.</p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <span className="feature-icon-text">Search</span>
              <h3>Multi-Keyword Queries</h3>
              <p>Filter through your screenshots by typing comma-separated keywords. Find files that match any specified terms instantly.</p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <span className="feature-icon-text">Integration</span>
              <h3>System Navigation</h3>
              <p>Displays matches in a clean list with text previews, and lets you double-click any result to open it in your default photo viewer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-container">
          <div className="section-header">
            <h2>How it works.</h2>
            <p>Three simple steps to retrieve your screenshot contents.</p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-num">1</div>
              <h4>Select folder</h4>
              <p>Choose the directory on your drive containing your screenshots or downloaded images.</p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-num">2</div>
              <h4>Enter keywords</h4>
              <p>Type in keywords (like "backup" or "oracle") to filter images by the text they contain.</p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-num">3</div>
              <h4>View matches</h4>
              <p>Browse through the list of matches, preview the extracted text, and open the file directly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Download Banner */}
      <section className="download-banner">
        <div className="banner-container">
          <h2>Get started with SnapSeeker today.</h2>
          <p>Clean, minimal, and open-source search utility for Windows 10 and 11.</p>
          <a href="#" className="btn btn-primary btn-large">Download Installer</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="logo">SnapSeeker</span>
            <p>Local OCR Search Engine for Desktop.</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/zubulika/SnapSeeker" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Support</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SnapSeeker. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
