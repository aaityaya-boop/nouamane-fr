'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePreferences } from '@/context/PreferencesContext';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

export default function RecentlyViewed({ currentProductId }: { currentProductId?: number }) {
  const { recentlyViewed, isLoaded } = usePreferences();
  const [products, setProducts] = useState<any[]>([]);
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';

  useEffect(() => {
    if (!isLoaded || recentlyViewed.length === 0) return;

    // Filter out the current product from recently viewed
    const idsToFetch = recentlyViewed.filter(id => id !== currentProductId);

    if (idsToFetch.length === 0) {
      setProducts([]);
      return;
    }

    fetch(`/api/products/recent?ids=${idsToFetch.join(',')}`)
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          setProducts(data.products.slice(0, 4)); // Show up to 4 products
        }
      })
      .catch(console.error);
  }, [recentlyViewed, isLoaded, currentProductId]);

  if (!isLoaded || products.length === 0) return null;

  return (
    <div className="mt-20 border-t border-[#e0ddd4] pt-16">
      <h2 className="heading-font text-3xl text-center text-[#1A1A1A] mb-10 tracking-wide">
        {locale === 'ar' ? 'شوهدت مؤخراً' : locale === 'en' ? 'Recently Viewed' : 'Consultés Récemment'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          let imageUrl = '/placeholder.jpg';
          try {
            const parsed = JSON.parse(product.images);
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
          } catch (e) {}

          return (
            <Link 
              key={product.id} 
              href={`/${locale}/product/${product.slug}`}
              className="group bg-white rounded-xl overflow-hidden border border-[#e0ddd4] hover:border-[#0ea5e9] transition-all flex flex-col"
            >
              <div className="relative aspect-square p-6 bg-[#f8fafc] flex items-center justify-center">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
                />
              </div>
              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <div className="text-[10px] font-bold tracking-wider text-[#9A9A9A] uppercase mb-1">{product.brandLabel}</div>
                  <h3 className="text-[13px] font-medium text-[#1A1A1A] leading-snug line-clamp-2 mb-2 group-hover:text-[#0ea5e9] transition-colors">
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-[#1A1A1A] text-[14px]">
                    {product.price} MAD
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                    <ShoppingBag size={14} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
