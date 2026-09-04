import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

const karyawanNav = [
  { href: '/karyawan/dashboard',  icon: 'fas fa-fingerprint', label: 'Absensi Saya' },
  { href: '/karyawan/izin',       icon: 'fas fa-calendar-alt', label: 'Pengajuan Izin/Cuti' },
  { href: '/karyawan/notifikasi', icon: 'fas fa-bell',         label: 'Notifikasi' },
  { href: '/karyawan/profil',     icon: 'fas fa-user-circle',  label: 'Profil Saya' },
];

export default async function KaryawanLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') redirect('/login');
  const k = session as Extract<typeof session, { role: 'karyawan' }>;

  return (
    <div className="layout-wrapper">
      <Sidebar
        logoText="ABSENSI"
        logoIcon="fas fa-fingerprint"
        logoColor="#818cf8"
        navItems={karyawanNav}
        role="karyawan"
        userName={k.nama}
        userBadge={k.jabatan || 'Karyawan'}
        badgeColor="#6366f1"
      />
      <div className="page-content">{children}</div>
    </div>
  );
}
