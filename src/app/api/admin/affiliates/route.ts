import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/affiliate-auth';
import { requirePermission, requireAnyPermission } from '@/lib/auth/rbac/serverGuard';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { errorResponse } = await requireAnyPermission(request, ['marketing.view', 'marketing.manage_affiliates']);
  if (errorResponse) return errorResponse;

  try {
    const affiliates = await prisma.affiliate.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            clicks: true,
            leadsList: true,
            payouts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sanitized = affiliates.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    return NextResponse.json({ error: 'Failed to fetch affiliates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requirePermission(request, 'marketing.manage_affiliates');
  if (errorResponse) return errorResponse;

  try {
    const data = await request.json();
    const {
      name,
      code,
      email,
      password,
      phone,
      instagram,
      tiktok,
      commissionType,
      commissionRate,
      fixedPerOrder,
      payPerVisit,
      payPerLead,
      monthlyRetainer,
      paymentMethod,
      bankName,
      bankAccountName,
      bankRib,
      cinNumber,
    } = data;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Le nom et le code VIP sont obligatoires.' },
        { status: 400 }
      );
    }

    const cleanCode = code.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    // Check if code or email already exists
    const existingCode = await prisma.affiliate.findUnique({
      where: { code: cleanCode },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: `Le code VIP "/vip/${cleanCode}" est déjà utilisé par un autre partenaire.` },
        { status: 400 }
      );
    }

    if (email) {
      const existingEmail = await prisma.affiliate.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: `L'adresse e-mail "${email}" est déjà associée à un compte ambassadeur.` },
          { status: 400 }
        );
      }
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (password && password.trim().length > 0) {
      passwordHash = await hashPassword(password.trim());
    }

    const newAffiliate = await prisma.affiliate.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        email: email ? email.toLowerCase().trim() : null,
        passwordHash,
        phone: phone ? phone.trim() : null,
        instagram: instagram ? instagram.trim().replace(/^@/, '') : null,
        tiktok: tiktok ? tiktok.trim().replace(/^@/, '') : null,
        status: 'ACTIVE',
        
        commissionType: commissionType || 'PERCENTAGE',
        commissionRate: Number(commissionRate) || 10,
        fixedPerOrder: Number(fixedPerOrder) || 0,
        payPerVisit: Number(payPerVisit) || 0,
        payPerLead: Number(payPerLead) || 0,
        monthlyRetainer: Number(monthlyRetainer) || 0,

        paymentMethod: paymentMethod || 'VIREMENT_BANCAIRE',
        bankName: bankName ? bankName.trim() : null,
        bankAccountName: bankAccountName ? bankAccountName.trim() : null,
        bankRib: bankRib ? bankRib.trim() : null,
        cinNumber: cinNumber ? cinNumber.trim() : null,
      },
    });

    return NextResponse.json({ success: true, affiliate: newAffiliate });
  } catch (error: any) {
    console.error('Error creating affiliate:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de l\'ambassadeur' },
      { status: 500 }
    );
  }
}
