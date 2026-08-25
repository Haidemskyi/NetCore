import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='ignore')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('159.223.181.36', username='root', password='Gtatv2005')

cmd = """
sed -i 's/server_name crm.netcoretelecom.com;/server_name crm.netcoretelecom.com portal.netcoretelecom.com;/g' /etc/nginx/sites-available/crm.netcoretelecom.com
nginx -t && systemctl reload nginx
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("OUT:", stdout.read().decode('utf-8', errors='ignore'))
print("ERR:", stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
