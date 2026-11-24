import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, isValidAdminRole } from '@/lib/auth/adminAuth';
import { getUserEffectivePermissions, hasPermission } from '@/lib/auth/rbac/accessControl';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';
import { getRoleDefinition } from '@/lib/auth/rbac/roles';
import { logAdminActivity } from '@/lib/activityLogger';
import { sanitizePublicUrl } from '@/lib/security/sanitize';

// GET /api/admin/team - List team members
export async function GET(req: Request) {
  try {
    const { user, errorResponse } = await requirePermission(req, 'team.view');
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';
    const department = searchParams.get('department') || '';

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.adminUser.findMany({
      where,
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        status: true,
        salary: true,
        salaryType: true,
        avatar: true,
        customPermissions: true,
        lastLoginAt: true,
        lastActivityAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedTasks: true,
            createdTasks: true,
            activities: true,
          },
        },
      },
    });

    const now = new Date().getTime();

    // Enrich with computed metadata
    const enrichedMembers = members.map((member) => {
      const roleDef = getRoleDefinition(member.role);
      const effectivePermissions = getUserEffectivePermissions(member);
      
      // Online presence heuristic (active in last 3 minutes)
      const lastAct = member.lastActivityAt ? new Date(member.lastActivityAt).getTime() : 0;
      const isOnline = (now - lastAct) < 3 * 60 * 1000;

      return {
        ...member,
        roleDefinition: roleDef,
        effectivePermissionsCount: effectivePermissions.length,
        isOnline,
      };
    });

    // Optional department filter in memory
    const filtered = department
      ? enrichedMembers.filter((m) => m.roleDefinition.department === department)
      : enrichedMembers;

    // Summary statistics
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
    const disabledMembers = members.filter((m) => m.status === 'DISABLED').length;
    const onlineMembers = enrichedMembers.filter((m) => m.isOnline).length;
    const totalPayrollMAD = members
      .filter((m) => m.status === 'ACTIVE')
      .reduce((sum, m) => sum + (m.salary || 0), 0);

    return NextResponse.json({
      success: true,
      members: filtered,
      stats: {
        total: totalMembers,
        active: activeMembers,
        disabled: disabledMembers,
        online: onlineMembers,
        totalPayrollMAD,
      },
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des membres' },
      { status: 500 }
    );
  }
}

// POST /api/admin/team - Create a new team member
export async function POST(req: Request) {
  try {
    const { user: currentAdmin, errorResponse } = await requirePermission(req, 'team.create');
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { 
      name, 
      email, 
      password, 
      role = 'GUEST_VIEWER', 
      jobTitle, 
      phone, 
      salary = 0, 
      salaryType = 'MONTHLY',
      avatar, 
      customPermissions 
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nom, adresse email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailNormalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json(
        { error: 'Format d\'adresse email invalide' },
        { status: 400 }
      );
    }

    // Password strength check
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
    if (!isValidAdminRole(normalizedRole)) {
      return NextResponse.json(
        { error: 'Rôle administrateur invalide ou non autorisé' },
        { status: 400 }
      );
    }

    // Check email uniqueness (case-insensitive)
    const existing = await prisma.adminUser.findFirst({
      where: { email: { equals: emailNormalized, mode: 'insensitive' } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée par un autre collaborateur' },
        { status: 400 }
      );
    }

    // Privilege elevation check: Only Owners can create an OWNER/CO_OWNER/SUPER_ADMIN account
    const isOwner = currentAdmin?.role === 'OWNER' || currentAdmin?.role === 'CO_OWNER';
    if ((normalizedRole === 'OWNER' || normalizedRole === 'CO_OWNER' || normalizedRole === 'SUPER_ADMIN') && !isOwner) {
      return NextResponse.json(
        { error: 'Seuls les Propriétaires actuels peuvent créer un autre compte Propriétaire' },
        { status: 403 }
      );
    }

    // Prevent customPermissions privilege escalation when creating users
    let customPermsString: string | null = null;
    if (customPermissions !== undefined && customPermissions !== null) {
      if (!isOwner && !hasPermission(currentAdmin, 'team.manage_permissions')) {
        return NextResponse.json(
          { error: 'Permissions insuffisantes pour attribuer des permissions personnalisées.' },
          { status: 403 }
        );
      }
      if (typeof customPermissions === 'object') {
        customPermsString = JSON.stringify(customPermissions);
      }
    }

    const passwordHash = await hashPassword(password);
    const parsedSalary = typeof salary === 'number' && Number.isFinite(salary) ? salary : parseFloat(salary) || 0;
    const safeAvatar = avatar ? sanitizePublicUrl(avatar, 500) : null;

    const newMember = await prisma.adminUser.create({
      data: {
        name: name.trim().slice(0, 120),
        email: emailNormalized,
        passwordHash,
        role: normalizedRole,
        jobTitle: jobTitle ? String(jobTitle).trim().slice(0, 100) : null,
        phone: phone ? String(phone).trim().slice(0, 30) : null,
        salary: Math.max(0, parsedSalary),
        salaryType: salaryType || 'MONTHLY',
        avatar: safeAvatar,
        status: 'ACTIVE',
        customPermissions: customPermsString,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        phone: true,
        salary: true,
        salaryType: true,
        status: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Audit log
    await logAdminActivity({
      req,
      userId: currentAdmin?.id,
      userName: currentAdmin?.name,
      userEmail: currentAdmin?.email,
      action: 'CREATE_TEAM_MEMBER',
      entityType: 'USER',
      entityId: newMember.id,
      description: `Création du compte collaborateur pour "${newMember.name}" avec le rôle ${newMember.role} (Salaire: ${newMember.salary} MAD)`,
      newValue: { 
        name: newMember.name, 
        email: newMember.email, 
        role: newMember.role, 
        jobTitle: newMember.jobTitle,
        salary: newMember.salary,
        salaryType: newMember.salaryType,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Compte collaborateur créé avec succès',
        member: newMember,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    );
  }
}
