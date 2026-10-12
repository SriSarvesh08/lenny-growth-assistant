'use client';

import React from 'react';
import { AgentStep } from '@/types';

interface AgentTraceViewerProps {
  steps: AgentStep[];
  provider?: string;
  model?: string;
}

export const AgentTraceViewer: React.FC<AgentTraceViewerProps> = ({
  steps,
  provider,
  model,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div
      style={{
        margin: '10px 0',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.4)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          color: '#94a3b8',
          fontSize: '0.8rem',
          fontWeight: 500,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>⚙️</span>
          <span>
            Agent Execution Trace ({steps.length} {steps.length === 1 ? 'step' : 'steps'})
          </span>
          {provider && (
            <span
              style={{
                marginLeft: '6px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: provider === 'local' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: provider === 'local' ? '#34d399' : '#a5b4fc',
                fontSize: '0.72rem',
              }}
            >
              {provider}:{model}
            </span>
          )}
        </span>
        <span style={{ fontSize: '0.75rem' }}>{isExpanded ? '▲ Hide' : '▼ View Trace'}</span>
      </button>

      {isExpanded && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <ol style={{ listStyle: 'none', paddingLeft: 0 }}>
            {steps.map((step) => (
              <li
                key={step.step_number}
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '8px',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    fontSize: '0.7rem',
                    flexShrink: 0,
                  }}
                >
                  {step.step_number}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#cbd5e1', fontWeight: 500 }}>
                    {step.action}
                  </div>
                  {step.tool_name && (
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                      Tool: <code style={{ color: '#38bdf8' }}>{step.tool_name}</code>
                    </div>
                  )}
                  {step.observation && (
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        marginTop: '4px',
                      }}
                    >
                      {step.observation}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
