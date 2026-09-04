import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

const ownerNav = [
  { href: '/owner/dashboard',      icon: 'fas fa-chart-line',    label: 'Dashboard' },
  { href: '/owner/karyawan',       icon: 'fas fa-users',         label: 'Kelola Karyawan' },
  { href: '/owner/admin',          icon: 'fas fa-user-shield',   label: 'Kelola Admin' },
  { href: '/owner/jabatan',        icon: 'fas fa-briefcase',     label: 'Kelola Jabatan' },
  { href: '/owner/approval',       icon: 'fas fa-check-circle',  label: 'Approval Izin/Cuti' },
  { href: '/owner/laporan',        icon: 'fas fa-file-alt',      label: 'Laporan Absensi' },
  { href: '/owner/profil',         icon: 'fas fa-user-circle',   label: 'Profil Owner' },
];

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'owner') redirect('/owner/login');
  const ownerSession = session as Extract<typeof session, { role: 'owner' }>;

  return (
    <div className="layout-wrapper">
      <Sidebar
        logoText="ABSENSI"
        logoIcon="fas fa-crown"
        logoColor="#c084fc"
        navItems={ownerNav}
        role="owner"
        userName={ownerSession.nama}
        userBadge="Owner Executive"
        badgeColor="#a855f7"
      />
      <div className="page-content">{children}</div>
    </div>
  );
}
