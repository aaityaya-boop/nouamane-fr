import prisma from '../src/lib/prisma';

async function main() {
  const ipHash = 'test_hash_123';
  const pathname = '/fr/test-perfume';
  const referrer = 'Direct';
  const device = 'Mobile';
  const city = 'Casablanca';
  const country = 'MA';

  // 1. Upsert Visitor using DB NOW()
  const visitor: any = await prisma.$queryRaw`
    INSERT INTO "Visitor" ("id", "ipHash", "city", "country", "createdAt", "lastSeen")
    VALUES (gen_random_uuid()::text, ${ipHash}, ${city}, ${country}, NOW(), NOW())
    ON CONFLICT ("ipHash") DO UPDATE
    SET "lastSeen" = NOW(),
        "city" = EXCLUDED."city",
        "country" = EXCLUDED."country"
    RETURNING *;
  `;

  const visitorRecord = visitor[0];
  console.log('Upserted Visitor:', visitorRecord);

  // 2. Insert PageView using DB NOW()
  await prisma.$queryRaw`
    INSERT INTO "PageView" ("visitorId", "pathname", "referrer", "device", "createdAt")
    VALUES (${visitorRecord.id}, ${pathname}, ${referrer}, ${device}, NOW())
  `;

  // 3. Query Active Visitors
  const activeRes: any = await prisma.$queryRaw`
    SELECT COUNT(*)::int as count 
    FROM "Visitor" 
    WHERE "lastSeen" >= NOW() - INTERVAL '2 minutes'
  `;

  console.log('Active count (DB NOW interval):', activeRes[0]?.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
