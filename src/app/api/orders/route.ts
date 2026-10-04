import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { createAdminNotification } from '@/lib/notificationService';

/**
 * POST /api/orders — Create a new order.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      paymentMethod,
      items,
      subtotal,
      shippingCost,
      total,
      promoCode,
      discount,
      selectedFreeGift,
    } = body;

    // Basic validation
    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !shippingAddress ||
      !shippingCity ||
      !paymentMethod ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Moroccan Phone Validation
    const rawPhone = customerPhone.replace(/\s+/g, '');
    const phoneRegex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
    if (!phoneRegex.test(rawPhone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide. Veuillez entrer un numéro marocain valide (ex: 06XXXXXXXX ou +2126XXXXXXXX).' },
        { status: 400 }
      );
    }
    // Normalize to 06XXXXXXXX format for consistency if it starts with +212 or 00212
    let normalizedPhone = rawPhone;
    if (normalizedPhone.startsWith('+212')) {
      normalizedPhone = '0' + normalizedPhone.slice(4);
    } else if (normalizedPhone.startsWith('00212')) {
      normalizedPhone = '0' + normalizedPhone.slice(5);
    }

    // Generate order number: NF-<timestamp base36>-<random>
    const orderNumber = `NF-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 900 + 100
    )}`;

    // Check for Affiliate Cookie
    const cookieStore = await cookies();
    const affiliateRef = cookieStore.get('affiliate_ref')?.value;
    
    // Calculate Commission (fetch affiliate to check compensation model)
    let affiliate = null;
    let commission = 0;
    if (affiliateRef) {
      affiliate = await prisma.affiliate.findUnique({ where: { code: affiliateRef } });
      if (affiliate && affiliate.status === 'ACTIVE') {
        const type = affiliate.commissionType || 'PERCENTAGE';
        const orderTotal = Number(total);
        
        if (type === 'PERCENTAGE') {
          commission = (orderTotal * affiliate.commissionRate) / 100;
        } else if (type === 'FIXED_PER_ORDER') {
          commission = affiliate.fixedPerOrder;
        } else if (type === 'HYBRID') {
          commission = ((orderTotal * affiliate.commissionRate) / 100) + affiliate.fixedPerOrder;
        } else if (type === 'PAY_PER_VISIT' || type === 'PAY_PER_LEAD' || type === 'MONTHLY_RETAINER') {
          // In these models, sales still count to their track record, but order commissions are handled separately or in monthly retainer
          commission = 0;
        } else {
          commission = (orderTotal * affiliate.commissionRate) / 100;
        }
      }
    }

    // Stock validation & Fetch SKUs for items
    const itemsWithSKU = await Promise.all(
      items.map(async (item: any) => {
        try {
          if (!item.id) return item;
          const product = await prisma.product.findUnique({
            where: { id: Number(item.id) },
            select: { name: true, inStock: true, stock: true, sku: true },
          });

          if (product && (!product.inStock || product.stock <= 0)) {
            throw new Error(`RUPTURE_STOCK:${product.name}`);
          }

          return {
            ...item,
            sku: product?.sku || null,
          };
        } catch (err: any) {
          if (err?.message?.startsWith('RUPTURE_STOCK:')) {
            throw err;
          }
          return item;
        }
      })
    );

    // Append selected free sample if present
    const finalItemsWithSKU = [...itemsWithSKU];
    if (selectedFreeGift && selectedFreeGift.name) {
      finalItemsWithSKU.push({
        id: Number(selectedFreeGift.id) || 0,
        sku: 'GIFT-5ML',
        slug: selectedFreeGift.slug || '',
        name: `🎁 Échantillon Offert : ${selectedFreeGift.name}`,
        price: 0,
        image: selectedFreeGift.image || '',
        quantity: 1,
        size: '5ml',
      });
    }

    // ── Automatic Customer Creation & Linking ──────────────────────────────
    let customerId: string | null = null;
    const cleanEmail = customerEmail.trim().toLowerCase();

    try {
      // 1. Check if logged-in customer session exists
      const cookieStore = await cookies();
      const customerToken = cookieStore.get('customer_token')?.value;
      if (customerToken) {
        try {
          const JWT_SECRET = new TextEncoder().encode(
            process.env.JWT_SECRET || 'nouamane_super_secret_key_2024'
          );
          const { payload } = await jwtVerify(customerToken, JWT_SECRET);
          if (payload?.id) {
            const loggedInCustomer = await prisma.customer.findUnique({
              where: { id: payload.id as string }
            });
            if (loggedInCustomer) {
              customerId = loggedInCustomer.id;
            }
          }
        } catch {
          // Token invalid or expired, continue to lookup
        }
      }

      // 2. If not logged in, search existing customer by email or phone
      let targetCustomer = customerId 
        ? await prisma.customer.findUnique({ where: { id: customerId } })
        : await prisma.customer.findUnique({ where: { email: cleanEmail } });

      if (!targetCustomer && normalizedPhone) {
        targetCustomer = await prisma.customer.findFirst({
          where: { phone: normalizedPhone }
        });
      }

      if (targetCustomer) {
        customerId = targetCustomer.id;
        // Update contact & address if missing or newer
        await prisma.customer.update({
          where: { id: targetCustomer.id },
          data: {
            name: customerName.trim() || targetCustomer.name,
            phone: normalizedPhone || targetCustomer.phone,
            address: shippingAddress.trim() || targetCustomer.address,
            city: shippingCity.trim() || targetCustomer.city,
            postalCode: shippingPostalCode?.trim() || targetCustomer.postalCode,
          }
        });
      } else {
        // 3. New visitor/guest order: AUTOMATICALLY create real Customer record in DB!
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const newCustomer = await prisma.customer.create({
          data: {
            name: customerName.trim(),
            email: cleanEmail,
            phone: normalizedPhone,
            address: shippingAddress.trim(),
            city: shippingCity.trim(),
            postalCode: shippingPostalCode?.trim() || '',
            password: hashedPassword,
            tags: {
              create: [
                { tag: 'Commande Directe' }
              ]
            }
          }
        });
        customerId = newCustomer.id;
      }
    } catch (custError) {
      console.error('[Automatic Customer] Error creating or linking customer:', custError);
    }

    const created = await prisma.order.create({
      data: {
        orderNumber,
        customerName: customerName.trim(),
        customerEmail: cleanEmail,
        customerPhone: normalizedPhone,
        shippingAddress: shippingAddress.trim(),
        shippingCity: shippingCity.trim(),
        shippingPostalCode: shippingPostalCode || '',
        paymentMethod,
        items: JSON.stringify(finalItemsWithSKU),
        subtotal: Number(subtotal),
        shippingCost: Number(shippingCost),
        total: Number(total),
        promoCode: promoCode || null,
        discount: discount ? Number(discount) : null,
        status: 'pending',
        affiliateCode: affiliate ? affiliate.code : null,
        customerId: customerId || null,
      }
    });

    // Update Affiliate Stats
    if (affiliate) {
      await prisma.affiliate.update({
        where: { code: affiliate.code },
        data: {
          sales: { increment: 1 },
          revenueGenerated: { increment: Number(total) },
          commissionEarned: { increment: commission }
        }
      });
    }

    // Mark the live cart session as COMPLETED so it doesn't show in abandoned carts
    const sessionCookie = cookieStore.get('nouamaneSession')?.value || body.sessionId;
    if (sessionCookie) {
      await prisma.liveCartSession.updateMany({
        where: { sessionId: sessionCookie },
        data: { status: 'COMPLETED' }
      }).catch(() => {});
    }

    // Record Initial Order Timeline Event
    try {
      await prisma.orderTimelineEvent.create({
        data: {
          orderId: created.id,
          status: 'CREATED',
          title: 'Commande créée',
          description: `Commande #${created.orderNumber} enregistrée via la boutique en ligne`,
          actorName: `${created.customerName} (Client)`,
          actorRole: 'CLIENT',
        },
      });
    } catch (e) {
      console.error('Failed to create order timeline event:', e);
    }

    // Dispatch REAL admin notification for new order (Instant SSE Broadcast)
    try {
      await createAdminNotification({
        type: 'ORDER',
        title: `Nouvelle Commande #${created.orderNumber} (${created.total} DH)`,
        message: `Commande passée par ${created.customerName} (${created.shippingCity})`,
        link: '/admin/orders',
        metadata: { orderId: created.id, orderNumber: created.orderNumber, total: created.total, customerName: created.customerName, city: created.shippingCity },
      });
    } catch (e) {
      console.error('Failed to dispatch order notification:', e);
    }

    // Decrement stock for ordered items
    for (const item of items) {
      if (item.id) {
        try {
          const qty = Math.max(1, Number(item.quantity) || 1);
          const updatedProd = await prisma.product.update({
            where: { id: Number(item.id) },
            data: {
              stock: {
                decrement: qty,
              },
            },
            select: { id: true, name: true, stock: true },
          });

          if (updatedProd.stock <= 0) {
            await prisma.product.update({
              where: { id: updatedProd.id },
              data: { inStock: false },
            });
            await createAdminNotification({
              type: 'STOCK',
              title: `Rupture de Stock : ${updatedProd.name}`,
              message: `Le produit "${updatedProd.name}" est désormais épuisé (stock: ${updatedProd.stock}).`,
              link: '/admin/inventory',
              metadata: { productId: updatedProd.id, stock: updatedProd.stock },
            }).catch(() => {});
          }
        } catch (stockErr) {
          console.error('Failed to update product stock:', stockErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: created.orderNumber,
      id: created.id,
    });
  } catch (error: any) {
    if (error?.message?.startsWith('RUPTURE_STOCK:')) {
      const prodName = error.message.replace('RUPTURE_STOCK:', '');
      return NextResponse.json(
        { error: `Le produit "${prodName}" est actuellement en rupture de stock et ne peut plus être commandé.` },
        { status: 400 }
      );
    }
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
