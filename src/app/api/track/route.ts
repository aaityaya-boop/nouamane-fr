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

    // Upsert Visitor with accurate lastSeen timestamp
    const visitor = await prisma.visitor.upsert({
      where: { ipHash },
      update: { 
        lastSeen: new Date(),
        ...(city && city !== 'Inconnu' && city !== 'Maroc' ? { city } : {}),
        ...(country && country !== 'Inconnu' ? { country } : {})
      },
      create: {
        ipHash,
        country: country || 'MA',
        city: city || 'Casablanca',
        lastSeen: new Date(),
      }
    });

    // Only record a new PageView row on actual page views (not lightweight heartbeats)
    if (type !== 'HEARTBEAT') {
      await prisma.pageView.create({
        data: {
          visitorId: visitor.id,
          pathname: pathname || '/',
          referrer: cleanReferrer,
          device: device,
        }
      });
    }

    return NextResponse.json({ success: true, visitorId: visitor.id });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
