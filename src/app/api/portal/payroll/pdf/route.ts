import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { prisma } from '../../../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const techId = searchParams.get('technicianId');

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
