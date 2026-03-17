import Url from '../models/Url.js';
import Click from '../models/Click.js';
import redisClient from '../redis.js';
import { encode } from '../utils/base62.js';
import { CustomError } from '../middlewares/errorHandler.js';
import { isValidOriginalUrl, isValidCustomAlias } from '../utils/validator.js';

const REDIS_COUNTER_KEY = 'url_shortener_counter';

export const createShortUrl = async (originalUrl, customAlias, userId = null) => {
  if (!isValidOriginalUrl(originalUrl)) {
    throw new CustomError('Invalid URL format or restricted domain', 400);
  }

  if (customAlias) {
    if (!isValidCustomAlias(customAlias)) {
      throw new CustomError('Invalid custom alias', 400);
    }
    const existing = await Url.findOne({ customAlias });
    if (existing) {
      throw new CustomError('Custom alias already in use', 400);
    }
  }

  let shortCode = customAlias;

  if (!shortCode) {
    // Auto-increment counter from Redis to generate base62 string
    let counter;
    try {
      counter = await redisClient.incr(REDIS_COUNTER_KEY);
      // Give it an offset to make URLs look slightly longer initially
      counter += 10000;
    } catch (error) {
      console.error('Redis INCR failed, falling back to db random logic', error);
      counter = Math.floor(Math.random() * 1000000) + 10000;
    }
    
    shortCode = encode(counter);

    // Collision check (rare, but possible if counter manually reset)
    let isCollision = await Url.findOne({ shortCode });
    while (isCollision) {
      counter++;
      shortCode = encode(counter);
      isCollision = await Url.findOne({ shortCode });
    }
  }

  // Create document in Mongo
  const newUrl = await Url.create({
    originalUrl,
    shortCode,
    customAlias: customAlias || undefined,
    userId
  });

  return newUrl;
};

export const processRedirect = async (shortCode, reqInfo) => {
  const cacheKey = `url:${shortCode}`;

  try {
    // 1. Check Redis
    const cachedUrl = await redisClient.get(cacheKey);

    if (cachedUrl) {
      // Async Analytics Logging - Do not block
      logClickAsync(shortCode, reqInfo);
      return cachedUrl;
    }

    // 2. Check Database
    const urlDoc = await Url.findOne({ shortCode });
    if (!urlDoc) {
      throw new CustomError('URL not found', 404);
    }
    
    // Check Expiration
    if (urlDoc.expiresAt && urlDoc.expiresAt < new Date()) {
      throw new CustomError('This URL has expired', 410); // 410 Gone
    }

    // Sync click count up by 1 (background)
    Url.updateOne({ shortCode }, { $inc: { clickCount: 1 } }).exec();

    // Store in cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, urlDoc.originalUrl);

    // Async Analytics Logging 
    logClickAsync(shortCode, reqInfo);

    return urlDoc.originalUrl;
  } catch (err) {
    throw err;
  }
};

export const getUrlAnalytics = async (shortCode) => {
  // Try Cache First
  const cacheKey = `stats:${shortCode}`;
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) return JSON.parse(cachedData);

  const urlDoc = await Url.findOne({ shortCode });
  if (!urlDoc) {
    throw new CustomError('URL not found', 404);
  }

  // Aggregate Click Data
  const clicks = await Click.find({ shortCode }).sort({ timestamp: -1 }).limit(100);

  const stats = {
    originalUrl: urlDoc.originalUrl,
    shortCode: urlDoc.shortCode,
    totalClicks: urlDoc.clickCount,
    createdAt: urlDoc.createdAt,
    expiresAt: urlDoc.expiresAt,
    recentClicks: clicks
  };

  await redisClient.setEx(cacheKey, 60, JSON.stringify(stats)); // short 60s cache
  return stats;
};

export const deleteShortUrl = async (shortCode) => {
  const urlDoc = await Url.findOneAndDelete({ shortCode });
  if (!urlDoc) {
    throw new CustomError('URL not found', 404);
  }

  // Clean up Redis and Analytics
  await redisClient.del(`url:${shortCode}`);
  await redisClient.del(`stats:${shortCode}`);
  Click.deleteMany({ shortCode }).exec();
  
  return true;
};

export const updateShortUrl = async (shortCode, updates) => {
  const allowedUpdates = ['expiresAt', 'customAlias'];
  const updatePayload = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updatePayload[key] = updates[key];
    }
  }

  if (updates.customAlias) {
    if (!isValidCustomAlias(updates.customAlias)) {
      throw new CustomError('Invalid custom alias', 400);
    }
    const existing = await Url.findOne({ customAlias: updates.customAlias });
    if (existing && existing.shortCode !== shortCode) {
      throw new CustomError('Custom alias already in use', 400);
    }
  }

  const updatedDoc = await Url.findOneAndUpdate(
    { shortCode },
    { $set: updatePayload },
    { new: true }
  );

  if (!updatedDoc) {
    throw new CustomError('URL not found', 404);
  }

  // Cache invalidation
  await redisClient.del(`url:${shortCode}`);
  await redisClient.del(`url:${updatedDoc.customAlias}`);
  await redisClient.del(`stats:${shortCode}`);

  return updatedDoc;
};

// Helper: Fire-and-forget logging function
const logClickAsync = (shortCode, { ip, userAgent, referer }) => {
  setImmediate(async () => {
    try {
      await Click.create({
        shortCode,
        ip,
        userAgent,
        referer,
        timestamp: new Date()
      });
      console.log(`[Analytics] Click logged for ${shortCode}`);
    } catch (err) {
      console.error(`[Analytics] Failed to log click for ${shortCode}`, err);
    }
  });
};
