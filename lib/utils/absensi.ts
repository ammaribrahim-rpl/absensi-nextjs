// lib/utils/absensi.ts — Business logic utilities (port dari koneksi.php)
// Mempertahankan behavior PERSIS sama dengan versi PHP

import { toZonedTime, fromZonedTime, format as formatTZ } from 'date-fns-tz';

const TZ = 'Asia/Jakarta';

// ─── resolveTglMasuk ────────────────────────────────────────────────────────
// Port dari PHP: resolveTglMasuk()
// Jika tgl_masuk kosong/invalid, fallback ke id_karyawan
export function resolveTglMasuk(
  rowOrTgl: Record<string, string | null | undefined> | string | null | undefined,
  fallbackId: string = ''
): string {
  if (rowOrTgl && typeof rowOrTgl === 'object') {
    const tgl = (rowOrTgl['tgl_masuk'] ?? '').toString().trim();
    if (tgl && tgl !== '0000-00-00' && tgl !== '-' && tgl !== 'null') return tgl;
    return (rowOrTgl['id_karyawan'] ?? '').toString().trim();
  }
  const tgl = (rowOrTgl ?? '').toString().trim();
  if (tgl && tgl !== '0000-00-00' && tgl !== '-') return tgl;
  return fallbackId.trim();
}

// ─── hitungMasaKerja ─────────────────────────────────────────────────────────
// Port dari PHP: hitungMasaKerja()
export function hitungMasaKerja(
  tglMasuk: Record<string, string | null | undefined> | string | null | undefined,
  fallbackId: string = ''
): string {
  const tgl = resolveTglMasuk(tglMasuk, fallbackId);
  if (!tgl) return '-';

  let tglClean = tgl.trim();

  // Parse DD-MM-YYYY atau DD/MM/YYYY → YYYY-MM-DD
  const dmyMatch = tglClean.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    tglClean = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  const masuk = new Date(tglClean);
  if (isNaN(masuk.getTime())) return '-';

  const sekarang = new Date();
  if (masuk > sekarang) return 'Baru Bergabung';

  const totalBulan =
    (sekarang.getFullYear() - masuk.getFullYear()) * 12 +
    (sekarang.getMonth() - masuk.getMonth());

  if (totalBulan <= 0) return 'Baru Bergabung';

  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;

  if (tahun === 0) return `${bulan} Bulan`;
  if (bulan === 0) return `${tahun} Tahun`;
  return `${tahun} Tahun ${bulan} Bulan`;
}

// ─── getFormattedTglMasuk ────────────────────────────────────────────────────
// Port dari PHP: getFormattedTglMasuk()
// Output: DD-MM-YYYY
export function getFormattedTglMasuk(
  raw: Record<string, string | null | undefined> | string | null | undefined,
  fallbackId: string = ''
): string {
  const val = resolveTglMasuk(raw, fallbackId).trim();
  if (!val) return '-';

  // Sudah format DD-MM-YYYY
  const dmyMatch = val.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[1].padStart(2, '0')}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[3]}`;
  }

  // Format YYYY-MM-DD (dari PostgreSQL DATE)
  const ymdMatch = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`;
  }

  const ts = new Date(val);
  if (!isNaN(ts.getTime())) {
    const d = ts.getDate().toString().padStart(2, '0');
    const m = (ts.getMonth() + 1).toString().padStart(2, '0');
    const y = ts.getFullYear();
    return `${d}-${m}-${y}`;
  }

  return val;
}

// ─── parseWaktuToTimestamp ────────────────────────────────────────────────────
// Port dari PHP: parseWaktuToTimestamp()
// Parse "Thursday, 05-12-2024 09:26:37 am" ke Date
export function parseWaktuToDate(waktu: string | null | undefined): Date | null {
  if (!waktu) return null;

  // Coba format: "Thursday, DD-MM-YYYY HH:MM:SS am/pm"
  const match = waktu.match(
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?)?/i
  );

  if (match) {
    const day = match[1].padStart(2, '0');
    const mon = match[2].padStart(2, '0');
    const year = match[3];
    let hour = parseInt(match[4] ?? '0', 10);
    const min = match[5] ?? '00';
    const sec = match[6] ?? '00';
    const ampm = (match[7] ?? '').toLowerCase();

    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;

    // Parse sebagai Asia/Jakarta, konversi ke UTC
    const jakartaStr = `${year}-${mon}-${day}T${hour.toString().padStart(2, '0')}:${min}:${sec}`;
    return fromZonedTime(jakartaStr, TZ);
  }

  const d = new Date(waktu);
  return isNaN(d.getTime()) ? null : d;
}

// ─── getNowJakarta ────────────────────────────────────────────────────────────
// Dapatkan waktu sekarang dalam timezone Asia/Jakarta
export function getNowJakarta(): Date {
  return toZonedTime(new Date(), TZ);
}

