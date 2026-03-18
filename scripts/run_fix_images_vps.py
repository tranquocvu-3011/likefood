import paramiko

def run():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)
        print("Connected!")

        commands = [
            "cd /home/tranquocvu/likefood && git pull origin main --force",
            "cd /home/tranquocvu/likefood && npx tsx scripts/fix_broken_urls.ts",
        ]
        
        for cmd in commands:
            print(f"\n> {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', errors='ignore').strip()
            if out: print(out)
            if exit_status != 0:
                err = stderr.read().decode('utf-8', errors='ignore').strip()
                print(f"STDERR: {err}")
                break

        print("\nAll done!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
