import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { Lawyer } from '../models/Lawyer';
import { Client } from '../models/Client';

beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Lawyer.deleteMany({});
  await Client.deleteMany({});
});

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new lawyer', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Lawyer',
          email: 'lawyer@test.com',
          password: 'password123',
          role: 'lawyer',
          specialization: 'Corporate Law',
          licenseNumber: 'LAW123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('role', 'lawyer');
    });

    it('should register a new client', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Client',
          email: 'client@test.com',
          password: 'password123',
          role: 'client'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('role', 'client');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'password123',
          role: 'client'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should not login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
}); 