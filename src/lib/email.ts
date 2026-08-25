import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

function getEnvVariable(key: string): string | undefined {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const parts = trimmed.split('=');
          const currentKey = parts[0].trim();
          if (currentKey === key) {
            let value = parts.slice(1).join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1);
            }
            return value;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading .env file manually in email.ts:', err);
  }
  return process.env[key];
}

function getTransporter() {
  const host = getEnvVariable('SMTP_HOST') || 'smtp.gmail.com';
  const port = Number(getEnvVariable('SMTP_PORT') || '465');
  const user = getEnvVariable('SMTP_USER') || 'netcore.corporation@gmail.com';
  const pass = getEnvVariable('SMTP_PASS') || 'zsmx zdsa rjoo vhmw';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  } as any);
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export async function sendAdminNotificationEmail({
  subject,
  html,
  attachments = [],
}: {
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}) {
  try {
    const adminEmail = getEnvVariable('ADMIN_NOTIFICATION_EMAIL') || getEnvVariable('SMTP_USER') || 'netcore.corporation@gmail.com';
    const smtpFrom = getEnvVariable('SMTP_FROM') || 'netcore.corporation@gmail.com';
    const transporter = getTransporter();

    console.log(`[EMAIL] Dispatching admin notification email to: ${adminEmail} with ${attachments.length} attachment(s)`);

    const result = await transporter.sendMail({
      from: `"NETCORE CRM Alerts" <${smtpFrom}>`,
      to: adminEmail,
      subject,
      html,
      attachments,
    });

    console.log(`[EMAIL] Admin notification email sent successfully! MessageId: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (err: any) {
    console.error('[EMAIL] Error sending admin notification email:', err);
    return { success: false, error: err.message };
  }
}

export async function sendCandidateEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const smtpFrom = getEnvVariable('SMTP_FROM') || 'netcore.corporation@gmail.com';
    const transporter = getTransporter();

    console.log(`[EMAIL] Dispatching candidate confirmation email to: ${to}`);

    const result = await transporter.sendMail({
      from: `"NETCORE CORPORATION" <${smtpFrom}>`,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] Candidate confirmation email sent successfully! MessageId: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (err: any) {
    console.error('[EMAIL] Error sending candidate email:', err);
    return { success: false, error: err.message };
  }
}
