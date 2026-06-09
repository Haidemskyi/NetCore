import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const u = username.trim().toLowerCase();

    const admin = await prisma.admin.findUnique({
      where: { username: u },
    });

    if (admin && admin.password === password) {
      return NextResponse.json({ success: true, username: u });
    }

    return NextResponse.json({ error: 'Invalid login or password.' }, { status: 401 });
  } catch (error: any) {
    console.error('Error in auth login:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
