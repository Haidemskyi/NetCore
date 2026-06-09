import paramiko

def main():
    hostname = "157.245.115.154"
    username = "root"
    password = "Denys_DG0cean"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print("Connecting...")
    ssh.connect(hostname, username=username, password=password)
    print("Connected!")
    
    commands = [
        "docker -v",
        "docker-compose -v",
        "sqlite3 --version",
        "cat /etc/os-release"
    ]
    
    for cmd in commands:
        print(f"\n--- Running: {cmd} ---")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        if out:
            print("STDOUT:")
            print(out)
        if err:
            print("STDERR:")
            print(err)
            
    ssh.close()

if __name__ == "__main__":
    main()
