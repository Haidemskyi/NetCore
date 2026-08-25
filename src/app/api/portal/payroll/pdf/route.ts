import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '../../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const techId = searchParams.get('technicianId');
    const docId = searchParams.get('docId');

    // 1. If docId is provided, generate PDF for specific statement or serve existing PDF document
    if (docId) {
      const doc = await prisma.techDocument.findUnique({ where: { id: docId } });
      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // If document is already a PDF
      if (doc.dataUrl.startsWith('data:application/pdf;base64,')) {
        const base64Data = doc.dataUrl.replace(/^data:application\/pdf;base64,/, '');
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${doc.name}"`
          }
        });
      }

      // If document is a CSV paystub / statement, generate PDF on the fly
      let csvRaw = '';
      if (doc.dataUrl.startsWith('data:text/csv;base64,')) {
        csvRaw = Buffer.from(doc.dataUrl.replace(/^data:text\/csv;base64,/, ''), 'base64').toString('utf-8');
      } else if (doc.dataUrl.startsWith('data:')) {
        const commaIdx = doc.dataUrl.indexOf(',');
        if (commaIdx !== -1) {
          const payload = doc.dataUrl.substring(commaIdx + 1);
          csvRaw = doc.dataUrl.includes('base64')
            ? Buffer.from(payload, 'base64').toString('utf-8')
            : decodeURIComponent(payload);
        }
      } else {
        csvRaw = doc.dataUrl;
      }

      // Create PDF for the CSV statement using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();

      // Top Header Banner
      page.drawRectangle({
        x: 0,
        y: height - 80,
        width: width,
        height: 80,
        color: rgb(0.102, 0.451, 0.91)
      });

      page.drawText('NETCORE LLC', {
        x: 35,
        y: height - 38,
        size: 18,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      page.drawText(`OFFICIAL PAYOUT STATEMENT • ${doc.name}`, {
        x: 35,
        y: height - 58,
        size: 10,
        font: fontBold,
        color: rgb(0.9, 0.95, 1)
      });

      const dateStr = new Date(doc.uploadedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      page.drawText(`Statement Date: ${dateStr}`, {
        x: width - 210,
        y: height - 38,
        size: 9,
        font: font,
        color: rgb(1, 1, 1)
      });

      let y = height - 110;

      // Parse CSV rows
      const lines = csvRaw.split(/\r?\n/).filter(line => line.trim() !== '');
      let headers: string[] = [];
      let dataRows: string[][] = [];

      if (lines.length > 0) {
        headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
      }

      // Render CSV Table
      page.drawText(`STATEMENT DETAILS`, { x: 35, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 15;
      page.drawLine({ start: { x: 35, y }, end: { x: width - 35, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
      y -= 25;

      if (headers.length > 0) {
        page.drawRectangle({ x: 35, y: y - 18, width: width - 70, height: 20, color: rgb(0.92, 0.94, 0.96) });
        let xPos = 45;
        const colWidth = (width - 90) / Math.min(headers.length, 5);

        headers.slice(0, 5).forEach((h) => {
          page.drawText(h.toUpperCase().substring(0, 18), { x: xPos, y: y - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
          xPos += colWidth;
        });

        y -= 25;
      }

      dataRows.slice(0, 25).forEach((row, idx) => {
        if (y < 50) return;
        if (idx % 2 === 1) {
          page.drawRectangle({ x: 35, y: y - 4, width: width - 70, height: 16, color: rgb(0.98, 0.98, 0.98) });
        }

        let xPos = 45;
        const colWidth = (width - 90) / Math.min(row.length, 5);

        row.slice(0, 5).forEach((cell) => {
          page.drawText(cell.substring(0, 22), { x: xPos, y, size: 8, font: cell.includes('$') ? fontBold : font, color: cell.includes('$') ? rgb(0.1, 0.45, 0.9) : rgb(0.2, 0.2, 0.2) });
          xPos += colWidth;
        });

        y -= 16;
      });

      page.drawText(`NetCore LLC • Official Paystub Document`, {
        x: 35,
        y: 25,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });

      const pdfBytes = await pdfDoc.save();
      const pdfFileName = doc.name.toLowerCase().endsWith('.pdf') ? doc.name : `${doc.name.replace(/\.csv$/i, '')}.pdf`;

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${pdfFileName}"`
        }
      });
    }

    if (!techId) {
      return NextResponse.json({ error: 'technicianId parameter required' }, { status: 400 });
    }

    const tech = await prisma.technician.findUnique({
      where: { id: Number(techId) },
      include: {
        state: true,
        contracts: true,
        jobs: {
          include: { ratePlan: true, city: true },
          orderBy: { date: 'desc' },
          take: 100
        }
      }
    });

    if (!tech) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    const perDiemRate = Number(tech.perDiemOverride || tech.state.employeePerDiem || 0);

    // Group jobs by week or total list
    const totalEarnings = tech.jobs.reduce((acc, j) => acc + Number(j.techPayout), 0);
    const totalCompanyGross = tech.jobs.reduce((acc, j) => acc + Number(j.companyRevenue), 0);

    // Create PDF Document using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([612, 792]); // Standard US Letter size
    const { width, height } = page.getSize();

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 90,
      width: width,
      height: 90,
      color: rgb(0.102, 0.451, 0.91) // NetCore / Google Blue #1a73e8
    });

    page.drawText('NETCORE LLC', {
      x: 35,
      y: height - 40,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('WEEKLY PAYROLL & FIELD EARNINGS STATEMENT', {
      x: 35,
      y: height - 60,
      size: 10,
      font: fontBold,
      color: rgb(0.9, 0.95, 1)
    });

    const currentDateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    page.drawText(`Date Issued: ${currentDateStr}`, {
      x: width - 200,
      y: height - 40,
      size: 9,
      font: font,
      color: rgb(1, 1, 1)
    });

    // Technician Details Card Section
    let y = height - 120;

    page.drawText(`EMPLOYEE DETAILS`, { x: 35, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 15;
    page.drawLine({ start: { x: 35, y }, end: { x: width - 35, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
    y -= 20;

    page.drawText(`Technician Name: ${tech.name}`, { x: 35, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(`Assigned Region: ${tech.state.name} (${tech.state.code})`, { x: 320, y, size: 10, font: font, color: rgb(0.2, 0.2, 0.2) });
    y -= 16;
    page.drawText(`Email: ${tech.email}`, { x: 35, y, size: 9, font: font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(`Specialization: ${tech.workType}`, { x: 320, y, size: 9, font: font, color: rgb(0.3, 0.3, 0.3) });
    y -= 16;
    page.drawText(`Personal Per Diem Rate: $${perDiemRate.toFixed(2)} / day`, { x: 35, y, size: 9, font: fontBold, color: rgb(0.1, 0.5, 0.2) });

    y -= 30;

    // Summary Box (Clean Employee View)
    page.drawRectangle({
      x: 35,
      y: y - 40,
      width: width - 70,
      height: 45,
      color: rgb(0.96, 0.97, 0.98),
      borderColor: rgb(0.85, 0.85, 0.85),
      borderWidth: 1
    });

    page.drawText(`TOTAL COMPLETED JOBS`, { x: 50, y: y - 15, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`${tech.jobs.length} Orders`, { x: 50, y: y - 32, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });

    page.drawText(`DAILY PER DIEM RATE`, { x: 230, y: y - 15, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`$${perDiemRate.toFixed(2)} / day`, { x: 230, y: y - 32, size: 12, font: fontBold, color: rgb(0.1, 0.5, 0.2) });

    page.drawText(`TOTAL TECHNICIAN EARNINGS`, { x: 410, y: y - 15, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`$${totalEarnings.toFixed(2)}`, { x: 410, y: y - 32, size: 13, font: fontBold, color: rgb(0.1, 0.45, 0.9) });

    y -= 70;

    // Jobs Table Header
    page.drawText(`COMPLETED WORK ORDERS LEDGER`, { x: 35, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 15;

    page.drawRectangle({ x: 35, y: y - 18, width: width - 70, height: 20, color: rgb(0.92, 0.94, 0.96) });
    page.drawText('DATE', { x: 45, y: y - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('JOB CODE / DESCRIPTION', { x: 130, y: y - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('CITY', { x: 340, y: y - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('PAYOUT ($)', { x: 480, y: y - 12, size: 8, font: fontBold, color: rgb(0.2, 0.2, 0.2) });

    y -= 25;

    // Table rows
    const displayJobs = tech.jobs.slice(0, 15);
    displayJobs.forEach((j, index) => {
      if (y < 60) return; // Prevent overflowing page

      const dateStr = new Date(j.date).toLocaleDateString('en-US');
      const codeStr = `${j.ratePlan.code} - ${j.ratePlan.description.substring(0, 25)}`;
      const cityStr = j.city.name;
      const payoutStr = `$${Number(j.techPayout).toFixed(2)}`;

      if (index % 2 === 1) {
        page.drawRectangle({ x: 35, y: y - 4, width: width - 70, height: 16, color: rgb(0.98, 0.98, 0.98) });
      }

      page.drawText(dateStr, { x: 45, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(codeStr, { x: 130, y, size: 8, font, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(cityStr, { x: 340, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
      page.drawText(payoutStr, { x: 480, y, size: 8, font: fontBold, color: rgb(0.1, 0.45, 0.9) });

      y -= 16;
    });

    // Footer
    page.drawText(`NetCore LLC • Official Statement • Confidential`, {
      x: 35,
      y: 25,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="NetCore_Paystub_${tech.name.replace(/\s+/g, '_')}.pdf"`
      }
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error generating PDF report' }, { status: 500 });
  }
}
