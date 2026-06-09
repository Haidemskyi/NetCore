import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, phone, email, status, workType, stateCode, payoutType, payoutValue, notes, vehicleId } = await req.json();

    // Look up state by code
    const stateObj = await prisma.state.findUnique({
      where: { code: stateCode || 'TN' },
    });
    const stateId = stateObj ? stateObj.id : 1;

    // Create technician
    const t = await prisma.technician.create({
      data: {
        name,
        phone,
        email,
        status: status || 'ACTIVE',
        workType: workType || 'BURY',
        stateId,
        payoutType: payoutType || 'PERCENTAGE',
        payoutValue: Number(payoutValue) || 8.00,
        notes: notes || null,
      },
      include: {
        state: true,
      },
    });

    // Update vehicle association if provided
    if (vehicleId) {
      // Unassign any vehicle currently assigned to this tech
      await prisma.vehicle.updateMany({
        where: { technicianId: t.id },
        data: { technicianId: null },
      });
      // Assign the new vehicle
      await prisma.vehicle.update({
        where: { id: parseInt(vehicleId) },
        data: { technicianId: t.id },
      });
    }

    const assignedVehicle = vehicleId 
      ? await prisma.vehicle.findUnique({ where: { id: parseInt(vehicleId) } }) 
      : null;

    return NextResponse.json({
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      status: t.status,
      workType: t.workType,
      stateId: t.stateId,
      stateCode: t.state.code,
      payoutType: t.payoutType,
      payoutValue: Number(t.payoutValue),
      notes: t.notes ?? undefined,
      vehicle: assignedVehicle ? {
        id: assignedVehicle.id,
        make: assignedVehicle.make,
        model: assignedVehicle.model,
        year: assignedVehicle.year,
        vin: assignedVehicle.vin,
        plateNumber: assignedVehicle.plateNumber,
        ownershipType: assignedVehicle.ownershipType,
        status: assignedVehicle.status,
        technicianId: t.id,
      } : undefined,
    });
  } catch (error: any) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, phone, email, status, workType, stateCode, payoutType, payoutValue, notes, vehicleId } = await req.json();

    // Look up state by code
    const stateObj = await prisma.state.findUnique({
      where: { code: stateCode || 'TN' },
    });
    const stateId = stateObj ? stateObj.id : 1;

    // Update technician
    const t = await prisma.technician.update({
      where: { id: parseInt(id) },
      data: {
        name,
        phone,
        email,
        status,
        workType,
        stateId,
        payoutType,
        payoutValue: Number(payoutValue),
        notes: notes || null,
      },
      include: {
        state: true,
      },
    });

    // Handle vehicle assignment updates
    // 1. Clear any current vehicles assigned to this technician
    await prisma.vehicle.updateMany({
      where: { technicianId: t.id },
      data: { technicianId: null },
    });

    // 2. Assign new vehicle if provided
    if (vehicleId) {
      await prisma.vehicle.update({
        where: { id: parseInt(vehicleId) },
        data: { technicianId: t.id },
      });
    }

    const assignedVehicle = vehicleId
      ? await prisma.vehicle.findUnique({ where: { id: parseInt(vehicleId) } })
      : null;

    return NextResponse.json({
      id: t.id,
      name: t.name,
      phone: t.phone,
      email: t.email,
      status: t.status,
      workType: t.workType,
      stateId: t.stateId,
      stateCode: t.state.code,
      payoutType: t.payoutType,
      payoutValue: Number(t.payoutValue),
      notes: t.notes ?? undefined,
      vehicle: assignedVehicle ? {
        id: assignedVehicle.id,
        make: assignedVehicle.make,
        model: assignedVehicle.model,
        year: assignedVehicle.year,
        vin: assignedVehicle.vin,
        plateNumber: assignedVehicle.plateNumber,
        ownershipType: assignedVehicle.ownershipType,
        status: assignedVehicle.status,
        technicianId: t.id,
      } : undefined,
    });
  } catch (error: any) {
    console.error('Error updating technician:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'Missing technician ID' }, { status: 400 });
    }

    const id = parseInt(idStr);

    // Unassign vehicles first to avoid database constraint errors
    await prisma.vehicle.updateMany({
      where: { technicianId: id },
      data: { technicianId: null },
    });

    // Delete technician
    await prisma.technician.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting technician:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
