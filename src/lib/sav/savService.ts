import prisma from '@/lib/prisma';
export * from './savConstants';

/**
 * Generate a unique sequential SAV ticket reference (e.g. SAV-2026-0001)
 */
export async function generateNextTicketNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  
  // Count existing tickets for this year
  const count = await prisma.claimTicket.count({
    where: {
      ticketNumber: {
        startsWith: `SAV-${currentYear}-`,
      },
    },
  });

  const nextSeq = (count + 1).toString().padStart(4, '0');
  const candidate = `SAV-${currentYear}-${nextSeq}`;

  // Double check collision
  const exists = await prisma.claimTicket.findUnique({ where: { ticketNumber: candidate } });
  if (exists) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `SAV-${currentYear}-${randomSuffix}`;
  }

  return candidate;
}

export const generateNextSavTicketNumber = generateNextTicketNumber;

