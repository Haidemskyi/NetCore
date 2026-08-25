import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCandidateEmail } from '@/lib/email';
import { sendCandidateOnboardingNotification } from '@/lib/telegram';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Upload token is required' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { uploadToken: token },
      include: { documents: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Invalid or expired upload link.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        stateCode: candidate.stateCode,
        uploadCompleted: candidate.uploadCompleted,
        documentsCount: candidate.documents.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching upload link metadata:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { token, documents } = await req.json();

    if (!token || !documents || !Array.isArray(documents)) {
      return NextResponse.json({ error: 'Missing token or documents payload' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { uploadToken: token },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Invalid or expired upload link.' }, { status: 404 });
    }

    if (candidate.uploadCompleted) {
      return NextResponse.json({ error: 'This upload link has already been used and completed.' }, { status: 400 });
    }

    // Save uploaded documents in CandidateDocument database table
    const docCreates = documents.map((doc: any) => ({
      candidateId: candidate.id,
      docType: doc.docType || 'OTHER',
      name: doc.name || 'document',
      fileType: doc.fileType || 'image/jpeg',
      size: doc.size || 0,
      dataUrl: doc.dataUrl || '',
    }));

    await prisma.$transaction([
      // Delete previous candidate docs if any re-upload
      prisma.candidateDocument.deleteMany({
        where: { candidateId: candidate.id },
      }),
      // Insert new docs
      prisma.candidateDocument.createMany({
        data: docCreates,
      }),
      // Update candidate state & mark token completed
      prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          uploadCompleted: true,
          status: candidate.status === 'NEW' || candidate.status === 'RATES_SENT' ? 'DOCS_REQUESTED' : candidate.status,
        },
      }),
    ]);

    // Fetch created documents to get generated IDs for direct download links
    const savedDocs = await prisma.candidateDocument.findMany({
      where: { candidateId: candidate.id },
      select: { id: true, docType: true, name: true },
      orderBy: { uploadedAt: 'asc' },
    });

    // Compute base URL synchronously before returning response
    const hostHeader = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const originUrl = hostHeader && !hostHeader.includes('localhost') && !hostHeader.includes('127.0.0.1')
      ? `${protocol}://${hostHeader}`
      : null;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost'))
      ? process.env.NEXT_PUBLIC_APP_URL
      : originUrl || 'https://crm.qwartz.net';

    // Dispatch background tasks asynchronously via setImmediate without delaying candidate response
    setImmediate(async () => {
      // 1. Send Telegram notification with direct photo download links FIRST
      try {
        console.log(`[TELEGRAM] Sending candidate onboarding notification for candidate ID ${candidate.id}...`);
        const res = await sendCandidateOnboardingNotification(
          {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            phone: candidate.phone,
            email: candidate.email,
          },
          savedDocs,
          baseUrl
        );
        console.log('[TELEGRAM] Notification dispatch result:', JSON.stringify(res));
      } catch (telegramErr) {
        console.error('Error sending Telegram onboarding notification:', telegramErr);
      }

      // 2. Send automated confirmation email to candidate
      try {
        console.log(`[EMAIL] Dispatching candidate confirmation email to: ${candidate.email}`);
        const subject = `Onboarding Documents Received — Next Steps — NETCORE CORPORATION`;
        const bodyHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #334155;">
            <div style="border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px;">
              <h2 style="margin: 0; color: #1e3a8a; font-size: 22px;">NETCORE CORPORATION</h2>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px; font-weight: 500;">Onboarding Compliance & Verification</p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Dear <strong>${candidate.firstName} ${candidate.lastName}</strong>,</p>
            
            <p style="font-size: 15px; line-height: 1.6;">Thank you for submitting all 6 required onboarding verification documents. Our compliance team has successfully received your files.</p>

            <div style="margin: 24px 0; padding: 18px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
              <p style="margin: 0; font-size: 15px; color: #166534; font-weight: 700;">
                ✓ Next Steps in Your Onboarding Process:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #15803d; line-height: 1.6;">
                We are now proceeding with scheduling your <strong>Drug Test Appointment</strong> and processing your <strong>Background Check</strong> as quickly as possible.
              </p>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #475569;">Our onboarding specialists will reach out to you shortly with your appointment details and further instructions.</p>
            
            <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; color: #64748b; font-size: 13px;">
              <p style="margin: 0; font-weight: 600;">Best regards,</p>
              <p style="margin: 4px 0 0 0;">NETCORE Corporation Recruiting & Compliance Team</p>
            </div>
          </div>
        `;

        await sendCandidateEmail({
          to: candidate.email,
          subject,
          html: bodyHtml,
        });
      } catch (emailErr) {
        console.error('Error sending automated onboarding confirmation email to candidate:', emailErr);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'All documents successfully uploaded and saved.',
    });
  } catch (error: any) {
    console.error('Error submitting candidate documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
