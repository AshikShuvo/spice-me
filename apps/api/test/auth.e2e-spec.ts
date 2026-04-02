import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const userEmail = `e2e-user-${suffix}@test.local`;
  const userPassword = 'E2eTest1';
  let accessToken = '';
  let refreshToken = '';

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for e2e tests');
    }
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register → 201 with tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E User',
        email: userEmail,
        password: userPassword,
      })
      .expect(201);

    expect(res.body.user.email).toBe(userEmail.toLowerCase());
    expect(res.body.user.role).toBe('USER');
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/register duplicate → 409', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Dup',
        email: userEmail,
        password: userPassword,
      })
      .expect(409);
  });

  it('POST /auth/login → 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: userPassword })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/login wrong password → 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: 'WrongPass1' })
      .expect(401);
  });

  it('POST /auth/refresh → 200 with new tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /auth/logout → 200', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('POST /auth/forgot-password → 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: userEmail })
      .expect(200);
    expect(res.body.message).toBeDefined();
  });

  it('POST /auth/reset-password then login with new password', async () => {
    const forgot = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: userEmail })
      .expect(200);

    expect(forgot.body.resetToken).toBeDefined();
    const newPassword = 'NewE2ePass2';
    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: forgot.body.resetToken, newPassword })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userEmail, password: newPassword })
      .expect(200);
    expect(login.body.accessToken).toBeDefined();
    accessToken = login.body.accessToken;
    refreshToken = login.body.refreshToken;
  });

  it('GET /users/me with token → 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.email).toBe(userEmail.toLowerCase());
  });

  it('GET /users/me without token → 401', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('GET /users as USER → 403', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /users as ADMIN → 200', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@spiceme.com', password: 'Admin@123' })
      .expect(200);

    const adminAccess = adminLogin.body.accessToken as string;
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
