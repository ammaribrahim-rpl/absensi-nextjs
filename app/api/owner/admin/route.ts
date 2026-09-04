import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';

async function checkOwner() {
  const s = await getSession();
  return s && s.role === 'owner' ? s : null;
}

export async function GET() {
  if (!(await checkOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const { data } = await supabase.from('tb_daftar').select('id, username, password, created_at').order('id');
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await checkOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const username = body?.username?.trim();
  const password = body?.password?.trim();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: dup } = await supabase.from('tb_daftar').select('id').eq('username', username).single();
  if (dup) return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });

  // Simpan password agar dapat dilihat oleh Owner
  const { error } = await supabase.from('tb_daftar').insert({ username, password });
  if (error) return NextResponse.json({ error: 'Gagal menambah admin.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  if (!(await checkOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!id) return NextResponse.json({ error: 'ID admin diperlukan.' }, { status: 400 });

  const supabase = createAdminClient();
  const updateData: Record<string, string> = {};

  if (body?.username) {
    updateData.username = body.username.trim();
  }
  if (body?.password) {
    updateData.password = body.password.trim();
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Tidak ada data yang diperbarui.' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('tb_daftar').update(updateData as any).eq('id', Number(id));
  if (error) return NextResponse.json({ error: 'Gagal memperbarui data admin.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await checkOwner())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('tb_daftar').delete().eq('id', Number(id));
  if (error) return NextResponse.json({ error: 'Gagal menghapus admin.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
