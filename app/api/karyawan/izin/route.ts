// app/api/karyawan/izin/route.ts — Submit pengajuan izin/cuti
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const k = session as Extract<typeof session, { role: 'karyawan' }>;

  const body = await request.json().catch(() => null);
  const keterangan  = (body?.keterangan ?? 'Izin').trim();
  const tglMulai   = (body?.tgl_mulai ?? '').trim();
  const tglSelesai = (body?.tgl_selesai ?? '').trim();
  const alasan     = (body?.alasan ?? '').trim();

  if (!alasan || !tglMulai || !tglSelesai) {
    return NextResponse.json({ error: 'Semua kolom wajib diisi.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('tb_keterangan').insert({
    id_karyawan: k.id_karyawan,
    nama: k.nama,
    keterangan,
    tgl_mulai: tglMulai || null,
    tgl_selesai: tglSelesai || null,
    alasan,
    bukti: '',
    status: 'Proses',
  });

  if (error) return NextResponse.json({ error: 'Gagal mengirim pengajuan.' }, { status: 500 });
  return NextResponse.json({ success: true, message: `Pengajuan ${keterangan} berhasil dikirim.` });
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('tb_keterangan')
    .select('id, keterangan, tgl_mulai, tgl_selesai, alasan, status, waktu')
    .eq('id_karyawan', k.id_karyawan)
    .order('waktu', { ascending: false })
    .limit(20);

  return NextResponse.json({ data: data ?? [] });
}
