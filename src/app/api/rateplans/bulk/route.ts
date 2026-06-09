import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { rates: newRates, overwriteDuplicates } = await req.json();

    const createdOrUpdated = [];

    for (const rate of newRates) {
      const { provider, stateCode, code, description, grossPrice, employeePrice } = rate;

      // Ensure state exists
      let state = await prisma.state.findUnique({
        where: { code: stateCode },
      });
      if (!state) {
        state = await prisma.state.create({
          data: {
            code: stateCode,
            name: stateCode,
          },
        });
      }

      // Try finding existing
      const existing = await prisma.ratePlan.findFirst({
        where: {
          provider: provider,
          stateCode: stateCode,
          code: code.trim().toUpperCase(),
        },
      });

      if (existing) {
        if (overwriteDuplicates) {
          const updated = await prisma.ratePlan.update({
            where: { id: existing.id },
            data: {
              description: description || existing.description,
              grossPrice: Number(grossPrice),
              employeePrice: Number(employeePrice),
            },
          });
          createdOrUpdated.push({
            id: updated.id,
            provider: updated.provider,
            stateCode: updated.stateCode,
            code: updated.code,
            description: updated.description,
            grossPrice: Number(updated.grossPrice),
            employeePrice: Number(updated.employeePrice),
          });
        }
      } else {
        const created = await prisma.ratePlan.create({
          data: {
            provider,
            stateCode,
            code: code.trim().toUpperCase(),
            description: description || '',
            grossPrice: Number(grossPrice),
            employeePrice: Number(employeePrice) || 0.00,
          },
        });
        createdOrUpdated.push({
          id: created.id,
          provider: created.provider,
          stateCode: created.stateCode,
          code: created.code,
          description: created.description,
          grossPrice: Number(created.grossPrice),
          employeePrice: Number(created.employeePrice),
        });
      }
    }

    return NextResponse.json({ success: true, count: createdOrUpdated.length, rates: createdOrUpdated });
  } catch (error: any) {
    console.error('Error in bulk rate import:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
