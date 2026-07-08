import subprocess
import socket
import webbrowser
import time
import os
import sys

def find_free_port():
    """Finds a random free port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('localhost', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]

def main():
    project_dir = os.path.dirname(os.path.abspath(__file__))
    website_dir = os.path.join(project_dir, 'website')
    
    port = find_free_port()
    print(f"Starting Next.js dev server on port {port}...")
    
    # Run the Next.js dev server on the selected port
    try:
        # Use shell=True for Windows command resolution
        process = subprocess.Popen(
            ["npx", "next", "dev", "-p", str(port)],
            cwd=website_dir,
            shell=True
        )
    except Exception as e:
        print(f"Error starting dev server: {e}", file=sys.stderr)
        sys.exit(1)
        
    # Wait a few seconds for Next.js compilation to start, then open the browser
    time.sleep(2.5)
    url = f"http://localhost:{port}"
    print(f"Opening browser to {url}...")
    webbrowser.open(url)
    
    try:
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping website dev server.")
        process.terminate()

if __name__ == "__main__":
    main()
