import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import ApprovalClient from '@/components/owner/ApprovalClient';
export const metadata: Metadata = { title: 'Approval Izin/Cuti' };
export const dynamic = 'force-dynamic';

export default async function ApprovalPage({ searchParams }: { searchParams: Promise<Record<string,string>> }) {
  const session = await getSession();
  if (!session || session.role !== 'owner') redirect('/owner/login');
  const sp = await searchParams;
  const statusFilter = (sp.status ?? 'Proses') as 'Proses' | 'Disetujui' | 'Ditolak';
  const supabase = createAdminClient();

  const { data } = await supabase.from('tb_keterangan').select('*').eq('status', statusFilter).order('waktu', { ascending: false });
  return <ApprovalClient data={data ?? []} statusFilter={statusFilter} />;
}
