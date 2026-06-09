import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { text, description, priority, date, creator } = await req.json();

    const todo = await prisma.todo.create({
      data: {
        text,
        description,
        priority: priority || 'LOW',
        date,
        creator: creator || 'admin',
        completed: false,
      },
    });

    return NextResponse.json({
      id: todo.id,
      text: todo.text,
      description: todo.description ?? undefined,
      priority: todo.priority,
      date: todo.date,
      completed: todo.completed,
      creator: todo.creator,
      createdAt: todo.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, completed, text, description, priority, date } = await req.json();

    const data: any = {};
    if (completed !== undefined) data.completed = completed;
    if (text !== undefined) data.text = text;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (date !== undefined) data.date = date;

    const todo = await prisma.todo.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: todo.id,
      text: todo.text,
      description: todo.description ?? undefined,
      priority: todo.priority,
      date: todo.date,
      completed: todo.completed,
      creator: todo.creator,
      createdAt: todo.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing todo ID' }, { status: 400 });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
