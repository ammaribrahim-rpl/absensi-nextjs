// app/api/karyawan/profil/route.ts — Update profil karyawan
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession, setSessionCookie } from '@/lib/auth/session';
import { comparePassword, hashPassword } from '@/lib/auth/bcrypt';

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const supabase = createAdminClient();

  const body = await request.json().catch(() => null);
  const field = body?.field;

  if (field === 'password') {
    const { pass_lama, pass_baru, konfirmasi } = body;
    if (!pass_lama || !pass_baru || !konfirmasi)
      return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 });
    if (pass_baru !== konfirmasi)
      return NextResponse.json({ error: 'Konfirmasi password tidak cocok.' }, { status: 400 });
    if (pass_baru.length < 6)
      return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });

    const { data: row } = await supabase.from('tb_karyawan').select('password').eq('id_karyawan', k.id_karyawan).single();
    // Support $2y$ (PHP bcrypt) dan $2b$ (Node.js bcryptjs)
    if (!row || !(await comparePassword(pass_lama, row.password)))
      return NextResponse.json({ error: 'Password lama salah.' }, { status: 401 });

    await supabase.from('tb_karyawan').update({ password: await hashPassword(pass_baru) }).eq('id_karyawan', k.id_karyawan);
    return NextResponse.json({ success: true });
  }

  // Update profil biasa
  const update: Record<string, string> = {};
  if (body?.alamat !== undefined) update.alamat = body.alamat;
  if (body?.no_tel !== undefined) update.no_tel = body.no_tel;
  if (body?.agama !== undefined)  update.agama  = body.agama;

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'Tidak ada data yang diubah.' }, { status: 400 });

  const { error } = await supabase.from('tb_karyawan').update(update).eq('id_karyawan', k.id_karyawan);
  if (error) return NextResponse.json({ error: 'Gagal menyimpan perubahan.' }, { status: 500 });

  // Refresh session cookie
  const { data: fresh } = await supabase.from('tb_karyawan')
    .select('id_karyawan, username, nama, jabatan, jenkel, agama, alamat, no_tel, tmp_tgl_lahir, foto, tgl_masuk')
    .eq('id_karyawan', k.id_karyawan).single();
  if (fresh) await setSessionCookie({ role: 'karyawan', ...fresh });

  return NextResponse.json({ success: true });
}
