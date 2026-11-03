'use client';
import { useRouter } from 'next/navigation';
import Auth from '../../components/auth';

export default function RegisterPage() {
  const router = useRouter();
  return <Auth onSuccess={() => router.push('/login')} onBack={() => router.push('/')} />;
}
