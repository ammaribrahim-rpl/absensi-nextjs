// app/admin/profil/page.tsx — Profil Administrator dengan info akun dan tombol logout
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import GantiPasswordClient from '@/components/GantiPasswordClient';

export const metadata: Metadata = { title: 'Profil Administrator' };
export const dynamic = 'force-dynamic';

export default async function AdminProfilPage() {
  const s = await getSession();
  if (!s || s.role !== 'admin') redirect('/login');
  const a = s as Extract<typeof s, { role: 'admin' }>;

  return (
    <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      {/* ── Info Card Profil Admin ── */}
      <div className="card card-padded" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div
          className="avatar avatar-lg"
          style={{
            margin: '0 auto 12px',
            background: 'rgba(99,102,241,0.15)',
            color: '#4f46e5',
            fontSize: '1.5rem',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="fas fa-user-shield" />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
          {a.username}
        </h2>
        <div style={{ marginTop: '4px' }}>
          <span className="badge badge-jabatan" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            Administrator Sistem
          </span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
          Memiliki akses untuk mengelola data absensi karyawan dan master data jabatan.
        </p>
      </div>

      {/* ── Form Ganti Password & Logout ── */}
      <GantiPasswordClient
        apiEndpoint="/api/owner/ganti-password"
        userName={a.username}
        role="admin"
      />
    </div>
  );
}
