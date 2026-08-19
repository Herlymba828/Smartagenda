import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import request from 'supertest';
import { AppModule } from './../src/app.module';

interface IdResponse {
  id: number;
}

describe('AppointmentsController (e2e)', () => {
  let app: INestApplication;
  let testUserId: number;
  let testAppointmentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test users
    const studentResponse = await request(app.getHttpServer() as Server)
      .post('/users')
      .send({
        email: 'e2e-student@example.com',
        password: 'test123',
        firstName: 'Student',
        role: 'student',
      })
      .expect(201);

    const teacherResponse = await request(app.getHttpServer() as Server)
      .post('/users')
      .send({
        email: 'e2e-teacher@example.com',
        password: 'test123',
        firstName: 'Teacher',
        role: 'teacher',
      })
      .expect(201);

    testUserId = (studentResponse.body as IdResponse).id;
    const teacherId = (teacherResponse.body as IdResponse).id;

    await request(app.getHttpServer() as Server)
      .post('/auth/login')
      .send({
        email: 'e2e-student@example.com',
        password: 'test123',
      })
      .expect(200);

    // Create a test appointment
    const appointmentResponse = await request(app.getHttpServer() as Server)
      .post('/appointments')
      .send({
        studentId: testUserId,
        teacherId: teacherId,
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
      await request(app.getHttpServer() as Server).delete(
        `/appointments/${testAppointmentId}`,
      );
    }
    await app.close();
  });

  describe('POST /appointments', () => {
    it('should create a new appointment', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .send({
          studentId: testUserId,
          teacherId: testUserId + 1,
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

    it('should fail with invalid date format', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .send({
          studentId: testUserId,
          teacherId: testUserId + 1,
          startAt: 'invalid-date',
          endAt: new Date(Date.now() + 176400000).toISOString(),
          subject: 'Test',
        })
        .expect(400);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer() as Server)
        .post('/appointments')
        .send({
          studentId: testUserId,
          teacherId: testUserId + 1,
        })
        .expect(400);
    });
  });

  describe('GET /appointments', () => {
    it('should return all appointments', () => {
      return request(app.getHttpServer() as Server)
        .get('/appointments')
        .expect(200)
        .expect((res) => {
          const body = res.body as unknown[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /appointments/:id', () => {
    it('should return appointment by ID', () => {
      return request(app.getHttpServer() as Server)
        .get(`/appointments/${testAppointmentId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testAppointmentId);
          expect(res.body).toHaveProperty('subject');
        });
    });

    it('should return 404 for non-existent appointment', () => {
      return request(app.getHttpServer() as Server)
        .get('/appointments/99999')
        .expect(404);
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('should cancel appointment', () => {
      return request(app.getHttpServer() as Server)
        .delete(`/appointments/${testAppointmentId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'cancelled');
        });
    });
  });
});
