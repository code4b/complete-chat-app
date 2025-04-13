import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Group } from '../src/models/Group';
import { Message } from '../src/models/Message';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // Add your migration logic here
        // Example: Adding new fields to existing documents
        // await User.updateMany({}, { $set: { newField: defaultValue } });

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();