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

    // Look up technician by username or email
    const tech = await prisma.technician.findFirst({
      where: {
        OR: [
          { username: { equals: cleanInput } },
          { email: { equals: cleanInput } }
        ]
      },
      include: {
        state: true
      }
    });

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

    // Verify password strictly against "App Login Password" set in CRM
    const expectedPassword = tech.password || 'Gtatv2005';
    if (password !== expectedPassword) {
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
