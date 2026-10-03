import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import prisma from '@/lib/prisma';
import { ArrowLeft, ArrowRight, Sparkles, Tag, ShoppingBag } from 'lucide-react';
import { PRODUCTS, formatMAD } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await prisma.blogPost.findUnique({ where: { slug: decodedSlug } });
  
  if (!post) return { title: 'Article non trouvé | NAY Parfums' };

  return {
    title: post.metaTitle || `${post.title} | NAY Parfums`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.coverImage ? [post.coverImage] : undefined,
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const post = await prisma.blogPost.findUnique({
    where: { slug: decodedSlug }
  });

  if (!post || post.status !== 'published') {
    notFound();
  }

  // Parse related products
  let relatedSlugs: string[] = [];
  try {
    if (post.relatedProductSlugs) {
      relatedSlugs = typeof post.relatedProductSlugs === 'string' && post.relatedProductSlugs.startsWith('[')
        ? JSON.parse(post.relatedProductSlugs)
        : [];
    }
  } catch (e) {}

  // First check database for related products, then fallback to static PRODUCTS
  let relatedProducts: any[] = [];
  if (relatedSlugs.length > 0) {
    const dbProds = await prisma.product.findMany({
      where: { slug: { in: relatedSlugs } }
    });

    if (dbProds.length > 0) {
      relatedProducts = dbProds.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brandLabel: p.brandLabel || p.brandId,
        price: p.price,
        originalPrice: p.originalPrice,
        images: typeof p.images === 'string' && p.images.startsWith('[') ? JSON.parse(p.images) : [p.images]
      }));
    } else {
      relatedProducts = PRODUCTS.filter(p => relatedSlugs.includes(p.slug));
    }
  }

  const isArabic = /[\u0600-\u06FF]/.test(post.title || post.content || '');

  const createMarkup = () => {
    return { __html: post.content };
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    image: post.coverImage ? (post.coverImage.startsWith('http') ? post.coverImage : `https://nayparfum.ma${post.coverImage}`) : undefined,
    author: {
      '@type': 'Organization',
      name: post.author || 'NAY Parfums',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NAY Parfums',
      logo: {
        '@type': 'ImageObject',
        url: 'https://nayparfum.ma/icon.png'
      }
    },
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(post.updatedAt).toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://nayparfum.ma/fr/blog/${post.slug}`
    }
  };

  return (
    <div className="bg-[#fafaf7] text-[#1A1A1A] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      
      <main className="pt-28 lg:pt-36 pb-24">
        <div className="max-w-[860px] mx-auto px-6">
          
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors mb-10"
          >
            <ArrowLeft size={14} /> Retour au Mag
          </Link>

          {/* ARTICLE HEADER */}
          <div className={`mb-12 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="bg-[#0ea5e9]/10 text-[#0ea5e9] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                {post.category || 'Guides'}
              </span>
              <span className="text-[11px] font-medium text-[#9A9A9A]">
                Par {post.author || 'NAY Parfums'} · {new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h1 className="heading-font text-3xl sm:text-4xl lg:text-5xl leading-[1.25] mb-6 text-[#1A1A1A]">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg sm:text-xl text-[#555] leading-relaxed font-light">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* COVER IMAGE */}
          {post.coverImage && (
            <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden mb-12 shadow-lg">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* ARTICLE HTML CONTENT */}
          <article 
            dir={isArabic ? 'rtl' : 'ltr'}
            className="prose prose-slate prose-lg max-w-none text-[#2d3748] prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-p:leading-relaxed prose-a:text-[#0ea5e9] prose-a:font-semibold hover:prose-a:underline prose-img:rounded-2xl prose-img:shadow-md mb-16"
            dangerouslySetInnerHTML={createMarkup()}
          />
          
          {/* POST TAGS */}
          {post.tags && post.tags !== '[]' && (
            <div className="flex flex-wrap items-center gap-2 mb-16 pt-6 border-t border-gray-200">
              <span className="text-xs text-gray-400 font-semibold mr-2 flex items-center gap-1">
                <Tag size={13} /> Tags :
              </span>
              {(typeof post.tags === 'string' && post.tags.startsWith('[') ? JSON.parse(post.tags) : post.tags.split(',')).map((tag: string, idx: number) => {
                const cleanTag = tag.trim().replace(/^#/, '');
                if (!cleanTag) return null;
                return (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    #{cleanTag}
                  </span>
                );
              })}
            </div>
          )}

          {/* CALL TO ACTION */}
          {post.ctaText && post.ctaLink && (
            <div className="bg-gradient-to-br from-[#0ea5e9]/10 via-[#0ea5e9]/5 to-transparent p-8 md:p-12 rounded-3xl border border-[#0ea5e9]/20 text-center mb-16 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#0ea5e9] mb-3">
                <Sparkles size={14} /> Sélection NAY Parfums
              </span>
              <h3 className="heading-font text-2xl md:text-3xl mb-3 text-slate-900">
                Prêt à trouver votre signature olfactive ?
              </h3>
              <p className="text-[#6B6B6B] text-sm md:text-base mb-8 max-w-[500px] mx-auto leading-relaxed">
                Explorez notre collection exclusive et profitez de parfums d'exception avec livraison express partout au Maroc.
              </p>
              <Link 
                href={post.ctaLink} 
                className="inline-flex items-center justify-center gap-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-4 rounded-full font-bold tracking-wide uppercase text-xs hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-[#0ea5e9]/25"
              >
                <span>{post.ctaText}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
          
        </div>

        {/* RELATED PRODUCTS (MARKETING CAROUSEL/GRID) */}
        {relatedProducts.length > 0 && (
          <div className="bg-white border-y border-gray-100 py-16 mt-12">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#0ea5e9] mb-2">
                  <ShoppingBag size={14} /> Sélection Recommandée
                </div>
                <h2 className="heading-font text-2xl lg:text-3xl">
                  Parfums mentionnés dans cet article
                </h2>
                <div className="w-12 h-0.5 bg-[#0ea5e9] mx-auto mt-3"></div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {relatedProducts.map((product) => {
                  const img = Array.isArray(product.images) ? product.images[0] : product.images;
                  return (
                    <Link 
                      href={`/shop/product/${product.slug}`} 
                      key={product.id || product.slug} 
                      className="group block bg-[#fafaf7] rounded-2xl p-5 hover:shadow-xl transition-all duration-300 border border-gray-100"
                    >
                      <div className="relative aspect-square w-full mb-4 rounded-xl overflow-hidden bg-white">
                        {img && (
                          <Image 
                            src={img} 
                            alt={product.name} 
                            fill 
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
                          />
                        )}
                      </div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-[#9A9A9A] mb-1">
                        {product.brandLabel}
                      </div>
                      <h3 className="heading-font text-base mb-3 group-hover:text-[#0ea5e9] transition-colors truncate">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-[#1A1A1A]">{formatMAD(product.price)}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-[#9A9A9A] line-through">{formatMAD(product.originalPrice)}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#0ea5e9] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Découvrir <ArrowRight size={13} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
