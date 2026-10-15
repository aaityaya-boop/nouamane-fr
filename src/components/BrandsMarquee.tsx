'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Brand {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export default function BrandsMarquee({ brands }: { brands: Brand[] }) {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'fr';
  if (!brands || brands.length === 0) return null;

  // We duplicate the list to create a seamless infinite scrolling effect
  const marqueeItems = [...brands, ...brands, ...brands, ...brands];

  return (
    <section className="relative w-full py-16 lg:py-24 bg-white overflow-hidden border-t border-[#EAEAEA]">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } /* Half of the container to loop seamlessly */
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 80s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        `
      }} />

      <div className="max-w-[1400px] mx-auto px-6 mb-8 lg:mb-12 text-center">
        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9]">
          Nos Maisons Partenaires
        </span>
        <h2 className="heading-font text-3xl lg:text-4xl mt-2 tracking-wide text-[#1A1A1A]">
          Les Marques de Prestige
        </h2>
      </div>

      <div className="relative flex overflow-x-hidden w-full group">
        {/* Gradient Fades for edges */}
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-8 md:gap-16 px-4">
          {marqueeItems.map((brand, idx) => (
            <Link 
              key={`${brand.id}-${idx}`} 
              href={`/${locale}/brands/${brand.slug}`}
              className="flex-shrink-0 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500 opacity-60 hover:opacity-100 px-4 group/item"
            >
              {brand.image ? (
                <div className="relative w-40 h-20 md:w-56 md:h-28">
                  <Image 
                    src={brand.image} 
                    alt={brand.name} 
                    fill 
                    sizes="(max-width: 768px) 160px, 224px"
                    className="object-contain mix-blend-multiply" 
                  />
                </div>
              ) : (
                <div className="text-2xl md:text-4xl heading-font tracking-widest uppercase font-light text-[#1A1A1A]">
                  {brand.name}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
