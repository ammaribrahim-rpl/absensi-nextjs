// app/api/karyawan/notifikasi/route.ts — Polling notifikasi
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') {
    return NextResponse.json({ count: 0, items: [] });
  }
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const supabase = createAdminClient();
  const action = request.nextUrl.searchParams.get('action');

  if (action === 'read_all') {
    await supabase.from('tb_notifikasi').update({ dibaca: 1 }).eq('id_karyawan', k.id_karyawan);
    return NextResponse.json({ success: true });
  }

  const { data: items } = await supabase
    .from('tb_notifikasi')
    .select('id, pesan, tipe, created_at')
    .eq('id_karyawan', k.id_karyawan)
    .eq('dibaca', 0)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ count: items?.length ?? 0, items: items ?? [] });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const notifId = request.nextUrl.searchParams.get('id');
  if (!notifId || isNaN(Number(notifId))) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.from('tb_notifikasi').delete().eq('id', Number(notifId)).eq('id_karyawan', k.id_karyawan);
  return NextResponse.json({ success: true });
}
