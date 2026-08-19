import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { createTestApp, uniqueSuffix } from './utils/create-test-app';

interface IdResponse {
  id: number;
}

interface RegisterResponse {
  access_token: string;
  user: IdResponse;
}

interface LoginResponse {
  access_token: string;
}

describe('UsersController (e2e)', () => {
  // Emails uniques : la base e2e n'est pas réinitialisée entre les exécutions.
  const suffix = uniqueSuffix();
  const testEmail = `e2e-test-${suffix}@example.com`;
  const newUserEmail = `e2e-newuser-${suffix}@example.com`;

  let app: INestApplication;
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    app = await createTestApp();

    // Create a test user and authenticate
    const createUserResponse = await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        email: testEmail,
        password: 'test123',
        firstName: 'E2E',
        lastName: 'Test',
        role: 'client',
        profession: 'Particulier',
      })
      .expect(201);

    testUserId = (createUserResponse.body as RegisterResponse).user.id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'test123',
      })
      .expect(200);

    authToken = (loginResponse.body as LoginResponse).access_token;
  });

  afterAll(async () => {
    // Cleanup test user
    if (testUserId) {
      await request(app.getHttpServer() as Server)
        .delete(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer() as Server)
        .post('/users')
        .send({
          email: newUserEmail,
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          role: 'student',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', newUserEmail);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer() as Server)
        .post('/users')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          role: 'student',
        })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer() as Server)
        .post('/users')
        .send({
          email: `e2e-short-${suffix}@example.com`,
          password: '123',
          firstName: 'Test',
          role: 'student',
        })
        .expect(400);
    });
  });

  describe('GET /users/me', () => {
    it('should return current user profile with valid token', () => {
      return request(app.getHttpServer() as Server)
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', testEmail);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer() as Server)
        .get('/users/me')
        .expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer() as Server)
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('GET /users', () => {
    it('should return all users with valid token', () => {
      return request(app.getHttpServer() as Server)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
          expect(body[0]).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer() as Server)
        .get('/users')
        .expect(401);
    });
  });
});
