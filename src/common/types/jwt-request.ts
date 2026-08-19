/**
 * Utilisateur authentifié tel qu'injecté dans `req.user` par JwtStrategy.
 */
export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
}

/** Request NestJS enrichie par la stratégie JWT Passport. */
export interface JwtRequest {
  user: AuthenticatedUser;
}

/** Indique si l'utilisateur authentifié dispose du rôle administrateur. */
export const isAdmin = (user: AuthenticatedUser): boolean =>
  user.role === 'admin';
