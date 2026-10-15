import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { uploadImageBuffer } from '../lib/cloudinary-upload.js';
import { cloudinary } from '../lib/cloudinary.js';
const photoSelect = { id: true, imageUrl: true, caption: true, createdAt: true } as const;
export async function getBusinessPhotos(req: Request, res: Response) {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'Negocio inválido.' });
  return res.json(await prisma.businessPhoto.findMany({ where: { businessId: id.data }, select: photoSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 30 }));
}
export async function addBusinessPhoto(req: Request, res: Response) {
  const caption = z.string().trim().max(300).safeParse(req.body.caption ?? '');
  if (!req.file || !caption.success) return res.status(400).json({ error: 'Selecciona una imagen y una descripción de hasta 300 caracteres.' });
  const business = await prisma.business.findFirst({ where: { ownerId: req.authUser!.id } });
  if (!business) return res.status(404).json({ error: 'Primero crea tu perfil profesional.' });
  const uploaded = await uploadImageBuffer(req.file.buffer, { folder: `cronos/businesses/${business.id}/gallery`, resource_type: 'image' });
  try {
    const photo = await prisma.$transaction(async tx => {
      if (await tx.businessPhoto.count({ where: { businessId: business.id } }) >= 30) throw new Error('GALLERY_FULL');
      return tx.businessPhoto.create({ data: { businessId: business.id, imageUrl: uploaded.secure_url, imagePublicId: uploaded.public_id, caption: caption.data || null }, select: photoSelect });
    }, { isolationLevel: 'Serializable' });
    return res.status(201).json(photo);
  } catch (error) {
    await cloudinary.uploader.destroy(uploaded.public_id).catch(() => console.error('Gallery upload cleanup failed.'));
    if (error instanceof Error && error.message === 'GALLERY_FULL') return res.status(409).json({ error: 'Puedes publicar hasta 30 fotos. Elimina una para agregar otra.' });
    if ((error as { code?: string }).code === 'P2034') return res.status(409).json({ error: 'La galería cambió. Intenta nuevamente.' });
    throw error;
  }
}
export async function deleteBusinessPhoto(req: Request, res: Response) {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ error: 'Foto inválida.' });
  const photo = await prisma.businessPhoto.findFirst({ where: { id: id.data, business: { ownerId: req.authUser!.id } } });
  if (!photo) return res.status(404).json({ error: 'Foto inexistente.' });
  const removed = await prisma.businessPhoto.deleteMany({ where: { id: photo.id, business: { ownerId: req.authUser!.id } } });
  if (!removed.count) return res.status(409).json({ error: 'La foto cambió. Actualiza la galería.' });
  await cloudinary.uploader.destroy(photo.imagePublicId).catch(() => console.error('Gallery deletion cleanup failed.'));
  return res.status(204).send();
}
