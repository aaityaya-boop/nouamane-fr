import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';
import { getRoleDefinition } from '@/lib/auth/rbac/roles';
import { logAdminActivity } from '@/lib/activityLogger';

function getCurrentMonthMeta() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const monthNum = String(monthIdx + 1).padStart(2, '0');
  const monthKey = `${year}-${monthNum}`;
  const startOfMonth = new Date(year, monthIdx, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
  const rawLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const monthLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  return { monthKey, monthLabel, startOfMonth, endOfMonth };
}

// GET /api/admin/team/payroll - Monthly payroll ledger & Finance sync status
export async function GET(req: Request) {
  try {
    const { errorResponse } = await requirePermission(req, 'team.view');
    if (errorResponse) return errorResponse;

    const { monthKey, monthLabel, startOfMonth, endOfMonth } = getCurrentMonthMeta();

    const [activeMembers, salaryExpenses] = await Promise.all([
      prisma.adminUser.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          role: true,
          jobTitle: true,
          salary: true,
          salaryType: true,
        },
        orderBy: { salary: 'desc' },
      }),
      prisma.adminExpense.findMany({
        where: { category: 'SALARY' },
        orderBy: { date: 'desc' },
        take: 30,
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          description: true,
          paymentMethod: true,
          creatorName: true,
        },
      }),
    ]);

    const thisMonthExpenses = salaryExpenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return (
        (expDate >= startOfMonth && expDate <= endOfMonth) ||
        (exp.description || '').includes(`[PAYROLL:${monthKey}:`)
      );
    });

    const paidMemberIds: string[] = [];
    for (const member of activeMembers) {
      const marker = `[PAYROLL:${monthKey}:${member.id}]`;
      const isMarkedPaid = thisMonthExpenses.some(
        (exp) =>
          (exp.description || '').includes(marker) ||
          exp.title.toLowerCase().includes(member.name.toLowerCase())
      );
      if (isMarkedPaid) {
        paidMemberIds.push(member.id);
      }
    }

    const totalMonthlyPayrollMAD = activeMembers.reduce((sum, m) => sum + (m.salary || 0), 0);
    const paidThisMonthMAD = activeMembers
      .filter((m) => paidMemberIds.includes(m.id))
      .reduce((sum, m) => sum + (m.salary || 0), 0);
    const pendingThisMonthMAD = Math.max(0, totalMonthlyPayrollMAD - paidThisMonthMAD);

    return NextResponse.json({
      success: true,
      monthKey,
      monthLabel,
      totalMonthlyPayrollMAD,
      paidThisMonthMAD,
      pendingThisMonthMAD,
      paidMemberIds,
      recentExpenses: salaryExpenses.slice(0, 12),
    });
  } catch (error) {
    console.error('Error fetching payroll status:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la paie mensuelle' },
      { status: 500 }
    );
  }
}

// POST /api/admin/team/payroll - Record monthly salaries into AdminExpense (Finance)
export async function POST(req: Request) {
  try {
    const { user: currentAdmin, errorResponse } = await requirePermission(req, 'team.edit');
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const memberIds: string[] | undefined = Array.isArray(body.memberIds) ? body.memberIds : undefined;
    const paymentMethod: string = body.paymentMethod || 'BANK_TRANSFER';
    const notes: string = typeof body.notes === 'string' ? body.notes.trim() : '';

    const { monthKey, monthLabel, startOfMonth, endOfMonth } = getCurrentMonthMeta();

    const members = await prisma.adminUser.findMany({
      where: {
        status: 'ACTIVE',
        salary: { gt: 0 },
        ...(memberIds && memberIds.length > 0 ? { id: { in: memberIds } } : {}),
      },
      select: {
        id: true,
        name: true,
        role: true,
        jobTitle: true,
        salary: true,
        salaryType: true,
      },
    });

    if (members.length === 0) {
      return NextResponse.json(
        { error: 'Aucun collaborateur actif avec un salaire configuré (> 0 MAD) à verser.' },
        { status: 400 }
      );
    }

    const existingExpenses = await prisma.adminExpense.findMany({
      where: {
        category: 'SALARY',
        OR: [
          { date: { gte: startOfMonth, lte: endOfMonth } },
          { description: { contains: `[PAYROLL:${monthKey}:` } },
        ],
      },
      select: { title: true, description: true },
    });

    const toCreate = members.filter((m) => {
      const marker = `[PAYROLL:${monthKey}:${m.id}]`;
      return !existingExpenses.some(
        (exp) =>
          (exp.description || '').includes(marker) ||
          exp.title.toLowerCase().includes(m.name.toLowerCase())
      );
    });

    const skippedCount = members.length - toCreate.length;

    if (toCreate.length === 0) {
      return NextResponse.json({
        success: true,
        createdCount: 0,
        skippedCount,
        totalDisbursedMAD: 0,
        message: `Tous les salaires sélectionnés pour ${monthLabel} sont déjà comptabilisés dans Finance.`,
      });
    }

    const createdExpenses = await prisma.$transaction(
      toCreate.map((member) => {
        const roleDef = getRoleDefinition(member.role);
        const amount = member.salary || 0;
        const marker = `[PAYROLL:${monthKey}:${member.id}]`;
        return prisma.adminExpense.create({
          data: {
            title: `Salaire ${monthLabel} — ${member.name}`,
            category: 'SALARY',
            amount,
            date: new Date(),
            description: `${marker} Rémunération ${roleDef.name}${member.jobTitle ? ` (${member.jobTitle})` : ''}${notes ? ` • Note: ${notes}` : ''}`,
            paymentMethod,
            recurring: member.salaryType === 'MONTHLY' ? 'MONTHLY' : 'ONE_TIME',
            createdById: currentAdmin?.id || null,
            creatorName: currentAdmin?.name || 'Direction NAY',
          },
        });
      })
    );

    const totalDisbursedMAD = createdExpenses.reduce((sum, e) => sum + e.amount, 0);

    await logAdminActivity({
      req,
      userId: currentAdmin?.id,
      userName: currentAdmin?.name,
      userEmail: currentAdmin?.email,
      action: 'SYNC_PAYROLL_FINANCE',
      entityType: 'USER',
      entityId: monthKey,
      description: `Comptabilisation de ${createdExpenses.length} salaire(s) pour ${monthLabel} (${totalDisbursedMAD.toLocaleString('fr-FR')} MAD) vers Finance & Charges.`,
      newValue: { monthKey, createdCount: createdExpenses.length, totalDisbursedMAD, paymentMethod },
    });

    return NextResponse.json({
      success: true,
      createdCount: createdExpenses.length,
      skippedCount,
      totalDisbursedMAD,
      message: `${createdExpenses.length} salaire(s) (${totalDisbursedMAD.toLocaleString('fr-FR')} MAD) enregistrés dans Finance & Dépenses.`,
    });
  } catch (error) {
    console.error('Error syncing payroll to Finance:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation de la paie vers Finance' },
      { status: 500 }
    );
  }
}
