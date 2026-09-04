// app/api/auth/login/route.ts — Unified Login Route for all roles (Owner, Admin, Karyawan)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { setSessionCookie } from '@/lib/auth/session';
import { comparePassword } from '@/lib/auth/bcrypt';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const username = (body?.username ?? '').trim();
  const password = (body?.password ?? '').trim();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Cek tb_owner
  const { data: owner, error: ownerErr } = await supabase
    .from('tb_owner')
    .select('id, username, password, nama')
    .eq('username', username)
    .single();

  if (ownerErr && ownerErr.code !== 'PGRST116') {
    console.error('Supabase query error (owner check):', ownerErr);
  }

  if (owner) {
    if (await comparePassword(password, owner.password)) {
      await setSessionCookie({ role: 'owner', id: owner.id, username: owner.username, nama: owner.nama });
      return NextResponse.json({ success: true, redirect: '/owner/dashboard' });
    }
    return NextResponse.json({ error: 'Password yang Anda masukkan salah.' }, { status: 401 });
  }

  // 2. Cek tb_daftar (Administrator)
  const { data: admin, error: adminErr } = await supabase
    .from('tb_daftar')
    .select('id, username, password')
    .eq('username', username)
    .single();

  if (adminErr && adminErr.code !== 'PGRST116') {
    console.error('Supabase query error (admin check):', adminErr);
  }

  if (admin) {
    if (await comparePassword(password, admin.password)) {
      await setSessionCookie({ role: 'admin', id: admin.id, username: admin.username });
      return NextResponse.json({ success: true, redirect: '/admin/dashboard' });
    }
    return NextResponse.json({ error: 'Password yang Anda masukkan salah.' }, { status: 401 });
  }

  // 3. Cek tb_karyawan
  const { data: k, error: karyErr } = await supabase
    .from('tb_karyawan')
    .select('id_karyawan, username, password, nama, jabatan, jenkel, agama, alamat, no_tel, tmp_tgl_lahir, foto, tgl_masuk')
    .eq('username', username)
    .single();

  if (karyErr && karyErr.code !== 'PGRST116') {
    console.error('Supabase query error (karyawan check):', karyErr);
  }

  if (k) {
    if (await comparePassword(password, k.password)) {
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
    return NextResponse.json({ error: 'Password yang Anda masukkan salah.' }, { status: 401 });
  }

  // Jika tidak ditemukan di tabel mana pun
  return NextResponse.json({ error: 'Akun dengan username tersebut tidak ditemukan.' }, { status: 401 });
}
