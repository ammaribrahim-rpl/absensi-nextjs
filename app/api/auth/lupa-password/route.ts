// app/api/auth/lupa-password/route.ts — Permintaan lupa password untuk Admin & Karyawan
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const role = body?.role;
  const username = (body?.username ?? '').trim();
  const alasan = (body?.alasan ?? '').trim();

  if (!role || !username) {
    return NextResponse.json(
      { error: 'Role dan username wajib diisi.' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let idTarget = '';
  let namaTarget = '';

  if (role === 'karyawan') {
    const { data: k, error } = await supabase
      .from('tb_karyawan')
      .select('id_karyawan, username, nama')
      .eq('username', username)
      .single();

    if (error || !k) {
      return NextResponse.json(
        { error: `Akun karyawan dengan username "${username}" tidak ditemukan.` },
        { status: 404 }
      );
    }
    idTarget = k.id_karyawan;
    namaTarget = k.nama || k.username;
  } else if (role === 'admin') {
    const { data: a, error } = await supabase
      .from('tb_daftar')
      .select('id, username')
      .eq('username', username)
      .single();

    if (error || !a) {
      return NextResponse.json(
        { error: `Akun administrator dengan username "${username}" tidak ditemukan.` },
        { status: 404 }
      );
    }
    idTarget = `admin_${a.id}`;
    namaTarget = `Admin ${a.username}`;
  } else {
    return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
  }

  const pesanNotif = `[Permintaan Reset Password] Akun ${role.toUpperCase()} "${username}" (${namaTarget}) meminta reset password.${alasan ? ' Catatan: ' + alasan : ''}`;

  const { error: notifError } = await supabase.from('tb_notifikasi').insert({
    id_karyawan: idTarget,
    nama: namaTarget,
    tipe: 'lupa_password',
    pesan: pesanNotif,
    dibaca: 0,
  });

  if (notifError) {
    console.error('Gagal membuat notifikasi lupa password:', notifError);
    return NextResponse.json(
      { error: 'Gagal mengirim permintaan ke Owner.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Permintaan reset password berhasil dikirim ke Owner. Owner akan memproses dan menetapkan password baru untuk Anda.',
  });
}
