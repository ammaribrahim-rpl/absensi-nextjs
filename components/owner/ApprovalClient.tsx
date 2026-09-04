'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Keterangan } from '@/types/database';

export default function ApprovalClient({ data: initData, statusFilter }: { data: Keterangan[]; statusFilter: string }) {
  const router = useRouter();
  const [data, setData] = useState(initData);
  const [loading, setLoading] = useState<number | null>(null);

  async function handleAction(id: number, status: 'Disetujui' | 'Ditolak') {
    setLoading(id);
    const res = await fetch('/api/owner/approval', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      setData(prev => prev.filter(d => d.id !== id));
      router.refresh();
    }
    setLoading(null);
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 800 }}>
        <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#7e22ce' }} />Approval Izin / Cuti
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[['Proses', 'badge-proses'], ['Disetujui', 'badge-setuju'], ['Ditolak', 'badge-tolak']].map(([s, badge]) => (
          <button key={s} onClick={() => router.push(`/owner/approval?status=${s}`)}
            style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              background: statusFilter === s ? '#7e22ce' : '#f3f4f6', color: statusFilter === s ? '#fff' : '#374151' }}>
            {s}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="card card-padded" style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>
          <i className="fas fa-inbox" style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0 }}>Tidak ada pengajuan dengan status &quot;{statusFilter}&quot;</p>
        </div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Nama</th><th>Jenis</th><th>Periode</th><th>Alasan</th><th>Diajukan</th>{statusFilter === 'Proses' && <th>Aksi</th>}</tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.id}>
                  <td style={{ color: '#9ca3af' }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.nama}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{d.id_karyawan}</div>
                  </td>
                  <td><span className="badge badge-izin">{d.keterangan}</span></td>
                  <td style={{ fontSize: '0.78rem' }}>{d.tgl_mulai ? `${d.tgl_mulai} s/d ${d.tgl_selesai}` : '-'}</td>
                  <td style={{ maxWidth: '200px', fontSize: '0.82rem' }} className="text-truncate">{d.alasan}</td>
                  <td style={{ fontSize: '0.78rem', color: '#6b7280' }}>{new Date(d.waktu).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  {statusFilter === 'Proses' && (
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-success btn-sm" disabled={loading === d.id} onClick={() => handleAction(d.id, 'Disetujui')}>
                          {loading === d.id ? '...' : <><i className="fas fa-check" /> Setuju</>}
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={loading === d.id} onClick={() => handleAction(d.id, 'Ditolak')}>
                          {loading === d.id ? '...' : <><i className="fas fa-times" /> Tolak</>}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
