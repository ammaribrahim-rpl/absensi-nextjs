-- =============================================================================
-- SUPABASE POSTGRESQL SCHEMA
-- Disinkronisasi dari: karyawansi.sql (MySQL / MariaDB)
-- Database: karyawansi
-- =============================================================================

-- ─── Extensions ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- STRUKTUR TABEL
-- =============================================================================

-- ─── tb_jabatan ──────────────────────────────────────────────────────────────
-- Tidak ada created_at di MySQL asli — kita tambahkan untuk Supabase
CREATE TABLE IF NOT EXISTS tb_jabatan (
    id      SERIAL PRIMARY KEY,
    jabatan VARCHAR(255) NOT NULL UNIQUE,
    icon    VARCHAR(50)  NOT NULL DEFAULT 'fas fa-briefcase',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jabatan_unique ON tb_jabatan(jabatan);


-- ─── tb_owner ────────────────────────────────────────────────────────────────
-- MySQL: id, username, password, nama (tidak ada created_at)
CREATE TABLE IF NOT EXISTS tb_owner (
    id       SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama     VARCHAR(100) NOT NULL DEFAULT 'Owner Executive',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── tb_daftar (Administrator) ───────────────────────────────────────────────
-- MySQL: id, username, password (tidak ada created_at)
CREATE TABLE IF NOT EXISTS tb_daftar (
    id       SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── tb_karyawan ─────────────────────────────────────────────────────────────
-- MySQL: id_karyawan, username, password, nama, tmp_tgl_lahir, jenkel,
--        agama, alamat, no_tel, tgl_masuk, jabatan, foto
-- CATATAN: foto di MySQL adalah varchar(50), bisa berisi '-' atau nama file
CREATE TABLE IF NOT EXISTS tb_karyawan (
    id_karyawan  VARCHAR(50)  PRIMARY KEY,
    username     VARCHAR(50)  NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    nama         VARCHAR(255) NOT NULL,
    tmp_tgl_lahir VARCHAR(255) NOT NULL DEFAULT '-',
    jenkel       VARCHAR(255) NOT NULL DEFAULT '-',
    agama        VARCHAR(255) NOT NULL DEFAULT '-',
    alamat       TEXT         NOT NULL DEFAULT '-',
    no_tel       VARCHAR(20)  NOT NULL DEFAULT '-',
    tgl_masuk    DATE,
    jabatan      VARCHAR(255) NOT NULL DEFAULT '',
    foto         VARCHAR(255) NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── tb_absen ────────────────────────────────────────────────────────────────
-- MySQL: id, id_karyawan, nama, waktu (VARCHAR!), tipe_absen (enum), is_telat
-- CATATAN PENTING: di MySQL, waktu disimpan sebagai VARCHAR format Indonesia
--   contoh: "Monday, 01-09-2025 08:05:23 am"
-- Di Supabase kita simpan sebagai TIMESTAMPTZ (UTC) + waktu_str (string asli)
-- Kolom tambahan: waktu_str, durasi_istirahat (tidak ada di MySQL asli)
CREATE TABLE IF NOT EXISTS tb_absen (
    id                BIGSERIAL PRIMARY KEY,
    id_karyawan       VARCHAR(50)  NOT NULL,
    nama              VARCHAR(255) NOT NULL,
    waktu             TIMESTAMPTZ  NOT NULL,
    waktu_str         VARCHAR(255),           -- Menyimpan string waktu asli Indonesia
    tipe_absen        VARCHAR(30)  NOT NULL DEFAULT 'masuk'
                      CHECK (tipe_absen IN ('masuk','istirahat_mulai','istirahat_selesai','pulang')),
    is_telat          SMALLINT     NOT NULL DEFAULT 0,
    durasi_istirahat  INTEGER,                -- Menit — hanya diisi saat istirahat_selesai
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_absen_karyawan FOREIGN KEY (id_karyawan)
        REFERENCES tb_karyawan(id_karyawan) ON DELETE CASCADE
);

-- ─── tb_keterangan (Izin/Cuti/Sakit) ─────────────────────────────────────────
-- MySQL: id, id_karyawan, nama, keterangan, tgl_mulai (varchar), tgl_selesai (varchar),
--        alasan, waktu (varchar), bukti, status
-- CATATAN: tgl_mulai/tgl_selesai di MySQL disimpan VARCHAR (bukan DATE)
CREATE TABLE IF NOT EXISTS tb_keterangan (
    id          SERIAL PRIMARY KEY,
    id_karyawan VARCHAR(50)  NOT NULL,
    nama        VARCHAR(255) NOT NULL,
    keterangan  VARCHAR(255) NOT NULL,         -- 'Izin', 'Sakit', 'Cuti'
    tgl_mulai   VARCHAR(50),                    -- Disimpan sebagai VARCHAR seperti MySQL asli
    tgl_selesai VARCHAR(50),
    alasan      TEXT         NOT NULL DEFAULT '',
    waktu       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    bukti       VARCHAR(255) NOT NULL DEFAULT '',
    status      VARCHAR(50)  NOT NULL DEFAULT 'Proses'
                CHECK (status IN ('Proses', 'Disetujui', 'Ditolak')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ket_karyawan FOREIGN KEY (id_karyawan)
        REFERENCES tb_karyawan(id_karyawan) ON DELETE CASCADE
);

-- ─── tb_notifikasi ───────────────────────────────────────────────────────────
-- MySQL: id, id_karyawan, nama, pesan, tipe, dibaca, created_at
CREATE TABLE IF NOT EXISTS tb_notifikasi (
    id          BIGSERIAL    PRIMARY KEY,
    id_karyawan VARCHAR(50)  NOT NULL,
    nama        VARCHAR(255) NOT NULL,
    pesan       TEXT         NOT NULL,
    tipe        VARCHAR(50)  NOT NULL DEFAULT 'info',
    dibaca      SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notif_karyawan FOREIGN KEY (id_karyawan)
        REFERENCES tb_karyawan(id_karyawan) ON DELETE CASCADE
);

-- =============================================================================
-- INDEX untuk performa query
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_absen_karyawan     ON tb_absen(id_karyawan);
CREATE INDEX IF NOT EXISTS idx_absen_waktu        ON tb_absen(waktu DESC);
CREATE INDEX IF NOT EXISTS idx_absen_tipe         ON tb_absen(tipe_absen);
CREATE INDEX IF NOT EXISTS idx_ket_karyawan       ON tb_keterangan(id_karyawan);
CREATE INDEX IF NOT EXISTS idx_ket_status         ON tb_keterangan(status);
CREATE INDEX IF NOT EXISTS idx_notif_karyawan     ON tb_notifikasi(id_karyawan);
CREATE INDEX IF NOT EXISTS idx_notif_dibaca       ON tb_notifikasi(dibaca);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Dinonaktifkan — akses via service_role key dari server-side saja
-- =============================================================================
ALTER TABLE tb_jabatan    DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_owner      DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_daftar     DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_karyawan   DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_absen      DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_keterangan DISABLE ROW LEVEL SECURITY;
ALTER TABLE tb_notifikasi DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DATA DARI karyawansi.sql
-- Password $2y$ (PHP bcrypt) kompatibel dengan $2b$ (Node.js bcryptjs)
-- =============================================================================

-- ─── tb_jabatan ──────────────────────────────────────────────────────────────
INSERT INTO tb_jabatan (jabatan, icon) VALUES
    ('Driver',     'fas fa-truck'),
    ('Pramuniaga', 'fas fa-headset'),
    ('Helper',     'fas fa-hands-helping'),
    ('Gudang',     'fas fa-boxes'),
    ('Online',     'fas fa-laptop'),
    ('Staff IT',   'fas fa-cogs'),
    ('K1',         'fas fa-cash-register'),
    ('K2',         'fas fa-cash-register'),
    ('Operator',   'fas fa-tools'),
    ('Tester',     'fas fa-vial')
ON CONFLICT (jabatan) DO UPDATE SET icon = EXCLUDED.icon;

-- ─── tb_owner ────────────────────────────────────────────────────────────────
-- username: owner | password: (dari MySQL asli — $2y$ kompatibel dengan bcryptjs)
INSERT INTO tb_owner (username, password, nama) VALUES
    ('owner', '$2y$10$wlnQv.rhp3KjWe.0M49UteJgkQoJUS6RSdnwuGKVXTWLCiWC1zFuW', 'Owner Executive')
ON CONFLICT (username) DO UPDATE
    SET password = EXCLUDED.password, nama = EXCLUDED.nama;

-- ─── tb_daftar (Admin) ───────────────────────────────────────────────────────
-- username: admin | password: (dari MySQL asli)
INSERT INTO tb_daftar (username, password) VALUES
    ('admin', '$2y$10$ZNer4CqQlYl7WO6kvjeX1ODspfQATA56hpZ9R..MiXQYztJOF7z72')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;

-- ─── tb_karyawan ─────────────────────────────────────────────────────────────
-- Data persis dari karyawansi.sql
INSERT INTO tb_karyawan (id_karyawan, username, password, nama, tmp_tgl_lahir, jenkel, agama, alamat, no_tel, tgl_masuk, jabatan, foto) VALUES
    ('01-09-2024', 'user',   '$2y$10$PpuGf1v9tTcDSqddtypbZuUUAewAFPzqezG2rgc9RtsEO.9YByew2', 'Username',     '-',  'Laki-laki',  '-', '-', '081213331355',    '2024-09-01', 'Operator',   '-'),
    ('01-09-2025', 'devi',   '$2y$10$JUfBvXgEbuvM.Y60vm0E2ugYfsHfY8WZv.7Jx0kvhn4jzDLtN/jEa', 'Devi Eryani',  '-',  'Perempuan',  '-', '-', '085691692010',    '2025-09-01', 'Pramuniaga', '-'),
    ('04-01-2018', 'amir',   '$2y$12$OsOC.fnvbgfhabhBErdL5enk0vLePx9KxVBE9vERiLoMZKMIA3v36', 'Amir',         '',   'Laki-laki',  '',  '',  '0878-7859-9790',  '2018-01-04', 'K2',         ''),
    ('06-04-2025', 'usman',  '$2y$12$p3m0RAhfsQ.Yb6JtkPs97OQ15ZbRqcxYPLRcCUUp8zuhunyRRLjCe', 'Usman',        '',   'Laki-laki',  '',  '',  '0857-7300-4438',  '2025-04-06', 'Online',     ''),
    ('09-07-2026', 'ogi',    '$2y$12$sGs6DVZgah2Ze1ynOAIbW.xRXE3nwpMTO1utdq873lLFCHSunZkRq', 'Ogi',          '',   'Laki-laki',  '',  '',  '0858-7541-3817',  '2026-07-09', 'Pramuniaga', ''),
    ('12-06-2019', 'hotib',  '$2y$12$CTkOAKDBjoA1vGYLyK3bNO8zc9o4.z1wNkMMSVpM1gckc8mEHKjw.', 'Hotib Afandi', '',   'Laki-laki',  '',  '',  '0856-9704-7773',  '2019-06-12', 'Gudang',     ''),
    ('13-10-2023', 'acep',   '$2y$12$Fyh4vcmaOs8nzcpd7kmLf.R3DqzKiwO9SZmLk2nCQLNDlg6rMERqy', 'Acep',         '',   'Laki-laki',  '',  '',  '0858-7203-7934',  '2023-10-13', 'K1',         ''),
    ('16-04-2019', 'jaka',   '$2y$12$ch3Yo6VBEAuCK9YVfKuAJOQlbrF918xyDaxxlY5fpldjwAU8YDWVu', 'Jaka',         '',   'Laki-laki',  '',  '',  '0812-1266-1187',  '2019-04-16', 'Driver',     ''),
    ('16-04-2019-1','ilham', '$2y$12$woYdPEWTG9fIi3aZvUHmA.gaKUarJrm2mkmiiLUX9tkqbTjuC3Ja2', 'Ilhamulloh',   '',   'Laki-laki',  '',  '',  '0857-7002-6517',  '2019-04-16', 'K2',         ''),
    ('24-07-2026', 'fauzi',  '$2y$10$EDC2vQZnh71TUTNqStxuO./rdcTaXGwk6AsL7rBGnJl.fBbYwL8Z6', 'Fauzi',        '',   'Laki-laki',  '',  '',  '0858-9138-7800',  '2026-07-24', 'K1',         ''),
    ('27-03-2026', 'sahrul', '$2y$12$zRS8gObo.bLI/dWsL5tb4.gQtolBkh/vD9S000UJc0iO950Vp8/Fe', 'Sahrul',       '',   'Laki-laki',  '',  '',  '0858-9330-5425',  '2026-03-27', 'K2',         ''),
    ('30-01-2022', 'ebi',    '$2y$12$BfleLeUerNkOKtnlVt9I0e63DNRH6SDNuVYqeIvnQ/TghiQRGp10S', 'Ebi Lestari',  '',   'Laki-laki',  '',  '',  '0815-1139-8306',  '2022-01-30', 'K2',         ''),
    ('30-03-2026', 'andri',  '$2y$12$JyYbmJebPmZaJTc.7dyU1Of/1mVKT8vLaJC3CbNigMI1dS0urxbhK', 'Andri',        '',   'Laki-laki',  '',  '',  '0856-9469-48970', '2026-03-30', 'K2',         ''),
    ('30-08-2026', 'ammar',  '$2y$12$fj5MPc2lr5YFN8Z1vbZCxuZ.obUztOokcwrJbW8kZCIt6uHHjHuZ2', 'Ammar Ibrahim','',   'Laki-laki',  '',  '',  '0812-1332-1354',  '2026-08-30', 'Staff IT',   '')
ON CONFLICT (id_karyawan) DO UPDATE
    SET username = EXCLUDED.username,
        password = EXCLUDED.password,
        nama     = EXCLUDED.nama,
        jenkel   = EXCLUDED.jenkel,
        no_tel   = EXCLUDED.no_tel,
        tgl_masuk= EXCLUDED.tgl_masuk,
        jabatan  = EXCLUDED.jabatan,
        foto     = EXCLUDED.foto;

-- ─── tb_notifikasi ───────────────────────────────────────────────────────────
-- Data dari MySQL (1 record): id=3, karyawan 01-09-2024 (Username)
INSERT INTO tb_notifikasi (id_karyawan, nama, pesan, tipe, dibaca, created_at) VALUES
    ('01-09-2024', 'Username',
     'Kamu tercatat TERLAMBAT masuk pada 10:29 WIB. Harap tepat waktu di hari berikutnya.',
     'telat_masuk', 1,
     '2026-09-01 10:29:59+07:00')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- CATATAN PENTING
-- =============================================================================
-- 1. tb_absen di MySQL kosong pada saat export (tidak ada data di dump)
--    → Tidak ada INSERT tb_absen, akan terisi saat karyawan absen pertama kali
--
-- 2. tb_keterangan di MySQL kosong pada saat export
--    → Tidak ada INSERT tb_keterangan
--
-- 3. Password $2y$ (PHP) = $2b$ (Node.js bcryptjs) — KOMPATIBEL LANGSUNG
--    Tidak perlu re-hash, login langsung bisa digunakan
--
-- 4. Kolom 'foto' di MySQL: varchar(50), isi '-' atau '' atau nama file
--    Di Supabase: varchar(255) untuk support URL Supabase Storage di masa depan
--
-- 5. RLS dinonaktifkan — semua akses via SUPABASE_SERVICE_ROLE_KEY (server-side only)
-- =============================================================================
