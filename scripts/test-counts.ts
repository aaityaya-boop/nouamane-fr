import prisma from '../src/lib/prisma';

async function main() {
  const nodeNow = new Date();
  const activeCutoffNode = new Date(nodeNow.getTime() - 2 * 60 * 1000);

  // 1. Query using Node time
  const countWithNodeLte = await prisma.visitor.count({
    where: {
      lastSeen: {
        gte: activeCutoffNode,
        lte: nodeNow
      }
    }
  });

  // 2. Query without lte
  const countWithoutLte = await prisma.visitor.count({
    where: {
      lastSeen: {
        gte: activeCutoffNode
      }
    }
  });

  // 3. Query using DB time
  const dbNowRes: any = await prisma.$queryRaw`SELECT NOW() as now`;
  const dbNow = new Date(dbNowRes[0].now);
  const activeCutoffDb = new Date(dbNow.getTime() - 2 * 60 * 1000);

  const countWithDbTime = await prisma.visitor.count({
    where: {
      lastSeen: {
        gte: activeCutoffDb,
        lte: dbNow
      }
    }
  });

  console.log({
    nodeNow: nodeNow.toISOString(),
    dbNow: dbNow.toISOString(),
    countWithNodeLte,
    countWithoutLte,
    countWithDbTime
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
