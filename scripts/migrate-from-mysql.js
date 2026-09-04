#!/usr/bin/env node
/**
 * scripts/migrate-from-mysql.js
 * Migrasi data dari MySQL (XAMPP/karyawansi) ke Supabase PostgreSQL
 *
 * Cara pakai:
 *   npm install mysql2 @supabase/supabase-js dotenv
 *   node scripts/migrate-from-mysql.js
 *
 * Konfigurasi bisa lewat .env.local atau ubah MYSQL_CONFIG di bawah.
 */

require('dotenv').config({ path: '.env.local' });
const mysql  = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');

// ── MySQL (sesuaikan dengan XAMPP kamu) ──────────────────────────────────────
const MYSQL_CONFIG = {
  host:       process.env.MYSQL_HOST     || '127.0.0.1',
  port:       parseInt(process.env.MYSQL_PORT || '8080'),   // XAMPP port dari koneksi.php
  user:       process.env.MYSQL_USER     || 'root',
  password:   process.env.MYSQL_PASSWORD || '',
  database:   process.env.MYSQL_DATABASE || 'karyawansi',
  socketPath: process.env.MYSQL_SOCKET   || '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock',
};

// ── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TZ_OFFSET = 7 * 60 * 60 * 1000; // Asia/Jakarta = UTC+7

/**
 * Parse waktu format PHP Indonesia: "Monday, 01-09-2025 08:05:23 am"
 * atau "01-09-2025 08:05:23" ke UTC ISO string
 */
