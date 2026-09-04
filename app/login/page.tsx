import type { Metadata } from 'next';
import LoginForm from '@/components/ui/LoginForm';

export const metadata: Metadata = {
  title: 'Login Sistem Absensi',
  description: 'Portal Login Sistem Presensi & Absensi Terintegrasi',
};

export default function LoginPage() {
  return <LoginForm />;
}
