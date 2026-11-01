import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/checkout/buy-now
 * Authoritative, server-side validation and item resolution for isolated "Acheter maintenant" flow.
 * Never trusts prices, totals, or stock from URL query parameters or client-side state.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const rawQty = searchParams.get('qty');
    const requestedSize = searchParams.get('size');

    // 1. Validate slug parameter
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return NextResponse.json(
        { error: 'INVALID_SLUG', message: 'Identifiant produit manquant ou invalide.' },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim();

    // 2. Fetch authoritative product from database
    const product = await prisma.product.findFirst({
      where: {
        slug: cleanSlug,
        published: true,
      },
      select: {
        id: true,
        sku: true,
        slug: true,
        name: true,
        price: true,
        sizes: true,
        images: true,
        inStock: true,
        stock: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Ce produit est introuvable ou n\'est plus disponible.' },
        { status: 404 }
      );
    }

    // 3. Strict Stock & Availability Validation
    const isInStock = (product.inStock ?? true) && (product.stock === null || product.stock > 0);
    if (!isInStock) {
      return NextResponse.json(
        {
          error: 'OUT_OF_STOCK',
          message: `Le parfum "${product.name}" est actuellement en rupture de stock.`,
          name: product.name,
        },
        { status: 400 }
      );
    }

    // 4. Validate and Sanitize Quantity
    const parsedQty = parseInt(rawQty || '1', 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        { error: 'INVALID_QUANTITY', message: 'Quantité invalide spécifiée.' },
        { status: 400 }
      );
    }

    // Maximum cap: cannot exceed available stock or sensible limit of 10
    const availableStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 10;
    const validatedQty = Math.min(parsedQty, availableStock, 10);

    // 5. Validate Size Variant & Determine Authoritative Price
    let selectedPrice = Number(product.price);
    let finalSize = 'Standard';

    try {
      const parsedSizes = JSON.parse(product.sizes || '[]');
      if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
        if (requestedSize) {
          const matchedSize = parsedSizes.find((s: any) => s.label === requestedSize);
          if (matchedSize) {
            finalSize = matchedSize.label;
            if (typeof matchedSize.price === 'number' && matchedSize.price > 0) {
              selectedPrice = Number(matchedSize.price);
            }
          } else {
            // Fallback to first available size
            finalSize = parsedSizes[0].label || 'Standard';
            if (typeof parsedSizes[0].price === 'number' && parsedSizes[0].price > 0) {
              selectedPrice = Number(parsedSizes[0].price);
            }
          }
        } else {
          finalSize = parsedSizes[0].label || 'Standard';
          if (typeof parsedSizes[0].price === 'number' && parsedSizes[0].price > 0) {
            selectedPrice = Number(parsedSizes[0].price);
          }
        }
      } else if (requestedSize) {
        finalSize = requestedSize;
      }
    } catch {
      // In case sizes JSON parsing fails, use standard size and base product price
      finalSize = requestedSize || 'Standard';
    }

    // 6. Resolve Primary Product Image
    let image = '';
    try {
      const parsedImages = JSON.parse(product.images || '[]');
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        image = parsedImages[0];
      }
    } catch {
      image = '';
    }

    // 7. Authoritative Pricing & Shipping Calculations
    const subtotal = Math.round(selectedPrice * validatedQty * 100) / 100;
    // Standard rule: Orders >= 800 MAD qualify for Free Shipping; otherwise standard 35 MAD
    const shipping = subtotal >= 800 ? 0 : 35;
    const total = subtotal + shipping;

    const response = NextResponse.json({
      success: true,
      item: {
        id: product.id,
        sku: product.sku || null,
        slug: product.slug,
        name: product.name,
        price: selectedPrice,
        image,
        quantity: validatedQty,
        size: finalSize,
      },
      subtotal,
      shipping,
      total,
    });

    response.headers.set('Cache-Control', 'no-store, private');
    return response;
  } catch (error: any) {
    console.error('[API /api/checkout/buy-now] Error resolving direct buy product:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Erreur lors de la validation du produit.' },
      { status: 500 }
    );
  }
}
