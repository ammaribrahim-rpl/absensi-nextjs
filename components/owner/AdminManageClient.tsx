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

  // Modal ganti password
  const [changeTarget, setChangeTarget] = useState<Admin | null>(null);
  const [newPass, setNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeMsg, setChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!changeTarget || !newPass.trim()) return;
    setChangeLoading(true); setChangeMsg(null);
    const res = await fetch('/api/owner/admin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: changeTarget.id, password: newPass.trim() }),
    });
    const d = await res.json();
    if (d.success) {
      setChangeMsg({ type: 'success', text: 'Password berhasil diubah.' });
      setData(prev => prev.map(a => a.id === changeTarget.id ? { ...a, password: newPass.trim() } : a));
      setTimeout(() => { setChangeTarget(null); setNewPass(''); }, 800);
    } else {
      setChangeMsg({ type: 'error', text: d.error ?? 'Gagal mengubah password.' });
    }
    setChangeLoading(false);
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
                    <button className="btn btn-warning btn-sm" title="Ganti Password"
                      onClick={() => { setChangeTarget(a); setNewPass(''); setChangeMsg(null); }}>
                      <i className="fas fa-key" />
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

      {/* ── Modal Ganti Password Admin ── */}
      {changeTarget && (
        <div className="modal-backdrop" onClick={() => setChangeTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                <i className="fas fa-key" style={{ marginRight: '6px', color: '#7e22ce' }} />
                Ganti Password: <span style={{ color: '#4f46e5' }}>{changeTarget.username}</span>
              </h3>
              <button onClick={() => setChangeTarget(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                {changeMsg && (
                  <div className={`alert ${changeMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '12px' }}>
                    <i className={`fas ${changeMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} /> {changeMsg.text}
                  </div>
                )}
                <div>
                  <label className="form-label">Password Baru *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Masukkan password baru"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      required minLength={3}
                      style={{ paddingRight: '40px' }}
                    />
                    <button type="button" onClick={() => setShowNewPass(v => !v)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}>
                      <i className={`fas ${showNewPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#6b7280' }}>
                    Password akan disimpan sebagai teks biasa dan dapat dilihat oleh Owner.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setChangeTarget(null)}>Batal</button>
                <button type="submit" className="btn btn-owner btn-sm" disabled={changeLoading || !newPass.trim()}>
                  {changeLoading ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

