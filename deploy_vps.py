import paramiko
import time
import sys

def deploy():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    print(f"Connecting to {username}@{hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)
        print("Connected! Executing deployment commands...")
        
        commands = [
            "cd /home/tranquocvu/likefood && git pull origin main --force",
            "cd /home/tranquocvu/likefood && npm install",
            "cd /home/tranquocvu/likefood && npx next build",
            "cd /home/tranquocvu/likefood && pm2 restart likefood"
        ]
        
        for cmd in commands:
            print(f"Running: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            exit_status = stdout.channel.recv_exit_status()
            
            out = stdout.read().decode('utf-8', errors='ignore').strip()
            err = stderr.read().decode('utf-8', errors='ignore').strip()
            
            if out: print(f"Output: {out}")
            if err: print(f"Error: {err}")
            
            if exit_status != 0:
                print(f"Command failed with exit status {exit_status}")
                break
                
        print("Deployment sequence finished.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
