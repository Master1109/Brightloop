'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Workspace from './workspace';

type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
const rolePath: Record<Role, string> = { ADMIN: '/admin', STAFF: '/staff', CUSTOMER: '/portal' };

export function ProtectedWorkspace({ role }: { role: Role }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getSession().then((session) => {
      if (!active) return;
      const currentRole = (session as { role?: Role } | null)?.role;
      if (!currentRole) router.replace('/login');
      else if (currentRole !== role) router.replace(rolePath[currentRole]);
      else setReady(true);
    });
    return () => { active = false; };
  }, [role, router]);

  if (!ready) return <div className="initial-loading" aria-live="polite"><p>Opening your workspace<span className="loading-dots">…</span></p></div>;
  return <Workspace onSignOut={() => router.replace('/')} onBackToLanding={() => router.push('/')} />;
}
