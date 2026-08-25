import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(candidates);
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, phone, stateCode, status, notes } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const candidate = await prisma.candidate.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        stateCode: (stateCode || 'ANY').toUpperCase(),
        status: status || 'NEW',
        notes,
      },
    });

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, firstName, lastName, email, phone, stateCode, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing candidate ID' }, { status: 400 });
    }

    const candidate = await prisma.candidate.update({
      where: { id: Number(id) },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        stateCode: stateCode !== undefined ? stateCode.toUpperCase() : undefined,
        status: status !== undefined ? status : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(candidate);
  } catch (error: any) {
    console.error('Error updating candidate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing candidate ID' }, { status: 400 });
    }

    await prisma.candidate.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
