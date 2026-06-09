import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // 1. Seed database with defaults if empty
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      await prisma.admin.createMany({
        data: [
          { username: 'haidemskyi', password: 'Gtatv2005' },
          { username: 'admin', password: 'admin' },
        ],
      });
    }

    const stateCount = await prisma.state.count();
    if (stateCount === 0) {
      // Seed default States & Cities
      const tn = await prisma.state.create({
        data: {
          code: 'TN',
          name: 'Tennessee',
          cities: {
            create: [
              { name: 'Nashville' },
              { name: 'Memphis' },
              { name: 'Knoxville' },
            ],
          },
        },
      });

      const fl = await prisma.state.create({
        data: {
          code: 'FL',
          name: 'Florida',
          cities: {
            create: [
              { name: 'Miami' },
              { name: 'Orlando' },
              { name: 'Tampa' },
            ],
          },
        },
      });

      const tx = await prisma.state.create({
        data: {
          code: 'TX',
          name: 'Texas',
          cities: {
            create: [
              { name: 'Houston' },
              { name: 'Austin' },
              { name: 'Dallas' },
            ],
          },
        },
      });

      const pa = await prisma.state.create({
        data: {
          code: 'PA',
          name: 'Pennsylvania',
          cities: {
            create: [
              { name: 'Philadelphia' },
              { name: 'Pittsburgh' },
              { name: 'Allentown' },
            ],
          },
        },
      });
    }

    // 2. Fetch all data
    const dbStates = await prisma.state.findMany({ orderBy: { id: 'asc' } });
    const states = dbStates.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      requiredTechs: s.requiredTechs,
      requirements: s.requirements,
      companyPerDiem: Number(s.companyPerDiem),
      employeePerDiem: Number(s.employeePerDiem),
    }));
    const cities = await prisma.city.findMany({ orderBy: { id: 'asc' } });
    
    const dbRatePlans = await prisma.ratePlan.findMany();
    const ratePlans = dbRatePlans.map(rp => ({
      id: rp.id,
      provider: rp.provider,
      stateCode: rp.stateCode,
      code: rp.code,
      description: rp.description,
      grossPrice: Number(rp.grossPrice),
      employeePrice: Number(rp.employeePrice),
    }));

    const dbTechs = await prisma.technician.findMany({
      include: {
        state: true,
        vehicles: {
          where: {
            status: 'ACTIVE',
          },
          take: 1,
        },
      },
    });
    
    const technicians = dbTechs.map(t => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      status: t.status,
      workType: t.workType,
      stateId: t.stateId,
      stateCode: t.state.code,
      payoutType: t.payoutType,
      payoutValue: Number(t.payoutValue),
      notes: t.notes ?? undefined,
      vehicle: t.vehicles[0] ? {
        id: t.vehicles[0].id,
        make: t.vehicles[0].make,
        model: t.vehicles[0].model,
        year: t.vehicles[0].year,
        vin: t.vehicles[0].vin,
        plateNumber: t.vehicles[0].plateNumber,
        ownershipType: t.vehicles[0].ownershipType,
        status: t.vehicles[0].status,
        technicianId: t.id,
      } : undefined,
    }));

    const dbVehicles = await prisma.vehicle.findMany();
    const vehicles = dbVehicles.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      plateNumber: v.plateNumber,
      ownershipType: v.ownershipType,
      status: v.status,
      technicianId: v.technicianId ?? undefined,
    }));

    const dbJobs = await prisma.jobLog.findMany({
      include: {
        technician: {
          include: {
            state: true,
          },
        },
        ratePlan: true,
        city: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
    
    const jobLogs = dbJobs.map(j => ({
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
    }));

    const dbDocs = await prisma.techDocument.findMany();
    const documents = dbDocs.map(d => ({
      id: d.id,
      technicianId: d.technicianId,
      name: d.name,
      fileType: d.fileType,
      size: d.size,
      uploadedAt: d.uploadedAt.toISOString(),
      dataUrl: d.dataUrl,
      category: d.category,
    }));

    const dbTodos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    const todos = dbTodos.map(todo => ({
      id: todo.id,
      text: todo.text,
      description: todo.description ?? undefined,
      priority: todo.priority as any,
      date: todo.date,
      completed: todo.completed,
      creator: todo.creator,
      createdAt: todo.createdAt.toISOString(),
    }));

    const dbAdmins = await prisma.admin.findMany();
    const admins = dbAdmins.map(a => ({
      username: a.username,
    }));

    return NextResponse.json({
      states,
      cities,
      ratePlans,
      technicians,
      vehicles,
      jobLogs,
      documents,
      todos,
      admins,
    });
  } catch (error: any) {
    console.error('Error in bootstrap:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
