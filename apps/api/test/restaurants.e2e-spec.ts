import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '../generated/prisma/enums.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Restaurants (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const raEmail = `e2e-ra-${suffix}@test.local`;
  const raPassword = 'RaPass123';
  let adminToken = '';
  let restaurantAdminToken = '';
  let restaurantAdminId = '';
  let restaurantId = '';
  let restaurantCode = '';
  let secondRestaurantId = '';

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

    const prisma = app.get(PrismaService);
    const adminEmail = 'admin@spiceme.com';
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        name: 'Default Admin',
        password: passwordHash,
        role: Role.ADMIN,
      },
      update: {
        password: passwordHash,
        isActive: true,
        role: Role.ADMIN,
        refreshToken: null,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('admin login → token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@spiceme.com', password: 'Admin@123' })
      .expect(200);
    adminToken = res.body.accessToken as string;
    expect(adminToken).toBeDefined();
  });

  it('POST /users/restaurant-admin → 201', async () => {
    const res = await request(app.getHttpServer())
      .post('/users/restaurant-admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E RA',
        email: raEmail,
        password: raPassword,
      })
      .expect(201);
    expect(res.body.role).toBe('RESTAURANT_ADMIN');
    restaurantAdminId = res.body.id as string;
  });

  it('restaurant admin login → token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: raEmail, password: raPassword })
      .expect(200);
    restaurantAdminToken = res.body.accessToken as string;
  });

  it('POST /restaurants → 201 with RQ code', async () => {
    const res = await request(app.getHttpServer())
      .post('/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `E2E Rest ${suffix}`,
        address: '123 Test Street, Oslo',
        latitude: 59.9139,
        longitude: 10.7522,
        timezone: 'Europe/Oslo',
        openingTime: '07:00',
        closingTime: '20:00',
      })
      .expect(201);
    expect(res.body.code).toMatch(/^RQ\d{4}$/);
    restaurantId = res.body.id as string;
    restaurantCode = res.body.code as string;
  });

  it('GET /restaurants as admin lists created restaurant', async () => {
    const res = await request(app.getHttpServer())
      .get('/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find(
      (r: { id: string }) => r.id === restaurantId,
    );
    expect(found).toBeDefined();
    expect(found.code).toBe(restaurantCode);
  });

  it('GET /restaurants as restaurant admin → 403', async () => {
    await request(app.getHttpServer())
      .get('/restaurants')
      .set('Authorization', `Bearer ${restaurantAdminToken}`)
      .expect(403);
  });

  it('GET /restaurants/default may be 404 before default is set', async () => {
    const res = await request(app.getHttpServer()).get('/restaurants/default');
    if (res.status === 404) {
      expect(res.body.message).toBeDefined();
    } else {
      expect(res.status).toBe(200);
    }
  });

  it('PATCH /restaurants/:id/default → 200', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/restaurants/${restaurantId}/default`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.isDefault).toBe(true);
  });

  it('GET /restaurants/default → 200 with correct code', async () => {
    const res = await request(app.getHttpServer())
      .get('/restaurants/default')
      .expect(200);
    expect(res.body.code).toBe(restaurantCode);
    expect(res.body.id).toBe(restaurantId);
  });

  it('POST /restaurants/:id/admins → 201', async () => {
    const res = await request(app.getHttpServer())
      .post(`/restaurants/${restaurantId}/admins`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: restaurantAdminId })
      .expect(201);
    expect(res.body.userId).toBe(restaurantAdminId);
  });

  it('GET /restaurants/:id/admins → 200 without password on user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/admins`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const row = res.body.find(
      (a: { user: { id: string } }) => a.user.id === restaurantAdminId,
    );
    expect(row).toBeDefined();
    expect(row.user).not.toHaveProperty('password');
    expect(row.user).not.toHaveProperty('refreshToken');
  });

  it('GET /restaurants/:id as assigned RA → 200', async () => {
    const res = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${restaurantAdminToken}`)
      .expect(200);
    expect(res.body.id).toBe(restaurantId);
  });

  it('second restaurant; RA cannot GET unassigned restaurant → 403', async () => {
    const create = await request(app.getHttpServer())
      .post('/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `E2E Rest Two ${suffix}`,
        address: '456 Other Rd',
        latitude: 60.0,
        longitude: 11.0,
        timezone: 'Europe/Oslo',
        openingTime: '08:00',
        closingTime: '22:00',
      })
      .expect(201);
    secondRestaurantId = create.body.id as string;

    await request(app.getHttpServer())
      .get(`/restaurants/${secondRestaurantId}`)
      .set('Authorization', `Bearer ${restaurantAdminToken}`)
      .expect(403);
  });

  it('PATCH /restaurants/:id/status → inactive', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/restaurants/${restaurantId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false })
      .expect(200);
    expect(res.body.isActive).toBe(false);
  });

  it('DELETE /restaurants/:id/admins/:userId → 200', async () => {
    await request(app.getHttpServer())
      .delete(`/restaurants/${restaurantId}/admins/${restaurantAdminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('GET /restaurants/:id/admins → empty or without removed user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/restaurants/${restaurantId}/admins`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const still = res.body.filter(
      (a: { user: { id: string } }) => a.user.id === restaurantAdminId,
    );
    expect(still.length).toBe(0);
  });

  it('PATCH /restaurants/:id updates fields; code unchanged', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/restaurants/${restaurantId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `E2E Rest Renamed ${suffix}`,
        openingTime: '06:30',
      })
      .expect(200);
    expect(res.body.name).toContain('Renamed');
    expect(res.body.openingTime).toBe('06:30');
    expect(res.body.code).toBe(restaurantCode);
  });

  it('POST /restaurants invalid openingTime → 400', async () => {
    await request(app.getHttpServer())
      .post('/restaurants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `E2E Bad Time ${suffix}`,
        address: '789 Bad St',
        latitude: 1,
        longitude: 1,
        timezone: 'UTC',
        openingTime: '9:00',
        closingTime: '20:00',
      })
      .expect(400);
  });
});
