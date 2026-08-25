import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { sendCandidateEmail } from '../../../../lib/email';
import { sendTelegramNotification } from '../../../../lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, candidateId, status, notes } = body;

    if (!candidateId && !event) {
      return NextResponse.json({ error: 'Missing event or candidateId payload' }, { status: 400 });
    }

    if (candidateId) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: Number(candidateId) }
      });

      if (candidate) {
        // Update candidate status if specified
        if (status && status !== candidate.status) {
          await prisma.candidate.update({
            where: { id: candidate.id },
            data: { status, notes: notes || candidate.notes }
          });
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.netcoretelecom.com';

        // Trigger notifications based on event or status
        if (event === 'CANDIDATE_INVITE_SENT' || status === 'DOCS_REQUESTED') {
          const uploadLink = `${origin}/upload/${candidate.uploadToken}`;
          
          // Send Telegram Alert
          await sendTelegramNotification(
            `<b>n8n Webhook Trigger: Candidate Onboarding Invited</b>\n\n` +
            `👤 <b>Candidate:</b> ${candidate.firstName} ${candidate.lastName}\n` +
            `📧 <b>Email:</b> ${candidate.email}\n` +
            `📍 <b>State:</b> ${candidate.stateCode}\n` +
            `🔗 <a href="${uploadLink}">Upload Onboarding Portal Link</a>`
          );

          // Send Email
          await sendCandidateEmail({
            to: candidate.email,
            subject: `Welcome to NetCore — Complete Your Employee Onboarding`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Welcome to NetCore!</h2>
              <p>Hello ${candidate.firstName},</p>
              <p>Please complete your onboarding paperwork and upload required documents here:</p>
              <p><a href="${uploadLink}" style="background-color: #1a73e8; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open Onboarding Portal</a></p>
              <br/>
              <p>Best regards,<br/>NetCore Recruitment Team</p>
            </div>`
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('n8n Webhook API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
