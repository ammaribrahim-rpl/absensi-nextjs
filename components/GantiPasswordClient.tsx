'use client';
import { useState } from 'react';

export default function GantiPasswordClient({ apiEndpoint, userName, role }: { apiEndpoint: string; userName: string; role: string; }) {
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(apiEndpoint, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pass_lama: fd.get('pass_lama'), pass_baru: fd.get('pass_baru'), konfirmasi: fd.get('konfirmasi') }),
    });
    const d = await res.json();
    setMsg({ type: d.success ? 'success' : 'error', text: d.success ? 'Password berhasil diubah!' : d.error });
    if (d.success) (e.target as HTMLFormElement).reset();
    setLoading(false);
  }

  const accentColor = role === 'owner' ? '#7e22ce' : '#4f46e5';

  return (
    <div style={{ padding: '24px', maxWidth: '440px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800 }}>
        <i className="fas fa-key" style={{ marginRight: '8px', color: accentColor }} />Ganti Password
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 20px' }}>Akun: <strong>{userName}</strong></p>

      {msg && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '16px' }}>
          <i className={`fas fa-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} /> {msg.text}
        </div>
      )}

      <div className="card card-padded">
        <form onSubmit={handleSubmit}>
          {[
            ['pass_lama', 'Password Lama'],
            ['pass_baru', 'Password Baru (min. 6 karakter)'],
            ['konfirmasi', 'Konfirmasi Password Baru'],
          ].map(([name, label]) => (
            <div key={name} style={{ marginBottom: '14px' }}>
              <label className="form-label">{label}</label>
              <input type="password" name={name} className="form-control" required minLength={name !== 'pass_lama' ? 6 : undefined} />
            </div>
          ))}
          <button type="submit" className="btn btn-block" disabled={loading} style={{ background: accentColor, color: '#fff', fontWeight: 700 }}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
