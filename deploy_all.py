import paramiko
import os
import sys
import tarfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='ignore')

def compress_web(tar_path):
    print("Compressing NetCore Web files...")
    web_dir = "NetCore Web"
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in os.listdir(web_dir):
            full_path = os.path.join(web_dir, item)
            tar.add(full_path, arcname=item)
    print("NetCore Web compressed.")

def compress_crm(tar_path):
    print("Compressing CRM project files...")
    excludes = {
        '.git', '.next', 'node_modules', 'out', '.DS_Store',
        'deploy.py', 'deploy_all.py', 'backups', 'scratch', 'NetCore Web', 'NetCore Docus', 'Documents',
        '*.zip', '*.tar.gz', '*.log', '*.sql'
    }
    
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in os.listdir("."):
            if item in excludes or item.endswith('.sql') or item.endswith('.zip') or item.endswith('.tar.gz') or item.endswith('.log'):
                continue
            tar.add(item)
    print("CRM project compressed.")

def main():
    hostname = "159.223.181.36"
    username = "root"
    password = "Gtatv2005"
    
    web_tar = "web.tar.gz"
    crm_tar = "crm.tar.gz"

    compress_web(web_tar)
    compress_crm(crm_tar)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to VPS ({hostname})...")
    try:
        ssh.connect(hostname, username=username, password=password, timeout=30)
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        for f in [web_tar, crm_tar]:
            if os.path.exists(f): os.remove(f)
        return

    print("Uploading archives to VPS...")
    sftp = ssh.open_sftp()
    try:
        sftp.put(web_tar, f"/tmp/{web_tar}")
        sftp.put(crm_tar, f"/tmp/{crm_tar}")
        print("Upload finished.")
    except Exception as e:
        print(f"Upload failed: {e}")
        ssh.close()
        for f in [web_tar, crm_tar]:
            if os.path.exists(f): os.remove(f)
        return
    finally:
        sftp.close()

    for f in [web_tar, crm_tar]:
        if os.path.exists(f): os.remove(f)

    # 1. Update Main Site (netcoretelecom.com)
    web_commands = [
        "echo '=== Updating NetCore Web static site (/var/www/html) ==='",
        "mkdir -p /var/www/html",
        f"tar -xzf /tmp/{web_tar} -C /var/www/html",
        f"rm -f /tmp/{web_tar}",
        "chown -R www-data:www-data /var/www/html",
        "systemctl reload nginx"
    ]

    # 2. Update CRM (crm.netcoretelecom.com)
    crm_target_dir = "/var/www/crm.netcoretelecom.com"
    crm_commands = [
        "echo '=== Updating NetCore CRM (/var/www/crm.netcoretelecom.com) ==='",
        f"mkdir -p {crm_target_dir}",
        f"tar -xzf /tmp/{crm_tar} -C {crm_target_dir}",
        f"rm -f /tmp/{crm_tar}",
        f"cd {crm_target_dir} && npm install --production=false",
        f"cd {crm_target_dir} && npx prisma generate",
        f"cd {crm_target_dir} && npx prisma db push --accept-data-loss",
        f"cd {crm_target_dir} && NODE_OPTIONS='--max-old-space-size=1536' npm run build",
        "pm2 stop netcore-crm || true",
        "pm2 delete netcore-crm || true",
        f"cd {crm_target_dir} && PORT=3030 pm2 start npm --name 'netcore-crm' -- start",
        "pm2 save"
    ]

    all_commands = web_commands + crm_commands

    print("Running deployment commands on VPS...")
    for cmd in all_commands:
        print(f"Running: {cmd}", flush=True)
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out.strip():
            print(f"STDOUT:\n{out.strip()}", flush=True)
        if err.strip():
            print(f"STDERR:\n{err.strip()}", flush=True)

    ssh.close()
    print("\n=======================================================")
    print("Deployment to Production (netcoretelecom.com & crm.netcoretelecom.com) Complete!")
    print("=======================================================")

if __name__ == "__main__":
    main()
