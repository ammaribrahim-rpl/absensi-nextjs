'use client';
import { useState } from 'react';
import type { KaryawanSession } from '@/types/session';

export default function ProfilClient({ karyawan: k, tglMasukFormatted, masaKerja }: {
  karyawan: KaryawanSession; tglMasukFormatted: string; masaKerja: string;
}) {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passMode, setPassMode] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (!confirm('Apakah Anda yakin ingin logout?')) return;
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/karyawan/profil', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alamat: fd.get('alamat'), no_tel: fd.get('no_tel'), agama: fd.get('agama') }),
    });
    const d = await res.json();
    setMsg({ type: d.success ? 'success' : 'error', text: d.success ? 'Profil berhasil diperbarui.' : d.error });
    if (d.success) setEditMode(false);
    setLoading(false);
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/karyawan/profil', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field: 'password', pass_lama: fd.get('pass_lama'), pass_baru: fd.get('pass_baru'), konfirmasi: fd.get('konfirmasi') }),
    });
    const d = await res.json();
    setMsg({ type: d.success ? 'success' : 'error', text: d.success ? 'Password berhasil diubah.' : d.error });
    if (d.success) { setPassMode(false); (e.target as HTMLFormElement).reset(); }
    setLoading(false);
  }

  const initial = k.nama.charAt(0).toUpperCase();

  return (
    <div style={{ padding: '24px', maxWidth: '560px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>
        <i className="fas fa-user-circle" style={{ marginRight: '8px', color: '#4f46e5' }} />Profil Saya
      </h1>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`}>
          <i className={`fas fa-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} /> {msg.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="card card-padded" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '1.4rem', background: '#eef2ff', color: '#4f46e5' }}>{initial}</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{k.nama}</div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              <span className="badge badge-jabatan">{k.jabatan || 'Karyawan'}</span>
              {' '}&middot; {k.jenkel}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'ID Karyawan',   val: k.id_karyawan },
            { label: 'Username',      val: k.username },
            { label: 'Tgl Masuk',     val: tglMasukFormatted },
            { label: 'Masa Kerja',    val: masaKerja },
            { label: 'Tempat / Tgl Lahir', val: k.tmp_tgl_lahir },
            { label: 'Agama',         val: k.agama },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ fontSize: '0.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{val || '-'}</div>
            </div>
          ))}
        </div>

        {/* Edit Form */}
        {editMode ? (
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label">No. Telepon</label>
              <input name="no_tel" type="text" className="form-control" defaultValue={k.no_tel} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label className="form-label">Alamat</label>
              <textarea name="alamat" className="form-control" rows={2} defaultValue={k.alamat} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label">Agama</label>
              <select name="agama" className="form-control" defaultValue={k.agama}>
                {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu','-'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditMode(false)}>Batal</button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>No. Telepon</span>
              <span style={{ fontSize: '0.875rem' }}>{k.no_tel || '-'}</span>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Alamat</span>
              <span style={{ fontSize: '0.875rem' }}>{k.alamat || '-'}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)}>
              <i className="fas fa-pen" /> Edit Profil
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card card-padded" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '0.9rem', fontWeight: 700 }}>
          <i className="fas fa-key" style={{ marginRight: '6px', color: '#d97706' }} /> Ganti Password
        </h3>
        {!passMode ? (
          <button className="btn btn-warning btn-sm" onClick={() => setPassMode(true)}>Ubah Password</button>
        ) : (
          <form onSubmit={handlePassword}>
            {['pass_lama|Password Lama', 'pass_baru|Password Baru (min. 6 karakter)', 'konfirmasi|Konfirmasi Password Baru'].map(f => {
              const [name, label] = f.split('|');
              return (
                <div key={name} style={{ marginBottom: '10px' }}>
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
                    >
                      <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button type="submit" className="btn btn-warning btn-sm" disabled={loading}>{loading ? 'Menyimpan...' : 'Ubah Password'}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPassMode(false)}>Batal</button>
            </div>
          </form>
        )}
      </div>

      {/* ── Tombol Logout di Profil Karyawan ── */}
      <div className="card card-padded" style={{ border: '1px solid #fee2e2', background: '#fffafa' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>
          <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }} /> Logout Akun
        </h3>
        <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: '#6b7280' }}>
          Keluar dari sesi akun karyawan Anda pada perangkat ini.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-danger btn-sm"
          style={{ fontWeight: 600, padding: '8px 18px' }}
        >
          <i className="fas fa-sign-out-alt" />
          {loggingOut ? 'Memproses Keluar...' : 'Logout dari Akun Ini'}
        </button>
      </div>
    </div>
  );
}
