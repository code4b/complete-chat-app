import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const generateSecureKey = (bytes: number) => crypto.randomBytes(bytes).toString('hex');

const generateProductionEnv = () => {
    const jwtSecret = generateSecureKey(32); // 256-bit key
    const aesKey = generateSecureKey(16); // 128-bit key for AES-128

    const envContent = `NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/secure-messaging-prod
JWT_SECRET=${jwtSecret}
AES_SECRET_KEY=${aesKey}
PORT=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

    const envPath = path.join(process.cwd(), '.env.production');
    fs.writeFileSync(envPath, envContent);
    console.log('Production environment file generated with secure keys.');
    console.log('Please update the MONGODB_URI with your production database connection string.');
};

generateProductionEnv();