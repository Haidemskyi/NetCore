import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(candidateId) },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Always generate a fresh single-use upload token on request
    const token = crypto.randomBytes(24).toString('hex');
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        uploadToken: token,
        uploadExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        uploadCompleted: false,
      },
    });

    const hostHeader = req.headers.get('host');
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const originUrl = hostHeader ? `${protocol}://${hostHeader}` : null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || originUrl || 'http://localhost:3000';
    const uploadLink = `${baseUrl}/upload/${token}`;

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      uploadToken: token,
      uploadLink: uploadLink,
    });
  } catch (error: any) {
    console.error('Error generating candidate upload link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
