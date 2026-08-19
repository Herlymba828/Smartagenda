import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { createTestApp, uniqueSuffix } from './utils/create-test-app';

interface RegisterResponse {
  access_token: string;
  user: {
    id: number;
    role: string;
    profession: string;
    profileCompleted: boolean;
  };
}

describe('AuthController (e2e)', () => {
  const suffix = uniqueSuffix();
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with missing email', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should create an account with a technical role and a profession', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          email: `e2e-register-${suffix}@example.com`,
          password: 'test123',
          firstName: 'Nina',
          role: 'prestataire',
          profession: 'Avocate',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as RegisterResponse;
          expect(body.access_token).toBeDefined();
          expect(body.user.role).toBe('prestataire');
          expect(body.user.profession).toBe('Avocate');
          expect(body.user.profileCompleted).toBe(true);
        });
    });

    it('should reject a registration without profession', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          email: `e2e-noprofession-${suffix}@example.com`,
          password: 'test123',
          firstName: 'Nina',
          role: 'client',
        })
        .expect(400);
    });

    it('should reject a registration without role', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          email: `e2e-norole-${suffix}@example.com`,
          password: 'test123',
          firstName: 'Nina',
          profession: 'Coiffeur',
        })
        .expect(400);
    });

    it('should reject the legacy role value', () => {
      return request(app.getHttpServer() as Server)
        .post('/auth/register')
        .send({
          email: `e2e-legacy-${suffix}@example.com`,
          password: 'test123',
          firstName: 'Nina',
          role: 'utilisateur',
          profession: 'Coiffeur',
        })
        .expect(400);
    });
  });

  describe('PATCH /auth/complete-profile', () => {
    const legacyEmail = `e2e-legacy-account-${suffix}@example.com`;
    let legacyToken: string;

    beforeAll(async () => {
      // POST /users crée un compte sans profil complété, comme les comptes
      // existant avant l'introduction du rôle technique.
      await request(app.getHttpServer() as Server)
        .post('/users')
        .send({
          email: legacyEmail,
          password: 'test123',
          firstName: 'Legacy',
          role: 'utilisateur',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer() as Server)
        .post('/auth/login')
        .send({ email: legacyEmail, password: 'test123' })
        .expect(200);
      legacyToken = (loginResponse.body as RegisterResponse).access_token;
    });

    it('should block protected routes with PROFILE_INCOMPLETE', () => {
      return request(app.getHttpServer() as Server)
        .get('/appointments')
        .set('Authorization', `Bearer ${legacyToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('code', 'PROFILE_INCOMPLETE');
        });
    });

    it('should complete the profile and unlock protected routes', async () => {
      const response = await request(app.getHttpServer() as Server)
        .patch('/auth/complete-profile')
        .set('Authorization', `Bearer ${legacyToken}`)
        .send({ role: 'prestataire', profession: 'Kinésithérapeute' })
        .expect(200);

      const body = response.body as RegisterResponse;
      expect(body.user.role).toBe('prestataire');
      expect(body.user.profileCompleted).toBe(true);

      await request(app.getHttpServer() as Server)
        .get('/appointments')
        .set('Authorization', `Bearer ${body.access_token}`)
        .expect(200);
    });

    it('should reject an unauthenticated completion', () => {
      return request(app.getHttpServer() as Server)
        .patch('/auth/complete-profile')
        .send({ role: 'client', profession: 'Particulier' })
        .expect(401);
    });
  });
});
