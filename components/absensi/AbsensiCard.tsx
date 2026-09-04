'use client';
// components/absensi/AbsensiCard.tsx — Core absensi UI (client component)
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Absen } from '@/types/database';

interface AbsensiCardProps {
  karyawan: {
    id_karyawan: string; nama: string; jabatan: string;
    jenkel: string; tgl_masuk: string | null;
  };
  absenHariIni: Absen[];
  notifCount: number;
  tglMasukFormatted: string;
  masaKerja: string;
  tanggalHari: string;
}

type FlashData = { success: boolean; label?: string; tipe?: string; waktu?: string; is_telat?: number; telat_msg?: string; message?: string; };

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseWaktuStr(waktuStr: string | null | undefined): string {
  if (!waktuStr) return '';
  const m = waktuStr.match(/(\d{2}:\d{2}:\d{2})/);
  return m ? m[1] : '';
}

/** Batas istirahat: K2 = 90 menit, hari Jumat = 90 menit untuk semua, lainnya 60 menit */
function getMaxIstirahatClient(jabatan: string): number {
  const isK2 = jabatan.toUpperCase() === 'K2';
  if (isK2) return 90;
  const isJumat = new Date().getDay() === 5;
  return isJumat ? 90 : 60;
}

/** Map tipe absen ke file audio */
function getAudioFile(tipe: string, isTelat: boolean): string | null {
  if (isTelat) return '/audio/terlambat.mp3';
  const map: Record<string, string> = {
    masuk: '/audio/absen_masuk.mp3',
    istirahat_mulai: '/audio/istirahat.mp3',
    istirahat_selesai: '/audio/absen_masuk.mp3',
    pulang: '/audio/pulang.mp3',
  };
  return map[tipe] ?? null;
}

// ─── Sub Components ──────────────────────────────────────────────────────────

