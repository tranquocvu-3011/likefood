import paramiko

def run():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    print(f"Connecting to {username}@{hostname}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)
        print("Connected! Running update_posts script on VPS...")

        cmd = "cd /home/tranquocvu/likefood && npx tsx scripts/update_posts.ts"
        print(f"Running: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        exit_status = stdout.channel.recv_exit_status()

        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()

        if out: print(f"Output:\n{out}")
        if err: print(f"Stderr:\n{err}")
        print(f"Exit status: {exit_status}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
