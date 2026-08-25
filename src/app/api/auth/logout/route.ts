import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const response = NextResponse.json({ success: true });
  
  response.cookies.set({
    name: 'netcore_session',
    value: '',
    httpOnly: true,
    path: '/',
    expires: new Date(0),
  });
  
  return response;
}
