import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';

async function checkOwner() {
  const s = await getSession();
  return s && s.role === 'owner' ? s : null;
}

export async function GET() {
  if (!await checkOwner()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const { data } = await supabase.from('tb_daftar').select('id, username, created_at').order('id');
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!await checkOwner()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.username || !body?.password) return NextResponse.json({ error: 'Username dan password wajib.' }, { status: 400 });
  const supabase = createAdminClient();
  const { data: dup } = await supabase.from('tb_daftar').select('id').eq('username', body.username).single();
  if (dup) return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });
  const hash = await bcrypt.hash(body.password, 12);
  const { error } = await supabase.from('tb_daftar').insert({ username: body.username, password: hash });
  if (error) return NextResponse.json({ error: 'Gagal menambah admin.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!await checkOwner()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('tb_daftar').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: 'Gagal menghapus admin.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
