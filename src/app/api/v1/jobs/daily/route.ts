import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTechToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const auth = verifyTechToken(authHeader);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized or token expired. Please log in again.' },
        { status: 401 }
      );
    }

    // Calculate start of current 24-hour day (midnight today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const uploads = await prisma.technicianUpload.findMany({
      where: {
        technicianId: auth.techId,
        createdAt: {
          gte: startOfToday,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const jobs = uploads.map((item) => ({
      id: item.id,
      job_number: item.jobNumber,
      image_url: item.imageUrl,
      payout_amount: Number(item.payoutAmount),
      created_at: item.createdAt.toISOString(),
    }));

    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error('Error in mobile daily jobs route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
