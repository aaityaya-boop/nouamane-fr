import prisma from '../src/lib/prisma';

async function main() {
  const activeVisitors: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count 
    FROM "Visitor" 
    WHERE "lastSeen" >= NOW() - INTERVAL '2 minutes'
  `;

  const todayVisitors: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count 
    FROM "Visitor" 
    WHERE "lastSeen" >= date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca'
  `;

  const recentPageViews = await prisma.pageView.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { visitor: true }
  });

  console.log('--- TEST SQL LIVE STATS ---');
  console.log('Active Visitors (last 2 min):', activeVisitors[0]?.count);
  console.log('Today Visitors (Casablanca):', todayVisitors[0]?.count);
  console.log('Recent PageViews (latest 3):', recentPageViews.slice(0, 3));
}

main().catch(console.error).finally(() => prisma.$disconnect());
