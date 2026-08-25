import paramiko
import os
import sys
import tarfile

def compress_project(tar_path):
    print("Compressing project files...")
    # Directories/files to exclude
    excludes = {'.git', '.next', 'node_modules', 'out', '.DS_Store', 'deploy.py', 'deploy_check_certs.py', 'deploy_check_ports.py', 'deploy_check_proxy.py', 'get_nginx_configs.py', 'inspect_server.py', 'backups'}
    
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in os.listdir("."):
            if item in excludes or item.endswith('.sql') or item.endswith('.db') or item.endswith('.json') or item.endswith('.zip') or item.endswith('.tar.gz') or item.endswith('.txt'):
                continue
            tar.add(item)
    print("Project compressed.")

import paramiko
import os
import sys
import tarfile

def compress_project(tar_path):
    print("Compressing project files...")
    excludes = {
        '.git', '.next', 'node_modules', 'out', '.DS_Store',
        'deploy.py', 'backups', 'scratch', 'NetCore Web', 'NetCore Docus', 'Documents',
        '*.zip', '*.tar.gz', '*.log', '*.sql'
    }
    
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in os.listdir("."):
            if item in excludes or item.endswith('.sql') or item.endswith('.zip') or item.endswith('.tar.gz') or item.endswith('.log'):
                continue
            tar.add(item)
    print("Project compressed.")

def main():
    hostname = "159.223.181.36"
    username = "root"
    password = "Gtatv2005"
    target_dir = "/var/www/crm.netcoretelecom.com"
    tar_filename = "project.tar.gz"

    compress_project(tar_filename)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to {hostname}...")
    try:
        ssh.connect(hostname, username=username, password=password, timeout=30)
        print("Connected!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        if os.path.exists(tar_filename):
            os.remove(tar_filename)
        return

    print("Uploading archive to VPS...")
    sftp = ssh.open_sftp()
    try:
        sftp.put(tar_filename, f"/tmp/{tar_filename}")
        print("Upload finished.")
    except Exception as e:
        print(f"Upload failed: {e}")
        ssh.close()
        if os.path.exists(tar_filename):
            os.remove(tar_filename)
        return
    finally:
        sftp.close()

    if os.path.exists(tar_filename):
        os.remove(tar_filename)

    commands = [
        f"mkdir -p {target_dir}",
        f"tar -xzf /tmp/{tar_filename} -C {target_dir}",
        f"rm -f /tmp/{tar_filename}",
        f"cd {target_dir} && npm install --production=false",
        f"cd {target_dir} && npx prisma generate",
        f"cd {target_dir} && npx prisma db push --accept-data-loss",
        f"cd {target_dir} && NODE_OPTIONS='--max-old-space-size=1536' npm run build",
        "pm2 stop netcore-crm || true",
        "pm2 delete netcore-crm || true",
        f"cd {target_dir} && PORT=3030 pm2 start npm --name 'netcore-crm' -- start",
        "pm2 save"
    ]

    print("Running setup commands on VPS...")
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out.strip():
            sys.stdout.buffer.write(f"STDOUT:\n{out.strip()}\n".encode('utf-8'))
        if err.strip():
            sys.stdout.buffer.write(f"STDERR:\n{err.strip()}\n".encode('utf-8'))

    ssh.close()
    print("Deployment to new VPS (crm.netcoretelecom.com) complete!")

if __name__ == "__main__":
    main()

