import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import prisma from '@/lib/prisma';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale || 'fr';
  return {
    title: 'Le Mag | Conseils & Tendances Parfums | NAY Parfums',
    description: "Plongez dans l'univers de la parfumerie au Maroc : guides, conseils, secrets de fabrication et tendances olfactives.",
    openGraph: {
      title: 'Le Mag | Conseils & Tendances Parfums | NAY Parfums',
      description: "Plongez dans l'univers de la parfumerie au Maroc : guides, conseils, secrets de fabrication et tendances olfactives.",
      url: `https://nayparfum.ma/${currentLocale}/blog`,
    },
    alternates: {
      canonical: `https://nayparfum.ma/${currentLocale}/blog`,
    },
  };
}

export default async function BlogListingPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' }
  });

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <Header />
      
      <main className="pt-32 lg:pt-40 pb-24">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 lg:mb-24">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#0ea5e9] mb-4 block">
              Journal & Découvertes
            </span>
            <h1 className="heading-font text-5xl lg:text-7xl mb-6">Le Mag</h1>
            <p className="text-[#6B6B6B] max-w-xl mx-auto">
              Plongez dans l'univers fascinant de la parfumerie. Découvrez nos conseils, les secrets de fabrication et les dernières tendances olfactives.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20 text-[#6B6B6B]">
              <p>De nouveaux articles arrivent très bientôt. Restez connectés !</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {posts.map((post) => (
                <Link href={`/blog/${post.slug}`} key={post.id} className="group flex flex-col h-full">
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mb-6">
                    <Image 
                      src={post.coverImage} 
                      alt={post.title} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#1A1A1A]">
                      {post.category || 'Général'}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9A9A9A] mb-3">
                      {new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <h2 className="heading-font text-2xl mb-3 group-hover:text-[#0ea5e9] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-[#6B6B6B] text-[14px] leading-relaxed mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-[#1A1A1A] group-hover:text-[#0ea5e9]">
                      Lire l'article <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
