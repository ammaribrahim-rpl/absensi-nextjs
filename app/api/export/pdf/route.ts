import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFormattedTglMasuk, hitungMasaKerja } from '@/lib/utils/absensi';

export async function GET() {
  const s = await getSession();
  if (!s || (s.role !== 'owner' && s.role !== 'admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const { data: karyawan } = await supabase.from('tb_karyawan')
    .select('id_karyawan, nama, jabatan, jenkel, no_tel, tgl_masuk').order('nama');

  const rows = (karyawan ?? []).map((k, i) => `
    <tr>
      <td>${i + 1}</td><td>${k.nama}</td><td>${k.jabatan}</td><td>${k.jenkel}</td>
      <td>${k.no_tel}</td><td>${getFormattedTglMasuk(k.tgl_masuk ?? '', k.id_karyawan)}</td>
      <td>${hitungMasaKerja(k.tgl_masuk ?? '', k.id_karyawan)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="id"><head>
    <meta charset="UTF-8">
    <title>Laporan Data Karyawan</title>
    <style>
      @page { size: A4; margin: 15mm; }
      body { font-family: Arial, sans-serif; font-size: 11pt; color: #1f2937; }
      h2 { margin: 0 0 4px; font-size: 18pt; }
      p { margin: 0; color: #6b7280; font-size: 9pt; }
      .header { border-bottom: 2px solid #374151; padding-bottom: 10px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #4f46e5; color: #fff; padding: 8px; font-size: 9pt; text-align: left; border: 1px solid #3730a3; }
      td { padding: 7px 8px; border: 1px solid #e5e7eb; font-size: 9.5pt; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style>
  </head><body>
    <div class="header">
      <h2>LAPORAN DATA KARYAWAN</h2>
      <p>Diekspor oleh Owner pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
    </div>
    <table>
      <thead><tr><th>No</th><th>Nama</th><th>Jabatan</th><th>Kelamin</th><th>No. Telp</th><th>Tgl Masuk</th><th>Masa Kerja</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
