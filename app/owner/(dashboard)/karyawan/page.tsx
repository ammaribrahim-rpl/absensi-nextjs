import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFormattedTglMasuk, hitungMasaKerja } from '@/lib/utils/absensi';
import KaryawanTable from '@/components/owner/KaryawanTable';
export const metadata: Metadata = { title: 'Kelola Karyawan' };
export const dynamic = 'force-dynamic';

export default async function OwnerKaryawanPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const session = await getSession();
  if (!session || session.role !== 'owner') redirect('/owner/login');
  const sp = await searchParams;
  const q = sp.q ?? '';
  const supabase = createAdminClient();

  let query = supabase.from('tb_karyawan')
    .select('id_karyawan, username, password, nama, jabatan, jenkel, no_tel, tgl_masuk, foto, tmp_tgl_lahir, agama, alamat')
    .order('nama');
  if (q) query = query.or(`nama.ilike.%${q}%,username.ilike.%${q}%,jabatan.ilike.%${q}%`);
  const { data: karyawan } = await query;

  const { data: jabatanList } = await supabase.from('tb_jabatan').select('jabatan, icon').order('jabatan');

  const enriched = (karyawan ?? []).map(k => ({
    ...k,
    tgl_masuk_formatted: getFormattedTglMasuk(k.tgl_masuk ?? '', k.id_karyawan),
    masa_kerja: hitungMasaKerja(k.tgl_masuk ?? '', k.id_karyawan),
  }));

  return <KaryawanTable karyawan={enriched} jabatanList={jabatanList ?? []} q={q} />;
}
