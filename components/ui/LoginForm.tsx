'use client';
// components/ui/LoginForm.tsx — Unified & reusable login form component with role tabs, show/hide password and forgot password modal
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export type RoleType = 'karyawan' | 'admin' | 'owner';

interface LoginFormProps {
  role?: RoleType;
  initialRole?: RoleType;
  allowRoleSwitch?: boolean;
  title?: string;
  subtitle?: string;
  iconClass?: string;
  iconColor?: string;
  apiEndpoint?: string;
  redirectTo?: string;
  accentColor?: string;
  backHref?: string;
}

const ROLE_CONFIG: Record<RoleType, {
  title: string;
  subtitle: string;
  iconClass: string;
  iconColor: string;
  apiEndpoint: string;
  redirectTo: string;
  accentColor: string;
  label: string;
}> = {
  karyawan: {
    title: 'Portal Karyawan',
    subtitle: 'Masuk sebagai Karyawan',
    iconClass: 'fas fa-users',
    iconColor: '#4f46e5',
    apiEndpoint: '/api/auth/karyawan',
    redirectTo: '/karyawan/dashboard',
    accentColor: '#4f46e5',
    label: 'Karyawan',
  },
  admin: {
    title: 'Administrator',
    subtitle: 'Masuk sebagai Administrator',
    iconClass: 'fas fa-user-shield',
    iconColor: '#2563eb',
    apiEndpoint: '/api/auth/admin',
    redirectTo: '/admin/dashboard',
    accentColor: '#2563eb',
    label: 'Admin',
  },
  owner: {
    title: 'Owner Executive',
    subtitle: 'Portal Login Owner Executive',
    iconClass: 'fas fa-crown',
    iconColor: '#7e22ce',
    apiEndpoint: '/api/auth/owner',
    redirectTo: '/owner/dashboard',
    accentColor: '#7e22ce',
    label: 'Owner',
  },
};

export default function LoginForm({
  role,
  initialRole,
  allowRoleSwitch,
  title,
  subtitle,
  iconClass,
  iconColor,
  apiEndpoint,
  accentColor,
  backHref = '/',
}: LoginFormProps) {
  const router = useRouter();

  // If role is provided and allowRoleSwitch is not explicitly true, default to false
  const canSwitch = allowRoleSwitch ?? (role ? false : true);
  const [activeRole, setActiveRole] = useState<RoleType>(role || initialRole || 'karyawan');

  const config = ROLE_CONFIG[activeRole];
  const effectiveAccent = accentColor || config.accentColor;
  const effectiveEndpoint = (canSwitch && !apiEndpoint) ? config.apiEndpoint : (apiEndpoint || config.apiEndpoint);
  const effectiveTitle = title || config.title;
  const effectiveSubtitle = subtitle || config.subtitle;
  const effectiveIcon = iconClass || config.iconClass;
  const effectiveIconColor = iconColor || config.iconColor;

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
    const username = fd.get('username') as string;
    const password = fd.get('password') as string;

    try {
      const res = await fetch(effectiveEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Login gagal. Periksa username dan password.');
        return;
      }
      router.push(data.redirect || config.redirectTo);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet Anda.');
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
          role: activeRole,
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
        {/* Role Selector Tabs (if allowRoleSwitch is true) */}
        {canSwitch && (
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '22px',
              gap: '4px',
            }}
          >
            {(['karyawan', 'admin', 'owner'] as RoleType[]).map((r) => {
              const cfg = ROLE_CONFIG[r];
              const active = activeRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setActiveRole(r);
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    border: 'none',
                    borderRadius: '8px',
                    background: active ? '#fff' : 'transparent',
                    color: active ? cfg.accentColor : '#64748b',
                    fontWeight: active ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <i className={cfg.iconClass} style={{ fontSize: '0.8rem' }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: `${effectiveAccent}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              transition: 'background 0.2s',
            }}
          >
            <i className={effectiveIcon} style={{ fontSize: '1.8rem', color: effectiveIconColor }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#111827' }}>ABSENSI</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{effectiveSubtitle}</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor={`${activeRole}-username`}>
              <i className="fas fa-user" style={{ marginRight: '4px' }} /> Username
            </label>
            <input
              id={`${activeRole}-username`}
              type="text"
              name="username"
              className="form-control"
              placeholder={`Masukkan username ${config.label.toLowerCase()}`}
              required
              autoFocus
              autoComplete="username"
              onChange={(e) => setForgotUsername(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor={`${activeRole}-password`}>
              <i className="fas fa-lock" style={{ marginRight: '4px' }} /> Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id={`${activeRole}-password`}
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-control"
                placeholder="Masukkan password"
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

            {/* Forgot Password Trigger (for Admin & Karyawan) */}
            {activeRole !== 'owner' && (
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: effectiveAccent,
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
            )}
          </div>

          <button
            type="submit"
            className="btn btn-block"
            disabled={loading}
            style={{ background: effectiveAccent, color: '#fff', fontWeight: 700, padding: '12px', fontSize: '0.95rem', marginTop: '8px', transition: 'background 0.2s' }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin" /> Memproses...</>
            ) : (
              <><i className="fas fa-sign-in-alt" /> Masuk ke {effectiveTitle}</>
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
            margin: '20px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          atau
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <a href={backHref} style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>
            <i className="fas fa-arrow-left" style={{ marginRight: '4px' }} />
            Kembali ke Beranda
          </a>
        </div>
      </div>

      {/* ── Modal Lupa Password ── */}
      {showForgot && (
        <div className="modal-backdrop" onClick={() => setShowForgot(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-question-circle" style={{ color: effectiveAccent }} />
                Permintaan Reset Password ({config.label})
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
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.4 }}>
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
                  <label className="form-label">Username Akun ({config.label})</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contoh: user / ammar / admin"
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
                    placeholder="Contoh: Saya lupa password login akun saya, mohon bantuannya..."
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
                  style={{ background: effectiveAccent, color: '#fff', fontWeight: 600 }}
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
