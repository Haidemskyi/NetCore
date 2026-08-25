import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { jobs: parsedJobs } = await req.json();

    // 1. Ensure fallback records exist for FK constraints
    // Fallback State (if state doesn't exist, we link to TN)
    let defaultState = await prisma.state.findUnique({ where: { code: 'TN' } });
    if (!defaultState) {
      defaultState = await prisma.state.create({ data: { code: 'TN', name: 'Tennessee' } });
    }

    // Fallback City
    let defaultCity = await prisma.city.findFirst({ where: { id: 9999 } });
    if (!defaultCity) {
      defaultCity = await prisma.city.create({
        data: {
          id: 9999,
          name: 'Unknown City',
          stateId: defaultState.id,
        },
      });
    }

    // Fallback Technician
    let defaultTech = await prisma.technician.findUnique({ where: { id: 999 } });
    if (!defaultTech) {
      defaultTech = await prisma.technician.create({
        data: {
          id: 999,
          name: 'Unknown Technician',
          phone: '000-000-0000',
          email: 'netcore.corporation@gmail.com',
          status: 'ACTIVE',
          workType: 'BURY',
          stateId: defaultState.id,
          payoutType: 'PERCENTAGE',
          payoutValue: 8.00,
        },
      });
    }

    // Fallback RatePlan
    let defaultRatePlan = await prisma.ratePlan.findFirst({ where: { id: 9999 } });
    if (!defaultRatePlan) {
      defaultRatePlan = await prisma.ratePlan.create({
        data: {
          id: 9999,
          provider: 'Spectrum',
          stateCode: 'TN',
          code: 'RDP',
          description: 'Default Rate Plan',
          grossPrice: 0.00,
          employeePrice: 0.00,
        },
      });
    }

    const createdJobs = [];
    const batchId = `batch-${Date.now()}`;

    // 2. Process and insert each job
    for (const job of parsedJobs) {
      // Resolve Technician
      let techId = job.matchedTechId ? parseInt(job.matchedTechId) : 999;
      let tech = await prisma.technician.findUnique({
        where: { id: techId },
        include: { state: true },
      });
      if (!tech) {
        techId = 999;
        tech = defaultTech as any;
      }

      const stateCode = tech ? tech.state.code : (job.stateCode || 'TN');

      // Resolve Rate Plan
      let ratePlan = await prisma.ratePlan.findFirst({
        where: {
          code: job.jobCode || 'RDP',
          stateCode: stateCode,
        },
      });
      let ratePlanId = ratePlan ? ratePlan.id : 9999;

      // Resolve City (create if missing and state is valid)
      let cityId = 9999;
      if (job.city) {
        const cityName = job.city.trim();
        const stateObj = await prisma.state.findUnique({ where: { code: stateCode } });
        const targetStateId = stateObj ? stateObj.id : defaultState.id;

        let city = await prisma.city.findFirst({
          where: {
            name: cityName,
            stateId: targetStateId,
          },
        });
        if (!city) {
          city = await prisma.city.create({
            data: {
              name: cityName,
              stateId: targetStateId,
            },
          });
        }
        cityId = city.id;
      }

      const companyRevenue = Number(job.grossAmount) * (parseInt(job.quantity) || 1);
      const techPayout = Number(job.techPayout) || 0;
      const companyProfit = Number(job.companyProfit) || 0;

      const newJob = await prisma.jobLog.create({
        data: {
          date: new Date(job.date || new Date()),
          technicianId: techId,
          ratePlanId: ratePlanId,
          cityId: cityId,
          companyRevenue,
          techPayout,
          companyProfit,
          batchId,
        },
        include: {
          technician: {
            include: { state: true },
          },
          ratePlan: true,
          city: true,
        },
      });

      createdJobs.push({
        id: newJob.id,
        date: newJob.date.toISOString().split('T')[0],
        technicianId: newJob.technicianId,
        technicianName: newJob.technician.name,
        ratePlanId: newJob.ratePlanId,
        ratePlanCode: newJob.ratePlan.code,
        provider: newJob.ratePlan.provider,
        cityId: newJob.cityId,
        cityName: newJob.city.name,
        stateCode: newJob.technician.state.code,
        companyRevenue: Number(newJob.companyRevenue),
        techPayout: Number(newJob.techPayout),
        companyProfit: Number(newJob.companyProfit),
        batchId,
      });
    }

    return NextResponse.json({ success: true, count: createdJobs.length, jobs: createdJobs });
  } catch (error: any) {
    console.error('Error in bulk job import:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
