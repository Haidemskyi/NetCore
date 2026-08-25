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
    const states = dbStates.map((s: any) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      requiredTechs: s.requiredTechs,
      requirements: s.requirements,
      companyPerDiem: Number(s.companyPerDiem),
      employeePerDiem: Number(s.employeePerDiem),
      onboardingWaitTime: s.onboardingWaitTime,
      monthlySalary: s.monthlySalary,
      description: s.description,
      vacancyCities: s.vacancyCities,
      defaultCut: Number(s.defaultCut || 8.00),
    }));

    const dbCandidates = await prisma.candidate.findMany({ orderBy: { createdAt: 'desc' } });
    const candidates = dbCandidates.map((c: any) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      stateCode: c.stateCode,
      status: c.status,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
    const cities = await prisma.city.findMany({ orderBy: { id: 'asc' } });
    
    const dbRatePlans = await prisma.ratePlan.findMany();
    const ratePlans = dbRatePlans.map((rp: any) => ({
      id: rp.id,
      provider: rp.provider,
      stateCode: rp.stateCode,
      code: rp.code,
      description: rp.description,
      grossPrice: Number(rp.grossPrice),
      employeePrice: Number(rp.employeePrice),
    }));

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayUploads = await prisma.technicianUpload.findMany({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
      select: {
        technicianId: true,
      },
    });

    const todayCountsMap: Record<number, number> = {};
    for (const u of todayUploads) {
      todayCountsMap[u.technicianId] = (todayCountsMap[u.technicianId] || 0) + 1;
    }

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
    
    const technicians = dbTechs.map((t: any) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      username: t.username ?? undefined,
      password: t.password ?? undefined,
      status: t.status,
      workType: t.workType,
      stateId: t.stateId,
      stateCode: t.state.code,
      payoutType: t.payoutType,
      payoutValue: Number(t.payoutValue),
      perDiemOverride: t.perDiemOverride != null ? Number(t.perDiemOverride) : null,
      carToolsDeduction: Number(t.carToolsDeduction),
      companyToolsCost: Number(t.companyToolsCost || 0),
      defaultProvider: t.defaultProvider ?? undefined,
      notes: t.notes ?? undefined,
      jobsToday: todayCountsMap[t.id] || 0,
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
    const vehicles = dbVehicles.map((v: any) => ({
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
    
    const jobLogs = dbJobs.map((j: any) => ({
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
      batchId: j.batchId,
    }));

    const dbDocs = await prisma.techDocument.findMany();
    const documents = dbDocs.map((d: any) => ({
      id: d.id,
      technicianId: d.technicianId,
      name: d.name,
      fileType: d.fileType,
      size: d.size,
      uploadedAt: d.uploadedAt.toISOString(),
      dataUrl: d.dataUrl,
      category: d.category,
      batchId: d.batchId,
    }));

    const dbTodos = await prisma.todo.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    const todos = dbTodos.map((todo: any) => ({
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
    const admins = dbAdmins.map((a: any) => ({
      username: a.username,
    }));

    const dbTickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
    const tickets = dbTickets.map((tk: any) => ({
      id: tk.id,
      name: tk.name,
      email: tk.email,
      phone: tk.phone,
      category: tk.category,
      subject: tk.subject,
      message: tk.message,
      status: tk.status,
      sourceUrl: tk.sourceUrl,
      notes: tk.notes,
      createdAt: tk.createdAt.toISOString(),
      updatedAt: tk.updatedAt.toISOString(),
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
      candidates,
      tickets,
    });
  } catch (error: any) {
    console.error('Error in bootstrap:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
