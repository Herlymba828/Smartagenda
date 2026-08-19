import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

/**
 * Démarre une application de test configurée comme la production
 * (ValidationPipe + filtre d'exception). Le rate-limiting est neutralisé
 * par `skipIf` dans AppModule lorsque NODE_ENV vaut `test`.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = configureApp(moduleFixture.createNestApplication());
  await app.init();
  return app;
}

/** Suffixe unique permettant de rejouer les suites e2e sans conflit d'email. */
export const uniqueSuffix = (): string =>
  `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
