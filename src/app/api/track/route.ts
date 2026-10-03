import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { pathname, referrer, userAgent, visitorId, type } = await req.json();
    
    // Parse device from userAgent
    let device = 'Desktop';
    if (userAgent) {
      if (/mobile/i.test(userAgent)) device = 'Mobile';
      else if (/ipad|tablet/i.test(userAgent)) device = 'Tablet';
    }

    // Clean up referrer
    let cleanReferrer = 'Direct';
    if (referrer) {
      try {
        const url = new URL(referrer);
        if (url.hostname.includes('google')) cleanReferrer = 'Google';
        else if (url.hostname.includes('instagram')) cleanReferrer = 'Instagram';
        else if (url.hostname.includes('facebook')) cleanReferrer = 'Facebook';
        else if (url.hostname.includes('tiktok')) cleanReferrer = 'TikTok';
        else if (url.hostname === 'localhost' || url.hostname.includes('nayparfum.ma')) cleanReferrer = 'Interne';
        else cleanReferrer = url.hostname;
      } catch (e) {
        cleanReferrer = 'Direct';
      }
    }

    // Get IP
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                  req.headers.get('x-real-ip') || 
                  '127.0.0.1';
    
    // Unique fingerprint: combine IP with client persistent visitor ID
    // This guarantees that multiple devices on the same Wi-Fi / NAT / localhost are accurately counted as distinct visitors
    const clientToken = visitorId || '';
    const hashKey = clientToken ? `${rawIp}_${clientToken}` : rawIp;
    const ipHash = crypto.createHash('sha256').update(hashKey).digest('hex');

    // Get Country/City using Vercel headers (silent and automatic, no prompt)
    let country = req.headers.get('x-vercel-ip-country') || 'MA';
    let city = req.headers.get('x-vercel-ip-city') || 'Inconnu';

    if (rawIp === '127.0.0.1' || rawIp === '::1') {
      country = 'MA';
      city = 'Casablanca';
    }

    // Decode URI component for city just in case Vercel encodes it
    try {
      if (city && city !== 'Inconnu') {
        city = decodeURIComponent(city);
      }
    } catch(e) {}

    // Fallback city formatting
    if (!city || city === 'Inconnu') {
      city = 'Maroc';
    }

    // Upsert Visitor using PostgreSQL NOW() for unified clock consistency
    const rawVisitors: any = await prisma.$queryRaw`
      INSERT INTO "Visitor" ("id", "ipHash", "city", "country", "createdAt", "lastSeen")
      VALUES (gen_random_uuid()::text, ${ipHash}, ${city}, ${country}, NOW(), NOW())
      ON CONFLICT ("ipHash") DO UPDATE
      SET "lastSeen" = NOW(),
          "city" = CASE WHEN EXCLUDED."city" NOT IN ('Inconnu', 'Maroc') THEN EXCLUDED."city" ELSE "Visitor"."city" END,
          "country" = CASE WHEN EXCLUDED."country" != 'Inconnu' THEN EXCLUDED."country" ELSE "Visitor"."country" END
      RETURNING *;
    `;
    const visitor = rawVisitors && rawVisitors[0] ? rawVisitors[0] : null;

    // Only record a new PageView row on actual page views (not lightweight heartbeats)
    if (type !== 'HEARTBEAT' && visitor?.id) {
      await prisma.$queryRaw`
        INSERT INTO "PageView" ("visitorId", "pathname", "referrer", "device", "createdAt")
        VALUES (${visitor.id}, ${pathname || '/'}, ${cleanReferrer}, ${device}, NOW())
      `;
    }

    return NextResponse.json({ success: true, visitorId: visitor?.id });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
