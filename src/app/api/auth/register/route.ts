import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const u = username.trim().toLowerCase();

    if (!u || !password) {
      return NextResponse.json({ error: 'Please fill out both fields.' }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({
      where: { username: u },
    });

    if (existing) {
      return NextResponse.json({ error: 'An admin account with this login already exists.' }, { status: 400 });
    }

    await prisma.admin.create({
      data: {
        username: u,
        password: password,
      },
    });

    return NextResponse.json({ success: true, username: u });
  } catch (error: any) {
    console.error('Error in auth register:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
