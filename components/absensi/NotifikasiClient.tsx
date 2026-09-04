'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Notifikasi } from '@/types/database';

const iconMap: Record<string, string> = {
  telat_masuk:     'fas fa-clock text-danger',
  telat_istirahat: 'fas fa-utensils text-warning',
  approval:        'fas fa-check-circle text-success',
  penolakan:       'fas fa-times-circle text-danger',
};

function getIcon(tipe: string): string {
  return iconMap[tipe] ?? 'fas fa-bell text-primary';
}

export default function NotifikasiClient({ notifikasi: initData }: { notifikasi: Notifikasi[] }) {
  const router = useRouter();
  const [data, setData] = useState(initData);

  async function handleHapus(id: number) {
    await fetch(`/api/karyawan/notifikasi?id=${id}`, { method: 'DELETE' });
    setData(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div style={{ padding: '24px', maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
          <i className="fas fa-bell" style={{ marginRight: '8px', color: '#4f46e5' }} />
          Notifikasi
        </h1>
        <button onClick={() => router.back()} className="btn btn-outline btn-sm">
          <i className="fas fa-arrow-left" /> Kembali
        </button>
      </div>

      {data.length === 0 ? (
        <div className="card card-padded" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          <i className="fas fa-bell-slash" style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada notifikasi</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data.map((n) => {
            const iconClass = getIcon(n.tipe);
            const d = new Date(n.created_at);
            const dateStr = d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <div key={n.id} className="card" style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.dibaca ? '#fff' : '#f5f3ff' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={iconClass} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#111827' }}>{n.pesan}</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#9ca3af' }}>{dateStr} WIB</p>
                </div>
                <button onClick={() => handleHapus(n.id)} style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', padding: '4px', fontSize: '0.85rem' }}>
                  <i className="fas fa-times" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
