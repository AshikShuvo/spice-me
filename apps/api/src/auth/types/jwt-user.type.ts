import type { Role } from '../../../generated/prisma/enums.js';

/** Set on access-token routes. `refreshToken` is set only by jwt-refresh strategy. */
export interface JwtUser {
  userId: string;
  email: string;
  role: Role;
  refreshToken?: string;
}
