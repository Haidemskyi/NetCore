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

    let token = candidate.signingToken;
    if (!token) {
      token = crypto.randomBytes(24).toString('hex');
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          signingToken: token,
          signingExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const signingLink = `${baseUrl}/sign/${token}`;

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      signingToken: token,
      signingLink: signingLink,
    });
  } catch (error: any) {
    console.error('Error generating candidate signing link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
