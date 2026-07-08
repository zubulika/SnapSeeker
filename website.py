import http.server
import socketserver
import socket
import webbrowser
import threading
import os
import time

def find_free_port():
    """Finds a random free port on localhost."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('localhost', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve files from the 'website' subdirectory
        project_dir = os.path.dirname(os.path.abspath(__file__))
        website_dir = os.path.join(project_dir, 'website')
        super().__init__(*args, directory=website_dir, **kwargs)

def start_server(port):
    """Starts the HTTP server in a blocking loop."""
    # Serve only on localhost for security
    with socketserver.TCPServer(('localhost', port), Handler) as httpd:
        print(f"Serving website at: http://localhost:{port}")
        httpd.serve_forever()

def main():
    port = find_free_port()
    
    # Start the HTTP server in a background daemon thread
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()
    
    # Wait briefly for the server to spin up, then open the browser
    time.sleep(0.5)
    url = f"http://localhost:{port}/index.html"
    print(f"Opening browser to {url}...")
    webbrowser.open(url)
    
    # Keep the main thread alive so the daemon server keeps running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping website server.")

if __name__ == "__main__":
    main()
