// types/database.ts — Database type definitions

export type TipeAbsen = 'masuk' | 'istirahat_mulai' | 'istirahat_selesai' | 'pulang';
export type StatusKeterangan = 'Proses' | 'Disetujui' | 'Ditolak';
export type TipeNotifikasi = 'telat_masuk' | 'telat_istirahat' | 'approval' | 'penolakan' | 'info';

export type Jabatan = {
  id: number;
  jabatan: string;
  icon: string;
  created_at: string;
};

export type Owner = {
  id: number;
  username: string;
  password: string;
  nama: string;
  created_at: string;
};

export type Admin = {
  id: number;
  username: string;
  password: string;
  created_at: string;
};

export type Karyawan = {
  id_karyawan: string;
  username: string;
  password: string;
  nama: string;
  tmp_tgl_lahir: string;
  jenkel: string;
  agama: string;
  alamat: string;
  no_tel: string;
  jabatan: string;
  foto: string;
  tgl_masuk: string | null;
  created_at: string;
};

export type Absen = {
  id: number;
  id_karyawan: string;
  nama: string;
  waktu: string;
  waktu_str: string | null;
  tipe_absen: TipeAbsen;
  is_telat: number;
  durasi_istirahat: number | null;
  created_at: string;
};

export type Keterangan = {
  id: number;
  id_karyawan: string;
  nama: string;
  keterangan: string;
  tgl_mulai: string | null;
  tgl_selesai: string | null;
  alasan: string;
  waktu: string;
  bukti: string;
  status: StatusKeterangan;
  created_at: string;
};

export type Notifikasi = {
  id: number;
  id_karyawan: string;
  nama: string;
  pesan: string;
  tipe: TipeNotifikasi | string;
  dibaca: number;
  created_at: string;
};

// Supabase Database type map
export type Database = {
  public: {
    Tables: {
      tb_jabatan: {
        Row: Jabatan;
        Insert: Omit<Jabatan, 'id' | 'created_at'>;
        Update: Partial<Omit<Jabatan, 'id'>>;
        Relationships: [];
      };
      tb_owner: {
        Row: Owner;
        Insert: Omit<Owner, 'id' | 'created_at'>;
        Update: Partial<Omit<Owner, 'id'>>;
        Relationships: [];
      };
      tb_daftar: {
        Row: Admin;
        Insert: Omit<Admin, 'id' | 'created_at'>;
        Update: Partial<Omit<Admin, 'id'>>;
        Relationships: [];
      };
      tb_karyawan: {
        Row: Karyawan;
        Insert: Omit<Karyawan, 'created_at'>;
        Update: Partial<Karyawan>;
        Relationships: [];
      };
      tb_absen: {
        Row: Absen;
        Insert: Omit<Absen, 'id' | 'created_at'>;
        Update: Partial<Omit<Absen, 'id'>>;
        Relationships: [];
      };
      tb_keterangan: {
        Row: Keterangan;
        Insert: Omit<Keterangan, 'id' | 'created_at'>;
        Update: Partial<Omit<Keterangan, 'id'>>;
        Relationships: [];
      };
      tb_notifikasi: {
        Row: Notifikasi;
        Insert: Omit<Notifikasi, 'id' | 'created_at'>;
        Update: Partial<Omit<Notifikasi, 'id'>>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

