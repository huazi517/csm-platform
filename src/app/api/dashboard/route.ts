import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const userId = (session.user as any).id;

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 86400000);

  const [
    totalCustomers,
    activeCustomers,
    expiringContracts,
    lowBalance,
    pendingFollowUps,
    todayFollowUps,
    overdueFollowUps,
  ] = await Promise.all([
    prisma.customer.count({ where: { userId } }),
    prisma.customer.count({ where: { userId, status: 'active' } }),
    prisma.customer.count({
      where: { userId, contractEnd: { lte: in30Days, gte: now }, status: { not: 'churned' } },
    }),
    prisma.customer.findMany({
      where: { userId, status: { not: 'churned' } },
      select: { id: true, balance: true, alertThreshold: true },
    }),
    prisma.followUp.count({ where: { userId, status: 'pending' } }),
    prisma.followUp.count({
      where: { userId, status: 'pending', date: { gte: new Date(now.toDateString()), lt: new Date(now.toDateString() + 'T23:59:59') } },
    }),
    prisma.followUp.count({
      where: { userId, status: 'pending', date: { lt: new Date(now.toDateString()) } },
    }),
  ]);

  const lowBalanceCount = lowBalance.filter(c => c.balance < c.alertThreshold).length;

  // 健康度分布
  const healthDist = await prisma.customer.groupBy({
    by: ['health'],
    where: { userId },
    _count: true,
  });

  // 本月新增客户
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = await prisma.customer.count({
    where: { userId, createdAt: { gte: monthStart } },
  });

  return NextResponse.json({
    totalCustomers,
    activeCustomers,
    expiringContracts,
    lowBalance: lowBalanceCount,
    pendingFollowUps,
    todayFollowUps,
    overdueFollowUps,
    newThisMonth,
    healthDistribution: healthDist.reduce((acc: any, item) => {
      acc[item.health] = item._count;
      return acc;
    }, {}),
  });
}
