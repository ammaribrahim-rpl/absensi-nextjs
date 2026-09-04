import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

async function checkOwnerOrAdmin() {
  const s = await getSession();
  return s && (s.role === 'owner' || s.role === 'admin') ? s : null;
}

export async function GET() {
  const supabase = createAdminClient();
  const { data } = await supabase.from('tb_jabatan').select('*').order('jabatan');
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.jabatan) return NextResponse.json({ error: 'Nama jabatan wajib diisi.' }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('tb_jabatan').insert({ jabatan: body.jabatan, icon: body.icon ?? 'fas fa-briefcase' }).select().single();
  if (error) return NextResponse.json({ error: 'Gagal menambah jabatan.' }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('tb_jabatan').update({ jabatan: body.jabatan, icon: body.icon }).eq('id', body.id);
  if (error) return NextResponse.json({ error: 'Gagal mengupdate jabatan.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('tb_jabatan').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: 'Gagal menghapus jabatan.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
