import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { date, technicianId, provider, ratePlanCode, cityId } = await req.json();

    // Look up technician
    const tech = await prisma.technician.findUnique({
      where: { id: parseInt(technicianId) },
      include: { state: true },
    });
    if (!tech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Look up rate plan
    const ratePlan = await prisma.ratePlan.findFirst({
      where: {
        stateCode: tech.state.code,
        provider: provider,
        code: ratePlanCode,
      },
    });
    if (!ratePlan) {
      return NextResponse.json({ error: 'Matching rate plan not found' }, { status: 404 });
    }

    // Look up city
    const city = await prisma.city.findUnique({
      where: { id: parseInt(cityId) },
    });
    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const gross = Number(ratePlan.grossPrice);
    const cutValue = Number(tech.payoutValue);

    let profit = 0;
    if (tech.payoutType === 'PERCENTAGE') {
      profit = gross * (cutValue / 100);
    } else {
      profit = cutValue;
    }
    
    let payout = Math.max(0, gross - profit);
    profit = Math.round(profit * 100) / 100;
    payout = Math.round(payout * 100) / 100;

    // Create job log
    const j = await prisma.jobLog.create({
      data: {
        date: new Date(date),
        technicianId: tech.id,
        ratePlanId: ratePlan.id,
        cityId: city.id,
        companyRevenue: gross,
        techPayout: payout,
        companyProfit: profit,
      },
      include: {
        technician: {
          include: { state: true },
        },
        ratePlan: true,
        city: true,
      },
    });

    return NextResponse.json({
      id: j.id,
      date: j.date.toISOString().split('T')[0],
      technicianId: j.technicianId,
      technicianName: j.technician.name,
      ratePlanId: j.ratePlanId,
      ratePlanCode: j.ratePlan.code,
      provider: j.ratePlan.provider,
      cityId: j.cityId,
      cityName: j.city.name,
      stateCode: j.technician.state.code,
      companyRevenue: Number(j.companyRevenue),
      techPayout: Number(j.techPayout),
      companyProfit: Number(j.companyProfit),
    });
  } catch (error: any) {
    console.error('Error creating job log:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');

    if (idStr) {
      // Delete single job log
      await prisma.jobLog.delete({
        where: { id: parseInt(idStr) },
      });
    } else {
      // Clear all job logs
      await prisma.jobLog.deleteMany();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting job logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
