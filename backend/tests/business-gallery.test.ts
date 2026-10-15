import { test } from 'node:test';
import assert from 'node:assert/strict';
Object.assign(process.env, { DATABASE_URL: 'postgresql://test:test@localhost/test', GOOGLE_CLIENT_ID: 'test', AUTH_SECRET: 'test-secret-with-at-least-32-characters', CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'test' });
const { prisma } = await import('../src/lib/prisma.js');
const { getBusinessPhotos, addBusinessPhoto, deleteBusinessPhoto } = await import('../src/controllers/business-gallery.controller.js');
function response() { return { code: 200, body: null as any, status(code: number) { this.code = code; return this; }, json(body: any) { this.body = body; return this; } }; }
test('galería pública solo muestra fotos del negocio; subida y eliminación exigen propietario', async () => {
  const originals = { photos: prisma.businessPhoto.findMany, photo: prisma.businessPhoto.findFirst, business: prisma.business.findFirst };
  const id = '00000000-0000-4000-8000-000000000001';
  prisma.businessPhoto.findMany = (async (args: any) => { assert.equal(args.where.businessId, id); assert.equal(args.select.imagePublicId, undefined); return [{ id, imageUrl: 'https://example.com/photo.jpg', caption: 'Local' }]; }) as any;
  prisma.businessPhoto.findFirst = (async (args: any) => { assert.equal(args.where.business.ownerId, 'owner'); return null; }) as any;
  prisma.business.findFirst = (async (args: any) => { assert.equal(args.where.ownerId, 'owner'); return null; }) as any;
  try {
    const publicPhotos = response(); await getBusinessPhotos({ params: { id } } as any, publicPhotos as any); assert.equal(publicPhotos.body.length, 1);
    const remove = response(); await deleteBusinessPhoto({ params: { id }, authUser: { id: 'owner' } } as any, remove as any); assert.equal(remove.code, 404);
    const upload = response(); await addBusinessPhoto({ body: {}, file: { buffer: Buffer.from('test') }, authUser: { id: 'owner' } } as any, upload as any); assert.equal(upload.code, 404);
    const invalid = response(); await addBusinessPhoto({ body: { caption: 'a'.repeat(301) }, file: { buffer: Buffer.from('test') } } as any, invalid as any); assert.equal(invalid.code, 400);
  } finally { prisma.businessPhoto.findMany = originals.photos; prisma.businessPhoto.findFirst = originals.photo; prisma.business.findFirst = originals.business; }
});
