import { Redis } from '@upstash/redis';
import { ENV } from '../lib/env.js';

class RedisClient {
  constructor() {
    this.client = new Redis({
      url: ENV.UPSTASH_REDIS_REST_URL,
      token: ENV.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // Store OTP with expiration (5 minutes)
  async storeOTP(email, otp) {
    const key = `otp:${email}`;
    // Store as string to ensure consistency
    await this.client.setex(key, 300, String(otp)); // 5 minutes expiry
  }

  // Get OTP
  async getOTP(email) {
    const key = `otp:${email}`;
    const otp = await this.client.get(key);
    // Ensure it's returned as a string
    return otp ? String(otp) : null;
  }

  // Delete OTP
  async deleteOTP(email) {
    const key = `otp:${email}`;
    await this.client.del(key);
  }

  // Store temporary signup data
  async storeSignupData(email, data) {
    const key = `signup:${email}`;
    console.log('Storing signup data for:', email);
    console.log('Data to store:', data);
    
    // Upstash Redis automatically handles JSON serialization
    // Store the object directly, or as JSON string
    try {
      // Store each field separately to avoid serialization issues
      await this.client.hset(key, {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      await this.client.expire(key, 600); // 10 minutes expiry
    } catch (error) {
      console.error('Error storing signup data:', error);
      throw error;
    }
  }

  // Get signup data
  async getSignupData(email) {
    const key = `signup:${email}`;
    console.log('Retrieving signup data for:', email);
    
    try {
      // Get all fields from hash
      const data = await this.client.hgetall(key);
      console.log('Retrieved data:', data);
      console.log('Data type:', typeof data);
      
      if (!data || Object.keys(data).length === 0) {
        console.log('No signup data found');
        return null;
      }
      
      return {
        name: data.name,
        email: data.email,
        password: data.password,
      };
    } catch (error) {
      console.error('Error retrieving signup data:', error);
      return null;
    }
  }

  // Delete signup data
  async deleteSignupData(email) {
    const key = `signup:${email}`;
    await this.client.del(key);
  }

  // Store user in cache
  async cacheUser(userId, userData) {
    const key = `user:${userId}`;
    try {
      // Store as JSON string
      const jsonData = JSON.stringify(userData);
      await this.client.setex(key, 3600, jsonData); // 1 hour
    } catch (error) {
      console.error('Error caching user:', error);
    }
  }

  // Get cached user
  async getCachedUser(userId) {
    const key = `user:${userId}`;
    try {
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }
      
      // If it's already an object (Upstash auto-deserialized), return it
      if (typeof data === 'object' && data !== null) {
        return data;
      }
      
      // If it's a string, parse it
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached user:', error);
      return null;
    }
  }

  // Delete cached user
  async deleteCachedUser(userId) {
    const key = `user:${userId}`;
    await this.client.del(key);
  }

  // Blacklist refresh token
  async blacklistToken(token, expiryInSeconds) {
    const key = `blacklist:${token}`;
    await this.client.setex(key, expiryInSeconds, 'true');
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    const key = `blacklist:${token}`;
    const result = await this.client.get(key);
    return result === 'true';
  }

  // Store rate limit data
  async incrementRateLimit(identifier, windowInSeconds) {
    const key = `ratelimit:${identifier}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, windowInSeconds);
    }
    
    return current;
  }
}

export const redisClient = new RedisClient();