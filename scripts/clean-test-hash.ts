import prisma from '../src/lib/prisma';

async function main() {
  await prisma.pageView.deleteMany({
    where: { visitor: { ipHash: 'test_hash_123' } }
  });
  await prisma.visitor.deleteMany({
    where: { ipHash: 'test_hash_123' }
  });
  console.log('Cleaned test hash');
}

main().catch(console.error).finally(() => prisma.$disconnect());
