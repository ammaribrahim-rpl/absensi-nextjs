import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCutoffByPeriode, getFormattedTglMasuk, hitungMasaKerja } from '@/lib/utils/absensi';
import LaporanClient from '@/components/owner/LaporanClient';
export const metadata: Metadata = { title: 'Laporan Absensi' };
export const dynamic = 'force-dynamic';

export default async function LaporanPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const session = await getSession();
  if (!session || session.role !== 'owner') redirect('/owner/login');
  const sp = await searchParams;
  const periode   = sp.periode  ?? 'semua';
  const filterJab = sp.jabatan  ?? '';
  const filterJk  = sp.jenkel   ?? '';
  const q         = sp.q        ?? '';
  const supabase  = createAdminClient();

  let kQ = supabase.from('tb_karyawan')
    .select('id_karyawan, nama, jabatan, jenkel, tgl_masuk').order('nama');
  if (filterJab) kQ = kQ.eq('jabatan', filterJab);
  if (filterJk)  kQ = kQ.eq('jenkel', filterJk);
  if (q)         kQ = kQ.ilike('nama', `%${q}%`);
  const { data: kList } = await kQ;
  const cutoff = getCutoffByPeriode(periode);
  const ids = (kList ?? []).map(k => k.id_karyawan);

  const [{ data: absenList }, { data: ketList }, { data: jabatanList }, { data: allKaryawan }] = await Promise.all([
    ids.length > 0
      ? (cutoff
          ? supabase.from('tb_absen').select('id_karyawan, tipe_absen, is_telat').in('id_karyawan', ids).gte('waktu', cutoff.toISOString())
          : supabase.from('tb_absen').select('id_karyawan, tipe_absen, is_telat').in('id_karyawan', ids))
      : Promise.resolve({ data: [] }),
    ids.length > 0
      ? (cutoff
          ? supabase.from('tb_keterangan').select('id_karyawan, keterangan').in('id_karyawan', ids).gte('waktu', cutoff.toISOString())
          : supabase.from('tb_keterangan').select('id_karyawan, keterangan').in('id_karyawan', ids))
      : Promise.resolve({ data: [] }),
    supabase.from('tb_jabatan').select('jabatan').order('jabatan'),
    supabase.from('tb_karyawan').select('id_karyawan, nama').order('nama'),
  ]);

  const enriched = (kList ?? []).map(k => {
    const aK = (absenList ?? []).filter(a => a.id_karyawan === k.id_karyawan);
    const eK = (ketList   ?? []).filter(a => a.id_karyawan === k.id_karyawan);
    return {
      ...k,
      tgl_masuk_formatted: getFormattedTglMasuk(k.tgl_masuk ?? '', k.id_karyawan),
      masa_kerja: hitungMasaKerja(k.tgl_masuk ?? '', k.id_karyawan),
      total_masuk:  aK.filter(a => a.tipe_absen === 'masuk').length,
      total_telat:  aK.filter(a => a.is_telat === 1).length,
      total_pulang: aK.filter(a => a.tipe_absen === 'pulang').length,
      total_izin:   eK.filter(a => a.keterangan === 'Izin').length,
      total_cuti:   eK.filter(a => a.keterangan === 'Cuti' || a.keterangan === 'Sakit').length,
    };
  });

  return (
    <LaporanClient
      data={enriched}
      jabatanOptions={(jabatanList ?? []).map(j => j.jabatan)}
      karyawanOptions={allKaryawan ?? []}
      filters={{ periode, jabatan: filterJab, jenkel: filterJk, q }}
    />
  );
}
