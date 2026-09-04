'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Admin { id: number; username: string; created_at: string; }

export default function AdminManageClient({ admins: initData }: { admins: Admin[] }) {
  const router = useRouter();
  const [data, setData] = useState(initData);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/owner/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }) });
    const d = await res.json();
    if (d.success) { setShowAdd(false); router.refresh(); }
    else { setMsg(d.error ?? 'Gagal menambah admin.'); }
    setLoading(false);
  }

  async function handleDelete(id: number, username: string) {
    if (!confirm(`Hapus admin "${username}"?`)) return;
    await fetch(`/api/owner/admin?id=${id}`, { method: 'DELETE' });
    setData(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
          <i className="fas fa-user-shield" style={{ marginRight: '8px', color: '#7e22ce' }} />Kelola Administrator
        </h1>
        <button className="btn btn-owner btn-sm" onClick={() => { setShowAdd(true); setMsg(''); }}>
          <i className="fas fa-plus" /> Tambah Admin
        </button>
      </div>

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>No</th><th>Username</th><th>Terdaftar</th><th>Aksi</th></tr></thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Belum ada administrator</td></tr>
            ) : data.map((a, i) => (
              <tr key={a.id}>
                <td style={{ color: '#9ca3af' }}>{i+1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar avatar-sm"><i className="fas fa-user-shield" /></div>
                    <span style={{ fontWeight: 600 }}>{a.username}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(a.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id, a.username)}>
                    <i className="fas fa-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal-box" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tambah Administrator</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {msg && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {msg}</div>}
                <div style={{ marginBottom: '12px' }}><label className="form-label">Username *</label><input type="text" name="username" className="form-control" required /></div>
                <div><label className="form-label">Password *</label><input type="password" name="password" className="form-control" required minLength={6} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAdd(false)}>Batal</button>
                <button type="submit" className="btn btn-owner btn-sm" disabled={loading}>{loading ? 'Menyimpan...' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
