import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api'],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'GoogleOther', 'anthropic-ai', 'ClaudeBot', 'PerplexityBot', 'Applebot-Extended', 'FacebookBot', 'Omgilibot', 'Omgili'],
        allow: '/',
        disallow: ['/admin', '/api'],
      }
    ],
    sitemap: 'https://nayparfum.ma/sitemap.xml',
  };
}
