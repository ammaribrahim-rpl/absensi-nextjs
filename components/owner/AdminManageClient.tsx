'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Admin { id: number; username: string; password: string; created_at: string; }

function isPlainPassword(p: string): boolean {
  if (!p) return false;
  return !(p.startsWith('$2y$') || p.startsWith('$2b$') || p.startsWith('$2a$'));
}

export default function AdminManageClient({ admins: initData }: { admins: Admin[] }) {
  const router = useRouter();
  const [data, setData] = useState(initData);
  const [showAdd, setShowAdd] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [shownPassIds, setShownPassIds] = useState<Set<number>>(new Set());

  // Modal edit admin
  const [editTarget, setEditTarget] = useState<Admin | null>(null);
  const [editPass, setEditPass] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function toggleShowPass(id: number) {
    setShownPassIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/owner/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }),
    });
    const d = await res.json();
    if (d.success) { setShowAdd(false); router.refresh(); }
    else setMsg(d.error ?? 'Gagal menambah admin.');
    setLoading(false);
  }

  async function handleDelete(id: number, username: string) {
    if (!confirm(`Hapus admin "${username}"?`)) return;
    await fetch(`/api/owner/admin?id=${id}`, { method: 'DELETE' });
    setData(prev => prev.filter(a => a.id !== id));
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true); setEditMsg(null);
    const fd = new FormData(e.currentTarget);
    const username = fd.get('username')?.toString().trim();
    const password = fd.get('password')?.toString().trim();
    const body: Record<string, unknown> = { id: editTarget.id };
    if (username) body.username = username;
    if (password) body.password = password;

    const res = await fetch('/api/owner/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.success) {
      setEditMsg({ type: 'success', text: 'Data admin berhasil diperbarui.' });
      setData(prev => prev.map(a => a.id === editTarget.id ? {
        ...a,
        username: username || a.username,
        password: password || a.password
      } : a));
      setTimeout(() => { setEditTarget(null); }, 800);
    } else {
      setEditMsg({ type: 'error', text: d.error ?? 'Gagal memperbarui admin.' });
    }
    setEditLoading(false);
  }

  function renderPassword(a: Admin) {
    const shown = shownPassIds.has(a.id);
    const isPlain = isPlainPassword(a.password);
    const display = !a.password ? '-' : isPlain
      ? (shown ? a.password : '••••••••')
      : (shown ? a.password.substring(0, 20) + '...' : '[Hash Bcrypt]');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '120px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: isPlain ? '#1e293b' : '#9ca3af' }}>
          {display}
        </span>
        <button type="button" onClick={() => toggleShowPass(a.id)}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px 4px', fontSize: '0.82rem' }}
          title={shown ? 'Sembunyikan' : 'Lihat password'}>
          <i className={`fas ${shown ? 'fa-eye-slash' : 'fa-eye'}`} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '760px' }}>
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
          <thead>
            <tr>
              <th>No</th>
              <th>Username</th>
              <th>Password</th>
              <th>Terdaftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Belum ada administrator</td></tr>
            ) : data.map((a, i) => (
              <tr key={a.id}>
                <td style={{ color: '#9ca3af' }}>{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="avatar avatar-sm"><i className="fas fa-user-shield" /></div>
                    <span style={{ fontWeight: 600 }}>{a.username}</span>
                  </div>
                </td>
                <td>{renderPassword(a)}</td>
                <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  {new Date(a.created_at).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-outline btn-sm" title="Edit Admin"
                      onClick={() => { setEditTarget(a); setEditPass(''); setEditMsg(null); setShowEditPass(false); }}>
                      <i className="fas fa-pen" />
                    </button>
                    <button className="btn btn-danger btn-sm" title="Hapus Admin"
                      onClick={() => handleDelete(a.id, a.username)}>
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal Tambah Admin ── */}
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
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Username *</label>
                  <input type="text" name="username" className="form-control" required />
                </div>
                <div>
                  <label className="form-label">Password *</label>
                  <input type="text" name="password" className="form-control" required minLength={3}
                    placeholder="Password plain-text (dapat dilihat oleh Owner)" />
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                    <i className="fas fa-info-circle" /> Password disimpan sebagai teks biasa agar dapat dilihat oleh Owner.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAdd(false)}>Batal</button>
                <button type="submit" className="btn btn-owner btn-sm" disabled={loading}>{loading ? 'Menyimpan...' : 'Tambah'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Edit Admin ── */}
      {editTarget && (
        <div className="modal-backdrop" onClick={() => setEditTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                <i className="fas fa-pen" style={{ marginRight: '6px', color: '#7e22ce' }} />
                Edit Admin: <span style={{ color: '#4f46e5' }}>{editTarget.username}</span>
              </h3>
              <button onClick={() => setEditTarget(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {editMsg && (
                  <div className={`alert ${editMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '12px' }}>
                    <i className={`fas ${editMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} /> {editMsg.text}
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Username *</label>
                  <input type="text" name="username" className="form-control" defaultValue={editTarget.username} required />
                </div>
                <div>
                  <label className="form-label">Password Baru (kosongkan jika tidak diubah)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEditPass ? 'text' : 'password'}
                      name="password"
                      className="form-control"
                      placeholder="Biarkan kosong jika tidak diubah"
                      value={editPass}
                      onChange={e => setEditPass(e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowEditPass(v => !v)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                      title={showEditPass ? 'Sembunyikan' : 'Lihat password'}>
                      <i className={`fas ${showEditPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                    Password disimpan sebagai teks biasa agar dapat dilihat oleh Owner.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditTarget(null)}>Batal</button>
                <button type="submit" className="btn btn-owner btn-sm" disabled={editLoading}>
                  {editLoading ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

