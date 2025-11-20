import crypto from 'crypto';
import { ENV } from './env.js';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = ENV.PINECONE_SECRET_KEY || 'default-secret-key-change-this-in-production';

// Ensure key is 32 bytes for AES-256
const getKey = () => {
    return crypto.createHash('sha256').update(SECRET_KEY).digest();
};

export const encryptApiKey = (apiKey) => {
    if (!apiKey) return null;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted;
};

export const decryptApiKey = (encryptedData) => {
    if (!encryptedData) return null;

    const parts = encryptedData.split(':');
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
