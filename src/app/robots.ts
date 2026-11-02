import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/*/checkout',
          '/*/account',
          '/*/invoice',
          '/*/order-confirmation',
          '/*/master-copier',
          '/*/prototype-concept-a',
          '/*/prototype-concept-b',
          '/*/prototype-concept-c'
        ],
      },
      // User-Facing Search Retrieval Crawlers (Allowed for search indexation & live user citations)
      {
        userAgent: [
          'OAI-SearchBot',   // OpenAI live web search crawler for ChatGPT Search citations
          'PerplexityBot',   // Perplexity AI live search engine crawler
        ],
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/*/checkout',
          '/*/account',
          '/*/invoice',
          '/*/order-confirmation',
          '/*/master-copier',
          '/*/prototype-concept-a',
          '/*/prototype-concept-b',
          '/*/prototype-concept-c'
        ],
      },
      // AI Foundation Model Training Scrapers (Explicitly disallowed from scraping catalog to train models)
      {
        userAgent: [
          'GPTBot',          // OpenAI model pre-training crawler
          'CCBot',           // Common Crawl data mining scraper
          'Google-Extended', // Google Gemini / Vertex foundation model training
        ],
        disallow: '/',
      }
    ],
    sitemap: 'https://nayparfum.ma/sitemap.xml',
    host: 'https://nayparfum.ma',
  };
}
