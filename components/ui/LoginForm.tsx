'use client';
// components/ui/LoginForm.tsx — 1 Unified Login Form for all roles (Owner, Admin, Karyawan)
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  backHref?: string;
}

export default function LoginForm({ backHref = '/' }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotAlasan, setForgotAlasan] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const username = (fd.get('username') as string)?.trim();
    const password = (fd.get('password') as string)?.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Login gagal. Periksa username dan password.');
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan jaringan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg(null);

    try {
      const res = await fetch('/api/auth/lupa-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername.trim(),
          alasan: forgotAlasan.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setForgotMsg({ type: 'success', text: data.message });
        setForgotAlasan('');
      } else {
        setForgotMsg({ type: 'error', text: data.error ?? 'Gagal mengirim permintaan.' });
      }
    } catch {
      setForgotMsg({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(99, 102, 241, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <i className="fas fa-fingerprint" style={{ fontSize: '1.9rem', color: '#4f46e5' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px', color: '#111827', letterSpacing: '-0.02em' }}>
            ABSENSI
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Sistem Manajemen Presensi Terintegrasi
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="login-username">
              <i className="fas fa-user" style={{ marginRight: '6px', color: '#6366f1' }} /> Username
            </label>
            <input
              id="login-username"
              type="text"
              name="username"
              className="form-control"
              placeholder="Masukkan username Anda"
              required
              autoFocus
              autoComplete="username"
              onChange={(e) => setForgotUsername(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="login-password">
              <i className="fas fa-lock" style={{ marginRight: '6px', color: '#6366f1' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                placeholder="Masukkan password Anda"
                required
                autoComplete="current-password"
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  fontSize: '1rem',
                }}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setForgotMsg(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Lupa Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-block"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              fontWeight: 700,
              padding: '13px',
              fontSize: '0.95rem',
              marginTop: '10px',
              border: 'none',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin" /> Memeriksa akun...</>
            ) : (
              <><i className="fas fa-sign-in-alt" /> Masuk ke Sistem</>
            )}
          </button>
        </form>

        {/* Divider + Back */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#9ca3af',
            fontSize: '0.75rem',
            margin: '22px 0 16px',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          atau
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <a href={backHref} style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '5px' }} />
            Kembali ke Beranda
          </a>
        </div>
      </div>

      {/* ── Modal Lupa Password ── */}
      {showForgot && (
        <div className="modal-backdrop" onClick={() => setShowForgot(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-question-circle" style={{ color: '#4f46e5' }} />
                Permintaan Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleForgotSubmit}>
              <div className="modal-body">
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.45 }}>
                  Kirimkan permintaan reset password ke <strong>Owner</strong>. Owner akan menerima notifikasi dan dapat mereset password akun Anda secara langsung.
                </p>

                {forgotMsg && (
                  <div
                    className={`alert ${forgotMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}
                    style={{ marginBottom: '14px' }}
                  >
                    <i className={`fas ${forgotMsg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
                    <span>{forgotMsg.text}</span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label className="form-label">Username Akun *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Masukkan username Anda"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <label className="form-label">Catatan / Alasan (Opsional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Contoh: Lupa password akun saya, mohon bantuannya..."
                    value={forgotAlasan}
                    onChange={(e) => setForgotAlasan(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowForgot(false)}
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  disabled={forgotLoading || !forgotUsername.trim()}
                  style={{ background: '#4f46e5', color: '#fff', fontWeight: 600 }}
                >
                  {forgotLoading ? (
                    <><i className="fas fa-spinner fa-spin" /> Mengirim...</>
                  ) : (
                    <><i className="fas fa-paper-plane" /> Kirim ke Owner</>
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
