import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { stateCode, cutVal } = await req.json();

    const ratePlans = await prisma.ratePlan.findMany({
      where: { stateCode },
    });

    const percentMultiplier = 1 - (Number(cutVal) / 100);
    let count = 0;

    for (const rp of ratePlans) {
      const gross = Number(rp.grossPrice);
      const newEmpPrice = Math.max(0, Math.round(gross * percentMultiplier * 100) / 100);

      await prisma.ratePlan.update({
        where: { id: rp.id },
        data: {
          employeePrice: newEmpPrice,
        },
      });
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('Error recalculating rate plans:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
