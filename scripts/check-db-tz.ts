import prisma from '../src/lib/prisma';

async function main() {
  const tz: any = await prisma.$queryRaw`SHOW timezone`;
  const cols: any = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Visitor' OR table_name = 'PageView';
  `;
  console.log('Postgres Timezone:', tz);
  console.log('Columns:', cols);
}

main().catch(console.error).finally(() => prisma.$disconnect());
