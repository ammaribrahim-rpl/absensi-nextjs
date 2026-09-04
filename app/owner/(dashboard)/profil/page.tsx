// app/owner/(dashboard)/profil/page.tsx — Profil Owner Executive dengan info akun dan tombol logout
import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import GantiPasswordClient from '@/components/GantiPasswordClient';

export const metadata: Metadata = { title: 'Profil Owner' };
export const dynamic = 'force-dynamic';

export default async function OwnerProfilPage() {
  const s = await getSession();
  if (!s || s.role !== 'owner') redirect('/login');
  const o = s as Extract<typeof s, { role: 'owner' }>;

  return (
    <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
      {/* ── Info Card Profil Owner ── */}
      <div className="card card-padded" style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div
          className="avatar avatar-lg"
          style={{
            margin: '0 auto 12px',
            background: 'rgba(168,85,247,0.18)',
            color: '#7e22ce',
            fontSize: '1.6rem',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="fas fa-crown" style={{ color: '#facc15' }} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
          {o.nama}
        </h2>
        <div style={{ marginTop: '4px' }}>
          <span className="badge badge-owner" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
            Owner Executive (Super Admin)
          </span>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
          Pemilik dan pengelola hak akses penuh atas seluruh sistem dan database presensi.
        </p>
      </div>

      {/* ── Form Ganti Password & Logout ── */}
      <GantiPasswordClient
        apiEndpoint="/api/owner/ganti-password"
        userName={o.username}
        role="owner"
      />
    </div>
  );
}
