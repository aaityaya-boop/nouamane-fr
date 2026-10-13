import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Convert arrays/objects to JSON strings for SQLite
    const data: any = {};
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.sku !== undefined) data.sku = body.sku || null;
    if (body.name !== undefined) data.name = body.name;
    if (body.brand !== undefined) data.brandId = body.brand;
    if (body.brandLabel !== undefined || body.brand !== undefined) data.brandLabel = body.brandLabel || body.brand;
    if (body.gender !== undefined) data.gender = body.gender;
    if (body.subcategory !== undefined) data.subcategory = body.subcategory;
    if (body.subcategoryLabel !== undefined || body.subcategory !== undefined) data.subcategoryLabel = body.subcategoryLabel || body.subcategory;
    if (body.tagline !== undefined) data.tagline = body.tagline || '';
    if (body.description !== undefined) data.description = body.description || '';
    if (body.longDescription !== undefined) data.longDescription = body.longDescription || '';
    if (body.ingredients !== undefined) data.ingredients = body.ingredients || '';
    if (body.bottleColor !== undefined) data.bottleColor = body.bottleColor || 'transparent';
    if (body.bottleColorLabel !== undefined) data.bottleColorLabel = body.bottleColorLabel || 'Transparent';
    if (body.bottleMaterial !== undefined) data.bottleMaterial = body.bottleMaterial || 'glass';
    if (body.bottleMaterialLabel !== undefined) data.bottleMaterialLabel = body.bottleMaterialLabel || 'Verre';
    if (body.perfectSeason !== undefined) data.perfectSeason = body.perfectSeason || 'Toutes Saisons';
    if (body.images !== undefined) data.images = JSON.stringify(body.images || []);
    if (body.notes !== undefined) data.notes = JSON.stringify(body.notes || { top: [], heart: [], base: [] });
    if (body.sizes !== undefined) data.sizes = JSON.stringify(body.sizes || []);
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags || []);
    if (body.price !== undefined) data.price = parseFloat(body.price);
    if (body.originalPrice !== undefined) data.originalPrice = body.originalPrice ? parseFloat(body.originalPrice) : null;
    if (body.testerPrice !== undefined) data.testerPrice = body.testerPrice ? parseFloat(body.testerPrice) : null;
    if (body.rating !== undefined) data.rating = parseFloat(body.rating || 5);
    if (body.reviewCount !== undefined) data.reviewCount = parseInt(body.reviewCount || 0, 10);
    if (body.releaseDate !== undefined) data.releaseDate = body.releaseDate || new Date().toISOString();
    if (body.inStock !== undefined) {
      data.inStock = body.inStock;
      if (body.inStock === false) {
        data.stock = 0;
      }
    }
    if (body.isTester !== undefined) data.isTester = body.isTester;
    if (body.published !== undefined) data.published = body.published;

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data,
    });

    if (body.pendingSections) {
      const targetKeys: Array<{ key: 'tester' | 'original' | 'masterCopy'; section: 'tester' | 'original' | 'master-copier' }> = [
        { key: 'tester', section: 'tester' },
        { key: 'original', section: 'original' },
        { key: 'masterCopy', section: 'master-copier' },
      ];

      for (const { key, section } of targetKeys) {
        const draft = body.pendingSections[key];
        if (!draft || !draft.enabled) continue;

        let isTester = section === 'tester';
        let subcategory = updatedProduct.subcategory;
        let subcategoryLabel = updatedProduct.subcategoryLabel;
        let slugSuffix = section === 'tester' ? 'tester' : section === 'original' ? 'original' : 'master-copy';
        let price = typeof draft.price === 'number' && draft.price > 0 ? draft.price : updatedProduct.price;
        let stock = typeof draft.stock === 'number' ? draft.stock : 10;

        if (section === 'master-copier') {
          isTester = false;
          subcategory = 'master-copier';
          subcategoryLabel = 'Master Copy 1:1';
        } else if (section === 'original') {
          isTester = false;
          if (subcategory === 'master-copier' || subcategory === 'coffrets') {
            subcategory = 'floral';
            subcategoryLabel = 'Floral';
          }
        } else if (section === 'tester') {
          isTester = true;
          if (subcategory === 'master-copier' || subcategory === 'coffrets') {
            subcategory = 'floral';
            subcategoryLabel = 'Floral';
          }
        }

        const cleanBaseSlug = updatedProduct.slug
          .replace(/-(tester|original|master-copy|master-copier|coffret)(-\d+)?$/g, '')
          .replace(/-+$/, '');

        let candidateSlug = `${cleanBaseSlug}-${slugSuffix}`;
        let counter = 1;
        while (await prisma.product.findUnique({ where: { slug: candidateSlug } })) {
          candidateSlug = `${cleanBaseSlug}-${slugSuffix}-${counter}`;
          counter++;
        }

        const prefix = section === 'tester' ? 'TST' : section === 'original' ? 'ORI' : 'MST';
        const candidateSku = `NAY-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        await prisma.product.create({
          data: {
            slug: candidateSlug,
            sku: candidateSku,
            name: updatedProduct.name,
            brandId: updatedProduct.brandId,
            brandLabel: updatedProduct.brandLabel,
            gender: updatedProduct.gender,
            subcategory,
            subcategoryLabel,
            tagline: updatedProduct.tagline || '',
            description: updatedProduct.description || '',
            longDescription: updatedProduct.longDescription || '',
            ingredients: updatedProduct.ingredients || '',
            bottleColor: updatedProduct.bottleColor || 'transparent',
            bottleColorLabel: updatedProduct.bottleColorLabel || 'Transparent',
            bottleMaterial: updatedProduct.bottleMaterial || 'glass',
            bottleMaterialLabel: updatedProduct.bottleMaterialLabel || 'Verre',
            perfectSeason: updatedProduct.perfectSeason || 'Toutes Saisons',
            images: updatedProduct.images,
            notes: updatedProduct.notes,
            sizes: updatedProduct.sizes,
            tags: updatedProduct.tags,
            price,
            originalPrice: updatedProduct.originalPrice,
            testerPrice: section === 'tester' ? price : updatedProduct.testerPrice,
            rating: updatedProduct.rating || 5.0,
            reviewCount: updatedProduct.reviewCount || 0,
            releaseDate: new Date().toISOString(),
            inStock: stock > 0,
            stock,
            isTester,
            published: true,
          },
        }).catch((err) => console.error('Failed to auto-create section copy on PUT:', err));
      }
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    
    // First, find the product to get its slug
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete associated reviews first to avoid foreign key constraint error
    await prisma.review.deleteMany({
      where: { productSlug: product.slug },
    });
    
    // Now delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
