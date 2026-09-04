import type { Metadata } from 'next';
import LoginForm from '@/components/ui/LoginForm';

export const metadata: Metadata = { title: 'Login Administrator' };

export default function AdminLoginPage() {
  return (
    <LoginForm
      role="admin" title="Dashboard"
      subtitle="Masuk sebagai Administrator"
      iconClass="fas fa-user-shield"
      apiEndpoint="/api/auth/admin"
      redirectTo="/admin/dashboard"
      accentColor="#4f46e5"
    />
  );
}
