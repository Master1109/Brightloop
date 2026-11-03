'use client';

import { Suspense } from 'react';
import { getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Auth from '../../components/auth';

type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
const rolePath: Record<Role, string> = { ADMIN: '/admin', STAFF: '/staff', CUSTOMER: '/portal' };

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle successful login from Auth form
  const handleSuccess = async () => {
    const callback = searchParams.get('callbackUrl');
    if (callback && callback.startsWith('/') && !callback.startsWith('//') && callback !== '/login') {
      router.replace(callback);
      return;
    }

    // Get fresh session to determine role redirect
    const s = await getSession();
    const role = ((s as any)?.role?.toUpperCase() || (s as any)?.user?.role?.toUpperCase()) as Role | undefined;
    if (role && rolePath[role]) {
      router.replace(rolePath[role]);
    } else {
      router.replace('/admin');
    }
  };

  // Directly render the Auth form — no unexpected auto-redirects
  return <Auth onSuccess={handleSuccess} onBack={() => router.push('/')} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="initial-loading" aria-live="polite"><p>Loading<span className="loading-dots">…</span></p></div>}>
      <LoginContent />
    </Suspense>
  );
}
