import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { prisma } from '../../../../../lib/db';
import { verifyTechToken } from '../../../../../lib/auth';

export async function GET(request: Request) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('portal_session')?.value;

    let payload = verifyTechToken(authHeader);
    if (!payload && sessionCookie) {
      payload = verifyTechToken(`Bearer ${sessionCookie}`);
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tech = await prisma.technician.findUnique({
      where: { id: payload.techId },
      include: {
        state: true,
        vehicles: true,
        contracts: true,
        uploads: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tech) {
      return NextResponse.json(
        { error: 'Technician not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      phone: tech.phone,
      username: tech.username,
      role: tech.role,
      workType: tech.workType,
      status: tech.status,
      payoutType: tech.payoutType,
      payoutValue: tech.payoutValue,
      carToolsDeduction: tech.carToolsDeduction,
      companyToolsCost: tech.companyToolsCost,
      perDiemOverride: tech.perDiemOverride,
      state: {
        code: tech.state.code,
        name: tech.state.name,
        employeePerDiem: tech.state.employeePerDiem
      },
      activeVehicle: tech.vehicles.find(v => v.status === 'ACTIVE') || tech.vehicles[0] || null,
      contracts: tech.contracts,
      recentUploads: tech.uploads
    });
  } catch (error) {
    console.error('Portal Me API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
