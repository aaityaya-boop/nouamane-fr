import prisma from '../src/lib/prisma';

async function main() {
  const [activeVisitorsRes, todayVisitorsRes, yesterdayVisitorsRes] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count 
      FROM "Visitor" 
      WHERE "lastSeen" >= NOW() - INTERVAL '2 minutes'
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count 
      FROM "Visitor" 
      WHERE "lastSeen" >= date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca'
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int as count 
      FROM "Visitor" 
      WHERE "lastSeen" >= (date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') - INTERVAL '1 day') AT TIME ZONE 'Africa/Casablanca'
        AND "lastSeen" < date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca'
    `
  ]);

  console.log({
    activeVisitorsCount: Number(activeVisitorsRes[0]?.count || 0),
    todayVisitorsCount: Number(todayVisitorsRes[0]?.count || 0),
    yesterdayVisitorsCount: Number(yesterdayVisitorsRes[0]?.count || 0),
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
