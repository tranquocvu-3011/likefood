import paramiko

def run():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)

        commands = [
            "cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/nginx.conf 2>/dev/null | head -100",
            "cat /etc/nginx/conf.d/*.conf 2>/dev/null | head -50",
            "nginx -t 2>&1",
            # Also test if PM2 serves the sanpham directly
            "curl -sI http://localhost:3000/sanpham/ 2>&1 | head -3",
        ]
        
        for cmd in commands:
            print(f"\n{'='*60}\n> {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
            stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', errors='ignore').strip()
            err = stderr.read().decode('utf-8', errors='ignore').strip()
            if out: print(out)
            if err: print(f"STDERR: {err}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
