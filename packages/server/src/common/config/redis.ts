import { registerAs } from '@nestjs/config';

function parseRedisUrl(url: string) {
  try {
    // Handle Railway private URLs that might not have protocol
    let urlToParse = url;
    if (!urlToParse.startsWith('redis://') && !urlToParse.startsWith('rediss://')) {
      urlToParse = `redis://${urlToParse}`;
    }
    
    const parsed = new URL(urlToParse);
    const host = parsed.hostname;
    const port = parseInt(parsed.port, 10) || 6379;
    const password = parsed.password || undefined;
    const db = parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) || 0 : 0;
    
    return {
      host,
      port,
      password,
      db,
    };
  } catch (error) {
    console.error('Error parsing REDIS_URL:', error);
    console.error('REDIS_URL value:', url?.replace(/:[^:@]+@/, ':****@')); // Mask password
    return null;
  }
}

export default registerAs('redis', () => {
  // Support REDIS_URL (Railway format: redis://:password@host:port)
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required');
  }

  const parsed = parseRedisUrl(process.env.REDIS_URL);
  if (!parsed) {
    throw new Error('Invalid REDIS_URL format. Expected: redis://:password@host:port');
  }

  // Log Redis configuration (without password) for debugging
  console.log('Redis configuration:', {
    host: parsed.host,
    port: parsed.port,
    db: parsed.db,
    hasPassword: !!parsed.password,
    redisUrl: process.env.REDIS_URL?.replace(/:[^:@]+@/, ':****@'), // Mask password in URL
  });

  return parsed;
});
