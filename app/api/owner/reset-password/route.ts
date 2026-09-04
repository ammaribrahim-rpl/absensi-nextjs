// app/api/owner/reset-password/route.ts — Reset password oleh Owner tanpa perlu password lama
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

async function checkOwner() {
  const s = await getSession();
  return s && s.role === 'owner' ? s : null;
}

// GET: Ambil daftar permintaan reset password yang belum diproses
export async function GET() {
  if (!(await checkOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('tb_notifikasi')
    .select('id, id_karyawan, nama, pesan, tipe, dibaca, created_at')
    .eq('tipe', 'lupa_password')
    .eq('dibaca', 0)
    .order('id', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil data notifikasi.' }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

// POST: Owner mereset password akun apa pun langsung tanpa password lama
export async function POST(request: NextRequest) {
  if (!(await checkOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);

  const { id_notifikasi, role, username, new_password } = body ?? {};
  if (!role || !username || !new_password) {
    return NextResponse.json(
      { error: 'Role, username, dan password baru wajib diisi.' },
      { status: 400 }
    );
  }

  if (typeof new_password !== 'string' || new_password.trim().length < 3) {
    return NextResponse.json(
      { error: 'Password baru minimal 3 karakter.' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const cleanPass = new_password.trim();

  if (role === 'karyawan') {
    const { error } = await supabase
      .from('tb_karyawan')
      .update({ password: cleanPass })
      .eq('username', username);

    if (error) return NextResponse.json({ error: 'Gagal mengupdate password karyawan.' }, { status: 500 });
  } else if (role === 'admin') {
    const { error } = await supabase
      .from('tb_daftar')
      .update({ password: cleanPass })
      .eq('username', username);

    if (error) return NextResponse.json({ error: 'Gagal mengupdate password administrator.' }, { status: 500 });
  } else if (role === 'owner') {
    const { error } = await supabase
      .from('tb_owner')
      .update({ password: cleanPass })
      .eq('username', username);

    if (error) return NextResponse.json({ error: 'Gagal mengupdate password owner.' }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
  }

  // Tandai notifikasi lupa password selesai dibaca jika ada
  if (id_notifikasi) {
    await supabase
      .from('tb_notifikasi')
      .update({ dibaca: 1 })
      .eq('id', Number(id_notifikasi));
  } else {
    // Tandai semua notifikasi lupa password untuk username ini sebagai dibaca
    await supabase
      .from('tb_notifikasi')
      .update({ dibaca: 1 })
      .eq('tipe', 'lupa_password')
      .ilike('pesan', `%${username}%`);
  }

  return NextResponse.json({
    success: true,
    message: `Password untuk akun "${username}" (${role}) berhasil diubah menjadi: ${cleanPass}`,
  });
}
