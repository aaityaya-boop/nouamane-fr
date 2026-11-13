import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export async function GET(request: Request) {
  try {
    const { errorResponse } = await requireAnyPermission(request, [
      'dashboard.view',
      'dashboard.view_financials',
      'finance.view_revenue',
    ]);
    if (errorResponse) return errorResponse;

    const config = await prisma.siteConfig.findFirst({
      select: { monthlyRevenueGoal: true },
    });
    return NextResponse.json({
      monthlyRevenueGoal: config?.monthlyRevenueGoal ?? 150000,
    });
  } catch (error) {
    console.error('Error fetching revenue goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user: admin, errorResponse } = await requireAnyPermission(request, [
      'finance.edit_expense',
      'dashboard.view_financials',
      'settings.edit',
    ]);
    if (errorResponse || !admin) return errorResponse!;
    const body = await request.json();
    const goal = Number(body.monthlyRevenueGoal);

    if (isNaN(goal) || goal < 0) {
      return NextResponse.json({ error: 'Montant d\'objectif invalide.' }, { status: 400 });
    }

    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({
        data: { monthlyRevenueGoal: goal },
      });
    } else {
      config = await prisma.siteConfig.update({
        where: { id: config.id },
        data: { monthlyRevenueGoal: goal },
      });
    }

    // Log admin activity if admin is logged in
    if (admin) {
      try {
        await prisma.adminActivityLog.create({
          data: {
            userId: admin.id,
            userName: admin.name,
            userEmail: admin.email,
            action: 'UPDATE_FINANCE_GOAL',
            entityType: 'SYSTEM',
            entityId: 'monthlyRevenueGoal',
            description: `Objectif mensuel de chiffre d'affaires mis à jour à ${goal.toLocaleString('fr-FR')} MAD`,
            newValue: String(goal),
          },
        });
      } catch (logErr) {
        console.warn('Could not record activity log:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      monthlyRevenueGoal: config.monthlyRevenueGoal,
      message: 'Objectif mensuel mis à jour avec succès.',
    });
  } catch (error) {
    console.error('Error updating revenue goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
