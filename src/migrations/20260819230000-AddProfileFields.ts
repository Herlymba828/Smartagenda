import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ajoute la profession déclarée et l'indicateur de profil complété.
 *
 * Migration additive : aucune colonne n'est supprimée ni renommée. Les comptes
 * existants gardent leur rôle et sont marqués `profileCompleted = false`, ce
 * qui les redirige vers PATCH /auth/complete-profile.
 */
export class AddProfileFields1724102400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profession" VARCHAR(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileCompleted" BOOLEAN NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "profileCompleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "profession"`,
    );
  }
}
