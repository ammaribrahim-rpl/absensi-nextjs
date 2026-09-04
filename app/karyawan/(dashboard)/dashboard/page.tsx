// app/karyawan/dashboard/page.tsx — Dashboard Absensi Karyawan
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTanggalHariIni, getFormattedTglMasuk, hitungMasaKerja } from '@/lib/utils/absensi';
import type { Metadata } from 'next';
import AbsensiCard from '@/components/absensi/AbsensiCard';
import type { Absen } from '@/types/database';

export const metadata: Metadata = { title: 'Dashboard Absensi' };
export const dynamic = 'force-dynamic';

export default async function KaryawanDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') redirect('/login');
  const k = session as Extract<typeof session, { role: 'karyawan' }>;

  const supabase = createAdminClient();
  const tanggalHari = getTanggalHariIni();

  // Absensi hari ini
  const { data: absenHariIni } = await supabase
    .from('tb_absen')
    .select('id, tipe_absen, waktu, waktu_str, is_telat, durasi_istirahat')
    .eq('id_karyawan', k.id_karyawan)
    .ilike('waktu_str', `%${tanggalHari}%`)
    .order('id', { ascending: true });

  // Notifikasi unread count
  const { count: notifCount } = await supabase
    .from('tb_notifikasi')
    .select('*', { count: 'exact', head: true })
    .eq('id_karyawan', k.id_karyawan)
    .eq('dibaca', 0);

  const tglMasukFormatted = getFormattedTglMasuk(k.tgl_masuk ?? '', k.id_karyawan);
  const masaKerja = hitungMasaKerja(k.tgl_masuk ?? '', k.id_karyawan);

  return (
    <AbsensiCard
      karyawan={k}
      absenHariIni={(absenHariIni ?? []) as Absen[]}
      notifCount={notifCount ?? 0}
      tglMasukFormatted={tglMasukFormatted}
      masaKerja={masaKerja}
      tanggalHari={tanggalHari}
    />
  );
}
