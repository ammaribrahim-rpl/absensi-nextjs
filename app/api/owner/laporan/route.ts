// app/api/owner/laporan/route.ts — Laporan detail per record (absen + keterangan)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { getCutoffByPeriode } from '@/lib/utils/absensi';

export async function GET(request: NextRequest) {
  const s = await getSession();
  if (!s || (s.role !== 'owner' && s.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const params = request.nextUrl.searchParams;
  const mode       = params.get('mode') ?? 'rekap';   // 'rekap' | 'detail'
  const periode    = params.get('periode') ?? 'semua';
  const filterJab  = params.get('jabatan') ?? '';
  const filterJk   = params.get('jenkel')  ?? '';
  const filterKat  = params.get('kategori') ?? 'semua'; // semua|absen|telat|pulang|izin|cuti
  const filterKar  = params.get('id_karyawan') ?? 'semua';
  const q          = params.get('q') ?? '';
  const cutoff     = getCutoffByPeriode(periode);

  // ── MODE REKAP: ringkasan per karyawan ──────────────────────────────────────
  if (mode === 'rekap') {
    let kQ = supabase.from('tb_karyawan')
      .select('id_karyawan, nama, jabatan, jenkel, tgl_masuk')
      .order('nama');
    if (filterJab) kQ = kQ.eq('jabatan', filterJab);
    if (filterJk)  kQ = kQ.eq('jenkel', filterJk);
    if (q)         kQ = kQ.ilike('nama', `%${q}%`);
    const { data: kList } = await kQ;
    const ids = (kList ?? []).map(k => k.id_karyawan);

    const [{ data: absenList }, { data: ketList }] = await Promise.all([
      ids.length > 0
        ? (cutoff
            ? supabase.from('tb_absen').select('id_karyawan, tipe_absen, is_telat').in('id_karyawan', ids).gte('waktu', cutoff.toISOString())
            : supabase.from('tb_absen').select('id_karyawan, tipe_absen, is_telat').in('id_karyawan', ids))
        : Promise.resolve({ data: [] }),
      ids.length > 0
        ? (cutoff
            ? supabase.from('tb_keterangan').select('id_karyawan, keterangan').in('id_karyawan', ids).gte('waktu', cutoff.toISOString())
            : supabase.from('tb_keterangan').select('id_karyawan, keterangan').in('id_karyawan', ids))
        : Promise.resolve({ data: [] }),
    ]);

    const data = (kList ?? []).map(k => {
      const aK = (absenList ?? []).filter(a => a.id_karyawan === k.id_karyawan);
      const eK = (ketList   ?? []).filter(a => a.id_karyawan === k.id_karyawan);
      return {
        ...k,
        total_masuk:  aK.filter(a => a.tipe_absen === 'masuk').length,
        total_telat:  aK.filter(a => a.is_telat === 1).length,
        total_pulang: aK.filter(a => a.tipe_absen === 'pulang').length,
        total_izin:   eK.filter(a => a.keterangan === 'Izin').length,
        total_cuti:   eK.filter(a => a.keterangan === 'Cuti' || a.keterangan === 'Sakit').length,
      };
    });
    return NextResponse.json({ data });
  }

  // ── MODE DETAIL: semua record individual (seperti PHP lama) ─────────────────
  const records: Record<string, unknown>[] = [];

  // --- Data Absensi ---
  const showAbsen = ['semua', 'absen', 'telat', 'pulang', 'istirahat'].includes(filterKat);
  if (showAbsen) {
    let aQ = supabase.from('tb_absen')
      .select('id, id_karyawan, nama, waktu, waktu_str, tipe_absen, is_telat, durasi_istirahat')
      .order('id', { ascending: false });
    if (cutoff) aQ = aQ.gte('waktu', cutoff.toISOString());
    if (filterKar !== 'semua') aQ = aQ.eq('id_karyawan', filterKar);
    if (q) aQ = aQ.ilike('nama', `%${q}%`);
    const { data: absenRows } = await aQ;

    for (const ra of absenRows ?? []) {
      const tipe = ra.tipe_absen as string;
      const isTelat = ra.is_telat === 1;
      if (filterKat === 'telat'     && !isTelat) continue;
      if (filterKat === 'pulang'    && tipe !== 'pulang') continue;
      if (filterKat === 'istirahat' && !['istirahat_mulai', 'istirahat_selesai'].includes(tipe)) continue;
      if (filterKat === 'absen'     && tipe !== 'masuk') continue;

      const labelMap: Record<string, string> = {
        masuk: isTelat ? 'Telat Masuk' : 'Hadir',
        istirahat_mulai: isTelat ? 'Istirahat (Telat)' : 'Mulai Istirahat',
        istirahat_selesai: isTelat ? 'Kembali (Telat)' : 'Kembali Istirahat',
        pulang: 'Pulang',
      };

      records.push({
        record_type: 'absen',
        record_id: ra.id,
        id_karyawan: ra.id_karyawan,
        nama: ra.nama,
        kategori: labelMap[tipe] ?? 'Hadir',
        tipe_absen: tipe,
        is_telat: isTelat ? 1 : 0,
        waktu: ra.waktu,
        waktu_str: ra.waktu_str,
        durasi_istirahat: ra.durasi_istirahat,
        alasan: '',
        status: null,
        tgl_mulai: null,
        tgl_selesai: null,
      });
    }
  }

  // --- Data Keterangan (Izin/Cuti) ---
  const showKet = ['semua', 'izin', 'cuti'].includes(filterKat);
  if (showKet) {
    let kQ2 = supabase.from('tb_keterangan')
      .select('id, id_karyawan, nama, keterangan, alasan, tgl_mulai, tgl_selesai, status, waktu')
      .order('id', { ascending: false });
    if (cutoff) kQ2 = kQ2.gte('waktu', cutoff.toISOString());
    if (filterKar !== 'semua') kQ2 = kQ2.eq('id_karyawan', filterKar);
    if (q) kQ2 = kQ2.ilike('nama', `%${q}%`);
    const { data: ketRows } = await kQ2;

    for (const rk of ketRows ?? []) {
      const kat = (rk.keterangan === 'Cuti' || rk.keterangan === 'Sakit') ? 'Cuti' : 'Izin';
      if (filterKat === 'izin' && kat !== 'Izin') continue;
      if (filterKat === 'cuti' && kat !== 'Cuti') continue;

      records.push({
        record_type: 'keterangan',
        record_id: rk.id,
        id_karyawan: rk.id_karyawan,
        nama: rk.nama,
        kategori: kat,
        tipe_absen: null,
        is_telat: 0,
        waktu: rk.waktu,
        waktu_str: null,
        durasi_istirahat: null,
        alasan: rk.alasan,
        status: rk.status,
        tgl_mulai: rk.tgl_mulai,
        tgl_selesai: rk.tgl_selesai,
      });
    }
  }

  // Sort by waktu DESC
  records.sort((a, b) => new Date(b.waktu as string).getTime() - new Date(a.waktu as string).getTime());

  return NextResponse.json({ data: records, total: records.length });
}

// DELETE — hapus record absen atau keterangan
export async function DELETE(request: NextRequest) {
  const s = await getSession();
  if (!s || (s.role !== 'owner' && s.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = request.nextUrl.searchParams.get('type'); // 'absen' | 'ket'
  const id   = request.nextUrl.searchParams.get('id');
  if (!id || isNaN(Number(id))) return NextResponse.json({ error: 'ID invalid.' }, { status: 400 });

  const supabase = createAdminClient();
  if (type === 'ket') {
    await supabase.from('tb_keterangan').delete().eq('id', Number(id));
  } else {
    await supabase.from('tb_absen').delete().eq('id', Number(id));
  }
  return NextResponse.json({ success: true });
}
