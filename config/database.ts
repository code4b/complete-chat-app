import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
let mongoServer: MongoMemoryServer;
const initializeMongoServer = async () => {
    if (!process.env.MONGODB_URI) {
        mongoServer = await MongoMemoryServer.create();
        console.log(`MongoDB Memory Server Connected: ${mongoServer.connection.host}`);
        return mongoServer.getUri();
    }
    return process.env.MONGODB_URI;
};


async function shutdown() {
    try {
      await mongoose.disconnect();
      if (mongoServer) {
        await mongoServer.stop();
      }
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  }
export const connectDB = async () => {
    try {
            const mongoUri = await initializeMongoServer();
            const conn = await mongoose.connect(mongoUri);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
};