'use client';
// components/layout/Sidebar.tsx — Modern responsive sidebar, mobile header, and bottom navigation
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

export default function Sidebar({
  logoText,
  logoIcon,
  logoColor = '#c084fc',
  navItems,
  role,
  userName,
  userBadge,
  badgeColor = '#7e22ce',
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close when pathname changes (render-time state adjustment)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);


  // Karyawan quick navigation items for mobile bottom bar
  const karyawanBottomItems = [
    { href: '/karyawan/dashboard', icon: 'fas fa-fingerprint', label: 'Absen' },
    { href: '/karyawan/izin', icon: 'fas fa-calendar-alt', label: 'Izin' },
    { href: '/karyawan/notifikasi', icon: 'fas fa-bell', label: 'Notifikasi' },
    { href: '/karyawan/profil', icon: 'fas fa-user-circle', label: 'Profil' },
  ];

  return (
    <>
      {/* ── Mobile & Tablet Header Bar (Visible on screens < 1024px) ── */}
      <header className="mobile-header">
        <Link
          href={navItems[0]?.href ?? '/'}
          style={{
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: '1.05rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: `${logoColor}22`,
              border: `1px solid ${logoColor}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className={logoIcon} style={{ color: logoColor, fontSize: '1.1rem' }} />
          </div>
          <span>{logoText}</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userBadge && (
            <span
              style={{
                fontSize: '0.68rem',
                color: '#fff',
                fontWeight: 700,
                background: `${badgeColor}33`,
                border: `1px solid ${badgeColor}66`,
                padding: '3px 8px',
                borderRadius: '99px',
                display: 'inline-block',
              }}
            >
              {userBadge}
            </span>
          )}

          <button
            className="hamburger-btn"
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            <i className={mobileOpen ? 'fas fa-times' : 'fas fa-bars'} />
          </button>
        </div>
      </header>

      {/* ── Sidebar (Desktop Fixed Sidebar & Mobile/Tablet Slide-over Drawer) ── */}
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Drawer Header with Logo & Mobile Close Button */}
        <div className="sidebar-logo">
          <Link
            href={navItems[0]?.href ?? '/'}
            style={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: 1,
            }}
            onClick={() => setMobileOpen(false)}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `${logoColor}25`,
                border: `1px solid ${logoColor}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className={logoIcon} style={{ color: logoColor, fontSize: '1.05rem' }} />
            </div>
            <span>{logoText}</span>
          </Link>

          {/* Close button for Mobile/Tablet drawer */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu navigasi"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {/* User Profile Card */}
        {userName && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="avatar avatar-sm"
                style={{
                  background: `${badgeColor}33`,
                  color: '#fff',
                  border: `1px solid ${badgeColor}55`,
                  fontWeight: 700,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userName}
                </div>
                {userBadge && (
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#e2e8f0',
                      fontWeight: 700,
                      background: `${badgeColor}30`,
                      padding: '1px 7px',
                      borderRadius: '99px',
                      border: `1px solid ${badgeColor}50`,
                      display: 'inline-block',
                      marginTop: '3px',
                    }}
                  >
                    {userBadge}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'active' : ''}
                onClick={() => setMobileOpen(false)}
              >
                <i className={item.icon} style={{ width: '18px', textAlign: 'center', fontSize: '0.95rem' }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

      </aside>

      {/* ── Mobile Overlay Backdrop ── */}
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Karyawan Bottom Navigation Bar (Mobile < 768px) ── */}
      {role === 'karyawan' && (
        <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah">
          {karyawanBottomItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/karyawan/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? 'active' : ''}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
