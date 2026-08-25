import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const techIdStr = searchParams.get('technicianId');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate last 30 days & current month cutoffs
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let whereClause: any = {};
    if (techIdStr) {
      whereClause.technicianId = parseInt(techIdStr);
    }

    // Query ONLY TechnicianUpload (Mobile App Submissions from Android App)
    const uploads = await prisma.technicianUpload.findMany({
      where: whereClause,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format mobile app uploads
    const formattedUploads = uploads.map((u) => ({
      id: u.id,
      technicianId: u.technicianId,
      technicianName: u.technician?.name || 'Technician',
      jobNumber: u.jobNumber.startsWith('Job') ? u.jobNumber : `Job #${u.jobNumber}`,
      imageUrl: u.imageUrl,
      rawText: u.rawText,
      payoutAmount: Number(u.payoutAmount || 0),
      createdAt: u.createdAt.toISOString(),
      source: 'APP_SUBMISSION',
      sourceLabel: 'Mobile App Upload',
    }));

    const totalCount = formattedUploads.length;
    const todayCount = formattedUploads.filter((j) => new Date(j.createdAt) >= startOfToday).length;
    
    // Count jobs in current calendar month or recent 30-day period
    const currentMonthJobs = formattedUploads.filter((j) => new Date(j.createdAt) >= startOfCurrentMonth).length;
    const thirtyDayJobs = formattedUploads.filter((j) => new Date(j.createdAt) >= thirtyDaysAgo).length;
    const monthCount = currentMonthJobs > 0 ? currentMonthJobs : thirtyDayJobs;

    const uniqueDaysSet = new Set(
      formattedUploads.map((j) => new Date(j.createdAt).toISOString().split('T')[0])
    );
    const distinctDays = uniqueDaysSet.size;
    const avgPerDay = distinctDays > 0 ? (totalCount / distinctDays).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      totalCount,
      todayCount,
      monthCount,
      avgPerDay: Number(avgPerDay),
      distinctDays,
      uploads: formattedUploads,
    });
  } catch (error: any) {
    console.error('Error in uploads GET route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
