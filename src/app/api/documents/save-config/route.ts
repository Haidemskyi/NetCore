import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Config missing' }, { status: 400 });
    }

    const configPath = path.join(process.cwd(), 'src', 'lib', 'pdfConfig.ts');

    const fileContent = `/**
 * PDF FIELD POSITIONS CONFIGURATION
 * 
 * Auto-saved by Visual Drag & Place Designer Tool!
 */

export const PDF_FIELD_CONFIG = ${JSON.stringify(config, null, 2)};
`;

    fs.writeFileSync(configPath, fileContent, 'utf-8');

    return NextResponse.json({ success: true, message: 'PDF field config saved successfully!' });
  } catch (error: any) {
    console.error('Error saving PDF config:', error);
    return NextResponse.json({ error: error.message || 'Failed to save config' }, { status: 500 });
  }
}
