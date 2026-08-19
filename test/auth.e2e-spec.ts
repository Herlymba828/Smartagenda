import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app';

describe('AuthController (e2e)', () => {
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
});
