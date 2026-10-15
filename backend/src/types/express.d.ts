export {};

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        email: string;
        name: string | null;
        role: 'CLIENT' | 'PROFESSIONAL' | 'SUPERADMIN';
        firstName?: string | null;
        lastName?: string | null;
        phone?: string | null;
        address?: string | null;
        phoneVerifiedAt?: Date | null;
      };
    }
  }
}
