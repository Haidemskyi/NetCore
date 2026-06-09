import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // 1. Delete all existing records in dependency order
    await prisma.jobLog.deleteMany();
    await prisma.techDocument.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.techContract.deleteMany();
    await prisma.technician.deleteMany();
    await prisma.ratePlan.deleteMany();
    await prisma.city.deleteMany();
    await prisma.state.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.admin.deleteMany();

    // 2. Reseed default Admin accounts
    await prisma.admin.createMany({
      data: [
        { username: 'haidemskyi', password: 'Gtatv2005' },
        { username: 'admin', password: 'admin' },
      ],
    });

    // 3. Reseed default States & Cities
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

    // 4. Reseed default Todos
    const defaultTodos = [
      {
        text: 'Review Nashville invoice',
        description: 'Verify regional rate sheets and contractor percentages',
        priority: 'LOW',
        date: '2026-06-01',
        completed: true,
        creator: 'haidemskyi',
        createdAt: new Date('2026-06-01T09:00:00.000Z'),
      },
      {
        text: 'Audit Spectrum CSV imports',
        description: 'Check TSV cell mappings and resolve unmatched technicians',
        priority: 'MEDIUM',
        date: '2026-06-02',
        completed: true,
        creator: 'haidemskyi',
        createdAt: new Date('2026-06-02T10:00:00.000Z'),
      },
      {
        text: 'Review dispatch order logs',
        description: 'Audit company profit calculations for Comcast orders',
        priority: 'LOW',
        date: '2026-06-03',
        completed: true,
        creator: 'admin',
        createdAt: new Date('2026-06-03T11:00:00.000Z'),
      },
      {
        text: 'Submit weekly state reports',
        description: 'Generate performance leaderboards for TN, FL, PA, and TX',
        priority: 'HIGH',
        date: '2026-06-05',
        completed: false,
        creator: 'haidemskyi',
        createdAt: new Date('2026-06-05T08:30:00.000Z'),
      },
      {
        text: 'Verify vehicle plate numbers',
        description: 'Check active service status for Ford and Chevrolet vans',
        priority: 'HIGH',
        date: '2026-06-10',
        completed: false,
        creator: 'admin',
        createdAt: new Date('2026-06-05T09:00:00.000Z'),
      },
    ];

    await prisma.todo.createMany({
      data: defaultTodos,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
