// app/karyawan/izin/page.tsx — Form Pengajuan Izin/Cuti
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import IzinClient from '@/components/absensi/IzinClient';
export const metadata: Metadata = { title: 'Pengajuan Izin/Cuti' };
export const dynamic = 'force-dynamic';

export default async function IzinPage() {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') redirect('/karyawan/login');
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const supabase = createAdminClient();

  const { data: riwayat } = await supabase
    .from('tb_keterangan')
    .select('id, keterangan, tgl_mulai, tgl_selesai, alasan, status, waktu')
    .eq('id_karyawan', k.id_karyawan)
    .order('waktu', { ascending: false })
    .limit(20);

  return <IzinClient nama={k.nama} riwayat={riwayat ?? []} />;
}
