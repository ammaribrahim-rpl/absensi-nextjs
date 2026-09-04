import type { Metadata } from 'next';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import GantiPasswordClient from '@/components/GantiPasswordClient';
export const metadata: Metadata = { title: 'Ganti Password' };

export default async function OwnerGantiPassword() {
  const s = await getSession();
  if (!s || s.role !== 'owner') redirect('/owner/login');
  const o = s as Extract<typeof s, { role: 'owner' }>;
  return <GantiPasswordClient apiEndpoint="/api/owner/ganti-password" userName={o.nama} role="owner" />;
}
