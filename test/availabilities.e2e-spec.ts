import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { createTestApp, uniqueSuffix } from './utils/create-test-app';

interface IdResponse {
  id: number;
}

interface TokenResponse {
  access_token: string;
}

interface RegisterResponse {
  access_token: string;
  user: IdResponse;
}

describe('AvailabilitiesController (e2e)', () => {
  // Emails uniques : la base e2e n'est pas réinitialisée entre les exécutions.
  const suffix = uniqueSuffix();
  const teacherEmail = `e2e-avail-teacher-${suffix}@example.com`;
  const studentEmail = `e2e-avail-student-${suffix}@example.com`;

  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: number;
  let availabilityId: number;

  const createUser = async (email: string, role: string): Promise<number> => {
    const response = await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        email,
        password: 'test123',
        firstName: 'E2E',
        role,
        profession: role === 'prestataire' ? 'Coiffeur' : 'Particulier',
      })
      .expect(201);
    return (response.body as RegisterResponse).user.id;
  };

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email, password: 'test123' })
      .expect(200);
    return (response.body as TokenResponse).access_token;
  };

  beforeAll(async () => {
    app = await createTestApp();

    teacherId = await createUser(teacherEmail, 'prestataire');
    await createUser(studentEmail, 'client');

    teacherToken = await login(teacherEmail);
    studentToken = await login(studentEmail);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /availabilities', () => {
    it('should let a teacher publish a slot on their own agenda', () => {
      return request(app.getHttpServer() as Server)
        .post('/availabilities')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          ownerId: teacherId,
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
          title: 'Permanence',
        })
        .expect(201)
        .expect((res) => {
          availabilityId = (res.body as IdResponse).id;
          expect(res.body).toHaveProperty('title', 'Permanence');
        });
    });

    it('should reject an unauthenticated request', () => {
      return request(app.getHttpServer() as Server)
        .post('/availabilities')
        .send({
          ownerId: teacherId,
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
        })
        .expect(401);
    });

    it('should reject publishing on somebody else agenda', () => {
      return request(app.getHttpServer() as Server)
        .post('/availabilities')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          ownerId: teacherId,
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
        })
        .expect(403);
    });
  });

  describe('GET /availabilities', () => {
    it('should be readable by any authenticated user', () => {
      return request(app.getHttpServer() as Server)
        .get('/availabilities')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should reject an unauthenticated request', () => {
      return request(app.getHttpServer() as Server)
        .get('/availabilities')
        .expect(401);
    });
  });

  describe('DELETE /availabilities/:id', () => {
    it('should reject deletion by a non-owner', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/availabilities/${availabilityId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should let the owner delete their slot', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/availabilities/${availabilityId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });
});
