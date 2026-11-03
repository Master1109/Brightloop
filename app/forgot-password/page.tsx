'use client';
import { useRouter } from 'next/navigation';
import Auth from '../../components/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  return <Auth onSuccess={() => router.push('/login')} onBack={() => router.push('/')} />;
}
