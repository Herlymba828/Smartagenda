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

describe('AppointmentsController (e2e)', () => {
  // Emails uniques : la base e2e n'est pas réinitialisée entre les exécutions.
  const suffix = uniqueSuffix();
  const studentEmail = `e2e-student-${suffix}@example.com`;
  const teacherEmail = `e2e-teacher-${suffix}@example.com`;

  let app: INestApplication;
  let studentToken: string;
  let teacherToken: string;
  let studentId: number;
  let teacherId: number;
  let testAppointmentId: number;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({ email, password: 'test123' })
      .expect(200);
    return (response.body as TokenResponse).access_token;
  };

  beforeAll(async () => {
    app = await createTestApp();

    // Create test users
    const studentResponse = await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        email: studentEmail,
        password: 'test123',
        firstName: 'Client',
        role: 'client',
        profession: 'Particulier',
      })
      .expect(201);

    const teacherResponse = await request(app.getHttpServer() as Server)
      .post('/auth/register')
      .send({
        email: teacherEmail,
        password: 'test123',
        firstName: 'Prestataire',
        role: 'prestataire',
        profession: 'Coiffeur',
      })
      .expect(201);

    studentId = (studentResponse.body as RegisterResponse).user.id;
    teacherId = (teacherResponse.body as RegisterResponse).user.id;

    studentToken = await login(studentEmail);
    teacherToken = await login(teacherEmail);

    // Create a test appointment
    const appointmentResponse = await request(app.getHttpServer() as Server)
      .post('/appointments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId,
        teacherId,
        startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endAt: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
        subject: 'Test Appointment',
        description: 'E2E test appointment',
        isVirtual: true,
      })
      .expect(201);

    testAppointmentId = (appointmentResponse.body as IdResponse).id;
  });

  afterAll(async () => {
    // Cleanup
    if (testAppointmentId) {
      await request(app.getHttpServer() as Server)
        .delete(`/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`);
    }
    await app.close();
  });

  describe('POST /appointments', () => {
    it('should create a new appointment', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId,
          teacherId,
          startAt: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          endAt: new Date(Date.now() + 176400000).toISOString(), // Day after tomorrow + 1 hour
          subject: 'Another Test',
          isVirtual: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('subject', 'Another Test');
          expect(res.body).toHaveProperty('status', 'pending');
        });
    });

    it('should reject an unauthenticated request', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .send({
          studentId,
          teacherId,
          startAt: new Date(Date.now() + 172800000).toISOString(),
          endAt: new Date(Date.now() + 176400000).toISOString(),
          subject: 'Anonymous',
        })
        .expect(401);
    });

    it('should reject booking on behalf of somebody else', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: studentId + 1000,
          teacherId: teacherId + 1000,
          startAt: new Date(Date.now() + 172800000).toISOString(),
          endAt: new Date(Date.now() + 176400000).toISOString(),
          subject: 'Not mine',
        })
        .expect(403);
    });

    it('should fail with invalid date format', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId,
          teacherId,
          startAt: 'invalid-date',
          endAt: new Date(Date.now() + 176400000).toISOString(),
          subject: 'Test',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId,
          teacherId,
        })
        .expect(400);
    });
  });

  describe('GET /appointments', () => {
    it('should only return appointments of the current user', () => {
      return request(app.getHttpServer() as Server)
        .get('/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as { student: IdResponse }[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
          expect(
            body.every((appointment) => appointment.student.id === studentId),
          ).toBe(true);
        });
    });

    it('should reject an unauthenticated request', () => {
      return request(app.getHttpServer() as Server)
        .get('/appointments')
        .expect(401);
    });
  });

  describe('GET /appointments/:id', () => {
    it('should return appointment by ID', () => {
      return request(app.getHttpServer() as Server)
        .get(`/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testAppointmentId);
          expect(res.body).toHaveProperty('subject');
        });
    });

    it('should return 404 for non-existent appointment', () => {
      return request(app.getHttpServer() as Server)
        .get('/appointments/99999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);
    });
  });

  describe('PATCH /appointments/:id/status', () => {
    it('should let the teacher confirm the appointment', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'confirmed' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'confirmed');
        });
    });

    it('should reject a confirmation coming from the student', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'confirmed' })
        .expect(403);
    });

    it('should reject an unsupported status', () => {
      return request(app.getHttpServer() as Server)
        .patch(`/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ status: 'pending' })
        .expect(400);
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('should cancel appointment', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'cancelled');
        });
    });
  });
});
