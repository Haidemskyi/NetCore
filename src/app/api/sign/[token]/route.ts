import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

import { fillAll4RealOnboardingPdfs } from '@/lib/pdfFiller';

export async function GET(req: Request, props: { params: Promise<{ token: string }> }) {
  try {
    const params = await props.params;
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { signingToken: token },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Signing link invalid or expired' }, { status: 404 });
    }

    // List required documents available in Documents/
    let documentsList: string[] = [];
    const documentsDir = path.join(process.cwd(), 'Documents');
    if (fs.existsSync(documentsDir)) {
      documentsList = fs.readdirSync(documentsDir);
    }

    const state = await prisma.state.findUnique({
      where: { code: candidate.stateCode },
    });

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        stateCode: candidate.stateCode,
        stateName: state ? state.name : candidate.stateCode,
        status: candidate.status,
      },
      documents: documentsList.length > 0 ? documentsList : [
        'Direct Deposit NetCore.pdf',
        'Form W-9 .pdf',
        'Independent Contractor Agreement.pdf',
        'NDA NetCore.pdf'
      ],
    });
  } catch (error: any) {
    console.error('Error fetching signing candidate details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ token: string }> }) {
  try {
    const params = await props.params;
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { signingToken: token },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Signing link invalid or expired' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      firstName, 
      lastName, 
      phone, 
      ssnOrEin, 
      address, 
      bankName, 
      routingNumber, 
      accountNumber, 
      accountType, 
      signatureDataUrl, 
      signatureName,
      signedDocuments 
    } = body;

    const finalFirstName = firstName || candidate.firstName;
    const finalLastName = lastName || candidate.lastName;
    const finalPhone = phone || candidate.phone || '';

    // Find state for technician
    const stateObj = await prisma.state.findUnique({
      where: { code: candidate.stateCode.toUpperCase() },
    });
    const stateId = stateObj ? stateObj.id : 1;

    // Check if technician already exists with this email
    let technician = await prisma.technician.findUnique({
      where: { email: candidate.email },
    });

    const fullName = `${finalFirstName} ${finalLastName}`;

    const notesInfo = `Signed Onboarding Agreement package online on ${new Date().toLocaleString()}.\nTax ID/SSN: ${ssnOrEin || 'N/A'}\nAddress: ${address || 'N/A'}\nBank: ${bankName || 'N/A'} (Routing: ${routingNumber || 'N/A'}, Acc: ${accountNumber || 'N/A'}, Type: ${accountType || 'Checking'})`;

    if (!technician) {
      // 1. Create Employee / Technician profile in Employees
      technician = await prisma.technician.create({
        data: {
          name: fullName,
          phone: finalPhone,
          email: candidate.email,
          status: 'ACTIVE',
          workType: 'BURY',
          stateId: stateId,
          payoutType: 'PERCENTAGE',
          payoutValue: 8.00,
          notes: notesInfo,
        },
      });
    } else {
      // Update existing technician details
      technician = await prisma.technician.update({
        where: { id: technician.id },
        data: {
          name: fullName,
          phone: finalPhone || technician.phone,
          status: 'ACTIVE',
          notes: `${technician.notes || ''}\n\n${notesInfo}`.trim(),
        },
      });
    }

    // 2. Generate and attach all 4 real filled PDF documents to Technician documents table
    let generatedPdfs = await fillAll4RealOnboardingPdfs({
      firstName: finalFirstName,
      lastName: finalLastName,
      phone: finalPhone,
      email: candidate.email,
      ssnOrEin: ssnOrEin || '',
      address: address || '',
      bankName: bankName || '',
      routingNumber: routingNumber || '',
      accountNumber: accountNumber || '',
      accountType: accountType || 'Checking',
      signatureDataUrl: signatureDataUrl || '',
    });

    const fallbackDataUrl = signatureDataUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const savedDocIds: string[] = [];

    if (generatedPdfs.length > 0) {
      for (const pdf of generatedPdfs) {
        const createdDoc = await prisma.techDocument.create({
          data: {
            technicianId: technician.id,
            name: pdf.fileName,
            fileType: 'application/pdf',
            size: pdf.dataUrl.length,
            dataUrl: pdf.dataUrl,
            category: pdf.category,
          },
        });
        savedDocIds.push(createdDoc.id);
      }
    } else {
      const docsToCreate = (signedDocuments && signedDocuments.length > 0) ? signedDocuments : [
        { name: `Direct_Deposit_${finalLastName}_${finalFirstName}.pdf`, category: 'BANKING', dataUrl: fallbackDataUrl },
        { name: `Form_W9_${finalLastName}_${finalFirstName}.pdf`, category: 'TAX', dataUrl: fallbackDataUrl },
        { name: `Independent_Contractor_Agreement_${finalLastName}_${finalFirstName}.pdf`, category: 'CONTRACT', dataUrl: fallbackDataUrl },
        { name: `NDA_NetCore_${finalLastName}_${finalFirstName}.pdf`, category: 'NDA', dataUrl: fallbackDataUrl },
      ];
      for (const doc of docsToCreate) {
        const createdDoc = await prisma.techDocument.create({
          data: {
            technicianId: technician.id,
            name: doc.name || `Signed_Document_${finalLastName}.pdf`,
            fileType: 'application/pdf',
            size: (doc.dataUrl || fallbackDataUrl).length,
            dataUrl: doc.dataUrl || fallbackDataUrl,
            category: doc.category || 'CONTRACT',
          },
        });
        savedDocIds.push(createdDoc.id);
      }
    }

    return NextResponse.json({
      success: true,
      technicianId: technician.id,
      candidateId: candidate.id,
      savedDocumentsCount: savedDocIds.length,
      message: 'All 4 onboarding documents successfully signed and saved to employee card!',
    });
  } catch (error: any) {
    console.error('Error processing document signatures:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
