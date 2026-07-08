import subprocess
import sys
import os

def main():
    print("Starting SnapSeeker...")
    project_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Run npm start in the project directory
    try:
        # Use shell=True for Windows to resolve npm batch command
        subprocess.Popen(["npm", "start"], cwd=project_dir, shell=True)
    except Exception as e:
        print(f"Error starting SnapSeeker: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
