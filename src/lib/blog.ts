/**
 * Utility functions for NAY Parfum Luxury Editorial Blog
 */

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

/**
 * Generates URL-friendly slug from text
 */
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extracts H2 and H3 headings from article HTML and injects consistent anchor IDs.
 * Returns both the modified HTML content and the structured headings list.
 */
export function processArticleHtml(htmlContent: string): {
  processedHtml: string;
  headings: TocHeading[];
} {
  if (!htmlContent) return { processedHtml: '', headings: [] };

  const headings: TocHeading[] = [];
  const usedIds = new Map<string, number>();

  // Regex to match <h2> and <h3> tags and their content
  const headingRegex = /<h([23])([^>]*)>(.*?)<\/h\1>/gi;

  const processedHtml = htmlContent.replace(
    headingRegex,
    (match, levelStr, existingAttrs, innerContent) => {
      const level = parseInt(levelStr, 10);
      // Strip any nested HTML tags to get pure text for TOC
      const cleanText = innerContent.replace(/<[^>]+>/g, '').trim();
      if (!cleanText) return match;

      // Check if tag already has an id
      const idMatch = existingAttrs.match(/id=["']([^"']+)["']/i);
      let headingId = idMatch ? idMatch[1] : slugifyText(cleanText) || `section-${headings.length + 1}`;

      // Handle duplicate IDs
      if (usedIds.has(headingId)) {
        const count = (usedIds.get(headingId) || 1) + 1;
        usedIds.set(headingId, count);
        headingId = `${headingId}-${count}`;
      } else {
        usedIds.set(headingId, 1);
      }

      headings.push({
        id: headingId,
        text: cleanText,
        level
      });

      // If id attribute already exists, replace it, otherwise inject it
      let newAttrs = existingAttrs;
      if (idMatch) {
        newAttrs = existingAttrs.replace(/id=["'][^"']+["']/i, `id="${headingId}"`);
      } else {
        newAttrs = ` id="${headingId}"${existingAttrs}`;
      }

      // Add scroll-mt class for comfortable sticky header offset
      if (!newAttrs.includes('scroll-mt-')) {
        newAttrs = `${newAttrs} class="scroll-mt-28"`;
      }

      return `<h${level}${newAttrs}>${innerContent}</h${level}>`;
    }
  );

  return {
    processedHtml,
    headings
  };
}

/**
 * Calculates word count and reading time (minutes)
 */
export function calculateReadingTime(htmlContent: string): {
  wordCount: number;
  minutes: number;
} {
  if (!htmlContent) return { wordCount: 0, minutes: 1 };
  const plainText = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, minutes };
}

/**
 * Format date for luxury publication style
 */
export function formatPublicationDate(dateInput: string | Date, locale: string = 'fr'): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    if (locale === 'ar') {
      return d.toLocaleDateString('ar-MA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}
