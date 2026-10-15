import { z } from 'zod';

// Public presentation only. Patient notes and session evidence remain in authenticated routes.
export const businessProfileFields = {
  category: z.enum(['GENERAL', 'WELLNESS', 'BEAUTY']).optional(),
  professionalName: z.string().trim().max(100).nullable().optional(),
  specialties: z.string().trim().max(300).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  attentionMode: z.enum(['ONSITE', 'ONLINE', 'BOTH']).nullable().optional()
};
