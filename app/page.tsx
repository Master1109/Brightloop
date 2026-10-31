'use client';
import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import Landing from '../components/landing';
import Auth from '../components/auth';
import Workspace from '../components/workspace';

export default function Page() {
  const [view, setView] = useState<'landing' | 'auth' | 'workspace'>('landing');
  const [session, setSession] = useState<any>(null);
  const [demo, setDemo] = useState(true);
  const [initialChecked, setInitialChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSession();
        if (s) {
          setSession(s);
          // If already logged in, you can directly go to workspace if desired,
          // or start on landing with a "Go to Dashboard" button.
          // By default, if the user directly accesses the app while authenticated, take them to workspace:
          setView('workspace');
        }
        const h = await fetch('/backend/health').then(r => r.json()).catch(() => ({ demo: true }));
        if (h && typeof h.demo === 'boolean') setDemo(h.demo);
      } catch {}
      setInitialChecked(true);
    })();
  }, []);

  const handleAuthSuccess = async () => {
    const s = await getSession();
    setSession(s);
    setView('workspace');
  };

  const handleSignOut = () => {
    setSession(null);
    setView('landing');
  };

  if (view === 'workspace') {
    return (
      <Workspace
        onSignOut={handleSignOut}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  if (view === 'auth') {
    return (
      <Auth
        demo={demo}
        onSuccess={handleAuthSuccess}
        onBack={() => setView('landing')}
      />
    );
  }

  return (
    <Landing
      onGetStarted={() => {
        if (session) {
          setView('workspace');
        } else {
          setView('auth');
        }
      }}
    />
  );
}
