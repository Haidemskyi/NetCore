import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { code, name, defaultCut } = await req.json();

    const state = await prisma.state.upsert({
      where: { code: code.toUpperCase() },
      update: { name },
      create: {
        code: code.toUpperCase(),
        name,
        defaultCut: defaultCut !== undefined ? Number(defaultCut) : undefined,
      },
    });

    return NextResponse.json({
      ...state,
      companyPerDiem: Number(state.companyPerDiem),
      employeePerDiem: Number(state.employeePerDiem),
      defaultCut: Number(state.defaultCut),
    });
  } catch (error: any) {
    console.error('Error creating state:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { code, requiredTechs, requirements, companyPerDiem, employeePerDiem, onboardingWaitTime, monthlySalary, description, vacancyCities, defaultCut } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing state code' }, { status: 400 });
    }

    const state = await prisma.state.update({
      where: { code: code.toUpperCase() },
      data: {
        requiredTechs: requiredTechs !== undefined ? Number(requiredTechs) : undefined,
        requirements: requirements !== undefined ? requirements : undefined,
        companyPerDiem: companyPerDiem !== undefined ? Number(companyPerDiem) : undefined,
        employeePerDiem: employeePerDiem !== undefined ? Number(employeePerDiem) : undefined,
        onboardingWaitTime: onboardingWaitTime !== undefined ? onboardingWaitTime : undefined,
        monthlySalary: monthlySalary !== undefined ? monthlySalary : undefined,
        description: description !== undefined ? description : undefined,
        vacancyCities: vacancyCities !== undefined ? vacancyCities : undefined,
        defaultCut: defaultCut !== undefined ? Number(defaultCut) : undefined,
      },
    });

    return NextResponse.json({
      ...state,
      companyPerDiem: Number(state.companyPerDiem),
      employeePerDiem: Number(state.employeePerDiem),
      defaultCut: Number(state.defaultCut),
    });
  } catch (error: any) {
    console.error('Error updating state:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing state code' }, { status: 400 });
    }

    const stateCode = code.toUpperCase();

    const state = await prisma.state.findUnique({
      where: { code: stateCode },
    });

    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Safety Guard: Check if state has active technicians
    const techCount = await prisma.technician.count({
      where: { stateId: state.id },
    });

    if (techCount > 0) {
      return NextResponse.json({
        error: `Cannot delete state ${stateCode} because it has ${techCount} active/assigned technicians. Please reassign or delete technicians first.`,
      }, { status: 400 });
    }

    // Safely delete state and non-employee associations inside a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete job logs associated with state's cities
      await tx.jobLog.deleteMany({
        where: { city: { stateId: state.id } },
      });

      // Delete job logs associated with state's rate plans
      await tx.jobLog.deleteMany({
        where: { ratePlan: { stateCode: stateCode } },
      });

      // Delete rate plans, cities, and finally the state itself
      await tx.ratePlan.deleteMany({
        where: { stateCode: stateCode },
      });

      await tx.city.deleteMany({
        where: { stateId: state.id },
      });

      await tx.state.delete({
        where: { id: state.id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting state:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
