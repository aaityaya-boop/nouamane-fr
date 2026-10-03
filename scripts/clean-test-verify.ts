import prisma from '../src/lib/prisma';

async function main() {
  await prisma.pageView.deleteMany({
    where: { visitor: { id: '9a3058e0-d6bc-4ba2-8840-d463f6117f4d' } }
  });
  await prisma.visitor.deleteMany({
    where: { id: '9a3058e0-d6bc-4ba2-8840-d463f6117f4d' }
  });
  console.log('Cleaned test visitor');
}

main().catch(console.error).finally(() => prisma.$disconnect());
