import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { sendTelegramNotification } from '../../../../../lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { technicianId, jobNumber, category, description, photos } = body;

    if (!technicianId || !description || !photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: 'Description and at least 1 photo attachment (up to 4 max) are required.' },
        { status: 400 }
      );
    }

    if (photos.length > 4) {
      return NextResponse.json(
        { error: 'Maximum 4 photos allowed per issue report.' },
        { status: 400 }
      );
    }

    const tech = await prisma.technician.findUnique({
      where: { id: Number(technicianId) },
      include: { state: true }
    });

    if (!tech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    const subject = `[Field Issue #${jobNumber || 'N/A'}] ${category || 'Job Support'} - ${tech.name}`;
    
    // Construct ticket message body
    let fullMessage = `FIELD ISSUE REPORT\n\n`;
    fullMessage += `Technician: ${tech.name} (${tech.email})\n`;
    fullMessage += `State: ${tech.state.name} (${tech.state.code})\n`;
    fullMessage += `Job / Work Order #: ${jobNumber || 'Not Specified'}\n`;
    fullMessage += `Issue Category: ${category || 'General Support'}\n\n`;
    fullMessage += `DESCRIPTION:\n${description}\n\n`;
    fullMessage += `ATTACHED PHOTOS (${photos.length}):\n`;
    photos.forEach((p: string, idx: number) => {
      fullMessage += `Photo ${idx + 1}: ${p.startsWith('data:') ? '[Base64 Attachment Attached]' : p}\n`;
    });

    // Create Ticket in CRM DB so it appears in CRM Admin Tickets
    const ticket = await prisma.ticket.create({
      data: {
        name: tech.name,
        email: tech.email,
        phone: tech.phone || 'N/A',
        category: 'SUPPORT',
        subject: subject,
        message: fullMessage,
        status: 'NEW',
        notes: `Submitted via Employee Portal by ${tech.name} (Tech ID #${tech.id})`
      }
    });

    // Also send immediate Telegram alert to dispatch
    await sendTelegramNotification(
      `🚨 <b>NEW FIELD ISSUE SUBMITTED ON PORTAL</b>\n\n` +
      `👤 <b>Tech:</b> ${tech.name} (${tech.state.code})\n` +
      `📌 <b>Job #:</b> ${jobNumber || 'N/A'}\n` +
      `📁 <b>Category:</b> ${category || 'Support'}\n` +
      `📝 <b>Problem:</b> ${description.substring(0, 200)}\n` +
      `🖼 <b>Photos Attached:</b> ${photos.length}\n` +
      `🎫 <b>CRM Ticket ID:</b> <code>${ticket.id}</code>`
    );

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: 'Field issue report submitted to CRM Dispatch team successfully.'
    });
  } catch (error) {
    console.error('Portal Report Ticket Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const techId = searchParams.get('technicianId');

    if (!techId) {
      return NextResponse.json({ error: 'technicianId query param required' }, { status: 400 });
    }

    const tech = await prisma.technician.findUnique({
      where: { id: Number(techId) }
    });

    if (!tech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Retrieve tickets submitted by this technician
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { email: tech.email },
          { name: tech.name }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Portal Get Tickets Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
