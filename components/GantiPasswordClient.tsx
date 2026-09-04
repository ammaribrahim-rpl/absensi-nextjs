'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GantiPasswordClient({
  apiEndpoint,
  userName,
  role,
}: {
  apiEndpoint: string;
  userName: string;
  role: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(apiEndpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pass_lama: fd.get('pass_lama'),
        pass_baru: fd.get('pass_baru'),
        konfirmasi: fd.get('konfirmasi'),
      }),
    });
    const d = await res.json();
    setMsg({
      type: d.success ? 'success' : 'error',
      text: d.success ? 'Password berhasil diubah!' : d.error,
    });
    if (d.success) (e.target as HTMLFormElement).reset();
    setLoading(false);
  }

  async function handleLogout() {
    if (!confirm('Apakah Anda yakin ingin logout?')) return;
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  const accentColor = role === 'owner' ? '#7e22ce' : '#4f46e5';

  return (
    <div style={{ padding: '24px', maxWidth: '440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
            <i className="fas fa-key" style={{ marginRight: '8px', color: accentColor }} />
            Ganti Password
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '2px 0 0' }}>
            Akun: <strong>{userName}</strong> ({role.toUpperCase()})
          </p>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '16px' }}>
          <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} /> {msg.text}
        </div>
      )}

      {/* ── Form Ganti Password ── */}
      <div className="card card-padded" style={{ marginBottom: '20px' }}>
        <form onSubmit={handleSubmit}>
          {[
            ['pass_lama', 'Password Lama'],
            ['pass_baru', 'Password Baru (min. 6 karakter)'],
            ['konfirmasi', 'Konfirmasi Password Baru'],
          ].map(([name, label]) => (
            <div key={name} style={{ marginBottom: '14px' }}>
              <label className="form-label">{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  name={name}
                  className="form-control"
                  required
                  minLength={name !== 'pass_lama' ? 6 : undefined}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '0.9rem',
                  }}
                  aria-label={showPass ? 'Sembunyikan' : 'Lihat'}
                >
                  <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="btn btn-block"
            disabled={loading}
            style={{ background: accentColor, color: '#fff', fontWeight: 700, marginTop: '8px' }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin" /> Menyimpan...</>
            ) : (
              <><i className="fas fa-save" /> Simpan Password</>
            )}
          </button>
        </form>
      </div>

      {/* ── Tombol Logout di Profil / Ganti Password ── */}
      <div className="card card-padded" style={{ border: '1px solid #fee2e2', background: '#fffafa' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
          <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }} /> Logout Sesi
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#6b7280' }}>
          Keluar dari sesi akun {role === 'owner' ? 'Owner' : 'Administrator'} pada perangkat ini.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-danger btn-sm"
          style={{ fontWeight: 600, padding: '8px 18px' }}
        >
          <i className="fas fa-sign-out-alt" />
          {loggingOut ? 'Memproses Keluar...' : `Logout ${role === 'owner' ? 'Owner' : 'Admin'}`}
        </button>
      </div>
    </div>
  );
}
