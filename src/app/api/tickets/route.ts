import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const newCount = await prisma.ticket.count({
      where: { status: 'NEW' },
    });

    return NextResponse.json({ tickets, newCount }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, category, sourceUrl } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message' },
        { status: 400, headers: corsHeaders }
      );
    }

    let ticketCategory = 'CONTACT_FORM';
    if (category) {
      const validCategories = ['CONTACT_FORM', 'JOB_APPLICATION', 'GENERAL_INQUIRY', 'EQUIPMENT_QUOTE', 'SUPPORT'];
      if (validCategories.includes(category)) {
        ticketCategory = category;
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        subject: subject ? subject.trim() : 'Website Inquiry',
        message: message.trim(),
        category: ticketCategory as any,
        sourceUrl: sourceUrl ? sourceUrl.trim() : 'https://netcoretelecom.com',
        status: 'NEW',
      },
    });

    return NextResponse.json(ticket, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, notes, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400, headers: corsHeaders });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (category) updateData.category = category;

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400, headers: corsHeaders });
    }

    await prisma.ticket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500, headers: corsHeaders });
  }
}
