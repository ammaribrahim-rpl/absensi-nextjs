'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LaporanRow {
  id_karyawan: string; nama: string; jabatan: string; jenkel: string;
  tgl_masuk_formatted: string; masa_kerja: string;
  total_masuk: number; total_telat: number; total_pulang: number;
  total_izin: number; total_cuti: number;
}
interface DetailRow {
  record_type: string; record_id: number; id_karyawan: string; nama: string;
  kategori: string; tipe_absen: string | null; is_telat: number;
  waktu: string; waktu_str: string | null; alasan: string;
  status: string | null; tgl_mulai: string | null; tgl_selesai: string | null;
}

const periodeOpts = [
  { val: 'semua', label: 'Semua Waktu' }, { val: '1pekan', label: '1 Pekan' },
  { val: '1bulan', label: '1 Bulan' },   { val: '6bulan', label: '6 Bulan' },
  { val: '1tahun', label: '1 Tahun' },
];
const kategoriOpts = [
  { val: 'semua', label: 'Semua' }, { val: 'absen', label: 'Hadir/Masuk' },
  { val: 'telat', label: 'Terlambat' }, { val: 'pulang', label: 'Pulang' },
  { val: 'istirahat', label: 'Istirahat' }, { val: 'izin', label: 'Izin' },
  { val: 'cuti', label: 'Cuti/Sakit' },
];

