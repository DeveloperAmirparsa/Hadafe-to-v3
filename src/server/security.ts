import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Student } from '../types/index.js';

const SCRYPT_N = 1 << 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 64 * 1024 * 1024;

export type PublicStudent = Omit<Student, 'password' | 'passwordHash'>;

export function normalizeUsername(username: string): string {
  return String(username ?? '').trim().toLowerCase();
}

export function isStrongPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 10 && password.length <= 128;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const derived = scryptSync(password.normalize('NFKC'), salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEMORY,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derived.toString('base64url')}`;
}

export function verifyPassword(password: string, encoded: string | undefined): boolean {
  if (!encoded) return false;
  const parts = encoded.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, salt, digest] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(r) || !Number.isSafeInteger(p) || !salt || !digest) return false;
  try {
    const expected = Buffer.from(digest, 'base64url');
    const actual = scryptSync(password.normalize('NFKC'), salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: MAX_MEMORY,
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  return randomBytes(48).toString('base64url');
}

export function sanitizeStudent(student: Student | null | undefined): PublicStudent | null {
  if (!student) return null;
  const { password: _password, passwordHash: _passwordHash, ...safe } = student;
  return safe;
}
