import { UserRole } from './entities/user.entity';

/** Rôles techniques qu'un visiteur peut choisir lui-même. */
export const SELF_SERVICE_ROLES: readonly UserRole[] = [
  UserRole.CLIENT,
  UserRole.PROVIDER,
];

/** Rôles autorisés à publier des créneaux (incluant l'héritage `teacher`). */
const PROVIDER_ROLES: readonly UserRole[] = [
  UserRole.PROVIDER,
  UserRole.TEACHER,
];

/** Rôles qui réservent des créneaux (incluant l'héritage `student`). */
const CLIENT_ROLES: readonly UserRole[] = [UserRole.CLIENT, UserRole.STUDENT];

/** Vrai pour un prestataire, ou pour un compte hérité `teacher`. */
export const isProviderRole = (role: string): boolean =>
  PROVIDER_ROLES.includes(role as UserRole);

/** Vrai pour un client, ou pour un compte hérité `student`. */
export const isClientRole = (role: string): boolean =>
  CLIENT_ROLES.includes(role as UserRole);

/** Vrai pour un administrateur, qui contourne les règles métier. */
export const isAdminRole = (role: string): boolean => role === UserRole.ADMIN;
