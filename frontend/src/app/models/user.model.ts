export type UserRole =
  | 'CLIENT'
  | 'PROFESSIONAL'
  | 'SUPERADMIN';

export interface User {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  address?: string | null;
  phoneVerifiedAt?: string | null;
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  googleId: string | null;
  createdAt: string;
  updatedAt: string;
}
export function contactComplete(user: User | null): boolean {
  return Boolean(user?.firstName?.trim() && user.lastName?.trim() && user.phone && user.address?.trim());
}

export interface AuthResponse {
  user: User;
}
