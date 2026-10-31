'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { HeroPanel, Logo, Pixels } from './bl-shared';

export default function Auth({ onSuccess, onBack }: { onSuccess: () => void | Promise<void>; onBack?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const reset = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('reset') : null;
  const current = reset ? 'reset' : mode;
  const showTabs = current === 'login' || current === 'register';

  const go = (m: 'login' | 'register' | 'forgot') => { setMode(m); setError(''); };

  const title = current === 'login' ? 'Welcome back' : current === 'register' ? 'Create your account' : current === 'forgot' ? 'Reset your password' : 'Choose a new password';
  const sub = current === 'login'
    ? 'Sign in to see how your business is growing.'
    : current === 'register'
    ? 'Start tracking subscriptions, billing and customers.'
    : current === 'forgot'
    ? 'Enter your email and we’ll send you a reset link.'
    : 'Set a new password for your account.';

  return (
    <div className="bl bl-auth">
      {/* Art panel */}
      <aside className="bl-auth-art">
        <Pixels items={[{ x: '84%', y: '30%', s: 14 }, { x: '8%', y: '44%', s: 10 }, { x: '60%', y: '56%', s: 8 }]} />
        <div className="bl-auth-top">
          <Logo light onClick={onBack} />
          {onBack && <button type="button" className="bl-auth-back" onClick={onBack}>← Back to website</button>}
        </div>
        <h1>Good things keep going.</h1>
        <p>Subscriptions, billing and customer relationships in one connected workspace.</p>
        <div className="bl-auth-stage"><HeroPanel compact /></div>
      </aside>

      {/* Form panel */}
      <main className="bl-auth-form">
        <div className="bl-auth-box">
          <div className="bl-auth-mobile-brand"><Logo onClick={onBack} /></div>
          {onBack && <button type="button" className="bl-auth-mback" onClick={onBack}>← Back to website</button>}

          {showTabs && (
            <div className={`bl-tabs ${current === 'register' ? 'is-register' : ''}`} role="tablist">
              <i aria-hidden />
              <button type="button" role="tab" aria-selected={current === 'login'} className={current === 'login' ? 'on' : ''} onClick={() => go('login')}>Sign in</button>
              <button type="button" role="tab" aria-selected={current === 'register'} className={current === 'register' ? 'on' : ''} onClick={() => go('register')}>Create account</button>
            </div>
          )}

          <h2>{title}</h2>
          <p className="bl-auth-sub">{sub}</p>

          <form
            className="bl-fields"
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
                await onSuccess();
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {current === 'register' && (
              <div className="bl-field">
                <label htmlFor="auth-name">Full name</label>
                <div className="bl-input">
                  <User size={17} />
                  <input id="auth-name" name="name" required autoComplete="name" placeholder="Your full name" />
                </div>
              </div>
            )}

            {current !== 'reset' && (
              <div className="bl-field">
                <label htmlFor="auth-email">Email address</label>
                <div className="bl-input">
                  <Mail size={17} />
                  <input id="auth-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
                </div>
              </div>
            )}

            {current !== 'forgot' && (
              <div className="bl-field">
                <label htmlFor="auth-password">{current === 'reset' ? 'New password' : 'Password'}</label>
                <div className="bl-input">
                  <Lock size={17} />
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={current === 'login' ? 'current-password' : 'new-password'}
                    minLength={current === 'login' ? 1 : 9}
                    placeholder={current === 'login' ? 'Enter your password' : 'Create a strong password'}
                  />
                  <button type="button" className="bl-eye" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {current !== 'login' && <small className="bl-hint">9+ characters, uppercase, lowercase and a special character.</small>}
              </div>
            )}

            {current === 'login' && (
              <div className="bl-row">
                <label><input type="checkbox" /> Remember me</label>
                <button type="button" onClick={() => go('forgot')}>Forgot password?</button>
              </div>
            )}

            {error && <p role="alert" className="bl-error">{error}</p>}

            <button type="submit" className="bl-btn bl-btn-dark bl-submit" disabled={busy}>
              {busy ? 'One moment…' : current === 'login' ? 'Sign in' : current === 'register' ? 'Create account' : current === 'forgot' ? 'Send reset link' : 'Reset password'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          {(current === 'forgot') && (
            <div className="bl-switch" style={{ marginTop: 22 }}>
              <button type="button" onClick={() => go('login')}>Remember your password? <strong>Sign in</strong></button>
            </div>
          )}

          {showTabs && (
            <>
              <div className="bl-or"><span>or</span></div>
              <div className="bl-switch">
                <button type="button" onClick={() => go(current === 'register' ? 'login' : 'register')}>
                  {current === 'register' ? 'Already have an account? ' : 'New here? '}
                  <strong>{current === 'register' ? 'Sign in' : 'Create an account'}</strong>
                </button>
                {current === 'login' && (
                  <button type="button" onClick={() => go('forgot')}>Can’t access your account? <strong>Reset password</strong></button>
                )}
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
