'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Workspace from './workspace';

type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
const rolePath: Record<Role, string> = { ADMIN: '/admin', STAFF: '/staff', CUSTOMER: '/portal' };

export function ProtectedWorkspace({ role, initialPage }: { role: Role; initialPage?: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      const currentRole = ((session as { role?: string } | null)?.role?.toUpperCase()) as Role | undefined;
      if (!currentRole) {
        router.replace('/login');
      } else if (currentRole !== role) {
        router.replace(rolePath[currentRole] || '/');
      }
    }
  }, [status, session, role, router]);

  if (status === 'loading') {
    return (
      <div className="initial-loading" aria-live="polite">
        <p>Opening your workspace<span className="loading-dots">…</span></p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="initial-loading" aria-live="polite">
        <p>Redirecting to sign in<span className="loading-dots">…</span></p>
      </div>
    );
  }

  return <Workspace initialPage={initialPage} onSignOut={() => router.replace('/')} onBackToLanding={() => router.push('/')} />;
}
