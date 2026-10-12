import { renderAndSanitizeMarkdown, sanitizeHtml } from '@/utils/sanitizer';

describe('Secure Artifact Sanitizer & Markdown Renderer', () => {
  test('renders standard markdown elements correctly', () => {
    const md = '# High-Growth Strategy\n\n**Bold claim** and *italic note*.';
    const html = renderAndSanitizeMarkdown(md);
    expect(html).toContain('<h1>High-Growth Strategy</h1>');
    expect(html).toContain('<strong>Bold claim</strong>');
    expect(html).toContain('<em>italic note</em>');
  });

  test('blocks script tag injection (XSS vector 1)', () => {
    const malicious = 'Normal text <script>alert("XSS")</script> more text';
    const html = renderAndSanitizeMarkdown(malicious);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('alert("XSS")');
  });

  test('strips inline event handler attributes like onerror and onload (XSS vector 2)', () => {
    const malicious = '<img src="invalid.jpg" onerror="alert(\'attack\')" />';
    const html = renderAndSanitizeMarkdown(malicious);
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('alert');
  });

  test('strips javascript: pseudo-protocol in URLs (XSS vector 3)', () => {
    const malicious = '[Click here](javascript:alert("pwned"))';
    const html = renderAndSanitizeMarkdown(malicious);
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('alert');
  });

  test('strips dangerous iframe or object embeddings', () => {
    const malicious = '<iframe src="http://evil.com"></iframe><object data="malware.swf"></object>';
    const html = renderAndSanitizeMarkdown(malicious);
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<object');
  });

  test('adds rel="noopener noreferrer" and target="_blank" to valid external links', () => {
    const md = '[Lenny Podcast](https://www.lennyspodcast.com)';
    const html = renderAndSanitizeMarkdown(md);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('href="https://www.lennyspodcast.com"');
  });

  test('sanitizes standalone raw HTML strings', () => {
    const raw = '<div onclick="hack()">Safe Text</div><script>bad()</script>';
    const clean = sanitizeHtml(raw);
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('Safe Text');
  });
});
