import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '24px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>404 — Page Not Found</h1>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>The page you are looking for does not exist.</p>
        <Link href="/" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: '#15142e', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

