import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import JabatanClient from '@/components/owner/JabatanClient';
export const metadata: Metadata = { title: 'Kelola Jabatan (Admin)' };
export const dynamic = 'force-dynamic';

export default async function AdminJabatanPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/login');
  const supabase = createAdminClient();
  const { data } = await supabase.from('tb_jabatan').select('*').order('jabatan');
  return <JabatanClient jabatan={data ?? []} />;
}
