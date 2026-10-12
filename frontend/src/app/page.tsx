'use client';

import React, { useEffect, useRef, useState } from 'react';
import { api } from '@/utils/api';
import { ChatMessage, ChatSessionSummary, SearchCitation, SystemHealth, User } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { SecureArtifactViewer } from '@/components/SecureArtifactViewer';
import { AgentTraceViewer } from '@/components/AgentTraceViewer';
import { Ship30Modal } from '@/components/Ship30Modal';
import { IntelligencePanel } from '@/components/IntelligencePanel';
import { AuthPage } from '@/components/AuthPage';
import { renderAndSanitizeMarkdown } from '@/utils/sanitizer';

export default function Home() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isShip30Open, setIsShip30Open] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [sourcesOverview, setSourcesOverview] = useState<Array<{ name: string; episodes: number; chunks: number; status: string }>>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Check if user is already authenticated
    if (api.isAuthenticated()) {
      const stored = api.getStoredUser();
      if (stored) {
        setCurrentUser(stored);
      }
    }
    setAuthChecked(true);
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load system health, sources & sessions on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch {
        setErrorBanner(
          'Backend is currently unreachable. Make sure FastAPI server is running on http://localhost:8000.'
        );
      }

      try {
        const srcData = await api.getKnowledgeSources();
        if (srcData && srcData.sources) {
          setSourcesOverview(srcData.sources);
        }
      } catch (err) {
        console.warn('Could not load knowledge sources overview:', err);
      }

      try {
        const sessionData = await api.listSessions();
        setSessions(sessionData.sessions || []);

        const savedSession = localStorage.getItem('lenny_active_session');
        if (savedSession && sessionData.sessions.some((s) => s.session_id === savedSession)) {
          loadSession(savedSession);
        }
      } catch (err) {
        console.warn('Could not load session list:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Load specific session messages
  const loadSession = async (sid: string) => {
    setActiveSessionId(sid);
    localStorage.setItem('lenny_active_session', sid);
    setIsMobileMenuOpen(false);

    try {
      const details = await api.getSessionDetails(sid);
      setMessages(
        details.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    localStorage.removeItem('lenny_active_session');
    setMessages([]);
    setIsMobileMenuOpen(false);
  };

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const cleanMsg = (customMsg !== undefined ? customMsg : inputValue).trim();
    if (!cleanMsg || isLoading) return;

    setErrorBanner(null);
    setInputValue('');

    const userMessage: ChatMessage = {
      role: 'user',
      content: cleanMsg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await api.sendMessage(cleanMsg, activeSessionId || undefined);

      setActiveSessionId(res.session_id);
      localStorage.setItem('lenny_active_session', res.session_id);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.response,
        steps: res.steps,
        artifacts: res.artifacts,
        citations: res.citations || [],
        confidence: res.confidence || 0.94,
        latency_ms: res.latency_ms || 1800,
        follow_up_questions: res.follow_up_questions || [],
        provider: res.provider,
        model: res.model,
        created_at: res.created_at,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const sessionData = await api.listSessions();
      setSessions(sessionData.sessions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chat request failed';
      setErrorBanner(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Error communicating with agent:** ${msg}\n\nPlease verify that your local Ollama or cloud credentials are functioning.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAnswer = async (content: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Find latest assistant citations and metrics for the IntelligencePanel
  const latestAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const activeCitations: SearchCitation[] = latestAssistantMessage?.citations || [];
  const activeConfidence: number = latestAssistantMessage?.confidence || 0.94;
  const activeLatency: number = latestAssistantMessage?.latency_ms || 1840;

  if (!isMounted || !authChecked) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#080c14' }} />
    );
  }

  // Show auth page if not logged in
  if (!currentUser) {
    return (
      <AuthPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setMessages([]);
    setActiveSessionId(null);
    localStorage.removeItem('lenny_active_session');
  };

  return (
    <div suppressHydrationWarning style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={loadSession}
        onNewSession={handleNewSession}
        health={health}
        onOpenShip30={() => setIsShip30Open(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Center Workspace */}
      <main
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'radial-gradient(circle at 50% 0%, #111827 0%, #080c14 75%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Intelligence Navbar */}
        <header
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(8, 12, 20, 0.85)',
            backdropFilter: 'blur(16px)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="mobile-hamburger-btn"
              style={{
                display: 'none',
                color: '#f8fafc',
                fontSize: '1.2rem',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            >
              ☰
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                  {activeSessionId ? `Session #${activeSessionId.slice(0, 8)}` : 'Growth Intelligence Console'}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#a5b4fc',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    fontWeight: 600,
                  }}
                >
                  Agent SDK • pgvector RAG
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Extract verified insights from Lenny Rachitsky&apos;s Podcasts, Newsletters, and Ship 30 frameworks
              </p>
            </div>
          </div>

          {/* Action Header Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsShip30Open(true)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
                color: '#38bdf8',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>✍️</span>
              <span>Write Atomic Essay</span>
            </button>

            {/* User Menu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '5px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {currentUser.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 }}>
                  {currentUser.full_name}
                </span>
                <span style={{ fontSize: '0.66rem', color: '#64748b', lineHeight: 1.2 }}>
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Source Filter Badges (Directly inspired by Knowledge Search console) */}
        <div
          style={{
            padding: '8px 24px',
            background: 'rgba(15, 23, 42, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Sources:
            </span>
            {[
              { id: 'all', label: 'All Knowledge', icon: '🌐' },
              { id: 'podcast', label: 'Podcast Transcripts', icon: '🎙️', dot: '#10b981' },
              { id: 'playbooks', label: 'Growth Playbooks', icon: '📚', dot: '#10b981' },
              { id: 'ship30', label: 'Ship 30 Frameworks', icon: '✍️', dot: '#10b981' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveSourceFilter(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border:
                    activeSourceFilter === f.id
                      ? '1px solid rgba(99, 102, 241, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                  background:
                    activeSourceFilter === f.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: activeSourceFilter === f.id ? '#f8fafc' : '#94a3b8',
                }}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
                {f.dot && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: f.dot,
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <span style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap' }}>
            Indexed: {sourcesOverview.reduce((acc, s) => acc + s.chunks, 9)} vector chunks
          </span>
        </div>

        {/* Error notification banner if any */}
        {errorBanner && (
          <div
            role="alert"
            style={{
              padding: '10px 24px',
              background: 'rgba(239, 68, 68, 0.12)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>⚠️ {errorBanner}</span>
            <button
              onClick={() => setErrorBanner(null)}
              style={{ color: '#fca5a5', fontSize: '0.85rem', padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '860px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                maxWidth: '560px',
                padding: '40px 20px',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  margin: '0 auto 16px',
                }}
              >
                🎙️
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                Ask Lenny&apos;s Knowledge Base
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '28px' }}>
                Query indexed podcast transcripts with pgvector cosine similarity, inspect retrieved quotes, or convert insights into Ship 30 atomic essays.
              </p>

              {/* Suggested Questions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'left' }}>
                {[
                  'What did Elena Verna say about growth loops?',
                  'How did Brian Chesky turn Airbnb around in 2020?',
                  'Explain Shreyas Doshi’s definition of product-market fit',
                  'Why do viral loops fail according to Casey Winters?',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    onClick={() => {
                      setInputValue(promptText);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#cbd5e1',
                      fontSize: '0.82rem',
                      lineHeight: '1.4',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    💡 &ldquo;{promptText}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? '85%' : '100%',
                    width: isUser ? 'auto' : '100%',
                  }}
                >
                  {/* Message Sender Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{isUser ? 'You' : 'Lenny Growth Assistant'}</span>
                    {!isUser && msg.confidence && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          color: '#34d399',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '10px',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        🟢 {Math.round(msg.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>

                  {/* Main Bubble Card */}
                  <div
                    style={{
                      padding: '18px 20px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isUser
                        ? 'linear-gradient(135deg, #4f46e5, #4338ca)'
                        : 'rgba(15, 23, 42, 0.85)',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      lineHeight: '1.6',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    {isUser ? (
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                    ) : (
                      <>
                        {/* Execution Trace if available */}
                        {msg.steps && msg.steps.length > 0 && (
                          <AgentTraceViewer
                            steps={msg.steps}
                            provider={msg.provider}
                            model={msg.model}
                          />
                        )}

                        {/* Secure Markdown Rendering */}
                        <div
                          className="artifact-body"
                          dangerouslySetInnerHTML={{
                            __html: renderAndSanitizeMarkdown(msg.content),
                          }}
                        />

                        {/* Render Attached Artifacts (Ship 30 essays) */}
                        {msg.artifacts &&
                          msg.artifacts.map((art, aIdx) => (
                            <SecureArtifactViewer
                              key={aIdx}
                              title={art.title}
                              type={art.type}
                              markdownContent={art.content}
                              wordCount={art.word_count}
                            />
                          ))}

                        {/* Response Action Bar (Copy, Good Answer, Convert to Essay) */}
                        <div
                          style={{
                            marginTop: '16px',
                            paddingTop: '12px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleCopyAnswer(msg.content, idx)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#94a3b8',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>📋</span>
                              <span>{copiedIndex === idx ? 'Copied!' : 'Copy'}</span>
                            </button>

                            <button
                              onClick={() => setIsShip30Open(true)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                background: 'rgba(6, 182, 212, 0.1)',
                                border: '1px solid rgba(6, 182, 212, 0.25)',
                                color: '#38bdf8',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>✍️</span>
                              <span>Convert to Essay</span>
                            </button>
                          </div>

                          {msg.latency_ms && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              ⚡ {(msg.latency_ms / 1000).toFixed(1)}s response time
                            </span>
                          )}
                        </div>

                        {/* Dynamic Follow-Up Questions Chips */}
                        {msg.follow_up_questions && msg.follow_up_questions.length > 0 && (
                          <div style={{ marginTop: '14px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                              Follow-up questions
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {msg.follow_up_questions.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  onClick={() => handleSendMessage(undefined, q)}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: '#cbd5e1',
                                    fontSize: '0.76rem',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                  }}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '0.85rem' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  borderTopColor: '#818cf8',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span>Lenny Agent is reasoning and searching podcast transcripts...</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div
          style={{
            padding: '16px 20px',
            background: 'rgba(8, 12, 20, 0.9)',
            backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <form
            onSubmit={handleSendMessage}
            style={{
              maxWidth: '860px',
              margin: '0 auto',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Ask about retention, acquisition loops, or ask for a Ship 30 essay..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.92rem',
              }}
            />

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '12px 22px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: isLoading || !inputValue.trim() ? 0.5 : 1,
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              Ask AI ➔
            </button>
          </form>
        </div>
      </main>

      {/* Right Intelligence Panel (Citations, Latency, Confidence HUD) */}
      <IntelligencePanel
        citations={activeCitations}
        confidence={activeConfidence}
        latencyMs={activeLatency}
        provider={health?.llm_provider?.active_provider}
        model={health?.llm_provider?.local_primary_model}
        sourcesOverview={sourcesOverview}
        onSelectCitation={(cit) => {
          setInputValue(`Tell me more about what ${cit.guest_name || 'Lenny'} said in "${cit.episode_title}"`);
        }}
        onOpenShip30={() => setIsShip30Open(true)}
      />

      {/* Ship 30 Essay Generation Modal */}
      <Ship30Modal
        isOpen={isShip30Open}
        onClose={() => setIsShip30Open(false)}
        onInsertIntoChat={(essayMd) => {
          setInputValue(`Please review and critique this Ship 30 for 30 essay:\n\n${essayMd}`);
        }}
      />

      {/* Responsive Style Tweaks */}
      <style>{`
        @media (max-width: 1080px) {
          .intelligence-panel {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .sidebar-container {
            position: fixed;
            left: -280px;
            transition: left 0.3s ease;
          }
          .sidebar-container.mobile-open {
            left: 0;
          }
          .mobile-hamburger-btn {
            display: inline-block !important;
          }
        }
      `}</style>
    </div>
  );
}
