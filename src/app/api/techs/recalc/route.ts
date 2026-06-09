import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { stateCode, cutVal } = await req.json();

    const stateObj = await prisma.state.findUnique({
      where: { code: stateCode },
    });

    if (!stateObj) {
      return NextResponse.json({ error: `State ${stateCode} not found` }, { status: 404 });
    }

    const count = await prisma.technician.updateMany({
      where: { stateId: stateObj.id },
      data: {
        payoutType: 'PERCENTAGE',
        payoutValue: Number(cutVal),
      },
    });

    return NextResponse.json({ success: true, count: count.count });
  } catch (error: any) {
    console.error('Error recalculating techs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
