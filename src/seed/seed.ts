import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Availability } from '../disponibilites/entities/availability.entity';
import { Appointment, AppointmentStatus } from '../rendezvous/entities/appointment.entity';
import { Notification, NotificationChannel } from '../notifications/entities/notification.entity';
import { hashPassword } from '../utils/hash.util';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seed...');

  // Clear existing data
  await dataSource.query('DELETE FROM notifications');
  await dataSource.query('DELETE FROM appointments');
  await dataSource.query('DELETE FROM availabilities');
  await dataSource.query('DELETE FROM users');
  console.log('🧹 Cleared existing data');

  const userRepository = dataSource.getRepository(User);
  const availabilityRepository = dataSource.getRepository(Availability);
  const appointmentRepository = dataSource.getRepository(Appointment);
  const notificationRepository = dataSource.getRepository(Notification);

  // Create users
  const admin = userRepository.create({
    email: 'admin@smartagenda.com',
    password: await hashPassword('admin123'),
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
  });
  await userRepository.save(admin);

  const teacher1 = userRepository.create({
    email: 'teacher1@smartagenda.com',
    password: await hashPassword('teacher123'),
    firstName: 'Marie',
    lastName: 'Dupont',
    role: UserRole.TEACHER,
  });
  await userRepository.save(teacher1);

  const teacher2 = userRepository.create({
    email: 'teacher2@smartagenda.com',
    password: await hashPassword('teacher123'),
    firstName: 'Jean',
    lastName: 'Martin',
    role: UserRole.TEACHER,
  });
  await userRepository.save(teacher2);

  const student1 = userRepository.create({
    email: 'student1@smartagenda.com',
    password: await hashPassword('student123'),
    firstName: 'Alice',
    lastName: 'Bernard',
    role: UserRole.STUDENT,
  });
  await userRepository.save(student1);

  const student2 = userRepository.create({
    email: 'student2@smartagenda.com',
    password: await hashPassword('student123'),
    firstName: 'Lucas',
    lastName: 'Petit',
    role: UserRole.STUDENT,
  });
  await userRepository.save(student2);

  console.log('👥 Created 5 users (1 admin, 2 teachers, 2 students)');

  // Create availabilities for teachers
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const availability1 = availabilityRepository.create({
    owner: teacher1,
    startAt: new Date(tomorrow.getTime() + 9 * 60 * 60 * 1000), // 9 AM
    endAt: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM
    title: 'Office Hours - Mathematics',
    type: 'office-hours',
  });
  await availabilityRepository.save(availability1);

  const availability2 = availabilityRepository.create({
    owner: teacher1,
    startAt: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000), // 2 PM
    endAt: new Date(tomorrow.getTime() + 16 * 60 * 60 * 1000), // 4 PM
    title: 'Tutorial Sessions',
    type: 'tutorial',
  });
  await availabilityRepository.save(availability2);

  const availability3 = availabilityRepository.create({
    owner: teacher2,
    startAt: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM
    endAt: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12 PM
    title: 'Office Hours - Physics',
    type: 'office-hours',
  });
  await availabilityRepository.save(availability3);

  console.log('📅 Created 3 availabilities');

  // Create appointments
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  const appointment1 = appointmentRepository.create({
    student: student1,
    teacher: teacher1,
    startAt: new Date(nextWeek.getTime() + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // 9:30 AM
    endAt: new Date(nextWeek.getTime() + 10 * 60 * 60 * 1000 + 30 * 60 * 1000), // 10:30 AM
    subject: 'Calculus tutoring',
    description: 'Chapter 3: Derivatives',
    isVirtual: true,
    status: AppointmentStatus.CONFIRMED,
  });
  await appointmentRepository.save(appointment1);

  const appointment2 = appointmentRepository.create({
    student: student2,
    teacher: teacher2,
    startAt: new Date(nextWeek.getTime() + 11 * 60 * 60 * 1000), // 11 AM
    endAt: new Date(nextWeek.getTime() + 12 * 60 * 60 * 1000), // 12 PM
    subject: 'Physics Lab Review',
    description: 'Prepare for final exam',
    isVirtual: false,
    status: AppointmentStatus.PENDING,
  });
  await appointmentRepository.save(appointment2);

  console.log('📋 Created 2 appointments');

  // Create notifications
  const notification1 = notificationRepository.create({
    user: student1,
    channel: NotificationChannel.EMAIL,
    title: 'Appointment Confirmed',
    message: 'Your calculus tutoring session with Marie Dupont has been confirmed.',
    read: false,
  });
  await notificationRepository.save(notification1);

  const notification2 = notificationRepository.create({
    user: teacher1,
    channel: NotificationChannel.SYSTEM,
    title: 'New Appointment Request',
    message: 'Alice Bernard has requested a tutoring session.',
    read: true,
  });
  await notificationRepository.save(notification2);

  const notification3 = notificationRepository.create({
    user: student2,
    channel: NotificationChannel.SYSTEM,
    title: 'Appointment Pending',
    message: 'Your physics lab review appointment is waiting for confirmation.',
    read: false,
  });
  await notificationRepository.save(notification3);

  console.log('🔔 Created 3 notifications');

  console.log('✅ Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Admin: admin@smartagenda.com / admin123');
  console.log('Teacher: teacher1@smartagenda.com / teacher123');
  console.log('Student: student1@smartagenda.com / student123');

  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
