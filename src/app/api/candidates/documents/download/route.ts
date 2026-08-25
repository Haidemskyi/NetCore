import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document id parameter' }, { status: 400 });
    }

    const doc = await prisma.candidateDocument.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!doc || !doc.dataUrl) {
      return NextResponse.json({ error: 'Document not found or empty data' }, { status: 404 });
    }

    let contentType = doc.fileType || 'image/jpeg';
    let buffer: Buffer;

    const dataUrlMatch = doc.dataUrl.match(/^data:(.*?);base64,(.*)$/);
    if (dataUrlMatch) {
      contentType = dataUrlMatch[1] || contentType;
      buffer = Buffer.from(dataUrlMatch[2], 'base64');
    } else if (doc.dataUrl.startsWith('http://') || doc.dataUrl.startsWith('https://')) {
      return NextResponse.redirect(doc.dataUrl);
    } else {
      buffer = Buffer.from(doc.dataUrl, 'base64');
    }

    const ext = contentType.includes('pdf') ? 'pdf' : contentType.includes('png') ? 'png' : 'jpg';
    const safeCandidateName = doc.candidate
      ? `${doc.candidate.firstName}_${doc.candidate.lastName}`.replace(/[^a-zA-Z0-9_-]/g, '')
      : 'candidate';
    const filename = `${safeCandidateName}_${doc.docType || 'doc'}.${ext}`;

    const disposition = searchParams.get('inline') === '1' ? 'inline' : 'attachment';

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error downloading candidate document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
