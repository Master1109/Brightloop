'use client';
import { useRouter } from 'next/navigation';
import { ShieldX } from 'lucide-react';

export default function ForbiddenPage() {
  const router = useRouter();
  return (
    <div className="initial-loading" style={{ textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <ShieldX size={52} style={{ color: '#ef4444', marginBottom: 16 }} />
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: '#0F0F10' }}>403 · Access Denied</h1>
      <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 400 }}>You do not have permission to access this area of your workspace.</p>
      <button onClick={() => router.push('/')} className="button primary" style={{ minHeight: 44, padding: '0 24px' }}>
        Return to Home
      </button>
    </div>
  );
}
