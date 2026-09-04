'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LupaPassRequest {
  id: number;
  id_karyawan: string;
  nama: string;
  pesan: string;
  created_at: string;
}

interface Props {
  ownerNama: string;
  periode: string;
  labelPeriode: string;
  stats: {
    totalKaryawan: number;
    totalAdmin: number;
    totalJabatan: number;
    izinProses: number;
    totalAbsen: number;
    absenTelat: number;
  };
  jabatanDist: Record<string, number>;
  lupaPassRequests?: LupaPassRequest[];
}

const periodeOptions = [
  { val: 'semua', label: 'Semua' },
  { val: '1pekan', label: '1 Pekan' },
  { val: '1bulan', label: '1 Bulan' },
  { val: '6bulan', label: '6 Bulan' },
  { val: '1tahun', label: '1 Tahun' },
];

export default function OwnerDashboardClient({
  ownerNama,
  periode,
  labelPeriode,
  stats,
  jabatanDist,
  lupaPassRequests: initRequests = [],
}: Props) {
  const router = useRouter();
  const [requests, setRequests] = useState<LupaPassRequest[]>(initRequests);

  // Modal reset password state
  const [selectedReq, setSelectedReq] = useState<LupaPassRequest | null>(null);
  const [customResetOpen, setCustomResetOpen] = useState(false);
  const [resetRole, setResetRole] = useState<'karyawan' | 'admin'>('karyawan');
  const [resetUsername, setResetUsername] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const kpis = [
    { label: 'Total Karyawan', val: stats.totalKaryawan, icon: 'fas fa-users', bg: '#f3e8ff', color: '#7e22ce', href: '/owner/karyawan' },
    { label: 'Total Administrator', val: stats.totalAdmin, icon: 'fas fa-user-shield', bg: '#ede9fe', color: '#4f46e5', href: '/owner/admin' },
    { label: 'Total Jabatan', val: stats.totalJabatan, icon: 'fas fa-briefcase', bg: '#fef3c7', color: '#d97706', href: '/owner/jabatan' },
    { label: 'Izin Menunggu', val: stats.izinProses, icon: 'fas fa-clock', bg: '#fee2e2', color: '#dc2626', href: '/owner/approval' },
    { label: 'Total Absensi', val: stats.totalAbsen, icon: 'fas fa-fingerprint', bg: '#d1fae5', color: '#059669', href: '/owner/laporan' },
    { label: 'Keterlambatan', val: stats.absenTelat, icon: 'fas fa-exclamation-triangle', bg: '#fff7ed', color: '#ea580c', href: '/owner/laporan' },
  ];

  function openResetFromReq(req: LupaPassRequest) {
    setSelectedReq(req);
    // Parse role and username from message
    const isAdm = req.pesan.toLowerCase().includes('admin');
    const match = req.pesan.match(/"([^"]+)"/);
    setResetRole(isAdm ? 'admin' : 'karyawan');
    setResetUsername(match ? match[1] : req.nama);
    setNewPass('');
    setMsg(null);
  }

  async function handleExecuteReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUsername.trim() || !newPass.trim()) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/owner/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_notifikasi: selectedReq ? selectedReq.id : undefined,
          role: resetRole,
          username: resetUsername.trim(),
          new_password: newPass.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMsg({ type: 'success', text: data.message });
        if (selectedReq) {
          setRequests((prev) => prev.filter((r) => r.id !== selectedReq.id));
        }
        setTimeout(() => {
          setSelectedReq(null);
          setCustomResetOpen(false);
          setNewPass('');
          router.refresh();
        }, 1200);
      } else {
        setMsg({ type: 'error', text: data.error ?? 'Gagal mereset password.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Dashboard Owner</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
          Selamat datang kembali, <strong>{ownerNama}</strong>
        </p>
      </div>

      {/* ── Banner Permintaan Lupa Password ── */}
      {requests.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '20px',
            border: '1px solid #fed7aa',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            padding: '16px 20px',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#ea580c',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                <i className="fas fa-key" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#9a3412' }}>
                  Permintaan Reset Password ({requests.length})
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#c2410c' }}>
                  Karyawan atau Administrator meminta bantuan reset password ke Owner.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: '#fff',
                  border: '1px solid #fed7aa',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                    {req.pesan}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Waktu: {new Date(req.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  onClick={() => openResetFromReq(req)}
                  style={{ fontWeight: 700 }}
                >
                  <i className="fas fa-key" /> Reset Password
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter Periode ── */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginRight: '4px' }}>
          Periode:
        </span>
        {periodeOptions.map((p) => (
          <button
            key={p.val}
            className={`period-pill${periode === p.val ? ' active' : ''}`}
            onClick={() => router.push(`/owner/dashboard?periode=${p.val}`)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} style={{ textDecoration: 'none' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: k.bg }}>
                <i className={k.icon} style={{ color: k.color }} />
              </div>
              <div>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value">{k.val.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Distribusi Jabatan ── */}
      {Object.keys(jabatanDist).length > 0 && (
        <div className="card card-padded" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.875rem', fontWeight: 700, color: '#374151' }}>
            <i className="fas fa-chart-bar" style={{ marginRight: '6px', color: '#7e22ce' }} />
            Distribusi Karyawan per Jabatan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(jabatanDist)
              .sort((a, b) => b[1] - a[1])
              .map(([jab, jml]) => {
                const total = Object.values(jabatanDist).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((jml / total) * 100) : 0;
                return (
                  <div key={jab}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 600 }}>{jab}</span>
                      <span style={{ color: '#6b7280' }}>
                        {jml} ({pct}%)
                      </span>
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

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
        {[
          { href: '/owner/approval', icon: 'fas fa-check-circle', label: 'Approval Izin/Cuti', color: '#dc2626' },
          { href: '/owner/laporan', icon: 'fas fa-file-alt', label: 'Lihat Laporan', color: '#4f46e5' },
          { href: '/owner/karyawan', icon: 'fas fa-user-plus', label: 'Kelola Karyawan', color: '#059669' },
          { href: '/owner/admin', icon: 'fas fa-user-shield', label: 'Kelola Admin', color: '#7e22ce' },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '14px 16px',
              textDecoration: 'none',
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.82rem',
            }}
          >
            <i className={a.icon} style={{ color: a.color }} />
            {a.label}
          </Link>
        ))}

        {/* Quick Modal Reset Password Button */}
        <button
          type="button"
          onClick={() => {
            setSelectedReq(null);
            setResetRole('karyawan');
            setResetUsername('');
            setNewPass('');
            setMsg(null);
            setCustomResetOpen(true);
          }}
          style={{
            background: '#fff',
            border: '1px dashed #d97706',
            borderRadius: '10px',
            padding: '14px 16px',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          <i className="fas fa-key" style={{ color: '#d97706' }} />
          Reset Password Bebas
        </button>
      </div>

      {/* ── Modal Reset Password oleh Owner ── */}
      {(selectedReq || customResetOpen) && (
        <div className="modal-backdrop" onClick={() => { setSelectedReq(null); setCustomResetOpen(false); }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-key" style={{ color: '#7e22ce' }} />
                Reset Password {selectedReq ? `Akun: ${resetUsername}` : 'Akun'}
              </h3>
              <button
                type="button"
                onClick={() => { setSelectedReq(null); setCustomResetOpen(false); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleExecuteReset}>
              <div className="modal-body">
                <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.4 }}>
                  Sebagai <strong>Owner</strong>, Anda dapat menetapkan password baru secara langsung tanpa perlu mengetahui password lama.
                </p>

                {msg && (
                  <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '14px' }}>
                    <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
                    <span>{msg.text}</span>
                  </div>
                )}

                {customResetOpen && (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <label className="form-label">Tipe Akun</label>
                      <select
                        className="form-control"
                        value={resetRole}
                        onChange={(e) => setResetRole(e.target.value as 'karyawan' | 'admin')}
                      >
                        <option value="karyawan">Karyawan</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label className="form-label">Username Akun</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Masukkan username"
                        value={resetUsername}
                        onChange={(e) => setResetUsername(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label">Password Baru</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Masukkan password baru"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      minLength={3}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        padding: '4px',
                        fontSize: '0.95rem',
                      }}
                    >
                      <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => { setSelectedReq(null); setCustomResetOpen(false); }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-owner btn-sm"
                  disabled={loading || !newPass.trim()}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin" /> Menyimpan...</>
                  ) : (
                    <><i className="fas fa-save" /> Simpan Password Baru</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
