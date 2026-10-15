'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BrandMarquee({ brands }: { brands: any[] }) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  // Duplicate array to ensure seamless infinite scroll
  const scrollerBrands = [...brands, ...brands];

  return (
    <div className="w-full bg-white border-y border-[#e0ddd4] py-12 overflow-hidden flex flex-col items-center">
      <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#1A1A1A]/40 mb-8">
        Nos marques partenaires
      </div>
      
      <div className="relative w-full max-w-[1400px] mx-auto flex overflow-hidden group">
        <div className="flex w-max animate-marquee space-x-12 px-6 group-hover:[animation-play-state:paused]">
          {scrollerBrands.map((brand, i) => (
            <Link 
              href={`/${locale}/brands/${brand.slug}`} 
              key={`${brand.slug}-${i}`}
              className="relative w-32 h-16 md:w-40 md:h-20 flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 mix-blend-multiply"
            >
              <Image
                src={brand.image || `/images/brands/${brand.slug?.toLowerCase()}-logo.jpg`}
                alt={brand.name}
                fill
                sizes="(max-width: 768px) 128px, 160px"
                className="object-contain"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
