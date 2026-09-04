'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  ownerNama: string; periode: string; labelPeriode: string;
  stats: { totalKaryawan: number; totalAdmin: number; totalJabatan: number; izinProses: number; totalAbsen: number; absenTelat: number; };
  jabatanDist: Record<string, number>;
}

const periodeOptions = [
  { val: 'semua', label: 'Semua' }, { val: '1pekan', label: '1 Pekan' },
  { val: '1bulan', label: '1 Bulan' }, { val: '6bulan', label: '6 Bulan' },
  { val: '1tahun', label: '1 Tahun' },
];

export default function OwnerDashboardClient({ ownerNama, periode, labelPeriode, stats, jabatanDist }: Props) {
  const router = useRouter();
  const kpis = [
    { label: 'Total Karyawan',   val: stats.totalKaryawan, icon: 'fas fa-users',        bg: '#f3e8ff', color: '#7e22ce', href: '/owner/karyawan' },
    { label: 'Total Administrator', val: stats.totalAdmin, icon: 'fas fa-user-shield',  bg: '#ede9fe', color: '#4f46e5', href: '/owner/admin' },
    { label: 'Total Jabatan',    val: stats.totalJabatan,  icon: 'fas fa-briefcase',    bg: '#fef3c7', color: '#d97706', href: '/owner/jabatan' },
    { label: 'Izin Menunggu',    val: stats.izinProses,    icon: 'fas fa-clock',        bg: '#fee2e2', color: '#dc2626', href: '/owner/approval' },
    { label: 'Total Absensi',    val: stats.totalAbsen,    icon: 'fas fa-fingerprint',  bg: '#d1fae5', color: '#059669', href: '/owner/laporan' },
    { label: 'Keterlambatan',    val: stats.absenTelat,    icon: 'fas fa-exclamation-triangle', bg: '#fff7ed', color: '#ea580c', href: '/owner/laporan' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Dashboard Owner</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Selamat datang kembali, <strong>{ownerNama}</strong>
        </p>
      </div>
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>Periode:</span>
        {periodeOptions.map(p => (
          <button key={p.val} className={`period-pill${periode === p.val ? ' active' : ''}`}
            onClick={() => router.push(`/owner/dashboard?periode=${p.val}`)}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <Link key={k.label} href={k.href} style={{ textDecoration: 'none' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}><i className={k.icon} style={{ color: k.color }} /></div>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.val.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {Object.keys(jabatanDist).length > 0 && (
        <div className="card card-padded" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>
            <i className="fas fa-chart-bar" style={{ marginRight: '6px', color: '#7e22ce' }} />Distribusi Karyawan per Jabatan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(jabatanDist).sort((a,b) => b[1]-a[1]).map(([jab, jml]) => {
              const total = Object.values(jabatanDist).reduce((a,b) => a+b, 0);
              const pct = total > 0 ? Math.round((jml / total) * 100) : 0;
              return (
                <div key={jab}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600 }}>{jab}</span><span style={{ color: '#6b7280' }}>{jml} ({pct}%)</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '99px', height: '6px' }}>
                    <div style={{ width: `${pct}%`, background: '#7e22ce', borderRadius: '99px', height: '6px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        {[
          { href: '/owner/approval', icon: 'fas fa-check-circle', label: 'Approval Izin/Cuti', color: '#dc2626' },
          { href: '/owner/laporan',  icon: 'fas fa-file-alt',     label: 'Lihat Laporan',      color: '#4f46e5' },
          { href: '/owner/karyawan', icon: 'fas fa-user-plus',    label: 'Kelola Karyawan',    color: '#059669' },
        ].map(a => (
          <Link key={a.href} href={a.href} style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
            padding: '14px 16px', textDecoration: 'none', color: '#374151',
            display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '0.82rem',
          }}>
            <i className={a.icon} style={{ color: a.color }} />{a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
