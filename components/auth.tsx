'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowUpRight, Layers, Eye, EyeOff, Mail, Lock, User, ArrowRight, BarChart3, Shield, Zap, TrendingUp } from 'lucide-react';

export default function Auth({ onSuccess, demo, onBack }: { onSuccess: () => void; demo: boolean; onBack?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const reset = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('reset') : null;
  const current = reset ? 'reset' : mode;

  useEffect(() => { setMounted(true); }, []);

  const features = [
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track MRR, churn, and growth metrics live' },
    { icon: Shield, title: 'Secure Billing', desc: 'Bank-grade encryption for all transactions' },
    { icon: Zap, title: 'Smart Automation', desc: 'Automated invoicing and payment recovery' },
    { icon: TrendingUp, title: 'Growth Insights', desc: 'Data-driven decisions for your business' },
  ];

  return (
    <div className={`auth-page-new ${mounted ? 'auth-mounted' : ''}`}>
      {/* Left Panel - Brand Story */}
      <div className="auth-brand-panel">
        <div className="auth-brand-top">
          <button className="landing-logo" style={{ color: '#fff' }} onClick={onBack} type="button">
            <span className="landing-logo-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Layers size={20} />
            </span>
            Brightloop
          </button>
          {onBack && (
            <button type="button" className="auth-back-link" onClick={onBack}>
              ← Back to website
            </button>
          )}
        </div>

        <div className="auth-brand-center">
          <div className="auth-brand-eyebrow">YOUR RECURRING BUSINESS, IN FOCUS</div>
          <h1 className="auth-brand-title">
            Good things<br />keep going.
          </h1>
          <p className="auth-brand-desc">
            Subscriptions, billing, and customer relationships.<br />
            One beautifully connected workspace.
          </p>

          <div className="auth-features-grid">
            {features.map((f, i) => (
              <div key={f.title} className="auth-feature-item" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                <span className="auth-feature-icon">
                  <f.icon size={18} />
                </span>
                <div>
                  <strong>{f.title}</strong>
                  <small>{f.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-brand-bottom">
          <small>Less admin. More momentum.</small>
        </div>

        {/* Decorative background elements */}
        <div className="auth-brand-deco">
          <div className="auth-deco-circle auth-deco-1" />
          <div className="auth-deco-circle auth-deco-2" />
          <div className="auth-deco-circle auth-deco-3" />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {onBack && (
            <button type="button" className="auth-mobile-back" onClick={onBack}>
              ← Back to website
            </button>
          )}
          <div className="auth-form-header">
            <span className="auth-welcome-badge">WELCOME TO BRIGHTLOOP</span>
            <h2 className="auth-form-title">
              {current === 'login' ? 'Welcome back.' : current === 'register' ? 'Your next chapter.' : 'A fresh start.'}
            </h2>
            <p className="auth-form-subtitle">
              {current === 'login'
                ? 'Sign in to see how your business is growing.'
                : current === 'register'
                ? 'Create your customer account to get started.'
                : 'Securely reset your account password.'}
            </p>
          </div>

          <form
            className="auth-form-fields"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              const b = Object.fromEntries(new FormData(e.currentTarget));
              try {
                if (current !== 'login') {
                  const r = await fetch(`/backend/auth/${current}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...b, token: reset }),
                  });
                  const d = await r.json();
                  if (!r.ok) throw Error(d.error);
                  if (current === 'forgot') { setError(d.message); return; }
                  if (current === 'reset') { window.location.href = '/'; return; }
                }
                const result = await signIn('credentials', { ...b, redirect: false });
                if (result?.error) throw Error('Incorrect email or password');
                onSuccess();
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {current === 'register' && (
              <div className="auth-input-group">
                <label htmlFor="auth-name">Full name</label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input id="auth-name" name="name" required autoComplete="name" placeholder="Enter your full name" />
                </div>
              </div>
            )}

            {current !== 'reset' && (
              <div className="auth-input-group">
                <label htmlFor="auth-email">Email address</label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
                </div>
              </div>
            )}

            {current !== 'forgot' && (
              <div className="auth-input-group">
                <label htmlFor="auth-password">Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={current === 'login' ? 'current-password' : 'new-password'}
                    minLength={current === 'login' ? 1 : 9}
                    placeholder={current === 'login' ? 'Enter your password' : 'Create a strong password'}
                  />
                  <button type="button" className="auth-toggle-pw" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {current === 'register' && (
                  <small className="auth-pw-hint">9+ characters, uppercase, lowercase and a special character.</small>
                )}
              </div>
            )}

            {current === 'login' && (
              <div className="auth-form-options">
                <label className="auth-remember">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <button type="button" className="auth-forgot-link" onClick={() => { setMode('forgot'); setError(''); }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p role="alert" className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              <span>
                {busy
                  ? 'One moment…'
                  : current === 'login'
                  ? 'Sign in'
                  : current === 'register'
                  ? 'Create account'
                  : current === 'forgot'
                  ? 'Send reset link'
                  : 'Reset password'}
              </span>
              <ArrowUpRight size={18} />
            </button>
          </form>

          <div className="auth-form-divider">
            <span>or</span>
          </div>

          <div className="auth-switch-links">
            <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>
              {mode === 'register' ? 'Already have an account? ' : 'New here? '}
              <strong>{mode === 'register' ? 'Sign in' : 'Create an account'}</strong>
            </button>
            {mode !== 'forgot' && mode !== 'register' && (
              <button onClick={() => { setMode('forgot'); setError(''); }}>
                Can't access your account? <strong>Reset password</strong>
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={() => { setMode('login'); setError(''); }}>
                Remember your password? <strong>Sign in</strong>
              </button>
            )}
          </div>

          {demo && (
            <button
              className="auth-demo-btn"
              onClick={async () => {
                setBusy(true);
                await signIn('credentials', { email: 'admin@brightloop.local', password: 'Brightloop!2026', redirect: false });
                onSuccess();
              }}
            >
              <Zap size={16} />
              Explore sample workspace
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
