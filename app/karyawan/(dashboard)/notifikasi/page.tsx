// app/karyawan/notifikasi/page.tsx
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';
import NotifikasiClient from '@/components/absensi/NotifikasiClient';

export const metadata: Metadata = { title: 'Notifikasi' };
export const dynamic = 'force-dynamic';

export default async function NotifikasiPage() {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') redirect('/login');
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const supabase = createAdminClient();

  // Mark all as read
  await supabase.from('tb_notifikasi').update({ dibaca: 1 }).eq('id_karyawan', k.id_karyawan);

  const { data: notifikasi } = await supabase
    .from('tb_notifikasi')
    .select('id, id_karyawan, nama, pesan, tipe, dibaca, created_at')
    .eq('id_karyawan', k.id_karyawan)
    .order('created_at', { ascending: false })
    .limit(30);

  return <NotifikasiClient notifikasi={notifikasi ?? []} />;
}
