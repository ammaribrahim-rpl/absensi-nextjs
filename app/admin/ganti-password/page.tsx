import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import GantiPasswordClient from '@/components/GantiPasswordClient';
export const metadata: Metadata = { title: 'Ganti Password Admin' };

export default async function AdminGantiPassword() {
  const s = await getSession();
  if (!s || s.role !== 'admin') redirect('/login');
  const a = s as Extract<typeof s, { role: 'admin' }>;
  return <GantiPasswordClient apiEndpoint="/api/owner/ganti-password" userName={a.username} role="admin" />;
}
