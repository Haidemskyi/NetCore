import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { PDF_FIELD_CONFIG } from '@/lib/pdfConfig';

export interface CandidatePdfData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  ssnOrEin: string;
  address: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
  signatureDataUrl: string; // Base64 data URL
}

export interface GeneratedPdfResult {
  fileName: string;
  category: string;
  dataUrl: string;
  base64Bytes: string;
}

export async function fillAll4RealOnboardingPdfs(data: CandidatePdfData): Promise<GeneratedPdfResult[]> {
  const docsDir = path.join(process.cwd(), 'Documents');
  const currentDate = new Date().toLocaleDateString('en-US');
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

  const results: GeneratedPdfResult[] = [];

  // Helper to safely embed signature PNG
  async function embedSignature(pdfDoc: PDFDocument) {
    if (!data.signatureDataUrl || !data.signatureDataUrl.startsWith('data:image')) {
      return null;
    }
    try {
      const base64Data = data.signatureDataUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      const pngBuffer = Buffer.from(base64Data, 'base64');
      return await pdfDoc.embedPng(pngBuffer);
    } catch (e) {
      console.warn('Could not embed signature PNG into PDF:', e);
      return null;
    }
  }

  // -------------------------------------------------------------
  // 1. Direct Deposit NetCore.pdf
  // -------------------------------------------------------------
  const directDepositFile = 'Direct Deposit NetCore.pdf';
  const directDepositPath = path.join(docsDir, directDepositFile);
  if (fs.existsSync(directDepositPath)) {
    try {
      const pdfBytes = fs.readFileSync(directDepositPath);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const page1 = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const sigImage = await embedSignature(pdfDoc);

      const cfg = PDF_FIELD_CONFIG.directDeposit as Record<string, any>;

      // Draw values on Direct Deposit form using PDF_FIELD_CONFIG
      if (cfg.fullName?.pdf) {
        page1.drawText(fullName, { x: cfg.fullName.pdf.x, y: cfg.fullName.pdf.y, size: cfg.fullName.pdf.size || 11, font, color: rgb(0, 0, 0) });
      }
      if (cfg.bankName?.pdf) {
        page1.drawText(data.bankName || 'N/A', { x: cfg.bankName.pdf.x, y: cfg.bankName.pdf.y, size: cfg.bankName.pdf.size || 11, font, color: rgb(0, 0, 0) });
      }
      if (cfg.routingNumber?.pdf) {
        page1.drawText(data.routingNumber || 'N/A', { x: cfg.routingNumber.pdf.x, y: cfg.routingNumber.pdf.y, size: cfg.routingNumber.pdf.size || 11, font, color: rgb(0, 0, 0) });
      }
      if (cfg.accountNumber?.pdf) {
        page1.drawText(data.accountNumber || 'N/A', { x: cfg.accountNumber.pdf.x, y: cfg.accountNumber.pdf.y, size: cfg.accountNumber.pdf.size || 11, font, color: rgb(0, 0, 0) });
      }
      if (cfg.accountType?.pdf) {
        page1.drawText(data.accountType || 'Checking', { x: cfg.accountType.pdf.x, y: cfg.accountType.pdf.y, size: cfg.accountType.pdf.size || 11, font, color: rgb(0, 0, 0) });
      }

      if (sigImage) {
        page1.drawImage(sigImage, {
          x: cfg.signature.pdf.x,
          y: cfg.signature.pdf.y,
          width: cfg.signature.pdf.width,
          height: cfg.signature.pdf.height,
        });
      } else {
        page1.drawText(fullName, { x: cfg.signature.pdf.x, y: cfg.signature.pdf.y + 10, size: 14, font, color: rgb(0.1, 0.1, 0.5) });
      }

      const filledPdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
      results.push({
        fileName: `Direct_Deposit_${data.lastName}_${data.firstName}.pdf`,
        category: 'BANKING',
        dataUrl: filledPdfBytes,
        base64Bytes: filledPdfBytes.replace(/^data:application\/pdf;base64,/, ''),
      });
    } catch (err: any) {
      console.error('Error filling Direct Deposit PDF:', err);
    }
  }

  // -------------------------------------------------------------
  // 2. Form W-9 .pdf
  // -------------------------------------------------------------
  const w9File = 'Form W-9 .pdf';
  const w9Path = path.join(docsDir, w9File);
  if (fs.existsSync(w9Path)) {
    try {
      const pdfBytes = fs.readFileSync(w9Path);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const page1 = pages[0];
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const sigImage = await embedSignature(pdfDoc);

      const cfg = PDF_FIELD_CONFIG.w9;

      page1.drawText(fullName, { x: cfg.fullName.pdf.x, y: cfg.fullName.pdf.y, size: cfg.fullName.pdf.size, font, color: rgb(0, 0, 0) });
      page1.drawText(data.address || '', { x: cfg.address.pdf.x, y: cfg.address.pdf.y, size: cfg.address.pdf.size, font, color: rgb(0, 0, 0) });
      page1.drawText(data.ssnOrEin || '', { x: cfg.ssn.pdf.x, y: cfg.ssn.pdf.y, size: cfg.ssn.pdf.size, font, color: rgb(0, 0, 0) });

      if (sigImage) {
        page1.drawImage(sigImage, {
          x: cfg.signature.pdf.x,
          y: cfg.signature.pdf.y,
          width: cfg.signature.pdf.width,
          height: cfg.signature.pdf.height,
        });
      } else {
        page1.drawText(fullName, { x: cfg.signature.pdf.x, y: cfg.signature.pdf.y + 10, size: 14, font, color: rgb(0.1, 0.1, 0.5) });
      }
      page1.drawText(currentDate, { x: cfg.date.pdf.x, y: cfg.date.pdf.y, size: cfg.date.pdf.size, font, color: rgb(0, 0, 0) });

      const filledPdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
      results.push({
        fileName: `Form_W9_${data.lastName}_${data.firstName}.pdf`,
        category: 'TAX',
        dataUrl: filledPdfBytes,
        base64Bytes: filledPdfBytes.replace(/^data:application\/pdf;base64,/, ''),
      });
    } catch (err: any) {
      console.error('Error filling Form W-9 PDF:', err);
    }
  }

  // -------------------------------------------------------------
  // 3. Independent Contractor Agreement.pdf
  // -------------------------------------------------------------
  const contractorFile = 'Independent Contractor Agreement.pdf';
  const contractorPath = path.join(docsDir, contractorFile);
  if (fs.existsSync(contractorPath)) {
    try {
      const pdfBytes = fs.readFileSync(contractorPath);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const sigImage = await embedSignature(pdfDoc);

      const cfg = PDF_FIELD_CONFIG.contractorAgreement;

      lastPage.drawText(fullName, { x: cfg.fullName.pdf.x, y: cfg.fullName.pdf.y, size: cfg.fullName.pdf.size, font, color: rgb(0, 0, 0) });
      lastPage.drawText(currentDate, { x: cfg.date.pdf.x, y: cfg.date.pdf.y, size: cfg.date.pdf.size, font, color: rgb(0, 0, 0) });
      lastPage.drawText(data.address || 'N/A', { x: cfg.address.pdf.x, y: cfg.address.pdf.y, size: cfg.address.pdf.size, font, color: rgb(0, 0, 0) });

      if (sigImage) {
        lastPage.drawImage(sigImage, {
          x: cfg.signature.pdf.x,
          y: cfg.signature.pdf.y,
          width: cfg.signature.pdf.width,
          height: cfg.signature.pdf.height,
        });
      } else {
        lastPage.drawText(fullName, { x: cfg.signature.pdf.x, y: cfg.signature.pdf.y + 10, size: 14, font, color: rgb(0.1, 0.1, 0.5) });
      }

      const filledPdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
      results.push({
        fileName: `Independent_Contractor_Agreement_${data.lastName}_${data.firstName}.pdf`,
        category: 'CONTRACT',
        dataUrl: filledPdfBytes,
        base64Bytes: filledPdfBytes.replace(/^data:application\/pdf;base64,/, ''),
      });
    } catch (err: any) {
      console.error('Error filling Contractor Agreement PDF:', err);
    }
  }

  // -------------------------------------------------------------
  // 4. NDA NetCore.pdf
  // -------------------------------------------------------------
  const ndaFile = 'NDA NetCore.pdf';
  const ndaPath = path.join(docsDir, ndaFile);
  if (fs.existsSync(ndaPath)) {
    try {
      const pdfBytes = fs.readFileSync(ndaPath);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const sigImage = await embedSignature(pdfDoc);

      const cfg = PDF_FIELD_CONFIG.contractorAgreement;

      lastPage.drawText(fullName, { x: cfg.fullName.pdf.x, y: cfg.fullName.pdf.y, size: cfg.fullName.pdf.size, font, color: rgb(0, 0, 0) });
      lastPage.drawText(currentDate, { x: cfg.date.pdf.x, y: cfg.date.pdf.y, size: cfg.date.pdf.size, font, color: rgb(0, 0, 0) });

      if (sigImage) {
        lastPage.drawImage(sigImage, {
          x: cfg.signature.pdf.x,
          y: cfg.signature.pdf.y,
          width: cfg.signature.pdf.width,
          height: cfg.signature.pdf.height,
        });
      } else {
        lastPage.drawText(fullName, { x: cfg.signature.pdf.x, y: cfg.signature.pdf.y + 10, size: 14, font, color: rgb(0.1, 0.1, 0.5) });
      }

      const filledPdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });
      results.push({
        fileName: `NDA_NetCore_${data.lastName}_${data.firstName}.pdf`,
        category: 'NDA',
        dataUrl: filledPdfBytes,
        base64Bytes: filledPdfBytes.replace(/^data:application\/pdf;base64,/, ''),
      });
    } catch (err: any) {
      console.error('Error filling NDA PDF:', err);
    }
  }

  return results;
}
