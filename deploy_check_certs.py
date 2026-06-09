import paramiko

def main():
    hostname = "157.245.115.154"
    username = "root"
    password = "Denys_DG0cean"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    ssh.connect(hostname, username=username, password=password)
    
    stdin, stdout, stderr = ssh.exec_command("ls -la /etc/letsencrypt/live/")
    print(stdout.read().decode('utf-8'))
    
    ssh.close()

if __name__ == "__main__":
    main()
