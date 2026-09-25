import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let config = await prisma.siteConfig.findFirst();
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {}
      });
    }
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let config = await prisma.siteConfig.findFirst();
    
    if (!config) {
      config = await prisma.siteConfig.create({ data: {} });
    }

    const updatedConfig = await prisma.siteConfig.update({
      where: { id: config.id },
      data: {
        adminUsername: body.adminUsername !== undefined ? body.adminUsername : undefined,
        adminPassword: body.adminPassword !== undefined ? body.adminPassword : undefined,
        shippingFee: body.shippingFee !== undefined ? Number(body.shippingFee) : undefined,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone : undefined,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail : undefined,
        heroTitle: body.heroTitle !== undefined ? body.heroTitle : undefined,
        heroSubtitle: body.heroSubtitle !== undefined ? body.heroSubtitle : undefined,
        instagramUrl: body.instagramUrl !== undefined ? body.instagramUrl : undefined,
        facebookUrl: body.facebookUrl !== undefined ? body.facebookUrl : undefined,
        tiktokUrl: body.tiktokUrl !== undefined ? body.tiktokUrl : undefined,
        whatsappUrl: body.whatsappUrl !== undefined ? body.whatsappUrl : undefined,
        monthlyRevenueGoal: body.monthlyRevenueGoal !== undefined ? Number(body.monthlyRevenueGoal) : undefined,
        featuredBestsellers: body.featuredBestsellers !== undefined ? body.featuredBestsellers : undefined,
        featuredSeasonal: body.featuredSeasonal !== undefined ? body.featuredSeasonal : undefined,
        featuredLatest: body.featuredLatest !== undefined ? body.featuredLatest : undefined,
        coffretsCoverImage: body.coffretsCoverImage !== undefined ? body.coffretsCoverImage : undefined,
        seasonalTrendTitle: body.seasonalTrendTitle !== undefined ? body.seasonalTrendTitle : undefined,
        seasonalTrendSubtitle: body.seasonalTrendSubtitle !== undefined ? body.seasonalTrendSubtitle : undefined,
        recommendedShop: body.recommendedShop !== undefined ? body.recommendedShop : undefined,
        recommendedMen: body.recommendedMen !== undefined ? body.recommendedMen : undefined,
        recommendedWomen: body.recommendedWomen !== undefined ? body.recommendedWomen : undefined,
        recommendedUnisex: body.recommendedUnisex !== undefined ? body.recommendedUnisex : undefined,
        recommendedOriental: body.recommendedOriental !== undefined ? body.recommendedOriental : undefined,
        recommendedMaster: body.recommendedMaster !== undefined ? body.recommendedMaster : undefined,
        recommendedCoffrets: body.recommendedCoffrets !== undefined ? body.recommendedCoffrets : undefined,
      }
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