function WaktuCell({ waktu }: { waktu: string }) {
  const d = new Date(waktu);
  if (isNaN(d.getTime())) return <span>{waktu}</span>;

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
        {d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
        {d.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB
      </div>
    </div>
  );
}

export default function LaporanClient({ data, jabatanOptions, karyawanOptions, filters }: {
  data: LaporanRow[];
  jabatanOptions: string[];
  karyawanOptions: { id_karyawan: string; nama: string }[];
  filters: { periode: string; jabatan: string; jenkel: string; q: string };
}) {
  const router = useRouter();
  const [view, setView] = useState<'rekap' | 'detail'>('rekap');
  const [detailData, setDetailData] = useState<DetailRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [kategori, setKategori] = useState('semua');
  const [filterId, setFilterId] = useState('semua');

  function applyFilter(key: string, val: string) {
    const p = new URLSearchParams({ ...filters, [key]: val });
    router.push(`/owner/laporan?${p.toString()}`);
  }

  async function loadDetail() {
    setDetailLoading(true);
    const p = new URLSearchParams({ mode: 'detail', periode: filters.periode, q: filters.q, kategori, id_karyawan: filterId });
    const res = await fetch(`/api/owner/laporan?${p.toString()}`);
    if (res.ok) { const d = await res.json(); setDetailData(d.data ?? []); }
    setDetailLoading(false);
  }

  async function handleDelete(type: string, id: number) {
    if (!confirm('Hapus record ini?')) return;
    await fetch(`/api/owner/laporan?type=${type}&id=${id}`, { method: 'DELETE' });
    setDetailData(prev => prev.filter(r => !(r.record_id === id && r.record_type === type)));
  }

  // Rekap summary totals
  const totalMasuk  = data.reduce((s, r) => s + r.total_masuk,  0);
  const totalTelat  = data.reduce((s, r) => s + r.total_telat,  0);
  const totalIzin   = data.reduce((s, r) => s + r.total_izin,   0);
  const totalCuti   = data.reduce((s, r) => s + r.total_cuti,   0);

  const badgeKat: Record<string, string> = {
    'Hadir': 'badge-hadir', 'Telat Masuk': 'badge-telat', 'Pulang': 'badge-proses',
    'Mulai Istirahat': 'badge-proses', 'Kembali Istirahat': 'badge-proses',
    'Istirahat (Telat)': 'badge-telat', 'Kembali (Telat)': 'badge-telat',
    'Izin': 'badge-izin', 'Cuti': 'badge-cuti',
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
          <i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#7e22ce' }} />Laporan Kehadiran
        </h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a href="/api/export/excel" className="btn btn-success btn-sm"><i className="fas fa-file-csv" /> Export CSV</a>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}><i className="fas fa-print" /> Print</button>
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button onClick={() => setView('rekap')} className={`btn btn-sm ${view === 'rekap' ? 'btn-owner' : 'btn-outline'}`}>
          <i className="fas fa-table" /> Rekap
        </button>
        <button onClick={() => { setView('detail'); loadDetail(); }} className={`btn btn-sm ${view === 'detail' ? 'btn-owner' : 'btn-outline'}`}>
          <i className="fas fa-list" /> Detail Record
        </button>
      </div>

      {/* Filters */}
      <div className="card card-padded" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label className="form-label">Periode</label>
            <select className="form-control" style={{ width: '150px' }} value={filters.periode} onChange={e => applyFilter('periode', e.target.value)}>
              {periodeOpts.map(p => <option key={p.val} value={p.val}>{p.label}</option>)}
            </select>
          </div>
          {view === 'rekap' && (
            <>
              <div>
                <label className="form-label">Jabatan</label>
                <select className="form-control" style={{ width: '170px' }} value={filters.jabatan} onChange={e => applyFilter('jabatan', e.target.value)}>
                  <option value="">Semua</option>
                  {jabatanOptions.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Kelamin</label>
                <select className="form-control" style={{ width: '130px' }} value={filters.jenkel} onChange={e => applyFilter('jenkel', e.target.value)}>
                  <option value="">Semua</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Cari Nama</label>
                <input className="form-control" style={{ maxWidth: '240px' }} value={filters.q}
                  onChange={e => applyFilter('q', e.target.value)} placeholder="Cari nama..." />
              </div>
            </>
          )}
          {view === 'detail' && (
            <>
              <div>
                <label className="form-label">Kategori</label>
                <select className="form-control" style={{ width: '170px' }} value={kategori} onChange={e => setKategori(e.target.value)}>
                  {kategoriOpts.map(k => <option key={k.val} value={k.val}>{k.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Karyawan</label>
                <select className="form-control" style={{ width: '200px' }} value={filterId} onChange={e => setFilterId(e.target.value)}>
                  <option value="semua">Semua Karyawan</option>
                  {karyawanOptions.map(k => <option key={k.id_karyawan} value={k.id_karyawan}>{k.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">&nbsp;</label>
                <button className="btn btn-owner btn-sm" onClick={loadDetail} disabled={detailLoading}>
                  {detailLoading ? <><i className="fas fa-spinner fa-spin" /> Loading...</> : <><i className="fas fa-filter" /> Terapkan</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── VIEW REKAP ──────────────────────────────────────────────────────── */}
      {view === 'rekap' && (
        <>
          {/* Summary Badges */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { label: 'Karyawan', val: data.length,  icon: 'fas fa-users',        color: '#7e22ce', bg: '#f3e8ff' },
              { label: 'Total Masuk', val: totalMasuk, icon: 'fas fa-sign-in-alt', color: '#059669', bg: '#d1fae5' },
              { label: 'Terlambat',  val: totalTelat,  icon: 'fas fa-clock',        color: '#d97706', bg: '#fef3c7' },
              { label: 'Izin',       val: totalIzin,   icon: 'fas fa-calendar-times', color: '#4f46e5', bg: '#eef2ff' },
              { label: 'Cuti/Sakit', val: totalCuti,   icon: 'fas fa-bed',          color: '#dc2626', bg: '#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={s.icon} style={{ color: s.color }} />
                <div>
                  <div style={{ fontSize: '0.65rem', color: s.color, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827' }}>{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No</th><th>Nama Karyawan</th><th>Jabatan</th><th>Bergabung</th><th>Masa Kerja</th>
                  <th style={{ color: '#059669' }}>Masuk</th>
                  <th style={{ color: '#d97706' }}>Telat</th>
                  <th style={{ color: '#4f46e5' }}>Izin</th>
                  <th style={{ color: '#dc2626' }}>Cuti/Sakit</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Tidak ada data</td></tr>
                ) : data.map((r, i) => (
                  <tr key={r.id_karyawan}>
                    <td style={{ color: '#9ca3af' }}>{i+1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.nama}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{r.jenkel}</div>
                    </td>
                    <td><span className="badge badge-jabatan">{r.jabatan}</span></td>
                    <td style={{ fontSize: '0.78rem' }}>{r.tgl_masuk_formatted}</td>
                    <td style={{ fontSize: '0.78rem' }}>{r.masa_kerja}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>{r.total_masuk}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: r.total_telat > 0 ? '#d97706' : '#9ca3af' }}>{r.total_telat}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: r.total_izin > 0 ? '#4f46e5' : '#9ca3af' }}>{r.total_izin}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: r.total_cuti > 0 ? '#dc2626' : '#9ca3af' }}>{r.total_cuti}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── VIEW DETAIL ─────────────────────────────────────────────────────── */}
      {view === 'detail' && (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr><th>#</th><th>Nama</th><th>Kategori</th><th>Waktu/Tanggal</th><th>Keterangan</th><th>Hapus</th></tr>
            </thead>
            <tbody>
              {detailLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }} />Memuat data...
                </td></tr>
              ) : detailData.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  Klik &quot;Terapkan&quot; untuk memuat data detail
                </td></tr>
              ) : detailData.map((r, i) => (
                <tr key={`${r.record_type}-${r.record_id}`}>
                  <td style={{ color: '#9ca3af' }}>{i+1}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.nama}</div>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{r.id_karyawan}</div>
                  </td>
                  <td>
                    <span className={`badge ${badgeKat[r.kategori] ?? 'badge-proses'}`}>{r.kategori}</span>
                    {r.is_telat === 1 && r.record_type === 'absen' && (
                      <span className="badge badge-telat" style={{ marginLeft: '4px' }}>Telat</span>
                    )}
                  </td>
                  <td><WaktuCell waktu={r.waktu} /></td>
                  <td style={{ fontSize: '0.82rem', maxWidth: '200px' }} className="text-truncate">
                    {r.record_type === 'keterangan'
                      ? <>{r.tgl_mulai} s/d {r.tgl_selesai} — {r.alasan} <span className={`badge ${r.status === 'Disetujui' ? 'badge-setuju' : r.status === 'Ditolak' ? 'badge-tolak' : 'badge-proses'}`}>{r.status}</span></>
                      : r.waktu_str || '-'}
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(r.record_type === 'keterangan' ? 'ket' : 'absen', r.record_id)}>
                      <i className="fas fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {detailData.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#6b7280' }}>
              Menampilkan {detailData.length} record
            </div>
          )}
        </div>
      )}
    </div>
  );
}
