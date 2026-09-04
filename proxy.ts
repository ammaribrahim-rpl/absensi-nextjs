// proxy.ts — Route protection (previously middleware.ts)
// Next.js 16: export named "proxy" instead of "middleware"
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import type { SessionPayload } from '@/types/session';

const SESSION_COOKIE = 'absensi_session';

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-production');
}

async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Aturan proteksi per path ──────────────────────────────────────────────
  const isOwnerPath    = pathname.startsWith('/owner') && pathname !== '/owner/login';
  const isAdminPath    = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isKaryawanPath = pathname.startsWith('/karyawan') && pathname !== '/karyawan/login';

  // Public API routes abaikan
  if (pathname.startsWith('/api/auth/')) return NextResponse.next();

  if (!isOwnerPath && !isAdminPath && !isKaryawanPath) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);

  // ── Tidak ada session → redirect ke login ────────────────────────────────
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Session ada tapi role tidak cocok → redirect ke login ────────────────
  if (isOwnerPath    && session.role !== 'owner')    return NextResponse.redirect(new URL('/login', request.url));
  if (isAdminPath    && session.role !== 'admin')    return NextResponse.redirect(new URL('/login', request.url));
  if (isKaryawanPath && session.role !== 'karyawan') return NextResponse.redirect(new URL('/login', request.url));

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/owner/:path*',
    '/admin/:path*',
    '/karyawan/:path*',
  ],
};