function TimelineStep({ done, active, icon, label, time }: { done: boolean; active: boolean; icon: string; label: string; time?: string }) {
  return (
    <div className="ts-item">
      <div className={`ts-icon ${done ? 'ts-done' : active ? 'ts-active' : 'ts-empty'}`}>
        <i className={icon} />
      </div>
      <div className="ts-label">{label}</div>
      {time && <div className="ts-time">{time}</div>}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AbsensiCard({ karyawan, absenHariIni: initAbsen, notifCount: initNotif, tglMasukFormatted, masaKerja, tanggalHari }: AbsensiCardProps) {
  const router = useRouter();
  const [absen, setAbsen] = useState<Absen[]>(initAbsen);
  const [notifCount, setNotifCount] = useState(initNotif);
  const [flash, setFlash] = useState<FlashData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [jam, setJam] = useState('');
  const [countdown, setCountdown] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const warned5MinRef = useRef(false);

  // ─── Live Clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    function updateJam() {
      const now = new Date();
      setJam(now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }
    updateJam();
    const t = setInterval(updateJam, 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Fungsi putar audio ──────────────────────────────────────────────────
  const playAudio = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.play().catch(() => {/* autoplay blocked — OK */});
  }, []);

  // ─── Countdown Istirahat + Peringatan Sisa 5 Menit ──────────────────────
  useEffect(() => {
    const istMulai = absen.find(a => a.tipe_absen === 'istirahat_mulai');
    const istSelesai = absen.find(a => a.tipe_absen === 'istirahat_selesai');
    if (!istMulai || istSelesai) { setCountdown(null); warned5MinRef.current = false; return; }

    const maxMenit = getMaxIstirahatClient(karyawan.jabatan);
    const mulaiTs = new Date(istMulai.waktu).getTime();

    function updateCountdown() {
      const remaining = Math.max(0, (mulaiTs + maxMenit * 60 * 1000) - Date.now());

      // Peringatan sisa 5 menit (hanya sekali)
      if (remaining <= 5 * 60 * 1000 && remaining > 4 * 60 * 1000 && !warned5MinRef.current) {
        warned5MinRef.current = true;
        playAudio('/audio/sisa_5menit.mp3');
      }

      if (remaining === 0) { setCountdown('Waktu habis!'); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
    updateCountdown();
    const t = setInterval(updateCountdown, 1000);
    return () => clearInterval(t);
  }, [absen, karyawan.jabatan, playAudio]);

  // ─── Poll notif setiap 30 detik ──────────────────────────────────────────
  useEffect(() => {
    async function pollNotif() {
      const res = await fetch('/api/karyawan/notifikasi');
      if (res.ok) { const d = await res.json(); setNotifCount(d.count ?? 0); }
    }
    const t = setInterval(pollNotif, 30000);
    return () => clearInterval(t);
  }, []);

  // ─── Handler Absen ───────────────────────────────────────────────────────
  async function handleAbsen(tipe: string) {
    setLoading(tipe);
    setFlash(null);
    try {
      const res = await fetch('/api/karyawan/absen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipe_absen: tipe }),
      });
      const data = await res.json();
      if (data.success) {
        setFlash(data);

        // ── Putar audio sesuai tipe absen ──
        const audioFile = getAudioFile(tipe, (data.is_telat ?? 0) === 1);
        if (audioFile) playAudio(audioFile);

        // Reset flag peringatan saat mulai istirahat
        if (tipe === 'istirahat_mulai') warned5MinRef.current = false;

        // Refresh data absen
        const r2 = await fetch('/api/karyawan/absen');
        if (r2.ok) { const d2 = await r2.json(); setAbsen(d2.absen ?? []); }
        router.refresh();
      } else {
        setFlash({ success: false, message: data.error });
      }
    } catch {
      setFlash({ success: false, message: 'Gagal koneksi. Coba lagi.' });
    } finally {
      setLoading(null);
    }
  }

  // ─── State Absen ─────────────────────────────────────────────────────────
  const absenMasuk       = absen.find(a => a.tipe_absen === 'masuk');
  const absenIstMulai    = absen.find(a => a.tipe_absen === 'istirahat_mulai');
  const absenIstSelesai  = absen.find(a => a.tipe_absen === 'istirahat_selesai');
  const absenPulang      = absen.find(a => a.tipe_absen === 'pulang');
  const isOperator       = karyawan.jabatan.toUpperCase() === 'OPERATOR';
  const maxMenit         = getMaxIstirahatClient(karyawan.jabatan);

  // Determine current step / allowed action
  let nextAction: string | null = null;
  let nextLabel = ''; let nextClass = ''; let nextIcon = '';
  if (!absenMasuk) { nextAction = 'masuk'; nextLabel = 'Absen Masuk'; nextClass = 'btn-masuk'; nextIcon = 'fas fa-sign-in-alt'; }
  else if (!absenIstMulai) { nextAction = 'istirahat_mulai'; nextLabel = 'Mulai Istirahat'; nextClass = 'btn-istirahat'; nextIcon = 'fas fa-utensils'; }
  else if (!absenIstSelesai) { nextAction = 'istirahat_selesai'; nextLabel = 'Selesai Istirahat'; nextClass = 'btn-kembali'; nextIcon = 'fas fa-undo-alt'; }
  else if (!absenPulang) { nextAction = 'pulang'; nextLabel = 'Absen Pulang'; nextClass = 'btn-pulang'; nextIcon = 'fas fa-sign-out-alt'; }

  const sudahLengkap = !!absenPulang;

  return (
    <main style={{ padding: '24px', maxWidth: '540px', margin: '0 auto' }}>
      {/* Header Info Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
            Halo, {karyawan.nama.split(' ')[0]}! 👋
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
            {tanggalHari.replace(/(\d+)-(\d+)-(\d+)/, '$1/$2/$3')} &middot;{' '}
            <span className="badge badge-jabatan">{karyawan.jabatan || 'Karyawan'}</span>
          </p>
        </div>
        <Link href="/karyawan/notifikasi" className="notif-bell-wrapper" style={{ color: '#374151' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#374151', padding: '6px' }}>
            <i className="fas fa-bell" />
          </button>
          {notifCount > 0 && (
            <span className="notif-badge">{notifCount > 9 ? '9+' : notifCount}</span>
          )}
        </Link>
      </div>

      {/* Live Clock */}
      <div style={{
        background: 'linear-gradient(135deg, #170d2b, #2e1065)',
        color: '#fff', borderRadius: '14px',
        padding: '20px 24px', textAlign: 'center', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '0.78rem', opacity: 0.7, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Waktu Sekarang (WIB)
        </div>
        <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{jam}</div>
        <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '4px' }}>
          Masa Kerja: <strong>{masaKerja}</strong> &middot; Bergabung: {tglMasukFormatted}
        </div>
      </div>

      {/* Countdown Istirahat */}
      {countdown && !absenIstSelesai && (
        <div className="countdown-box" style={{ marginBottom: '16px' }}>
          <div className="cd-label">Sisa Waktu Istirahat</div>
          <div className="cd-time">{countdown}</div>
          <div className="cd-sub">Batas: {maxMenit === 90 ? '90 menit' : '60 menit'}</div>
        </div>
      )}

      {/* Flash Message */}
      {flash && (
        <div className={`alert ${flash.success ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
          <i className={`fas ${flash.success ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
          <div>
            {flash.success
              ? <><strong>{flash.label}</strong> berhasil dicatat pukul <strong>{flash.waktu}</strong>{flash.telat_msg && <span style={{ color: '#d97706' }}> {flash.telat_msg}</span>}</>
              : flash.message}
          </div>
        </div>
      )}

      {/* Timeline Status */}
      <div className="timeline-status" style={{ marginBottom: '16px' }}>
        <TimelineStep done={!!absenMasuk}   active={!absenMasuk}         icon="fas fa-sign-in-alt"  label="Masuk"     time={parseWaktuStr(absenMasuk?.waktu_str)} />
        <div className={`ts-divider${absenMasuk ? ' done' : ''}`} />
        <TimelineStep done={!!absenIstMulai} active={!!absenMasuk && !absenIstMulai} icon="fas fa-utensils"     label="Istirahat" time={parseWaktuStr(absenIstMulai?.waktu_str)} />
        <div className={`ts-divider${absenIstSelesai ? ' done' : ''}`} />
        <TimelineStep done={!!absenIstSelesai} active={!!absenIstMulai && !absenIstSelesai} icon="fas fa-undo-alt"  label="Kembali"   time={parseWaktuStr(absenIstSelesai?.waktu_str)} />
        <div className={`ts-divider${absenPulang ? ' done' : ''}`} />
        <TimelineStep done={!!absenPulang}  active={!!absenIstSelesai && !absenPulang} icon="fas fa-sign-out-alt" label="Pulang"    time={parseWaktuStr(absenPulang?.waktu_str)} />
      </div>

      {/* Main Absen Button */}
      <div style={{ marginBottom: '12px' }}>
        {sudahLengkap ? (
          <button className="btn-absen btn-done" disabled style={{ cursor: 'default' }}>
            <i className="fas fa-check-circle" /> Presensi Hari Ini Selesai
          </button>
        ) : nextAction ? (
          <button
            className={`btn-absen ${nextClass}`}
            disabled={!!loading}
            onClick={() => handleAbsen(nextAction!)}
          >
            {loading === nextAction
              ? <><i className="fas fa-spinner fa-spin" /> Memproses...</>
              : <><i className={nextIcon} /> {nextLabel}</>}
          </button>
        ) : null}
      </div>

      {/* Reset Button (Operator only) */}
      {isOperator && absenMasuk && !sudahLengkap && (
        <button
          className="btn-absen"
          style={{ background: '#f3f4f6', color: '#374151', boxShadow: 'none', marginBottom: '12px' }}
          onClick={() => handleAbsen('reset_test')}
          disabled={!!loading}
        >
          <i className="fas fa-redo" /> Reset Presensi Hari Ini (Testing)
        </button>
      )}

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
        <Link href="/karyawan/izin" style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '14px', textAlign: 'center', textDecoration: 'none', color: '#374151',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}>
          <i className="fas fa-calendar-alt" style={{ fontSize: '1.3rem', color: '#4f46e5' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Pengajuan Izin/Cuti</span>
        </Link>
        <Link href="/karyawan/profil" style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
          padding: '14px', textAlign: 'center', textDecoration: 'none', color: '#374151',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}>
          <i className="fas fa-user-circle" style={{ fontSize: '1.3rem', color: '#0891b2' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Profil Saya</span>
        </Link>
      </div>
    </main>
  );
}
