import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/customers - 获取当前用户的客户列表
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'contractEnd';

  const where: any = { userId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { contact: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status && status !== 'all') where.status = status;

  const orderBy: any = sort === 'contractEnd'
    ? { contractEnd: 'asc' }
    : sort === 'balance'
    ? { balance: 'asc' }
    : { createdAt: 'desc' };

  const customers = await prisma.customer.findMany({
    where, orderBy,
    include: { followUps: { orderBy: { date: 'desc' }, take: 5 } },
  });

  return NextResponse.json(customers);
}

// POST /api/customers - 新增客户
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: body.name,
        contact: body.contact || null,
        phone: body.phone || null,
        email: body.email || null,
        company: body.company || null,
        planType: body.planType || null,
        contractStart: body.contractStart ? new Date(body.contractStart) : null,
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : null,
        autoRenew: body.autoRenew || false,
        balance: parseFloat(body.balance) || 0,
        alertThreshold: parseFloat(body.alertThreshold) || 500,
        status: body.status || 'active',
        health: computeHealth(body),
        notes: body.notes || null,
        bossCustomerId: body.bossCustomerId || null,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: '创建失败' }, { status: 500 });
  }
}

// PUT /api/customers - 更新客户
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    // 验证归属
    const existing = await prisma.customer.findFirst({ where: { id: body.id, userId } });
    if (!existing) return NextResponse.json({ error: '无权限' }, { status: 403 });

    const customer = await prisma.customer.update({
      where: { id: body.id },
      data: {
        name: body.name,
        contact: body.contact || null,
        phone: body.phone || null,
        email: body.email || null,
        company: body.company || null,
        planType: body.planType || null,
        contractStart: body.contractStart ? new Date(body.contractStart) : null,
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : null,
        autoRenew: body.autoRenew || false,
        balance: parseFloat(body.balance) || 0,
        alertThreshold: parseFloat(body.alertThreshold) || 500,
        status: body.status || 'active',
        health: computeHealth(body),
        notes: body.notes || null,
        bossCustomerId: body.bossCustomerId || null,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}

// DELETE /api/customers - 删除客户
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  try {
    const { id } = await req.json();
    const existing = await prisma.customer.findFirst({ where: { id, userId } });
    if (!existing) return NextResponse.json({ error: '无权限' }, { status: 403 });

    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

function computeHealth(body: any): string {
  if (body.status === 'churned') return 'churned';
  const balance = parseFloat(body.balance) || 0;
  const threshold = parseFloat(body.alertThreshold) || 500;
  const contractEnd = body.contractEnd ? new Date(body.contractEnd) : null;
  const now = new Date();
  const daysLeft = contractEnd ? Math.ceil((contractEnd.getTime() - now.getTime()) / 86400000) : 999;

  if (daysLeft <= 0 || balance < threshold * 0.3) return 'risk';
  if (daysLeft <= 30 || balance < threshold) return 'attention';
  return 'healthy';
}
