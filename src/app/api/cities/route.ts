import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, stateCode } = await req.json();

    const stateObj = await prisma.state.findUnique({
      where: { code: stateCode.toUpperCase() },
    });

    if (!stateObj) {
      return NextResponse.json({ error: `State ${stateCode} not found` }, { status: 404 });
    }

    // Check if city already exists in this state
    let city = await prisma.city.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        stateId: stateObj.id,
      },
    });

    if (!city) {
      city = await prisma.city.create({
        data: {
          name,
          stateId: stateObj.id,
        },
      });
    }

    return NextResponse.json(city);
  } catch (error: any) {
    console.error('Error creating city:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
