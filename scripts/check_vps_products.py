import paramiko

def run():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)

        tests = [
            # ID 15 TRA VI OI HONG
            ("ID15-uploads", "curl -sI 'http://localhost:3000/uploads/2790e128-da16-4553-a795-4aef49807445.webp' 2>&1 | head -3"),
            ("ID15-api", "curl -sI 'http://localhost:3000/api/uploads/2790e128-da16-4553-a795-4aef49807445.webp' 2>&1 | head -3"),
            # ID 14 TRA THAO MOC
            ("ID14", "curl -sI 'http://localhost:3000/api/uploads/4ff489b0-0bc0-4aa7-aa2a-39d9bced015e.jpg' 2>&1 | head -2"),
            # ID 12 TRA TAM SEN
            ("ID12", "curl -sI 'http://localhost:3000/api/uploads/bba31045-d838-4d88-a354-36495c071a2e.jpg' 2>&1 | head -2"),
            # ID 11 TRA OI GIAM CAN
            ("ID11", "curl -sI 'http://localhost:3000/api/uploads/c3e2dc8c-7303-4119-85d8-2b658085a463.jpg' 2>&1 | head -2"),
            # Check file on disk
            ("DISK", "ls -la /home/tranquocvu/likefood/public/uploads/2790e128* 2>&1"),
        ]

        for label, cmd in tests:
            stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
            stdout.channel.recv_exit_status()
            out = stdout.read().decode('utf-8', errors='ignore').strip()
            print(f"[{label}] {out}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
