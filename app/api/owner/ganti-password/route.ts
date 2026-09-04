import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { comparePassword, hashPassword } from '@/lib/auth/bcrypt';

export async function PUT(request: NextRequest) {
  const s = await getSession();
  if (!s || (s.role !== 'owner' && s.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { pass_lama, pass_baru, konfirmasi } = body ?? {};
  if (!pass_lama || !pass_baru || !konfirmasi)
    return NextResponse.json({ error: 'Semua field wajib diisi.' }, { status: 400 });
  if (pass_baru !== konfirmasi)
    return NextResponse.json({ error: 'Konfirmasi password tidak cocok.' }, { status: 400 });
  if ((pass_baru as string).length < 6)
    return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });

  const supabase = createAdminClient();
  const newHash = await hashPassword(pass_baru as string);

  if (s.role === 'owner') {
    const o = s as Extract<typeof s, { role: 'owner' }>;
    const { data } = await supabase.from('tb_owner').select('password').eq('id', o.id).single();
    if (!data || !(await comparePassword(pass_lama as string, data.password)))
      return NextResponse.json({ error: 'Password lama salah.' }, { status: 401 });
    await supabase.from('tb_owner').update({ password: newHash }).eq('id', o.id);
  } else {
    const a = s as Extract<typeof s, { role: 'admin' }>;
    const { data } = await supabase.from('tb_daftar').select('password').eq('id', a.id).single();
    if (!data || !(await comparePassword(pass_lama as string, data.password)))
      return NextResponse.json({ error: 'Password lama salah.' }, { status: 401 });
    await supabase.from('tb_daftar').update({ password: newHash }).eq('id', a.id);
  }
  return NextResponse.json({ success: true });
}
