import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { technicianId, name, fileType, size, dataUrl, category } = await req.json();

    const doc = await prisma.techDocument.create({
      data: {
        technicianId: parseInt(technicianId),
        name,
        fileType,
        size: parseInt(size),
        dataUrl,
        category: category || 'OTHER',
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

    await prisma.techDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
