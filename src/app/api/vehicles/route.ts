import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { make, model, year, vin, plateNumber, ownershipType, status, technicianId } = await req.json();

    const v = await prisma.vehicle.create({
      data: {
        make,
        model,
        year: parseInt(year),
        vin: vin.toUpperCase(),
        plateNumber: plateNumber.toUpperCase(),
        ownershipType: ownershipType || 'COMPANY',
        status: status || 'ACTIVE',
        technicianId: technicianId ? parseInt(technicianId) : null,
      },
    });

    return NextResponse.json({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      plateNumber: v.plateNumber,
      ownershipType: v.ownershipType,
      status: v.status,
      technicianId: v.technicianId ?? undefined,
    });
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, make, model, year, vin, plateNumber, ownershipType, status, technicianId } = await req.json();

    const v = await prisma.vehicle.update({
      where: { id: parseInt(id) },
      data: {
        make,
        model,
        year: parseInt(year),
        vin: vin.toUpperCase(),
        plateNumber: plateNumber.toUpperCase(),
        ownershipType,
        status,
        technicianId: technicianId ? parseInt(technicianId) : null,
      },
    });

    return NextResponse.json({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      vin: v.vin,
      plateNumber: v.plateNumber,
      ownershipType: v.ownershipType,
      status: v.status,
      technicianId: v.technicianId ?? undefined,
    });
  } catch (error: any) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'Missing vehicle ID' }, { status: 400 });
    }

    await prisma.vehicle.delete({
      where: { id: parseInt(idStr) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
