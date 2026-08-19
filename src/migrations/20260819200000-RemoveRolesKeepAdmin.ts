import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRolesKeepAdmin1724100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "notifications" WHERE "userId" IN (SELECT "id" FROM "users" WHERE "role" != 'admin')`,
    );
    await queryRunner.query(
      `DELETE FROM "appointments" WHERE "studentId" IN (SELECT "id" FROM "users" WHERE "role" != 'admin') OR "teacherId" IN (SELECT "id" FROM "users" WHERE "role" != 'admin')`,
    );
    await queryRunner.query(
      `DELETE FROM "availabilities" WHERE "ownerId" IN (SELECT "id" FROM "users" WHERE "role" != 'admin')`,
    );
    await queryRunner.query(`DELETE FROM "users" WHERE "role" != 'admin'`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "chk_users_role" CHECK ("role" = 'admin')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_users_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student'`,
    );
  }
}
