import { NextResponse } from 'next/server';
import { sendNaydayWelcomeEmail } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, emails } = body;

    // Single send
    if (email && typeof email === 'string' && email.includes('@')) {
      const result = await sendNaydayWelcomeEmail(email);
      return NextResponse.json({
        success: result.success,
        result,
      });
    }

    // Batch send
    if (Array.isArray(emails) && emails.length > 0) {
      let sentCount = 0;
      const errors: string[] = [];

      for (const targetEmail of emails) {
        if (targetEmail && targetEmail.includes('@')) {
          try {
            const res = await sendNaydayWelcomeEmail(targetEmail);
            if (res.success) sentCount++;
          } catch (err: any) {
            errors.push(`${targetEmail}: ${err?.message || 'Erreur'}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        sentCount,
        totalRequested: emails.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json({ error: 'Adresse email ou liste d\'emails requise' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/newsletter/send:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l\'envoi de l\'email' },
      { status: 500 }
    );
  }
}