function parseWaktuPHP(waktuStr) {
  if (!waktuStr) return new Date().toISOString();
  const s = String(waktuStr).trim();

  // Format: Day, DD-MM-YYYY HH:MM:SS am/pm
  const m = s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
  if (m) {
    let hour = parseInt(m[4], 10);
    const min  = m[5] || '00';
    const sec  = m[6] || '00';
    const ampm = (m[7] || '').toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    const day = m[1].padStart(2, '0');
    const mon = m[2].padStart(2, '0');
    const yr  = m[3];
    // Buat sebagai WIB (+07:00)
    const iso = `${yr}-${mon}-${day}T${String(hour).padStart(2,'0')}:${min}:${sec}+07:00`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  // Fallback: coba parse langsung
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * Konversi tgl_masuk MySQL DATE (YYYY-MM-DD) → tetap YYYY-MM-DD untuk Supabase DATE
 * MySQL bisa juga berisi format DD-MM-YYYY (id_karyawan format)
 */
function normalizeTglMasuk(val) {
  if (!val || val === '0000-00-00' || val === '-') return null;
  const s = String(val).trim();

  // YYYY-MM-DD (sudah benar)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;

  return null;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function migrate() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║   MIGRASI MySQL (karyawansi) → Supabase           ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  let conn;
  try {
    conn = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Koneksi MySQL berhasil\n');
  } catch (e) {
    console.error('❌ Gagal konek MySQL:', e.message);
    console.log('\n💡 Tips: Pastikan XAMPP berjalan dan MYSQL_CONFIG sesuai.\n');
    process.exit(1);
  }

  const totals = { jabatan:0, owner:0, admin:0, karyawan:0, absen:0, ket:0, notif:0 };

  // ── 1. tb_jabatan ──────────────────────────────────────────────────────────
  console.log('📂 [1/7] Migrasi tb_jabatan...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_jabatan ORDER BY id');
    for (const r of rows) {
      const { error } = await supabase.from('tb_jabatan')
        .upsert({ jabatan: r.jabatan, icon: r.icon || 'fas fa-briefcase' },
          { onConflict: 'jabatan', ignoreDuplicates: false });
      if (error) console.warn(`  ⚠ jabatan "${r.jabatan}": ${error.message}`);
      else totals.jabatan++;
    }
    console.log(`   ✓ ${totals.jabatan}/${rows.length} jabatan\n`);
  } catch(e) { console.warn('   ⚠ Tabel tb_jabatan tidak ditemukan\n'); }

  // ── 2. tb_owner ────────────────────────────────────────────────────────────
  console.log('👑 [2/7] Migrasi tb_owner...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_owner ORDER BY id');
    for (const r of rows) {
      const { error } = await supabase.from('tb_owner')
        .upsert({ username: r.username, password: r.password, nama: r.nama || 'Owner Executive' },
          { onConflict: 'username' });
      if (error) console.warn(`  ⚠ owner "${r.username}": ${error.message}`);
      else totals.owner++;
    }
    console.log(`   ✓ ${totals.owner}/${rows.length} owner\n`);
  } catch(e) { console.warn('   ⚠ Tabel tb_owner tidak ditemukan\n'); }

  // ── 3. tb_daftar (admin) ───────────────────────────────────────────────────
  console.log('🛡️  [3/7] Migrasi tb_daftar (admin)...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_daftar ORDER BY id');
    for (const r of rows) {
      const { error } = await supabase.from('tb_daftar')
        .upsert({ username: r.username, password: r.password },
          { onConflict: 'username' });
      if (error) console.warn(`  ⚠ admin "${r.username}": ${error.message}`);
      else totals.admin++;
    }
    console.log(`   ✓ ${totals.admin}/${rows.length} admin\n`);
  } catch(e) { console.warn('   ⚠ Tabel tb_daftar tidak ditemukan\n'); }

  // ── 4. tb_karyawan ─────────────────────────────────────────────────────────
  console.log('👤 [4/7] Migrasi tb_karyawan...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_karyawan ORDER BY id_karyawan');
    for (const r of rows) {
      const { error } = await supabase.from('tb_karyawan')
        .upsert({
          id_karyawan:   r.id_karyawan,
          username:      r.username,
          password:      r.password,
          nama:          r.nama         || '-',
          tmp_tgl_lahir: r.tmp_tgl_lahir || '-',
          jenkel:        r.jenkel        || '-',
          agama:         r.agama         || '-',
          alamat:        r.alamat        || '-',
          no_tel:        r.no_tel        || '-',
          tgl_masuk:     normalizeTglMasuk(r.tgl_masuk),
          jabatan:       r.jabatan       || '',
          foto:          r.foto          || '',
        }, { onConflict: 'id_karyawan' });
      if (error) console.warn(`  ⚠ karyawan "${r.id_karyawan}": ${error.message}`);
      else totals.karyawan++;
    }
    console.log(`   ✓ ${totals.karyawan}/${rows.length} karyawan\n`);
  } catch(e) { console.warn('   ⚠ Tabel tb_karyawan error:', e.message, '\n'); }

  // ── 5. tb_absen ────────────────────────────────────────────────────────────
  // CATATAN: MySQL menyimpan waktu sebagai VARCHAR ("Monday, 01-09-2025 08:05:23 am")
  // Kita konversi ke TIMESTAMPTZ dan simpan string asli di waktu_str
  console.log('📋 [5/7] Migrasi tb_absen...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_absen ORDER BY id');
    if (rows.length === 0) {
      console.log('   ℹ  tb_absen kosong (belum ada data absensi)\n');
    } else {
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH).map(r => ({
          id_karyawan:      r.id_karyawan,
          nama:             r.nama || '',
          waktu:            parseWaktuPHP(r.waktu),
          waktu_str:        r.waktu || null,
          tipe_absen:       ['masuk','istirahat_mulai','istirahat_selesai','pulang'].includes(r.tipe_absen)
                              ? r.tipe_absen : 'masuk',
          is_telat:         r.is_telat ? 1 : 0,
          durasi_istirahat: r.durasi_istirahat || null,
        }));

        const { error } = await supabase.from('tb_absen').insert(batch);
        if (error) console.warn(`  ⚠ Batch ${i}-${i+BATCH}: ${error.message}`);
        else totals.absen += batch.length;
        await sleep(30);
        process.stdout.write(`\r   Progress: ${Math.min(i+BATCH, rows.length)}/${rows.length}`);
      }
      console.log(`\n   ✓ ${totals.absen}/${rows.length} record absen\n`);
    }
  } catch(e) { console.warn('   ⚠ Tabel tb_absen tidak ditemukan\n'); }

  // ── 6. tb_keterangan ───────────────────────────────────────────────────────
  // CATATAN: MySQL waktu = VARCHAR, tgl_mulai/tgl_selesai = VARCHAR
  console.log('📝 [6/7] Migrasi tb_keterangan...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_keterangan ORDER BY id');
    if (rows.length === 0) {
      console.log('   ℹ  tb_keterangan kosong\n');
    } else {
      for (const r of rows) {
        const validStatus = ['Proses', 'Disetujui', 'Ditolak'];
        const { error } = await supabase.from('tb_keterangan').insert({
          id_karyawan: r.id_karyawan,
          nama:        r.nama || '',
          keterangan:  r.keterangan || 'Izin',
          tgl_mulai:   r.tgl_mulai  || null,
          tgl_selesai: r.tgl_selesai || null,
          alasan:      r.alasan || '',
          bukti:       r.bukti  || '',
          status:      validStatus.includes(r.status) ? r.status : 'Proses',
          waktu:       parseWaktuPHP(r.waktu),
        });
        if (error) console.warn(`  ⚠ keterangan id=${r.id}: ${error.message}`);
        else totals.ket++;
      }
      console.log(`   ✓ ${totals.ket}/${rows.length} keterangan\n`);
    }
  } catch(e) { console.warn('   ⚠ Tabel tb_keterangan tidak ditemukan\n'); }

  // ── 7. tb_notifikasi ───────────────────────────────────────────────────────
  console.log('🔔 [7/7] Migrasi tb_notifikasi...');
  try {
    const [rows] = await conn.query('SELECT * FROM tb_notifikasi ORDER BY id');
    if (rows.length === 0) {
      console.log('   ℹ  tb_notifikasi kosong\n');
    } else {
      for (const r of rows) {
        const { error } = await supabase.from('tb_notifikasi').insert({
          id_karyawan: r.id_karyawan,
          nama:        r.nama  || '',
          pesan:       r.pesan || '',
          tipe:        r.tipe  || 'info',
          dibaca:      r.dibaca ? 1 : 0,
          created_at:  r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        });
        if (error) console.warn(`  ⚠ notifikasi id=${r.id}: ${error.message}`);
        else totals.notif++;
      }
      console.log(`   ✓ ${totals.notif}/${rows.length} notifikasi\n`);
    }
  } catch(e) { console.warn('   ⚠ Tabel tb_notifikasi tidak ditemukan\n'); }

  await conn.end();

  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║   HASIL MIGRASI                                   ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║   tb_jabatan    : ${String(totals.jabatan).padEnd(28)}║`);
  console.log(`║   tb_owner      : ${String(totals.owner).padEnd(28)}║`);
  console.log(`║   tb_daftar     : ${String(totals.admin).padEnd(28)}║`);
  console.log(`║   tb_karyawan   : ${String(totals.karyawan).padEnd(28)}║`);
  console.log(`║   tb_absen      : ${String(totals.absen).padEnd(28)}║`);
  console.log(`║   tb_keterangan : ${String(totals.ket).padEnd(28)}║`);
  console.log(`║   tb_notifikasi : ${String(totals.notif).padEnd(28)}║`);
  console.log('╚═══════════════════════════════════════════════════╝\n');
}

migrate().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('\n💡 Pastikan XAMPP/MySQL berjalan!');
    console.log('   atau set MYSQL_SOCKET=/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock\n');
  }
  process.exit(1);
});
