import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { hashAdminPassword } from '../src/lib/admin-password.js';

const input = createInterface({ input: process.stdin, output: process.stdout, terminal: false });
try {
  const password = await input.question('Contraseña para la cuenta compartida (se guardará únicamente el hash): ');
  if (password.length < 8 || password.length > 256) throw new Error('La contraseña debe tener entre 8 y 256 caracteres.');
  const hash = await hashAdminPassword(password);
  const path = new URL('../.env', import.meta.url);
  let contents = await readFile(path, 'utf8');
  for (const [key, value] of [['SUPERADMIN_LOGIN', 'superadmin@cronos'], ['SUPERADMIN_PASSWORD_HASH', hash]]) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    contents = pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
  }
  await writeFile(path, contents, 'utf8');
  console.log('Credenciales configuradas en backend/.env. No se modificó la base de datos.');
} finally { input.close(); }
