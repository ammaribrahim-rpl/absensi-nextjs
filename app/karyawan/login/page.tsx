import type { Metadata } from 'next';
import LoginForm from '@/components/ui/LoginForm';

export const metadata: Metadata = { title: 'Login Karyawan' };

export default function KaryawanLoginPage() {
  return (
    <LoginForm
      role="karyawan" title="Portal Absensi"
      subtitle="Masuk sebagai Karyawan"
      iconClass="fas fa-fingerprint"
      iconColor="#4f46e5"
      apiEndpoint="/api/auth/karyawan"
      redirectTo="/karyawan/dashboard"
      accentColor="#4f46e5"
    />
  );
}
