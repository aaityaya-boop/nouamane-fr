import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Current Server Time (UTC):', now.toISOString());
  
  const totalVisitors = await prisma.visitor.count();
  const active5Min = await prisma.visitor.count({
    where: { lastSeen: { gte: new Date(now.getTime() - 5 * 60 * 1000) } }
  });
  const active2Min = await prisma.visitor.count({
    where: { lastSeen: { gte: new Date(now.getTime() - 2 * 60 * 1000) } }
  });
  
  console.log(`Total Visitors in DB: ${totalVisitors}`);
  console.log(`Active Visitors (last 5 min): ${active5Min}`);
  console.log(`Active Visitors (last 2 min): ${active2Min}`);

  const recentVisitors = await prisma.visitor.findMany({
    orderBy: { lastSeen: 'desc' },
    take: 10
  });
  console.log('Recent 10 Visitors:', JSON.stringify(recentVisitors, null, 2));

  const recentPageViews = await prisma.pageView.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { visitor: true }
  });
  console.log('Recent 10 PageViews:', JSON.stringify(recentPageViews, null, 2));
}

main().finally(() => prisma.$disconnect());
