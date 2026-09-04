import type { Metadata } from 'next';
import LoginForm from '@/components/ui/LoginForm';

export const metadata: Metadata = {
  title: 'Login Sistem Absensi',
  description: 'Portal Login Sistem Presensi & Absensi (Karyawan, Admin, Owner)',
};

export default function LoginPage() {
  return (
    <LoginForm
      allowRoleSwitch={true}
      initialRole="karyawan"
    />
  );
}
