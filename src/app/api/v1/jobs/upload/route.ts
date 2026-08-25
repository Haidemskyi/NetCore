import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyTechToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const auth = verifyTechToken(authHeader);

    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized or token expired. Please log in again.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const rawJobNumber = formData.get('job_number') as string;
    const rawText = formData.get('raw_text') as string | null;
    const imageFile = formData.get('image') as File | null;

    if (!rawJobNumber) {
      return NextResponse.json(
        { error: 'Field job_number is required' },
        { status: 400 }
      );
    }

    // Clean job number (extract digits or trimmed string)
    const cleanJobNumber = rawJobNumber.replace(/^Job\s*#/i, '').trim();

    if (!cleanJobNumber) {
      return NextResponse.json(
        { error: 'Invalid job_number provided' },
        { status: 400 }
      );
    }

    // Check for duplicate job_number for this technician
    const existing = await prisma.technicianUpload.findUnique({
      where: {
        technicianId_jobNumber: {
          technicianId: auth.techId,
          jobNumber: cleanJobNumber,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Duplicate job_number: Job #${cleanJobNumber} has already been uploaded by you.` },
        { status: 400 }
      );
    }

    let imageUrl = '/uploads/screenshots/placeholder.png';

    // Save uploaded screenshot if provided
    if (imageFile && typeof imageFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'screenshots');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExt = imageFile.name ? path.extname(imageFile.name) || '.jpg' : '.jpg';
      const safeJobStr = cleanJobNumber.replace(/[^a-zA-Z0-9]/g, '');
      const fileName = `tech_${auth.techId}_${Date.now()}_${safeJobStr}${fileExt}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/screenshots/${fileName}`;
    }

    // Create database entry
    const upload = await prisma.technicianUpload.create({
      data: {
        technicianId: auth.techId,
        jobNumber: cleanJobNumber,
        imageUrl,
        rawText: rawText || null,
        payoutAmount: 0.00,
      },
    });

    return NextResponse.json({
      id: upload.id,
      job_number: upload.jobNumber,
      image_url: upload.imageUrl,
      payout_amount: Number(upload.payoutAmount),
      created_at: upload.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in mobile job upload route:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
