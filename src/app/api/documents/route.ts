import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { technicianId, name, fileType, size, dataUrl, category, batchId } = await req.json();

    const doc = await prisma.techDocument.create({
      data: {
        technicianId: parseInt(technicianId),
        name,
        fileType,
        size: parseInt(size),
        dataUrl,
        category: category || 'OTHER',
        batchId: batchId || null,
      },
    });

    return NextResponse.json({
      id: doc.id,
      technicianId: doc.technicianId,
      name: doc.name,
      fileType: doc.fileType,
      size: doc.size,
      uploadedAt: doc.uploadedAt.toISOString(),
      dataUrl: doc.dataUrl,
      category: doc.category,
      batchId: doc.batchId,
    });
  } catch (error: any) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    const document = await prisma.techDocument.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    let batchId = document.batchId;
    if (document.category === 'PAYMENT' && !batchId) {
      const dateMatch = document.name.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        const statementEndDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
        const latestJob = await prisma.jobLog.findFirst({
          where: {
            technicianId: document.technicianId,
            batchId: { not: null },
            date: { lte: statementEndDate },
          },
          orderBy: { date: 'desc' },
          select: { batchId: true },
        });
        batchId = latestJob?.batchId ?? null;
      }
    }

    const deletedJobs = document.category === 'PAYMENT' && batchId
      ? await prisma.$transaction(async transaction => {
          const jobs = await transaction.jobLog.deleteMany({
            where: { batchId, technicianId: document.technicianId },
          });
          await transaction.techDocument.delete({ where: { id } });
          return jobs.count;
        })
      : (await prisma.techDocument.delete({ where: { id } }), 0);

    return NextResponse.json({
      success: true,
      deletedJobs,
      technicianId: document.technicianId,
      batchId,
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
