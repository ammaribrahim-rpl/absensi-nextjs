// app/api/karyawan/absen/route.ts — Proses absensi masuk/istirahat/pulang
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import {
  getNowJakarta, formatWaktuIndonesia, getTanggalHariIni,
  isTelat, getDurasiIstirahat, parseWaktuToDate, TZ
} from '@/lib/utils/absensi';
import { toZonedTime } from 'date-fns-tz';
import type { TipeAbsen } from '@/types/database';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const k = session as Extract<typeof session, { role: 'karyawan' }>;

  const body = await request.json().catch(() => null);
  const tipe = (body?.tipe_absen ?? '') as TipeAbsen;

  const validTipe: TipeAbsen[] = ['masuk', 'istirahat_mulai', 'istirahat_selesai', 'pulang'];
  if (!validTipe.includes(tipe) && tipe !== 'reset_test') {
    return NextResponse.json({ error: 'Tipe absen tidak valid.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const nowUTC = new Date();
  const nowJakarta = toZonedTime(nowUTC, TZ);
  const tanggalHari = getTanggalHariIni();
  const isOperator = k.jabatan.toUpperCase() === 'OPERATOR';

  // ─── Reset Testing (khusus OPERATOR) ─────────────────────────────────────
  if (tipe === 'reset_test' && isOperator) {
    await supabase
      .from('tb_absen')
      .delete()
      .eq('id_karyawan', k.id_karyawan)
      .ilike('waktu_str', `%${tanggalHari}%`);

    return NextResponse.json({
      success: true, label: 'Reset Presensi Testing',
      waktu: `${nowJakarta.getHours().toString().padStart(2,'0')}:${nowJakarta.getMinutes().toString().padStart(2,'0')}`,
      is_telat: 0,
      message: 'Data presensi hari ini berhasil di-reset untuk testing.'
    });
  }

  // ─── Hitung durasi istirahat (untuk istirahat_selesai) ────────────────────
  let durasiIstirahat = 0;
  let waktuMulaiIstirahat: Date | null = null;

  if (tipe === 'istirahat_selesai') {
    const { data: rowIst } = await supabase
      .from('tb_absen')
      .select('waktu, waktu_str')
      .eq('id_karyawan', k.id_karyawan)
      .eq('tipe_absen', 'istirahat_mulai')
      .ilike('waktu_str', `%${tanggalHari}%`)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (rowIst) {
      waktuMulaiIstirahat = new Date(rowIst.waktu);
      durasiIstirahat = getDurasiIstirahat(waktuMulaiIstirahat);
    }
  }

  // ─── Deteksi keterlambatan ────────────────────────────────────────────────
  const telat = isTelat(tipe, k.jabatan, nowJakarta, tipe === 'istirahat_selesai' ? durasiIstirahat : undefined);

  // ─── Simpan ke database ───────────────────────────────────────────────────
  const waktuStr = formatWaktuIndonesia(nowUTC);
  const { error: saveError } = await supabase.from('tb_absen').insert({
    id_karyawan: k.id_karyawan,
    nama: k.nama,
    waktu: nowUTC.toISOString(),
    waktu_str: waktuStr,
    tipe_absen: tipe,
    is_telat: telat ? 1 : 0,
    durasi_istirahat: tipe === 'istirahat_selesai' ? durasiIstirahat : null,
  });

  if (saveError) {
    return NextResponse.json({ error: 'Gagal menyimpan absensi. Silakan coba lagi.' }, { status: 500 });
  }

  // ─── Simpan notifikasi internal jika telat ────────────────────────────────
  if (telat) {
    const jamStr = `${nowJakarta.getHours().toString().padStart(2,'0')}:${nowJakarta.getMinutes().toString().padStart(2,'0')} WIB`;
    const isK1 = k.jabatan.toUpperCase() === 'K1';
    let pesanNotif = '';
    let tipeNotif = '';

    if (tipe === 'masuk') {
      pesanNotif = `Kamu tercatat TERLAMBAT masuk pada ${jamStr}. Harap tepat waktu di hari berikutnya.`;
      tipeNotif = 'telat_masuk';
    } else {
      const batasText = isK1 ? '1 jam 30 menit' : '1 jam';
      pesanNotif = `Kamu melebihi batas istirahat ${batasText} (${durasiIstirahat} menit). Tercatat terlambat kembali.`;
      tipeNotif = 'telat_istirahat';
    }

    await supabase.from('tb_notifikasi').insert({
      id_karyawan: k.id_karyawan,
      nama: k.nama,
      pesan: pesanNotif,
      tipe: tipeNotif,
    });
  }

  // ─── Response feedback ────────────────────────────────────────────────────
  const labelMap: Record<string, string> = {
    masuk: 'Absen Masuk', istirahat_mulai: 'Mulai Istirahat',
    istirahat_selesai: 'Selesai Istirahat', pulang: 'Absen Pulang',
  };
  const isK1 = k.jabatan.toUpperCase() === 'K1';
  const batasIstLabel = isK1 ? '1 jam 30 menit' : '1 jam';
  const telatMsg = telat && tipe === 'masuk'
    ? ' (Terlambat)'
    : telat && tipe === 'istirahat_selesai'
      ? ` (Istirahat melebihi ${batasIstLabel})`
      : '';

  const waktuJam = `${nowJakarta.getHours().toString().padStart(2,'0')}:${nowJakarta.getMinutes().toString().padStart(2,'0')}:${nowJakarta.getSeconds().toString().padStart(2,'0')}`;

  return NextResponse.json({
    success: true,
    label: labelMap[tipe] ?? 'Absen',
    tipe,
    is_telat: telat ? 1 : 0,
    telat_msg: telatMsg,
    waktu: waktuJam,
  });
}

// GET — ambil status absensi hari ini
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'karyawan') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const k = session as Extract<typeof session, { role: 'karyawan' }>;
  const supabase = createAdminClient();
  const tanggalHari = getTanggalHariIni();

  const { data: absenHariIni } = await supabase
    .from('tb_absen')
    .select('id, tipe_absen, waktu, waktu_str, is_telat, durasi_istirahat')
    .eq('id_karyawan', k.id_karyawan)
    .ilike('waktu_str', `%${tanggalHari}%`)
    .order('id', { ascending: true });

  return NextResponse.json({ absen: absenHariIni ?? [] });
}
