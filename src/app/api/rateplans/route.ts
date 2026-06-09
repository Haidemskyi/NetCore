import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id, provider, stateCode, code, description, grossPrice, employeePrice } = await req.json();

    // Ensure the State exists in the database
    let state = await prisma.state.findUnique({
      where: { code: stateCode },
    });
    if (!state) {
      state = await prisma.state.create({
        data: {
          code: stateCode,
          name: stateCode === 'TN' ? 'Tennessee' : stateCode === 'FL' ? 'Florida' : stateCode === 'TX' ? 'Texas' : stateCode === 'PA' ? 'Pennsylvania' : stateCode,
        },
      });
    }

    const data = {
      provider,
      stateCode,
      code: code.trim().toUpperCase(),
      description: description || '',
      grossPrice: Number(grossPrice),
      employeePrice: Number(employeePrice) || 0.00,
    };

    let rp;
    if (id) {
      // Update
      rp = await prisma.ratePlan.update({
        where: { id: parseInt(id) },
        data,
      });
    } else {
      // Upsert / Create (using unique constraint to avoid crash if duplicate)
      rp = await prisma.ratePlan.upsert({
        where: {
          provider_stateCode_code: {
            provider,
            stateCode,
            code: data.code,
          },
        },
        update: data,
        create: data,
      });
    }

    return NextResponse.json({
      id: rp.id,
      provider: rp.provider,
      stateCode: rp.stateCode,
      code: rp.code,
      description: rp.description,
      grossPrice: Number(rp.grossPrice),
      employeePrice: Number(rp.employeePrice),
    });
  } catch (error: any) {
    console.error('Error saving rate plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');
    const stateCode = searchParams.get('stateCode');

    if (stateCode) {
      const targetStateCode = stateCode.toUpperCase();
      
      // Find all rate plan IDs for this state
      const ratePlans = await prisma.ratePlan.findMany({
        where: { stateCode: targetStateCode },
        select: { id: true },
      });
      const rpIds = ratePlans.map((rp) => rp.id);

      // Clean up dependent job logs first
      await prisma.jobLog.deleteMany({
        where: { ratePlanId: { in: rpIds } },
      });

      // Delete the rate plans
      await prisma.ratePlan.deleteMany({
        where: { stateCode: targetStateCode },
      });

      return NextResponse.json({ success: true, count: rpIds.length });
    }

    if (!idStr) {
      return NextResponse.json({ error: 'Missing rate plan ID or stateCode' }, { status: 400 });
    }

    // Disconnect or handle dependent jobs first if needed
    await prisma.jobLog.deleteMany({
      where: { ratePlanId: parseInt(idStr) },
    });

    await prisma.ratePlan.delete({
      where: { id: parseInt(idStr) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting rate plan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
