import fs from 'fs';
import path from 'path';

function getEnvVariable(key: string): string | undefined {
  if (process.env[key]) {
    return process.env[key];
  }
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
    console.error('Error reading .env file manually in telegram.ts:', err);
  }
  return process.env[key];
}

export async function sendTelegramNotification(text: string) {
  const token = getEnvVariable('TELEGRAM_BOT_TOKEN');
  const chatId = getEnvVariable('TELEGRAM_CHAT_ID');

  if (!token || !chatId) {
    console.warn('[TELEGRAM] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in environment');
    return { success: false, error: 'Telegram credentials missing' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error('[TELEGRAM] Error sending message:', data);
      return { success: false, error: data.description || 'Failed to send Telegram message' };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error: any) {
    console.error('[TELEGRAM] Exception sending Telegram notification:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTelegramDocuments(
  text: string,
  documents?: { name: string; dataUrl: string; docType?: string }[]
) {
  return await sendTelegramNotification(text);
}

const DOC_TITLES: Record<string, string> = {
  DL_FRONT: "Driver's License (Front)",
  DL_BACK: "Driver's License (Back)",
  SSN: "Social Security Card (SSN)",
  EAD_FRONT: "Employment Authorization (Front)",
  EAD_BACK: "Employment Authorization (Back)",
  BADGE_PHOTO: "Official ID Badge Photo",
};

export interface CandidateNotificationData {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email: string;
}

export interface CandidateDocInfo {
  id: string;
  docType: string;
  name: string;
}

export async function sendCandidateOnboardingNotification(
  candidate: CandidateNotificationData,
  documents: CandidateDocInfo[],
  baseUrl?: string
) {
  let domain = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://crm.qwartz.net';
  if (!domain || domain.includes('localhost') || domain.includes('127.0.0.1')) {
    domain = 'https://crm.qwartz.net';
  }
  const cleanDomain = domain.replace(/\/+$/, '');

  const phoneStr = candidate.phone ? candidate.phone : 'N/A';
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  let docLinksText = '';
  documents.forEach((doc, idx) => {
    const title = DOC_TITLES[doc.docType] || doc.docType || `Document ${idx + 1}`;
    const downloadUrl = `${cleanDomain}/api/candidates/documents/download?id=${doc.id}`;
    docLinksText += `<b>${idx + 1}. ${title}:</b>\n<a href="${downloadUrl}">${downloadUrl}</a>\n\n`;
  });

  const messageHtml = `<b>NETCORE ONBOARDING</b>
<b>ID VERIFICATION</b>

👤 <b>${fullName}</b>
📞 <b>Телефон:</b> ${phoneStr}
✉️ <b>Email:</b> ${candidate.email}

<b>📄 Загруженные фото (${documents.length}):</b>
${docLinksText.trim()}`;

  return await sendTelegramNotification(messageHtml);
}
