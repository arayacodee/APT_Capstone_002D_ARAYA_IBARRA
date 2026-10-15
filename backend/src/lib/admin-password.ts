import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const digest = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${digest.toString('hex')}`;
}
export async function verifyAdminPassword(password: string, encoded: string): Promise<boolean> {
  const parts = /^scrypt:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(encoded);
  if (!parts) return false;
  const actual = await scrypt(password, parts[1], 64) as Buffer;
  return timingSafeEqual(actual, Buffer.from(parts[2], 'hex'));
}