// ─── formatWaktuJakarta ───────────────────────────────────────────────────────
// Format Date ke string Indonesia seperti PHP lama: "Thursday, 05-12-2024 09:26:37 am"
export function formatWaktuIndonesia(date: Date): string {
  return formatTZ(toZonedTime(date, TZ), "EEEE, dd-MM-yyyy HH:mm:ss", { timeZone: TZ });
}

// ─── getTanggalHariIni ───────────────────────────────────────────────────────
// "DD-MM-YYYY" dalam timezone Jakarta (untuk query LIKE)
export function getTanggalHariIni(): string {
  return formatTZ(toZonedTime(new Date(), TZ), 'dd-MM-yyyy', { timeZone: TZ });
}

// ─── getJabatanIcon ──────────────────────────────────────────────────────────
// Lookup icon jabatan dari list (server-side cache via Map)
const jabatanIconCache = new Map<string, string>();

export function getCachedJabatanIcon(namaJabatan: string, jabatanList: Array<{jabatan: string; icon: string}>): string {
  if (!namaJabatan) return 'fas fa-briefcase';
  if (jabatanIconCache.has(namaJabatan)) return jabatanIconCache.get(namaJabatan)!;
  const found = jabatanList.find(j => j.jabatan === namaJabatan);
  const icon = found?.icon ?? 'fas fa-briefcase';
  jabatanIconCache.set(namaJabatan, icon);
  return icon;
}

// ─── generateIdKaryawan ──────────────────────────────────────────────────────
// Port dari PHP auto-generate ID: format "DD-MM-YYYY" dengan suffix jika duplikat
export function generateBaseIdKaryawan(tglMasuk: Date | string): string {
  const d = typeof tglMasuk === 'string' ? new Date(tglMasuk) : tglMasuk;
  const day = d.getDate().toString().padStart(2, '0');
  const mon = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
}

// ─── isTelat ─────────────────────────────────────────────────────────────────
// Cek apakah absen masuk terlambat (setelah 08:00 WIB) — kecuali OPERATOR
export function isTelat(
  tipeAbsen: string,
  jabatan: string,
  nowJakarta: Date,
  durasiIstirahatMenit?: number
): boolean {
  const isOperator = jabatan.toUpperCase() === 'OPERATOR';
  if (isOperator) return false;

  if (tipeAbsen === 'masuk') {
    const jam = nowJakarta.getHours();
    const menit = nowJakarta.getMinutes();
    const totalMenit = jam * 60 + menit;
    return totalMenit > 8 * 60; // Setelah 08:00
  }

  if (tipeAbsen === 'istirahat_selesai' && durasiIstirahatMenit !== undefined) {
    const isK1 = jabatan.toUpperCase() === 'K1';
    const maxIstirahat = isK1 ? 90 : 60;
    return durasiIstirahatMenit > maxIstirahat;
  }

  return false;
}

// ─── getDurasiIstirahat ───────────────────────────────────────────────────────
// Hitung durasi istirahat dalam menit dari waktu mulai sampai sekarang
export function getDurasiIstirahat(waktuMulaiIstirahat: Date): number {
  const now = new Date();
  return Math.round((now.getTime() - waktuMulaiIstirahat.getTime()) / 60000);
}

// ─── filterByPeriode ─────────────────────────────────────────────────────────
// Hitung cutoff timestamp berdasarkan periode filter
export function getCutoffByPeriode(periode: string): Date | null {
  const now = new Date();
  switch (periode) {
    case '1pekan':  return new Date(now.getTime() - 7 * 86400 * 1000);
    case '1bulan':  return new Date(now.getTime() - 30 * 86400 * 1000);
    case '6bulan':  return new Date(now.getTime() - 180 * 86400 * 1000);
    case '1tahun':  return new Date(now.getTime() - 365 * 86400 * 1000);
    default:        return null;
  }
}

export function getLabelPeriode(periode: string): string {
  const map: Record<string, string> = {
    '1pekan': '1 Pekan Terakhir',
    '1bulan': '1 Bulan Terakhir',
    '6bulan': '6 Bulan Terakhir',
    '1tahun': '1 Tahun Terakhir',
    'semua':  'Semua Waktu',
  };
  return map[periode] ?? 'Semua Waktu';
}

// ─── kategoriBadge ───────────────────────────────────────────────────────────
// Tentukan kategori laporan: "Cuti" atau "Izin" (Sakit & Cuti → Cuti)
export function getKategoriKeterangan(keterangan: string): 'Cuti' | 'Izin' {
  return (keterangan === 'Cuti' || keterangan === 'Sakit') ? 'Cuti' : 'Izin';
}

export { TZ };
