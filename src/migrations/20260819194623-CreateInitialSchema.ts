import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1724097983000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(180) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "firstName" VARCHAR(120) NOT NULL,
        "lastName" VARCHAR(120),
        "role" VARCHAR(50) DEFAULT 'student' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create availabilities table
    await queryRunner.query(`
      CREATE TABLE "availabilities" (
        "id" SERIAL PRIMARY KEY,
        "ownerId" INTEGER NOT NULL,
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL,
        "title" VARCHAR(255),
        "type" VARCHAR(50) DEFAULT 'standard',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_availabilities_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create appointments table
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id" SERIAL PRIMARY KEY,
        "studentId" INTEGER NOT NULL,
        "teacherId" INTEGER NOT NULL,
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL,
        "subject" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "status" VARCHAR(50) DEFAULT 'pending' NOT NULL,
        "isVirtual" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_appointments_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_appointments_teacher" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "channel" VARCHAR(50) DEFAULT 'system' NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "message" TEXT NOT NULL,
        "read" BOOLEAN DEFAULT false,
        "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_availabilities_owner" ON "availabilities"("ownerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_student" ON "appointments"("studentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_teacher" ON "appointments"("teacherId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_appointments_isVirtual" ON "appointments"("isVirtual")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_user" ON "notifications"("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "availabilities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
