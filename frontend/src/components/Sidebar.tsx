'use client';

import React from 'react';
import { ChatSessionSummary, SystemHealth } from '@/types';

interface SidebarProps {
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  health: SystemHealth | null;
  onOpenShip30: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  health,
  onOpenShip30,
  isOpenMobile,
  onCloseMobile,
}) => {
  const isLocalReady = health?.llm_provider.local_ready;
  const activeProvider = health?.llm_provider.active_provider || 'local';

  return (
    <aside
      className={`sidebar-container ${isOpenMobile ? 'mobile-open' : ''}`}
      style={{
        width: '280px',
        height: '100%',
        background: 'rgba(12, 17, 29, 0.95)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            L
          </div>
          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              Lenny Assistant
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Growth & Product Advisor
            </p>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            style={{ color: '#94a3b8', fontSize: '1.2rem', padding: '4px' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={onNewSession}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
          }}
        >
          <span>＋</span>
          <span>New Chat Session</span>
        </button>

        <button
          onClick={onOpenShip30}
          style={{
            width: '100%',
            padding: '9px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            color: '#38bdf8',
            fontWeight: 600,
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>✍️</span>
          <span>Ship 30 Essay Skill</span>
        </button>
      </div>

      {/* Session History List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748b',
            letterSpacing: '0.05em',
            padding: '6px 8px',
          }}
        >
          Chat Sessions ({sessions.length})
        </div>

        {sessions.length === 0 ? (
          <div
            style={{
              padding: '16px 8px',
              fontSize: '0.8rem',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            No active sessions yet. Start a conversation!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sessions.map((s) => {
              const isActive = s.session_id === activeSessionId;
              const shortId = s.session_id.slice(0, 8);
              return (
                <button
                  key={s.session_id}
                  onClick={() => onSelectSession(s.session_id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(99, 102, 241, 0.4)'
                      : '1px solid transparent',
                    color: isActive ? '#f8fafc' : '#94a3b8',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💬</span>
                    <span>Session #{shortId}</span>
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 5px',
                      borderRadius: '4px',
                    }}
                  >
                    {s.message_count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 12, 20, 0.6)',
          fontSize: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#64748b' }}>Active Provider:</span>
          <span
            style={{
              fontWeight: 600,
              color: activeProvider === 'local' ? '#34d399' : '#818cf8',
              textTransform: 'uppercase',
            }}
          >
            {activeProvider}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#64748b' }}>Ollama Engine:</span>
          <span style={{ color: isLocalReady ? '#34d399' : '#f87171' }}>
            {isLocalReady ? '● Online (3B)' : '○ Standby'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>pgvector Index:</span>
          <span style={{ color: '#38bdf8' }}>768-dim RAG</span>
        </div>
      </div>
    </aside>
  );
};
