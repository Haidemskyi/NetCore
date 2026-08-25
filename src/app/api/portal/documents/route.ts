import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { prisma } from '../../../../lib/db';
import { verifyTechToken } from '../../../../lib/auth';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.techDocument.findMany({
      where: { technicianId: payload.techId },
      orderBy: { uploadedAt: 'desc' }
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Portal Documents API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
