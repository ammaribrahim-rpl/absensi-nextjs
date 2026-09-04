'use client';
// components/ui/LoginForm.tsx — Reusable login form component
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  role: 'owner' | 'admin' | 'karyawan';
  title: string;
  subtitle: string;
  iconClass: string;
  iconColor?: string;
  apiEndpoint: string;
  redirectTo: string;
  accentColor?: string;
  backHref?: string;
}

export default function LoginForm({
  role, title, subtitle, iconClass, iconColor,
  apiEndpoint, accentColor = '#4f46e5', backHref = '/',
}: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const username = fd.get('username') as string;
    const password = fd.get('password') as string;

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Login gagal. Coba lagi.');
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: `${accentColor}18`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <i className={iconClass} style={{ fontSize: '1.8rem', color: iconColor ?? accentColor }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', color: '#111827' }}>ABSENSI</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{subtitle}</p>
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
            <label className="form-label">
              <i className="fas fa-user" style={{ marginRight: '4px' }} /> Username
            </label>
            <input
              id={`${role}-username`}
              type="text" name="username"
              className="form-control"
              placeholder="Masukkan username"
              required autoFocus autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">
              <i className="fas fa-lock" style={{ marginRight: '4px' }} /> Password
            </label>
            <input
              id={`${role}-password`}
              type="password" name="password"
              className="form-control"
              placeholder="Masukkan password"
              required autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-block"
            disabled={loading}
            style={{ background: accentColor, color: '#fff', fontWeight: 700, padding: '12px', fontSize: '0.95rem' }}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin" /> Memproses...</>
            ) : (
              <><i className="fas fa-sign-in-alt" /> Masuk ke {title}</>
            )}
          </button>
        </form>

        {/* Divider + Back */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          color: '#9ca3af', fontSize: '0.75rem', margin: '20px 0',
        }}>
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
    </div>
  );
}
