import paramiko
import os
import sys
import tarfile

def compress_project(tar_path):
    print("Compressing project files...")
    # Directories/files to exclude
    excludes = {'.git', '.next', 'node_modules', 'out', '.DS_Store', 'deploy.py', 'deploy_check_certs.py', 'deploy_check_ports.py', 'deploy_check_proxy.py', 'get_nginx_configs.py', 'inspect_server.py'}
    
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in os.listdir("."):
            if item in excludes:
                continue
            tar.add(item)
    print("Project compressed.")

def main():
    hostname = "157.245.115.154"
    username = "root"
    password = "Denys_DG0cean"
    target_dir = "/var/www/crm.qwartz.net"
    tar_filename = "project.tar.gz"

    # 1. Compress the project locally
    compress_project(tar_filename)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to {hostname}...")
    try:
        ssh.connect(hostname, username=username, password=password)
        print("Connected!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        if os.path.exists(tar_filename):
            os.remove(tar_filename)
        return

    # 2. Upload file via SFTP
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

    # Clean up local archive
    if os.path.exists(tar_filename):
        os.remove(tar_filename)

    # 3. Setup on VPS
    commands = [
        # Create target directory
        f"mkdir -p {target_dir}",
        # Extract files
        f"tar -xzf /tmp/{tar_filename} -C {target_dir}",
        f"rm -f /tmp/{tar_filename}",
        # Install node modules
        f"cd {target_dir} && npm install --production=false",
        # Generate Prisma Client and apply database schema changes
        f"cd {target_dir} && npx prisma generate",
        f"cd {target_dir} && npx prisma db push --accept-data-loss",
        # Build Next.js project
        f"cd {target_dir} && npm run build",
        # Stop existing process if any
        "pm2 stop netcore-crm || true",
        "pm2 delete netcore-crm || true",
        # Start using PM2 on port 3030 (which is free and matches general config patterns on this host)
        f"cd {target_dir} && PORT=3030 pm2 start npm --name 'netcore-crm' -- start",
        "pm2 save"
    ]

    print("Running setup commands on VPS...")
    for cmd in commands:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Read outputs to block until completion
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out.strip():
            try:
                print(f"STDOUT:\n{out.strip()}")
            except UnicodeEncodeError:
                sys.stdout.buffer.write(f"STDOUT:\n".encode('utf-8') + out.strip().encode('utf-8', errors='ignore') + b"\n")
        if err.strip():
            try:
                print(f"STDERR:\n{err.strip()}")
            except UnicodeEncodeError:
                sys.stdout.buffer.write(f"STDERR:\n".encode('utf-8') + err.strip().encode('utf-8', errors='ignore') + b"\n")

    # 4. Create and reload Nginx configuration
    nginx_config = """server {
    server_name crm.qwartz.net;

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/qwartz.net/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/qwartz.net/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = crm.qwartz.net) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name crm.qwartz.net;
    return 404; # managed by Certbot
}
"""

    print("Configuring Nginx...")
    # Write nginx config locally temporarily, upload, enable, reload nginx
    nginx_file = "crm.qwartz.net"
    with open(nginx_file, "w") as f:
        f.write(nginx_config)

    sftp = ssh.open_sftp()
    sftp.put(nginx_file, "/tmp/nginx_crm_qwartz_net")
    sftp.close()
    os.remove(nginx_file)

    nginx_setup_cmds = [
        "mv /tmp/nginx_crm_qwartz_net /etc/nginx/sites-available/crm.qwartz.net",
        "ln -sf /etc/nginx/sites-available/crm.qwartz.net /etc/nginx/sites-enabled/crm.qwartz.net",
        "nginx -t",
        "systemctl reload nginx"
    ]

    for cmd in nginx_setup_cmds:
        print(f"Running: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        if out.strip():
            try:
                print(f"STDOUT:\n{out.strip()}")
            except UnicodeEncodeError:
                sys.stdout.buffer.write(f"STDOUT:\n".encode('utf-8') + out.strip().encode('utf-8', errors='ignore') + b"\n")
        if err.strip():
            try:
                print(f"STDERR:\n{err.strip()}")
            except UnicodeEncodeError:
                sys.stdout.buffer.write(f"STDERR:\n".encode('utf-8') + err.strip().encode('utf-8', errors='ignore') + b"\n")

    ssh.close()
    print("Done!")

if __name__ == "__main__":
    main()
