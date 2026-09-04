import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCutoffByPeriode, getLabelPeriode } from '@/lib/utils/absensi';
import OwnerDashboardClient from '@/components/owner/OwnerDashboardClient';
export const metadata: Metadata = { title: 'Owner Dashboard' };
export const dynamic = 'force-dynamic';

export default async function OwnerDashboardPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const session = await getSession();
  if (!session || session.role !== 'owner') redirect('/owner/login');
  const owner = session as Extract<typeof session, { role: 'owner' }>;
  const sp = await searchParams;
  const periode = sp.periode ?? 'semua';
  const supabase = createAdminClient();
  const cutoff = getCutoffByPeriode(periode);

  const [
    { count: totalKaryawan }, { count: totalAdmin },
    { data: jabatanRows }, { count: izinProses },
    { count: absenTotalRaw }, { data: absenTelatRows },
    { data: karyawanJabatan },
    { data: lupaPassRequests }
  ] = await Promise.all([
    supabase.from('tb_karyawan').select('*', { count: 'exact', head: true }),
    supabase.from('tb_daftar').select('*', { count: 'exact', head: true }),
    supabase.from('tb_jabatan').select('jabatan'),
    supabase.from('tb_keterangan').select('*', { count: 'exact', head: true }).eq('status', 'Proses'),
    cutoff
      ? supabase.from('tb_absen').select('*', { count: 'exact', head: true }).gte('waktu', cutoff.toISOString())
      : supabase.from('tb_absen').select('*', { count: 'exact', head: true }),
    cutoff
      ? supabase.from('tb_absen').select('id').eq('is_telat', 1).gte('waktu', cutoff.toISOString())
      : supabase.from('tb_absen').select('id').eq('is_telat', 1),
    supabase.from('tb_karyawan').select('jabatan'),
    supabase
      .from('tb_notifikasi')
      .select('id, id_karyawan, nama, pesan, tipe, dibaca, created_at')
      .eq('tipe', 'lupa_password')
      .eq('dibaca', 0)
      .order('id', { ascending: false }),
  ]);

  // Jabatan distribution
  const jabatanDist: Record<string, number> = {};
  (karyawanJabatan ?? []).forEach(({ jabatan }) => {
    jabatanDist[jabatan] = (jabatanDist[jabatan] ?? 0) + 1;
  });

  return (
    <OwnerDashboardClient
      ownerNama={owner.nama}
      periode={periode}
      labelPeriode={getLabelPeriode(periode)}
      stats={{
        totalKaryawan: totalKaryawan ?? 0,
        totalAdmin: totalAdmin ?? 0,
        totalJabatan: jabatanRows?.length ?? 0,
        izinProses: izinProses ?? 0,
        totalAbsen: absenTotalRaw ?? 0,
        absenTelat: absenTelatRows?.length ?? 0,
      }}
      jabatanDist={jabatanDist}
      lupaPassRequests={lupaPassRequests ?? []}
    />
  );
}
