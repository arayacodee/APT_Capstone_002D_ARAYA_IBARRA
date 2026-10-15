export const privateUserSelect = {
  id: true, email: true, name: true, role: true, firstName: true, lastName: true,
  phone: true, address: true, phoneVerifiedAt: true
} as const;
export function completeContact(user: { firstName?: string | null; lastName?: string | null; phone?: string | null; address?: string | null; phoneVerifiedAt?: Date | string | null }) {
  return Boolean(user.firstName?.trim() && user.lastName?.trim() && user.phone && user.address?.trim());
}
