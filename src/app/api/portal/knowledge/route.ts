import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET() {
  try {
    let articles = await prisma.knowledgeArticle.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Seed default knowledge base articles if empty
    if (articles.length === 0) {
      await prisma.knowledgeArticle.createMany({
        data: [
          {
            title: 'Fiber Optic Splicing & Testing Guidelines (OTDR)',
            category: 'FIBER',
            content: `### Fiber Splicing Standard Operating Procedure\n1. Strip 250um coating using precision strippers.\n2. Clean fiber end with 99% isopropyl alcohol and lint-free wipes.\n3. Cleave fiber using diamond cleaver targeting < 0.5 deg angle.\n4. Perform fusion splice targeting loss < 0.02 dB.\n5. Protect splice using heat shrink sleeve (60mm).\n6. Test using OTDR at 1310nm / 1550nm dual wavelength.`,
            author: 'Engineering Lead'
          },
          {
            title: 'Underground Boring & Conduit Burial Safety Standards',
            category: 'BURIAL',
            content: `### Trenching & Boring Safety Standards\n1. Always call 811 (Call Before You Dig) at least 72 hours prior to excavation.\n2. Verify pothole locations for gas, electrical, and water lines.\n3. Minimum depth requirements: 24 inches for residential drop, 36 inches for main conduit feeder.\n4. Compaction must meet 95% standard proctor density after backfill.`,
            author: 'Safety Director'
          },
          {
            title: 'Fleet Vehicle Daily Inspection & Equipment Check',
            category: 'FLEET',
            content: `### Daily Pre-Trip Inspection Checklist\n- Check tire pressure & tread depth (min 4/32 inch).\n- Verify ladder rack latch locks and safety straps.\n- Inspect emergency roadside kit, fire extinguisher, and cone placement.\n- Submit vehicle condition report via Employee Portal before 7:30 AM.`,
            author: 'Fleet Manager'
          }
        ]
      });

      articles = await prisma.knowledgeArticle.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Knowledge Base API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
