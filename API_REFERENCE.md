# SmartAgenda Backend — API Reference

This document lists the available HTTP endpoints, request/response schemas, authentication, environment variables and Docker usage for the SmartAgenda backend.

---

## Overview
- Base URL (local Docker): `http://localhost:3000`
- API prefix: `/api`
- Auth: JWT Bearer tokens (HMAC SHA256)
- Default content type: `application/json`

---

## Authentication

### POST /api/auth/register
- Description: Public sign-up. Creates the account and returns a JWT so no extra login call is needed.
- Rate limit: 5 registrations per hour per IP.
- Request body (RegisterDto):

```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",        // optional
  "role": "student"        // optional, "student" (default) or "teacher" — "admin" is rejected
}
```
- Response (201):

```json
{
  "access_token": "<JWT_TOKEN>",
  "user": { "id": 1, "email": "test@example.com", "firstName": "Jane", "role": "student" }
}
```
- Errors: 400 invalid body, 409 email already registered, 429 rate limit exceeded.

### POST /api/auth/login
- Description: Exchange email/password for JWT access token.
- Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
- Response (200):

```json
{
  "access_token": "<JWT_TOKEN>"
}
```
- Notes: Use the returned token in `Authorization: Bearer <token>` header for protected endpoints.

---

## Root
### GET /api/
- Description: Health / default endpoint
- Response: `Hello World!` (text)

---

## Users
All protected endpoints require `Authorization: Bearer <token>`.

### POST /api/users
- Description: Create a new user
- Request body (CreateUserDto):

```json
{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",        // optional
  "role": "student"        // one of: "student", "teacher", "admin"
}
```
- Response: created user object without `password` (select:false in entity)

### GET /api/users
- Description: List users
- Auth: required
- Response: array of users (password omitted)

### GET /api/users/me
- Description: Get profile of current authenticated user
- Auth: required
- Response: user object (password omitted)

Files: `src/users/dto/create-user.dto.ts`, `src/users/users.controller.ts`

---

## Availabilities
### POST /api/availabilities
- Description: Create availability
- Request body (CreateAvailabilityDto):

```json
{
  "ownerId": 1,
  "startAt": "2026-08-07T09:00:00.000Z",
  "endAt": "2026-08-07T10:00:00.000Z",
  "title": "Office hours",   // optional
  "type": "meeting"         // optional
}
```
- Response: created availability object

### GET /api/availabilities
- Description: List availabilities (owner relation included)
- Response: array of availabilities

### GET /api/availabilities/:id
- Description: Get a single availability by id
- Response: availability object or 404

### DELETE /api/availabilities/:id
- Description: Delete an availability (removes resource)
- Response: 200/204

Files: `src/disponibilites/dto/create-availability.dto.ts`, `src/disponibilites/disponibilites.controller.ts`

---

## Appointments
### POST /api/appointments
- Description: Create an appointment
- Request body (CreateAppointmentDto):

```json
{
  "studentId": 1,
  "teacherId": 2,
  "startAt": "2026-08-10T14:00:00.000Z",
  "endAt": "2026-08-10T14:30:00.000Z",
  "subject": "Tutoring",
  "description": "Optional detail",
  "isVirtual": true,
  "status": "pending"   // optional; see AppointmentStatus enum
}
```
- Response: created appointment

### GET /api/appointments
- Description: List appointments

### GET /api/appointments/:id
- Description: Get appointment by id

### DELETE /api/appointments/:id
- Description: Cancel/Delete appointment

Files: `src/rendezvous/dto/create-appointment.dto.ts`, `src/rendezvous/rendezvous.controller.ts`

---

## Notifications
### GET /api/notifications
- List notifications

### GET /api/notifications/:id
- Get notification by id

### PATCH /api/notifications/:id/read
- Mark notification as read

Files: `src/notifications/notifications.controller.ts`

---

## Request/Response conventions
- Validation: DTOs use `class-validator`. Bad requests return 400 with details.
- Protected endpoints use `JwtAuthGuard` — missing/invalid token returns 401.
- Errors: NestJS exception filters return structured JSON with `statusCode` and `message`.

---

## Environment variables (used by app)
- `DB_HOST` (default: `localhost` in config)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `DB_NAME` (default: `smartagenda`)

These can be provided via `.env` or in `docker-compose.yml` environment section.

---

## Docker / Run
Build and run with Docker Compose (already included):

```bash
# Build images and start services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

Notes:
- In development you may want `start:dev`, but `docker-compose.yml` is configured to run the built production bundle `npm run start:prod` inside the container.
- Database data is persisted in the `db_data` Docker volume declared in `docker-compose.yml`.

---

## Quick test (create test user + auth)
PowerShell commands used during testing:

```powershell
# create user
Invoke-RestMethod -Uri 'http://localhost:3000/api/users' -Method POST -Body (ConvertTo-Json @{email='test+admin@example.com'; password='password123'; firstName='Test'; lastName='Admin'; role='admin'}) -ContentType 'application/json'

# login and get token
Invoke-RestMethod -Uri 'http://localhost:3000/auth/login' -Method POST -Body (ConvertTo-Json @{email='test+admin@example.com'; password='password123'}) -ContentType 'application/json'
```

Use returned `access_token` in `Authorization: Bearer <token>` for protected requests.

---

## Where to look in code
- `src/app.module.ts` — app wiring, TypeORM config
- `src/auth` — auth service, controller, DTOs
- `src/users` — user entity, DTOs, controller
- `src/disponibilites` — availability module, DTOs
- `src/rendezvous` — appointments module, DTOs
- `src/notifications` — notification module

---

## Next suggested improvements
- Add OpenAPI (Swagger) integration using `@nestjs/swagger` to produce interactive docs and schemas.
- Add a `seed` script to create test accounts automatically.
- Replace `synchronize: true` with TypeORM migrations for production safety.

---

Generated on: 2026-08-07
