'use client';
import { useState, FormEvent } from 'react';
import type { Keterangan } from '@/types/database';

const statusBadgeMap: Record<string, string> = { Proses: 'badge-proses', Disetujui: 'badge-setuju', Ditolak: 'badge-tolak' };

export default function IzinClient({ nama, riwayat: initRiwayat }: { nama: string; riwayat: Partial<Keterangan>[] }) {
  const [riwayat, setRiwayat] = useState(initRiwayat);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = { keterangan: fd.get('keterangan'), tgl_mulai: fd.get('tgl_mulai'), tgl_selesai: fd.get('tgl_selesai'), alasan: fd.get('alasan') };

    const res = await fetch('/api/karyawan/izin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setMsg({ type: 'success', text: data.message });
      (e.target as HTMLFormElement).reset();
      // Refresh riwayat
      const r = await fetch('/api/karyawan/izin');
      if (r.ok) { const d = await r.json(); setRiwayat(d.data ?? []); }
    } else {
      setMsg({ type: 'error', text: data.error });
    }
    setLoading(false);
  }

  return (
    <div style={{ padding: '24px', maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 20px', fontSize: '1.2rem', fontWeight: 800 }}>
        <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#4f46e5' }} />
        Pengajuan Izin / Cuti
      </h1>

      {/* Form */}
      <div className="card card-padded" style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: '#374151' }}>Form Pengajuan Baru</h3>
        {msg && (
          <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`} style={{ marginBottom: '12px' }}>
            <i className={`fas fa-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="form-label">Jenis Pengajuan</label>
              <select name="keterangan" className="form-control" required>
                <option value="Izin">Izin</option>
                <option value="Sakit">Sakit</option>
                <option value="Cuti">Cuti</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 1' }} />
            <div>
              <label className="form-label">Tanggal Mulai</label>
              <input type="date" name="tgl_mulai" className="form-control" defaultValue={today} required />
            </div>
            <div>
              <label className="form-label">Tanggal Selesai</label>
              <input type="date" name="tgl_selesai" className="form-control" defaultValue={today} required />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Alasan / Keterangan</label>
            <textarea name="alasan" className="form-control" rows={3} placeholder="Jelaskan alasan pengajuan Anda..." required style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Mengirim...</> : <><i className="fas fa-paper-plane" /> Kirim Pengajuan</>}
          </button>
        </form>
      </div>

      {/* Riwayat */}
      <div className="card">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>Riwayat Pengajuan</h3>
        </div>
        {riwayat.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Belum ada pengajuan</div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Jenis</th><th>Periode</th><th>Alasan</th><th>Status</th></tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr key={r.id}>
                    <td><span className="badge badge-izin">{r.keterangan}</span></td>
                    <td style={{ fontSize: '0.78rem' }}>{r.tgl_mulai} s/d {r.tgl_selesai}</td>
                    <td style={{ maxWidth: '200px' }} className="text-truncate">{r.alasan}</td>
                    <td><span className={`badge ${statusBadgeMap[r.status ?? 'Proses'] ?? 'badge-proses'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
