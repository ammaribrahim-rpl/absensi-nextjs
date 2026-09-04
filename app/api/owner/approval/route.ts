import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import type { StatusKeterangan } from '@/types/database';

async function checkOwner() {
  const s = await getSession();
  return s && s.role === 'owner' ? s : null;
}

export async function GET(request: NextRequest) {
  if (!await checkOwner()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const status = request.nextUrl.searchParams.get('status') ?? 'Proses';
  const { data } = await supabase
    .from('tb_keterangan').select('*')
    .eq('status', status as StatusKeterangan)
    .order('waktu', { ascending: false });
  return NextResponse.json({ data: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const owner = await checkOwner();
  if (!owner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { id, status } = body ?? {};
  if (!id || !['Disetujui','Ditolak'].includes(status)) {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: ket } = await supabase.from('tb_keterangan').select('id_karyawan, nama, keterangan').eq('id', id).single();
  if (!ket) return NextResponse.json({ error: 'Data tidak ditemukan.' }, { status: 404 });

  await supabase.from('tb_keterangan').update({ status }).eq('id', id);

  // Kirim notifikasi ke karyawan
  const tipeNotif = status === 'Disetujui' ? 'approval' : 'penolakan';
  const pesan = status === 'Disetujui'
    ? `Pengajuan ${ket.keterangan} Anda telah DISETUJUI oleh Owner.`
    : `Pengajuan ${ket.keterangan} Anda DITOLAK oleh Owner.`;
  await supabase.from('tb_notifikasi').insert({ id_karyawan: ket.id_karyawan, nama: ket.nama, pesan, tipe: tipeNotif, dibaca: 0 });

  return NextResponse.json({ success: true });
}
