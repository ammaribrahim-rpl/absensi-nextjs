import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

const adminNav = [
  { href: '/admin/dashboard',      icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
  { href: '/admin/karyawan',       icon: 'fas fa-users',          label: 'Kelola Karyawan' },
  { href: '/admin/jabatan',        icon: 'fas fa-briefcase',      label: 'Kelola Jabatan' },
  { href: '/admin/profil',         icon: 'fas fa-user-circle',    label: 'Profil Admin' },
  { href: '/admin/ganti-password', icon: 'fas fa-key',            label: 'Ganti Password' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');
  const adminSession = session as Extract<typeof session, { role: 'admin' }>;

  return (
    <div className="layout-wrapper">
      <Sidebar
        logoText="ABSENSI"
        logoIcon="fas fa-user-shield"
        logoColor="#818cf8"
        navItems={adminNav}
        role="admin"
        userName={adminSession.username}
        userBadge="Administrator"
        badgeColor="#6366f1"
      />
      <div className="page-content">{children}</div>
    </div>
  );
}
