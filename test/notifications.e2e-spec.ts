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

interface NotificationResponse {
  id: number;
  read: boolean;
  user: IdResponse;
}

describe('NotificationsController (e2e)', () => {
  // Emails uniques : la base e2e n'est pas réinitialisée entre les exécutions.
  const suffix = uniqueSuffix();
  const teacherEmail = `e2e-notif-teacher-${suffix}@example.com`;
  const studentEmail = `e2e-notif-student-${suffix}@example.com`;

  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: number;
  let studentId: number;
  let teacherNotificationId: number;

  const createUser = async (email: string, role: string): Promise<number> => {
    const response = await request(app.getHttpServer() as Server)
      .post('/users')
      .send({ email, password: 'test123', firstName: 'E2E', role })
      .expect(201);
    return (response.body as IdResponse).id;
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

    teacherId = await createUser(teacherEmail, 'teacher');
    studentId = await createUser(studentEmail, 'student');
    teacherToken = await login(teacherEmail);
    studentToken = await login(studentEmail);

    // La création d'un rendez-vous notifie l'enseignant concerné.
    await request(app.getHttpServer() as Server)
      .post('/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId,
        teacherId,
        startAt: new Date(Date.now() + 86400000).toISOString(),
        endAt: new Date(Date.now() + 90000000).toISOString(),
        subject: 'Notification test',
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /notifications', () => {
    it('should return the notification created for the teacher', () => {
      return request(app.getHttpServer() as Server)
        .get('/notifications')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as NotificationResponse[];
          expect(body.length).toBeGreaterThan(0);
          expect(body.every((n) => n.user.id === teacherId)).toBe(true);
          teacherNotificationId = body[0].id;
        });
    });

    it('should not leak notifications of other users', () => {
      return request(app.getHttpServer() as Server)
        .get('/notifications')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as NotificationResponse[];
          expect(body.every((n) => n.user.id === studentId)).toBe(true);
        });
    });

    it('should reject an unauthenticated request', () => {
      return request(app.getHttpServer() as Server)
        .get('/notifications')
        .expect(401);
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should reject marking a notification of somebody else', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/notifications/${teacherNotificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should mark the notification as read for its recipient', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/notifications/${teacherNotificationId}/read`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('read', true);
        });
    });
  });
});
