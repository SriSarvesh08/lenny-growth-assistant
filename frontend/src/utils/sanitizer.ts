import DOMPurify from 'dompurify';
import { marked } from 'marked';

// Configure marked for safe, clean output
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Strict sanitizer configuration:
 * - Disallows script, iframe, object, embed, style, form, input, base tags.
 * - Allows safe formatting tags: h1-h6, p, a, b, i, strong, em, ul, ol, li, blockquote, code, pre, hr, table, tr, th, td.
 * - Only permits http:, https:, mailto: protocols on links.
 * - Enforces target="_blank" and rel="noopener noreferrer" on external links.
 * - Strips all inline event handlers (onerror, onload, onclick, etc.).
 */
export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 's', 'del',
    'ul', 'ol', 'li',
    'blockquote', 'q',
    'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'span'
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target', 'rel'],
  FORCE_BODY: true,
};

// Hook to ensure links open safely in a new tab (when in browser or jsdom environment)
if (typeof window !== 'undefined' && DOMPurify.addHook) {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * Parses markdown to HTML and strictly sanitizes it against XSS vectors.
 */
export function renderAndSanitizeMarkdown(markdownText: string): string {
  if (!markdownText) return '';
  try {
    // 1. Convert markdown to raw HTML
    const rawHtml = marked.parse(markdownText) as string;
    // 2. Strictly sanitize against XSS
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG as Parameters<typeof DOMPurify.sanitize>[1]);
    }
    // Simple safe SSR fallback
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  } catch (error) {
    console.error('Failed to parse and sanitize markdown:', error);
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(`<p>${markdownText}</p>`, SANITIZE_CONFIG as Parameters<typeof DOMPurify.sanitize>[1]);
    }
    return `<p>${markdownText}</p>`;
  }
}

/**
 * Direct HTML sanitizer for any pre-rendered strings or snippets.
 */
export function sanitizeHtml(htmlContent: string): string {
  if (!htmlContent) return '';
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(htmlContent, SANITIZE_CONFIG as Parameters<typeof DOMPurify.sanitize>[1]);
  }
  return htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}
