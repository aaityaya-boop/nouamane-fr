import React from 'react';
import prisma from '@/lib/prisma';
import FinanceClient from './FinanceClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedAdmin } from '@/lib/auth/adminAuth';
import { hasPermission } from '@/lib/auth/rbac/accessControl';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const admin = await getAuthenticatedAdmin();
  if (!admin || !hasPermission(admin, 'finance.view_revenue')) {
    redirect('/admin');
  }

  // Fetch all orders
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      shippingCity: true,
      total: true,
      status: true,
      createdAt: true,
      shippingCost: true,
      discount: true,
      items: true,
    },
  });

  const serializedOrders = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  // Fetch all recorded operational expenses & charges
  const expenses = await prisma.adminExpense.findMany({
    orderBy: { date: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  const serializedExpenses = expenses.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  // Fetch active team members with their salaries
  const employees = await prisma.adminUser.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      role: true,
      jobTitle: true,
      salary: true,
      salaryType: true,
    },
  });

  // Fetch affiliates for influencer commission costs
  const affiliates = await prisma.affiliate.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      visits: true,
      sales: true,
      revenueGenerated: true,
      commissionEarned: true,
      commissionPaid: true,
    },
  });

  // Fetch visitors for conversion rate
  const visitors = await prisma.visitor.findMany({
    select: {
      id: true,
      createdAt: true,
    },
  });

  const serializedVisitors = visitors.map((v) => ({
    id: v.id,
    createdAt: v.createdAt.toISOString(),
  }));

  // Fetch product page views
  const productViews = await prisma.pageView.findMany({
    where: { pathname: { contains: '/product/' } },
    select: {
      pathname: true,
      createdAt: true,
    },
  });

  const viewsBySlug: Record<string, { total: number; dates: string[] }> = {};

  productViews.forEach((pv) => {
    const parts = pv.pathname.split('/product/');
    if (parts.length > 1) {
      const slug = parts[1].split('?')[0].split('#')[0];
      if (!viewsBySlug[slug]) {
        viewsBySlug[slug] = { total: 0, dates: [] };
      }
      viewsBySlug[slug].total += 1;
      viewsBySlug[slug].dates.push(pv.createdAt.toISOString());
    }
  });

  // Fetch products with tester prices and category info
  const products = await prisma.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      brandLabel: true,
      price: true,
      originalPrice: true,
      testerPrice: true,
      isTester: true,
      subcategory: true,
      subcategoryLabel: true,
      inStock: true,
      stock: true,
      images: true,
      sku: true,
    },
  });

  // Fetch customers count for CAC & LTV
  const customersCount = await prisma.customer.count();

  // Fetch monthly revenue goal from site config
  const siteConfig = await prisma.siteConfig.findFirst({
    select: { monthlyRevenueGoal: true },
  });
  const initialRevenueGoal = siteConfig?.monthlyRevenueGoal ?? 150000;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto text-neutral-900 space-y-6">
      <FinanceClient
        orders={serializedOrders}
        visitors={serializedVisitors}
        viewsBySlug={viewsBySlug}
        products={products as any}
        initialExpenses={serializedExpenses}
        employees={employees}
        affiliates={affiliates}
        customersCount={customersCount}
        initialGoal={initialRevenueGoal}
      />
    </div>
  );
}
