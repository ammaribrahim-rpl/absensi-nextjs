import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { getCutoffByPeriode } from '@/lib/utils/absensi';

export async function GET(request: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== 'owner') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const periode = request.nextUrl.searchParams.get('periode') ?? 'semua';

  const supabase = createAdminClient();
  const cutoff = getCutoffByPeriode(periode);

  const [{ count: totalKaryawan }, { count: totalAdmin }, { data: jabatanRows }, { count: izinProses }] = await Promise.all([
    supabase.from('tb_karyawan').select('*', { count: 'exact', head: true }),
    supabase.from('tb_daftar').select('*', { count: 'exact', head: true }),
    supabase.from('tb_jabatan').select('jabatan'),
    supabase.from('tb_keterangan').select('*', { count: 'exact', head: true }).eq('status', 'Proses'),
  ]);

  // Absensi dalam periode
  let absenQuery = supabase.from('tb_absen').select('id, id_karyawan, is_telat, tipe_absen', { count: 'exact' });
  if (cutoff) absenQuery = absenQuery.gte('waktu', cutoff.toISOString());

  const { data: absenRows, count: totalAbsen } = await absenQuery;

  const absenMasuk   = absenRows?.filter(r => r.tipe_absen === 'masuk').length ?? 0;
  const absenTelat   = absenRows?.filter(r => r.is_telat === 1).length ?? 0;

  return NextResponse.json({
    totalKaryawan: totalKaryawan ?? 0,
    totalAdmin: totalAdmin ?? 0,
    totalJabatan: jabatanRows?.length ?? 0,
    izinProses: izinProses ?? 0,
    totalAbsen: totalAbsen ?? 0,
    absenMasuk,
    absenTelat,
  });
}
