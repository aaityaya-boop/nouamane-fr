import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { logAdminActivity } from '@/lib/activityLogger';

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (admin) {
      await logAdminActivity({
        userId: admin.id,
        userName: admin.name,
        userEmail: admin.email,
        action: 'LOGOUT',
        entityType: 'AUTH',
        entityId: admin.id,
        description: `${admin.name} s'est déconnecté de NAY Workspace.`,
        req: request,
      });
    }
  } catch (err) {
    console.error('Error during logout logging:', err);
  }

  const response = NextResponse.json({ success: true, message: 'Déconnexion réussie.' });
  
  response.cookies.set({
    name: 'admin_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set({
    name: 'admin_session',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  
  return response;
}
