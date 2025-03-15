import request from 'supertest';
import { app } from '../app';
import { Lawyer } from '../models/Lawyer';
import { Client } from '../models/Client';
import mongoose from 'mongoose';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test-db');
});

afterAll(async () => {
    await mongoose.connection.close();
});

beforeEach(async () => {
    await Lawyer.deleteMany({});
    await Client.deleteMany({});
});

describe('Authentication Tests', () => {
    describe('Lawyer Authentication', () => {
        it('should register a new lawyer', async () => {
            const res = await request(app)
                .post('/api/auth/lawyer/register')
                .send({
                    name: 'Test Lawyer',
                    email: 'test@lawyer.com',
                    password: 'password123',
                    specialization: ['Corporate Law'],
                    experience: 5,
                    priceRange: { min: 100, max: 500 },
                    licenseNumber: 'LAW123',
                    languages: ['English', 'Arabic'],
                    location: 'Riyadh'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
        });
    });

    describe('Client Authentication', () => {
        it('should register a new client', async () => {
            const res = await request(app)
                .post('/api/auth/client/register')
                .send({
                    name: 'Test Client',
                    email: 'test@client.com',
                    password: 'password123',
                    phone: '+966123456789',
                    location: 'Jeddah',
                    nationalId: 'ID123456',
                    preferredLanguage: 'ar'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token');
        });
    });
}); 