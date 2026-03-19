import paramiko

def run():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)
        print("Connected! Syncing MySQL schema...")

        cmd = "cd /home/tranquocvu/likefood && npx prisma db push"
        print(f"> {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()

        if out: print(out)
        if err and "warn" not in err.lower() and "tip:" not in err.lower():
            print(f"STDERR: {err}")
        print(f"\nExit: {exit_status}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
