'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Karyawan {
  id_karyawan: string; username: string; password: string; nama: string; jabatan: string;
  jenkel: string; no_tel: string; tgl_masuk: string | null;
  tgl_masuk_formatted: string; masa_kerja: string;
  tmp_tgl_lahir: string; agama: string; alamat: string;
}

function isPlainPassword(p: string): boolean {
  if (!p) return false;
  return !(p.startsWith('$2y$') || p.startsWith('$2b$') || p.startsWith('$2a$'));
}

export default function KaryawanTable({ karyawan, jabatanList, q: initQ }: {
  karyawan: Karyawan[]; jabatanList: { jabatan: string; icon: string }[]; q: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initQ);
  const [showModal, setShowModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Karyawan | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Password visibility per row
  const [shownPassIds, setShownPassIds] = useState<Set<string>>(new Set());
  const [showEditPass, setShowEditPass] = useState(false);
  const [karyawanData, setKaryawanData] = useState(karyawan);

  function toggleShowPass(id: string) {
    setShownPassIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function renderPassword(k: Karyawan) {
    const shown = shownPassIds.has(k.id_karyawan);
    const isPlain = isPlainPassword(k.password);
    const display = !k.password ? '-' : isPlain
      ? (shown ? k.password : '••••••••')
      : (shown ? k.password.substring(0, 20) + '...' : '[Hash Bcrypt]');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '110px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: isPlain ? '#1e293b' : '#9ca3af' }}>{display}</span>
        <button type="button" onClick={() => toggleShowPass(k.id_karyawan)}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px 4px', fontSize: '0.78rem' }}
          title={shown ? 'Sembunyikan' : 'Lihat password'}>
          <i className={`fas ${shown ? 'fa-eye-slash' : 'fa-eye'}`} />
        </button>
      </div>
    );
  }

  function openEdit(k: Karyawan) { setSelected(k); setShowModal('edit'); setMsg(''); setShowEditPass(false); }
  function openDelete(k: Karyawan) { setSelected(k); setShowModal('delete'); }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch('/api/owner/karyawan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) { setShowModal(null); router.refresh(); }
    else { setMsg(d.error ?? 'Gagal menyimpan.'); }
    setLoading(false);
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const formObj = Object.fromEntries(fd.entries());
    // Only send password if filled
    if (typeof formObj.password === 'string' && !formObj.password.trim()) {
      delete formObj.password;
    }
    const body = { id_karyawan: selected!.id_karyawan, ...formObj };
    const res = await fetch('/api/owner/karyawan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.success) { setShowModal(null); router.refresh(); }
    else { setMsg(d.error ?? 'Gagal menyimpan.'); }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/owner/karyawan?id=${selected!.id_karyawan}`, { method: 'DELETE' });
    setShowModal(null); router.refresh(); setLoading(false);
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
          <i className="fas fa-users" style={{ marginRight: '8px', color: '#7e22ce' }} />Kelola Karyawan
          <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>({karyawan.length} orang)</span>
        </h1>
        <button className="btn btn-owner btn-sm" onClick={() => { setShowModal('add'); setMsg(''); }}>
          <i className="fas fa-plus" /> Tambah Karyawan
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <input className="form-control" style={{ maxWidth: '320px' }} placeholder="Cari nama / username / jabatan..."
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') router.push(`/owner/karyawan?q=${encodeURIComponent(q)}`); }}
        />
        <button className="btn btn-outline btn-sm" onClick={() => router.push(`/owner/karyawan?q=${encodeURIComponent(q)}`)}>
          <i className="fas fa-search" />
        </button>
        {q && <button className="btn btn-outline btn-sm" onClick={() => { setQ(''); router.push('/owner/karyawan'); }}><i className="fas fa-times" /></button>}
      </div>

      {/* Table */}
      <div className="card table-wrapper">
        <table>
          <thead>
            <tr><th>No</th><th>Nama</th><th>Username</th><th>Password</th><th>Jabatan</th><th>Kelamin</th><th>No. Telp</th><th>Tgl Masuk</th><th>Masa Kerja</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {karyawanData.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Tidak ada data karyawan</td></tr>
            ) : karyawanData.map((k, i) => (
              <tr key={k.id_karyawan}>
                <td style={{ color: '#9ca3af' }}>{i+1}</td>
                <td><div style={{ fontWeight: 600 }}>{k.nama}</div><div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{k.id_karyawan}</div></td>
                <td>{k.username}</td>
                <td>{renderPassword(k)}</td>
                <td><span className="badge badge-jabatan">{k.jabatan || '-'}</span></td>
                <td>{k.jenkel}</td>
                <td>{k.no_tel}</td>
                <td>{k.tgl_masuk_formatted}</td>
                <td>{k.masa_kerja}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-outline btn-sm" title="Edit" onClick={() => openEdit(k)}><i className="fas fa-pen" /></button>
                    <button className="btn btn-danger btn-sm" title="Hapus" onClick={() => openDelete(k)}><i className="fas fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal === 'add' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal-box">
            <div className="modal-header"><h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Tambah Karyawan</h2><button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#6b7280' }}>&times;</button></div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {msg && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {msg}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[['nama','Nama Lengkap','text',true],['username','Username','text',true],['password','Password','password',true],['jabatan','Jabatan','select',true],['jenkel','Jenis Kelamin','select',false],['agama','Agama','select',false],['no_tel','No. Telepon','text',false],['tgl_masuk','Tanggal Masuk','date',false],['tmp_tgl_lahir','Tempat/Tgl Lahir','text',false]].map(([name, label, type, req]) => (
                    <div key={name as string} style={{ gridColumn: name === 'alamat' ? 'span 2' : 'span 1' }}>
                      <label className="form-label">{label as string}{req && ' *'}</label>
                      {type === 'select' && name === 'jabatan' ? (
                        <select name={name as string} className="form-control" required={!!req}>
                          {jabatanList.map(j => <option key={j.jabatan} value={j.jabatan}>{j.jabatan}</option>)}
                        </select>
                      ) : type === 'select' && name === 'jenkel' ? (
                        <select name={name as string} className="form-control">
                          <option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                        </select>
                      ) : type === 'select' && name === 'agama' ? (
                        <select name={name as string} className="form-control">
                          {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(a => <option key={a}>{a}</option>)}
                        </select>
                      ) : (
                        <input type={type as string} name={name as string} className="form-control" required={!!req} />
                      )}
                    </div>
                  ))}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Alamat</label>
                    <textarea name="alamat" className="form-control" rows={2} style={{ resize: 'vertical' }} />
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

      {/* Edit Modal */}
      {showModal === 'edit' && selected && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal-box">
            <div className="modal-header"><h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Edit: {selected.nama}</h2><button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button></div>
            <form onSubmit={handleEdit}>
              <div className="modal-body">
                {msg && <div className="alert alert-danger"><i className="fas fa-exclamation-circle" /> {msg}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div><label className="form-label">Nama Lengkap *</label><input name="nama" type="text" className="form-control" defaultValue={selected.nama} required /></div>
                  <div><label className="form-label">Username *</label><input name="username" type="text" className="form-control" defaultValue={selected.username} required /></div>
                  <div>
                    <label className="form-label">Password Baru (kosongkan jika tidak diubah)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        name="password"
                        type={showEditPass ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Biarkan kosong jika tidak diubah"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPass(v => !v)}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                        title={showEditPass ? 'Sembunyikan' : 'Lihat password'}
                      >
                        <i className={`fas ${showEditPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </div>
                  </div>
                  <div><label className="form-label">Jabatan</label><select name="jabatan" className="form-control" defaultValue={selected.jabatan}>{jabatanList.map(j => <option key={j.jabatan} value={j.jabatan}>{j.jabatan}</option>)}</select></div>
                  <div><label className="form-label">Jenis Kelamin</label><select name="jenkel" className="form-control" defaultValue={selected.jenkel}><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></div>
                  <div><label className="form-label">Agama</label><select name="agama" className="form-control" defaultValue={selected.agama}>{['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(a => <option key={a}>{a}</option>)}</select></div>
                  <div><label className="form-label">No. Telepon</label><input name="no_tel" type="text" className="form-control" defaultValue={selected.no_tel} /></div>
                  <div><label className="form-label">Tanggal Masuk</label><input name="tgl_masuk" type="date" className="form-control" defaultValue={selected.tgl_masuk ?? ''} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label className="form-label">Alamat</label><textarea name="alamat" className="form-control" rows={2} defaultValue={selected.alamat} style={{ resize: 'vertical' }} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowModal(null)}>Batal</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Menyimpan...' : 'Perbarui'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showModal === 'delete' && selected && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(null)}>
          <div className="modal-box" style={{ maxWidth: '380px' }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '2.5rem', color: '#dc2626', marginBottom: '12px' }}><i className="fas fa-exclamation-triangle" /></div>
              <h3 style={{ margin: '0 0 8px' }}>Hapus Karyawan?</h3>
              <p style={{ color: '#6b7280', margin: 0 }}>Hapus <strong>{selected.nama}</strong>? Semua data absensi terkait juga akan terhapus.</p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(null)}>Batal</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loading}>{loading ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
