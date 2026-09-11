import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/followups - 获取当前用户的跟进计划
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';

  const followUps = await prisma.followUp.findMany({
    where: { userId, ...(status !== 'all' ? { status } : {}) },
    include: { customer: { select: { id: true, name: true, planType: true, phone: true, contact: true } } },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(followUps);
}

// POST /api/followups - 新增跟进计划
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    // 验证客户归属
    const customer = await prisma.customer.findFirst({ where: { id: body.customerId, userId } });
    if (!customer) return NextResponse.json({ error: '无权限操作该客户' }, { status: 403 });

    const followUp = await prisma.followUp.create({
      data: {
        userId,
        customerId: body.customerId,
        date: new Date(body.date),
        type: body.type || '回访',
        note: body.note || null,
        status: 'pending',
      },
    });
    return NextResponse.json(followUp);
  } catch (error) {
    console.error('Create followup error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

// PUT /api/followups - 更新跟进计划（标记完成/修改）
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const existing = await prisma.followUp.findFirst({ where: { id: body.id, userId } });
    if (!existing) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const followUp = await prisma.followUp.update({
      where: { id: body.id },
      data: {
        ...(body.date ? { date: new Date(body.date) } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        ...(body.status ? {
          status: body.status,
          completedAt: body.status === 'done' ? new Date() : null,
        } : {}),
      },
    });
    return NextResponse.json(followUp);
  } catch (error) {
    console.error('Update followup error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/followups
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const { id } = await req.json();
    const existing = await prisma.followUp.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await prisma.followUp.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete followup error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
