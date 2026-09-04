// app/api/export/excel/route.ts — Export CSV (karyawan + absensi)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { getFormattedTglMasuk, hitungMasaKerja } from '@/lib/utils/absensi';

function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const s = await getSession();
  if (!s || (s.role !== 'owner' && s.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = request.nextUrl.searchParams.get('type') ?? 'karyawan';
  const supabase = createAdminClient();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const bom = '\uFEFF';

  if (type === 'absen') {
    // Export data absensi
    const { data } = await supabase
      .from('tb_absen')
      .select('id, id_karyawan, nama, waktu, waktu_str, tipe_absen, is_telat, durasi_istirahat')
      .order('id', { ascending: false });

    const header = 'No,ID Karyawan,Nama,Tipe Absen,Waktu,Terlambat,Durasi Istirahat (mnt)';
    const rows = (data ?? []).map((r, i) => {
      const waktu = new Date(r.waktu).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
      return [i+1, r.id_karyawan, r.nama, r.tipe_absen, waktu, r.is_telat ? 'Ya' : 'Tidak', r.durasi_istirahat ?? '']
        .map(csvEscape).join(',');
    });

    return new NextResponse(bom + [header, ...rows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Data_Absensi_${dateStr}.csv"`,
      },
    });
  }

  if (type === 'keterangan') {
    const { data } = await supabase
      .from('tb_keterangan')
      .select('id, id_karyawan, nama, keterangan, tgl_mulai, tgl_selesai, alasan, status, waktu')
      .order('id', { ascending: false });

    const header = 'No,ID Karyawan,Nama,Jenis,Tgl Mulai,Tgl Selesai,Alasan,Status';
    const rows = (data ?? []).map((r, i) =>
      [i+1, r.id_karyawan, r.nama, r.keterangan, r.tgl_mulai ?? '', r.tgl_selesai ?? '', r.alasan, r.status]
        .map(csvEscape).join(',')
    );

    return new NextResponse(bom + [header, ...rows].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Data_Izin_Cuti_${dateStr}.csv"`,
      },
    });
  }

  // Default: karyawan
  const { data: karyawan } = await supabase
    .from('tb_karyawan')
    .select('id_karyawan, username, nama, jabatan, jenkel, agama, alamat, no_tel, tmp_tgl_lahir, tgl_masuk')
    .order('nama');

  const header = 'No,ID Karyawan,Username,Nama Lengkap,Jabatan,Jenis Kelamin,Agama,No. Telepon,Tempat/Tgl Lahir,Tanggal Masuk,Masa Kerja';
  const rows = (karyawan ?? []).map((k, i) =>
    [i+1, k.id_karyawan, k.username, k.nama, k.jabatan, k.jenkel, k.agama, k.no_tel, k.tmp_tgl_lahir,
      getFormattedTglMasuk(k.tgl_masuk ?? '', k.id_karyawan),
      hitungMasaKerja(k.tgl_masuk ?? '', k.id_karyawan)]
      .map(csvEscape).join(',')
  );

  return new NextResponse(bom + [header, ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Data_Karyawan_${dateStr}.csv"`,
    },
  });
}
