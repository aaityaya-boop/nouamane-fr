import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PUBLIC_SITE_CONFIG_SELECT = {
  id: true,
  shippingFee: true,
  contactPhone: true,
  contactEmail: true,
  heroTitle: true,
  heroSubtitle: true,
  instagramUrl: true,
  facebookUrl: true,
  tiktokUrl: true,
  whatsappUrl: true,
  featuredBestsellers: true,
  featuredSeasonal: true,
  featuredLatest: true,
  coffretsCoverImage: true,
  seasonalTrendTitle: true,
  seasonalTrendSubtitle: true,
  recommendedShop: true,
  recommendedMen: true,
  recommendedWomen: true,
  recommendedUnisex: true,
  recommendedOriental: true,
  recommendedMaster: true,
  recommendedCoffrets: true,
  recommendedTesters: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const config = await prisma.siteConfig.findFirst({
      select: PUBLIC_SITE_CONFIG_SELECT,
    });
    
    if (!config) {
      return NextResponse.json({});
    }

    // Explicit allowlist response — never expose credentials, SMTP, Resend keys, or internal goals
    const publicConfig = {
      id: config.id,
      shippingFee: config.shippingFee,
      contactPhone: config.contactPhone,
      contactEmail: config.contactEmail,
      heroTitle: config.heroTitle,
      heroSubtitle: config.heroSubtitle,
      instagramUrl: config.instagramUrl,
      facebookUrl: config.facebookUrl,
      tiktokUrl: config.tiktokUrl,
      whatsappUrl: config.whatsappUrl,
      featuredBestsellers: config.featuredBestsellers,
      featuredSeasonal: config.featuredSeasonal,
      featuredLatest: config.featuredLatest,
      coffretsCoverImage: config.coffretsCoverImage,
      seasonalTrendTitle: config.seasonalTrendTitle,
      seasonalTrendSubtitle: config.seasonalTrendSubtitle,
      recommendedShop: config.recommendedShop,
      recommendedMen: config.recommendedMen,
      recommendedWomen: config.recommendedWomen,
      recommendedUnisex: config.recommendedUnisex,
      recommendedOriental: config.recommendedOriental,
      recommendedMaster: config.recommendedMaster,
      recommendedCoffrets: config.recommendedCoffrets,
      recommendedTesters: config.recommendedTesters,
      updatedAt: config.updatedAt,
    };

    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
