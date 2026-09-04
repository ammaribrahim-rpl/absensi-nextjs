'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Jabatan } from '@/types/database';

const iconOptions = [
  'fas fa-briefcase','fas fa-user-tie','fas fa-laptop','fas fa-dollar-sign',
  'fas fa-cogs','fas fa-chart-line','fas fa-store','fas fa-broom',
  'fas fa-tools','fas fa-stethoscope','fas fa-book','fas fa-calculator',
  'fas fa-code','fas fa-headset','fas fa-truck','fas fa-hard-hat',
];

export default function JabatanClient({ jabatan: initData }: { jabatan: Jabatan[] }) {
  const router = useRouter();
  const [data, setData] = useState(initData);
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Jabatan | null>(null);
  const [selectedIcon, setSelectedIcon] = useState('fas fa-briefcase');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/owner/jabatan', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jabatan: fd.get('jabatan'), icon: selectedIcon }) });
    const d = await res.json();
    if (d.success) { setShowModal(null); router.refresh(); }
    else setMsg(d.error ?? 'Gagal'); setLoading(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/owner/jabatan', { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected!.id, jabatan: fd.get('jabatan'), icon: selectedIcon }) });
    const d = await res.json();
    if (d.success) { setShowModal(null); router.refresh(); }
    else setMsg(d.error ?? 'Gagal'); setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus jabatan ini?')) return;
    await fetch(`/api/owner/jabatan?id=${id}`, { method: 'DELETE' });
    setData(prev => prev.filter(j => j.id !== id));
  }

  return (
    <div style={{ padding: '24px', maxWidth: '700px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
          <i className="fas fa-briefcase" style={{ marginRight: '8px', color: '#7e22ce' }} />Kelola Jabatan
        </h1>
        <button className="btn btn-owner btn-sm" onClick={() => { setShowModal('add'); setSelectedIcon('fas fa-briefcase'); setMsg(''); }}>
          <i className="fas fa-plus" /> Tambah Jabatan
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {data.map(j => (
          <div key={j.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', background: '#f3e8ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7e22ce' }}>
                <i className={j.icon} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{j.jabatan}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => { setSelected(j); setSelectedIcon(j.icon); setShowModal('edit'); setMsg(''); }}>
                <i className="fas fa-pen" />
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(j.id)}><i className="fas fa-trash" /></button>
            </div>
          </div>
        ))}
      </div>

      {(showModal === 'add' || showModal === 'edit') && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal-box" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{showModal === 'add' ? 'Tambah Jabatan' : 'Edit Jabatan'}</h2>
              <button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            </div>
            <form onSubmit={showModal === 'add' ? handleAdd : handleEdit}>
              <div className="modal-body">
                {msg && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {msg}</div>}
                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Nama Jabatan *</label>
                  <input type="text" name="jabatan" className="form-control" defaultValue={showModal === 'edit' ? selected?.jabatan : ''} required />
                </div>
                <div>
                  <label className="form-label">Icon (Font Awesome)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    {iconOptions.map(icon => (
                      <button key={icon} type="button" onClick={() => setSelectedIcon(icon)}
                        style={{ padding: '8px', borderRadius: '6px', border: `2px solid ${selectedIcon === icon ? '#7e22ce' : 'transparent'}`,
                          background: selectedIcon === icon ? '#f3e8ff' : 'transparent', cursor: 'pointer', color: selectedIcon === icon ? '#7e22ce' : '#6b7280' }}>
                        <i className={icon} />
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#6b7280' }}>
                    Terpilih: <i className={selectedIcon} style={{ marginRight: '4px' }} /><code>{selectedIcon}</code>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowModal(null)}>Batal</button>
                <button type="submit" className="btn btn-owner btn-sm" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
