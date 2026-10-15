import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        published: true
      },
      include: {
        brand: true
      }
    });

    const siteUrl = 'https://nayparfum.ma';

    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>NAY Parfum</title>
    <link>${siteUrl}</link>
    <description>NAY Parfums - Parfumerie de luxe et testeurs originaux au Maroc</description>
`;

    products.forEach((product) => {
      // Parse JSON images array properly to avoid percent-encoded brackets
      let mainImage = '';
      try {
        const parsed = JSON.parse(product.images);
        mainImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : '';
      } catch {
        mainImage = (product.images || '').split(',')[0].trim();
      }

      if (mainImage.startsWith('/')) {
        mainImage = `${siteUrl}${mainImage}`;
      }
      mainImage = encodeURI(mainImage);

      // Plain text description
      const description = (product.description || '').replace(/<[^>]*>?/gm, '').substring(0, 5000);

      // Condition and Availability
      const availability = product.inStock && product.stock > 0 ? 'in_stock' : 'out_of_stock';
      const id = product.sku || `REF-PRD-${product.id}`;

      xml += `    <item>
      <g:id>${id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link><![CDATA[${siteUrl}/fr/product/${product.slug}]]></g:link>
      <g:image_link><![CDATA[${mainImage}]]></g:image_link>
      <g:brand><![CDATA[${product.brandLabel}]]></g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${product.price}.00 MAD</g:price>
      <g:google_product_category>479</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
      <g:mpn><![CDATA[${id}]]></g:mpn>
      <g:shipping>
        <g:country>MA</g:country>
        <g:service>Livraison Express 24-48h</g:service>
        <g:price>35.00 MAD</g:price>
      </g:shipping>
    </item>
`;
    });

    xml += `  </channel>\n</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating Google feed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
