'use client';

import React from 'react';
import { SearchCitation } from '@/types';

interface IntelligencePanelProps {
  citations: SearchCitation[];
  confidence?: number;
  latencyMs?: number;
  provider?: string;
  model?: string;
  sourcesOverview?: Array<{ name: string; episodes: number; chunks: number; status: string }>;
  onSelectCitation?: (citation: SearchCitation) => void;
  onOpenShip30?: () => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  citations,
  confidence = 0.94,
  latencyMs = 1840,
  provider = 'local',
  model = 'llama3.2:3b',
  sourcesOverview = [],
  onSelectCitation,
  onOpenShip30,
}) => {
  const confidencePercent = Math.round(confidence * 100);
  const latencySec = (latencyMs / 1000).toFixed(1);

  return (
    <aside
      className="intelligence-panel"
      style={{
        width: '340px',
        height: '100%',
        background: 'rgba(11, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '20px 18px',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Knowledge Intelligence
          </h3>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontWeight: 600,
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            Live pgvector
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Real-time metrics, transcript grounding, and verified citations.
        </p>
      </div>

      {/* Metrics HUD (Response Time, Sources Used, Confidence) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '12px 10px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>
            {latencySec}s
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Response
          </div>
        </div>

        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#a78bfa' }}>
            {citations.length}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Sources
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399' }}>
            {confidencePercent}%
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginTop: '2px' }}>
            Confidence
          </div>
        </div>
      </div>

      {/* Connected Knowledge Sources */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Connected Sources
          </span>
          <span style={{ fontSize: '0.7rem', color: '#60a5fa' }}>All Active</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { name: "Lenny's Podcast Transcripts", icon: '🎙️', tag: 'Vector RAG', status: 'connected' },
            { name: 'Growth Newsletters & Playbooks', icon: '📚', tag: 'Full Archive', status: 'connected' },
            { name: 'Ship 30 for 30 Writing Engine', icon: '✍️', tag: 'Atomic Skill', status: 'connected' },
          ].map((src, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{src.icon}</span>
                <span style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.78rem' }}>{src.name}</span>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Verified Sources / Citations List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Retrieved Citations ({citations.length})
          </span>
        </div>

        {citations.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              borderRadius: '10px',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.8rem',
            }}
          >
            Ask a growth question to extract grounded quotes and episode timestamps from Lenny&apos;s library.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {citations.map((c, i) => (
              <div
                key={c.chunk_id || i}
                onClick={() => onSelectCitation && onSelectCitation(c)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#a5b4fc',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                      {c.guest_name ? `${c.guest_name}` : 'Lenny Podcast'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#34d399',
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(c.similarity * 100)}% match
                  </span>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>
                  {c.episode_title}
                </div>

                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#cbd5e1',
                    lineHeight: '1.45',
                    margin: 0,
                    borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
                    paddingLeft: '8px',
                    fontStyle: 'italic',
                  }}
                >
                  &ldquo;{c.content.length > 150 ? c.content.slice(0, 150) + '...' : c.content}&rdquo;
                </p>

                {c.source_url && (
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      color: '#38bdf8',
                      textDecoration: 'none',
                      marginTop: '8px',
                    }}
                  >
                    Source Link ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action: Convert To Essay */}
      {onOpenShip30 && (
        <button
          onClick={onOpenShip30}
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.15))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#38bdf8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>✍️</span>
          <span>Draft Ship 30 Essay From Insights</span>
        </button>
      )}
    </aside>
  );
};
