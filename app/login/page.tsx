'use client';

import { useEffect, useState } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Auth from '../../components/auth';

type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
const rolePath: Record<Role, string> = { ADMIN: '/admin', STAFF: '/staff', CUSTOMER: '/portal' };

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const continueToRoleHome = async () => {
    const session = await getSession();
    const role = ((session as { role?: string } | null)?.role?.toUpperCase()) as Role | undefined;
    if (role) router.replace(rolePath[role]);
  };
  useEffect(() => { continueToRoleHome().finally(() => setChecking(false)); }, []);
  if (checking) return <div className="initial-loading" aria-live="polite"><p>Checking your session<span className="loading-dots">…</span></p></div>;
  return <Auth onSuccess={continueToRoleHome} onBack={() => router.push('/')} />;
}
