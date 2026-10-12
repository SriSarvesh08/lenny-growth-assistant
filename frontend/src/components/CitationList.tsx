'use client';

import React from 'react';
import { SearchCitation } from '@/types';

interface CitationListProps {
  citations: SearchCitation[];
}

export const CitationList: React.FC<CitationListProps> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        borderRadius: '10px',
        background: 'rgba(6, 182, 212, 0.04)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#38bdf8',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '8px',
        }}
      >
        <span>🎙️</span>
        <span>Verified Lenny Podcast Citations ({citations.length})</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {citations.map((c) => (
          <div
            key={c.chunk_id || c.source_url + c.chunk_index}
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.82rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '4px',
                marginBottom: '4px',
              }}
            >
              <a
                href={c.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#7dd3fc',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {c.episode_title} {c.guest_name ? `ft. ${c.guest_name}` : ''} ↗
              </a>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                Match: {Math.round(c.similarity * 100)}%
              </span>
            </div>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '0.78rem',
                lineHeight: '1.45',
                fontStyle: 'italic',
                borderLeft: '2px solid rgba(6, 182, 212, 0.4)',
                paddingLeft: '8px',
                margin: '4px 0',
              }}
            >
              &ldquo;{c.content.length > 200 ? c.content.slice(0, 200) + '...' : c.content}&rdquo;
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
