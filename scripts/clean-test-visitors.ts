import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndAudit() {
  const now = new Date();
  console.log('Real Current Time (UTC):', now.toISOString());

  // 1. Find visitors with future lastSeen
  const futureVisitors = await prisma.visitor.findMany({
    where: {
      lastSeen: { gt: now }
    }
  });
  console.log(`Found ${futureVisitors.length} visitors with future lastSeen:`);
  for (const v of futureVisitors) {
    console.log(`- Visitor ${v.id} (${v.city}) lastSeen: ${v.lastSeen.toISOString()}`);
  }

  // 2. Find pageviews with future createdAt
  const futurePageViews = await prisma.pageView.findMany({
    where: {
      createdAt: { gt: now }
    }
  });
  console.log(`Found ${futurePageViews.length} pageViews with future createdAt.`);

  // 3. Reset all future timestamps to the actual past (e.g. 1 hour ago) so they don't linger as fake active visitors
  if (futureVisitors.length > 0) {
    await prisma.visitor.updateMany({
      where: { lastSeen: { gt: now } },
      data: { lastSeen: new Date(now.getTime() - 60 * 60 * 1000) }
    });
    console.log('Reset future visitor lastSeen to 1 hour ago.');
  }

  if (futurePageViews.length > 0) {
    await prisma.pageView.updateMany({
      where: { createdAt: { gt: now } },
      data: { createdAt: new Date(now.getTime() - 60 * 60 * 1000) }
    });
    console.log('Reset future pageViews createdAt to 1 hour ago.');
  }

  // 4. Recalculate active visitors right now (active within last 2 minutes)
  const realActiveCutoff = new Date(now.getTime() - 2 * 60 * 1000);
  const realActive = await prisma.visitor.count({
    where: {
      lastSeen: {
        gte: realActiveCutoff,
        lte: now
      }
    }
  });

  console.log(`REAL ACTIVE VISITORS RIGHT NOW (2 min window): ${realActive}`);
}

cleanAndAudit().finally(() => prisma.$disconnect());
