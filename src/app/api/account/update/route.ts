import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyCustomerToken } from '@/lib/security/jwt';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const payload = await verifyCustomerToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const customerId = payload.id as string;

    const body = await request.json();
    const { action } = body;

    if (action === 'updateInfo') {
      const { name, email, currentPassword, newPassword } = body;
      
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });

      // Verify current password if a new one is provided
      if (newPassword) {
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
          return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
        }
        if (!currentPassword) {
          return NextResponse.json({ error: 'Le mot de passe actuel est requis pour le modifier' }, { status: 400 });
        }
        const isMatch = await bcrypt.compare(currentPassword, customer.password);
        if (!isMatch) {
          return NextResponse.json({ error: 'Le mot de passe actuel est incorrect' }, { status: 400 });
        }
      }

      const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : customer.email;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 });
      }

      // Check if email is being changed and already used (case-insensitive)
      if (normalizedEmail !== customer.email.toLowerCase()) {
        const existingEmail = await prisma.customer.findFirst({
          where: { email: { equals: normalizedEmail, mode: 'insensitive' }, id: { not: customerId } },
          select: { id: true },
        });
        if (existingEmail) {
          return NextResponse.json({ error: 'Cette adresse email est déjà utilisée' }, { status: 400 });
        }
      }

      const updateData: Record<string, unknown> = {
        name: typeof name === 'string' && name.trim() ? name.trim() : customer.name,
        email: normalizedEmail,
      };
      
      if (newPassword) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(newPassword, salt);
      }

      await prisma.customer.update({
        where: { id: customerId },
        data: updateData
      });

      return NextResponse.json({ success: true, message: 'Informations mises à jour' });
    }

    if (action === 'updateAddress') {
      const { address, city, postalCode, phone } = body;
      await prisma.customer.update({
        where: { id: customerId },
        data: { address, city, postalCode, phone }
      });
      return NextResponse.json({ success: true, message: 'Adresse mise à jour' });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
