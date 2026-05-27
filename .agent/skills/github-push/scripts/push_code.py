#!/usr/bin/env python3
import subprocess
import sys
import os

def run_command(command, check=True):
    """Utility to run shell commands safely and return outputs."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=check,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return result.stdout.strip(), result.stderr.strip()
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Error running command: {command}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        sys.exit(1)

def get_git_status():
    stdout, _ = run_command("git status --porcelain")
    return stdout

def get_current_branch():
    branch, _ = run_command("git rev-parse --abbrev-ref HEAD")
    return branch

def check_has_remote():
    stdout, _ = run_command("git remote")
    return len(stdout.strip()) > 0

def push_to_github(commit_message=None):
    print("[INFO] Checking Git Repository Status...")
    
    # Ensure git is initialized
    if not os.path.exists(".git"):
        print("[ERROR] This is not a git repository. Please initialize git first.")
        sys.exit(1)

    # Check for remotes
    if not check_has_remote():
        print("[WARNING] No Git Remote configured. Please add a remote first (e.g. git remote add origin <URL>).")
        sys.exit(1)

    status = get_git_status()
    if not status:
        print("[SUCCESS] Your workspace is already clean! Nothing to commit or push.")
        return

    print("[INFO] Modified/Untracked files found:\n" + status)
    
    branch = get_current_branch()
    print(f"[INFO] Current active branch: '{branch}'")

    # Set default high-quality commit message if none is provided
    if not commit_message:
        commit_message = "feat: optimize maintenance payment VietQR fallback and mobile layout views"
    
    print(f"[INFO] Staging all changes and committing with message: '{commit_message}'...")
    
    # Git lifecycle
    run_command("git add .")
    run_command(f'git commit -m "{commit_message}"')
    print("[INFO] Pushing changes to remote repository on branch: " + branch)
    
    stdout, stderr = run_command(f"git push origin {branch}", check=False)
    
    if "Rejected" in stderr or "error: failed to push" in stderr:
        print("[ERROR] Push failed. There might be changes on the remote branch that you don't have locally.")
        print("💡 Suggestion: Run 'git pull origin " + branch + "' to sync first, resolve conflicts, and push again.")
        print(f"Stderr context:\n{stderr}")
        sys.exit(1)
    
    print("\n[SUCCESS] Successfully pushed all commits to remote GitHub repository!")
    if stdout:
        print(stdout)
    if stderr:
        print(stderr)

if __name__ == "__main__":
    message = sys.argv[1] if len(sys.argv) > 1 else None
    push_to_github(message)
