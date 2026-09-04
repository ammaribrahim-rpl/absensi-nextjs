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
  const { data: owner, error } = await supabase
    .from('tb_owner').select('id, username, password, nama')
    .eq('username', username).single();

  if (error || !owner)
    return NextResponse.json({ error: 'Akun Owner tidak ditemukan.' }, { status: 401 });

  // Support $2y$ (PHP) dan $2b$ (Node.js)
  if (!(await comparePassword(password, owner.password)))
    return NextResponse.json({ error: 'Password yang Anda masukkan salah.' }, { status: 401 });

  await setSessionCookie({ role: 'owner', id: owner.id, username: owner.username, nama: owner.nama });
  return NextResponse.json({ success: true, redirect: '/owner/dashboard' });
}
