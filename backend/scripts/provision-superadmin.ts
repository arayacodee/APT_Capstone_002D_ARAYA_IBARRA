import { prisma } from '../src/lib/prisma.js';
import { env } from '../src/config/env.js';

// Apply the SUPERADMIN migration first, only against the confirmed development database.
try {
  if (!env.SUPERADMIN_PASSWORD_HASH) throw new Error('Configura primero las credenciales con npm run admin:configure.');
  const existing = await prisma.user.findUnique({ where: { email: env.SUPERADMIN_LOGIN } });
  if (existing && (existing.googleId || existing.role !== 'SUPERADMIN')) throw new Error('El identificador pertenece a otra cuenta. No se modificó.');
  await prisma.user.upsert({ where: { email: env.SUPERADMIN_LOGIN }, update: {}, create: { email: env.SUPERADMIN_LOGIN, name: 'Administración Cronos', role: 'SUPERADMIN' } });
  console.log('Cuenta compartida habilitada. Ingresa con usuario y contraseña en /admin/login.');
} finally { await prisma.$disconnect(); }
