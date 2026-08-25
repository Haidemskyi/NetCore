import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateTechToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();

    // Look up technician by username
    const techs = await prisma.technician.findMany();
    const tech = techs.find(t => t.username && t.username.trim().toLowerCase() === cleanUsername.toLowerCase());

    if (!tech || !tech.password || tech.password !== password) {
      return NextResponse.json(
        { error: 'Invalid technician credentials' },
        { status: 401 }
      );
    }

    if (tech.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Technician account is not active' },
        { status: 403 }
      );
    }

    // Generate 24-hour JWT token
    const token = generateTechToken({
      id: tech.id,
      name: tech.name,
      username: tech.username,
    });

    return NextResponse.json({
      token,
      user: {
        id: tech.id,
        fullName: tech.name,
        username: tech.username,
        email: tech.email,
      },
    });
  } catch (error: any) {
    console.error('Error in mobile auth login route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
