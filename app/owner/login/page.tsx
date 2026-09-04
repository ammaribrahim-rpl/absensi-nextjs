import type { Metadata } from 'next';
import LoginForm from '@/components/ui/LoginForm';

export const metadata: Metadata = { title: 'Login Owner' };

export default function OwnerLoginPage() {
  return (
    <LoginForm
      role="owner" title="Executive Dashboard"
      subtitle="Portal Login Owner Executive"
      iconClass="fas fa-crown"
      iconColor="#7e22ce"
      apiEndpoint="/api/auth/owner"
      redirectTo="/owner/dashboard"
      accentColor="#7e22ce"
    />
  );
}
