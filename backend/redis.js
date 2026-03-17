import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Connect asynchronously (we will call this from index.js)
export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis', err);
    }
};

export default redisClient;
