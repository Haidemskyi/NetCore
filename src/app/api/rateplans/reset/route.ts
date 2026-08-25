import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // 1. Ensure default Admin accounts exist
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      await prisma.admin.createMany({
        data: [
          { username: 'haidemskyi', password: 'Gtatv2005' },
          { username: 'admin', password: 'admin' },
        ],
      });
    }

    // 2. Ensure default States exist without deleting existing states or technicians
    const defaultStates = [
      { code: 'TN', name: 'Tennessee', cities: ['Nashville', 'Memphis', 'Knoxville'] },
      { code: 'FL', name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa'] },
      { code: 'TX', name: 'Texas', cities: ['Houston', 'Austin', 'Dallas'] },
      { code: 'PA', name: 'Pennsylvania', cities: ['Philadelphia', 'Pittsburgh', 'Allentown'] },
    ];

    for (const stateDef of defaultStates) {
      let state = await prisma.state.findUnique({
        where: { code: stateDef.code },
      });
      if (!state) {
        state = await prisma.state.create({
          data: {
            code: stateDef.code,
            name: stateDef.name,
          },
        });
      }
      for (const cityName of stateDef.cities) {
        const cityExists = await prisma.city.findFirst({
          where: { stateId: state.id, name: cityName },
        });
        if (!cityExists) {
          await prisma.city.create({
            data: { name: cityName, stateId: state.id },
          });
        }
      }
    }

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
