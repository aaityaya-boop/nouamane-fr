import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import prisma from '@/lib/prisma';
import { getUserEffectivePermissions } from '@/lib/auth/rbac/accessControl';

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const roleUpper = (admin.role || '').toUpperCase();
    const isSuperUser = roleUpper === 'OWNER' || roleUpper === 'CO_OWNER' || roleUpper === 'SUPER_ADMIN';
    const effectivePermissions = isSuperUser ? [] : getUserEffectivePermissions(admin);

    const authorized = {
      orders: isSuperUser || effectivePermissions.includes('orders.view'),
      stock: isSuperUser || effectivePermissions.includes('inventory.view'),
      finance: isSuperUser || effectivePermissions.includes('finance.view_revenue'),
      security: isSuperUser || effectivePermissions.includes('team.view'),
      system: isSuperUser || effectivePermissions.includes('dashboard.view'),
    };

    let prefs = await prisma.adminNotificationPreference.findUnique({
      where: { userId: admin.id },
    });

    if (!prefs) {
      prefs = {
        id: '',
        userId: admin.id,
        orders: true,
        stock: true,
        finance: true,
        security: true,
        system: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      preferences: {
        orders: prefs.orders,
        stock: prefs.stock,
        finance: prefs.finance,
        security: prefs.security,
        system: prefs.system,
      },
      authorized,
    });
  } catch (error: any) {
    console.error('[Push Preferences GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const roleUpper = (admin.role || '').toUpperCase();
    const isSuperUser = roleUpper === 'OWNER' || roleUpper === 'CO_OWNER' || roleUpper === 'SUPER_ADMIN';
    const effectivePermissions = isSuperUser ? [] : getUserEffectivePermissions(admin);

    const authorized = {
      orders: isSuperUser || effectivePermissions.includes('orders.view'),
      stock: isSuperUser || effectivePermissions.includes('inventory.view'),
      finance: isSuperUser || effectivePermissions.includes('finance.view_revenue'),
      security: isSuperUser || effectivePermissions.includes('team.view'),
      system: isSuperUser || effectivePermissions.includes('dashboard.view'),
    };

    // Protect against enabling categories the user is not permitted to see
    const ordersVal = authorized.orders ? Boolean(body.orders ?? true) : false;
    const stockVal = authorized.stock ? Boolean(body.stock ?? true) : false;
    const financeVal = authorized.finance ? Boolean(body.finance ?? true) : false;
    const securityVal = authorized.security ? Boolean(body.security ?? true) : false;
    const systemVal = authorized.system ? Boolean(body.system ?? true) : false;

    const updated = await prisma.adminNotificationPreference.upsert({
      where: { userId: admin.id },
      update: {
        orders: ordersVal,
        stock: stockVal,
        finance: financeVal,
        security: securityVal,
        system: systemVal,
      },
      create: {
        userId: admin.id,
        orders: ordersVal,
        stock: stockVal,
        finance: financeVal,
        security: securityVal,
        system: systemVal,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Préférences enregistrées avec succès',
      preferences: {
        orders: updated.orders,
        stock: updated.stock,
        finance: updated.finance,
        security: updated.security,
        system: updated.system,
      },
      authorized,
    });
  } catch (error: any) {
    console.error('[Push Preferences PUT] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    );
  }
}
