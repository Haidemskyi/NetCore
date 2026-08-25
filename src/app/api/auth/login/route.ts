import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const u = String(username).trim().toLowerCase();
    const p = String(password).trim();

    let authenticatedAdmin: { username: string } | null = null;

    // 1. Check against DB records
    try {
      const admins = await prisma.admin.findMany();
      const match = admins.find(a => a.username.trim().toLowerCase() === u && a.password.trim() === p);
      if (match) {
        authenticatedAdmin = { username: match.username };
      }
    } catch (dbErr) {
      console.error('DB query error in login route:', dbErr);
    }

    // 2. Fallback check for built-in admin credentials
    if (!authenticatedAdmin) {
      if (
        (u === 'haidemskyi' && p === 'Gtatv2005') ||
        (u === 'admin' && p === 'admin') ||
        (u === 'dtomyn' && p === 'corporationnetcore') ||
        (u === 'tomyn' && p === 'corporationnetcore')
      ) {
        authenticatedAdmin = { username: u };
      }
    }

    if (authenticatedAdmin) {
      const response = NextResponse.json({ success: true, username: authenticatedAdmin.username });
      const isHttps = req.url.startsWith('https://');

      response.cookies.set({
        name: 'netcore_session',
        value: authenticatedAdmin.username,
        httpOnly: true,
        path: '/',
        secure: isHttps,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid login or password.' }, { status: 401 });
  } catch (error: any) {
    console.error('Error in auth login route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
