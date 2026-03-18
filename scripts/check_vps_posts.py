import paramiko

def run():
    hostname = '172.188.242.53'
    username = 'tranquocvu'
    password = '3011200588888Vu@'

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(hostname, port=22, username=username, password=password, timeout=10)

        # Simple MySQL query to check image column
        cmd = '''cd /home/tranquocvu/likefood && npx tsx -e "
import { PrismaClient } from './src/generated/client';
const p = new PrismaClient();
p.post.findMany({ select: { id: true, title: true, image: true }, orderBy: { id: 'asc' } }).then(posts => {
  posts.forEach(p2 => {
    const img = p2.image || '';
    const hasImg = img.startsWith('http') ? 'OK' : 'MISSING';
    console.log(p2.id + ' | ' + hasImg + ' | ' + (p2.title || '').substring(0, 50) + ' | ' + img.substring(0, 50));
  });
}).finally(() => p.\\$disconnect());
"'''
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        print(out)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    run()
