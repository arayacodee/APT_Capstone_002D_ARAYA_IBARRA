import { test } from 'node:test';
import assert from 'node:assert/strict';
Object.assign(process.env, { DATABASE_URL: 'postgresql://test:test@localhost/test', GOOGLE_CLIENT_ID: 'test', AUTH_SECRET: 'test-secret-with-at-least-32-characters', CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'test' });
const { prisma } = await import('../src/lib/prisma.js');
const { env } = await import('../src/config/env.js');
const { activateProfessionalDemo } = await import('../src/controllers/professional-demo.controller.js');
function response() { return { code: 200, body: null as any, status(code: number) { this.code = code; return this; }, json(body: any) { this.body = body; return this; } }; }
test('activación de prueba crea perfil propio, conserva negocio existente y bloquea producción y superadmin', async () => {
  const original = prisma.$transaction; const mode = env.NODE_ENV;
  let application: any = { businessName: 'Centro de bienestar', category: 'WELLNESS', description: 'Terapias' };
  let business: any = null; let creates = 0; let promotions = 0;
  prisma.$transaction = (async (callback: any) => callback({
    professionalApplication: { findUnique: async (args: any) => { assert.equal(args.where.userId, 'client'); return application; } },
    user: { update: async (args: any) => { promotions++; assert.equal(args.where.id, 'client'); assert.equal(args.data.role, 'PROFESSIONAL'); return { id: 'client', role: 'PROFESSIONAL' }; } },
    business: { findFirst: async (args: any) => { assert.equal(args.where.ownerId, 'client'); return business; }, create: async (args: any) => { creates++; business = { id: 'business', ...args.data }; return business; } }
  })) as any;
  const req: any = { authUser: { id: 'client', role: 'CLIENT' }, body: { ownerId: 'attacker', role: 'SUPERADMIN' } };
  try {
    env.NODE_ENV = 'development'; application = null; const absent = response(); await activateProfessionalDemo(req, absent as any); assert.equal(absent.code, 400); assert.equal(promotions, 0);
    application = { businessName: 'Centro de bienestar', category: 'WELLNESS', description: 'Terapias' };
    const first = response(); await activateProfessionalDemo(req, first as any); assert.equal(first.code, 200); assert.equal(first.body.charged, false); assert.equal(business.ownerId, 'client'); assert.equal(business.category, 'WELLNESS');
    const second = response(); await activateProfessionalDemo(req, second as any); assert.equal(second.body.business.id, 'business'); assert.equal(creates, 1);
    env.NODE_ENV = 'production'; const prod = response(); await activateProfessionalDemo(req, prod as any); assert.equal(prod.code, 403);
    env.NODE_ENV = 'development'; req.authUser.role = 'SUPERADMIN'; const admin = response(); await activateProfessionalDemo(req, admin as any); assert.equal(admin.code, 403); assert.equal(creates, 1);
  } finally { prisma.$transaction = original; env.NODE_ENV = mode; }
});
