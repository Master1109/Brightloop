'use client';

import { useRouter } from 'next/navigation';
import Landing from '../components/landing';

/** The public landing page is intentionally available to every visitor. */
export default function HomePage() {
  const router = useRouter();
  return <Landing onGetStarted={() => router.push('/login')} />;
}
