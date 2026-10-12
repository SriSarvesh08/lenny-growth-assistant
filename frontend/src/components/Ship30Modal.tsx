'use client';

import React, { useState } from 'react';
import { api } from '@/utils/api';
import { EssayResponse } from '@/types';
import { SecureArtifactViewer } from './SecureArtifactViewer';

interface Ship30ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoChat?: (essayMarkdown: string) => void;
}

export const Ship30Modal: React.FC<Ship30ModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoChat,
}) => {
  const [topic, setTopic] = useState('');
  const [framework, setFramework] = useState('atomic');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EssayResponse | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please provide a topic or core thesis.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.generateShip30Essay(topic, framework, context);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate essay');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ship30-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2
              id="ship30-modal-title"
              style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}
            >
              🚀 Ship 30 for 30 Atomic Essay Writer
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
              Transform growth ideas into concise 250–300 word punchy atomic essays.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              color: '#94a3b8',
              fontSize: '1.2rem',
              padding: '4px 8px',
              borderRadius: '6px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label
                htmlFor="essay-topic"
                style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}
              >
                Topic or Single Core Thesis *
              </label>
              <input
                id="essay-topic"
                type="text"
                placeholder="e.g. Why Free Trials Beat Freemium for B2B SaaS"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ width: '100%' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label
                  htmlFor="essay-framework"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}
                >
                  Essay Framework
                </label>
                <select
                  id="essay-framework"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <option value="atomic">Atomic (Problem → 3 Pillars → Nugget)</option>
                  <option value="listicle">Actionable Listicle (5 Rules)</option>
                  <option value="mistakes">Counterintuitive Mistakes</option>
                  <option value="framework">Mental Model Breakdown</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="essay-context"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}
                >
                  Optional Lenny Transcript Context
                </label>
                <input
                  id="essay-context"
                  type="text"
                  placeholder="e.g. Elena Verna on Product Led Growth loops"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              {isLoading ? '⏳ Generating Atomic Essay...' : '⚡ Generate Ship 30 Essay'}
            </button>
          </form>

          {/* Generated Result Preview */}
          {result && (
            <div style={{ marginTop: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
                  Artifact Generated ({result.word_count} words)
                </h3>
                {onInsertIntoChat && (
                  <button
                    onClick={() => {
                      onInsertIntoChat(result.markdown_content);
                      onClose();
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    💬 Insert into Chat
                  </button>
                )}
              </div>

              <SecureArtifactViewer
                title={result.headline}
                type="Ship 30 Essay"
                markdownContent={result.markdown_content}
                wordCount={result.word_count}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
