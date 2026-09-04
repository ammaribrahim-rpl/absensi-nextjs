import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import AdminManageClient from '@/components/owner/AdminManageClient';
export const metadata: Metadata = { title: 'Kelola Administrator' };
export const dynamic = 'force-dynamic';

export default async function OwnerAdminPage() {
  const session = await getSession();
  if (!session || session.role !== 'owner') redirect('/login');
  const supabase = createAdminClient();
  const { data } = await supabase.from('tb_daftar').select('id, username, password, created_at').order('id');
  return <AdminManageClient admins={data ?? []} />;
}
