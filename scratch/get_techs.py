import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='ignore')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('159.223.181.36', username='root', password='Gtatv2005')

cmd = """
cd /var/www/crm.netcoretelecom.com
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.technician.findMany().then(t => console.log(JSON.stringify(t.map(x => ({ id: x.id, name: x.name, username: x.username, email: x.email, password: x.password, status: x.status })), null, 2)));"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("OUT:", stdout.read().decode('utf-8', errors='ignore'))
print("ERR:", stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
