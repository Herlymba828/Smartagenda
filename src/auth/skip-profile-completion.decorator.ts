import { SetMetadata } from '@nestjs/common';

/** Clé de métadonnée lue par ProfileCompletionGuard. */
export const SKIP_PROFILE_COMPLETION = 'skipProfileCompletion';

/**
 * Exempte une route du ProfileCompletionGuard.
 *
 * À réserver aux routes qui permettent justement de compléter le profil
 * (PATCH /auth/complete-profile) ou de le consulter (GET /users/me).
 */
export const SkipProfileCompletion = () =>
  SetMetadata(SKIP_PROFILE_COMPLETION, true);
