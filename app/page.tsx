// app/page.tsx — Landing Page: pilih portal (Owner / Admin / Karyawan)
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Absensi — Portal Login System',
  description: 'Pilih portal login sesuai role Anda: Owner, Administrator, atau Karyawan.',
};

export default function LandingPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #170d2b 0%, #2e1065 40%, #1e1b4b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '18px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '44px 36px',
        textAlign: 'center',
        maxWidth: '410px', width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
      }}>
        {/* Icon */}
        <div style={{ fontSize: '2.6rem', color: '#818cf8', marginBottom: '12px' }}>
          <i className="fas fa-fingerprint" />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff', margin: '0 0 4px' }}>
          ABSENSI
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', margin: '0 0 32px' }}>
          Sistem Manajemen Presensi Terintegrasi
        </p>

        {/* Single Login Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '14px 24px', borderRadius: '12px', textDecoration: 'none',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            boxShadow: '0 6px 22px rgba(79,70,229,0.45)',
            fontWeight: 700, fontSize: '1rem',
            letterSpacing: '0.02em',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}>
            <i className="fas fa-sign-in-alt" style={{ fontSize: '1.1rem' }} />
            Masuk / Login
          </Link>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', marginTop: '24px', marginBottom: 0 }}>
          © 2024 Absensi Management System
        </p>
      </div>
    </main>
  );
}
