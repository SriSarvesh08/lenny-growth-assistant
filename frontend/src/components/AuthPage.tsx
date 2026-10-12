'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { api } from '@/utils/api';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Animated floating particles state
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 10,
      opacity: 0.1 + Math.random() * 0.2,
    }))
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Client-side validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register' && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'register') {
        const res = await api.register(email, password, fullName);
        setSuccessMsg('Account created successfully!');
        setTimeout(() => onAuthSuccess(res.user), 600);
      } else {
        const res = await api.login(email, password);
        setSuccessMsg('Welcome back!');
        setTimeout(() => onAuthSuccess(res.user), 600);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMounted) {
    return <div style={{ width: '100vw', height: '100vh', background: '#050810' }} />;
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 30% 20%, #0c1229 0%, #050810 50%, #020408 100%)',
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Animated Background Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.id % 3 === 0
              ? 'rgba(99, 102, 241, 0.6)'
              : p.id % 3 === 1
              ? 'rgba(6, 182, 212, 0.5)'
              : 'rgba(139, 92, 246, 0.5)',
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Glowing orbs */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          pointerEvents: 'none',
          animation: 'pulseOrb 8s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%)',
          bottom: '-80px',
          left: '-80px',
          pointerEvents: 'none',
          animation: 'pulseOrb 10s ease-in-out 2s infinite alternate',
        }}
      />

      {/* Main Auth Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          padding: '0 20px',
          zIndex: 2,
          animation: 'fadeSlideUp 0.7s ease-out',
        }}
      >
        {/* Logo / Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 14px',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)',
              animation: 'logoGlow 3s ease-in-out infinite alternate',
            }}
          >
            🎙️
          </div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#f8fafc',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Lenny Growth Assistant
          </h1>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#64748b',
              marginTop: '6px',
              lineHeight: '1.5',
            }}
          >
            AI-powered product & growth intelligence
          </p>
        </div>

        {/* Glass Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '28px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab);
                  setError(null);
                  setSuccessMsg(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '9px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background:
                    mode === tab
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
                      : 'transparent',
                  color: mode === tab ? '#ffffff' : '#94a3b8',
                  boxShadow:
                    mode === tab
                      ? '0 4px 16px rgba(99, 102, 241, 0.35)'
                      : 'none',
                }}
              >
                {tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '0.84rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'shakeError 0.4s ease-out',
              }}
            >
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                color: '#6ee7b7',
                fontSize: '0.84rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '1rem' }}>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit}>
            {/* Full Name (Register only) */}
            {mode === 'register' && (
              <div style={{ marginBottom: '18px', animation: 'fadeSlideUp 0.3s ease-out' }}>
                <label
                  htmlFor="auth-fullname"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#94a3b8',
                    marginBottom: '7px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '1rem',
                      color: '#475569',
                      pointerEvents: 'none',
                    }}
                  >
                    👤
                  </span>
                  <input
                    id="auth-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    autoComplete="name"
                    style={{
                      width: '100%',
                      padding: '13px 16px 13px 42px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '18px' }}>
              <label
                htmlFor="auth-email"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}
                >
                  ✉️
                </span>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  style={{
                    width: '100%',
                    padding: '13px 16px 13px 42px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="auth-password"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#94a3b8',
                  marginBottom: '7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    color: '#475569',
                    pointerEvents: 'none',
                  }}
                >
                  🔒
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  style={{
                    width: '100%',
                    padding: '13px 48px 13px 42px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    padding: '4px',
                    lineHeight: 1,
                  }}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password Strength Indicator (Register only) */}
              {mode === 'register' && password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    {[1, 2, 3, 4].map((level) => {
                      const strength =
                        password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
                          ? 4
                          : password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password))
                          ? 3
                          : password.length >= 6
                          ? 2
                          : 1;
                      const colors = ['#ef4444', '#f59e0b', '#22c55e', '#10b981'];
                      return (
                        <div
                          key={level}
                          style={{
                            flex: 1,
                            height: '3px',
                            borderRadius: '2px',
                            background:
                              level <= strength
                                ? colors[strength - 1]
                                : 'rgba(255, 255, 255, 0.08)',
                            transition: 'background 0.3s',
                          }}
                        />
                      );
                    })}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                    }}
                  >
                    {password.length < 6
                      ? 'Too short'
                      : password.length < 8
                      ? 'Acceptable'
                      : password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                      ? 'Strong'
                      : 'Good'}
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '12px',
                background: isSubmitting
                  ? 'rgba(99, 102, 241, 0.4)'
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSubmitting
                  ? 'none'
                  : '0 6px 24px rgba(99, 102, 241, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                letterSpacing: '0.01em',
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  <span>{mode === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                  <span style={{ fontSize: '1.1rem' }}>→</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '24px 0 20px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ fontSize: '0.76rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              or
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Switch Mode */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.86rem',
              color: '#94a3b8',
              margin: 0,
            }}
          >
            {mode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => {
                    setMode('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.86rem',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(129, 140, 248, 0.3)',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Sign up free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818cf8',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.86rem',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(129, 140, 248, 0.3)',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        {/* Powered By Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '28px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <span style={{ fontSize: '0.72rem', color: '#475569' }}>Powered by</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#94a3b8',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              pgvector RAG • Ollama • Agent SDK
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginTop: '14px',
            }}
          >
            {[
              { icon: '🔐', label: 'JWT Auth' },
              { icon: '🛡️', label: 'Encrypted' },
              { icon: '⚡', label: 'Real-time' },
            ].map((badge) => (
              <div
                key={badge.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: '#475569',
                }}
              >
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes floatParticle {
          0% { transform: translate(0, 0); }
          100% { transform: translate(30px, -40px); }
        }

        @keyframes pulseOrb {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.15); opacity: 0.8; }
        }

        @keyframes logoGlow {
          0% { box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2); }
          100% { box-shadow: 0 8px 48px rgba(99, 102, 241, 0.4); }
        }

        /* Input placeholder styles */
        input::placeholder {
          color: #475569 !important;
        }

        /* Button hover effect */
        button[type="submit"]:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.45) !important;
        }

        button[type="submit"]:not(:disabled):active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
