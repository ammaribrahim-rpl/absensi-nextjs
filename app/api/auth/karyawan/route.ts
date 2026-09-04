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
  const { data: k, error } = await supabase
    .from('tb_karyawan')
    .select('id_karyawan, username, password, nama, jabatan, jenkel, agama, alamat, no_tel, tmp_tgl_lahir, foto, tgl_masuk')
    .eq('username', username).single();

  if (error && error.code !== 'PGRST116') {
    console.error('Supabase query error (karyawan):', error);
    return NextResponse.json({ error: 'Gagal terhubung ke database. Pastikan konfigurasi Supabase di .env.local sudah benar.' }, { status: 500 });
  }

  if (!k)
    return NextResponse.json({ error: 'Akun karyawan tidak ditemukan.' }, { status: 401 });

  if (!(await comparePassword(password, k.password)))
    return NextResponse.json({ error: 'Password yang Anda masukkan salah.' }, { status: 401 });

  await setSessionCookie({
    role: 'karyawan',
    id_karyawan:   k.id_karyawan,
    username:      k.username,
    nama:          k.nama,
    jabatan:       k.jabatan,
    jenkel:        k.jenkel,
    agama:         k.agama,
    alamat:        k.alamat,
    no_tel:        k.no_tel,
    tmp_tgl_lahir: k.tmp_tgl_lahir,
    foto:          k.foto,
    tgl_masuk:     k.tgl_masuk,
  });
  return NextResponse.json({ success: true, redirect: '/karyawan/dashboard' });
}
