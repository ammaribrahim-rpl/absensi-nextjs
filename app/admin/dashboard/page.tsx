import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
export const metadata: Metadata = { title: 'Admin Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');
  const supabase = createAdminClient();
  const [{ count: totalKaryawan }, { count: totalJabatan }] = await Promise.all([
    supabase.from('tb_karyawan').select('*', { count: 'exact', head: true }),
    supabase.from('tb_jabatan').select('*', { count: 'exact', head: true }),
  ]);
  const a = session as Extract<typeof session, { role: 'admin' }>;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800 }}>Dashboard Administrator</h1>
      <p style={{ color: '#6b7280', margin: '0 0 24px' }}>Selamat datang, <strong>{a.username}</strong></p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
        <Link href="/admin/karyawan" style={{ textDecoration: 'none' }}>
          <div className="kpi-card"><div className="kpi-icon" style={{ background: '#ede9fe' }}><i className="fas fa-users" style={{ color: '#4f46e5' }} /></div>
            <div><div className="kpi-label">Total Karyawan</div><div className="kpi-value">{totalKaryawan ?? 0}</div></div></div>
        </Link>
        <Link href="/admin/jabatan" style={{ textDecoration: 'none' }}>
          <div className="kpi-card"><div className="kpi-icon" style={{ background: '#fef3c7' }}><i className="fas fa-briefcase" style={{ color: '#d97706' }} /></div>
            <div><div className="kpi-label">Total Jabatan</div><div className="kpi-value">{totalJabatan ?? 0}</div></div></div>
        </Link>
      </div>
    </div>
  );
}
