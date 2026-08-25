import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Missing batchId' }, { status: 400 });
    }

    const result = await prisma.jobLog.deleteMany({
      where: { batchId },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
