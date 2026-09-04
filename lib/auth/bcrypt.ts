// lib/auth/bcrypt.ts — bcrypt helper dengan support PHP $2y$ hash
import bcrypt from 'bcryptjs';

/**
 * PHP menggunakan $2y$, Node.js bcryptjs menggunakan $2b$
 * Keduanya identik secara algoritma, hanya prefix berbeda.
 * Fungsi ini menormalisasi agar compare() berhasil.
 */
export function normalizeHash(hash: string): string {
  return hash.startsWith('$2y$') ? hash.replace('$2y$', '$2b$') : hash;
}

/**
 * Bandingkan password plain-text dengan hash (support PHP $2y$, Node $2b$, dan plain-text)
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith('$2y$') || hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
    return bcrypt.compare(plain, normalizeHash(hash));
  }
  return plain === hash;
}

/**
 * Hash password baru menggunakan $2b$ (Node.js standard)
 */
export async function hashPassword(plain: string, rounds = 12): Promise<string> {
  return bcrypt.hash(plain, rounds);
}
