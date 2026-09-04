import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ProfilClient from '@/components/absensi/ProfilClient';
import { getFormattedTglMasuk, hitungMasaKerja } from '@/lib/utils/absensi';
export const metadata: Metadata = { title: 'Profil Saya' };
export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') redirect('/karyawan/login');
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const tglMasukFormatted = getFormattedTglMasuk(k.tgl_masuk ?? '', k.id_karyawan);
  const masaKerja = hitungMasaKerja(k.tgl_masuk ?? '', k.id_karyawan);
  return <ProfilClient karyawan={k} tglMasukFormatted={tglMasukFormatted} masaKerja={masaKerja} />;
}
