'use client';
// components/layout/Sidebar.tsx — Reusable sidebar with mobile toggle
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface SidebarProps {
  logoText: string;
  logoIcon: string;
  logoColor?: string;
  navItems: NavItem[];
  role: 'owner' | 'admin' | 'karyawan';
  userName?: string;
  userBadge?: string;
  badgeColor?: string;
}

export default function Sidebar({ logoText, logoIcon, logoColor = '#c084fc', navItems, role, userName, userBadge, badgeColor = '#7e22ce' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar') && !target.closest('.hamburger-btn')) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <header style={{
        display: 'none',
        position: 'sticky', top: 0, zIndex: 50,
        background: '#170d2b',
        padding: '12px 16px',
        alignItems: 'center', justifyContent: 'space-between',
      }} className="mobile-header">
        <Link href={navItems[0]?.href ?? '/'} style={{ color: '#fff', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className={logoIcon} style={{ color: logoColor }} />
          {logoText}
        </Link>
        <button
          className="hamburger-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', padding: '4px 8px' }}
        >
          <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'} />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <Link href={navItems[0]?.href ?? '/'} className="sidebar-logo">
          <i className={logoIcon} style={{ color: logoColor, fontSize: '1.1rem' }} />
          {logoText}
        </Link>

        {/* User Info */}
        {userName && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="avatar avatar-sm" style={{ background: `${badgeColor}30`, color: badgeColor }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>{userName}</div>
                {userBadge && (
                  <div style={{
                    fontSize: '0.65rem', color: badgeColor, fontWeight: 700,
                    background: `${badgeColor}20`, padding: '1px 6px', borderRadius: '99px',
                    border: `1px solid ${badgeColor}40`, display: 'inline-block', marginTop: '2px',
                  }}>{userBadge}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}
            >
              <i className={item.icon} style={{ width: '16px', textAlign: 'center' }} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              width: '100%', padding: '10px 16px',
              background: 'rgba(220,38,38,0.15)', color: '#fca5a5',
              border: 'none', borderRadius: '6px', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.15s',
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: '16px' }} />
            {loggingOut ? 'Keluar...' : `Logout ${role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : ''}`}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 35, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      <style>{`
        @media (max-width: 1023px) {
          .mobile-header { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
}
