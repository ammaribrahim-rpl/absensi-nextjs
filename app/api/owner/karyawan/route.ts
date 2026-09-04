// app/api/owner/karyawan/route.ts — CRUD karyawan (Owner)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import bcrypt from 'bcryptjs';
import { generateBaseIdKaryawan } from '@/lib/utils/absensi';
import type { Karyawan } from '@/types/database';

async function checkOwnerOrAdmin() {
  const s = await getSession();
  if (!s || (s.role !== 'owner' && s.role !== 'admin')) return null;
  return s;
}

export async function GET(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const q = request.nextUrl.searchParams.get('q') ?? '';

  let query = supabase.from('tb_karyawan')
    .select('id_karyawan, username, nama, jabatan, jenkel, no_tel, tgl_masuk, foto, tmp_tgl_lahir, agama, alamat')
    .order('nama', { ascending: true });

  if (q) query = query.or(`nama.ilike.%${q}%,username.ilike.%${q}%,jabatan.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { nama, username, password, jabatan, jenkel, agama, alamat, no_tel, tmp_tgl_lahir, tgl_masuk } = body ?? {};

  if (!nama || !username || !password || !jabatan) {
    return NextResponse.json({ error: 'Nama, username, password, dan jabatan wajib diisi.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  // Check duplicate username
  const { data: existing } = await supabase.from('tb_karyawan').select('id_karyawan').eq('username', username).single();
  if (existing) return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });

  // Generate ID
  const tglDate = tgl_masuk ? new Date(tgl_masuk) : new Date();
  const baseId = generateBaseIdKaryawan(tglDate);

  let finalId = baseId;
  const { data: idCheck } = await supabase.from('tb_karyawan').select('id_karyawan').like('id_karyawan', `${baseId}%`);
  if (idCheck && idCheck.length > 0) {
    finalId = `${baseId}-${idCheck.length + 1}`;
  }

  const hash = await bcrypt.hash(password, 12);
  const { error } = await supabase.from('tb_karyawan').insert({
    id_karyawan: finalId, username, password: hash,
    nama, jabatan, jenkel: jenkel ?? '-', agama: agama ?? '-',
    alamat: alamat ?? '-', no_tel: no_tel ?? '-',
    tmp_tgl_lahir: tmp_tgl_lahir ?? '-',
    tgl_masuk: tgl_masuk || null, foto: '',
  });

  if (error) return NextResponse.json({ error: 'Gagal menyimpan data karyawan.' }, { status: 500 });
  return NextResponse.json({ success: true, id_karyawan: finalId });
}

export async function PUT(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { id_karyawan, ...updates } = body ?? {};
  if (!id_karyawan) return NextResponse.json({ error: 'ID karyawan diperlukan.' }, { status: 400 });

  const supabase = createAdminClient();
  const allowed = ['nama','jabatan','jenkel','agama','alamat','no_tel','tmp_tgl_lahir','tgl_masuk','username'] as const;
  const filtered: Partial<Karyawan> = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      filtered[key] = updates[key];
    }
  }

  if (updates.password) {
    filtered.password = await bcrypt.hash(updates.password, 12);
  }

  const { error } = await supabase.from('tb_karyawan').update(filtered).eq('id_karyawan', id_karyawan);
  if (error) return NextResponse.json({ error: 'Gagal memperbarui data.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!await checkOwnerOrAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID diperlukan.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('tb_karyawan').delete().eq('id_karyawan', id);
  if (error) return NextResponse.json({ error: 'Gagal menghapus data.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
