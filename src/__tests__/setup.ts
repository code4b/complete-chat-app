import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

// Load test environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.AES_SECRET_KEY = 'test-encryption-key-must-be-32-chars!!';
process.env.NODE_ENV = 'test';

dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    console.log('Setting up test database connection...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log(`Connecting to test database at ${mongoUri}`);
    await mongoose.connect('mongodb://127.0.0.1:53764');
    console.log('Successfully connected to test database');
});

beforeEach(async () => {
    console.log('Cleaning up test collections...');
    if (mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();
        for (const collection of collections) {
            await collection.deleteMany({});
        }
        console.log('Collections cleaned');
    }
});

afterAll(async () => {
    console.log('Cleaning up test environment...');
    if (mongoServer) {
        await mongoose.disconnect();
        await mongoServer.stop();
        console.log('Test environment cleanup completed');
    }
});