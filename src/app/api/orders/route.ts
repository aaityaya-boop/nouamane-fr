import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createAdminNotification } from '@/lib/notificationService';
import { createInvoiceToken } from '@/lib/orderAuth';
import { validateAndNormalizePhone } from '@/lib/phone';
import { verifyCustomerToken } from '@/lib/security/jwt';
import { checkRateLimit, getClientIp } from '@/lib/security/rateLimit';

/**
 * POST /api/orders — Create a new order.
 */
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit(`create_order:${clientIp}`, 12, 15 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Trop de commandes soumises récemment. Veuillez patienter quelques minutes.' },
        { status: 429 }
      );
    }

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
      promoCode,
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
      items.length === 0 ||
      items.length > 50
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Phone Validation and Normalization (Supports 06, 07, 05, +212, and International)
    const phoneResult = validateAndNormalizePhone(customerPhone);
    if (!phoneResult.isValid) {
      return NextResponse.json(
        { error: phoneResult.error || 'Numéro de téléphone invalide. Veuillez entrer un numéro marocain valide (ex: 06XXXXXXXX ou 07XXXXXXXX).' },
        { status: 400 }
      );
    }
    const normalizedPhone = phoneResult.normalized;

    // Generate cryptographically random order number: NF-<timestamp base36>-<random>
    const orderNumber = `NF-${Date.now().toString(36).toUpperCase()}-${crypto.randomInt(100, 1000)}`;

    // Verify customer session once up-front (used both for customer linking and promo validation)
    const cookieStore = await cookies();
    const customerToken = cookieStore.get('customer_token')?.value;
    let verifiedTokenPayload = customerToken ? await verifyCustomerToken(customerToken) : null;

    // Check if promoCode refers to an active LandingPage promo offer
    const cleanPromoInput = typeof promoCode === 'string' ? promoCode.trim() : '';
    const landingPageOffer =
      cleanPromoInput && !cleanPromoInput.startsWith('OFFRE:')
        ? await prisma.landingPage.findFirst({
            where: { slug: cleanPromoInput, status: 'active' },
          })
        : null;

    // Authoritative Stock Validation, SKU Resolution & Server-Side Price Verification
    let verifiedSubtotal = 0;
    const itemsWithSKU = await Promise.all(
      items.map(async (item: any) => {
        const qty = Math.max(1, Math.min(25, Math.floor(Number(item?.quantity) || 1)));

        if (landingPageOffer) {
          const allowedPrices: number[] = [];
          try {
            const rawCfg = JSON.parse(landingPageOffer.productSlugs || '{}');
            const bundles = Array.isArray(rawCfg?.bundles) ? rawCfg.bundles : [];
            for (const b of bundles) {
              if (b && Number(b.price) > 0) allowedPrices.push(Number(b.price));
            }
            const cfgProds = Array.isArray(rawCfg) ? rawCfg : (Array.isArray(rawCfg?.products) ? rawCfg.products : []);
            for (const p of cfgProds) {
              if (p && Number(p.promoPrice) > 0) allowedPrices.push(Number(p.promoPrice));
              if (p && p.slug) {
                const dbProd = await prisma.product.findUnique({
                  where: { slug: String(p.slug) },
                  select: { price: true },
                });
                if (dbProd && Number(dbProd.price) > 0) allowedPrices.push(Number(dbProd.price));
              }
            }
            const customProds = Array.isArray(rawCfg?.customProducts) ? rawCfg.customProducts : [];
            for (const cp of customProds) {
              if (cp && Number(cp.price) > 0) allowedPrices.push(Number(cp.price));
            }
          } catch {}
          const requestedPrice = Number(item?.price);
          const matchedLandingPrice =
            allowedPrices.find((p) => Math.abs(p - requestedPrice) < 0.01) ??
            (allowedPrices[0] || requestedPrice);
          if (!Number.isFinite(matchedLandingPrice) || matchedLandingPrice <= 0) {
            throw new Error('INVALID_PRICE');
          }
          verifiedSubtotal += matchedLandingPrice * qty;
          return {
            ...item,
            quantity: qty,
            price: matchedLandingPrice,
            sku: item?.sku || `LP-${landingPageOffer.slug}`,
          };
        }

        const numericId = Number(item?.id);
        const product = Number.isInteger(numericId) && numericId > 0
          ? await prisma.product.findUnique({
              where: { id: numericId },
              select: { id: true, name: true, price: true, sizes: true, inStock: true, stock: true, sku: true },
            })
          : item?.slug
          ? await prisma.product.findUnique({
              where: { slug: String(item.slug) },
              select: { id: true, name: true, price: true, sizes: true, inStock: true, stock: true, sku: true },
            })
          : null;

        if (!product) {
          throw new Error('PRODUCT_NOT_FOUND');
        }

        if (!product.inStock || product.stock <= 0) {
          throw new Error(`RUPTURE_STOCK:${product.name}`);
        }

        let unitPrice = Number(product.price);
        try {
          const parsedSizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
          if (Array.isArray(parsedSizes) && parsedSizes.length > 0 && item?.size) {
            const matchedSize = parsedSizes.find((s: any) => s?.label === item.size);
            if (matchedSize && typeof matchedSize.price === 'number' && matchedSize.price > 0) {
              unitPrice = Number(matchedSize.price);
            }
          }
        } catch {}

        verifiedSubtotal += unitPrice * qty;
        return {
          ...item,
          id: product.id,
          quantity: qty,
          price: unitPrice,
          sku: product.sku || null,
        };
      })
    );

    verifiedSubtotal = Math.round(verifiedSubtotal * 100) / 100;

    // Server-side Discount & Shipping Computation
    let verifiedDiscount = 0;
    let verifiedShippingCost = 35;

    try {
      const siteConfig = await prisma.siteConfig.findFirst({
        select: { shippingFee: true },
      });
      if (siteConfig && Number.isFinite(siteConfig.shippingFee) && siteConfig.shippingFee >= 0) {
        verifiedShippingCost = Number(siteConfig.shippingFee);
      }
    } catch {}

    if (landingPageOffer) {
      verifiedShippingCost = 0;
      verifiedDiscount = 0;
    } else if (cleanPromoInput.startsWith('OFFRE:')) {
      const offerTag = cleanPromoInput.slice('OFFRE:'.length).trim();
      const activeDeals = await prisma.specialDeal.findMany({
        where: { isActive: true },
      });
      const matchedDeal = activeDeals.find(
        (d: { badgeText: string | null; title: string }) =>
          (d.badgeText && d.badgeText.trim() === offerTag) || d.title.trim() === offerTag
      );
      if (matchedDeal) {
        if (matchedDeal.freeShipping) verifiedShippingCost = 0;
        const requestedDiscount = Math.max(0, Number(body.discount) || 0);
        const maxPossibleOfferDiscount =
          matchedDeal.discountPercent > 0
            ? (verifiedSubtotal * Math.min(100, matchedDeal.discountPercent)) / 100
            : matchedDeal.bundlePrice && matchedDeal.bundlePrice > 0 && verifiedSubtotal > matchedDeal.bundlePrice
            ? verifiedSubtotal - matchedDeal.bundlePrice
            : verifiedSubtotal;
        verifiedDiscount = Math.min(requestedDiscount, Math.round(maxPossibleOfferDiscount * 100) / 100, verifiedSubtotal);
      }
    } else if (cleanPromoInput) {
      const upperCode = cleanPromoInput.toUpperCase().replace(/\s+/g, '');
      const promo = await prisma.promoCode.findUnique({ where: { code: upperCode } });
      const nowDate = new Date();
      const totalQty = itemsWithSKU.reduce((sum, it) => sum + it.quantity, 0);
      const isValidPromo =
        promo &&
        promo.isActive &&
        (!promo.expiresAt || new Date(promo.expiresAt) >= nowDate) &&
        (!promo.maxUses || promo.usageCount < promo.maxUses) &&
        (!promo.requiresAccount || Boolean(verifiedTokenPayload)) &&
        (!promo.minOrderAmount || verifiedSubtotal >= promo.minOrderAmount) &&
        (!promo.minQuantity || totalQty >= promo.minQuantity);

      if (isValidPromo) {
        let eligibleSub = verifiedSubtotal;
        if (promo.applicableScope === 'SPECIFIC_PRODUCTS' && promo.productIds) {
          try {
            const ids = new Set<number>(JSON.parse(promo.productIds).map(Number));
            eligibleSub = itemsWithSKU
              .filter((it) => ids.has(Number(it.id)))
              .reduce((sum, it) => sum + it.price * it.quantity, 0);
          } catch {}
        }
        if (eligibleSub > 0) {
          if (promo.type === 'percentage') {
            verifiedDiscount = Math.round(((eligibleSub * Math.min(100, promo.value)) / 100) * 100) / 100;
          } else if (promo.type === 'fixed') {
            verifiedDiscount = Math.min(promo.value, eligibleSub);
          }
        }
      }
    }

    if (verifiedSubtotal >= 800) {
      verifiedShippingCost = 0;
    }

    const verifiedTotal = Math.max(
      0,
      Math.round((verifiedSubtotal - verifiedDiscount + verifiedShippingCost) * 100) / 100
    );

    // Check for Affiliate Cookie & compute commission using verified server total
    const affiliateRef = cookieStore.get('affiliate_ref')?.value;
    let affiliate = null;
    let commission = 0;
    if (affiliateRef) {
      affiliate = await prisma.affiliate.findUnique({ where: { code: affiliateRef } });
      if (affiliate && affiliate.status === 'ACTIVE') {
        const type = affiliate.commissionType || 'PERCENTAGE';
        const orderTotal = verifiedTotal;

        if (type === 'PERCENTAGE') {
          commission = (orderTotal * affiliate.commissionRate) / 100;
        } else if (type === 'FIXED_PER_ORDER') {
          commission = affiliate.fixedPerOrder;
        } else if (type === 'HYBRID') {
          commission = ((orderTotal * affiliate.commissionRate) / 100) + affiliate.fixedPerOrder;
        } else if (type === 'PAY_PER_VISIT' || type === 'PAY_PER_LEAD' || type === 'MONTHLY_RETAINER') {
          commission = 0;
        } else {
          commission = (orderTotal * affiliate.commissionRate) / 100;
        }
      }
    }

    // Append selected free sample if present AND no promo code is applied (offers are non-cumulative)
    const finalItemsWithSKU = [...itemsWithSKU];
    if (selectedFreeGift && selectedFreeGift.name && !promoCode) {
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
      // 1. Check if logged-in customer session exists (verifiedTokenPayload from earlier)
      if (verifiedTokenPayload?.id) {
        const loggedInCustomer = await prisma.customer.findUnique({
          where: { id: verifiedTokenPayload.id }
        });
        if (loggedInCustomer) {
          customerId = loggedInCustomer.id;
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
        subtotal: verifiedSubtotal,
        shippingCost: verifiedShippingCost,
        total: verifiedTotal,
        promoCode: promoCode || null,
        discount: verifiedDiscount > 0 ? verifiedDiscount : null,
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
          revenueGenerated: { increment: verifiedTotal },
          commissionEarned: { increment: commission }
        }
      });
    }

    // Update Promo Code Usage Count
    if (promoCode && !promoCode.startsWith('OFFRE:')) {
      await prisma.promoCode.update({
        where: { code: promoCode.trim().toUpperCase() },
        data: { usageCount: { increment: 1 } }
      }).catch(() => {});
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
    for (const item of itemsWithSKU) {
      if (item.id && Number.isInteger(Number(item.id))) {
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

    // Generate secure invoice access token for the customer
    const invoiceToken = await createInvoiceToken(created.orderNumber);

    const response = NextResponse.json({
      success: true,
      orderNumber: created.orderNumber,
      id: created.id,
      invoiceToken,
    });

    response.cookies.set(`order_access_${created.orderNumber}`, invoiceToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours (short-lived access)
    });

    return response;
  } catch (error: any) {
    if (error?.message === 'PRODUCT_NOT_FOUND' || error?.message === 'INVALID_PRICE') {
      return NextResponse.json(
        { error: 'Un ou plusieurs produits de votre panier sont introuvables ou invalides.' },
        { status: 400 }
      );
    }
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
