import prisma from '../src/lib/prisma';

async function main() {
  const dbNow: any = await prisma.$queryRaw`SELECT NOW() as now, CURRENT_TIMESTAMP as ct`;
  const latestVisitor = await prisma.visitor.findFirst({
    orderBy: { lastSeen: 'desc' }
  });
  const latestPageView = await prisma.pageView.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { visitor: true }
  });

  console.log('--- TIME DIAGNOSTIC ---');
  console.log('Node new Date() (UTC ISO):', new Date().toISOString());
  console.log('Database NOW():', dbNow);
  console.log('Latest Visitor:', latestVisitor);
  console.log('Latest PageView:', latestPageView);
}

main().catch(console.error).finally(() => prisma.$disconnect());
