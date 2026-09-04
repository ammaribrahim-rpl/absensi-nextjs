import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setSessionCookie } from '@/lib/auth/session';
import { comparePassword } from '@/lib/auth/bcrypt';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = (body?.username ?? '').trim();
  const password = (body?.password ?? '').trim();
  if (!username || !password)
    return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: admin, error } = await supabase
    .from('tb_daftar').select('id, username, password')
    .eq('username', username).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase query error (admin):', error);
    return NextResponse.json({ error: 'Gagal terhubung ke database. Pastikan konfigurasi Supabase di .env.local sudah benar.' }, { status: 500 });
  }

  if (!admin)
    return NextResponse.json({ error: 'Akun Administrator tidak ditemukan.' }, { status: 401 });

  if (!(await comparePassword(password, admin.password)))
    return NextResponse.json({ error: 'Password yang Anda masukkan salah.' }, { status: 401 });

  await setSessionCookie({ role: 'admin', id: admin.id, username: admin.username });
  return NextResponse.json({ success: true, redirect: '/admin/dashboard' });
}
