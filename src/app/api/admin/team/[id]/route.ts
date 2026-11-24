import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, isValidAdminRole } from '@/lib/auth/adminAuth';
import { getUserEffectivePermissions, canManageUser, parseCustomPermissions, hasPermission } from '@/lib/auth/rbac/accessControl';
import { requirePermission } from '@/lib/auth/rbac/serverGuard';
import { getRoleDefinition } from '@/lib/auth/rbac/roles';
import { logAdminActivity } from '@/lib/activityLogger';
import { sanitizePublicUrl } from '@/lib/security/sanitize';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/team/[id] - Member detail & computed permissions
export async function GET(req: Request, context: RouteContext) {
  try {
    const { user: currentAdmin, errorResponse } = await requirePermission(req, 'team.view');
    if (errorResponse) return errorResponse;

    const { id } = await context.params;

    const member = await prisma.adminUser.findUnique({
      where: { id },
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

    if (!member) {
      return NextResponse.json(
        { error: 'Collaborateur introuvable' },
        { status: 404 }
      );
    }

    const roleDef = getRoleDefinition(member.role);
    const effectivePermissions = getUserEffectivePermissions(member);
    const customOverrides = parseCustomPermissions(member.customPermissions);

    // Recent activities by this member
    const recentActivities = await prisma.adminActivityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      member: {
        ...member,
        roleDefinition: roleDef,
        effectivePermissions,
        customOverrides,
        recentActivities,
      },
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération du collaborateur' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/team/[id] - Update member, role, status or custom permissions
export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { user: currentAdmin, errorResponse } = await requirePermission(req, 'team.edit');
    if (errorResponse) return errorResponse;

    const { id } = await context.params;
    const body = await req.json();

    const targetUser = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Collaborateur introuvable' },
        { status: 404 }
      );
    }

    // Permission guard on target management
    const managementCheck = canManageUser(currentAdmin!, {
      id: targetUser.id,
      role: targetUser.role,
      status: body.status || targetUser.status,
    });

    if (!managementCheck.allowed) {
      return NextResponse.json(
        { error: managementCheck.reason || 'Action non autorisée' },
        { status: 403 }
      );
    }

    const isOwner = currentAdmin?.role === 'OWNER' || currentAdmin?.role === 'CO_OWNER';

    // Validate role string & reject elevation to OWNER/CO_OWNER/SUPER_ADMIN by non-Owners
    const requestedRole = typeof body.role === 'string' && body.role.trim() ? body.role.trim().toUpperCase() : null;
    if (requestedRole) {
      if (!isValidAdminRole(requestedRole)) {
        return NextResponse.json(
          { error: 'Rôle administrateur invalide ou non autorisé' },
          { status: 400 }
        );
      }
      if ((requestedRole === 'OWNER' || requestedRole === 'CO_OWNER' || requestedRole === 'SUPER_ADMIN') && !isOwner) {
        return NextResponse.json(
          { error: 'Seuls les Propriétaires actuels peuvent attribuer ce rôle' },
          { status: 403 }
        );
      }
    }

    // Prevent modifying permissions if caller does not have team.manage_permissions and is not owner
    if (body.customPermissions !== undefined && !isOwner && !hasPermission(currentAdmin, 'team.manage_permissions')) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas la permission de modifier les permissions directes' },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined && String(body.name).trim()) updateData.name = String(body.name).trim().slice(0, 120);
    if (requestedRole) updateData.role = requestedRole;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle ? String(body.jobTitle).trim().slice(0, 100) : null;
    if (body.phone !== undefined) updateData.phone = body.phone ? String(body.phone).trim().slice(0, 30) : null;
    if (body.salary !== undefined) {
      const sal = typeof body.salary === 'number' && Number.isFinite(body.salary) ? body.salary : parseFloat(body.salary) || 0;
      updateData.salary = Math.max(0, sal);
    }
    if (body.salaryType !== undefined) {
      updateData.salaryType = body.salaryType || 'MONTHLY';
    }
    if (body.avatar !== undefined) {
      updateData.avatar = body.avatar ? sanitizePublicUrl(body.avatar, 500) : null;
    }
    if (body.status !== undefined && (body.status === 'ACTIVE' || body.status === 'DISABLED')) {
      updateData.status = body.status;
    }

    // Handle password update if specified
    if (body.newPassword && typeof body.newPassword === 'string' && body.newPassword.trim()) {
      if (body.newPassword.trim().length < 8) {
        return NextResponse.json(
          { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(body.newPassword.trim());
    }

    // Handle custom permissions update
    if (body.customPermissions !== undefined) {
      if (body.customPermissions === null) {
        updateData.customPermissions = null;
      } else if (typeof body.customPermissions === 'object') {
        updateData.customPermissions = JSON.stringify(body.customPermissions);
      }
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
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
        customPermissions: true,
        updatedAt: true,
      },
    });

    // Audit log
    await logAdminActivity({
      req,
      userId: currentAdmin?.id,
      userName: currentAdmin?.name,
      userEmail: currentAdmin?.email,
      action: 'UPDATE_TEAM_MEMBER',
      entityType: 'USER',
      entityId: updated.id,
      description: `Mise à jour du profil collaborateur de "${updated.name}" (${updated.role})${updated.salary !== null ? ` - Salaire: ${updated.salary} MAD` : ''}`,
      oldValue: { role: targetUser.role, status: targetUser.status, jobTitle: targetUser.jobTitle, salary: targetUser.salary },
      newValue: { role: updated.role, status: updated.status, jobTitle: updated.jobTitle, salary: updated.salary },
    });

    return NextResponse.json({
      success: true,
      message: 'Collaborateur mis à jour avec succès',
      member: updated,
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/team/[id] - Permanent delete or soft-disable member
export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get('permanent') === 'true' || searchParams.get('action') === 'delete';

    const requiredPerm = isPermanent ? 'team.delete' : 'team.disable';
    const { user: currentAdmin, errorResponse } = await requirePermission(req, requiredPerm);
    if (errorResponse) return errorResponse;

    const { id } = await context.params;

    const targetUser = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Collaborateur introuvable' },
        { status: 404 }
      );
    }

    // Protection: Cannot delete an OWNER account
    if (targetUser.role === 'OWNER' || targetUser.role === 'CO_OWNER') {
      return NextResponse.json(
        { error: 'Les comptes Propriétaires (Owners) ne peuvent jamais être supprimés' },
        { status: 403 }
      );
    }

    if (currentAdmin?.id === targetUser.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 403 }
      );
    }

    // Permanent deletion
    if (isPermanent) {
      await prisma.adminUser.delete({
        where: { id },
      });

      await logAdminActivity({
        req,
        userId: currentAdmin?.id,
        userName: currentAdmin?.name,
        userEmail: currentAdmin?.email,
        action: 'DELETE_TEAM_MEMBER',
        entityType: 'USER',
        entityId: id,
        description: `Suppression définitive du compte collaborateur de "${targetUser.name}" (${targetUser.email}, Rôle: ${targetUser.role})`,
      });

      return NextResponse.json({
        success: true,
        message: `Le compte de ${targetUser.name} a été supprimé définitivement`,
      });
    }

    // Default to soft-disabling
    await prisma.adminUser.update({
      where: { id },
      data: { status: 'DISABLED' },
    });

    await logAdminActivity({
      req,
      userId: currentAdmin?.id,
      userName: currentAdmin?.name,
      userEmail: currentAdmin?.email,
      action: 'DISABLE_TEAM_MEMBER',
      entityType: 'USER',
      entityId: id,
      description: `Désactivation de l'accès pour le collaborateur "${targetUser.name}" (${targetUser.email})`,
    });

    return NextResponse.json({
      success: true,
      message: 'Compte collaborateur désactivé avec succès',
    });
  } catch (error) {
    console.error('Error in DELETE member:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
}
