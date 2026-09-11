const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  // Check if already seeded
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }

  console.log('Initializing database with demo data...');

  const hash = await bcrypt.hash('demo123456', 10);

  const user1 = await prisma.user.create({
    data: { name: '东家', email: 'demo@tinet.com', password: hash, role: 'admin' }
  });

  const user2 = await prisma.user.create({
    data: { name: '张经理', email: 'colleague@tinet.com', password: hash, role: 'manager' }
  });

  const customers1 = await Promise.all([
    prisma.customer.create({
      data: {
        userId: user1.id, name: '北京云创科技有限公司', contact: '王总', phone: '13800001234',
        email: 'wang@yunchuang.com', company: '北京云创科技有限公司',
        planType: '企业版', contractStart: new Date('2025-09-01'), contractEnd: new Date('2026-09-05'),
        balance: 12500, alertThreshold: 5000, status: 'active', health: 'attention',
        notes: '大客户，年框合同，即将到期需重点跟进'
      }
    }),
    prisma.customer.create({
      data: {
        userId: user1.id, name: '上海智联教育科技', contact: '李总监', phone: '13900005678',
        email: 'li@zhilianedu.com', company: '上海智联教育科技',
        planType: '专业版', contractStart: new Date('2025-11-15'), contractEnd: new Date('2026-09-25'),
        balance: 8600, alertThreshold: 3000, status: 'active', health: 'healthy',
        notes: '教育行业客户，用量稳定增长'
      }
    }),
    prisma.customer.create({
      data: {
        userId: user1.id, name: '深圳前海金融服务有限公司', contact: '张助理', phone: '13500009012',
        email: 'zhang@qhjr.com', company: '深圳前海金融服务',
        planType: '标准版', contractStart: new Date('2026-01-10'), contractEnd: new Date('2027-01-10'),
        balance: 320.5, alertThreshold: 1000, status: 'active', health: 'risk',
        notes: '余额严重不足，需紧急联系充值'
      }
    }),
    prisma.customer.create({
      data: {
        userId: user1.id, name: '杭州绿源电商有限公司', contact: '陈总', phone: '13700003456',
        email: 'chen@lvyuan.com', company: '杭州绿源电商',
        planType: '基础版', contractStart: new Date('2026-03-01'), contractEnd: new Date('2027-03-01'),
        balance: 5200, alertThreshold: 1000, status: 'active', health: 'healthy',
        notes: '新签客户，业务量较小'
      }
    }),
    prisma.customer.create({
      data: {
        userId: user1.id, name: '成都天府医疗科技', contact: '刘主任', phone: '13600007890',
        email: 'liu@tfmed.com', company: '成都天府医疗科技',
        planType: '专业版', contractStart: new Date('2026-06-01'), contractEnd: new Date('2026-11-30'),
        balance: 15800, alertThreshold: 5000, status: 'trial', health: 'healthy',
        notes: '试用转正式，待确认签约'
      }
    })
  ]);

  await Promise.all([
    prisma.followUp.create({
      data: { userId: user1.id, customerId: customers1[0].id, date: new Date('2026-09-15'), type: '续约', note: '预约续约面谈，准备新方案', status: 'pending' }
    }),
    prisma.followUp.create({
      data: { userId: user1.id, customerId: customers1[1].id, date: new Date('2026-09-12'), type: '回访', note: '月度回访，了解使用体验', status: 'pending' }
    }),
    prisma.followUp.create({
      data: { userId: user1.id, customerId: customers1[2].id, date: new Date('2026-09-11'), type: '充值', note: '余额严重不足，紧急联系充值', status: 'pending' }
    }),
    prisma.followUp.create({
      data: { userId: user1.id, customerId: customers1[4].id, date: new Date('2026-09-18'), type: '回访', note: '确认试用反馈，推进正式签约', status: 'pending' }
    })
  ]);

  await prisma.customer.create({
    data: {
      userId: user2.id, name: '广州天河商贸有限公司', contact: '赵经理', phone: '13100001111',
      email: 'zhao@thsm.com', company: '广州天河商贸',
      planType: '标准版', contractStart: new Date('2026-01-01'), contractEnd: new Date('2027-01-01'),
      balance: 3000, alertThreshold: 1000, status: 'active', health: 'healthy',
      notes: '稳定客户'
    }
  });

  console.log('Seed data created successfully!');
  console.log('Demo accounts: demo@tinet.com / colleague@tinet.com (password: demo123456)');
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
