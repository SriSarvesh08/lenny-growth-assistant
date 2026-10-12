'use client';

import React, { useMemo, useState } from 'react';
import { renderAndSanitizeMarkdown } from '@/utils/sanitizer';

interface SecureArtifactViewerProps {
  title?: string;
  markdownContent: string;
  type?: string;
  wordCount?: number;
  initialSandboxMode?: boolean;
}

export const SecureArtifactViewer: React.FC<SecureArtifactViewerProps> = ({
  title = 'Artifact Preview',
  markdownContent,
  type = 'markdown',
  wordCount,
  initialSandboxMode = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [useIframeSandbox, setUseIframeSandbox] = useState(initialSandboxMode);

  // Render and strictly sanitize markdown
  const sanitizedHtml = useMemo(() => {
    return renderAndSanitizeMarkdown(markdownContent);
  }, [markdownContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy artifact content', err);
    }
  };

  // Safe srcDoc for sandboxed iframe without script execution
  const iframeDocument = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data: https:;" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #e2e8f0;
              background-color: #0b0f19;
              padding: 16px;
              line-height: 1.6;
              font-size: 14px;
            }
            h1, h2, h3 { color: #f8fafc; margin-top: 1em; }
            a { color: #38bdf8; text-decoration: underline; }
            blockquote { border-left: 3px solid #6366f1; padding-left: 10px; color: #94a3b8; font-style: italic; }
            code { background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
            pre { background: #06090e; padding: 12px; border-radius: 6px; overflow-x: auto; }
            hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 16px 0; }
          </style>
        </head>
        <body>
          ${sanitizedHtml}
        </body>
      </html>
    `;
  }, [sanitizedHtml]);

  return (
    <div
      className="secure-artifact-card"
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '12px',
        overflow: 'hidden',
        marginTop: '12px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Artifact Header Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(30, 41, 59, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.2)',
              color: '#a5b4fc',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {type}
          </span>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
          {wordCount !== undefined && (
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              • {wordCount} words
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setUseIframeSandbox((prev) => !prev)}
            title="Toggle between native DOMPurify sanitization and Sandboxed Iframe"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: useIframeSandbox ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: useIframeSandbox ? '#38bdf8' : '#94a3b8',
              fontSize: '0.75rem',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {useIframeSandbox ? '🛡️ Sandboxed Iframe' : '🔒 Native Sanitized'}
          </button>

          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: copied ? '#34d399' : '#cbd5e1',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy Markdown'}
          </button>
        </div>
      </div>

      {/* Artifact Content Area */}
      <div style={{ padding: '16px' }}>
        {useIframeSandbox ? (
          <iframe
            title={title}
            srcDoc={iframeDocument}
            sandbox="allow-same-origin"
            style={{
              width: '100%',
              minHeight: '280px',
              border: 'none',
              borderRadius: '8px',
              background: '#0b0f19',
            }}
          />
        ) : (
          <div
            className="artifact-body"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        )}
      </div>
    </div>
  );
};
