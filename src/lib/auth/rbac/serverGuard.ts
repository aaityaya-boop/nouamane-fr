import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin, AdminUserSafe } from '../adminAuth';
import { hasPermission, hasAnyPermission } from './accessControl';

export interface AdminGuardResult {
  user: AdminUserSafe | null;
  admin: AdminUserSafe | null;
  authorized: boolean;
  errorResponse: NextResponse | null;
  response: NextResponse | null;
}

function buildDeniedResult(res: NextResponse): AdminGuardResult {
  return {
    user: null,
    admin: null,
    authorized: false,
    errorResponse: res,
    response: res,
  };
}

function buildAllowedResult(user: AdminUserSafe): AdminGuardResult {
  return {
    user,
    admin: user,
    authorized: true,
    errorResponse: null,
    response: null,
  };
}

/**
 * Server Route Helper: Guard an API endpoint requiring any active authenticated admin
 */
export async function requireAdmin(
  req?: Request
): Promise<AdminGuardResult> {
  const user = await getAuthenticatedAdmin(req);

  if (!user) {
    return buildDeniedResult(
      NextResponse.json(
        { error: 'Session expirée ou utilisateur non connecté', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    );
  }

  if (user.status !== 'ACTIVE') {
    return buildDeniedResult(
      NextResponse.json(
        { error: 'Votre compte est désactivé. Veuillez contacter un administrateur.', code: 'DISABLED' },
        { status: 403 }
      )
    );
  }

  return buildAllowedResult(user);
}

/**
 * Server Route Helper: Guard an API endpoint with a required permission
 */
export async function requirePermission(
  req: Request | undefined,
  permissionKey: string
): Promise<AdminGuardResult> {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.authorized || !adminCheck.user) {
    return adminCheck;
  }

  if (!hasPermission(adminCheck.user, permissionKey)) {
    return buildDeniedResult(
      NextResponse.json(
        {
          error: 'Accès refusé. Privilèges insuffisants pour cette action.',
          code: 'FORBIDDEN',
          requiredPermission: permissionKey,
        },
        { status: 403 }
      )
    );
  }

  return adminCheck;
}

/**
 * Server Route Helper: Guard an API endpoint requiring at least one of the specified permissions
 */
export async function requireAnyPermission(
  req: Request | undefined,
  permissionKeys: string[]
): Promise<AdminGuardResult> {
  const adminCheck = await requireAdmin(req);
  if (!adminCheck.authorized || !adminCheck.user) {
    return adminCheck;
  }

  if (!hasAnyPermission(adminCheck.user, permissionKeys)) {
    return buildDeniedResult(
      NextResponse.json(
        {
          error: 'Accès refusé. Privilèges insuffisants pour cette action.',
          code: 'FORBIDDEN',
          requiredPermissions: permissionKeys,
        },
        { status: 403 }
      )
    );
  }

  return adminCheck;
}
