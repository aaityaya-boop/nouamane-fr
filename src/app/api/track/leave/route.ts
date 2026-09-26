import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    let visitorId = '';
    try {
      const body = await req.json();
      visitorId = body?.visitorId || '';
    } catch {
      // Body might be text from sendBeacon
    }

    if (visitorId) {
      const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    '127.0.0.1';
      const hashKey = `${rawIp}_${visitorId}`;
      const ipHash = crypto.createHash('sha256').update(hashKey).digest('hex');

      // Set lastSeen to 10 minutes ago so the visitor is immediately dropped from the active online count
      await prisma.visitor.updateMany({
        where: { ipHash },
        data: {
          lastSeen: new Date(Date.now() - 10 * 60000)
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
