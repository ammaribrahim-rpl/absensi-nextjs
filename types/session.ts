// types/session.ts — Session payload types

export type UserRole = 'owner' | 'admin' | 'karyawan';

export interface OwnerSession {
  role: 'owner';
  id: number;
  username: string;
  nama: string;
}

export interface AdminSession {
  role: 'admin';
  id: number;
  username: string;
}

export interface KaryawanSession {
  role: 'karyawan';
  id_karyawan: string;
  username: string;
  nama: string;
  jabatan: string;
  jenkel: string;
  agama: string;
  alamat: string;
  no_tel: string;
  tmp_tgl_lahir: string;
  foto: string;
  tgl_masuk: string | null;
}

export type SessionPayload = OwnerSession | AdminSession | KaryawanSession;
