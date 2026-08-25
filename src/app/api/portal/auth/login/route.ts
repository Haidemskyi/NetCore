import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { generateTechToken } from '../../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username) {
      return NextResponse.json(
        { error: 'Username or email is required' },
        { status: 400 }
      );
    }

    const cleanInput = username.trim().toLowerCase();

    // Fetch technicians and perform 100% case-insensitive lookup for username or email
    const allTechs = await prisma.technician.findMany({
      include: {
        state: true
      }
    });

    const tech = allTechs.find(t =>
      (t.username && t.username.trim().toLowerCase() === cleanInput) ||
      (t.email && t.email.trim().toLowerCase() === cleanInput)
    );

    if (!tech) {
      return NextResponse.json(
        { error: 'Invalid credentials. Technician account not found.' },
        { status: 401 }
      );
    }

    // Check status
    if (tech.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Account is suspended. Please contact dispatch.' },
        { status: 403 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const cleanPassword = password.trim();
    const expectedPassword = tech.password ? tech.password.trim() : 'Gtatv2005';

    // Verify password strictly against "App Login Password" set in CRM (or admin master password)
    if (cleanPassword !== expectedPassword && cleanPassword !== 'Gtatv2005') {
      return NextResponse.json(
        { error: 'Invalid credentials. Incorrect App Login Password.' },
        { status: 401 }
      );
    }

    const token = generateTechToken({
      id: tech.id,
      name: tech.name,
      username: tech.username || tech.email
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: tech.id,
        name: tech.name,
        email: tech.email,
        username: tech.username,
        role: (tech as any).role || 'TECHNICIAN',
        workType: tech.workType,
        status: tech.status,
        stateCode: tech.state.code,
        stateName: tech.state.name
      }
    });

    // Set portal_session cookie
    response.cookies.set('portal_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Portal Login API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
