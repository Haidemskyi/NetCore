import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: Number(candidateId) },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      uploadCompleted: candidate.uploadCompleted,
      documents: candidate.documents,
    });
  } catch (error: any) {
    console.error('Error fetching candidate documents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
